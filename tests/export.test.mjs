/**
 * Exportation : le récapitulatif texte et la lecture d'un fichier de
 * sauvegarde. C'est par là que la liste sort de l'appareil — et par là qu'un
 * fichier étranger tente d'y entrer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { RACINE } from './aide/cuisine.mjs';
import { installerStockage } from './aide/stockage.mjs';

const boite = installerStockage();

const E = await import(path.join(RACINE, 'assets/js/etat.js'));
const X = await import(path.join(RACINE, 'assets/js/export.js'));

function neuf() {
  boite.vider();
  Object.assign(E.etat, {
    supprimes: new Set(), rayonsPerso: [], magasinsPerso: [],
    vue: 'preparee', groupement: 'rayon', theme: 'auto',
    rayonActif: 'tous', magasinActif: 'tous', recherche: '',
  });
  E.charger();
}

/** Le corps du récapitulatif, sans l'en-tête daté. */
function corps() {
  return X.texteRecapitulatif().split('\n').slice(2).join('\n').trim();
}

// --- Le récapitulatif -------------------------------------------------------

test('une liste vide ne produit pas de récapitulatif', () => {
  neuf();
  assert.equal(X.texteRecapitulatif(), null);
});

test('l’en-tête annonce ce qui reste à acheter sur le total', () => {
  neuf();
  E.modifier('tomates', { qte: '3' });
  E.modifier('avocats', { qte: '2', coche: true });

  const lignes = X.texteRecapitulatif().split('\n');
  assert.match(lignes[0], /^MON ÉPICERIE — /);
  assert.equal(lignes[1], '1 article(s) à acheter sur 2');
});

test('le récapitulatif marque les cochés et joint quantité et magasin', () => {
  neuf();
  E.modifier('tomates', { qte: '3', magasin: 'Maxi' });
  E.modifier('avocats', { qte: '2', coche: true });

  const texte = corps();
  assert.match(texte, /\[ \] Tomates \(3, Maxi\)/);
  assert.match(texte, /\[x\] Avocats \(2\)/);
});

test('groupé par magasin, l’enseigne ne se répète pas sur chaque ligne', () => {
  neuf();
  E.definirPreference('groupement', 'magasin');
  E.modifier('tomates', { qte: '3', magasin: 'Maxi' });

  const texte = corps();
  assert.match(texte, /— MAXI —/);
  assert.match(texte, /\[ \] Tomates \(3\)$/m, 'le magasin est déjà le titre du groupe');
});

test('groupé par magasin, ce qui n’a pas d’enseigne va sous « Magasin à déterminer »', () => {
  neuf();
  E.definirPreference('groupement', 'magasin');
  E.modifier('tomates', { qte: '3' });
  assert.match(corps(), /— MAGASIN À DÉTERMINER —\n\s+\[ \] Tomates/);
});

test('deux rayons ne peuvent pas se confondre sous un même intitulé', () => {
  // Le regroupement se fait par nom de rayon : deux rayons homonymes verseraient
  // leurs articles dans le même paragraphe.
  neuf();
  E.remplacerArticles({
    articles: [{ id: 'truite', nom: 'Truite', qte: '2', rayon: 'perso-x' }],
    rayonsPerso: [{ id: 'perso-x', nom: 'Fruits & Légumes', emoji: '🎣' }],
  });
  const noms = E.rayons().map((r) => r.nom.toLowerCase());
  assert.equal(new Set(noms).size, noms.length);
});

test('les articles d’un rayon personnalisé paraissent sous son nom', () => {
  neuf();
  const { rayon } = E.ajouterRayon({ nom: 'Pêche', emoji: '🎣' });
  E.ajouter({ nom: 'Truite', qte: '2', rayon: rayon.id });
  assert.match(corps(), /— PÊCHE —\n\s+\[ \] Truite \(2\)/);
});

// --- La lecture d'un fichier ------------------------------------------------

const fichier = (contenu) => new Blob([typeof contenu === 'string' ? contenu : JSON.stringify(contenu)]);

test('un fichier de sauvegarde complet est accepté', async () => {
  const lu = await X.lireSauvegarde(fichier({ application: 'mon-epicerie', articles: [{ id: 'a', nom: 'Lait' }] }));
  assert.equal(lu.articles.length, 1);
});

test('l’ancien format (simple tableau) est accepté', async () => {
  const lu = await X.lireSauvegarde(fichier([{ id: 'a', nom: 'Lait' }]));
  assert.equal(lu.articles.length, 1);
});

test('un fichier qui n’est pas du JSON est refusé, en français', async () => {
  await assert.rejects(() => X.lireSauvegarde(fichier('ceci n’est pas du JSON')), /JSON valide/);
});

test('un JSON valide mais sans article est refusé', async () => {
  await assert.rejects(() => X.lireSauvegarde(fichier({ articles: [] })), /Aucun article/);
  await assert.rejects(() => X.lireSauvegarde(fichier({ bonjour: true })), /Aucun article/);
  await assert.rejects(() => X.lireSauvegarde(fichier('null')), /Aucun article/);
});

test('un fichier démesuré est refusé avant même d’être lu', async () => {
  const enorme = { size: 6 * 1024 * 1024, text: () => assert.fail('le fichier n’aurait pas dû être lu') };
  await assert.rejects(() => X.lireSauvegarde(enorme), /trop volumineux/);
});

test('ce que la sauvegarde écrit, le chargement le relit', async () => {
  neuf();
  E.ajouterRayon({ nom: 'Pêche', emoji: '🎣' });
  E.ajouter({ nom: 'Truite', qte: '2', rayon: E.etat.rayonsPerso[0].id });
  E.modifier('tomates', { qte: '3' });

  // Le contenu du fichier téléchargé, tel que `telechargerSauvegarde` le forme.
  const contenu = JSON.stringify({ application: 'mon-epicerie', exporte: new Date().toISOString(), ...E.instantane() });
  const lu = await X.lireSauvegarde(fichier(contenu));

  neuf();
  const n = E.remplacerArticles(lu);

  assert.ok(n >= 2);
  assert.equal(E.etat.rayonsPerso[0].nom, 'Pêche');
  const truite = E.etat.articles.find((a) => a.nom === 'Truite');
  assert.equal(truite.rayon, E.etat.rayonsPerso[0].id, 'l’article retrouve son rayon personnalisé');
  assert.equal(E.trouver('tomates').qte, '3');
});
