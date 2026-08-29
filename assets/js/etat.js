/**
 * État de l'application et persistance locale.
 *
 * Tout vit dans le navigateur (localStorage) : aucune donnée ne quitte
 * l'appareil. Le catalogue de référence (`catalogue.js`) est fusionné avec
 * l'état sauvegardé à chaque démarrage, de sorte qu'un produit ajouté au
 * catalogue apparaisse chez les utilisateurs existants — sans faire revenir
 * ceux qu'ils ont volontairement supprimés.
 *
 * Les rayons et les magasins se composent de deux sources : ceux livrés avec
 * l'application, et ceux que l'utilisateur crée lui-même. Les listes fusionnées
 * s'obtiennent par `rayons()` et `magasins()` — jamais en important
 * directement les constantes du catalogue, qui sont incomplètes.
 */

import {
  RAYONS,
  DETAILLANTS,
  RAYON_DEFAUT,
  articlesDuCatalogue,
  identifiant,
  normaliser,
} from './catalogue.js';

const CLE_STOCKAGE = 'mon-epicerie/v1';
const VERSION = 2;

/** Garde-fou contre une liste devenue ingérable. */
const MAX_PERSO = 60;

/** État courant. Ne jamais réaffecter : muter les champs. */
export const etat = {
  articles: [],
  /** Identifiants d'articles du catalogue que l'utilisateur a supprimés. */
  supprimes: new Set(),

  /** Rayons créés par l'utilisateur : { id, nom, emoji }. */
  rayonsPerso: [],
  /** Magasins créés par l'utilisateur : { nom, teinte }. */
  magasinsPerso: [],

  // Préférences d'affichage (persistées)
  vue: 'preparee',        // 'preparee' | 'catalogue'
  groupement: 'rayon',    // 'rayon' | 'magasin'
  theme: 'auto',          // 'auto' | 'clair' | 'sombre'

  // Filtres (non persistés : on repart propre à chaque visite)
  rayonActif: 'tous',
  magasinActif: 'tous',
  recherche: '',
};

// --- Rayons et magasins effectifs -----------------------------------------

let indexRayons = new Map();
let indexMagasins = new Map();

/** Tous les rayons : ceux de l'application puis ceux de l'utilisateur. */
export function rayons() {
  return [...RAYONS, ...etat.rayonsPerso];
}

/** Tous les magasins : ceux de l'application puis ceux de l'utilisateur. */
export function magasins() {
  return [...DETAILLANTS, ...etat.magasinsPerso];
}

/** Recalcule les index de consultation rapide. */
function reindexer() {
  indexRayons = new Map(rayons().map((r) => [r.id, r]));
  indexMagasins = new Map(magasins().map((m) => [m.nom, m]));
}

export function rayonParId(id) {
  return indexRayons.get(id) ?? null;
}

export function magasinParNom(nom) {
  return indexMagasins.get(nom) ?? null;
}

// --- Abonnements -----------------------------------------------------------

const abonnes = new Set();

/** Enregistre une fonction appelée après chaque changement d'état. */
export function surChangement(fn) {
  abonnes.add(fn);
  return () => abonnes.delete(fn);
}

/**
 * Signale un changement. `portee` permet aux abonnés de faire une mise à jour
 * ciblée plutôt qu'un rendu complet :
 *   { type: 'article', id }  — un seul article a changé
 *   { type: 'liste' }        — la composition de la liste a changé
 *   { type: 'taxonomie' }    — les rayons ou les magasins ont changé, ce qui
 *                              oblige à reconstruire filtres, menus et grilles
 */
function notifier(portee = { type: 'liste' }) {
  for (const fn of abonnes) fn(portee);
}

// --- Persistance -----------------------------------------------------------

let minuterieSauvegarde = null;

function sauvegarder() {
  clearTimeout(minuterieSauvegarde);
  minuterieSauvegarde = setTimeout(ecrire, 150);
}

function ecrire() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(instantane()));
  } catch (err) {
    // Quota dépassé ou stockage désactivé (navigation privée) : l'application
    // reste utilisable pour la session en cours.
    console.warn('Sauvegarde impossible :', err);
  }
}

/** Représentation complète de l'état, utilisée aussi pour les sauvegardes. */
export function instantane() {
  return {
    version: VERSION,
    articles: etat.articles,
    supprimes: [...etat.supprimes],
    rayonsPerso: etat.rayonsPerso,
    magasinsPerso: etat.magasinsPerso,
    preferences: {
      vue: etat.vue,
      groupement: etat.groupement,
      theme: etat.theme,
    },
  };
}

/** Force l'écriture immédiate (avant une fermeture d'onglet, par exemple). */
export function sauvegarderMaintenant() {
  clearTimeout(minuterieSauvegarde);
  ecrire();
}

/**
 * Nettoie un article venant du stockage ou d'un fichier importé. Retourne
 * `null` si l'objet n'a rien d'un article — c'est la seule barrière entre un
 * fichier JSON douteux et l'état de l'application.
 *
 * `idsPris` recueille les identifiants déjà attribués : un fichier qui en
 * répète un verrait sinon deux articles se confondre, et le second deviendrait
 * impossible à cocher, à modifier ou à supprimer.
 *
 * À n'appeler qu'une fois les rayons de l'utilisateur chargés : un article
 * rangé dans un rayon perso serait sinon renvoyé dans « Divers ».
 */
function assainirArticle(brut, idsPris) {
  if (!brut || typeof brut !== 'object') return null;

  const nom = typeof brut.nom === 'string' ? brut.nom : brut.name;
  if (typeof nom !== 'string' || nom.trim() === '') return null;

  const rayonBrut = brut.rayon ?? brut.cat;
  const rayon = indexRayons.has(rayonBrut) ? rayonBrut : RAYON_DEFAUT;

  const texte = (v) => (typeof v === 'string' ? v.trim().slice(0, 120) : '');

  let id = typeof brut.id === 'string' && brut.id ? brut.id : nouvelIdentifiant();
  if (idsPris) {
    while (idsPris.has(id)) id = nouvelIdentifiant();
    idsPris.add(id);
  }

  return {
    id,
    nom: nom.trim().slice(0, 120),
    qte: texte(brut.qte ?? brut.qty),
    magasin: texte(brut.magasin ?? brut.store),
    rayon,
    coche: Boolean(brut.coche ?? brut.checked),
    catalogue: Boolean(brut.catalogue),
  };
}

/** Identifiant unique pour un article créé à la main. */
function nouvelIdentifiant() {
  return `perso-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Nettoie un rayon personnalisé venant du stockage ou d'un import.
 *
 * Le nom compte autant que l'identifiant : l'export texte regroupe les
 * articles par intitulé de rayon, de sorte que deux rayons homonymes — l'un
 * livré, l'autre venu d'un fichier — se confondraient sur la feuille imprimée.
 */
function assainirRayonPerso(brut, idsPris, nomsPris = null) {
  if (!brut || typeof brut !== 'object') return null;
  if (typeof brut.nom !== 'string' || brut.nom.trim() === '') return null;

  const nom = brut.nom.trim().slice(0, 40);
  if (nomsPris) {
    if (nomsPris.has(normaliser(nom))) return null;
    nomsPris.add(normaliser(nom));
  }

  let id = typeof brut.id === 'string' && brut.id ? brut.id : `perso-${identifiant(nom)}`;
  while (idsPris.has(id)) id = `${id}-2`;
  idsPris.add(id);

  const emoji = typeof brut.emoji === 'string' && brut.emoji.trim() ? brut.emoji.trim().slice(0, 4) : '🏷️';
  return { id, nom, emoji };
}

/** Nettoie un magasin personnalisé venant du stockage ou d'un import. */
function assainirMagasinPerso(brut, nomsPris) {
  if (!brut || typeof brut !== 'object') return null;
  if (typeof brut.nom !== 'string' || brut.nom.trim() === '') return null;

  const nom = brut.nom.trim().slice(0, 40);
  if (nomsPris.has(normaliser(nom))) return null;
  nomsPris.add(normaliser(nom));

  const teinte = Number(brut.teinte);
  return { nom, teinte: Number.isFinite(teinte) ? ((teinte % 360) + 360) % 360 : 220 };
}

/**
 * Fusionne le catalogue de référence avec les articles sauvegardés :
 * les articles connus gardent l'état de l'utilisateur, les nouveaux produits
 * du catalogue sont ajoutés, et ceux qu'il a supprimés ne reviennent pas.
 */
function fusionnerCatalogue(sauvegardes, supprimes) {
  const parId = new Map(sauvegardes.map((a) => [a.id, a]));
  const resultat = [...sauvegardes];

  for (const reference of articlesDuCatalogue()) {
    if (parId.has(reference.id) || supprimes.has(reference.id)) continue;
    resultat.push(reference);
  }

  return resultat;
}

/** Reprend les rayons et magasins personnalisés d'un objet sauvegardé. */
function chargerPerso(donnees) {
  const idsPris = new Set(RAYONS.map((r) => r.id));
  const nomsRayonsPris = new Set(RAYONS.map((r) => normaliser(r.nom)));
  etat.rayonsPerso = (Array.isArray(donnees?.rayonsPerso) ? donnees.rayonsPerso : [])
    .map((brut) => assainirRayonPerso(brut, idsPris, nomsRayonsPris))
    .filter(Boolean)
    .slice(0, MAX_PERSO);

  const nomsPris = new Set(DETAILLANTS.map((d) => normaliser(d.nom)));
  etat.magasinsPerso = (Array.isArray(donnees?.magasinsPerso) ? donnees.magasinsPerso : [])
    .map((brut) => assainirMagasinPerso(brut, nomsPris))
    .filter(Boolean)
    .slice(0, MAX_PERSO);

  reindexer();
}

/** Charge l'état depuis le stockage local, ou installe le catalogue par défaut. */
export function charger() {
  let donnees = null;
  try {
    donnees = JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? 'null');
  } catch {
    donnees = null;
  }

  // Les rayons personnalisés doivent exister avant d'assainir les articles.
  chargerPerso(donnees);

  if (!donnees || !Array.isArray(donnees.articles)) {
    etat.articles = articlesDuCatalogue();
    return;
  }

  etat.supprimes = new Set(
    Array.isArray(donnees.supprimes) ? donnees.supprimes.filter((v) => typeof v === 'string') : [],
  );

  const idsPris = new Set();
  const assainis = donnees.articles.map((a) => assainirArticle(a, idsPris)).filter(Boolean);
  etat.articles = fusionnerCatalogue(assainis, etat.supprimes);

  const prefs = donnees.preferences ?? {};
  if (prefs.vue === 'preparee' || prefs.vue === 'catalogue') etat.vue = prefs.vue;
  if (prefs.groupement === 'rayon' || prefs.groupement === 'magasin') {
    etat.groupement = prefs.groupement;
  }
  if (['auto', 'clair', 'sombre'].includes(prefs.theme)) etat.theme = prefs.theme;
}

// --- Lecture ---------------------------------------------------------------

/**
 * Un article fait partie de la « liste préparée » dès qu'on l'a touché :
 * quantité, magasin, ou case cochée.
 */
export function estPrepare(article) {
  return Boolean(article.qte || article.magasin || article.coche);
}

/** Les articles retenus pour les courses de la semaine. */
export function articlesPrepares() {
  return etat.articles.filter(estPrepare);
}

/** Retrouve un article par identifiant. */
export function trouver(id) {
  return etat.articles.find((a) => a.id === id) ?? null;
}

// --- Écriture : articles ---------------------------------------------------

/** Applique des changements à un article et prévient les abonnés. */
export function modifier(id, champs) {
  const article = trouver(id);
  if (!article) return null;

  const rayonChange = 'rayon' in champs && champs.rayon !== article.rayon;
  Object.assign(article, champs);

  sauvegarder();
  notifier(rayonChange ? { type: 'liste' } : { type: 'article', id });
  return article;
}

/** Coche ou décoche un article. */
export function basculerCoche(id) {
  const article = trouver(id);
  if (!article) return;
  article.coche = !article.coche;
  sauvegarder();
  notifier({ type: 'article', id });
}

/** Ajoute un article créé à la main, en tête de liste. */
export function ajouter({ nom, qte = '', magasin = '', rayon = RAYON_DEFAUT }) {
  const article = assainirArticle(
    { id: nouvelIdentifiant(), nom, qte, magasin, rayon },
    new Set(etat.articles.map((a) => a.id)),
  );
  if (!article) return null;

  etat.articles.unshift(article);
  etat.supprimes.delete(article.id);
  sauvegarder();
  notifier({ type: 'liste' });
  return article;
}

/**
 * Supprime un article. Retourne de quoi le remettre en place (`restaurer`),
 * ce qui permet d'offrir un « Annuler » plutôt qu'une confirmation.
 */
export function supprimer(id) {
  const index = etat.articles.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const [article] = etat.articles.splice(index, 1);
  etat.supprimes.add(id);
  sauvegarder();
  notifier({ type: 'liste' });

  return {
    article,
    restaurer() {
      etat.articles.splice(Math.min(index, etat.articles.length), 0, article);
      etat.supprimes.delete(id);
      sauvegarder();
      notifier({ type: 'liste' });
    },
  };
}

/** Remet la liste à zéro : rien de coché, ni quantité, ni magasin. */
export function toutReinitialiser() {
  for (const article of etat.articles) {
    article.coche = false;
    article.qte = '';
    article.magasin = '';
  }
  sauvegarder();
  notifier({ type: 'liste' });
}

/** Retire de la liste préparée les articles déjà mis au panier. */
export function viderCoches() {
  for (const article of etat.articles) {
    if (!article.coche) continue;
    article.coche = false;
    article.qte = '';
    article.magasin = '';
  }
  sauvegarder();
  notifier({ type: 'liste' });
}

/** Remplace tout l'état par le contenu d'une sauvegarde importée. */
export function remplacerArticles(donnees) {
  // Une sauvegarde peut n'être qu'un tableau d'articles (ancien format).
  const brut = Array.isArray(donnees) ? { articles: donnees } : donnees;

  // Les rayons personnalisés du fichier d'abord : sans eux, les articles qui
  // s'y rattachent seraient renvoyés dans « Divers ». Mais un fichier dont
  // aucun article ne survit à l'assainissement ne doit rien remplacer du tout :
  // on garde donc de quoi revenir en arrière avant d'y toucher.
  const rayonsAvant = etat.rayonsPerso;
  const magasinsAvant = etat.magasinsPerso;
  chargerPerso(brut);

  const idsPris = new Set();
  const assainis = (brut.articles ?? []).map((a) => assainirArticle(a, idsPris)).filter(Boolean);
  if (assainis.length === 0) {
    etat.rayonsPerso = rayonsAvant;
    etat.magasinsPerso = magasinsAvant;
    reindexer();
    return 0;
  }

  etat.articles = assainis;
  etat.supprimes = new Set(
    articlesDuCatalogue()
      .map((a) => a.id)
      .filter((id) => !assainis.some((a) => a.id === id)),
  );

  sauvegarder();
  notifier({ type: 'taxonomie' });
  return assainis.length;
}

// --- Écriture : rayons personnalisés ---------------------------------------

/**
 * Crée un rayon. Retourne `{ erreur }` si le nom est vide, déjà pris, ou si la
 * liste est pleine — l'appelant affiche le message tel quel.
 */
export function ajouterRayon({ nom, emoji }) {
  const propre = String(nom ?? '').trim();
  if (!propre) return { erreur: 'Donnez un nom au rayon.' };
  if (etat.rayonsPerso.length >= MAX_PERSO) {
    return { erreur: `Pas plus de ${MAX_PERSO} rayons personnalisés.` };
  }
  if (rayons().some((r) => normaliser(r.nom) === normaliser(propre))) {
    return { erreur: `« ${propre} » existe déjà.` };
  }

  // Le doublon de nom est déjà écarté ci-dessus, avec un message pour
  // l'utilisateur : inutile de le refaire ici.
  const idsPris = new Set(rayons().map((r) => r.id));
  const rayon = assainirRayonPerso({ nom: propre, emoji }, idsPris);
  etat.rayonsPerso.push(rayon);

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { rayon };
}

/** Renomme ou rehabille un rayon personnalisé. Les articles suivent seuls. */
export function modifierRayon(id, { nom, emoji }) {
  const rayon = etat.rayonsPerso.find((r) => r.id === id);
  if (!rayon) return { erreur: 'Ce rayon n’existe plus.' };

  const propre = String(nom ?? '').trim();
  if (!propre) return { erreur: 'Donnez un nom au rayon.' };
  if (rayons().some((r) => r.id !== id && normaliser(r.nom) === normaliser(propre))) {
    return { erreur: `« ${propre} » existe déjà.` };
  }

  rayon.nom = propre.slice(0, 40);
  if (typeof emoji === 'string' && emoji.trim()) rayon.emoji = emoji.trim().slice(0, 4);

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { rayon };
}

/**
 * Supprime un rayon personnalisé. Les articles qui s'y trouvaient rejoignent
 * « Divers » plutôt que de disparaître avec lui.
 */
export function supprimerRayon(id) {
  const index = etat.rayonsPerso.findIndex((r) => r.id === id);
  if (index === -1) return { deplaces: 0 };

  etat.rayonsPerso.splice(index, 1);

  let deplaces = 0;
  for (const article of etat.articles) {
    if (article.rayon !== id) continue;
    article.rayon = RAYON_DEFAUT;
    deplaces++;
  }

  if (etat.rayonActif === id) etat.rayonActif = 'tous';

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { deplaces };
}

/** Combien d'articles se trouvent dans un rayon donné. */
export function compterArticlesDuRayon(id) {
  return etat.articles.filter((a) => a.rayon === id).length;
}

// --- Écriture : magasins personnalisés -------------------------------------

/** Crée un magasin. Même contrat d'erreur que `ajouterRayon`. */
export function ajouterMagasin({ nom, teinte }) {
  const propre = String(nom ?? '').trim();
  if (!propre) return { erreur: 'Donnez un nom au magasin.' };
  if (etat.magasinsPerso.length >= MAX_PERSO) {
    return { erreur: `Pas plus de ${MAX_PERSO} magasins personnalisés.` };
  }
  if (magasins().some((m) => normaliser(m.nom) === normaliser(propre))) {
    return { erreur: `« ${propre} » existe déjà.` };
  }

  const magasin = assainirMagasinPerso({ nom: propre, teinte }, new Set());
  etat.magasinsPerso.push(magasin);

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { magasin };
}

/**
 * Renomme ou recolore un magasin personnalisé. Les articles référencent le
 * magasin par son nom : le changement est propagé sur chacun d'eux.
 */
export function modifierMagasin(nomActuel, { nom, teinte }) {
  const magasin = etat.magasinsPerso.find((m) => m.nom === nomActuel);
  if (!magasin) return { erreur: 'Ce magasin n’existe plus.' };

  const propre = String(nom ?? '').trim();
  if (!propre) return { erreur: 'Donnez un nom au magasin.' };
  if (magasins().some((m) => m.nom !== nomActuel && normaliser(m.nom) === normaliser(propre))) {
    return { erreur: `« ${propre} » existe déjà.` };
  }

  const nouveau = propre.slice(0, 40);
  if (nouveau !== nomActuel) {
    for (const article of etat.articles) {
      if (article.magasin === nomActuel) article.magasin = nouveau;
    }
    if (etat.magasinActif === nomActuel) etat.magasinActif = nouveau;
  }

  magasin.nom = nouveau;
  const valeur = Number(teinte);
  if (Number.isFinite(valeur)) magasin.teinte = ((valeur % 360) + 360) % 360;

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { magasin };
}

/**
 * Supprime un magasin personnalisé. Les articles qui le portaient se
 * retrouvent sans magasin, mais gardent leur quantité.
 */
export function supprimerMagasin(nom) {
  const index = etat.magasinsPerso.findIndex((m) => m.nom === nom);
  if (index === -1) return { liberes: 0 };

  etat.magasinsPerso.splice(index, 1);

  let liberes = 0;
  for (const article of etat.articles) {
    if (article.magasin !== nom) continue;
    article.magasin = '';
    liberes++;
  }

  if (etat.magasinActif === nom) etat.magasinActif = 'tous';

  reindexer();
  sauvegarder();
  notifier({ type: 'taxonomie' });
  return { liberes };
}

/** Combien d'articles portent ce magasin. */
export function compterArticlesDuMagasin(nom) {
  return etat.articles.filter((a) => a.magasin === nom).length;
}

// --- Préférences et filtres ------------------------------------------------

/** Change une préférence d'affichage et la persiste. */
export function definirPreference(cle, valeur) {
  if (etat[cle] === valeur) return;
  etat[cle] = valeur;
  sauvegarder();
  notifier({ type: 'liste' });
}

/** Change un filtre (non persisté). */
export function definirFiltre(cle, valeur) {
  if (etat[cle] === valeur) return;
  etat[cle] = valeur;
  notifier({ type: 'liste' });
}
