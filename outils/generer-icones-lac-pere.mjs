/**
 * Génère les icônes PNG de l'inventaire du Lac Péré — même mécanique que
 * generer-icones.mjs, motif chalet au toit rouge sur l'eau.
 *
 *   node outils/generer-icones-lac-pere.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = resolve(RACINE, 'lac-pere/assets/icones');

const SAPIN = [15, 118, 110];       // --accent
const SAPIN_SOMBRE = [17, 94, 89];  // --accent-sombre
const TOIT = [220, 38, 38];         // le rouge des toits du domaine
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

/** Triangle isocèle : sommet en (0.5, haut), base à `bas`. */
function dansToit(px, py, haut, bas, demiBase) {
  if (py < haut || py > bas) return false;
  const avancement = (py - haut) / (bas - haut);
  return Math.abs(px - 0.5) <= demiBase * avancement;
}

/**
 * Décrit l'icône en coordonnées relatives (0 à 1) : le chalet au toit rouge,
 * posé sur deux ondes d'eau. Retourne la couleur du point, ou `null`.
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

  // Le fond glisse doucement du sapin clair au sapin sombre, sans ligne de
  // partage visible.
  const melange = Math.min(1, Math.max(0, (py - 0.15) / 0.75));
  const fond = SAPIN.map((canal, i) => Math.round(canal + (SAPIN_SOMBRE[i] - canal) * melange));

  // Les ondes de l'eau, sous le chalet.
  for (const [centre, amplitude, periode, epaisseur] of [[0.80, 0.022, 0.34, 0.026], [0.90, 0.018, 0.28, 0.022]]) {
    const onde = centre + amplitude * Math.sin((px - 0.1) * (2 * Math.PI) / periode);
    if (px > 0.12 && px < 0.88 && Math.abs(py - onde) <= epaisseur / 2) return BLANC;
  }

  // La porte, creusée dans la façade — même couleur que le fond.
  if (dansRectArrondi(px, py, 0.5, 0.07, 0.55, 0.70, 0.015)) return fond;

  // La façade.
  if (dansRectArrondi(px, py, 0.5, 0.20, 0.46, 0.70, 0.02)) return BLANC;

  // Le toit rouge, débordant de part et d'autre.
  if (dansToit(px, py, 0.22, 0.46, 0.30)) return TOIT;

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
  <rect width="100" height="100" rx="20" fill="#0f766e"/>
  <path d="M22 46 50 24l28 22v4H22Z" fill="#dc2626"/>
  <path d="M30 50h40v20H30Z" fill="#fff"/>
  <rect x="43" y="56" width="14" height="14" rx="2" fill="#0f766e"/>
  <path d="M14 80c6 0 6-5 12-5s6 5 12 5 6-5 12-5 6 5 12 5 6-5 12-5 6 5 12 5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
</svg>
`;

writeFileSync(resolve(DOSSIER, 'favicon.svg'), favicon);
console.log('écrit  favicon.svg');
