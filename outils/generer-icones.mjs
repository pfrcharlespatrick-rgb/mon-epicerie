/**
 * Génère les icônes PNG de l'application à partir d'une description
 * géométrique — aucune dépendance, ni bibliothèque d'images.
 *
 *   node outils/generer-icones.mjs
 *
 * Le rendu se fait par sur-échantillonnage (4×4 points par pixel), ce qui
 * suffit largement pour un panier stylisé.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = resolve(RACINE, 'assets/icones');

const VERT = [5, 150, 105];      // --accent
const VERT_SOMBRE = [4, 120, 87];
const BLANC = [255, 255, 255];

// --- Encodage PNG ----------------------------------------------------------

const TABLE_CRC = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(octets) {
  let c = 0xffffffff;
  for (const octet of octets) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, donnees) {
  const nom = Buffer.from(type, 'ascii');
  const corps = Buffer.concat([nom, donnees]);
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const controle = Buffer.alloc(4);
  controle.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, controle]);
}

/** Assemble un PNG RGBA à partir d'un tableau de pixels. */
function encoderPng(largeur, hauteur, pixels) {
  const entete = Buffer.alloc(13);
  entete.writeUInt32BE(largeur, 0);
  entete.writeUInt32BE(hauteur, 4);
  entete[8] = 8;   // 8 bits par canal
  entete[9] = 6;   // RGBA
  entete[10] = 0;  // compression standard
  entete[11] = 0;  // filtrage standard
  entete[12] = 0;  // non entrelacé

  // Chaque ligne est précédée de son octet de filtre (0 = aucun).
  const brut = Buffer.alloc(hauteur * (largeur * 4 + 1));
  for (let y = 0; y < hauteur; y++) {
    const depart = y * (largeur * 4 + 1);
    brut[depart] = 0;
    pixels.copy(brut, depart + 1, y * largeur * 4, (y + 1) * largeur * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', entete),
    chunk('IDAT', deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Dessin ----------------------------------------------------------------

/**
 * Décrit l'icône en coordonnées relatives (0 à 1). Retourne la couleur du
 * point, ou `null` pour transparent.
 */
function couleurAu(x, y, { pleineSurface }) {
  // Fond : carré arrondi, ou disque plein pour la version « maskable ».
  const rayon = 0.2;
  const dansFond = pleineSurface
    ? true
    : (() => {
        const dx = Math.max(rayon - x, 0, x - (1 - rayon));
        const dy = Math.max(rayon - y, 0, y - (1 - rayon));
        return dx * dx + dy * dy <= rayon * rayon;
      })();

  if (!dansFond) return null;

  // Le motif est resserré sur les versions maskable : les bords sont rognés.
  const echelle = pleineSurface ? 0.72 : 1;
  const px = 0.5 + (x - 0.5) / echelle;
  const py = 0.5 + (y - 0.5) / echelle;

  const fond = py > 0.5 ? VERT_SOMBRE : VERT;

  // Anse : demi-anneau au-dessus du panier.
  const acx = 0.5;
  const acy = 0.5;
  const dr = Math.hypot(px - acx, py - acy);
  if (py < acy && dr > 0.185 && dr < 0.245) return BLANC;

  // Corps : trapèze qui se resserre vers le bas.
  const hautCorps = 0.5;
  const basCorps = 0.8;
  if (py >= hautCorps && py <= basCorps) {
    const avancement = (py - hautCorps) / (basCorps - hautCorps);
    const demiLargeur = 0.34 - 0.1 * avancement;
    if (Math.abs(px - 0.5) <= demiLargeur) {
      // Fentes verticales : trois traits de fond dans le corps blanc.
      if (py > hautCorps + 0.055 && py < basCorps - 0.03) {
        for (const decalage of [-0.16, 0, 0.16]) {
          const centreFente = 0.5 + decalage * (1 - 0.25 * avancement);
          if (Math.abs(px - centreFente) < 0.022) return fond;
        }
      }
      return BLANC;
    }
  }

  return fond;
}

function dessiner(taille, options) {
  const pixels = Buffer.alloc(taille * taille * 4);
  const ECHANTILLONS = 4;

  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      let r = 0;
      let v = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < ECHANTILLONS; sy++) {
        for (let sx = 0; sx < ECHANTILLONS; sx++) {
          const px = (x + (sx + 0.5) / ECHANTILLONS) / taille;
          const py = (y + (sy + 0.5) / ECHANTILLONS) / taille;
          const couleur = couleurAu(px, py, options);
          if (!couleur) continue;
          r += couleur[0];
          v += couleur[1];
          b += couleur[2];
          a += 255;
        }
      }

      const total = ECHANTILLONS * ECHANTILLONS;
      const opacite = a / total;
      const index = (y * taille + x) * 4;

      // Couleurs pré-multipliées à la moyenne des échantillons couverts.
      const couverts = a / 255 || 1;
      pixels[index] = Math.round(r / couverts);
      pixels[index + 1] = Math.round(v / couverts);
      pixels[index + 2] = Math.round(b / couverts);
      pixels[index + 3] = Math.round(opacite);
    }
  }

  return encoderPng(taille, taille, pixels);
}

// --- Sortie ----------------------------------------------------------------

mkdirSync(DOSSIER, { recursive: true });

const fichiers = [
  ['icone-180.png', 180, { pleineSurface: false }],
  ['icone-192.png', 192, { pleineSurface: false }],
  ['icone-512.png', 512, { pleineSurface: false }],
  ['icone-maskable-512.png', 512, { pleineSurface: true }],
];

for (const [nom, taille, options] of fichiers) {
  writeFileSync(resolve(DOSSIER, nom), dessiner(taille, options));
  console.log(`écrit  ${nom}  (${taille}×${taille})`);
}

// Favicon vectoriel : même géométrie, décrite en SVG.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#059669"/>
  <path d="M50 28a21.5 21.5 0 0 0-21.5 21.5h6A15.5 15.5 0 0 1 50 34a15.5 15.5 0 0 1 15.5 15.5h6A21.5 21.5 0 0 0 50 28Z" fill="#fff"/>
  <path d="M16 50h68l-6 30H22Z" fill="#fff"/>
  <path d="M33.5 56h4l1.5 18h-4Zm14.5 0h4v18h-4Zm14.5 0h4L65 74h-4Z" fill="#059669"/>
</svg>
`;

writeFileSync(resolve(DOSSIER, 'favicon.svg'), favicon);
console.log('écrit  favicon.svg');
