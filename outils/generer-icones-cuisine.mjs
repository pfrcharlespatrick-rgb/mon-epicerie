/**
 * Génère les icônes PNG de Ma Cuisine à partir d'une description
 * géométrique — même mécanique que generer-icones.mjs, motif cocotte.
 *
 *   node outils/generer-icones-cuisine.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = resolve(RACINE, 'cuisine/assets/icones');

const AMBRE = [180, 83, 9];        // --accent
const AMBRE_SOMBRE = [146, 64, 14];
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
  entete[10] = 0;
  entete[11] = 0;
  entete[12] = 0;

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

/** Rectangle arrondi centré horizontalement sur cx. */
function dansRectArrondi(px, py, cx, demiLargeur, haut, bas, rayon) {
  if (px < cx - demiLargeur || px > cx + demiLargeur || py < haut || py > bas) return false;
  const dx = Math.max(cx - demiLargeur + rayon - px, 0, px - (cx + demiLargeur - rayon));
  const dy = Math.max(haut + rayon - py, 0, py - (bas - rayon));
  return dx * dx + dy * dy <= rayon * rayon;
}

/**
 * Décrit l'icône en coordonnées relatives (0 à 1) : une cocotte — couvercle,
 * pommeau, poignées. Retourne la couleur du point, ou `null` pour transparent.
 */
function couleurAu(x, y, { pleineSurface }) {
  const rayon = 0.2;
  const dansFond = pleineSurface
    ? true
    : (() => {
        const dx = Math.max(rayon - x, 0, x - (1 - rayon));
        const dy = Math.max(rayon - y, 0, y - (1 - rayon));
        return dx * dx + dy * dy <= rayon * rayon;
      })();

  if (!dansFond) return null;

  const echelle = pleineSurface ? 0.72 : 1;
  const px = 0.5 + (x - 0.5) / echelle;
  const py = 0.5 + (y - 0.5) / echelle;

  const fond = py > 0.5 ? AMBRE_SOMBRE : AMBRE;

  // Pommeau du couvercle.
  if (Math.hypot(px - 0.5, py - 0.3) <= 0.055) return BLANC;

  // Couvercle : barre arrondie au-dessus du corps.
  if (dansRectArrondi(px, py, 0.5, 0.27, 0.38, 0.47, 0.04)) return BLANC;

  // Corps : cuve aux coins inférieurs arrondis.
  if (dansRectArrondi(px, py, 0.5, 0.23, 0.5, 0.79, 0.09) && py >= 0.5) return BLANC;

  // Poignées latérales.
  if (dansRectArrondi(px, py, 0.195, 0.06, 0.52, 0.59, 0.03)) return BLANC;
  if (dansRectArrondi(px, py, 0.805, 0.06, 0.52, 0.59, 0.03)) return BLANC;

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
  <rect width="100" height="100" rx="20" fill="#b45309"/>
  <circle cx="50" cy="30" r="5.5" fill="#fff"/>
  <rect x="23" y="38" width="54" height="9" rx="4" fill="#fff"/>
  <path d="M27 50h46v19a10 10 0 0 1-10 10H37a10 10 0 0 1-10-10Z" fill="#fff"/>
  <rect x="13.5" y="52" width="12" height="7" rx="3" fill="#fff"/>
  <rect x="74.5" y="52" width="12" height="7" rx="3" fill="#fff"/>
</svg>
`;

writeFileSync(resolve(DOSSIER, 'favicon.svg'), favicon);
console.log('écrit  favicon.svg');
