/**
 * Le catalogue livré et, surtout, la fabrique d'identifiants.
 *
 * L'identifiant d'un article est le fil qui relie la liste d'un utilisateur au
 * catalogue d'une version à l'autre. S'il change, l'article sauvegardé se
 * détache de son produit ; s'il entre en collision avec un autre, un produit
 * disparaît chez tout le monde. C'est le contrat le plus fragile du dépôt, et
 * celui qui se vérifie le plus facilement.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { RACINE } from './aide/cuisine.mjs';

const { normaliser, identifiant, articlesDuCatalogue, RAYONS, DETAILLANTS, RAYON_DEFAUT } =
  await import(path.join(RACINE, 'assets/js/catalogue.js'));

test('normaliser() efface accents, casse et espaces de garde', () => {
  assert.equal(normaliser('  Épinards  '), 'epinards');
  assert.equal(normaliser('CRÈME'), 'creme');
  assert.equal(normaliser('Ça va'), 'ca va');
  // La recherche s'appuie dessus : « epinard » doit trouver « Épinards ».
  assert.ok(normaliser('Épinards').includes(normaliser('epinard')));
});

test('normaliser() encaisse null, undefined et les nombres', () => {
  assert.equal(normaliser(null), '');
  assert.equal(normaliser(undefined), '');
  assert.equal(normaliser(0), '0');
});

test('identifiant() est stable, minuscule et sans ponctuation', () => {
  assert.equal(identifiant('Piment vert'), 'piment-vert');
  assert.equal(identifiant('  Piment   vert  '), 'piment-vert');
  assert.equal(identifiant('PIMENT VERT'), 'piment-vert');
  assert.equal(identifiant('Crème 35 %'), 'creme-35');
});

test('identifiant() ne rend jamais une chaîne vide', () => {
  for (const nom of ['', '   ', '🥕', '---', '%%%', null]) {
    assert.equal(identifiant(nom), 'article', `« ${nom} » devrait retomber sur « article »`);
  }
});

test('les identifiants du catalogue livré sont tous distincts', () => {
  const articles = articlesDuCatalogue();
  const vus = new Map();
  const collisions = [];

  for (const article of articles) {
    if (vus.has(article.id)) collisions.push(`${article.id} : « ${vus.get(article.id)} » et « ${article.nom} »`);
    vus.set(article.id, article.nom);
  }

  assert.deepEqual(collisions, [], 'deux articles partagent un identifiant : l’un sera invisible');
  assert.equal(vus.size, articles.length);
});

test('le suffixe de dédoublonnage ne peut pas usurper l’identifiant d’un autre produit', () => {
  // Le compteur de doublons ajoute « -2 », « -3 »… dans le même espace de noms
  // que les vrais produits : « Lait 2 % » donne déjà « lait-2 ». Si un produit
  // nommé « Lait » venait à exister en double, son second exemplaire
  // réclamerait « lait-2 » — déjà pris. On vérifie qu'aucun identifiant produit
  // par le dédoublonnage ne coïncide avec celui d'un nom du catalogue.
  const articles = articlesDuCatalogue();
  const parNom = new Map();
  for (const article of articles) {
    const base = identifiant(article.nom);
    parNom.set(base, (parNom.get(base) ?? 0) + 1);
  }

  const suspects = articles
    .filter((a) => a.id !== identifiant(a.nom))   // identifiant issu d'un suffixe
    .filter((a) => parNom.has(a.id));             // …qui est aussi le nom d'un autre

  assert.deepEqual(suspects.map((a) => `${a.nom} → ${a.id}`), []);
});

test('les identifiants livrés ne bougent pas d’une version à l’autre', () => {
  // Un identifiant qui change détache l'article de la liste des utilisateurs
  // qui l'avaient déjà. Ce fichier de référence est là pour rendre ce genre de
  // changement visible ; ne le régénérer qu'en connaissance de cause.
  const chemin = path.join(RACINE, 'tests/references/identifiants-catalogue.txt');
  const attendus = fs.readFileSync(chemin, 'utf8').trim().split('\n');
  const obtenus = articlesDuCatalogue().map((a) => `${a.id}\t${a.nom}`);

  const disparus = attendus.filter((l) => !obtenus.includes(l));
  const nouveaux = obtenus.filter((l) => !attendus.includes(l));

  assert.deepEqual(disparus, [], 'des identifiants ont changé ou disparu — la liste des utilisateurs s’en détacherait');
  // Les ajouts sont légitimes : on les signale sans faire échouer.
  if (nouveaux.length) console.log(`  ${nouveaux.length} nouveau(x) produit(s) au catalogue`);
});

test('chaque article du catalogue naît propre et non préparé', () => {
  for (const article of articlesDuCatalogue()) {
    assert.equal(article.qte, '');
    assert.equal(article.magasin, '');
    assert.equal(article.coche, false);
    assert.equal(article.catalogue, true);
    assert.ok(article.nom.trim(), 'un article sans nom');
    assert.ok(RAYONS.some((r) => r.id === article.rayon), `rayon inconnu : ${article.rayon}`);
  }
});

test('les rayons et détaillants livrés sont cohérents', () => {
  const ids = RAYONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'deux rayons partagent un identifiant');

  const noms = RAYONS.map((r) => normaliser(r.nom));
  assert.equal(new Set(noms).size, noms.length, 'deux rayons portent le même nom');
  assert.ok(ids.includes(RAYON_DEFAUT), 'le rayon de repli doit exister');

  for (const rayon of RAYONS) assert.ok(rayon.emoji, `${rayon.id} sans emoji`);

  const enseignes = DETAILLANTS.map((d) => normaliser(d.nom));
  assert.equal(new Set(enseignes).size, enseignes.length, 'deux enseignes portent le même nom');
  for (const d of DETAILLANTS) {
    assert.ok(Number.isFinite(d.teinte) && d.teinte >= 0 && d.teinte < 360, `teinte hors bornes : ${d.nom}`);
  }
});
