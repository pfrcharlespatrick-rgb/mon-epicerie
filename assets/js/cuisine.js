/**
 * Ma Cuisine — branchement de l'interface.
 *
 * Quatre choses vivent côte à côte, et il vaut la peine de les distinguer :
 *
 *   les recettes    livrées avec l'application, dans `recettes.js`. On ne les
 *                   modifie pas depuis le navigateur : elles sont corrigées
 *                   dans le code et arrivent au prochain chargement.
 *   le menu         un plat principal, et ceux de ses entrées et de ses
 *                   accompagnements que l'on a retenus. C'est le menu qui
 *                   porte le calendrier à rebours et la liste d'épicerie :
 *                   quatorze convives, ce n'est pas quatorze fois une recette,
 *                   c'est six plats qui se disputent un seul four.
 *   les réglages    portions, jour et heure du service, étapes cochées, notes.
 *                   localStorage, quelques kilo-octets, jamais de photo.
 *   les photos      garde-manger, frigo, étiquettes. IndexedDB, parce qu'une
 *                   image dépasse largement ce que localStorage tolère.
 *
 * Rien ne sort de l'appareil : pas de serveur, pas de compte, pas de requête.
 */

import { RECETTES, enCelsius } from './recettes.js';

/* =========================================================================
   Réglages persistants
   ========================================================================= */

const CLE_ETAT = 'mon-epicerie/cuisine/v1';
const THEMES = ['auto', 'clair', 'sombre'];
const LIBELLE_THEME = {
  auto: 'Thème du système',
  clair: 'Thème clair',
  sombre: 'Thème sombre',
};

const PRINCIPAUX = RECETTES.filter((r) => r.type === 'principal');
const parId = (id) => RECETTES.find((r) => r.id === id);

/** L'état par défaut. Quatorze convives : c'est la tablée habituelle ici. */
const etat = {
  theme: 'auto',
  /** Le plat autour duquel le menu se construit. */
  principalId: PRINCIPAUX[0].id,
  /** La recette actuellement ouverte dans l'onglet « La recette ». */
  recetteId: PRINCIPAUX[0].id,
  portions: 14,
  serviceDate: '',
  serviceHeure: '18:00',
  vue: 'menu',
  categoriePhoto: 'garde-manger',
  filtrePhoto: '',
  /** { [principalId]: string[] } — entrées et accompagnements retenus. */
  menus: {},
  /** { [recetteId]: number[] } — index des étapes cochées. */
  etapesFaites: {},
  /** { [recetteId]: string } */
  notes: {},
};

function charger() {
  let brut = null;
  try {
    brut = JSON.parse(localStorage.getItem(CLE_ETAT) ?? 'null');
  } catch {
    brut = null; // Stockage illisible : on repart proprement plutôt que d'échouer.
  }
  if (!brut || typeof brut !== 'object') return;

  if (THEMES.includes(brut.theme)) etat.theme = brut.theme;
  if (PRINCIPAUX.some((r) => r.id === brut.principalId)) etat.principalId = brut.principalId;
  if (parId(brut.recetteId)) etat.recetteId = brut.recetteId;
  if (Number.isFinite(brut.portions)) etat.portions = Math.min(80, Math.max(1, brut.portions));
  if (typeof brut.serviceDate === 'string') etat.serviceDate = brut.serviceDate;
  if (typeof brut.serviceHeure === 'string') etat.serviceHeure = brut.serviceHeure;
  if (typeof brut.categoriePhoto === 'string') etat.categoriePhoto = brut.categoriePhoto;
  if (brut.menus && typeof brut.menus === 'object') etat.menus = brut.menus;
  if (brut.etapesFaites && typeof brut.etapesFaites === 'object') etat.etapesFaites = brut.etapesFaites;
  if (brut.notes && typeof brut.notes === 'object') etat.notes = brut.notes;
}

function enregistrer() {
  try {
    localStorage.setItem(
      CLE_ETAT,
      JSON.stringify({
        theme: etat.theme,
        principalId: etat.principalId,
        recetteId: etat.recetteId,
        portions: etat.portions,
        serviceDate: etat.serviceDate,
        serviceHeure: etat.serviceHeure,
        categoriePhoto: etat.categoriePhoto,
        menus: etat.menus,
        etapesFaites: etat.etapesFaites,
        notes: etat.notes,
      }),
    );
  } catch {
    signaler('Impossible d’enregistrer : la mémoire du navigateur est pleine.');
  }
}

/* =========================================================================
   Photos — IndexedDB
   ========================================================================= */

const BD_NOM = 'mon-epicerie-cuisine';
const BD_MAGASIN = 'photos';
let bd = null;

function ouvrirBase() {
  if (bd) return Promise.resolve(bd);
  return new Promise((resoudre, rejeter) => {
    const requete = indexedDB.open(BD_NOM, 1);
    requete.onupgradeneeded = () => {
      const base = requete.result;
      if (!base.objectStoreNames.contains(BD_MAGASIN)) {
        base.createObjectStore(BD_MAGASIN, { keyPath: 'id' });
      }
    };
    requete.onsuccess = () => {
      bd = requete.result;
      resoudre(bd);
    };
    requete.onerror = () => rejeter(requete.error);
  });
}

function transaction(mode) {
  return ouvrirBase().then((base) => base.transaction(BD_MAGASIN, mode).objectStore(BD_MAGASIN));
}

const attendre = (requete) =>
  new Promise((resoudre, rejeter) => {
    requete.onsuccess = () => resoudre(requete.result);
    requete.onerror = () => rejeter(requete.error);
  });

const listerPhotos = () => transaction('readonly').then((m) => attendre(m.getAll()));
const ecrirePhoto = (photo) => transaction('readwrite').then((m) => attendre(m.put(photo)));
const effacerPhoto = (id) => transaction('readwrite').then((m) => attendre(m.delete(id)));

/** Copie locale, pour éviter de relire la base à chaque rendu. */
let photos = [];

/**
 * Réduit une image avant de la stocker.
 *
 * Une photo de téléphone pèse aujourd'hui 4 Mo ; on n'en a besoin ni pour
 * lire une étiquette à l'écran ni pour l'imprimer. 1400 pixels sur le grand
 * côté et une compression JPEG à 0,72 ramènent ça autour de 200 ko, ce qui
 * laisse de la place pour des centaines de photos.
 */
async function reduireImage(fichier) {
  const MAX = 1400;
  const image = await createImageBitmap(fichier);
  const facteur = Math.min(1, MAX / Math.max(image.width, image.height));
  const largeur = Math.round(image.width * facteur);
  const hauteur = Math.round(image.height * facteur);

  const toile = document.createElement('canvas');
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext('2d').drawImage(image, 0, 0, largeur, hauteur);
  image.close?.();

  return toile.toDataURL('image/jpeg', 0.72);
}

/* =========================================================================
   Petits utilitaires
   ========================================================================= */

const $ = (id) => document.getElementById(id);

/** Échappe le texte destiné à innerHTML. */
function txt(valeur) {
  return String(valeur ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

/** Affiche un message éphémère en bas de l'écran. */
function signaler(message) {
  const bulle = document.createElement('div');
  bulle.className = 'notification';
  bulle.textContent = message;
  $('notifications').append(bulle);
  setTimeout(() => bulle.remove(), 3200);
}

const NOMS_CATEGORIES = {
  'garde-manger': 'Garde-manger',
  frigo: 'Réfrigérateur',
  congelateur: 'Congélateur',
  etiquette: 'Étiquette de viande',
  resultat: 'Résultat en assiette',
};

const principal = () => parId(etat.principalId) ?? PRINCIPAUX[0];
const recetteCourante = () => parId(etat.recetteId) ?? principal();

/** Les identifiants retenus au menu pour le plat principal courant. */
const auMenu = () => etat.menus[etat.principalId] ?? [];

/** Le plat principal et tout ce qu'on a retenu autour, dans l'ordre du service. */
function menuComplet() {
  const ordre = { entree: 0, principal: 1, accompagnement: 2 };
  return [principal(), ...auMenu().map(parId).filter(Boolean)].sort(
    (a, b) => ordre[a.type] - ordre[b.type],
  );
}

/** Met un nombre en forme à la française : virgule décimale. */
function nombreFr(valeur, decimales = 0) {
  return valeur.toLocaleString('fr-CA', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/**
 * Met une quantité à l'échelle et l'arrondit à quelque chose de mesurable.
 *
 * Personne ne pèse 43,7 g de paprika. On arrondit donc d'autant plus
 * grossièrement que la quantité est grande, et on bascule en kilos ou en
 * litres au-delà de mille.
 */
function formaterQuantite(q, u, recette) {
  if (q === null || q === undefined) return '';
  const v = q * (etat.portions / recette.portions);

  if (u === 'g' && v >= 1000) return `${nombreFr(v / 1000, 2)} kg`;
  if (u === 'ml' && v >= 1000) return `${nombreFr(v / 1000, 2)} L`;

  let arrondi;
  if (v >= 100) arrondi = Math.round(v / 5) * 5;
  else if (v >= 20) arrondi = Math.round(v);
  else arrondi = Math.round(v * 2) / 2;

  const decimales = Number.isInteger(arrondi) ? 0 : 1;
  return u ? `${nombreFr(arrondi, decimales)} ${u}` : nombreFr(arrondi, decimales);
}

/**
 * Extrait une durée en minutes d'un libellé comme « 2 h 30 à 3 h 30 ».
 * On retient toujours la borne basse : c'est le moment où l'on doit
 * commencer à surveiller, pas celui où l'on aura fini.
 */
function minutesDeDuree(texte) {
  if (!texte) return null;
  const heures = texte.match(/(\d+)\s*h(?:\s*(\d+))?/i);
  if (heures) return Number(heures[1]) * 60 + Number(heures[2] ?? 0);
  const minutes = texte.match(/(\d+)\s*min/i);
  if (minutes) return Number(minutes[1]);
  return null;
}

/** Formate un nombre de minutes en « 2 j », « 4 h 15 », « 50 min ». */
function formaterDelai(minutes) {
  if (minutes === 0) return '—';
  const jours = Math.floor(minutes / 1440);
  const heures = Math.floor((minutes % 1440) / 60);
  const reste = minutes % 60;
  if (jours) return `${jours} j${heures ? ` ${heures} h` : ''}`;
  if (heures) return `${heures} h${reste ? ` ${String(reste).padStart(2, '0')}` : ''}`;
  return `${reste} min`;
}

/* =========================================================================
   Construction d'une fiche de recette

   Le même code sert à l'écran et au papier. `interactif` n'ajoute que les
   boutons — cocher une étape, lancer un minuteur — qui n'ont aucun sens
   une fois imprimés.
   ========================================================================= */

function htmlChapeau(r) {
  return `
    <div class="chapeau">
      <h2 class="chapeau__titre">${txt(r.titre)}</h2>
      <p class="chapeau__sous-titre">${txt(r.sousTitre)}</p>
      <div class="jetons">
        <span class="jeton">${txt(etat.portions)} convives</span>
        ${r.role ? `<span class="jeton">${txt(r.role)}</span>` : ''}
        <span class="jeton">${txt(r.duree)}</span>
        <span class="jeton">${txt(r.difficulte)}</span>
      </div>
      <p style="margin-top:0.9rem">${txt(r.resume)}</p>
    </div>`;
}

function htmlAvertissements(r) {
  if (!r.avertissements?.length) return '';
  return `
    <section class="carte">
      <h2 class="carte__titre">À lire avant de commencer</h2>
      ${r.avertissements
        .map(
          (a) => `
            <div class="alerte">
              <h3 class="alerte__titre">${txt(a.titre)}</h3>
              <p>${txt(a.texte)}</p>
            </div>`,
        )
        .join('')}
    </section>`;
}

function htmlTemperatures(r) {
  if (!r.temperatures?.length) return '';
  return `
    <section class="carte">
      <h2 class="carte__titre">Les chiffres à viser <small>°F, avec l’équivalent en °C</small></h2>
      <div class="temperatures">
        ${r.temperatures
          .map(
            (t) => `
              <div class="temperature">
                <div class="temperature__valeur">${txt(t.f)} °F<small>· ${txt(enCelsius(t.f))} °C</small></div>
                <div class="temperature__quoi">${txt(t.quoi)}</div>
                ${t.note ? `<div class="temperature__note">${txt(t.note)}</div>` : ''}
              </div>`,
          )
          .join('')}
      </div>
    </section>`;
}

function htmlIngredients(r, interactif) {
  const echelle =
    etat.portions === r.portions
      ? `pour ${etat.portions} convives`
      : `recette écrite pour ${r.portions}, mise à l’échelle pour ${etat.portions}`;

  return `
    <section class="carte">
      <h2 class="carte__titre">
        Ingrédients <small>${txt(echelle)}</small>
        ${
          interactif
            ? `<button type="button" class="btn btn--petit sans-impression" id="btn-copier-ingredients"
                       style="margin-left:auto">Copier la liste du menu</button>`
            : ''
        }
      </h2>
      ${r.ingredients
        .map(
          (groupe) => `
            <div class="groupe-ingredients">
              <h3 class="groupe-ingredients__titre">${txt(groupe.groupe)}</h3>
              ${groupe.items
                .map(
                  (i) => `
                    <div class="ingredient">
                      <span class="ingredient__quantite">${txt(formaterQuantite(i.q, i.u, r))}</span>
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
        .join('')}
    </section>`;
}

function htmlMateriel(r) {
  if (!r.materiel?.length) return '';
  return `
    <section class="carte">
      <h2 class="carte__titre">Le matériel</h2>
      ${r.materiel
        .map((m) => `<div class="ingredient"><span class="ingredient__corps">${txt(m)}</span></div>`)
        .join('')}
    </section>`;
}

function htmlEtapes(r, interactif) {
  const faites = etat.etapesFaites[r.id] ?? [];
  return `
    <section class="carte">
      <h2 class="carte__titre">
        Les étapes
        ${
          interactif
            ? `<button type="button" class="btn btn--petit sans-impression" id="btn-decocher"
                       style="margin-left:auto">Tout décocher</button>`
            : ''
        }
      </h2>
      ${r.etapes
        .map((e, index) => {
          const minutes = minutesDeDuree(e.duree);
          const minutable = interactif && minutes !== null && minutes <= 360;
          return `
            <div class="etape ${faites.includes(index) ? 'etape--faite' : ''}">
              <div class="etape__numero">${index + 1}</div>
              <div class="etape__corps">
                <div class="etape__entete">
                  <h3 class="etape__titre">${txt(e.titre)}</h3>
                  ${e.duree ? `<span class="etape__duree">${txt(e.duree)}</span>` : ''}
                  ${
                    e.temperature
                      ? `<span class="etape__temperature">${txt(e.temperature)} °F · ${txt(enCelsius(e.temperature))} °C</span>`
                      : ''
                  }
                </div>
                <p>${txt(e.texte)}</p>
                ${
                  e.piege
                    ? `<div class="remarque remarque--piege">
                         <span class="remarque__cle">Là où l’on gâche tout</span>${txt(e.piege)}
                       </div>`
                    : ''
                }
                ${
                  e.reussite
                    ? `<div class="remarque remarque--reussite">
                         <span class="remarque__cle">À quoi se reconnaît la réussite</span>${txt(e.reussite)}
                       </div>`
                    : ''
                }
                ${
                  interactif
                    ? `<div class="etape__actions sans-impression">
                         <button type="button" class="btn btn--petit" data-cocher="${index}">
                           ${faites.includes(index) ? '↩︎ Rouvrir cette étape' : '✓ Étape faite'}
                         </button>
                         ${
                           minutable
                             ? `<button type="button" class="btn btn--petit" data-minuteur="${minutes}"
                                        data-nom="${txt(e.titre)}">⏱ Minuteur ${formaterDelai(minutes)}</button>`
                             : ''
                         }
                       </div>`
                    : ''
                }
              </div>
            </div>`;
        })
        .join('')}
    </section>`;
}

function htmlMethodes(r) {
  if (!r.methodesInferieures?.length) return '';
  return `
    <section class="carte">
      <h2 class="carte__titre">Ce qu’on entend souvent, et ce que ça coûte</h2>
      ${r.methodesInferieures
        .map(
          (m) => `
            <div class="remarque">
              <span class="remarque__cle">${txt(m.titre)}</span>
              <p style="margin-top:0.25rem">${txt(m.texte)}</p>
            </div>`,
        )
        .join('')}
    </section>`;
}

function htmlFinition(r) {
  if (!r.conservation && !r.accompagnement) return '';
  return `
    <section class="carte">
      <h2 class="carte__titre">Conservation, réchauffage${r.accompagnement ? ' et accompagnement' : ''}</h2>
      ${
        r.conservation
          ? `<h3 class="groupe-ingredients__titre">Conservation et réchauffage</h3><p>${txt(r.conservation)}</p>`
          : ''
      }
      ${
        r.accompagnement
          ? `<h3 class="groupe-ingredients__titre" style="margin-top:1rem">Accompagnement</h3><p>${txt(r.accompagnement)}</p>`
          : ''
      }
    </section>`;
}

/** La fiche entière d'une recette. */
function htmlRecette(r, interactif = false) {
  return [
    htmlChapeau(r),
    htmlAvertissements(r),
    htmlTemperatures(r),
    htmlIngredients(r, interactif),
    htmlMateriel(r),
    htmlEtapes(r, interactif),
    htmlMethodes(r),
    htmlFinition(r),
  ].join('');
}

/* =========================================================================
   L'onglet « Le menu »
   ========================================================================= */

function carteSuggestion(suggestion) {
  const r = parId(suggestion.id);
  if (!r) return '';
  const retenu = auMenu().includes(r.id);
  return `
    <article class="plat ${retenu ? 'plat--retenu' : ''}">
      <div class="plat__entete">
        <h3 class="plat__titre">${txt(r.titre)}</h3>
        <span class="jeton">${txt(r.duree)}</span>
      </div>
      <p class="plat__role">${txt(r.role ?? '')}</p>
      <p class="plat__pourquoi">${txt(suggestion.pourquoi)}</p>
      <div class="plat__actions sans-impression">
        <button type="button" class="btn btn--petit ${retenu ? '' : 'btn--principal'}" data-menu="${txt(r.id)}">
          ${retenu ? '✓ Au menu — retirer' : '+ Mettre au menu'}
        </button>
        <button type="button" class="btn btn--petit" data-ouvrir="${txt(r.id)}">Voir la recette</button>
      </div>
    </article>`;
}

function rendreMenu() {
  const p = principal();
  const suggestions = p.suggestions ?? [];
  const retenus = auMenu();

  $('menu-principal').innerHTML = `
    <div class="plat plat--principal">
      <div class="plat__entete">
        <h3 class="plat__titre">${txt(p.titre)}</h3>
        <span class="jeton">${txt(p.duree)}</span>
      </div>
      <p class="plat__role">${txt(p.role ?? '')}</p>
      <p class="plat__pourquoi">${txt(p.sousTitre)}</p>
      <div class="plat__actions sans-impression">
        <button type="button" class="btn btn--petit" data-ouvrir="${txt(p.id)}">Voir la recette</button>
      </div>
    </div>`;

  const parType = (type) =>
    suggestions.filter((s) => parId(s.id)?.type === type).map(carteSuggestion).join('');

  $('menu-entrees').innerHTML =
    parType('entree') || '<p class="vide">Aucune entrée proposée pour ce plat.</p>';
  $('menu-accompagnements').innerHTML =
    parType('accompagnement') || '<p class="vide">Aucun accompagnement proposé pour ce plat.</p>';

  $('menu-compte').textContent = retenus.length
    ? `${retenus.length} plat${retenus.length > 1 ? 's' : ''} retenu${retenus.length > 1 ? 's' : ''} autour du principal`
    : 'Rien de retenu pour l’instant : le calendrier ne montre que le plat principal';
}

/* =========================================================================
   Calendrier à rebours — tout le menu sur une seule ligne du temps
   ========================================================================= */

/** L'heure du service, ou `null` si le jour n'a pas encore été choisi. */
function momentDuService() {
  if (!etat.serviceDate || !etat.serviceHeure) return null;
  const date = new Date(`${etat.serviceDate}T${etat.serviceHeure}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** « La veille », « L'avant-veille »… par différence de jours calendaires. */
function libelleJour(moment, service) {
  const jour = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ecart = Math.round((jour(service) - jour(moment)) / 86400000);
  if (ecart === 0) return 'Le jour même';
  if (ecart === 1) return 'La veille';
  if (ecart === 2) return 'L’avant-veille';
  return `${ecart} jours avant`;
}

/**
 * Fusionne les calendriers de tous les plats du menu.
 *
 * C'est ici que se joue le vrai service rendu : pris un par un, six plats
 * sont six recettes faciles ; pris ensemble, ce sont six plats qui se
 * disputent un four et une paire de mains. Une seule ligne du temps, du
 * geste le plus lointain au service, règle la question.
 */
function calendrierFusionne() {
  return menuComplet()
    .flatMap((r) => (r.rebours ?? []).map((e) => ({ ...e, plat: r.titre, platId: r.id })))
    .sort((a, b) => b.avant - a.avant);
}

function rendreRebours() {
  const service = momentDuService();
  const lignes = calendrierFusionne();

  $('rebours-service').textContent = service
    ? `service le ${service.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} à ${service.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}`
    : 'choisissez un jour et une heure de service';

  $('rebours-resume').textContent = `${menuComplet().length} plat${menuComplet().length > 1 ? 's' : ''} · ${lignes.length} gestes`;

  $('rebours').innerHTML = lignes
    .map((etape) => {
      let heure = '—';
      let jour = '';
      if (service) {
        const moment = new Date(service.getTime() - etape.avant * 60000);
        heure = moment.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
        jour = `${libelleJour(moment, service)}, ${moment.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}`;
      }
      return `
        <tr>
          <td class="rebours__heure">${txt(heure)}<span class="rebours__jour">${txt(jour)}</span></td>
          <td><span class="rebours__plat">${txt(etape.plat)}</span></td>
          <td>
            ${txt(etape.texte)}
            ${etape.four ? `<span class="etape__temperature">four ${txt(etape.four)} °F</span>` : ''}
          </td>
        </tr>`;
    })
    .join('');
}

/* =========================================================================
   Minuteries
   ========================================================================= */

const minuteries = [];
let horloge = null;

/** Un bip court, sans fichier son : trois notes montantes en sinus. */
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
    /* Le son n'est qu'un confort : son échec ne doit rien interrompre. */
  }
}

function lancerMinuteur(minutes, nom) {
  minuteries.push({ nom, fin: Date.now() + minutes * 60000, sonne: false });
  if (!horloge) horloge = setInterval(rendreMinuteries, 500);
  rendreMinuteries();
  signaler(`Minuteur lancé : ${formaterDelai(minutes)} — ${nom}`);
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
      }
      return `
        <div class="minuterie__carte ${reste === 0 ? 'minuterie__carte--fini' : ''}">
          <span class="minuterie__temps">${affichage}</span>
          <span class="minuterie__nom">${txt(m.nom)}</span>
          <button type="button" class="btn btn--petit" data-arreter="${index}" aria-label="Arrêter">✕</button>
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
   Photos
   ========================================================================= */

function rendreGalerie() {
  const visibles = photos
    .filter((p) => !etat.filtrePhoto || p.categorie === etat.filtrePhoto)
    .sort((a, b) => b.date - a.date);

  $('galerie-vide').hidden = visibles.length > 0;
  $('galerie').innerHTML = visibles
    .map(
      (p) => `
        <figure class="photo" style="margin:0">
          <img src="${p.dataUrl}" alt="${txt(NOMS_CATEGORIES[p.categorie] ?? 'Photo')}"
               data-voir="${txt(p.id)}" loading="lazy">
          <figcaption class="photo__corps">
            <textarea class="photo__note sans-impression" data-note="${txt(p.id)}"
                      placeholder="Ce qu'on y voit…">${txt(p.note ?? '')}</textarea>
            <p class="impression-seule">${txt(p.note ?? '')}</p>
            <span class="photo__pied">
              <span>${txt(NOMS_CATEGORIES[p.categorie] ?? p.categorie)} · ${new Date(p.date).toLocaleDateString('fr-CA')}</span>
              <button type="button" class="btn btn--petit btn--danger sans-impression"
                      data-supprimer="${txt(p.id)}" aria-label="Supprimer cette photo">✕</button>
            </span>
          </figcaption>
        </figure>`,
    )
    .join('');
}

async function ajouterFichiers(fichiers) {
  const images = [...fichiers].filter((f) => f.type.startsWith('image/'));
  if (!images.length) return;

  signaler(images.length === 1 ? 'Traitement de la photo…' : `Traitement de ${images.length} photos…`);

  for (const fichier of images) {
    try {
      const dataUrl = await reduireImage(fichier);
      const photo = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        categorie: etat.categoriePhoto,
        note: '',
        dataUrl,
        date: Date.now(),
      };
      await ecrirePhoto(photo);
      photos.push(photo);
    } catch {
      signaler(`Impossible de lire « ${fichier.name} ».`);
    }
  }

  rendreGalerie();
  signaler('Photos ajoutées.');
}

/* =========================================================================
   Sauvegarde et restauration
   ========================================================================= */

function sauvegarder() {
  const contenu = {
    format: 'mon-epicerie/cuisine',
    version: 2,
    exporteLe: new Date().toISOString(),
    reglages: {
      principalId: etat.principalId,
      recetteId: etat.recetteId,
      portions: etat.portions,
      serviceDate: etat.serviceDate,
      serviceHeure: etat.serviceHeure,
      menus: etat.menus,
      etapesFaites: etat.etapesFaites,
      notes: etat.notes,
    },
    photos,
  };

  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([JSON.stringify(contenu)], { type: 'application/json' }));
  lien.download = `ma-cuisine-${new Date().toISOString().slice(0, 10)}.json`;
  lien.click();
  URL.revokeObjectURL(lien.href);
  signaler('Sauvegarde enregistrée.');
}

async function restaurer(fichier) {
  let contenu;
  try {
    contenu = JSON.parse(await fichier.text());
  } catch {
    signaler('Ce fichier n’est pas une sauvegarde lisible.');
    return;
  }
  if (contenu?.format !== 'mon-epicerie/cuisine') {
    signaler('Ce fichier ne vient pas de Ma Cuisine.');
    return;
  }
  if (!confirm('Remplacer vos réglages et vos photos par ceux de la sauvegarde ?')) return;

  const r = contenu.reglages ?? {};
  if (PRINCIPAUX.some((x) => x.id === r.principalId)) etat.principalId = r.principalId;
  if (parId(r.recetteId)) etat.recetteId = r.recetteId;
  if (Number.isFinite(r.portions)) etat.portions = r.portions;
  if (typeof r.serviceDate === 'string') etat.serviceDate = r.serviceDate;
  if (typeof r.serviceHeure === 'string') etat.serviceHeure = r.serviceHeure;
  etat.menus = r.menus ?? {};
  etat.etapesFaites = r.etapesFaites ?? {};
  etat.notes = r.notes ?? {};

  for (const photo of photos) await effacerPhoto(photo.id);
  photos = [];
  for (const photo of contenu.photos ?? []) {
    await ecrirePhoto(photo);
    photos.push(photo);
  }

  enregistrer();
  toutRendre();
  signaler('Sauvegarde restaurée.');
}

/* =========================================================================
   Thème, onglets, impression
   ========================================================================= */

function appliquerTheme() {
  if (etat.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = etat.theme;
  $('btn-theme').title = `${LIBELLE_THEME[etat.theme]}. Changer`;
}

function afficherVue(nom) {
  etat.vue = nom;
  for (const section of document.querySelectorAll('.vue')) {
    section.hidden = section.id !== `vue-${nom}`;
  }
  for (const onglet of document.querySelectorAll('.onglet')) {
    onglet.setAttribute('aria-selected', String(onglet.dataset.vue === nom));
  }
}

/**
 * Imprime, soit la recette ouverte, soit le menu entier.
 *
 * Le menu entier passe par un conteneur à part, rempli à la demande : c'est
 * le seul moyen de sortir sur papier des recettes que l'écran n'affiche pas.
 */
function imprimer(mode) {
  if (mode === 'menu') {
    $('impression-menu').innerHTML = menuComplet()
      .map((r, rang) => `<div class="fiche ${rang ? 'fiche--suivante' : ''}">${htmlRecette(r, false)}</div>`)
      .join('');
  }
  document.body.classList.toggle('mode-menu', mode === 'menu');
  // On prépare l'en-tête ici plutôt que de compter sur `beforeprint` : selon
  // le navigateur, cet événement arrive après que la feuille est composée, et
  // l'en-tête resterait celui de l'impression précédente.
  preparerImpression();
  window.print();
}

window.addEventListener('afterprint', () => document.body.classList.remove('mode-menu'));

/** L'en-tête de la feuille imprimée : titre, tablée, heure du service. */
function preparerImpression() {
  const service = momentDuService();
  const menu = document.body.classList.contains('mode-menu');
  const titre = menu ? `Menu — ${principal().titre}` : recetteCourante().titre;

  $('entete-impression').innerHTML = `
    <strong style="font-size:1.15rem">${txt(titre)}</strong> —
    ${txt(etat.portions)} convives${
      service
        ? ` — service le ${txt(service.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }))} à ${txt(service.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }))}`
        : ''
    }
    <div style="font-size:0.8rem;color:#444">Températures en °F (four au gaz) · imprimé le ${txt(new Date().toLocaleDateString('fr-CA'))}</div>
  `;

  // La doublure imprimable des notes : un <textarea> tronque son contenu.
  let doublure = $('notes-impression');
  if (!doublure) {
    doublure = document.createElement('div');
    doublure.id = 'notes-impression';
    doublure.className = 'impression-seule';
    $('notes').after(doublure);
  }
  doublure.textContent = $('notes').value;
}

/* =========================================================================
   Rendu global
   ========================================================================= */

function rendreRecette() {
  $('recette-corps').innerHTML = htmlRecette(recetteCourante(), true);
  $('choix-recette').value = etat.recetteId;
}

function toutRendre() {
  $('choix-recette').value = etat.recetteId;
  $('portions').value = etat.portions;
  $('service-date').value = etat.serviceDate;
  $('service-heure').value = etat.serviceHeure;
  $('photo-categorie').value = etat.categoriePhoto;
  $('photo-filtre').value = etat.filtrePhoto;
  $('notes').value = etat.notes[etat.recetteId] ?? '';

  rendreMenu();
  rendreRecette();
  rendreRebours();
  rendreGalerie();
}

/* =========================================================================
   Branchements
   ========================================================================= */

/* --- Onglets --- */
for (const onglet of document.querySelectorAll('.onglet')) {
  onglet.addEventListener('click', () => afficherVue(onglet.dataset.vue));
}

/* --- Thème --- */
$('btn-theme').addEventListener('click', () => {
  etat.theme = THEMES[(THEMES.indexOf(etat.theme) + 1) % THEMES.length];
  appliquerTheme();
  enregistrer();
});

/* --- Le menu : retenir un plat, ou l'ouvrir --- */
$('vue-menu').addEventListener('click', (evenement) => {
  const bascule = evenement.target.closest('[data-menu]');
  if (bascule) {
    const id = bascule.dataset.menu;
    const retenus = new Set(auMenu());
    retenus.has(id) ? retenus.delete(id) : retenus.add(id);
    etat.menus[etat.principalId] = [...retenus];
    enregistrer();
    rendreMenu();
    rendreRebours();
    signaler(retenus.has(id) ? `${parId(id).titre} entre au menu.` : `${parId(id).titre} quitte le menu.`);
    return;
  }

  const ouvrir = evenement.target.closest('[data-ouvrir]');
  if (ouvrir) {
    etat.recetteId = ouvrir.dataset.ouvrir;
    enregistrer();
    $('notes').value = etat.notes[etat.recetteId] ?? '';
    rendreRecette();
    afficherVue('recette');
    window.scrollTo({ top: 0 });
  }
});

/* --- Réglages --- */
$('choix-recette').addEventListener('change', (e) => {
  etat.recetteId = e.target.value;
  // Choisir un plat principal déplace le menu ; choisir un à-côté ne fait
  // qu'ouvrir sa fiche, sans défaire le menu en cours.
  if (parId(etat.recetteId)?.type === 'principal') etat.principalId = etat.recetteId;
  enregistrer();
  $('notes').value = etat.notes[etat.recetteId] ?? '';
  toutRendre();
});

function changerPortions(valeur) {
  etat.portions = Math.min(80, Math.max(1, Math.round(valeur) || 1));
  enregistrer();
  rendreRecette();
  $('portions').value = etat.portions;
}

$('portions').addEventListener('change', (e) => changerPortions(Number(e.target.value)));
$('portions-moins').addEventListener('click', () => changerPortions(etat.portions - 1));
$('portions-plus').addEventListener('click', () => changerPortions(etat.portions + 1));

$('service-date').addEventListener('change', (e) => {
  etat.serviceDate = e.target.value;
  enregistrer();
  rendreRebours();
});

$('service-heure').addEventListener('change', (e) => {
  etat.serviceHeure = e.target.value;
  enregistrer();
  rendreRebours();
});

/* --- La recette : cases, minuteurs, copie de la liste --- */
$('recette-corps').addEventListener('click', async (evenement) => {
  const cocher = evenement.target.closest('[data-cocher]');
  if (cocher) {
    const index = Number(cocher.dataset.cocher);
    const faites = new Set(etat.etapesFaites[etat.recetteId] ?? []);
    faites.has(index) ? faites.delete(index) : faites.add(index);
    etat.etapesFaites[etat.recetteId] = [...faites];
    enregistrer();
    rendreRecette();
    return;
  }

  const minuteur = evenement.target.closest('[data-minuteur]');
  if (minuteur) {
    lancerMinuteur(Number(minuteur.dataset.minuteur), minuteur.dataset.nom);
    return;
  }

  if (evenement.target.closest('#btn-decocher')) {
    etat.etapesFaites[etat.recetteId] = [];
    enregistrer();
    rendreRecette();
    signaler('Étapes remises à zéro.');
    return;
  }

  if (evenement.target.closest('#btn-copier-ingredients')) {
    const lignes = [`Menu — ${principal().titre} · ${etat.portions} convives`, ''];
    for (const r of menuComplet()) {
      lignes.push(`### ${r.titre.toUpperCase()}`);
      for (const groupe of r.ingredients) {
        for (const i of groupe.items) {
          lignes.push(`  ${formaterQuantite(i.q, i.u, r)} ${i.nom}`.trimEnd());
        }
      }
      lignes.push('');
    }
    try {
      await navigator.clipboard.writeText(lignes.join('\n'));
      signaler(`Liste des ${menuComplet().length} plats copiée.`);
    } catch {
      signaler('Le navigateur a refusé l’accès au presse-papiers.');
    }
  }
});

/* --- Notes --- */
$('notes').addEventListener('input', (e) => {
  etat.notes[etat.recetteId] = e.target.value;
  enregistrer();
});

/* --- Photos --- */
$('btn-photo-fichier').addEventListener('click', () => $('fichier-photos').click());
$('btn-photo-appareil').addEventListener('click', () => $('fichier-appareil').click());

for (const id of ['fichier-photos', 'fichier-appareil']) {
  $(id).addEventListener('change', (e) => {
    ajouterFichiers(e.target.files);
    e.target.value = '';
  });
}

$('photo-categorie').addEventListener('change', (e) => {
  etat.categoriePhoto = e.target.value;
  enregistrer();
});

$('photo-filtre').addEventListener('change', (e) => {
  etat.filtrePhoto = e.target.value;
  rendreGalerie();
});

const depot = $('depot');
for (const nom of ['dragenter', 'dragover']) {
  depot.addEventListener(nom, (e) => {
    e.preventDefault();
    depot.classList.add('depot--survol');
  });
}
for (const nom of ['dragleave', 'drop']) {
  depot.addEventListener(nom, (e) => {
    e.preventDefault();
    depot.classList.remove('depot--survol');
  });
}
depot.addEventListener('drop', (e) => ajouterFichiers(e.dataTransfer.files));

$('galerie').addEventListener('click', async (evenement) => {
  const voir = evenement.target.closest('[data-voir]');
  if (voir) {
    const photo = photos.find((p) => p.id === voir.dataset.voir);
    $('visionneuse-image').src = photo.dataUrl;
    $('visionneuse-legende').textContent =
      `${NOMS_CATEGORIES[photo.categorie] ?? photo.categorie} — ${new Date(photo.date).toLocaleString('fr-CA')}`;
    $('visionneuse').showModal();
    return;
  }

  const supprimer = evenement.target.closest('[data-supprimer]');
  if (supprimer && confirm('Supprimer cette photo ?')) {
    await effacerPhoto(supprimer.dataset.supprimer);
    photos = photos.filter((p) => p.id !== supprimer.dataset.supprimer);
    rendreGalerie();
  }
});

$('galerie').addEventListener('input', (evenement) => {
  const zone = evenement.target.closest('[data-note]');
  if (!zone) return;
  const photo = photos.find((p) => p.id === zone.dataset.note);
  if (!photo) return;
  photo.note = zone.value;
  ecrirePhoto(photo);
});

$('visionneuse-fermer').addEventListener('click', () => $('visionneuse').close());

/* --- Impression, sauvegarde, restauration --- */
$('btn-imprimer').addEventListener('click', () => imprimer('menu'));
$('btn-imprimer-recette').addEventListener('click', () => imprimer('recette'));
window.addEventListener('beforeprint', preparerImpression);

$('btn-sauvegarde').addEventListener('click', sauvegarder);
$('btn-restaurer').addEventListener('click', () => $('fichier-restauration').click());
$('fichier-restauration').addEventListener('change', (e) => {
  if (e.target.files[0]) restaurer(e.target.files[0]);
  e.target.value = '';
});

/* =========================================================================
   Démarrage
   ========================================================================= */

charger();
appliquerTheme();

// Le sélecteur groupe les recettes par rôle : on ne cherche pas une entrée
// dans la même liste qu'un plat principal.
const GROUPES = [
  ['principal', 'Plats principaux'],
  ['entree', 'Entrées'],
  ['accompagnement', 'Accompagnements'],
];
$('choix-recette').innerHTML = GROUPES.map(([type, nom]) => {
  const options = RECETTES.filter((r) => r.type === type)
    .map((r) => `<option value="${txt(r.id)}">${txt(r.titre)}</option>`)
    .join('');
  return options ? `<optgroup label="${txt(nom)}">${options}</optgroup>` : '';
}).join('');

// Sans jour choisi, on propose celui d'aujourd'hui : le calendrier à rebours
// est utile tout de suite, quitte à ce que les premières lignes soient déjà
// passées.
if (!etat.serviceDate) etat.serviceDate = new Date().toISOString().slice(0, 10);

afficherVue(etat.vue === 'recette' ? 'recette' : 'menu');
toutRendre();

listerPhotos()
  .then((liste) => {
    photos = liste;
    rendreGalerie();
  })
  .catch(() => signaler('Les photos n’ont pas pu être relues sur cet appareil.'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
