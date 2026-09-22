/**
 * Enregistre une capsule en vidéo, sans rien toucher.
 *
 *   node outils/enregistrer-capsule.mjs saisir-sans-coller
 *   node outils/enregistrer-capsule.mjs saisir-sans-coller 1920 1080
 *
 * Il faut Playwright (`npm install playwright` puis `npx playwright install
 * chromium`, une seule fois) et un serveur local qui sert le dossier :
 * `python3 -m http.server 8000`, dans un autre terminal.
 *
 * Le navigateur automatisé n'a pas de voix : la capsule avance au rythme de
 * lecture des sous-titres, et la vidéo produite est muette. On y ajoute la
 * narration ensuite — voir production/LISEZ-MOI.md.
 */

import { rename, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, largeur = '1280', hauteur = '720', base = 'http://localhost:8000'] = process.argv.slice(2);

if (!id) {
  console.error('Usage : node outils/enregistrer-capsule.mjs <identifiant-de-lecon> [largeur] [hauteur] [adresse du serveur]');
  process.exit(1);
}

const { leconParId } = await import(resolve(RACINE, 'assets/js/lecons.js'));
const lecon = leconParId(id);
if (!lecon || lecon.statut !== 'publiee') {
  console.error(`Leçon inconnue ou non publiée : ${id}`);
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright manque : npm install playwright && npx playwright install chromium');
  process.exit(1);
}

const dossier = resolve(RACINE, 'production/videos');
await mkdir(dossier, { recursive: true });

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({
  viewport: { width: Number(largeur), height: Number(hauteur) },
  recordVideo: { dir: dossier, size: { width: Number(largeur), height: Number(hauteur) } },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
const page = await contexte.newPage();

// On ouvre la capsule et on lui demande le plein cadre : la scène remplit la vidéo.
await page.goto(`${base}/brigade.html#capsule/${id}`, { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: `
    .bandeau, .bandeau-demo, .pied, .capsule__entete, .capsule__controles, .capsule__fin { display: none !important; }
    .contenu { padding: 0 !important; max-width: none !important; }
    .capsule { max-width: none !important; }
    .capsule__scene { border-radius: 0 !important; border: none !important; aspect-ratio: auto !important; height: 100vh !important; }
  `,
});

// La capsule avance seule ; on attend qu'elle annonce la fin.
const dureeMax = lecon.etapes.length * 60000;
await page.waitForFunction(() => document.getElementById('capsule-fin') && !document.getElementById('capsule-fin').hidden, null, { timeout: dureeMax });
await page.waitForTimeout(1500);

const video = page.video();
await contexte.close();
const chemin = await video.path();
const destination = resolve(dossier, `${id}.webm`);
await rename(chemin, destination);
await navigateur.close();

console.log(`vidéo écrite : production/videos/${id}.webm`);
