/**
 * Rendu de la liste et des filtres.
 *
 * Tout est construit avec les API DOM plutôt qu'avec `innerHTML` : le nom d'un
 * article saisi par l'utilisateur ne peut jamais être interprété comme du HTML.
 */

import { RAYONS, DETAILLANTS, RAYON_PAR_ID, DETAILLANT_PAR_NOM, normaliser } from './catalogue.js';
import { etat, estPrepare, articlesPrepares } from './etat.js';

const SANS_MAGASIN = '__sans_magasin__';

/** Références DOM, remplies par `initialiserRendu()`. */
const dom = {};

/** Crée une icône du jeu intégré. */
export function icone(nom, taille = 16, epaisseur = 1.8) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', taille);
  svg.setAttribute('height', taille);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', epaisseur);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${nom}`);
  svg.append(use);
  return svg;
}

export function initialiserRendu() {
  Object.assign(dom, {
    liste: document.getElementById('liste'),
    vide: document.getElementById('etat-vide'),
    videTitre: document.getElementById('vide-titre'),
    videTexte: document.getElementById('vide-texte'),
    versCatalogue: document.getElementById('btn-vers-catalogue'),

    filtresMagasins: document.getElementById('filtres-magasins'),
    filtresRayons: document.getElementById('filtres-rayons'),
    compteFiltres: document.getElementById('compte-filtres'),

    barre: document.getElementById('progression-barre'),
    texteProgression: document.getElementById('progression-texte'),
    comptePreparee: document.getElementById('compte-preparee'),
    compteCatalogue: document.getElementById('compte-catalogue'),

    ongletPreparee: document.getElementById('onglet-preparee'),
    ongletCatalogue: document.getElementById('onglet-catalogue'),
  });

  construireFiltres();
}

// --- Sélection des articles ------------------------------------------------

/** Les articles concernés par la vue courante, avant filtrage. */
function articlesDeBase() {
  return etat.vue === 'preparee' ? articlesPrepares() : etat.articles;
}

/** Un article passe-t-il les filtres et la recherche en cours ? */
function correspond(article) {
  if (etat.rayonActif !== 'tous' && article.rayon !== etat.rayonActif) return false;

  if (etat.magasinActif !== 'tous') {
    const attendu = etat.magasinActif === SANS_MAGASIN ? '' : etat.magasinActif;
    if (article.magasin !== attendu) return false;
  }

  if (etat.recherche) {
    const cible = normaliser(`${article.nom} ${article.qte} ${article.magasin}`);
    if (!cible.includes(etat.recherche)) return false;
  }

  return true;
}

/** Les articles réellement affichés. */
function articlesVisibles() {
  return articlesDeBase().filter(correspond);
}

// --- Filtres ---------------------------------------------------------------

/** Construit les puces de filtre une seule fois ; seuls les compteurs bougent. */
function construireFiltres() {
  const magasins = [
    { cle: 'tous', libelle: 'Tous' },
    ...DETAILLANTS.map((d) => ({ cle: d.nom, libelle: d.nom })),
    { cle: SANS_MAGASIN, libelle: 'Sans magasin' },
  ];

  for (const { cle, libelle } of magasins) {
    dom.filtresMagasins.append(creerPuce(libelle, cle, 'magasinActif'));
  }

  dom.filtresRayons.append(creerPuce('Tous', 'tous', 'rayonActif'));
  for (const rayon of RAYONS) {
    dom.filtresRayons.append(creerPuce(`${rayon.emoji} ${rayon.nom}`, rayon.id, 'rayonActif'));
  }

  // Les puces ne changent plus : on garde les références plutôt que de
  // réinterroger le document à chaque case cochée.
  dom.pucesMagasins = [...dom.filtresMagasins.querySelectorAll('.puce')];
  dom.pucesRayons = [...dom.filtresRayons.querySelectorAll('.puce')];
  dom.pucesGroupement = [...document.querySelectorAll('[data-groupement]')];
}

function creerPuce(libelle, cle, champ) {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'puce';
  bouton.dataset.filtre = champ;
  bouton.dataset.valeur = cle;
  bouton.setAttribute('aria-pressed', 'false');

  const texte = document.createElement('span');
  texte.textContent = libelle;
  bouton.append(texte);

  if (cle !== 'tous') {
    const compte = document.createElement('span');
    compte.className = 'puce__compte';
    compte.dataset.role = 'compte';
    bouton.append(compte);
  }

  return bouton;
}

/** Applique l'état actif et les compteurs à une rangée de puces. */
function majPuces(puces, valeurActive, compteurs) {
  for (const bouton of puces) {
    const valeur = bouton.dataset.valeur;
    bouton.setAttribute('aria-pressed', String(valeurActive === valeur));

    const compte = bouton.querySelector('[data-role="compte"]');
    if (!compte) continue;

    const n = compteurs.get(valeur) ?? 0;
    compte.textContent = n;
    compte.hidden = n === 0;
  }
}

/** Met à jour l'état actif et les compteurs des puces. */
function majFiltres() {
  // Un seul parcours des articles alimente tous les compteurs. La version
  // naïve filtrait la liste une fois par puce — trente fois — et cette
  // fonction tourne à chaque case cochée.
  const parMagasin = new Map();
  const parRayon = new Map();

  for (const article of articlesDeBase()) {
    const magasin = article.magasin || SANS_MAGASIN;
    parMagasin.set(magasin, (parMagasin.get(magasin) ?? 0) + 1);
    parRayon.set(article.rayon, (parRayon.get(article.rayon) ?? 0) + 1);
  }

  majPuces(dom.pucesMagasins, etat.magasinActif, parMagasin);
  majPuces(dom.pucesRayons, etat.rayonActif, parRayon);

  for (const bouton of dom.pucesGroupement) {
    bouton.setAttribute('aria-pressed', String(etat.groupement === bouton.dataset.groupement));
  }

  const actifs =
    (etat.rayonActif !== 'tous' ? 1 : 0) + (etat.magasinActif !== 'tous' ? 1 : 0);
  dom.compteFiltres.textContent = actifs;
  dom.compteFiltres.hidden = actifs === 0;
}

// --- Compteurs et progression ---------------------------------------------

/**
 * La progression porte toujours sur la liste préparée — c'est-à-dire sur les
 * courses à faire — même quand on consulte le catalogue.
 */
function majProgression() {
  const prepares = articlesPrepares();
  const total = prepares.length;
  const coches = prepares.filter((a) => a.coche).length;
  const pourcent = total > 0 ? Math.round((coches / total) * 100) : 0;

  dom.barre.style.width = `${pourcent}%`;
  dom.barre.setAttribute('aria-valuenow', String(pourcent));
  dom.texteProgression.textContent =
    total === 0 ? 'Aucun article retenu' : `${coches} sur ${total} · ${total - coches} restants`;

  dom.comptePreparee.textContent = total;
  dom.compteCatalogue.textContent = etat.articles.length;

  const preparee = etat.vue === 'preparee';
  dom.ongletPreparee.setAttribute('aria-selected', String(preparee));
  dom.ongletCatalogue.setAttribute('aria-selected', String(!preparee));
  dom.ongletPreparee.tabIndex = preparee ? 0 : -1;
  dom.ongletCatalogue.tabIndex = preparee ? -1 : 0;
  dom.liste.setAttribute(
    'aria-labelledby',
    preparee ? 'onglet-preparee' : 'onglet-catalogue',
  );
}

// --- Construction d'une ligne ---------------------------------------------

function creerLigne(article) {
  const li = document.createElement('li');
  li.className = 'article';
  li.dataset.id = article.id;

  const bascule = document.createElement('button');
  bascule.type = 'button';
  bascule.className = 'article__bascule';
  bascule.dataset.action = 'basculer';

  const case_ = document.createElement('span');
  case_.className = 'case';
  case_.append(icone('i-coche', 13, 3));

  const nom = document.createElement('span');
  nom.className = 'article__nom';
  nom.textContent = article.nom;

  bascule.append(case_, nom);

  const etiquettes = document.createElement('div');
  etiquettes.className = 'article__etiquettes';

  const magasin = document.createElement('button');
  magasin.type = 'button';
  magasin.className = 'etiquette etiquette--magasin';
  magasin.dataset.action = 'magasin';
  magasin.append(icone('i-magasin', 11, 2));
  magasin.append(document.createElement('span'));

  const qte = document.createElement('button');
  qte.type = 'button';
  qte.className = 'etiquette etiquette--qte';
  qte.dataset.action = 'quantite';
  qte.append(document.createElement('span'));

  etiquettes.append(magasin, qte);

  const actions = document.createElement('div');
  actions.className = 'article__actions';

  const editer = document.createElement('button');
  editer.type = 'button';
  editer.className = 'btn btn--icone';
  editer.dataset.action = 'editer';
  editer.append(icone('i-crayon', 15));

  const supprimer = document.createElement('button');
  supprimer.type = 'button';
  supprimer.className = 'btn btn--icone btn--danger';
  supprimer.dataset.action = 'supprimer';
  supprimer.append(icone('i-corbeille', 15));

  actions.append(editer, supprimer);
  li.append(bascule, etiquettes, actions);

  majLigne(li, article);
  return li;
}

/** Applique l'état d'un article à sa ligne, sans la reconstruire. */
function majLigne(li, article) {
  li.dataset.coche = String(article.coche);

  const bascule = li.querySelector('.article__bascule');
  bascule.setAttribute('aria-pressed', String(article.coche));
  bascule.setAttribute(
    'aria-label',
    `${article.nom} — ${article.coche ? 'dans le panier' : 'à acheter'}`,
  );
  bascule.querySelector('.article__nom').textContent = article.nom;

  const magasin = li.querySelector('.etiquette--magasin');
  const teinte = DETAILLANT_PAR_NOM.get(article.magasin)?.teinte;
  magasin.dataset.rempli = String(Boolean(article.magasin));
  magasin.classList.toggle('etiquette--vide', !article.magasin);
  magasin.style.setProperty('--h', teinte ?? 220);
  magasin.querySelector('span').textContent = article.magasin || 'Magasin';
  magasin.setAttribute(
    'aria-label',
    article.magasin
      ? `Magasin de ${article.nom} : ${article.magasin}. Modifier`
      : `Choisir un magasin pour ${article.nom}`,
  );

  const qte = li.querySelector('.etiquette--qte');
  qte.dataset.rempli = String(Boolean(article.qte));
  qte.classList.toggle('etiquette--vide', !article.qte);
  qte.querySelector('span').textContent = article.qte || 'Qté';
  qte.setAttribute(
    'aria-label',
    article.qte
      ? `Quantité de ${article.nom} : ${article.qte}. Modifier`
      : `Indiquer une quantité pour ${article.nom}`,
  );

  li.querySelector('[data-action="editer"]').setAttribute('aria-label', `Modifier ${article.nom}`);
  li.querySelector('[data-action="supprimer"]').setAttribute('aria-label', `Supprimer ${article.nom}`);
}

// --- Groupes ---------------------------------------------------------------

/** Répartit les articles visibles en groupes ordonnés, selon la préférence. */
function grouper(articles) {
  const groupes = new Map();

  if (etat.groupement === 'magasin') {
    for (const detaillant of DETAILLANTS) {
      groupes.set(detaillant.nom, { titre: detaillant.nom, emoji: '🏪', articles: [] });
    }
    groupes.set(SANS_MAGASIN, { titre: 'Magasin à déterminer', emoji: '❓', articles: [] });

    for (const article of articles) {
      const cle = article.magasin && groupes.has(article.magasin) ? article.magasin : SANS_MAGASIN;
      groupes.get(cle).articles.push(article);
    }
  } else {
    for (const rayon of RAYONS) {
      groupes.set(rayon.id, { titre: rayon.nom, emoji: rayon.emoji, articles: [] });
    }

    for (const article of articles) {
      const cle = groupes.has(article.rayon) ? article.rayon : 'misc';
      groupes.get(cle).articles.push(article);
    }
  }

  return [...groupes.values()].filter((g) => g.articles.length > 0);
}

function creerGroupe(groupe) {
  const section = document.createElement('section');
  section.className = 'groupe';

  const entete = document.createElement('div');
  entete.className = 'groupe__entete';

  const identite = document.createElement('div');
  identite.className = 'groupe__identite';

  const embleme = document.createElement('span');
  embleme.className = 'groupe__embleme';
  embleme.textContent = groupe.emoji;
  embleme.setAttribute('aria-hidden', 'true');

  const titre = document.createElement('h2');
  titre.className = 'groupe__titre';
  titre.textContent = groupe.titre;

  identite.append(embleme, titre);

  const restants = groupe.articles.filter((a) => !a.coche).length;
  const compte = document.createElement('span');
  compte.className = 'groupe__compte';
  compte.dataset.complet = String(restants === 0);
  compte.textContent = `${restants} / ${groupe.articles.length}`;
  compte.setAttribute(
    'aria-label',
    `${restants} article(s) restant(s) sur ${groupe.articles.length}`,
  );

  entete.append(identite, compte);

  const ul = document.createElement('ul');
  for (const article of groupe.articles) ul.append(creerLigne(article));

  section.append(entete, ul);
  return section;
}

/** Recalcule le « restants / total » de l'en-tête d'un groupe. */
function majCompteGroupe(section) {
  const lignes = [...section.querySelectorAll('.article')];
  const restants = lignes.filter((li) => li.dataset.coche !== 'true').length;
  const compte = section.querySelector('.groupe__compte');
  compte.dataset.complet = String(restants === 0);
  compte.textContent = `${restants} / ${lignes.length}`;
  compte.setAttribute('aria-label', `${restants} article(s) restant(s) sur ${lignes.length}`);
}

// --- Rendu complet ---------------------------------------------------------

export function rendreTout() {
  majFiltres();
  majProgression();

  const visibles = articlesVisibles();
  const fragment = document.createDocumentFragment();
  for (const groupe of grouper(visibles)) fragment.append(creerGroupe(groupe));

  dom.liste.replaceChildren(fragment);
  majEtatVide(visibles.length);
}

function majEtatVide(nombreVisible) {
  const listeVide = nombreVisible === 0;
  dom.vide.hidden = !listeVide;
  dom.liste.hidden = listeVide;
  if (!listeVide) return;

  const aucunPrepare = etat.vue === 'preparee' && articlesPrepares().length === 0;
  const filtre = Boolean(etat.recherche) || etat.rayonActif !== 'tous' || etat.magasinActif !== 'tous';

  if (aucunPrepare && !filtre) {
    dom.videTitre.textContent = 'Votre liste est vide';
    dom.videTexte.textContent =
      'Ouvrez le catalogue pour indiquer une quantité ou un magasin sur les produits dont vous avez besoin cette semaine.';
    dom.versCatalogue.hidden = false;
  } else {
    dom.videTitre.textContent = 'Aucun article trouvé';
    dom.videTexte.textContent =
      'Aucun produit ne correspond à la recherche ou aux filtres en cours.';
    dom.versCatalogue.hidden = true;
  }
}

/**
 * Met à jour une seule ligne. Retourne `false` si un rendu complet est
 * nécessaire — parce que l'article vient d'entrer dans la liste préparée ou
 * d'en sortir, ou qu'il ne passe plus les filtres.
 */
export function rendreArticle(article) {
  const li = dom.liste.querySelector(`.article[data-id="${CSS.escape(article.id)}"]`);
  const devraitApparaitre =
    (etat.vue === 'catalogue' || estPrepare(article)) && correspond(article);

  if (!li || !devraitApparaitre) return false;

  majLigne(li, article);
  majCompteGroupe(li.closest('.groupe'));
  majFiltres();
  majProgression();
  return true;
}
