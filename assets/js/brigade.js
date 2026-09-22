/**
 * La Brigade — branchement de l'interface.
 *
 * Quatre choses vivent côte à côte :
 *
 *   le contenu       chefs, parcours, leçons, scènes : livrés avec le site
 *                    (`chefs.js`, `lecons.js`, `scenes.js`). On ne les
 *                    modifie pas depuis le navigateur.
 *   la progression   leçons vues, réussies ou à refaire, portions choisies,
 *                    préférences. localStorage, quelques kilo-octets.
 *   l'accès          un code validé une fois par appareil (`acces.js`).
 *   la liste         la liste d'épicerie de Mon Épicerie, dans laquelle une
 *                    leçon peut verser ses ingrédients (`etat.js`).
 *
 * Il n'y a pas de serveur : la voix des chefs est la synthèse vocale du
 * navigateur, les capsules sont dessinées à la volée, et le paiement se
 * passe chez Stripe, sur une page qui n'est pas la nôtre.
 */

import { CHEFS, chefParId, portraitChef } from './chefs.js';
import {
  PARCOURS,
  LECONS,
  TECHNIQUES,
  FAMILLES,
  leconParId,
  parcoursParId,
  leconsDuParcours,
  leconsPubliees,
  leconPourTechnique,
} from './lecons.js';
import { rendreScene } from './scenes.js';
import { CONFIG } from './config-brigade.js';
import { accesComplet, peutOuvrir, verifierCode, estDeverrouille, codeDansAdresse, verrouiller } from './acces.js';
import {
  charger as chargerListe,
  etat as listeEpicerie,
  ajouter as ajouterArticle,
  modifier as modifierArticle,
  sauvegarderMaintenant as sauvegarderListe,
} from './etat.js';
import { normaliser } from './catalogue.js';

/* =========================================================================
   État persistant
   ========================================================================= */

const CLE_ETAT = 'mon-epicerie/brigade/v1';
const THEMES = ['auto', 'clair', 'sombre'];
const LIBELLE_THEME = { auto: 'Thème du système', clair: 'Thème clair', sombre: 'Thème sombre' };

const etat = {
  theme: 'auto',
  /** La narration sonore. On peut la couper et garder les sous-titres. */
  voix: true,
  /** Portions choisies par leçon : { leconId: nombre }. */
  portions: {},
  /** Progression par leçon : { leconId: { statut: 'vu' | 'reussi' | 'a-refaire', date } }. */
  progression: {},
};

function charger() {
  let brut;
  try {
    brut = JSON.parse(localStorage.getItem(CLE_ETAT) ?? 'null');
  } catch {
    brut = null;
  }
  if (!brut || typeof brut !== 'object') return;

  if (THEMES.includes(brut.theme)) etat.theme = brut.theme;
  if (typeof brut.voix === 'boolean') etat.voix = brut.voix;

  if (brut.portions && typeof brut.portions === 'object') {
    for (const [id, valeur] of Object.entries(brut.portions)) {
      const n = Number(valeur);
      if (leconParId(id) && Number.isInteger(n) && n >= 1 && n <= 60) etat.portions[id] = n;
    }
  }
  if (brut.progression && typeof brut.progression === 'object') {
    for (const [id, p] of Object.entries(brut.progression)) {
      if (!leconParId(id) || !p || !['vu', 'reussi', 'a-refaire'].includes(p.statut)) continue;
      etat.progression[id] = { statut: p.statut, date: typeof p.date === 'string' ? p.date : null };
    }
  }
}

function enregistrer() {
  try {
    localStorage.setItem(CLE_ETAT, JSON.stringify(etat));
  } catch (erreur) {
    console.warn('Sauvegarde impossible :', erreur);
  }
}

/* =========================================================================
   Petits outils
   ========================================================================= */

const $ = (id) => document.getElementById(id);

/** Échappe le texte destiné à innerHTML. */
function txt(valeur) {
  return String(valeur ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

const icone = (nom, taille = 18, epaisseur = 1.8) =>
  `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-${nom}"></use></svg>`;

/** Affiche un message éphémère en bas de l'écran. */
function signaler(message, duree = 3400) {
  const bulle = document.createElement('div');
  bulle.className = 'notification';
  bulle.textContent = message;
  $('notifications').append(bulle);
  setTimeout(() => bulle.remove(), duree);
}

function nombreFr(valeur, decimales = 0) {
  return valeur.toLocaleString('fr-CA', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

/** ½ plutôt que 0,5 pour compter des citrons. */
function fraction(n) {
  const entier = Math.floor(n);
  const reste = n - entier;
  const demi = reste >= 0.25 && reste < 0.75 ? '½' : '';
  const arrondi = reste >= 0.75 ? entier + 1 : entier;
  if (demi) return arrondi === 0 ? '½' : `${arrondi} ½`;
  return String(arrondi);
}

/**
 * Met une quantité à l'échelle et l'arrondit à quelque chose de mesurable :
 * personne ne pèse 43,7 g de paprika.
 */
function formaterQuantite(q, u, base, portions) {
  if (q === null || q === undefined) return '';
  const v = q * (portions / base);

  if (u === '') return fraction(Math.max(0.5, Math.round(v * 2) / 2));
  if (u === 'g' && v >= 1000) return `${nombreFr(v / 1000, 2)} kg`;
  if (u === 'ml' && v >= 1000) return `${nombreFr(v / 1000, 2)} L`;

  let arrondi;
  if (v >= 100) arrondi = Math.round(v / 5) * 5;
  else if (v >= 20) arrondi = Math.round(v);
  else if (v >= 2) arrondi = Math.round(v * 2) / 2;
  else arrondi = Math.round(v * 4) / 4;

  const decimales = Number.isInteger(arrondi) ? 0 : arrondi * 2 === Math.round(arrondi * 2) ? 1 : 2;
  return `${nombreFr(arrondi, decimales)} ${u}`;
}

const H_ASPIRE = /^(haut|haric|hach|homard|hareng|hamburg|hot)/;

/** « 300 g de riz », « 360 ml d’eau », « 2 carottes », « ½ citron ». */
function quantiteEnMots(ingredient, lecon, portions) {
  const nomBrut = ingredient.nom;
  const nom = nomBrut.charAt(0).toLowerCase() + nomBrut.slice(1);
  const qte = formaterQuantite(ingredient.q, ingredient.u, lecon.portions, portions);

  if (!qte) return nom;
  if (ingredient.u === '') return `${qte} ${nom}`;

  const debut = normaliser(nom);
  const elision = /^[aeiouyh]/.test(debut) && !H_ASPIRE.test(debut);
  return `${qte} ${elision ? 'd’' : 'de '}${nom}`;
}

/**
 * Remplace les « {{cle}} » d'un texte par la quantité mise à l'échelle et le
 * nom de l'ingrédient ; « {{cle:q}} » ne donne que la quantité.
 */
function remplacerCles(texte, lecon, portions) {
  return String(texte ?? '').replace(/{{([a-z-]+)(?::q)?}}/g, (tout, cle) => {
    const ingredient = lecon.ingredients.find((i) => i.cle === cle);
    if (!ingredient) return tout;
    if (tout.endsWith(':q}}')) return formaterQuantite(ingredient.q, ingredient.u, lecon.portions, portions) || '';
    return quantiteEnMots(ingredient, lecon, portions);
  });
}

const portionsDe = (lecon) => etat.portions[lecon.id] ?? lecon.portions;

function definirPortions(lecon, valeur) {
  const n = Math.max(1, Math.min(60, Math.round(Number(valeur) || lecon.portions)));
  if (n === lecon.portions) delete etat.portions[lecon.id];
  else etat.portions[lecon.id] = n;
  enregistrer();
  return n;
}

function formaterDuree(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }
  return `${minutes} min`;
}

const DIFFICULTE = { 1: 'Facile', 2: 'Intermédiaire', 3: 'Exigeant' };
const enCelsius = (f) => Math.round(((f - 32) * 5) / 9);

const progressionDe = (lecon) => etat.progression[lecon.id]?.statut ?? null;

function marquer(lecon, statut) {
  const actuel = progressionDe(lecon);
  // « vu » n'écrase jamais un verdict.
  if (statut === 'vu' && (actuel === 'reussi' || actuel === 'a-refaire')) return;
  etat.progression[lecon.id] = { statut, date: new Date().toISOString() };
  enregistrer();
}

/* =========================================================================
   La voix des chefs — synthèse vocale du navigateur
   ========================================================================= */

const synthese = globalThis.speechSynthesis ?? null;
let voixDisponibles = [];
let sessionParole = 0;
let enTrainDeParler = false;
let avertiSansVoix = false;
/** Termine la narration en cours (promesse comprise) quand on la coupe. */
let annulerParole = null;
/** Fonction appelée à chaque mot prononcé (pour animer la bouche du chef). */
let surMot = null;

const PRENOMS_M = /antoine|jean|henri|claude|thomas|nicolas|paul|remy|rémy|maurice|daniel|guillaume|louis|felix|félix|mathieu|olivier|homme|male|man\b/i;
const PRENOMS_F = /sylvie|denise|amelie|amélie|audrey|aurelie|aurélie|marie|julie|celine|céline|chantal|virginie|eloise|éloise|lea|léa|vivienne|coralie|jacqueline|josephine|joséphine|yvette|brigitte|ariane|charlotte|femme|female|woman/i;

function rafraichirVoix() {
  if (!synthese) return;
  voixDisponibles = synthese.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('fr'));
}

if (synthese) {
  rafraichirVoix();
  synthese.addEventListener?.('voiceschanged', rafraichirVoix);
}

/**
 * Choisit une voix pour un chef : québécoise si possible, du bon genre si
 * possible, et différente d'un chef à l'autre quand l'appareil en offre
 * plusieurs. Sur un appareil qui n'en a qu'une, la hauteur et le débit
 * font la différence.
 */
function voixPour(chef) {
  if (!voixDisponibles.length) rafraichirVoix();
  if (!voixDisponibles.length) return null;

  const genre = chef.genre === 'f' ? PRENOMS_F : PRENOMS_M;
  const autre = chef.genre === 'f' ? PRENOMS_M : PRENOMS_F;
  const score = (v) =>
    (v.lang.toLowerCase() === 'fr-ca' ? 4 : 0) +
    (genre.test(v.name) ? 3 : 0) -
    (autre.test(v.name) ? 3 : 0) +
    (v.localService ? 1 : 0);

  const classees = [...voixDisponibles].sort((a, b) => score(b) - score(a));
  // Les chefs du même genre se répartissent les meilleures voix.
  const memeGenre = CHEFS.filter((c) => c.genre === chef.genre);
  const rang = memeGenre.findIndex((c) => c.id === chef.id);
  const candidates = classees.filter((v) => score(v) === score(classees[0]) || genre.test(v.name));
  return candidates[rang % Math.max(1, candidates.length)] ?? classees[0];
}

/** Coupe un texte en phrases : les longues tirades se perdent en route sur certains navigateurs. */
function phrases(texte) {
  return String(texte)
    .split(/(?<=[.!?…:])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Fait dire un texte par un chef. Retourne une promesse tenue à la fin —
 * ou tout de suite si la voix est coupée ou indisponible, avec `false`.
 */
function parler(texte, chef, { surPhrase = null } = {}) {
  taire();
  if (!synthese || !etat.voix || !texte) return Promise.resolve(false);

  const voix = voixPour(chef);
  // Des voix existent, mais aucune ne parle français : mieux vaut les
  // sous-titres qu'un accent anglais sur « frémissement ».
  if (!voix && synthese.getVoices().length > 0) {
    if (!avertiSansVoix) {
      avertiSansVoix = true;
      signaler('Aucune voix française sur cet appareil : les chefs parlent en sous-titres.', 5000);
    }
    return Promise.resolve(false);
  }

  const session = ++sessionParole;
  const morceaux = phrases(texte);
  const debut = performance.now();
  // À quatre mots par seconde, une voix ne peut pas aller plus vite : en
  // dessous du tiers de ce temps, le navigateur a « parlé » sans son.
  const dureeMinimale = (String(texte).split(/\s+/).length / 4) * 1000 * 0.3;
  enTrainDeParler = true;

  return new Promise((resoudre) => {
    let index = 0;
    let termine = false;
    const finir = (ok) => {
      if (termine) return;
      termine = true;
      annulerParole = null;
      enTrainDeParler = false;
      surMot?.(false);
      if (ok && performance.now() - debut < dureeMinimale) {
        if (!avertiSansVoix) {
          avertiSansVoix = true;
          signaler('La voix ne fonctionne pas sur cet appareil : les chefs parlent en sous-titres.', 5000);
        }
        return resoudre(false);
      }
      resoudre(ok);
    };
    annulerParole = () => finir(false);
    const suivant = () => {
      if (session !== sessionParole) return;
      if (index >= morceaux.length) return finir(true);

      surPhrase?.(index, morceaux);
      const phrase = morceaux[index++];
      const enonce = new SpeechSynthesisUtterance(phrase);
      enonce.lang = voix?.lang ?? 'fr-CA';
      if (voix) enonce.voice = voix;
      enonce.pitch = chef.voix.pitch;
      enonce.rate = chef.voix.rate;
      enonce.onboundary = () => surMot?.(true);
      const debutPhrase = performance.now();
      enonce.onend = () => {
        // Une phrase « dite » en moins de 80 ms par mot n'a pas été dite :
        // le navigateur a une synthèse muette. On passe aux sous-titres sans
        // attendre la fin du paragraphe.
        const mots = phrase.split(/\s+/).length;
        if (performance.now() - debutPhrase < Math.max(150, mots * 80)) return finir(true);
        setTimeout(suivant, 120);
      };
      enonce.onerror = (e) => {
        // Toute erreur vaut « pas de voix » : on passe aux sous-titres plutôt
        // que d'enchaîner des phrases muettes. « not-allowed » veut dire que
        // le navigateur attend un geste de l'utilisateur.
        if (!avertiSansVoix && e.error !== 'interrupted' && e.error !== 'canceled') {
          avertiSansVoix = true;
          signaler(
            e.error === 'not-allowed'
              ? 'Touchez « Lecture » pour lancer la voix du chef.'
              : 'La voix ne fonctionne pas sur cet appareil : les chefs parlent en sous-titres.',
            5000,
          );
        }
        finir(false);
      };
      synthese.speak(enonce);
    };
    suivant();
  });
}

function taire() {
  sessionParole++;
  annulerParole?.();
  enTrainDeParler = false;
  surMot?.(false);
  if (synthese?.speaking || synthese?.pending) synthese.cancel();
}

/* =========================================================================
   Minuteries
   ========================================================================= */

const minuteries = [];
let horloge = null;

/** Un bip court, sans fichier son : trois notes montantes. */
function sonnerie() {
  try {
    const contexte = new (window.AudioContext ?? window.webkitAudioContext)();
    [880, 1108, 1318].forEach((frequence, rang) => {
      const oscillateur = contexte.createOscillator();
      const gain = contexte.createGain();
      oscillateur.frequency.value = frequence;
      oscillateur.connect(gain).connect(contexte.destination);
      const debut = contexte.currentTime + rang * 0.22;
      gain.gain.setValueAtTime(0.0001, debut);
      gain.gain.exponentialRampToValueAtTime(0.25, debut + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, debut + 0.2);
      oscillateur.start(debut);
      oscillateur.stop(debut + 0.22);
    });
  } catch {
    /* Le son n'est qu'un confort. */
  }
}

function lancerMinuteur(minutes, nom, chef = null) {
  minuteries.push({ nom, fin: Date.now() + minutes * 60000, sonne: false, chef });
  if (!horloge) horloge = setInterval(rendreMinuteries, 500);
  rendreMinuteries();
  signaler(`Minuterie lancée : ${formaterDuree(minutes)} — ${nom}`);
}

function tempsRestant() {
  const actives = minuteries.filter((m) => m.fin > Date.now());
  if (!actives.length) return null;
  const m = actives.sort((a, b) => a.fin - b.fin)[0];
  const secondes = Math.round((m.fin - Date.now()) / 1000);
  const minutes = Math.floor(secondes / 60);
  return { nom: m.nom, minutes, secondes: secondes % 60 };
}

function rendreMinuteries() {
  const zone = $('minuteries');
  zone.innerHTML = minuteries
    .map((m, index) => {
      const reste = Math.max(0, m.fin - Date.now());
      const total = Math.round(reste / 1000);
      const affichage = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      if (reste === 0 && !m.sonne) {
        m.sonne = true;
        sonnerie();
        signaler(`C’est l’heure : ${m.nom}`);
        if (m.chef && !enTrainDeParler) parler(`C’est l’heure. ${m.nom}.`, m.chef);
      }
      return `
        <div class="minuterie__carte ${reste === 0 ? 'minuterie__carte--fini' : ''}">
          <span class="minuterie__temps">${affichage}</span>
          <span class="minuterie__nom">${txt(m.nom)}</span>
          <button type="button" class="btn btn--petit" data-arreter="${index}" aria-label="Arrêter la minuterie">✕</button>
        </div>`;
    })
    .join('');

  if (!minuteries.length && horloge) {
    clearInterval(horloge);
    horloge = null;
  }
}

$('minuteries').addEventListener('click', (evenement) => {
  const bouton = evenement.target.closest('[data-arreter]');
  if (!bouton) return;
  minuteries.splice(Number(bouton.dataset.arreter), 1);
  rendreMinuteries();
});

/* =========================================================================
   Envoi des ingrédients vers la liste d'épicerie
   ========================================================================= */

const singulier = (texte) => normaliser(texte).replace(/s$/, '');

/**
 * Verse les ingrédients d'une leçon dans la liste de Mon Épicerie, aux
 * quantités choisies. Un article déjà au catalogue reçoit sa quantité ; un
 * ingrédient inconnu est ajouté dans le bon rayon.
 */
function envoyerIngredients(lecon) {
  chargerListe();
  const portions = portionsDe(lecon);
  let ajoutes = 0;
  let modifies = 0;

  for (const ingredient of lecon.ingredients) {
    if (ingredient.rayon === null) continue; // l'eau du robinet

    const qte = formaterQuantite(ingredient.q, ingredient.u, lecon.portions, portions);
    const mention = qte || 'au besoin';
    const cible = singulier(ingredient.nom);
    const existant = listeEpicerie.articles.find((a) => singulier(a.nom) === cible);

    if (existant) {
      const actuelle = existant.qte?.trim();
      const nouvelle = actuelle && actuelle !== mention ? `${actuelle} + ${mention}` : mention;
      modifierArticle(existant.id, { qte: nouvelle.slice(0, 120), coche: false });
      modifies++;
    } else {
      ajouterArticle({ nom: ingredient.nom, qte: mention, rayon: ingredient.rayon ?? 'misc' });
      ajoutes++;
    }
  }

  sauvegarderListe();
  const total = ajoutes + modifies;
  signaler(
    total
      ? `${total} ingrédient${total > 1 ? 's' : ''} dans votre liste d’épicerie${ajoutes ? ` (${ajoutes} nouveau${ajoutes > 1 ? 'x' : ''})` : ''}.`
      : 'Rien à envoyer : cette leçon ne demande que de l’eau.',
    4500,
  );
}

/* =========================================================================
   Rendu : morceaux réutilisés
   ========================================================================= */

function jetonsLecon(lecon, { compact = false } = {}) {
  const jetons = [];
  if (lecon.statut === 'en-preparation') jetons.push(`<span class="jeton jeton--a-venir">En préparation</span>`);
  else if (lecon.gratuit) jetons.push(`<span class="jeton jeton--gratuit">Gratuit</span>`);
  else if (!accesComplet()) jetons.push(`<span class="jeton jeton--verrou">${icone('cadenas', 13)} Accès complet</span>`);
  jetons.push(`<span class="jeton">${icone('chrono', 13)} ${formaterDuree(lecon.duree)}</span>`);
  if (!compact) jetons.push(`<span class="jeton">${'●'.repeat(lecon.difficulte)}${'○'.repeat(3 - lecon.difficulte)} ${DIFFICULTE[lecon.difficulte]}</span>`);
  if (progressionDe(lecon) === 'reussi') jetons.push(`<span class="jeton jeton--reussi">${icone('coche', 13, 2.4)} Réussie</span>`);
  else if (progressionDe(lecon) === 'a-refaire') jetons.push(`<span class="jeton jeton--verrou">À refaire</span>`);
  else if (progressionDe(lecon) === 'vu') jetons.push(`<span class="jeton">${icone('oeil', 13)} Vue</span>`);
  return jetons.join('');
}

function carteLecon(lecon) {
  const aVenir = lecon.statut === 'en-preparation';
  const balise = aVenir ? 'div' : 'a';
  const href = aVenir ? '' : ` href="#lecon/${lecon.id}"`;
  const classes = ['lecon-carte', aVenir ? 'lecon-carte--a-venir' : '', progressionDe(lecon) === 'reussi' ? 'lecon-carte--reussie' : '']
    .filter(Boolean)
    .join(' ');
  const etatIcone = aVenir ? '' : peutOuvrir(lecon) ? icone('suivant', 20) : icone('cadenas', 18);

  return `
    <${balise} class="${classes}"${href}>
      <span class="lecon-carte__numero">${progressionDe(lecon) === 'reussi' ? icone('coche', 16, 2.6) : lecon.numero}</span>
      <span>
        <span class="lecon-carte__titre">${txt(lecon.titre)}</span>
        <span class="lecon-carte__accroche">${txt(lecon.accroche)}</span>
        <span class="lecon-carte__meta">${jetonsLecon(lecon, { compact: true })}</span>
      </span>
      <span class="lecon-carte__etat">${etatIcone}</span>
    </${balise}>`;
}

function motDuChef(chef, texte, { titre = chef.titre } = {}) {
  return `
    <div class="debrief">
      ${portraitChef(chef, { taille: 56 })}
      <div>
        <p class="debrief__nom">${txt(titre)}</p>
        <p>${txt(texte)}</p>
      </div>
    </div>`;
}

/* =========================================================================
   Vue : accueil
   ========================================================================= */

const HEROS = [
  { scene: 'poele', chef: 'amadou', texte: 'La goutte roule en bille ? La poêle est à trois cent soixante-quinze. Posez la viande — et ne touchez plus.' },
  { scene: 'planche', chef: 'aurele', texte: 'Regardez vos articulations, pas la lame. Elle ne peut aller que là où elles sont.' },
  { scene: 'riz', chef: 'naoko', texte: 'Douze minutes, couvercle fermé. La vapeur est la cuisson : ouvrir, c’est la laisser partir.' },
  { scene: 'four', chef: 'lea', texte: 'On n’ouvre pas le four avant vingt-cinq minutes. À l’intérieur, un ballon de vapeur gonfle vos choux.' },
  { scene: 'pate', chef: 'rosalie', texte: 'La pâte, on la touche comme un bébé qui dort. Le beurre en pois, pas en chapelure.' },
];
let herosIndex = 0;
let herosHorloge = null;

function rendreHeros() {
  const zone = $('heros-visuel');
  if (!zone) return;
  const h = HEROS[herosIndex % HEROS.length];
  const chef = chefParId(h.chef);
  zone.innerHTML = `${rendreScene(h.scene)}${portraitChef(chef, { taille: 120 })}<div class="heros__bulle"><strong>${txt(chef.titre)} —</strong> ${txt(h.texte)}</div>`;
}

function demarrerHeros() {
  rendreHeros();
  clearInterval(herosHorloge);
  herosHorloge = setInterval(() => {
    herosIndex++;
    rendreHeros();
  }, 7000);
}

function arreterHeros() {
  clearInterval(herosHorloge);
  herosHorloge = null;
}

const EN_LETTRES = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const enLettres = (n) => EN_LETTRES[n] ?? String(n);

function rendreAccueil() {
  const publiees = leconsPubliees();
  const gratuites = publiees.filter((l) => l.gratuit).length;
  $('heros-surtitre').textContent = `${enLettres(CHEFS.length).replace(/^./, (c) => c.toUpperCase())} chefs · ${enLettres(publiees.length)} leçons publiées · ${enLettres(gratuites)} gratuite${gratuites > 1 ? 's' : ''}`;
  $('galerie-chefs').innerHTML = CHEFS.map(
    (chef) => `
      <article class="chef">
        ${portraitChef(chef, { taille: 96 })}
        <h3 class="chef__nom">${txt(chef.titre)}</h3>
        <p class="chef__role">${txt(chef.role)}</p>
        <p class="chef__devise">« ${txt(chef.devise)} »</p>
        <div class="jetons chef__specialites">${chef.specialites.map((s) => `<span class="jeton">${txt(s)}</span>`).join('')}</div>
      </article>`,
  ).join('');

  $('parcours-apercu').innerHTML = [...PARCOURS]
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => {
      const chef = chefParId(p.chefId);
      const lecons = leconsDuParcours(p.id);
      const publiees = lecons.filter((l) => l.statut === 'publiee');
      const gratuites = publiees.filter((l) => l.gratuit).length;
      return `
        <a class="parcours-apercu" href="#parcours/${p.id}" style="--h:${chef.teinte}">
          <div class="parcours-apercu__entete">
            ${portraitChef(chef, { taille: 48 })}
            <div>
              <h3 class="parcours-apercu__titre">${txt(p.titre)}</h3>
              <p class="parcours-apercu__chef">avec ${txt(chef.titre)}, ${txt(chef.role.toLowerCase())}</p>
            </div>
          </div>
          <p class="parcours-apercu__texte">${txt(p.sousTitre)}</p>
          <div class="parcours-apercu__pied">
            <span>${publiees.length} leçon${publiees.length > 1 ? 's' : ''}${lecons.length > publiees.length ? ` · ${lecons.length - publiees.length} à venir` : ''}</span>
            ${gratuites ? `<span class="jeton jeton--gratuit">${gratuites} gratuite${gratuites > 1 ? 's' : ''}</span>` : ''}
          </div>
        </a>`;
    })
    .join('');

  $('heros-prix').textContent = CONFIG.modeDemo
    ? 'Site en démonstration : toutes les leçons sont ouvertes pour l’instant.'
    : `${CONFIG.prix} · ${CONFIG.prixDetail}`;
  $('faq-soutien').textContent = CONFIG.courrielSoutien
    ? `Écrivez à ${CONFIG.courrielSoutien} avec votre reçu de paiement : on vous le renvoie.`
    : 'Écrivez-nous avec votre reçu de paiement : on vous le renvoie.';
  $('pied-editeur').textContent = CONFIG.editeur ? `© ${new Date().getFullYear()} ${CONFIG.editeur}.` : '';
}

/* =========================================================================
   Vue : les parcours
   ========================================================================= */

function rendreParcours() {
  const publiees = leconsPubliees().length;
  const annoncees = LECONS.length - publiees;
  $('parcours-sous-titre').textContent = `${enLettres(publiees).replace(/^./, (c) => c.toUpperCase())} leçons complètes, ${enLettres(annoncees)} annoncée${annoncees > 1 ? 's' : ''}. Un chef par parcours.`;
  $('liste-parcours').innerHTML = [...PARCOURS]
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => {
      const chef = chefParId(p.chefId);
      return `
        <section class="parcours" id="parcours-${p.id}" style="--h:${chef.teinte}" aria-labelledby="titre-${p.id}">
          <div class="parcours__entete">
            ${portraitChef(chef, { taille: 72 })}
            <div>
              <p class="parcours__chef">${txt(chef.titre)} · ${txt(chef.role)}</p>
              <h2 class="parcours__titre" id="titre-${p.id}">${txt(p.titre)}</h2>
              <p class="parcours__sous-titre">${txt(p.sousTitre)}</p>
            </div>
          </div>
          <p class="parcours__description">${txt(p.description)}</p>
          <div class="parcours__lecons">${leconsDuParcours(p.id).map(carteLecon).join('')}</div>
        </section>`;
    })
    .join('');
}

/* =========================================================================
   Vue : une leçon
   ========================================================================= */

function htmlIngredients(lecon, portions) {
  const groupes = new Map();
  for (const ingredient of lecon.ingredients) {
    const cle = ingredient.groupe ?? '';
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(ingredient);
  }

  return [...groupes.entries()]
    .map(
      ([groupe, items]) => `
      <div class="groupe-ingredients">
        ${groupe ? `<h3 class="groupe-ingredients__titre">${txt(groupe)}</h3>` : ''}
        ${items
          .map(
            (i) => `
          <div class="ingredient">
            <span class="ingredient__quantite">${txt(formaterQuantite(i.q, i.u, lecon.portions, portions)) || '—'}</span>
            <span class="ingredient__corps">
              <span class="ingredient__nom">${txt(i.nom)}</span>
              ${i.note ? `<span class="ingredient__note">${txt(i.note)}</span>` : ''}
              ${i.substitution ? `<span class="ingredient__substitution">${txt(i.substitution)}</span>` : ''}
            </span>
          </div>`,
          )
          .join('')}
      </div>`,
    )
    .join('');
}

function htmlEtapes(lecon, portions, { interactif = true } = {}) {
  return lecon.etapes
    .map(
      (e, index) => `
      <div class="etape">
        <div class="etape__numero">${index + 1}</div>
        <div class="etape__corps">
          <div class="etape__entete">
            <h3 class="etape__titre">${txt(e.titre)}</h3>
            ${e.duree ? `<span class="etape__duree">${txt(e.duree)}</span>` : ''}
          </div>
          <p>${txt(remplacerCles(e.texte, lecon, portions))}</p>
          ${e.piege ? `<div class="remarque remarque--piege"><span class="remarque__cle">Le piège</span>${txt(e.piege)}</div>` : ''}
          ${e.reussite ? `<div class="remarque remarque--reussite"><span class="remarque__cle">Signe de réussite</span>${txt(e.reussite)}</div>` : ''}
          ${
            interactif
              ? `<div class="etape__actions">
                  <a class="btn btn--petit" href="#capsule/${lecon.id}/${index}">${icone('lecture', 14)} Voir cette étape</a>
                  ${e.minuterie ? `<button type="button" class="btn btn--petit" data-minuterie="${e.minuterie}" data-nom="${txt(e.titre)}">${icone('chrono', 14)} Minuterie ${formaterDuree(e.minuterie)}</button>` : ''}
                </div>`
              : ''
          }
        </div>
      </div>`,
    )
    .join('');
}

function htmlEvaluation(lecon, chef) {
  const statut = progressionDe(lecon);
  const verdict =
    statut === 'reussi'
      ? motDuChef(chef, lecon.debrief.reussi, { titre: `${chef.titre} — bravo` })
      : statut === 'a-refaire'
        ? motDuChef(chef, lecon.debrief.aRefaire, { titre: `${chef.titre} — on la refait` })
        : '';
  return `
    <section class="carte" aria-labelledby="titre-evaluation">
      <h2 class="carte__titre" id="titre-evaluation">${icone('cible')} Vous l’avez faite ?</h2>
      <p style="color:var(--texte-doux);font-size:.93rem">
        Dites-le au chef. Une leçon réussie allume ses techniques dans votre arbre ; une leçon à refaire vous vaut son
        conseil le plus précis.
      </p>
      ${verdict}
      <div class="evaluation__actions">
        <button type="button" class="btn btn--principal" data-evaluer="reussi">${icone('coche', 16, 2.4)} J’ai réussi</button>
        <button type="button" class="btn" data-evaluer="a-refaire">À refaire</button>
      </div>
    </section>`;
}

function rendreLecon(id) {
  const lecon = leconParId(id);
  const vue = $('vue-lecon');
  if (!lecon) {
    vue.innerHTML = `<div class="chapeau"><h1 class="chapeau__titre">Cette leçon n’existe pas</h1><p><a class="btn" href="#parcours">Voir les parcours</a></p></div>`;
    return;
  }

  const chef = chefParId(lecon.chefId);
  const parcours = parcoursParId(lecon.parcoursId);
  const portions = portionsDe(lecon);
  const ouverte = peutOuvrir(lecon);

  if (lecon.statut === 'en-preparation') {
    vue.innerHTML = `
      <p class="lecon__retour"><a class="btn btn--fantome" href="#parcours/${parcours.id}">${icone('retour')} ${txt(parcours.titre)}</a></p>
      <div class="lecon__entete">
        ${portraitChef(chef, { taille: 104 })}
        <div>
          <a class="lecon__parcours" href="#parcours/${parcours.id}">${txt(parcours.titre)} · leçon ${lecon.numero}</a>
          <h1 class="lecon__titre">${txt(lecon.titre)}</h1>
          <p class="lecon__accroche">${txt(lecon.accroche)}</p>
          <div class="jetons" style="margin-top:.6rem">${jetonsLecon(lecon)}</div>
        </div>
      </div>
      ${motDuChef(chef, `Cette leçon est en préparation : je la teste encore dans ma cuisine avant de vous la confier. Elle s’ajoutera à votre accès sans frais. En attendant : ${lecon.resultat}`)}`;
    return;
  }

  const entete = `
    <p class="lecon__retour"><a class="btn btn--fantome" href="#parcours/${parcours.id}">${icone('retour')} ${txt(parcours.titre)}</a></p>
    <div class="lecon__entete">
      ${portraitChef(chef, { taille: 104 })}
      <div>
        <a class="lecon__parcours" href="#parcours/${parcours.id}">${txt(parcours.titre)} · leçon ${lecon.numero}</a>
        <h1 class="lecon__titre">${txt(lecon.titre)}</h1>
        <p class="lecon__accroche">${txt(lecon.accroche)}</p>
        <p class="lecon__chef">Enseignée par <strong>${txt(chef.titre)}</strong>, ${txt(chef.role.toLowerCase())} — ${txt(chef.pedagogie)}</p>
        <div class="jetons" style="margin-top:.6rem">${jetonsLecon(lecon)}</div>
      </div>
    </div>`;

  const actions = ouverte
    ? `
    <div class="lecon__actions">
      <a class="btn btn--principal btn--grand" href="#capsule/${lecon.id}">${icone('lecture', 18)} Regarder la capsule</a>
      <a class="btn btn--sombre btn--grand" href="#guide/${lecon.id}">${icone('micro', 18)} Cuisiner mains libres</a>
      <button type="button" class="btn" id="btn-envoyer-liste">${icone('panier', 18)} Envoyer à ma liste d’épicerie</button>
      <button type="button" class="btn btn--icone" id="btn-imprimer" title="Imprimer la fiche">${icone('imprimante', 18)}<span class="visuellement-cache">Imprimer la fiche</span></button>
      <div class="reglage-portions">
        <label for="portions">${txt(lecon.portionsLibelle ?? 'convives')}</label>
        <div class="compteur">
          <button type="button" class="btn" id="portions-moins" aria-label="Diminuer">−</button>
          <input type="number" id="portions" min="1" max="60" step="1" value="${portions}">
          <button type="button" class="btn" id="portions-plus" aria-label="Augmenter">+</button>
        </div>
      </div>
    </div>`
    : `
    <div class="lecon__actions">
      <a class="btn btn--principal btn--grand" href="#rejoindre">${icone('cadenas-ouvert', 18)} Rejoindre la Brigade — ${txt(CONFIG.prix)}</a>
      <button type="button" class="btn" id="btn-code">J’ai déjà un code</button>
      <a class="btn btn--fantome" href="#lecon/couteau-cinq-coupes">Essayer une leçon gratuite</a>
    </div>`;

  const conseils = lecon.conseilleApres
    .map((t) => ({ id: t, technique: TECHNIQUES[t], lecon: leconPourTechnique(t) }))
    .filter((c) => c.technique && !techniqueAcquise(c.id));
  const htmlConseils = conseils.length
    ? `<p class="boite__note" style="margin-top:.6rem">Conseillé avant : ${conseils
        .map((c) => (c.lecon ? `<a href="#lecon/${c.lecon.id}">${txt(c.technique.nom)}</a>` : txt(c.technique.nom)))
        .join(', ')}.</p>`
    : '';

  const corpsOuvert = `
    <div class="lecon__grille">
      <div>
        <section class="carte" aria-labelledby="titre-pourquoi">
          <h2 class="carte__titre" id="titre-pourquoi">Pourquoi ça marche</h2>
          <div class="pourquoi">${lecon.pourquoi.split('\n\n').map((p) => `<p>${txt(p)}</p>`).join('')}</div>
          <div class="jetons techniques-gagnees">${lecon.techniques.map((t) => `<a class="technique ${techniqueAcquise(t) ? 'technique--acquise' : ''}" href="#techniques">${techniqueAcquise(t) ? icone('coche', 13, 2.4) : icone('etoile', 13)} ${txt(TECHNIQUES[t]?.nom ?? t)}</a>`).join('')}</div>
          ${htmlConseils}
        </section>

        ${
          lecon.avertissements?.length
            ? `<section class="carte" aria-label="Sécurité alimentaire">${lecon.avertissements
                .map((a) => `<div class="alerte"><h3 class="alerte__titre">${txt(a.titre)}</h3><p>${txt(a.texte)}</p></div>`)
                .join('')}</section>`
            : ''
        }

        ${
          lecon.temperatures?.length
            ? `<section class="carte" aria-labelledby="titre-temperatures">
                <h2 class="carte__titre" id="titre-temperatures">${icone('thermometre')} Les chiffres à viser</h2>
                <div class="temperatures">${lecon.temperatures
                  .map(
                    (t) => `<div class="temperature">
                      <div class="temperature__valeur">${t.f} °F<small>${enCelsius(t.f)} °C</small></div>
                      <div class="temperature__quoi">${txt(t.quoi)}</div>
                      ${t.note ? `<div class="temperature__note">${txt(t.note)}</div>` : ''}
                    </div>`,
                  )
                  .join('')}</div>
              </section>`
            : ''
        }

        <section class="carte" aria-labelledby="titre-etapes">
          <h2 class="carte__titre" id="titre-etapes">Les étapes <small>${lecon.etapes.length} étapes · ${formaterDuree(lecon.duree)} en tout</small></h2>
          ${htmlEtapes(lecon, portions)}
        </section>

        ${htmlEvaluation(lecon, chef)}
      </div>

      <div class="lecon__colonne--fixe">
        <section class="carte" aria-labelledby="titre-resultat">
          <h2 class="carte__titre" id="titre-resultat">Ce que vous aurez fait</h2>
          <p>${txt(lecon.resultat)}</p>
        </section>
        <section class="carte" aria-labelledby="titre-ingredients">
          <h2 class="carte__titre" id="titre-ingredients">Ingrédients <small>pour ${portions} ${txt(lecon.portionsLibelle ?? 'convives')}</small></h2>
          ${htmlIngredients(lecon, portions)}
          <p style="margin-top:.9rem"><button type="button" class="btn" data-envoyer-liste>${icone('panier', 16)} Envoyer à ma liste d’épicerie</button></p>
        </section>
        <section class="carte" aria-labelledby="titre-materiel">
          <h2 class="carte__titre" id="titre-materiel">Le matériel</h2>
          <ul class="materiel">${lecon.materiel.map((m) => `<li>${txt(m)}</li>`).join('')}</ul>
        </section>
      </div>
    </div>`;

  const corpsVerrouille = `
    <div class="lecon__grille">
      <div>
        <section class="carte" aria-labelledby="titre-pourquoi">
          <h2 class="carte__titre" id="titre-pourquoi">Pourquoi ça marche</h2>
          <div class="pourquoi">${lecon.pourquoi.split('\n\n').map((p) => `<p>${txt(p)}</p>`).join('')}</div>
          <div class="jetons techniques-gagnees">${lecon.techniques.map((t) => `<span class="technique">${icone('etoile', 13)} ${txt(TECHNIQUES[t]?.nom ?? t)}</span>`).join('')}</div>
        </section>
        <section class="carte verrou" aria-labelledby="titre-etapes">
          <h2 class="carte__titre" id="titre-etapes">Les étapes <small>${lecon.etapes.length} étapes · ${formaterDuree(lecon.duree)} en tout</small></h2>
          <div class="verrou__contenu" aria-hidden="true">${htmlEtapes(lecon, portions, { interactif: false })}</div>
          <div class="verrou__appel">
            <p><strong>${txt(chef.titre)}</strong> vous attend pour ${lecon.etapes.length} étapes racontées, avec les pièges et les signes de réussite à chacune.</p>
            <a class="btn btn--principal btn--grand" href="#rejoindre">${icone('cadenas-ouvert', 18)} Rejoindre la Brigade</a>
          </div>
        </section>
      </div>
      <div>
        <section class="carte" aria-labelledby="titre-resultat">
          <h2 class="carte__titre" id="titre-resultat">Ce que vous aurez fait</h2>
          <p>${txt(lecon.resultat)}</p>
        </section>
        <section class="carte verrou" aria-labelledby="titre-ingredients">
          <h2 class="carte__titre" id="titre-ingredients">Ingrédients <small>${lecon.ingredients.length} ingrédients</small></h2>
          <div class="verrou__contenu" aria-hidden="true">${htmlIngredients(lecon, portions)}</div>
          <div class="verrou__appel"><p>Les quantités exactes, mises à l’échelle de vos convives, et le bouton qui les envoie dans votre liste.</p></div>
        </section>
      </div>
    </div>`;

  vue.innerHTML = entete + actions + (ouverte ? corpsOuvert : corpsVerrouille);

  // --- Branchements ---------------------------------------------------------
  vue.querySelectorAll('[data-envoyer-liste], #btn-envoyer-liste').forEach((b) => b.addEventListener('click', () => envoyerIngredients(lecon)));
  $('btn-imprimer')?.addEventListener('click', () => window.print());
  $('btn-code')?.addEventListener('click', () => ouvrirDialogueAcces());

  const changerPortions = (valeur) => {
    definirPortions(lecon, valeur);
    const y = window.scrollY;
    rendreLecon(id);
    window.scrollTo(0, y);
  };
  $('portions')?.addEventListener('change', (e) => changerPortions(e.target.value));
  $('portions-moins')?.addEventListener('click', () => changerPortions(portions - 1));
  $('portions-plus')?.addEventListener('click', () => changerPortions(portions + 1));

  vue.querySelectorAll('[data-minuterie]').forEach((b) =>
    b.addEventListener('click', () => lancerMinuteur(Number(b.dataset.minuterie), b.dataset.nom, chef)),
  );
  vue.querySelectorAll('[data-evaluer]').forEach((b) =>
    b.addEventListener('click', () => {
      marquer(lecon, b.dataset.evaluer);
      const y = window.scrollY;
      rendreLecon(id);
      window.scrollTo(0, y);
      signaler(b.dataset.evaluer === 'reussi' ? 'Bravo ! Vos techniques sont notées dans votre arbre.' : 'Noté. Le chef vous attend pour la revanche.');
    }),
  );
}

/* =========================================================================
   Vue : la capsule

   Une capsule, c'est une leçon jouée : une scène animée par étape, le chef
   qui la raconte de sa voix, les quantités de VOS convives dans la bouche du
   chef, et la possibilité de s'arrêter, de revenir, de lancer une minuterie.
   Rien n'est pré-enregistré : tout est composé à l'instant.
   ========================================================================= */

const capsule = { lecon: null, chef: null, index: 0, lecture: false, avance: null, active: false };

function rendreCapsule(id, indexDepart = 0) {
  const lecon = leconParId(id);
  const vue = $('vue-capsule');
  if (!lecon || lecon.statut !== 'publiee') {
    location.hash = lecon ? `#lecon/${id}` : '#parcours';
    return;
  }
  if (!peutOuvrir(lecon)) {
    location.hash = `#lecon/${id}`;
    setTimeout(ouvrirDialogueAcces, 50);
    return;
  }

  capsule.lecon = lecon;
  capsule.chef = chefParId(lecon.chefId);
  capsule.index = Math.max(0, Math.min(lecon.etapes.length - 1, indexDepart));
  capsule.lecture = true;
  capsule.active = true;

  vue.innerHTML = `
    <div class="capsule" id="capsule">
      <div class="capsule__entete">
        <a class="btn btn--fantome" href="#lecon/${lecon.id}">${icone('retour')} La fiche</a>
        <h1 class="capsule__titre">${txt(lecon.titre)}</h1>
        <div class="reglage-portions">
          <label for="capsule-portions">${txt(lecon.portionsLibelle ?? 'convives')}</label>
          <div class="compteur">
            <button type="button" class="btn" id="capsule-portions-moins" aria-label="Diminuer">−</button>
            <input type="number" id="capsule-portions" min="1" max="60" step="1" value="${portionsDe(lecon)}">
            <button type="button" class="btn" id="capsule-portions-plus" aria-label="Augmenter">+</button>
          </div>
        </div>
      </div>

      <div class="capsule__scene" id="capsule-scene">
        <div id="capsule-decor"></div>
        <span class="capsule__etape" id="capsule-etape"></span>
        <div class="capsule__minuterie" id="capsule-minuterie"></div>
        <div class="capsule__chef" id="capsule-chef">
          ${portraitChef(capsule.chef, { taille: 160, classe: 'portrait--repos' })}
          ${portraitChef(capsule.chef, { taille: 160, parle: true, classe: 'portrait--parle' })}
        </div>
        <div class="capsule__bulle" id="capsule-bulle" aria-live="polite"></div>
      </div>

      <div class="capsule__controles">
        <div class="capsule__progression" id="capsule-progression" role="group" aria-label="Étapes"></div>
        <button type="button" class="btn btn--icone" id="capsule-precedent" title="Étape précédente">${icone('precedent', 20)}<span class="visuellement-cache">Étape précédente</span></button>
        <button type="button" class="btn btn--principal" id="capsule-lecture" style="min-width:8rem"></button>
        <button type="button" class="btn btn--icone" id="capsule-suivant" title="Étape suivante">${icone('suivant', 20)}<span class="visuellement-cache">Étape suivante</span></button>
        <span class="capsule__espace"></span>
        <button type="button" class="btn btn--icone" id="capsule-voix" title="Couper ou remettre la voix"></button>
        <button type="button" class="btn btn--icone" id="capsule-plein-ecran" title="Plein écran">${icone('plein-ecran', 18)}<span class="visuellement-cache">Plein écran</span></button>
        <a class="btn" href="#guide/${lecon.id}">${icone('micro', 16)} Mains libres</a>
      </div>

      <div class="capsule__fin" id="capsule-fin" hidden>
        <div>
          <strong>Capsule terminée.</strong> Envoyez les ingrédients dans votre liste, puis cuisinez avec le chef en mode mains libres.
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button type="button" class="btn" id="capsule-envoyer">${icone('panier', 16)} Ma liste d’épicerie</button>
          <a class="btn btn--sombre" href="#guide/${lecon.id}">${icone('micro', 16)} Cuisiner mains libres</a>
          <button type="button" class="btn btn--principal" id="capsule-evaluer">${icone('cible', 16)} Je l’ai faite</button>
        </div>
      </div>
    </div>`;

  // Bouche du chef au rythme des mots.
  const bouche = $('capsule-chef');
  let fermeture = null;
  surMot = (ouverte) => {
    if (!capsule.active) return;
    if (ouverte) {
      bouche.classList.toggle('capsule__chef--parle');
      clearTimeout(fermeture);
      fermeture = setTimeout(() => bouche.classList.remove('capsule__chef--parle'), 220);
    } else {
      bouche.classList.remove('capsule__chef--parle');
    }
  };

  $('capsule-precedent').addEventListener('click', () => allerEtape(capsule.index - 1));
  $('capsule-suivant').addEventListener('click', () => allerEtape(capsule.index + 1));
  $('capsule-lecture').addEventListener('click', basculerLecture);
  $('capsule-voix').addEventListener('click', () => {
    etat.voix = !etat.voix;
    enregistrer();
    rendreBoutonVoix();
    if (!etat.voix) taire();
    jouerEtape();
  });
  $('capsule-plein-ecran').addEventListener('click', () => {
    const cible = $('capsule');
    if (document.fullscreenElement) document.exitFullscreen?.();
    else cible.requestFullscreen?.().catch(() => signaler('Le plein écran n’est pas disponible ici.'));
  });
  $('capsule-envoyer').addEventListener('click', () => envoyerIngredients(lecon));
  $('capsule-evaluer').addEventListener('click', () => ouvrirEvaluation(lecon));

  const changerPortions = (valeur) => {
    const n = definirPortions(lecon, valeur);
    $('capsule-portions').value = n;
    jouerEtape();
  };
  $('capsule-portions').addEventListener('change', (e) => changerPortions(e.target.value));
  $('capsule-portions-moins').addEventListener('click', () => changerPortions(portionsDe(lecon) - 1));
  $('capsule-portions-plus').addEventListener('click', () => changerPortions(portionsDe(lecon) + 1));

  $('capsule-progression').addEventListener('click', (e) => {
    const point = e.target.closest('[data-index]');
    if (point) allerEtape(Number(point.dataset.index));
  });

  rendreBoutonVoix();
  jouerEtape();
}

function rendreBoutonVoix() {
  const bouton = $('capsule-voix');
  if (!bouton) return;
  const indisponible = !synthese;
  bouton.innerHTML = `${icone(etat.voix && !indisponible ? 'son' : 'muet', 18)}<span class="visuellement-cache">${etat.voix ? 'Couper la voix' : 'Remettre la voix'}</span>`;
  bouton.title = indisponible ? 'Ce navigateur n’a pas de voix française' : etat.voix ? 'Couper la voix (sous-titres seulement)' : 'Remettre la voix';
}

function allerEtape(index) {
  if (!capsule.active) return;
  if (index >= capsule.lecon.etapes.length) return finirCapsule();
  capsule.index = Math.max(0, index);
  $('capsule-fin').hidden = true;
  jouerEtape();
}

function basculerLecture() {
  capsule.lecture = !capsule.lecture;
  if (capsule.lecture) jouerEtape();
  else {
    taire();
    clearTimeout(capsule.avance);
    rendreBoutonLecture();
  }
}

function rendreBoutonLecture() {
  const bouton = $('capsule-lecture');
  if (!bouton) return;
  bouton.innerHTML = capsule.lecture ? `${icone('pause', 18)} Pause` : `${icone('lecture', 18)} Lecture`;
}

/** Temps de lecture d'un texte sans voix : deux mots et demi par seconde, jamais moins de six secondes. */
const dureeLecture = (texte) => Math.max(6000, (String(texte).split(/\s+/).length / 2.5) * 1000 + 1500);

async function jouerEtape() {
  if (!capsule.active) return;
  clearTimeout(capsule.avance);
  const { lecon, chef, index } = capsule;
  const etape = lecon.etapes[index];
  const portions = portionsDe(lecon);
  const narration = remplacerCles(etape.voix, lecon, portions);

  $('capsule-decor').innerHTML = rendreScene(etape.scene);
  $('capsule-etape').textContent = `Étape ${index + 1} / ${lecon.etapes.length} — ${etape.titre}`;
  const bulle = $('capsule-bulle');
  bulle.textContent = narration;
  bulle.classList.remove('capsule__bulle--phrase');
  $('capsule-minuterie').innerHTML = etape.minuterie
    ? `<button type="button" class="btn btn--petit" id="capsule-lancer-minuterie">${icone('chrono', 14)} Minuterie ${formaterDuree(etape.minuterie)}</button>`
    : '';
  $('capsule-lancer-minuterie')?.addEventListener('click', () => lancerMinuteur(etape.minuterie, etape.titre, chef));
  $('capsule-progression').innerHTML = lecon.etapes
    .map(
      (e, i) =>
        `<button type="button" class="capsule__point ${i < index ? 'capsule__point--vu' : ''}" data-index="${i}" ${i === index ? 'aria-current="step"' : ''} title="Étape ${i + 1} : ${txt(e.titre)}"><span class="visuellement-cache">Étape ${i + 1}</span></button>`,
    )
    .join('');
  $('capsule-precedent').disabled = index === 0;
  rendreBoutonLecture();

  if (!capsule.lecture) {
    taire();
    return;
  }

  const session = ++capsule.session;
  const aParle = await parler(narration, chef, {
    // Pendant que le chef parle, on n'affiche que la phrase en cours : c'est
    // un sous-titre, pas une page à lire.
    surPhrase: (i, morceaux) => {
      if (session !== capsule.session) return;
      bulle.textContent = morceaux[i];
      bulle.classList.add('capsule__bulle--phrase');
    },
  });
  if (!capsule.active || session !== capsule.session || !capsule.lecture) return;
  bulle.textContent = narration;
  bulle.classList.remove('capsule__bulle--phrase');

  // Avec la voix : une respiration après la dernière phrase. Sans voix : le
  // temps de lire les sous-titres.
  const delai = aParle ? 1400 : dureeLecture(narration);
  capsule.avance = setTimeout(() => allerEtape(capsule.index + 1), delai);
}
capsule.session = 0;

function finirCapsule() {
  capsule.lecture = false;
  taire();
  rendreBoutonLecture();
  marquer(capsule.lecon, 'vu');
  $('capsule-fin').hidden = false;
  $('capsule-fin').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  parler(`Voilà pour cette capsule. ${capsule.lecon.debrief.reussi.split('.')[0]}.`, capsule.chef);
}

function quitterCapsule() {
  capsule.active = false;
  capsule.lecture = false;
  clearTimeout(capsule.avance);
  surMot = null;
  taire();
  if (document.fullscreenElement) document.exitFullscreen?.();
}

/* =========================================================================
   Vue : cuisine guidée, mains libres

   Le même contenu que la capsule, mais pensé pour une cuisine : gros
   caractères, boutons énormes, écran qui reste allumé, et la voix dans les
   deux sens — le chef parle, et vous lui répondez.
   ========================================================================= */

const Reconnaissance = globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition ?? null;
const guide = { lecon: null, chef: null, index: 0, active: false, ecoute: false, reconnaissance: null, verrou: null, dernierArret: 0 };

const COMMANDES = [
  { motif: /\b(suivant|suivante|prochaine|prochain|continue|continuer|ok chef|d'accord chef|next)\b/, action: () => etapeGuide(guide.index + 1) },
  { motif: /\b(précédent|precedent|précédente|precedente|retour|recule|reviens|arrière|arriere)\b/, action: () => etapeGuide(guide.index - 1) },
  { motif: /\b(répète|repete|répéter|repeter|encore|redis|relis)\b/, action: () => direEtape() },
  { motif: /\b(minuterie|minuteur|chrono|lance le temps|compte à rebours)\b/, action: () => minuterieGuide() },
  { motif: /\b(combien de temps|temps restant|il reste combien)\b/, action: () => direTempsRestant() },
  { motif: /\b(piège|piege|attention|danger)\b/, action: () => direRemarque('piege') },
  { motif: /\b(réussite|reussite|c'est bon|c'est prêt|comment je sais)\b/, action: () => direRemarque('reussite') },
  { motif: /\b(pause|arrête|arrete|stop|silence|chut|tais-toi)\b/, action: () => taire() },
];

function rendreGuide(id, indexDepart = 0) {
  const lecon = leconParId(id);
  const vue = $('vue-guide');
  if (!lecon || lecon.statut !== 'publiee') {
    location.hash = lecon ? `#lecon/${id}` : '#parcours';
    return;
  }
  if (!peutOuvrir(lecon)) {
    location.hash = `#lecon/${id}`;
    setTimeout(ouvrirDialogueAcces, 50);
    return;
  }

  guide.lecon = lecon;
  guide.chef = chefParId(lecon.chefId);
  guide.index = Math.max(0, Math.min(lecon.etapes.length - 1, indexDepart));
  guide.active = true;

  vue.innerHTML = `
    <div class="guide">
      <div class="guide__entete">
        <a class="btn btn--fantome" href="#lecon/${lecon.id}">${icone('retour')} Quitter</a>
        <span class="guide__titre">${txt(lecon.titre)} · ${txt(guide.chef.titre)}</span>
        <span class="guide__ecoute" id="guide-ecoute">Micro éteint</span>
      </div>

      <div class="guide__corps" id="guide-corps"></div>

      <div class="guide__controles">
        <button type="button" class="btn btn--grand" id="guide-precedent">${icone('precedent', 22)}<span class="visuellement-cache">Précédent</span></button>
        <button type="button" class="btn btn--principal btn--grand" id="guide-suivant">Suivant ${icone('suivant', 22)}</button>
        <button type="button" class="btn btn--grand" id="guide-repeter" title="Réécouter l’étape">${icone('repete', 22)}<span class="visuellement-cache">Réécouter</span></button>
        <div class="guide__outils">
          <button type="button" class="btn" id="guide-minuterie" hidden>${icone('chrono', 16)} <span id="guide-minuterie-texte">Minuterie</span></button>
          <button type="button" class="btn" id="guide-micro" ${Reconnaissance ? '' : 'disabled title="Ce navigateur n’a pas de reconnaissance vocale"'}>${icone('micro', 16)} Commandes vocales</button>
          <button type="button" class="btn" id="guide-voix">${icone(etat.voix ? 'son' : 'muet', 16)} Voix du chef</button>
        </div>
      </div>
      <p class="guide__aide">
        Dites <strong>« suivant »</strong>, <strong>« répète »</strong>, <strong>« minuterie »</strong>, <strong>« combien de temps »</strong>,
        <strong>« le piège »</strong> ou <strong>« pause »</strong>. Les flèches du clavier fonctionnent aussi.
      </p>
    </div>`;

  $('guide-precedent').addEventListener('click', () => etapeGuide(guide.index - 1));
  $('guide-suivant').addEventListener('click', () => etapeGuide(guide.index + 1));
  $('guide-repeter').addEventListener('click', () => direEtape());
  $('guide-minuterie').addEventListener('click', () => minuterieGuide());
  $('guide-micro').addEventListener('click', () => (guide.ecoute ? arreterEcoute() : demarrerEcoute()));
  $('guide-voix').addEventListener('click', () => {
    etat.voix = !etat.voix;
    enregistrer();
    $('guide-voix').innerHTML = `${icone(etat.voix ? 'son' : 'muet', 16)} Voix du chef`;
    if (etat.voix) direEtape();
    else taire();
  });

  demanderVerrouEcran();
  etapeGuide(guide.index);
}

function etapeGuide(index) {
  if (!guide.active) return;
  const { lecon, chef } = guide;
  if (index >= lecon.etapes.length) {
    marquer(lecon, 'vu');
    taire();
    ouvrirEvaluation(lecon);
    return;
  }
  guide.index = Math.max(0, index);
  const etape = lecon.etapes[guide.index];
  const portions = portionsDe(lecon);

  $('guide-corps').innerHTML = `
    ${portraitChef(chef, { taille: 96 })}
    <div>
      <p class="guide__numero">Étape ${guide.index + 1} sur ${lecon.etapes.length}${etape.duree ? ` · ${txt(etape.duree)}` : ''}</p>
      <h1 class="guide__etape-titre">${txt(etape.titre)}</h1>
      <p class="guide__texte">${txt(remplacerCles(etape.texte, lecon, portions))}</p>
      <div class="guide__remarques">
        ${etape.piege ? `<div class="remarque remarque--piege"><span class="remarque__cle">Le piège</span>${txt(etape.piege)}</div>` : ''}
        ${etape.reussite ? `<div class="remarque remarque--reussite"><span class="remarque__cle">Signe de réussite</span>${txt(etape.reussite)}</div>` : ''}
      </div>
    </div>
    <div class="guide__scene">${rendreScene(etape.scene)}</div>`;

  $('guide-precedent').disabled = guide.index === 0;
  $('guide-suivant').innerHTML = guide.index === lecon.etapes.length - 1 ? `Terminer ${icone('coche', 22, 2.4)}` : `Suivant ${icone('suivant', 22)}`;
  const boutonMinuterie = $('guide-minuterie');
  boutonMinuterie.hidden = !etape.minuterie;
  if (etape.minuterie) $('guide-minuterie-texte').textContent = `Minuterie ${formaterDuree(etape.minuterie)}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  direEtape();
}

function direEtape() {
  if (!guide.active) return;
  const { lecon, chef } = guide;
  const etape = lecon.etapes[guide.index];
  const narration = remplacerCles(etape.voix, lecon, portionsDe(lecon));
  parler(`Étape ${guide.index + 1}. ${etape.titre}. ${narration}`, chef);
}

function direRemarque(quoi) {
  const etape = guide.lecon.etapes[guide.index];
  const texte = etape[quoi];
  if (!texte) return parler(quoi === 'piege' ? 'Pas de piège particulier à cette étape.' : 'Faites confiance à la consigne : il n’y a pas de signe caché ici.', guide.chef);
  parler(`${quoi === 'piege' ? 'Le piège' : 'Le signe de réussite'} : ${texte}`, guide.chef);
}

function minuterieGuide() {
  const etape = guide.lecon.etapes[guide.index];
  if (!etape.minuterie) return parler('Cette étape n’a pas de minuterie. Dites « suivant » quand vous êtes prêt.', guide.chef);
  lancerMinuteur(etape.minuterie, etape.titre, guide.chef);
  parler(`Minuterie lancée : ${formaterDuree(etape.minuterie)}. Je vous préviens quand c’est l’heure.`, guide.chef);
}

function direTempsRestant() {
  const reste = tempsRestant();
  if (!reste) return parler('Aucune minuterie ne tourne en ce moment.', guide.chef);
  const m = reste.minutes ? `${reste.minutes} minute${reste.minutes > 1 ? 's' : ''}` : '';
  const s = reste.secondes ? `${reste.secondes} seconde${reste.secondes > 1 ? 's' : ''}` : '';
  parler(`Il reste ${[m, s].filter(Boolean).join(' et ')} pour ${reste.nom}.`, guide.chef);
}

function demarrerEcoute() {
  if (!Reconnaissance) return;
  try {
    const reco = new Reconnaissance();
    reco.lang = 'fr-CA';
    reco.continuous = true;
    reco.interimResults = false;
    reco.maxAlternatives = 1;

    reco.onresult = (evenement) => {
      // Le micro entend aussi le chef : on ignore ce qui arrive pendant qu'il
      // parle, et dans la demi-seconde qui suit.
      if (enTrainDeParler || Date.now() - guide.dernierArret < 600) return;
      const dernier = evenement.results[evenement.results.length - 1];
      if (!dernier.isFinal) return;
      const phrase = dernier[0].transcript.toLowerCase().trim();
      const commande = COMMANDES.find((c) => c.motif.test(phrase));
      if (commande) {
        signaler(`Entendu : « ${phrase} »`, 1800);
        commande.action();
      }
    };
    reco.onend = () => {
      // Le navigateur coupe l'écoute après un silence : on la relance tant
      // que l'utilisateur ne l'a pas éteinte.
      if (guide.ecoute && guide.active) setTimeout(() => guide.reconnaissance?.start?.(), 250);
    };
    reco.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        arreterEcoute();
        signaler('Le micro est refusé. Autorisez-le dans la barre d’adresse, puis réessayez.', 5000);
      }
    };

    guide.reconnaissance = reco;
    guide.ecoute = true;
    reco.start();
    rendreEcoute();
  } catch {
    signaler('La reconnaissance vocale n’a pas pu démarrer.');
  }
}

function arreterEcoute() {
  guide.ecoute = false;
  try {
    guide.reconnaissance?.stop();
  } catch {
    /* déjà arrêtée */
  }
  guide.reconnaissance = null;
  rendreEcoute();
}

function rendreEcoute() {
  const indicateur = $('guide-ecoute');
  const bouton = $('guide-micro');
  if (!indicateur || !bouton) return;
  indicateur.textContent = guide.ecoute ? 'Je vous écoute' : 'Micro éteint';
  indicateur.classList.toggle('guide__ecoute--active', guide.ecoute);
  bouton.setAttribute('aria-pressed', String(guide.ecoute));
  bouton.innerHTML = `${icone(guide.ecoute ? 'micro' : 'micro-off', 16)} Commandes vocales`;
}

async function demanderVerrouEcran() {
  if (!navigator.wakeLock) return;
  try {
    guide.verrou = await navigator.wakeLock.request('screen');
  } catch {
    /* batterie faible ou onglet caché : l'écran s'éteindra comme d'habitude */
  }
}

document.addEventListener('visibilitychange', () => {
  // Le navigateur relâche le verrou dès que l'onglet est caché ; on le
  // redemande au retour, tant que le mode mains libres est ouvert.
  if (document.visibilityState === 'visible' && guide.active) demanderVerrouEcran();
});

function quitterGuide() {
  guide.active = false;
  arreterEcoute();
  taire();
  guide.verrou?.release?.().catch?.(() => {});
  guide.verrou = null;
}

/* =========================================================================
   L'évaluation (dialogue commun à la capsule et au mode mains libres)
   ========================================================================= */

let leconEvaluee = null;

function ouvrirEvaluation(lecon) {
  leconEvaluee = lecon;
  const chef = chefParId(lecon.chefId);
  $('evaluation-corps').innerHTML = `
    <div style="display:flex;gap:.9rem;align-items:center">
      ${portraitChef(chef, { taille: 64 })}
      <p style="margin:0">Alors, <strong>${txt(lecon.titre.toLowerCase())}</strong> : ${txt(lecon.resultat.split('.')[0].toLowerCase())} ? Dites-le à ${txt(chef.titre)} — c’est ce qui fait avancer votre arbre des techniques.</p>
    </div>`;
  $('dlg-evaluation').showModal();
}

$('btn-reussi').addEventListener('click', () => conclureEvaluation('reussi'));
$('btn-a-refaire').addEventListener('click', () => conclureEvaluation('a-refaire'));

function conclureEvaluation(statut) {
  if (!leconEvaluee) return;
  marquer(leconEvaluee, statut);
  const chef = chefParId(leconEvaluee.chefId);
  const mot = statut === 'reussi' ? leconEvaluee.debrief.reussi : leconEvaluee.debrief.aRefaire;
  $('dlg-evaluation').close();
  location.hash = `#lecon/${leconEvaluee.id}`;
  setTimeout(() => {
    parler(mot, chef);
    signaler(statut === 'reussi' ? 'Techniques acquises ! Regardez votre arbre.' : 'Noté. Le mot du chef est sur la fiche.', 4000);
  }, 200);
}

/* =========================================================================
   Vue : l'arbre des techniques
   ========================================================================= */

function techniqueAcquise(techniqueId) {
  return LECONS.some((l) => l.techniques.includes(techniqueId) && progressionDe(l) === 'reussi');
}

function etatTechnique(techniqueId) {
  const lecons = LECONS.filter((l) => l.techniques.includes(techniqueId));
  if (lecons.some((l) => progressionDe(l) === 'reussi')) return 'acquise';
  if (lecons.some((l) => ['vu', 'a-refaire'].includes(progressionDe(l)))) return 'en-cours';
  if (lecons.every((l) => l.statut !== 'publiee')) return 'a-venir';
  return 'disponible';
}

/** La prochaine leçon à faire : publiée, pas encore réussie, dont les prérequis sont acquis. */
function prochaineLecon() {
  const candidates = leconsPubliees().filter((l) => progressionDe(l) !== 'reussi');
  return (
    candidates.find((l) => peutOuvrir(l) && l.conseilleApres.every(techniqueAcquise)) ??
    candidates.find((l) => l.conseilleApres.every(techniqueAcquise)) ??
    candidates[0] ??
    null
  );
}

function rendreTechniques() {
  const toutes = Object.keys(TECHNIQUES);
  const acquises = toutes.filter(techniqueAcquise);
  const reussies = LECONS.filter((l) => progressionDe(l) === 'reussi').length;
  $('techniques-resume').textContent = acquises.length
    ? `${acquises.length} technique${acquises.length > 1 ? 's' : ''} acquise${acquises.length > 1 ? 's' : ''} sur ${toutes.length}, en ${reussies} leçon${reussies > 1 ? 's' : ''} réussie${reussies > 1 ? 's' : ''}.`
    : `${toutes.length} techniques à conquérir. Chaque leçon réussie en allume quelques-unes.`;

  const prochaine = prochaineLecon();
  const conseil = prochaine
    ? `<div class="conseil">
        ${portraitChef(chefParId(prochaine.chefId), { taille: 56 })}
        <div>
          <p class="debrief__nom">Prochaine leçon conseillée</p>
          <p><a href="#lecon/${prochaine.id}"><strong>${txt(prochaine.titre)}</strong></a> — ${txt(prochaine.accroche)}</p>
        </div>
      </div>`
    : `<div class="conseil"><p>Vous avez tout réussi. La Brigade prépare la suite.</p></div>`;

  $('arbre').innerHTML =
    FAMILLES.map((famille) => {
      const ids = toutes.filter((t) => TECHNIQUES[t].famille === famille.id);
      const gagnees = ids.filter(techniqueAcquise).length;
      const complete = gagnees === ids.length;
      return `
        <section class="famille ${complete ? 'famille--complete' : ''}" aria-labelledby="famille-${famille.id}">
          <div class="famille__entete">
            <span class="famille__emoji" aria-hidden="true">${famille.emoji}</span>
            <h2 class="famille__titre" id="famille-${famille.id}">${txt(famille.nom)}</h2>
            <span class="famille__compte">${complete ? `<span class="badge">${icone('etoile', 13)} Maîtrisée</span>` : `${gagnees} / ${ids.length}`}</span>
          </div>
          <div class="famille__piste"><div class="famille__barre" style="width:${(gagnees / ids.length) * 100}%"></div></div>
          <div class="techniques">
            ${ids
              .map((t) => {
                const situation = etatTechnique(t);
                const lecon = leconPourTechnique(t);
                const marque = situation === 'acquise' ? icone('coche', 13, 2.4) : situation === 'en-cours' ? icone('oeil', 13) : situation === 'a-venir' ? icone('chrono', 13) : icone('etoile', 13);
                const contenu = `${marque} ${txt(TECHNIQUES[t].nom)}`;
                return lecon && lecon.statut === 'publiee'
                  ? `<a class="technique technique--${situation}" href="#lecon/${lecon.id}" title="${txt(lecon.titre)}">${contenu}</a>`
                  : `<span class="technique technique--${situation}" title="Leçon en préparation">${contenu}</span>`;
              })
              .join('')}
          </div>
        </section>`;
    }).join('') + conseil;
}

/* =========================================================================
   Vue : rejoindre, et le dialogue d'accès
   ========================================================================= */

function rendreRejoindre() {
  $('offre-prix').textContent = CONFIG.prix;
  $('offre-detail').textContent = CONFIG.prixDetail;

  const bouton = $('btn-payer');
  if (CONFIG.lienPaiement) {
    bouton.href = CONFIG.lienPaiement;
    bouton.removeAttribute('aria-disabled');
    $('offre-note').textContent = 'Paiement sécurisé par Stripe. Votre code d’accès s’affiche sur la page de confirmation — gardez-le.';
  } else {
    bouton.href = '#rejoindre';
    bouton.setAttribute('aria-disabled', 'true');
    bouton.style.opacity = '.55';
    $('offre-note').textContent = CONFIG.modeDemo
      ? 'Le paiement n’est pas encore branché : le site est en démonstration et tout est ouvert.'
      : 'Le paiement n’est pas encore branché. Revenez bientôt.';
  }

  const etatAcces = $('acces-etat');
  if (estDeverrouille()) {
    etatAcces.innerHTML = `${icone('cadenas-ouvert', 14)} Accès complet actif sur cet appareil. <button type="button" class="btn btn--petit btn--fantome" id="btn-oublier">Oublier l’accès ici</button>`;
    $('btn-oublier').addEventListener('click', () => {
      verrouiller();
      signaler('Accès oublié sur cet appareil.');
      rafraichirAcces();
    });
  } else if (CONFIG.modeDemo) {
    etatAcces.textContent = 'Site en démonstration : tout est ouvert sans code pour l’instant.';
  } else {
    etatAcces.textContent = 'Vous n’avez pas encore entré de code sur cet appareil.';
  }
}

async function soumettreCode(champ, zoneEtat) {
  const code = champ.value;
  zoneEtat.textContent = 'Vérification…';
  zoneEtat.dataset.etat = '';
  const resultat = await verifierCode(code);
  zoneEtat.textContent = resultat.message;
  zoneEtat.dataset.etat = resultat.ok ? 'ok' : 'erreur';
  if (resultat.ok) {
    champ.value = '';
    rafraichirAcces();
    return true;
  }
  return false;
}

$('form-code').addEventListener('submit', (e) => {
  e.preventDefault();
  soumettreCode($('champ-code'), $('code-etat'));
});

$('form-code-dialogue').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ok = await soumettreCode($('champ-code-dialogue'), $('code-etat-dialogue'));
  if (ok) setTimeout(() => $('dlg-acces').close(), 900);
});

function ouvrirDialogueAcces() {
  $('code-etat-dialogue').textContent = '';
  $('dlg-acces').showModal();
}

/** Après un changement d'accès, tout ce qui dépend du cadenas se redessine. */
function rafraichirAcces() {
  $('bandeau-demo').hidden = !CONFIG.modeDemo;
  rendreRejoindre();
  afficherRoute();
}

document.querySelectorAll('dialog [data-fermer]').forEach((b) =>
  b.addEventListener('click', () => b.closest('dialog').close()),
);
document.querySelectorAll('dialog').forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  }),
);

/* =========================================================================
   Thème
   ========================================================================= */

function appliquerTheme() {
  if (etat.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = etat.theme;
  $('btn-theme').title = `${LIBELLE_THEME[etat.theme]}. Changer`;
}

$('btn-theme').addEventListener('click', () => {
  etat.theme = THEMES[(THEMES.indexOf(etat.theme) + 1) % THEMES.length];
  appliquerTheme();
  enregistrer();
  signaler(LIBELLE_THEME[etat.theme]);
});

/* =========================================================================
   Navigation par l'adresse : #accueil, #parcours/<id>, #lecon/<id>,
   #capsule/<id>/<étape>, #guide/<id>/<étape>, #techniques, #rejoindre
   ========================================================================= */

const VUES = ['accueil', 'parcours', 'lecon', 'capsule', 'guide', 'techniques', 'rejoindre'];
let vueCourante = null;

function afficherRoute() {
  const [vue = 'accueil', param = '', indice = '0'] = location.hash.replace(/^#\/?/, '').split('/');
  const nom = VUES.includes(vue) ? vue : 'accueil';

  // On quitte proprement les vues qui parlent ou qui écoutent.
  if (vueCourante === 'capsule' && !(nom === 'capsule')) quitterCapsule();
  if (vueCourante === 'guide' && !(nom === 'guide')) quitterGuide();
  if (vueCourante === 'accueil' && nom !== 'accueil') arreterHeros();
  if (nom === 'capsule') quitterCapsule();
  if (nom === 'guide') quitterGuide();

  for (const v of VUES) $(`vue-${v}`).hidden = v !== nom;
  document.querySelectorAll('.navigation__lien').forEach((lien) => {
    const actif = lien.dataset.nav === nom || (lien.dataset.nav === 'parcours' && ['lecon', 'capsule', 'guide'].includes(nom));
    if (actif) lien.setAttribute('aria-current', 'page');
    else lien.removeAttribute('aria-current');
  });

  switch (nom) {
    case 'accueil':
      rendreAccueil();
      demarrerHeros();
      break;
    case 'parcours':
      rendreParcours();
      if (param) setTimeout(() => $(`parcours-${param}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
      break;
    case 'lecon':
      rendreLecon(param);
      break;
    case 'capsule':
      rendreCapsule(param, Number(indice) || 0);
      break;
    case 'guide':
      rendreGuide(param, Number(indice) || 0);
      break;
    case 'techniques':
      rendreTechniques();
      break;
    case 'rejoindre':
      rendreRejoindre();
      break;
  }

  if (vueCourante !== nom && !(nom === 'parcours' && param)) window.scrollTo(0, 0);
  vueCourante = nom;
  document.title =
    nom === 'lecon' && leconParId(param)
      ? `${leconParId(param).titre} — La Brigade`
      : nom === 'accueil'
        ? 'La Brigade — l’école de cuisine qui cuisine avec vous'
        : `${{ parcours: 'Les parcours', capsule: 'Capsule', guide: 'Cuisine guidée', techniques: 'Mes techniques', rejoindre: 'Rejoindre' }[nom]} — La Brigade`;
}

window.addEventListener('hashchange', afficherRoute);

document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (vueCourante === 'capsule' && capsule.active) {
    if (e.key === ' ') { e.preventDefault(); basculerLecture(); }
    if (e.key === 'ArrowRight') allerEtape(capsule.index + 1);
    if (e.key === 'ArrowLeft') allerEtape(capsule.index - 1);
  }
  if (vueCourante === 'guide' && guide.active) {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); etapeGuide(guide.index + 1); }
    if (e.key === 'ArrowLeft') etapeGuide(guide.index - 1);
    if (e.key.toLowerCase() === 'r') direEtape();
  }
});

// Parler ne survit pas à la fermeture de l'onglet ; les minuteries non plus,
// autant le dire honnêtement.
window.addEventListener('beforeunload', () => {
  taire();
});

/* =========================================================================
   Démarrage
   ========================================================================= */

charger();
appliquerTheme();
$('bandeau-demo').hidden = !CONFIG.modeDemo;

// Un code arrivé par l'adresse (page de retour de Stripe) se valide tout seul.
const codeRecu = codeDansAdresse();
if (codeRecu) {
  verifierCode(codeRecu).then((resultat) => {
    signaler(resultat.message, 6000);
    if (resultat.ok && !location.hash) location.hash = '#parcours';
    rafraichirAcces();
  });
}

afficherRoute();
