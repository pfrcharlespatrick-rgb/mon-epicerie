/**
 * L'état et sa persistance : le seul endroit du dépôt où un défaut coûte à
 * l'utilisateur quelque chose d'irrécupérable — sa liste.
 *
 * On y vérifie surtout trois choses : que le catalogue livré fusionne avec la
 * liste sauvegardée sans écraser le travail de l'utilisateur ni faire revenir
 * ce qu'il a supprimé ; qu'un fichier douteux ne franchit pas la barrière
 * d'assainissement ; et qu'un import raté ne laisse pas l'état à moitié
 * remplacé.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { RACINE } from './aide/cuisine.mjs';
import { installerStockage, rendreStockageIndisponible } from './aide/stockage.mjs';

const boite = installerStockage();

const E = await import(path.join(RACINE, 'assets/js/etat.js'));
const { articlesDuCatalogue, RAYON_DEFAUT } = await import(path.join(RACINE, 'assets/js/catalogue.js'));

const CLE = 'mon-epicerie/v1';

/** Repart d'un stockage vierge, puis charge — comme au premier démarrage. */
function neuf(donnees) {
  boite.vider();
  if (donnees !== undefined) boite.poser(CLE, donnees);
  Object.assign(E.etat, {
    supprimes: new Set(), rayonsPerso: [], magasinsPerso: [],
    vue: 'preparee', groupement: 'rayon', theme: 'auto',
    rayonActif: 'tous', magasinActif: 'tous', recherche: '',
  });
  E.charger();
}

const article = (extra = {}) => ({
  id: 'truite', nom: 'Truite', qte: '2', magasin: '', rayon: 'produce',
  coche: false, catalogue: false, ...extra,
});

// --- Premier démarrage ------------------------------------------------------

test('sans rien en mémoire, on installe le catalogue livré', () => {
  neuf();
  assert.equal(E.etat.articles.length, articlesDuCatalogue().length);
  assert.equal(E.articlesPrepares().length, 0, 'rien n’est préparé au départ');
});

test('un stockage illisible ne fait pas tomber l’application', () => {
  boite.vider();
  boite.poserBrut(CLE, '{ceci n’est pas du JSON');
  E.charger();
  assert.equal(E.etat.articles.length, articlesDuCatalogue().length);
});

test('un stockage indisponible (navigation privée) reste utilisable', () => {
  rendreStockageIndisponible();
  assert.doesNotThrow(() => E.charger());
  assert.doesNotThrow(() => E.ajouter({ nom: 'Pain' }));
  assert.doesNotThrow(() => E.sauvegarderMaintenant());
  globalThis.localStorage = boite.stockage;   // on rebranche pour la suite
});

// --- Fusion du catalogue ----------------------------------------------------

test('un produit ajouté au catalogue arrive chez les utilisateurs existants', () => {
  neuf({ version: 2, articles: [article({ id: 'tomates', nom: 'Tomates', qte: '3', catalogue: true })], supprimes: [] });
  assert.equal(E.etat.articles.length, articlesDuCatalogue().length);
  assert.equal(E.trouver('tomates').qte, '3', 'le travail de l’utilisateur est conservé');
});

test('un article supprimé ne revient pas par la fusion', () => {
  neuf({ version: 2, articles: [], supprimes: ['tomates'] });
  assert.equal(E.trouver('tomates'), null);
  assert.equal(E.etat.articles.length, articlesDuCatalogue().length - 1);
});

test('la fusion n’introduit jamais deux fois le même identifiant', () => {
  neuf({ version: 2, articles: articlesDuCatalogue().slice(0, 10), supprimes: [] });
  const ids = E.etat.articles.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

// --- Assainissement ---------------------------------------------------------

test('l’assainissement écarte ce qui n’a rien d’un article', () => {
  neuf({ version: 2, articles: [null, 42, 'texte', {}, { nom: '   ' }, { nom: 123 }], supprimes: [] });
  // Seul le catalogue subsiste : aucune de ces entrées n'est un article.
  assert.equal(E.etat.articles.length, articlesDuCatalogue().length);
});

test('l’assainissement borne les champs et rabat un rayon inconnu sur « Divers »', () => {
  neuf({
    version: 2, supprimes: [],
    articles: [{ id: 'x', nom: 'N'.repeat(300), qte: 'Q'.repeat(300), magasin: ' M ', rayon: 'rayon-fantome', coche: 'oui' }],
  });
  const a = E.trouver('x');
  assert.equal(a.nom.length, 120);
  assert.equal(a.qte.length, 120);
  assert.equal(a.magasin, 'M', 'les espaces de garde sont retirés');
  assert.equal(a.rayon, RAYON_DEFAUT);
  assert.equal(a.coche, true, 'la coche est ramenée à un booléen');
});

test('l’ancien vocabulaire anglais des sauvegardes est encore compris', () => {
  neuf({ version: 2, supprimes: [], articles: [{ id: 'y', name: 'Lait', qty: '2', store: 'Maxi', cat: 'dairy', checked: true }] });
  const a = E.trouver('y');
  assert.equal(a.nom, 'Lait');
  assert.equal(a.qte, '2');
  assert.equal(a.magasin, 'Maxi');
  assert.equal(a.rayon, 'dairy');
  assert.equal(a.coche, true);
});

test('un article sans identifiant en reçoit un, unique', () => {
  neuf({ version: 2, supprimes: [], articles: [{ nom: 'A' }, { nom: 'B' }] });
  const perso = E.etat.articles.filter((a) => a.id.startsWith('perso-'));
  assert.equal(perso.length, 2);
  assert.notEqual(perso[0].id, perso[1].id);
});

test('deux articles importés ne peuvent pas partager un identifiant', () => {
  // Sinon `trouver()` ne rend que le premier : cocher l'un cocherait l'autre,
  // et le second serait impossible à modifier ou à supprimer.
  neuf();
  E.remplacerArticles({ articles: [{ id: 'x', nom: 'Lait' }, { id: 'x', nom: 'Pain' }] });
  const ids = E.etat.articles.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'un identifiant en double rend un article inatteignable');
});

// --- Aller-retour de sauvegarde --------------------------------------------

test('instantané puis rechargement rendent le même état', () => {
  neuf();
  E.ajouterRayon({ nom: 'Pêche', emoji: '🎣' });
  E.ajouterMagasin({ nom: 'Poissonnerie', teinte: 200 });
  const rayon = E.etat.rayonsPerso[0];
  E.ajouter({ nom: 'Truite', qte: '2', magasin: 'Poissonnerie', rayon: rayon.id });
  E.definirPreference('groupement', 'magasin');
  E.definirPreference('theme', 'sombre');
  E.supprimer('tomates');

  const copie = JSON.parse(JSON.stringify(E.instantane()));
  boite.poser(CLE, copie);
  Object.assign(E.etat, { supprimes: new Set(), rayonsPerso: [], magasinsPerso: [], groupement: 'rayon', theme: 'auto' });
  E.charger();

  assert.deepEqual(E.etat.rayonsPerso, [rayon]);
  assert.equal(E.etat.magasinsPerso[0].nom, 'Poissonnerie');
  assert.equal(E.etat.groupement, 'magasin');
  assert.equal(E.etat.theme, 'sombre');
  assert.equal(E.trouver('tomates'), null, 'la suppression a survécu au rechargement');
  const truite = E.etat.articles.find((a) => a.nom === 'Truite');
  assert.equal(truite.rayon, rayon.id, 'l’article reste dans son rayon personnalisé');
});

test('une préférence inconnue dans le fichier est ignorée', () => {
  neuf({ version: 2, articles: [article()], supprimes: [], preferences: { vue: 'pirate', groupement: 'lune', theme: 'fluo' } });
  assert.equal(E.etat.vue, 'preparee');
  assert.equal(E.etat.groupement, 'rayon');
  assert.equal(E.etat.theme, 'auto');
});

// --- Import : le chemin qui fait mal ---------------------------------------

test('un import qui échoue ne touche à rien', () => {
  neuf({
    version: 2, supprimes: [],
    articles: [article({ id: 'tomates', nom: 'Tomates', qte: '3', rayon: 'produce', catalogue: true })],
    rayonsPerso: [{ id: 'perso-peche', nom: 'Pêche', emoji: '🎣' }],
    magasinsPerso: [{ nom: 'Poissonnerie', teinte: 200 }],
  });

  const n = E.remplacerArticles({ articles: [{ foo: 'bar' }, { nom: '   ' }] });

  assert.equal(n, 0, 'l’import est bien annoncé comme raté');
  assert.deepEqual(E.etat.rayonsPerso.map((r) => r.nom), ['Pêche'], 'les rayons personnalisés ont été perdus');
  assert.deepEqual(E.etat.magasinsPerso.map((m) => m.nom), ['Poissonnerie'], 'les magasins personnalisés ont été perdus');
  assert.equal(E.trouver('tomates').qte, '3');
});

test('un import réussi remplace tout, rayons personnalisés compris', () => {
  neuf();
  const n = E.remplacerArticles({
    articles: [{ id: 'truite', nom: 'Truite', qte: '2', rayon: 'perso-peche' }],
    rayonsPerso: [{ id: 'perso-peche', nom: 'Pêche', emoji: '🎣' }],
    magasinsPerso: [{ nom: 'Poissonnerie', teinte: 200 }],
  });

  assert.equal(n, 1);
  assert.equal(E.etat.articles.length, 1);
  assert.equal(E.trouver('truite').rayon, 'perso-peche');
  assert.ok(E.rayonParId('perso-peche'), 'le rayon du fichier est connu de l’index');
  assert.ok(E.etat.supprimes.has('tomates'), 'ce qui n’est pas dans le fichier compte comme supprimé');
});

test('une sauvegarde de l’ancien format (simple tableau) est acceptée', () => {
  neuf();
  const n = E.remplacerArticles([{ id: 'a', nom: 'Lait', qte: '1' }]);
  assert.equal(n, 1);
  assert.equal(E.trouver('a').nom, 'Lait');
});

test('aucun article ne reste rangé dans un rayon que l’état ne connaît plus', () => {
  neuf({
    version: 2, supprimes: [],
    articles: [article({ rayon: 'perso-peche' })],
    rayonsPerso: [{ id: 'perso-peche', nom: 'Pêche', emoji: '🎣' }],
  });
  E.remplacerArticles({ articles: [{ nope: 1 }] });   // import raté

  for (const a of E.etat.articles) {
    assert.ok(E.rayonParId(a.rayon), `« ${a.nom} » pointe vers le rayon disparu ${a.rayon} : il n’apparaîtrait dans aucun filtre`);
  }
});

// --- Rayons et magasins personnalisés --------------------------------------

test('un rayon personnalisé ne peut pas usurper le nom d’un rayon livré', () => {
  neuf();
  const { erreur } = E.ajouterRayon({ nom: 'fruits & légumes' });
  assert.ok(erreur, 'le doublon de nom doit être refusé, accents et casse compris');
});

test('un fichier importé ne peut pas non plus glisser un rayon au nom déjà pris', () => {
  // Deux rayons de même nom se confondent à l'export texte, qui les regroupe
  // par intitulé : les articles de l'un se retrouvent sous l'autre.
  neuf({
    version: 2, supprimes: [], articles: [article()],
    rayonsPerso: [{ id: 'perso-x', nom: 'Fruits & Légumes', emoji: '🎣' }],
  });
  const noms = E.rayons().map((r) => r.nom.toLowerCase());
  assert.equal(new Set(noms).size, noms.length, 'deux rayons portent le même nom');
});

test('les identifiants de rayons personnalisés restent distincts et lisibles', () => {
  neuf({ version: 2, supprimes: [], articles: [article()], rayonsPerso: [{ nom: 'Pêche' }, { nom: 'Traiteur' }] });
  const ids = E.etat.rayonsPerso.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(!E.rayons().some((r) => r.id === id && r !== E.rayonParId(id)));
});

test('supprimer un rayon déplace ses articles vers « Divers » sans les perdre', () => {
  neuf();
  const { rayon } = E.ajouterRayon({ nom: 'Pêche', emoji: '🎣' });
  E.ajouter({ nom: 'Truite', rayon: rayon.id });
  E.ajouter({ nom: 'Doré', rayon: rayon.id });
  E.definirFiltre('rayonActif', rayon.id);

  const { deplaces } = E.supprimerRayon(rayon.id);

  assert.equal(deplaces, 2);
  assert.equal(E.etat.articles.find((a) => a.nom === 'Truite').rayon, RAYON_DEFAUT);
  assert.equal(E.etat.rayonActif, 'tous', 'le filtre ne reste pas braqué sur un rayon disparu');
  assert.equal(E.rayonParId(rayon.id), null);
});

test('renommer un magasin suit tous les articles qui le portaient', () => {
  neuf();
  E.ajouterMagasin({ nom: 'Poissonnerie', teinte: 200 });
  E.ajouter({ nom: 'Truite', magasin: 'Poissonnerie' });
  E.ajouter({ nom: 'Doré', magasin: 'Poissonnerie' });
  E.definirFiltre('magasinActif', 'Poissonnerie');

  E.modifierMagasin('Poissonnerie', { nom: 'Poissonnerie du port', teinte: 210 });

  assert.equal(E.compterArticlesDuMagasin('Poissonnerie'), 0);
  assert.equal(E.compterArticlesDuMagasin('Poissonnerie du port'), 2);
  assert.equal(E.etat.magasinActif, 'Poissonnerie du port', 'le filtre suit le nouveau nom');
});

test('supprimer un magasin libère les articles sans effacer leur quantité', () => {
  neuf();
  E.ajouterMagasin({ nom: 'Poissonnerie', teinte: 200 });
  E.ajouter({ nom: 'Truite', qte: '2', magasin: 'Poissonnerie' });

  const { liberes } = E.supprimerMagasin('Poissonnerie');

  assert.equal(liberes, 1);
  const truite = E.etat.articles.find((a) => a.nom === 'Truite');
  assert.equal(truite.magasin, '');
  assert.equal(truite.qte, '2', 'la quantité survit à la disparition du magasin');
});

test('la teinte d’un magasin est toujours ramenée dans [0, 360[', () => {
  neuf({
    version: 2, supprimes: [], articles: [article()],
    magasinsPerso: [{ nom: 'A', teinte: -40 }, { nom: 'B', teinte: '720' }, { nom: 'C', teinte: 'bleu' }, { nom: 'D', teinte: 400 }],
  });
  for (const m of E.etat.magasinsPerso) {
    assert.ok(Number.isFinite(m.teinte) && m.teinte >= 0 && m.teinte < 360, `${m.nom} : ${m.teinte}`);
  }
  assert.equal(E.etat.magasinsPerso.find((m) => m.nom === 'A').teinte, 320);
  assert.equal(E.etat.magasinsPerso.find((m) => m.nom === 'C').teinte, 220, 'une teinte illisible retombe sur le bleu par défaut');
});

test('les magasins personnalisés en double sont écartés au chargement', () => {
  neuf({
    version: 2, supprimes: [], articles: [article()],
    magasinsPerso: [{ nom: 'Poissonnerie', teinte: 200 }, { nom: 'poissonnerie', teinte: 10 }, { nom: 'Maxi', teinte: 1 }],
  });
  assert.deepEqual(E.etat.magasinsPerso.map((m) => m.nom), ['Poissonnerie'], 'doublon et enseigne livrée doivent être écartés');
});

test('le nombre de rayons et de magasins personnalisés est borné', () => {
  const trop = Array.from({ length: 200 }, (_, i) => ({ nom: 'Rayon ' + i }));
  neuf({ version: 2, supprimes: [], articles: [article()], rayonsPerso: trop, magasinsPerso: trop });
  assert.ok(E.etat.rayonsPerso.length <= 60, `${E.etat.rayonsPerso.length} rayons`);
  assert.ok(E.etat.magasinsPerso.length <= 60, `${E.etat.magasinsPerso.length} magasins`);
});

// --- Gestes courants --------------------------------------------------------

test('un article n’entre dans la liste préparée que lorsqu’on y touche', () => {
  neuf();
  const a = E.trouver('tomates');
  assert.equal(E.estPrepare(a), false);
  E.modifier('tomates', { qte: '3' });
  assert.equal(E.estPrepare(E.trouver('tomates')), true);
  E.modifier('tomates', { qte: '', magasin: 'Maxi' });
  assert.equal(E.estPrepare(E.trouver('tomates')), true);
  E.modifier('tomates', { magasin: '' });
  E.basculerCoche('tomates');
  assert.equal(E.estPrepare(E.trouver('tomates')), true);
});

test('supprimer puis annuler remet l’article à sa place', () => {
  neuf();
  const avant = E.etat.articles.map((a) => a.id);
  const rang = avant.indexOf('tomates');

  const annulation = E.supprimer('tomates');
  assert.ok(E.etat.supprimes.has('tomates'));
  assert.equal(E.trouver('tomates'), null);

  annulation.restaurer();
  assert.deepEqual(E.etat.articles.map((a) => a.id), avant, 'l’article revient à son rang exact');
  assert.equal(E.etat.supprimes.has('tomates'), false);
});

test('vider les cochés ne touche pas à ce qui reste à acheter', () => {
  neuf();
  E.modifier('tomates', { qte: '3', coche: true });
  E.modifier('avocats', { qte: '2', magasin: 'Maxi' });

  E.viderCoches();

  assert.equal(E.estPrepare(E.trouver('tomates')), false, 'l’article coché quitte la liste');
  assert.equal(E.trouver('avocats').qte, '2', 'l’article non coché est intact');
});

test('tout réinitialiser vide la liste préparée sans supprimer d’article', () => {
  neuf();
  const total = E.etat.articles.length;
  E.modifier('tomates', { qte: '3', coche: true, magasin: 'Maxi' });
  E.toutReinitialiser();
  assert.equal(E.articlesPrepares().length, 0);
  assert.equal(E.etat.articles.length, total);
});

test('les abonnés sont prévenus, et se désabonnent proprement', () => {
  neuf();
  const portees = [];
  const desabonner = E.surChangement((p) => portees.push(p.type));

  E.basculerCoche('tomates');
  E.modifier('tomates', { rayon: 'dairy' });
  E.ajouterRayon({ nom: 'Pêche' });

  assert.deepEqual(portees, ['article', 'liste', 'taxonomie'],
    'un changement de rayon touche la composition de la liste, pas la seule ligne');

  desabonner();
  E.basculerCoche('tomates');
  assert.equal(portees.length, 3, 'plus rien après désabonnement');
});
