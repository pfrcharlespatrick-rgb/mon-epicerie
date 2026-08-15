/**
 * Point d'entrée : branche l'interface sur l'état.
 *
 * Aucune donnée ne sort de l'appareil, et l'application n'appelle aucun
 * service externe.
 */

import { normaliser } from './catalogue.js';
import {
  etat,
  charger,
  surChangement,
  sauvegarderMaintenant,
  trouver,
  modifier,
  basculerCoche,
  ajouter,
  supprimer,
  toutReinitialiser,
  viderCoches,
  remplacerArticles,
  definirPreference,
  definirFiltre,
  rayons,
  magasins,
  ajouterRayon,
  modifierRayon,
  supprimerRayon,
  compterArticlesDuRayon,
  ajouterMagasin,
  modifierMagasin,
  supprimerMagasin,
  compterArticlesDuMagasin,
} from './etat.js';
import { initialiserRendu, rendreTout, rendreArticle, construireFiltres, icone } from './rendu.js';
import {
  texteRecapitulatif,
  copierTexte,
  telechargerSauvegarde,
  lireSauvegarde,
  preparerImpression,
} from './export.js';

// --- Thème -----------------------------------------------------------------

const THEMES = ['auto', 'clair', 'sombre'];
const LIBELLE_THEME = {
  auto: 'Thème : automatique',
  clair: 'Thème : clair',
  sombre: 'Thème : sombre',
};

function appliquerTheme() {
  if (etat.theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.dataset.theme = etat.theme;
  }

  const bouton = document.getElementById('btn-theme');
  bouton.title = LIBELLE_THEME[etat.theme];
  bouton.querySelector('.visuellement-cache').textContent =
    `${LIBELLE_THEME[etat.theme]}. Changer`;
}

// --- Notifications ---------------------------------------------------------

const zoneNotifications = document.getElementById('notifications');

/**
 * Affiche un message éphémère. `action` ajoute un bouton (« Annuler ») ; la
 * notification reste alors visible plus longtemps.
 */
function notifier(message, { type = 'succes', action = null, duree = null } = {}) {
  const boite = document.createElement('div');
  boite.className = `notification notification--${type}`;

  const texte = document.createElement('span');
  texte.className = 'notification__texte';
  texte.textContent = message;
  boite.append(texte);

  const fermer = () => {
    clearTimeout(minuterie);
    boite.remove();
  };

  if (action) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'btn btn--doux';
    bouton.textContent = action.libelle;
    bouton.addEventListener('click', () => {
      action.executer();
      fermer();
    });
    boite.append(bouton);
  }

  const minuterie = setTimeout(fermer, duree ?? (action ? 8000 : 3500));
  zoneNotifications.append(boite);

  // Au-delà de trois messages empilés, on retire les plus anciens.
  while (zoneNotifications.children.length > 3) {
    zoneNotifications.firstElementChild.remove();
  }
}

// --- Boîtes de dialogue ----------------------------------------------------

function ouvrir(dialogue) {
  if (!dialogue.open) dialogue.showModal();
}

/** Ferme au clic sur l'arrière-plan et via les boutons marqués `data-fermer`. */
function preparerDialogues() {
  for (const dialogue of document.querySelectorAll('dialog')) {
    dialogue.addEventListener('click', (evenement) => {
      if (evenement.target === dialogue) dialogue.close();
    });

    for (const bouton of dialogue.querySelectorAll('[data-fermer]')) {
      bouton.addEventListener('click', () => dialogue.close());
    }
  }
}

const dlgConfirmation = document.getElementById('dlg-confirmation');

/** Remplace `confirm()` par une boîte accessible et cohérente avec le reste. */
function confirmer({ titre, texte, valider = 'Confirmer' }) {
  return new Promise((resoudre) => {
    document.getElementById('confirmation-titre').textContent = titre;
    document.getElementById('confirmation-texte').textContent = texte;

    const bouton = document.getElementById('confirmation-valider');
    bouton.textContent = valider;

    let accepte = false;
    const surClic = () => {
      accepte = true;
      dlgConfirmation.close();
    };

    bouton.addEventListener('click', surClic, { once: true });
    dlgConfirmation.addEventListener(
      'close',
      () => {
        bouton.removeEventListener('click', surClic);
        resoudre(accepte);
      },
      { once: true },
    );

    ouvrir(dlgConfirmation);
  });
}

// --- Formulaire d'article (ajout et modification) --------------------------

const dlgArticle = document.getElementById('dlg-article');
const formArticle = document.getElementById('form-article');
const champArticleId = document.getElementById('article-id');
const champArticleNom = document.getElementById('article-nom');
const champArticleRayon = document.getElementById('article-rayon');
const champArticleMagasin = document.getElementById('article-magasin');
const champArticleQte = document.getElementById('article-qte');

function remplirSelecteurs() {
  // Les valeurs choisies doivent survivre à une reconstruction déclenchée
  // pendant que la boîte est ouverte.
  const rayonChoisi = champArticleRayon.value;
  const magasinChoisi = champArticleMagasin.value;

  champArticleRayon.replaceChildren(
    ...rayons().map((rayon) => new Option(`${rayon.emoji}  ${rayon.nom}`, rayon.id)),
  );

  champArticleMagasin.replaceChildren(
    new Option('Aucun magasin', ''),
    ...magasins().map((detaillant) => new Option(detaillant.nom, detaillant.nom)),
  );

  champArticleRayon.value = rayonChoisi;
  champArticleMagasin.value = magasinChoisi;
}

function ouvrirFormulaireArticle(article = null) {
  const modification = Boolean(article);

  document.getElementById('dlg-article-libelle').textContent = modification
    ? 'Modifier l’article'
    : 'Ajouter un article';
  document.getElementById('article-valider').textContent = modification
    ? 'Enregistrer'
    : 'Ajouter';

  champArticleId.value = article?.id ?? '';
  champArticleNom.value = article?.nom ?? '';
  champArticleRayon.value = article?.rayon ?? rayons()[0].id;
  champArticleMagasin.value = article?.magasin ?? '';
  champArticleQte.value = article?.qte ?? '';

  ouvrir(dlgArticle);
  champArticleNom.focus();
  champArticleNom.select();
}

formArticle.addEventListener('submit', () => {
  const champs = {
    nom: champArticleNom.value.trim(),
    rayon: champArticleRayon.value,
    magasin: champArticleMagasin.value,
    qte: champArticleQte.value.trim(),
  };

  if (!champs.nom) return;

  if (champArticleId.value) {
    modifier(champArticleId.value, champs);
    notifier('Article mis à jour.');
  } else {
    ajouter(champs);
    notifier(`« ${champs.nom} » ajouté.`);
  }
});

// --- Choix rapide du magasin ----------------------------------------------

const dlgMagasin = document.getElementById('dlg-magasin');
const grilleMagasins = document.getElementById('grille-magasins');
let articleMagasinActif = null;

function construireGrilleMagasins() {
  grilleMagasins.replaceChildren(
    ...magasins().map((detaillant) => {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'choix-magasin';
      bouton.style.setProperty('--h', detaillant.teinte);
      bouton.dataset.magasin = detaillant.nom;
      bouton.setAttribute('aria-pressed', 'false');

      const libelle = document.createElement('span');
      libelle.textContent = detaillant.nom;
      bouton.append(libelle, icone('i-chevron', 12, 2.4));
      return bouton;
    }),
  );
}

function ouvrirChoixMagasin(article) {
  articleMagasinActif = article.id;
  document.getElementById('magasin-article-nom').textContent = article.nom;

  for (const bouton of grilleMagasins.children) {
    bouton.setAttribute('aria-pressed', String(bouton.dataset.magasin === article.magasin));
  }

  ouvrir(dlgMagasin);
}

grilleMagasins.addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-magasin]');
  if (!bouton || !articleMagasinActif) return;

  modifier(articleMagasinActif, { magasin: bouton.dataset.magasin });
  dlgMagasin.close();
});

document.getElementById('btn-retirer-magasin').addEventListener('click', () => {
  if (articleMagasinActif) modifier(articleMagasinActif, { magasin: '' });
  dlgMagasin.close();
});

dlgMagasin.addEventListener('close', () => {
  articleMagasinActif = null;
});

// --- Choix rapide de la quantité ------------------------------------------

const dlgQte = document.getElementById('dlg-qte');
const champQte = document.getElementById('qte-saisie');
let articleQteActif = null;

function ouvrirChoixQuantite(article) {
  articleQteActif = article.id;
  document.getElementById('qte-article-nom').textContent = article.nom;
  champQte.value = article.qte ?? '';
  ouvrir(dlgQte);
  champQte.focus();
  champQte.select();
}

document.getElementById('form-qte').addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-qte], [data-ajuster]');
  if (!bouton) return;

  if (bouton.dataset.qte !== undefined) {
    champQte.value = bouton.dataset.qte;
    return;
  }

  const pas = Number(bouton.dataset.ajuster);
  const actuel = Number.parseInt(champQte.value.trim(), 10);
  champQte.value = Number.isNaN(actuel)
    ? String(Math.max(1, pas))
    : String(Math.max(1, actuel + pas));
});

document.getElementById('form-qte').addEventListener('submit', () => {
  if (articleQteActif) modifier(articleQteActif, { qte: champQte.value.trim() });
});

document.getElementById('btn-effacer-qte').addEventListener('click', () => {
  if (articleQteActif) modifier(articleQteActif, { qte: '' });
  dlgQte.close();
});

dlgQte.addEventListener('close', () => {
  articleQteActif = null;
});

// --- Actions sur la liste (délégation d'événements) ------------------------

document.getElementById('liste').addEventListener('click', async (evenement) => {
  const bouton = evenement.target.closest('[data-action]');
  if (!bouton) return;

  const id = bouton.closest('.article')?.dataset.id;
  const article = id ? trouver(id) : null;
  if (!article) return;

  switch (bouton.dataset.action) {
    case 'basculer':
      basculerCoche(id);
      break;

    case 'magasin':
      ouvrirChoixMagasin(article);
      break;

    case 'quantite':
      ouvrirChoixQuantite(article);
      break;

    case 'editer':
      ouvrirFormulaireArticle(article);
      break;

    case 'supprimer': {
      const nom = article.nom;
      const annulation = supprimer(id);
      if (!annulation) break;
      notifier(`« ${nom} » supprimé.`, {
        action: { libelle: 'Annuler', executer: annulation.restaurer },
      });
      break;
    }
  }
});

// --- Vue, filtres et recherche --------------------------------------------

const ongletPreparee = document.getElementById('onglet-preparee');
const ongletCatalogue = document.getElementById('onglet-catalogue');

function changerVue(vue) {
  definirPreference('vue', vue);
  (vue === 'preparee' ? ongletPreparee : ongletCatalogue).focus();
}

ongletPreparee.addEventListener('click', () => definirPreference('vue', 'preparee'));
ongletCatalogue.addEventListener('click', () => definirPreference('vue', 'catalogue'));

// Navigation au clavier entre les deux onglets, comme l'attend un `tablist`.
for (const onglet of [ongletPreparee, ongletCatalogue]) {
  onglet.addEventListener('keydown', (evenement) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evenement.key)) return;
    evenement.preventDefault();
    changerVue(
      evenement.key === 'ArrowRight' || evenement.key === 'End' ? 'catalogue' : 'preparee',
    );
  });
}

document.getElementById('btn-vers-catalogue').addEventListener('click', () => {
  definirPreference('vue', 'catalogue');
});

const btnFiltres = document.getElementById('btn-filtres');
const panneauFiltres = document.getElementById('filtres');

btnFiltres.addEventListener('click', () => {
  const ouvertMaintenant = panneauFiltres.hidden;
  panneauFiltres.hidden = !ouvertMaintenant;
  btnFiltres.setAttribute('aria-expanded', String(ouvertMaintenant));
});

for (const groupe of [
  document.getElementById('filtres-magasins'),
  document.getElementById('filtres-rayons'),
]) {
  groupe.addEventListener('click', (evenement) => {
    const puce = evenement.target.closest('[data-filtre]');
    if (!puce) return;
    definirFiltre(puce.dataset.filtre, puce.dataset.valeur);
  });
}

panneauFiltres.addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-groupement]');
  if (!bouton) return;
  definirPreference('groupement', bouton.dataset.groupement);
});

const champRecherche = document.getElementById('champ-recherche');
const btnEffacerRecherche = document.getElementById('btn-effacer-recherche');

let minuterieRecherche = null;
champRecherche.addEventListener('input', () => {
  const valeur = champRecherche.value;
  btnEffacerRecherche.hidden = valeur === '';

  // Une frappe rapide ne doit pas provoquer un rendu par caractère.
  clearTimeout(minuterieRecherche);
  minuterieRecherche = setTimeout(() => definirFiltre('recherche', normaliser(valeur)), 120);
});

btnEffacerRecherche.addEventListener('click', () => {
  champRecherche.value = '';
  btnEffacerRecherche.hidden = true;
  definirFiltre('recherche', '');
  champRecherche.focus();
});

// --- Actions de l'en-tête --------------------------------------------------

document.getElementById('btn-theme').addEventListener('click', () => {
  const suivant = THEMES[(THEMES.indexOf(etat.theme) + 1) % THEMES.length];
  definirPreference('theme', suivant);
  appliquerTheme();
  notifier(LIBELLE_THEME[suivant], { duree: 1800 });
});

document.getElementById('btn-vider-coches').addEventListener('click', async () => {
  const nombre = etat.articles.filter((a) => a.coche).length;
  if (nombre === 0) {
    notifier('Aucun article coché.', { type: 'erreur' });
    return;
  }

  const accepte = await confirmer({
    titre: 'Retirer les articles cochés',
    texte: `${nombre} article(s) cochés seront retirés de la liste préparée. Leur quantité et leur magasin seront effacés. Les produits restent dans le catalogue.`,
    valider: 'Retirer',
  });

  if (!accepte) return;
  viderCoches();
  notifier(`${nombre} article(s) retirés.`);
});

document.getElementById('btn-reinitialiser').addEventListener('click', async () => {
  const accepte = await confirmer({
    titre: 'Repartir à neuf',
    texte:
      'Toutes les quantités, tous les magasins et toutes les cases cochées seront effacés. Le catalogue de produits, lui, est conservé.',
    valider: 'Tout effacer',
  });

  if (!accepte) return;
  toutReinitialiser();
  notifier('Liste remise à zéro.');
});

document.getElementById('btn-ajouter').addEventListener('click', () => {
  ouvrirFormulaireArticle();
});

// --- Exportation -----------------------------------------------------------

const dlgExport = document.getElementById('dlg-export');

document.getElementById('btn-export').addEventListener('click', () => ouvrir(dlgExport));

// Ctrl+P direct, sans passer par la boîte d'exportation : l'en-tête doit tout
// de même porter la bonne date.
window.addEventListener('beforeprint', preparerImpression);

document.getElementById('btn-imprimer').addEventListener('click', () => {
  const vuePrecedente = etat.vue;
  dlgExport.close();

  // On imprime toujours la liste préparée, jamais le catalogue entier.
  definirPreference('vue', 'preparee');
  preparerImpression();

  const restaurer = () => definirPreference('vue', vuePrecedente);
  window.addEventListener('afterprint', restaurer, { once: true });

  // Laisse un cycle de rendu avant d'ouvrir la boîte d'impression.
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
});

document.getElementById('btn-copier').addEventListener('click', async () => {
  const texte = texteRecapitulatif();
  if (!texte) {
    notifier('Votre liste préparée est vide.', { type: 'erreur' });
    return;
  }

  const reussi = await copierTexte(texte);
  dlgExport.close();
  notifier(
    reussi ? 'Liste copiée dans le presse-papiers.' : 'La copie a échoué.',
    { type: reussi ? 'succes' : 'erreur' },
  );
});

document.getElementById('btn-sauvegarde').addEventListener('click', () => {
  telechargerSauvegarde();
  dlgExport.close();
  notifier('Sauvegarde téléchargée.');
});

const champFichier = document.getElementById('champ-fichier');

document.getElementById('btn-restaurer').addEventListener('click', () => champFichier.click());

champFichier.addEventListener('change', async () => {
  const fichier = champFichier.files?.[0];
  champFichier.value = '';
  if (!fichier) return;

  let contenu;
  try {
    contenu = await lireSauvegarde(fichier);
  } catch (erreur) {
    notifier(erreur.message, { type: 'erreur' });
    return;
  }

  const persos = (contenu.rayonsPerso?.length ?? 0) + (contenu.magasinsPerso?.length ?? 0);
  const accepte = await confirmer({
    titre: 'Restaurer la sauvegarde',
    texte:
      `Le fichier contient ${contenu.articles.length} article(s)` +
      (persos > 0 ? ` et ${persos} rayon(s) ou magasin(s) personnalisés` : '') +
      '. Votre liste actuelle sera entièrement remplacée.',
    valider: 'Remplacer',
  });

  if (!accepte) return;

  const nombre = remplacerArticles(contenu);
  dlgExport.close();
  notifier(
    nombre > 0 ? `${nombre} article(s) restaurés.` : 'Aucun article exploitable dans ce fichier.',
    { type: nombre > 0 ? 'succes' : 'erreur' },
  );
});

// --- Mes rayons et magasins ------------------------------------------------

const dlgTaxonomie = document.getElementById('dlg-taxonomie');

const formRayon = document.getElementById('form-rayon');
const champRayonId = document.getElementById('rayon-id');
const champRayonNom = document.getElementById('rayon-nom');
const champRayonEmoji = document.getElementById('rayon-emoji');
const btnRayonAnnuler = document.getElementById('rayon-annuler');

const formMagasin = document.getElementById('form-magasin');
const champMagasinActuel = document.getElementById('magasin-nom-actuel');
const champMagasinNom = document.getElementById('magasin-nom');
const btnMagasinAnnuler = document.getElementById('magasin-annuler');
const grilleTeintes = document.getElementById('teintes');

/** Teintes proposées, réparties sur le cercle chromatique. */
const TEINTES = [0, 20, 40, 60, 96, 132, 152, 172, 190, 210, 232, 258, 282, 310, 340];
let teinteChoisie = 210;

function construireTeintes() {
  grilleTeintes.replaceChildren(
    ...TEINTES.map((teinte) => {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'teinte';
      bouton.style.setProperty('--h', teinte);
      bouton.dataset.teinte = teinte;
      bouton.setAttribute('role', 'radio');
      bouton.setAttribute('aria-checked', String(teinte === teinteChoisie));
      bouton.setAttribute('aria-label', `Couleur ${TEINTES.indexOf(teinte) + 1}`);
      return bouton;
    }),
  );
}

function choisirTeinte(teinte) {
  teinteChoisie = teinte;
  for (const bouton of grilleTeintes.children) {
    bouton.setAttribute('aria-checked', String(Number(bouton.dataset.teinte) === teinte));
  }
}

grilleTeintes.addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-teinte]');
  if (bouton) choisirTeinte(Number(bouton.dataset.teinte));
});

/** Fabrique une ligne « emblème — nom — usage — modifier — supprimer ». */
function creerLigneReglage({ embleme, teinte, nom, usage, surModifier, surSupprimer }) {
  const li = document.createElement('li');
  li.className = 'reglage__element';

  const marque = document.createElement('span');
  marque.className = 'reglage__embleme';
  marque.setAttribute('aria-hidden', 'true');
  if (teinte === undefined) {
    marque.textContent = embleme;
  } else {
    marque.classList.add('reglage__embleme--teinte');
    marque.style.setProperty('--h', teinte);
  }

  const libelle = document.createElement('span');
  libelle.className = 'reglage__nom';
  libelle.textContent = nom;

  const compte = document.createElement('span');
  compte.className = 'reglage__usage';
  compte.textContent = usage;

  const editer = document.createElement('button');
  editer.type = 'button';
  editer.className = 'btn btn--icone';
  editer.setAttribute('aria-label', `Modifier ${nom}`);
  editer.append(icone('i-crayon', 14));
  editer.addEventListener('click', surModifier);

  const jeter = document.createElement('button');
  jeter.type = 'button';
  jeter.className = 'btn btn--icone btn--danger';
  jeter.setAttribute('aria-label', `Supprimer ${nom}`);
  jeter.append(icone('i-corbeille', 14));
  jeter.addEventListener('click', surSupprimer);

  li.append(marque, libelle, compte, editer, jeter);
  return li;
}

/** Redessine les deux listes de la boîte de gestion. */
function rendreTaxonomie() {
  const listeRayons = document.getElementById('liste-rayons');
  const listeMagasins = document.getElementById('liste-magasins');

  listeRayons.replaceChildren(
    ...etat.rayonsPerso.map((rayon) => {
      const n = compterArticlesDuRayon(rayon.id);
      return creerLigneReglage({
        embleme: rayon.emoji,
        nom: rayon.nom,
        usage: n === 0 ? '' : `${n} article${n > 1 ? 's' : ''}`,
        surModifier: () => commencerEditionRayon(rayon),
        surSupprimer: () => demanderSuppressionRayon(rayon),
      });
    }),
  );

  listeMagasins.replaceChildren(
    ...etat.magasinsPerso.map((magasin) => {
      const n = compterArticlesDuMagasin(magasin.nom);
      return creerLigneReglage({
        teinte: magasin.teinte,
        nom: magasin.nom,
        usage: n === 0 ? '' : `${n} article${n > 1 ? 's' : ''}`,
        surModifier: () => commencerEditionMagasin(magasin),
        surSupprimer: () => demanderSuppressionMagasin(magasin),
      });
    }),
  );
}

// --- Formulaire des rayons ---

function reinitialiserFormulaireRayon() {
  formRayon.reset();
  champRayonId.value = '';
  champRayonEmoji.value = '🏷️';
  btnRayonAnnuler.hidden = true;
  document.getElementById('rayon-valider').textContent = 'Ajouter le rayon';
}

function commencerEditionRayon(rayon) {
  champRayonId.value = rayon.id;
  champRayonNom.value = rayon.nom;
  champRayonEmoji.value = rayon.emoji;
  btnRayonAnnuler.hidden = false;
  document.getElementById('rayon-valider').textContent = 'Enregistrer';
  champRayonNom.focus();
  champRayonNom.select();
}

async function demanderSuppressionRayon(rayon) {
  const n = compterArticlesDuRayon(rayon.id);
  const accepte = await confirmer({
    titre: `Supprimer « ${rayon.nom} »`,
    texte:
      n === 0
        ? 'Ce rayon est vide, rien d’autre ne sera touché.'
        : `${n} article(s) s’y trouvent : ils seront déplacés dans « Divers & Animaux », pas supprimés.`,
    valider: 'Supprimer',
  });

  if (!accepte) return;

  const { deplaces } = supprimerRayon(rayon.id);
  reinitialiserFormulaireRayon();
  notifier(
    deplaces === 0
      ? `Rayon « ${rayon.nom} » supprimé.`
      : `Rayon supprimé, ${deplaces} article(s) déplacés dans « Divers ».`,
  );
}

formRayon.addEventListener('submit', (evenement) => {
  evenement.preventDefault();

  const champs = { nom: champRayonNom.value, emoji: champRayonEmoji.value };
  const resultat = champRayonId.value
    ? modifierRayon(champRayonId.value, champs)
    : ajouterRayon(champs);

  if (resultat.erreur) {
    notifier(resultat.erreur, { type: 'erreur' });
    return;
  }

  const creation = !champRayonId.value;
  reinitialiserFormulaireRayon();
  notifier(creation ? `Rayon « ${resultat.rayon.nom} » ajouté.` : 'Rayon mis à jour.');
});

btnRayonAnnuler.addEventListener('click', reinitialiserFormulaireRayon);

formRayon.addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-emoji]');
  if (bouton) champRayonEmoji.value = bouton.dataset.emoji;
});

// --- Formulaire des magasins ---

function reinitialiserFormulaireMagasin() {
  formMagasin.reset();
  champMagasinActuel.value = '';
  choisirTeinte(210);
  btnMagasinAnnuler.hidden = true;
  document.getElementById('magasin-valider').textContent = 'Ajouter le magasin';
}

function commencerEditionMagasin(magasin) {
  champMagasinActuel.value = magasin.nom;
  champMagasinNom.value = magasin.nom;
  choisirTeinte(magasin.teinte);
  btnMagasinAnnuler.hidden = false;
  document.getElementById('magasin-valider').textContent = 'Enregistrer';
  champMagasinNom.focus();
  champMagasinNom.select();
}

async function demanderSuppressionMagasin(magasin) {
  const n = compterArticlesDuMagasin(magasin.nom);
  const accepte = await confirmer({
    titre: `Supprimer « ${magasin.nom} »`,
    texte:
      n === 0
        ? 'Aucun article n’y est rattaché.'
        : `${n} article(s) y sont rattachés : ils resteront dans votre liste, simplement sans magasin.`,
    valider: 'Supprimer',
  });

  if (!accepte) return;

  const { liberes } = supprimerMagasin(magasin.nom);
  reinitialiserFormulaireMagasin();
  notifier(
    liberes === 0
      ? `Magasin « ${magasin.nom} » supprimé.`
      : `Magasin supprimé, ${liberes} article(s) sont désormais sans magasin.`,
  );
}

formMagasin.addEventListener('submit', (evenement) => {
  evenement.preventDefault();

  const champs = { nom: champMagasinNom.value, teinte: teinteChoisie };
  const resultat = champMagasinActuel.value
    ? modifierMagasin(champMagasinActuel.value, champs)
    : ajouterMagasin(champs);

  if (resultat.erreur) {
    notifier(resultat.erreur, { type: 'erreur' });
    return;
  }

  const creation = !champMagasinActuel.value;
  reinitialiserFormulaireMagasin();
  notifier(creation ? `Magasin « ${resultat.magasin.nom} » ajouté.` : 'Magasin mis à jour.');
});

btnMagasinAnnuler.addEventListener('click', reinitialiserFormulaireMagasin);

document.getElementById('btn-taxonomie').addEventListener('click', () => {
  reinitialiserFormulaireRayon();
  reinitialiserFormulaireMagasin();
  rendreTaxonomie();
  ouvrir(dlgTaxonomie);
});

// --- Raccourcis clavier ----------------------------------------------------

document.addEventListener('keydown', (evenement) => {
  if (evenement.ctrlKey || evenement.metaKey || evenement.altKey) return;

  const cible = evenement.target;
  const saisieEnCours =
    cible instanceof HTMLElement &&
    (cible.tagName === 'INPUT' || cible.tagName === 'SELECT' || cible.isContentEditable);
  if (saisieEnCours || document.querySelector('dialog[open]')) return;

  if (evenement.key === '/') {
    evenement.preventDefault();
    champRecherche.focus();
    champRecherche.select();
  }
});

// --- Démarrage -------------------------------------------------------------

charger();
appliquerTheme();
remplirSelecteurs();
construireGrilleMagasins();
construireTeintes();
preparerDialogues();
initialiserRendu();
rendreTout();

surChangement((portee) => {
  // Un rayon ou un magasin qui change touche les filtres, les menus déroulants,
  // la grille de choix rapide et la boîte de gestion elle-même.
  if (portee.type === 'taxonomie') {
    construireFiltres();
    remplirSelecteurs();
    construireGrilleMagasins();
    if (dlgTaxonomie.open) rendreTaxonomie();
    rendreTout();
    return;
  }

  if (portee.type === 'article') {
    const article = trouver(portee.id);
    if (article && rendreArticle(article)) return;
  }

  rendreTout();
});

// Les écritures sont différées : on force la sauvegarde avant de perdre la page.
window.addEventListener('pagehide', sauvegarderMaintenant);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sauvegarderMaintenant();
});

// Mise en cache pour l'usage hors ligne (à l'épicerie, le réseau est capricieux).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* Le hors-ligne est un bonus : son échec ne doit rien casser. */
    });
  });
}
