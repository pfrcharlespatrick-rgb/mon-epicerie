/**
 * L'exportateur Word : un ZIP et son CRC, écrits à la main.
 *
 * C'est le seul endroit du dépôt qui produit des octets plutôt que du texte.
 * Une erreur d'un seul bit y donne un fichier qui s'ouvre chez soi et se
 * refuse chez le destinataire — le genre de défaut qu'on découvre trop tard,
 * et qui ne se surveille que par les octets eux-mêmes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { charger } from './aide/cuisine.mjs';

const { Exporteur } = charger(['cuisine/assets/js/exporteur.js'], ['Exporteur']);
const { crc32, zip, versTexte, versDocumentXml, versDocx, nomDeFichier } = Exporteur.interne;

const octets = (texte) => new TextEncoder().encode(texte);

// --- Le CRC -----------------------------------------------------------------

test('crc32() donne les valeurs de référence', () => {
  // Vecteurs classiques, vérifiables partout.
  assert.equal(crc32(octets('')), 0);
  assert.equal(crc32(octets('a')), 0xe8b7be43);
  assert.equal(crc32(octets('123456789')), 0xcbf43926);
  assert.equal(crc32(octets('The quick brown fox jumps over the lazy dog')), 0x414fa339);
});

test('crc32() s’accorde avec celui de Node, accents compris', () => {
  for (const texte of ['', 'Côte de bœuf', 'Recette — 1,8 kg', 'a'.repeat(5000), '🥩🔥']) {
    const attendu = zlib.crc32 ? zlib.crc32(texte) : null;
    if (attendu === null) return;   // Node < 20.15
    assert.equal(crc32(octets(texte)), attendu >>> 0, `« ${texte.slice(0, 20)} »`);
  }
});

// --- L'archive --------------------------------------------------------------

/** Relit un ZIP « stored » comme le ferait Word : par son annuaire central. */
async function relire(blob) {
  const vue = new DataView(await blob.arrayBuffer());
  const u8 = new Uint8Array(vue.buffer);

  // Fin d'annuaire central : les 22 derniers octets (aucun commentaire ici).
  const fin = vue.byteLength - 22;
  assert.equal(vue.getUint32(fin, true), 0x06054b50, 'signature de fin d’annuaire absente');
  const nombre = vue.getUint16(fin + 10, true);
  const tailleCentrale = vue.getUint32(fin + 12, true);
  const debutCentrale = vue.getUint32(fin + 16, true);
  assert.equal(debutCentrale + tailleCentrale, fin, 'l’annuaire ne se termine pas où il devrait');

  const decodeur = new TextDecoder();
  const entrees = new Map();
  let curseur = debutCentrale;

  for (let i = 0; i < nombre; i++) {
    assert.equal(vue.getUint32(curseur, true), 0x02014b50, `entrée ${i} : signature d’annuaire absente`);
    const crc = vue.getUint32(curseur + 16, true);
    const taille = vue.getUint32(curseur + 24, true);
    const longueurNom = vue.getUint16(curseur + 28, true);
    const decalage = vue.getUint32(curseur + 42, true);
    const nom = decodeur.decode(u8.subarray(curseur + 46, curseur + 46 + longueurNom));

    // L'en-tête local doit dire la même chose, au même endroit.
    assert.equal(vue.getUint32(decalage, true), 0x04034b50, `${nom} : en-tête local introuvable`);
    assert.equal(vue.getUint32(decalage + 14, true), crc, `${nom} : CRC divergent entre en-tête et annuaire`);
    const longueurNomLocal = vue.getUint16(decalage + 26, true);
    const debutDonnees = decalage + 30 + longueurNomLocal + vue.getUint16(decalage + 28, true);
    const donnees = u8.subarray(debutDonnees, debutDonnees + taille);

    assert.equal(crc32(donnees), crc, `${nom} : le CRC ne correspond pas au contenu`);
    entrees.set(nom, decodeur.decode(donnees));
    curseur += 46 + longueurNom + vue.getUint16(curseur + 30, true) + vue.getUint16(curseur + 32, true);
  }

  return entrees;
}

test('l’archive produite est un ZIP relisible, entrée par entrée', async () => {
  const entrees = await relire(zip({ 'a.txt': 'bonjour', 'dossier/b.xml': '<x>Côte de bœuf</x>' }));
  assert.deepEqual([...entrees.keys()], ['a.txt', 'dossier/b.xml']);
  assert.equal(entrees.get('a.txt'), 'bonjour');
  assert.equal(entrees.get('dossier/b.xml'), '<x>Côte de bœuf</x>');
});

test('une archive vide reste structurellement valide', async () => {
  const entrees = await relire(zip({}));
  assert.equal(entrees.size, 0);
});

test('le .docx contient les trois pièces qu’attend Word', async () => {
  const blocs = [
    { type: 'titre', texte: 'Côte de bœuf — 1,8 kg' },
    { type: 'h4', texte: 'Les étapes' },
    { type: 'etape', texte: '1. Salage à sec — 5 min (La veille)', corps: 'Massez la pièce.' },
  ];
  const entrees = await relire(versDocx(blocs));

  assert.deepEqual([...entrees.keys()].sort(), ['[Content_Types].xml', '_rels/.rels', 'word/document.xml']);
  const doc = entrees.get('word/document.xml');
  assert.match(doc, /^<\?xml version="1\.0"/);
  assert.match(doc, /<w:document xmlns:w=/);
  assert.equal((doc.match(/<w:p>/g) ?? []).length, (doc.match(/<\/w:p>/g) ?? []).length, 'paragraphes déséquilibrés');
  assert.ok(doc.includes('Côte de bœuf — 1,8 kg'));
  assert.ok(doc.includes('Massez la pièce.'));
});

test('le document Word échappe ce qui pourrait le casser', () => {
  const doc = versDocumentXml([{ type: 'p', texte: 'a < b & c > d' }]);
  assert.ok(doc.includes('a &lt; b &amp; c &gt; d'));
  assert.equal(doc.includes('a < b & c > d'), false);
});

test('les blancs de début et de fin des paragraphes sont préservés', () => {
  assert.match(versDocumentXml([{ type: 'p', texte: '  deux blancs' }]), /xml:space="preserve">  deux blancs</);
});

// --- Le texte à partager ----------------------------------------------------

test('le texte partagé se lit comme une recette, sans lignes vides en rafale', () => {
  const texte = versTexte([
    { type: 'titre', texte: 'Côte de bœuf' },
    { type: 'sousTitre', texte: 'Cuisson mi-saignante.' },
    { type: 'h4', texte: 'Les étapes' },
    { type: 'etape', texte: '1. Salage', corps: 'Massez la pièce.' },
    { type: 'etape', texte: '2. Repos', corps: '' },
  ]);

  assert.match(texte, /^CÔTE DE BŒUF$/m, 'le titre passe en capitales');
  assert.match(texte, /— Les étapes —/);
  assert.match(texte, /1\. Salage\nMassez la pièce\./);
  assert.equal(/\n{3,}/.test(texte), false, 'jamais trois sauts de ligne d’affilée');
  assert.match(texte, /Composé avec Ma Cuisine/, 'la signature ferme le texte');
});

// --- Le nom du fichier ------------------------------------------------------

test('nomDeFichier() donne un nom sobre et portable', () => {
  assert.equal(nomDeFichier('Côte de bœuf — 1,8 kg'), 'cote-de-boeuf-1-8-kg.docx');
  assert.equal(nomDeFichier('Bœuf & Œufs'), 'boeuf-oeufs.docx');
  assert.equal(nomDeFichier('Saumon (entier) !'), 'saumon-entier.docx');
});

test('nomDeFichier() ne rend jamais un nom vide, ni démesuré', () => {
  for (const titre of ['', '   ', '🥩🔥', '///']) {
    assert.equal(nomDeFichier(titre), 'recette.docx', `« ${titre} »`);
  }
  const long = nomDeFichier('a'.repeat(300));
  assert.ok(long.length <= 65, long.length + ' caractères');
  assert.match(long, /\.docx$/);
});
