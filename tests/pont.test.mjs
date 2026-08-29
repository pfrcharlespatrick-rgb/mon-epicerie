/**
 * Le pont entre les deux applications.
 *
 * Ma Cuisine écrit directement dans le stockage de Mon Épicerie, sans passer
 * par son code : elle fabrique à la main des articles que l'autre devra
 * accepter au prochain chargement. C'est le seul contrat du dépôt dont les
 * deux extrémités s'ignorent — et donc le seul qui puisse se rompre sans que
 * personne ne compile rien.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { charger, rapatrier, RACINE } from './aide/cuisine.mjs';
import { installerStockage } from './aide/stockage.mjs';

const boite = installerStockage();

const E = await import(path.join(RACINE, 'assets/js/etat.js'));

const { Conseiller } = charger(['cuisine/assets/js/conseiller.js'], ['Conseiller'], {
  localStorage: globalThis.localStorage,
  fetch: async () => { throw new Error('aucun appel réseau attendu ici'); },
});

const CLE = 'mon-epicerie/v1';

function epicerieNeuve() {
  boite.vider();
  Object.assign(E.etat, {
    supprimes: new Set(), rayonsPerso: [], magasinsPerso: [],
    vue: 'preparee', groupement: 'rayon', theme: 'auto',
    rayonActif: 'tous', magasinActif: 'tous', recherche: '',
  });
  E.charger();
}

/** Recharge l'épicerie comme le ferait l'ouverture de l'autre onglet. */
function rechargerEpicerie() {
  Object.assign(E.etat, { supprimes: new Set(), rayonsPerso: [], magasinsPerso: [] });
  E.charger();
}

// --- Ma Cuisine lit la liste de la semaine ---------------------------------

test('le conseiller reçoit ce qui est retenu pour la semaine, et rien d’autre', () => {
  epicerieNeuve();
  E.modifier('tomates', { qte: '3' });
  E.modifier('avocats', { magasin: 'Maxi' });
  E.basculerCoche('brocoli');
  E.sauvegarderMaintenant();

  const liste = rapatrier(Conseiller.listeDeLaSemaine());
  const noms = liste.map((a) => a.nom).sort();

  assert.deepEqual(noms, ['Avocats', 'Brocoli', 'Tomates']);
  assert.equal(liste.find((a) => a.nom === 'Tomates').qte, '3');
  assert.equal(liste.find((a) => a.nom === 'Brocoli').qte, '', 'un article sans quantité passe une chaîne vide');
});

test('sans liste d’épicerie, le conseiller n’a rien à lire et ne s’en émeut pas', () => {
  boite.vider();
  assert.deepEqual(rapatrier(Conseiller.listeDeLaSemaine()), []);
  boite.poserBrut(CLE, 'pas du JSON');
  assert.deepEqual(rapatrier(Conseiller.listeDeLaSemaine()), []);
  boite.poser(CLE, { version: 2, articles: 'pas un tableau' });
  assert.deepEqual(rapatrier(Conseiller.listeDeLaSemaine()), []);
});

// --- Ma Cuisine verse dans la liste ----------------------------------------

test('les manquants versés sont acceptés tels quels par l’épicerie', () => {
  epicerieNeuve();
  E.sauvegarderMaintenant();

  const ajoutes = Conseiller.verserALEpicerie([
    { nom: 'Échalote française', qte: '2' },
    { nom: 'Vin rouge', qte: '' },
  ]);
  assert.equal(ajoutes, 2);

  rechargerEpicerie();

  for (const nom of ['Échalote française', 'Vin rouge']) {
    const article = E.etat.articles.find((a) => a.nom === nom);
    assert.ok(article, `« ${nom} » n’a pas survécu à l’assainissement de l’épicerie`);
    assert.ok(E.rayonParId(article.rayon), `« ${nom} » est rangé dans un rayon inconnu`);
    assert.equal(article.catalogue, false);
  }
  assert.equal(E.etat.articles.find((a) => a.nom === 'Échalote française').qte, '2');
});

test('les articles versés entrent aussitôt dans la liste préparée', () => {
  // Sans quantité, un article n'est « préparé » qu'une fois touché : celui qui
  // vient d'une recette doit tout de même se voir, sinon il est versé pour rien.
  epicerieNeuve();
  E.sauvegarderMaintenant();
  Conseiller.verserALEpicerie([{ nom: 'Vin rouge', qte: '1 bouteille' }]);
  rechargerEpicerie();

  const article = E.etat.articles.find((a) => a.nom === 'Vin rouge');
  assert.equal(E.estPrepare(article), true);
});

test('un ingrédient déjà sur la liste n’est pas versé une seconde fois', () => {
  epicerieNeuve();
  E.modifier('tomates', { qte: '3' });
  E.sauvegarderMaintenant();

  // Accents et casse ne doivent pas suffire à créer un doublon.
  const ajoutes = Conseiller.verserALEpicerie([{ nom: 'TOMATES' }, { nom: 'tomates' }, { nom: 'Basilic' }]);
  assert.equal(ajoutes, 1);

  rechargerEpicerie();
  assert.equal(E.etat.articles.filter((a) => /^tomates$/i.test(a.nom)).length, 1);
  assert.ok(E.etat.articles.some((a) => a.nom === 'Basilic'));
});

test('verser dans une épicerie encore vierge fabrique un état que l’épicerie sait lire', () => {
  boite.vider();   // l'utilisateur n'a jamais ouvert Mon Épicerie
  const ajoutes = Conseiller.verserALEpicerie([{ nom: 'Beurre', qte: '250 g' }]);
  assert.equal(ajoutes, 1);

  rechargerEpicerie();
  const beurre = E.etat.articles.find((a) => a.nom === 'Beurre');
  assert.ok(beurre, 'l’épicerie doit retrouver l’article dans l’état fabriqué de toutes pièces');
  assert.equal(beurre.qte, '250 g');
  // Et le catalogue livré arrive quand même par la fusion.
  assert.ok(E.trouver('tomates'), 'le catalogue doit rejoindre la liste au chargement');
});

test('ce qui est versé passe la barrière d’assainissement sans être rogné', () => {
  epicerieNeuve();
  E.sauvegarderMaintenant();
  Conseiller.verserALEpicerie([
    { nom: '  Fleur de sel  ', qte: '  1  ' },
    { nom: '', qte: '3' },
    { nom: null },
    { nom: 'Poivre', qte: null },
  ]);
  rechargerEpicerie();

  assert.ok(E.etat.articles.some((a) => a.nom === 'Fleur de sel'), 'les espaces de garde doivent être retirés');
  assert.ok(E.etat.articles.some((a) => a.nom === 'Poivre'));
  assert.equal(E.etat.articles.filter((a) => a.nom === '').length, 0);
});

test('les identifiants fabriqués par Ma Cuisine restent distincts', () => {
  epicerieNeuve();
  E.sauvegarderMaintenant();
  Conseiller.verserALEpicerie(Array.from({ length: 30 }, (_, i) => ({ nom: 'Ingrédient ' + i })));
  rechargerEpicerie();

  const ids = E.etat.articles.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'deux articles versés partagent un identifiant');
});

test('verser n’efface ni les quantités ni les rayons personnalisés déjà en place', () => {
  epicerieNeuve();
  const { rayon } = E.ajouterRayon({ nom: 'Pêche', emoji: '🎣' });
  E.ajouter({ nom: 'Truite', qte: '2', rayon: rayon.id });
  E.modifier('tomates', { qte: '3', magasin: 'Maxi' });
  E.sauvegarderMaintenant();

  Conseiller.verserALEpicerie([{ nom: 'Beurre', qte: '250 g' }]);
  rechargerEpicerie();

  assert.equal(E.etat.rayonsPerso[0]?.nom, 'Pêche', 'le rayon personnalisé a disparu');
  assert.equal(E.etat.articles.find((a) => a.nom === 'Truite').rayon, rayon.id);
  assert.equal(E.trouver('tomates').qte, '3');
  assert.equal(E.trouver('tomates').magasin, 'Maxi');
});

test('la clé et le format de stockage sont bien les mêmes des deux côtés', () => {
  epicerieNeuve();
  E.modifier('tomates', { qte: '3' });
  E.sauvegarderMaintenant();

  const ecritParEpicerie = boite.prendre(CLE);
  assert.ok(ecritParEpicerie, `l’épicerie doit écrire sous « ${CLE} »`);

  Conseiller.verserALEpicerie([{ nom: 'Beurre' }]);
  const apresCuisine = boite.prendre(CLE);

  assert.equal(apresCuisine.version, ecritParEpicerie.version, 'les deux applications doivent s’accorder sur la version du format');
  for (const champ of ['articles', 'supprimes', 'rayonsPerso', 'magasinsPerso']) {
    assert.ok(champ in apresCuisine, `Ma Cuisine a perdu le champ « ${champ} » en réécrivant l’état`);
  }
  assert.deepEqual(rapatrier(apresCuisine.supprimes), rapatrier(ecritParEpicerie.supprimes), 'les suppressions de l’utilisateur doivent survivre');
});
