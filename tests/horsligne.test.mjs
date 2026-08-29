/**
 * Le filet hors ligne.
 *
 * La liste des fichiers mis en cache s'entretient à la main, alors que la page
 * ne charge qu'un module — les autres arrivent par leurs imports. Rien ne
 * signale l'oubli : l'application marche parfaitement… tant qu'il y a du
 * réseau. On compare donc ce que les pages réclament à ce que le service
 * worker garde.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { RACINE } from './aide/cuisine.mjs';

const SCOPE = 'https://exemple.test/';

/** Rejoue un service worker pour en tirer sa coquille et sa version. */
function lireServiceWorker(chemin) {
  const contexte = vm.createContext({
    URL,
    self: { registration: { scope: SCOPE }, addEventListener() {}, skipWaiting() {}, clients: { claim() {} } },
    caches: { open: async () => ({}), keys: async () => [] },
    fetch: async () => ({}),
    console,
  });
  vm.runInContext(fs.readFileSync(path.join(RACINE, chemin), 'utf8'), contexte, { filename: chemin });
  const { VERSION, CACHE, COQUILLE } = vm.runInContext('({ VERSION, CACHE, COQUILLE })', contexte);
  return { VERSION, CACHE, coquille: new Set([...COQUILLE].map((href) => href.replace(SCOPE, ''))) };
}

/** Les fichiers locaux que réclame une page : scripts, styles, icônes. */
function ressourcesDe(page) {
  const html = fs.readFileSync(path.join(RACINE, page), 'utf8');
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((v) => !v.startsWith('#') && !v.startsWith('http') && !v.endsWith('/'));
}

/** Suit les imports d'un module ESM et rend tous les fichiers atteints. */
function grapheDeModules(entree) {
  const vus = new Set();
  const aVoir = [entree];
  while (aVoir.length) {
    const fichier = aVoir.pop();
    if (vus.has(fichier)) continue;
    vus.add(fichier);
    const code = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
    for (const m of code.matchAll(/from\s+'(\.[^']+)'/g)) {
      aVoir.push(path.posix.normalize(path.posix.join(path.posix.dirname(fichier), m[1])));
    }
  }
  return vus;
}

const APPLICATIONS = [
  { nom: 'Mon Épicerie', sw: 'sw.js', page: 'index.html', base: '', entree: 'assets/js/app.js' },
  { nom: 'Ma Cuisine', sw: 'cuisine/sw.js', page: 'cuisine/index.html', base: 'cuisine/', entree: null },
];

for (const app of APPLICATIONS) {
  test(`${app.nom} : la coquille garde tout ce que la page réclame`, () => {
    const { coquille } = lireServiceWorker(app.sw);
    const manquants = ressourcesDe(app.page).filter((r) => !coquille.has(r));
    assert.deepEqual(manquants, [], `${app.sw} ne met pas en cache : ${manquants.join(', ')}`);
  });

  test(`${app.nom} : la coquille ne promet aucun fichier absent du dépôt`, () => {
    const { coquille } = lireServiceWorker(app.sw);
    for (const chemin of coquille) {
      if (chemin === '') continue;   // la racine du scope
      assert.ok(fs.existsSync(path.join(RACINE, app.base + chemin)), `${app.sw} met en cache un fichier inexistant : ${chemin}`);
    }
  });

  test(`${app.nom} : la version du cache est nommée et distincte`, () => {
    const { VERSION, CACHE } = lireServiceWorker(app.sw);
    assert.match(VERSION, /^v\d+$/, `version inattendue : ${VERSION}`);
    assert.ok(CACHE.endsWith(VERSION), 'le nom du cache doit porter la version');
  });
}

test('Mon Épicerie : tous les modules atteints par les imports sont en cache', () => {
  // La page ne charge que `app.js` ; les autres modules arrivent par ses
  // imports, et se font donc oublier facilement dans la coquille.
  const { coquille } = lireServiceWorker('sw.js');
  const manquants = [...grapheDeModules('assets/js/app.js')].filter((f) => !coquille.has(f));
  assert.deepEqual(manquants, [], `modules absents du cache : ${manquants.join(', ')}`);
});

test('les deux applications ne se disputent pas le même cache', () => {
  const epicerie = lireServiceWorker('sw.js');
  const cuisine = lireServiceWorker('cuisine/sw.js');
  assert.notEqual(epicerie.CACHE, cuisine.CACHE, 'deux caches homonymes se videraient l’un l’autre');
});

test('le manifeste de chaque application désigne des icônes qui existent', () => {
  for (const app of APPLICATIONS) {
    const manifeste = JSON.parse(fs.readFileSync(path.join(RACINE, app.base + 'manifest.webmanifest'), 'utf8'));
    for (const icone of manifeste.icons ?? []) {
      assert.ok(fs.existsSync(path.join(RACINE, app.base + icone.src)), `${app.nom} : icône introuvable ${icone.src}`);
    }
  }
});
