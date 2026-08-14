/**
 * État de l'application et persistance locale.
 *
 * Tout vit dans le navigateur (localStorage) : aucune donnée ne quitte
 * l'appareil. Le catalogue de référence (`catalogue.js`) est fusionné avec
 * l'état sauvegardé à chaque démarrage, de sorte qu'un produit ajouté au
 * catalogue apparaisse chez les utilisateurs existants — sans faire revenir
 * ceux qu'ils ont volontairement supprimés.
 */

import { articlesDuCatalogue, RAYON_PAR_ID, RAYON_DEFAUT } from './catalogue.js';

const CLE_STOCKAGE = 'mon-epicerie/v1';
const VERSION = 1;

/** État courant. Ne jamais réaffecter : muter les champs. */
export const etat = {
  articles: [],
  /** Identifiants d'articles du catalogue que l'utilisateur a supprimés. */
  supprimes: new Set(),

  // Préférences d'affichage (persistées)
  vue: 'preparee',        // 'preparee' | 'catalogue'
  groupement: 'rayon',    // 'rayon' | 'magasin'
  theme: 'auto',          // 'auto' | 'clair' | 'sombre'

  // Filtres (non persistés : on repart propre à chaque visite)
  rayonActif: 'tous',
  magasinActif: 'tous',
  recherche: '',
};

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
    localStorage.setItem(
      CLE_STOCKAGE,
      JSON.stringify({
        version: VERSION,
        articles: etat.articles,
        supprimes: [...etat.supprimes],
        preferences: {
          vue: etat.vue,
          groupement: etat.groupement,
          theme: etat.theme,
        },
      }),
    );
  } catch (err) {
    // Quota dépassé ou stockage désactivé (navigation privée) : l'application
    // reste utilisable pour la session en cours.
    console.warn('Sauvegarde impossible :', err);
  }
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
 */
function assainirArticle(brut) {
  if (!brut || typeof brut !== 'object') return null;

  const nom = typeof brut.nom === 'string' ? brut.nom : brut.name;
  if (typeof nom !== 'string' || nom.trim() === '') return null;

  const rayonBrut = brut.rayon ?? brut.cat;
  const rayon = RAYON_PAR_ID.has(rayonBrut) ? rayonBrut : RAYON_DEFAUT;

  const texte = (v) => (typeof v === 'string' ? v.trim().slice(0, 120) : '');

  return {
    id: typeof brut.id === 'string' && brut.id ? brut.id : nouvelIdentifiant(),
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

/** Charge l'état depuis le stockage local, ou installe le catalogue par défaut. */
export function charger() {
  let donnees = null;
  try {
    donnees = JSON.parse(localStorage.getItem(CLE_STOCKAGE) ?? 'null');
  } catch {
    donnees = null;
  }

  if (!donnees || !Array.isArray(donnees.articles)) {
    etat.articles = articlesDuCatalogue();
    return;
  }

  etat.supprimes = new Set(
    Array.isArray(donnees.supprimes) ? donnees.supprimes.filter((v) => typeof v === 'string') : [],
  );

  const assainis = donnees.articles.map(assainirArticle).filter(Boolean);
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

// --- Écriture --------------------------------------------------------------

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
  const article = assainirArticle({ id: nouvelIdentifiant(), nom, qte, magasin, rayon });
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
export function remplacerArticles(articlesBruts) {
  const assainis = articlesBruts.map(assainirArticle).filter(Boolean);
  if (assainis.length === 0) return 0;

  etat.articles = assainis;
  etat.supprimes = new Set(
    articlesDuCatalogue()
      .map((a) => a.id)
      .filter((id) => !assainis.some((a) => a.id === id)),
  );

  sauvegarder();
  notifier({ type: 'liste' });
  return assainis.length;
}

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
