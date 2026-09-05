/**
 * Le dessin de l'écran : tableau de bord, liste d'inventaire, tournée par
 * emplacement, archives. Aucune de ces fonctions ne modifie l'état — elles
 * lisent `Etat` et posent du HTML ; les gestes remontent par `actions`.
 */

'use strict';

const Rendu = (() => {

  /** Les gestes que l'écran sait déclencher, branchés par app.js. */
  let actions = {};
  const brancher = (nouvelles) => { actions = nouvelles; };

  const $ = (selecteur) => document.querySelector(selecteur);

  /* ---------- Petites mises en forme ---------- */

  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function dateLisible(iso, avecHeure = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const jour = `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
    if (!avecHeure) return jour;
    const heure = String(d.getHours()).padStart(2, '0') + ' h ' + String(d.getMinutes()).padStart(2, '0');
    return `${jour}, ${heure}`;
  }

  /** Le décompte tel qu'on le lit : « 12 conserves », « non compté ». */
  function quantiteLisible(a) {
    if (a.quantite === null) return 'non compté';
    const unite = a.unite || 'unité';
    const pluriel = a.quantite > 1 && !/^(kg|lb|L|ml|gallon)$/.test(unite) ? unite + 's' : unite;
    return `${a.quantite} ${pluriel}`;
  }

  const ETIQUETTES_ETAT = {
    'non-compte': { texte: 'Non compté', classe: 'etat-non-compte' },
    epuise: { texte: 'Épuisé', classe: 'etat-epuise' },
    bas: { texte: 'À commander', classe: 'etat-bas' },
    ok: { texte: 'En stock', classe: 'etat-ok' },
  };

  /* ---------- Tri et filtrage ---------- */

  /** Compare sans se soucier des accents ni des majuscules. */
  const sansAccents = (texte) => String(texte ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function filtrer(filtres) {
    const recherche = sansAccents(filtres.recherche);

    return Etat.actifs().filter((a) => {
      if (filtres.rayon && a.rayon !== filtres.rayon) return false;
      if (filtres.zone && a.zone !== filtres.zone) return false;

      const etat = Etat.etatArticle(a);
      if (filtres.etat === 'a-commander' && !(etat === 'bas' || etat === 'epuise')) return false;
      if (filtres.etat === 'non-comptes' && etat !== 'non-compte') return false;
      if (filtres.etat === 'comptes' && etat === 'non-compte') return false;
      if (filtres.etat === 'estimes' && !a.estime) return false;

      if (recherche) {
        const foin = sansAccents([a.nom, a.format, a.note, Etat.rayon(a.rayon).nom, Etat.zone(a.zone).nom].join(' '));
        if (!foin.includes(recherche)) return false;
      }
      return true;
    });
  }

  /* ---------- Tableau de bord ---------- */

  function tableauDeBord() {
    const s = Etat.statistiques();
    const cible = $('#tableau-bord');

    const chiffres = [
      { valeur: s.comptes + ' / ' + s.total, libelle: 'articles comptés', ton: 'accent' },
      { valeur: s.aCommander, libelle: 'à commander', ton: s.aCommander ? 'alerte' : 'neutre' },
      { valeur: s.epuises, libelle: 'épuisés', ton: s.epuises ? 'alerte' : 'neutre' },
      { valeur: s.estimes, libelle: 'estimés à l’œil', ton: 'neutre' },
    ];

    cible.innerHTML = '';
    for (const c of chiffres) {
      const bloc = document.createElement('div');
      bloc.className = 'chiffre ton-' + c.ton;
      bloc.innerHTML = '<b></b><span></span>';
      bloc.querySelector('b').textContent = c.valeur;
      bloc.querySelector('span').textContent = c.libelle;
      cible.append(bloc);
    }

    $('#barre-avancement').style.setProperty('--avancement', s.avancement + '%');
    $('#texte-avancement').textContent = s.total
      ? `${s.avancement} % de l’inventaire est compté — dernière saisie : ${dateLisible(s.derniereMaj, true)}`
      : 'Aucun article au catalogue.';
  }

  /* ---------- Liste d'inventaire ---------- */

  /** Une ligne d'article : le décompte se fait ici, sans quitter la liste. */
  function ligneArticle(a) {
    const etat = Etat.etatArticle(a);
    const ligne = document.createElement('article');
    ligne.className = 'ligne ' + ETIQUETTES_ETAT[etat].classe;
    ligne.dataset.id = a.id;

    ligne.innerHTML = `
      <div class="ligne-identite">
        <b class="ligne-nom"></b>
        <span class="ligne-details"></span>
        <span class="ligne-note"></span>
      </div>
      <div class="ligne-compte">
        <button type="button" class="pas" data-pas="-1" aria-label="Retirer une unité">−</button>
        <input type="number" class="champ-quantite" inputmode="numeric" min="0" step="1" placeholder="—" aria-label="Quantité" />
        <button type="button" class="pas" data-pas="1" aria-label="Ajouter une unité">+</button>
        <span class="ligne-unite"></span>
        <button type="button" class="fiche" aria-label="Ouvrir la fiche">✏️</button>
      </div>`;

    ligne.querySelector('.ligne-nom').textContent = a.nom;

    const details = [a.format, Etat.zone(a.zone).nom].filter(Boolean).join(' · ');
    const badges = [];
    if (a.estime) badges.push('estimé');
    if (etat === 'bas' || etat === 'epuise') badges.push(ETIQUETTES_ETAT[etat].texte.toLowerCase());
    ligne.querySelector('.ligne-details').textContent = details + (badges.length ? ' · ' + badges.join(' · ') : '');

    const note = ligne.querySelector('.ligne-note');
    if (a.note) note.textContent = '« ' + a.note + ' »'; else note.hidden = true;

    ligne.querySelector('.ligne-unite').textContent = a.unite || 'unité';

    const champ = ligne.querySelector('.champ-quantite');
    champ.value = a.quantite === null ? '' : a.quantite;
    champ.addEventListener('change', () => actions.saisir?.(a.id, champ.value));

    for (const bouton of ligne.querySelectorAll('.pas')) {
      bouton.addEventListener('click', () => actions.ajuster?.(a.id, Number(bouton.dataset.pas)));
    }
    ligne.querySelector('.fiche').addEventListener('click', () => actions.ouvrirFiche?.(a.id));

    return ligne;
  }

  /** Un groupe — un rayon ou un emplacement — avec son compte d'avancement. */
  function groupe(titre, emoji, sousTitre, articles) {
    const section = document.createElement('section');
    section.className = 'groupe';

    const comptes = articles.filter((a) => a.quantite !== null).length;
    const entete = document.createElement('header');
    entete.className = 'groupe-entete';
    entete.innerHTML = '<h3><span class="groupe-emoji"></span><span class="groupe-titre"></span></h3><span class="groupe-compte"></span>';
    entete.querySelector('.groupe-emoji').textContent = emoji;
    entete.querySelector('.groupe-titre').textContent = titre;
    entete.querySelector('.groupe-compte').textContent = `${comptes} / ${articles.length} comptés`;
    if (sousTitre) entete.title = sousTitre;
    section.append(entete);

    for (const a of articles) section.append(ligneArticle(a));
    return section;
  }

  /**
   * Redessine une seule ligne — le geste du comptage ne doit ni faire sauter
   * la page ni perdre la place où l'on en était.
   */
  function majLigne(id) {
    const ancienne = document.querySelector(`.ligne[data-id="${id}"]`);
    const a = Etat.article(id);
    if (!ancienne || !a) return false;

    const parent = ancienne.closest('.groupe');
    ancienne.replaceWith(ligneArticle(a));

    if (parent) {
      const champs = [...parent.querySelectorAll('.champ-quantite')];
      const comptes = champs.filter((champ) => champ.value !== '').length;
      parent.querySelector('.groupe-compte').textContent = `${comptes} / ${champs.length} comptés`;
    }
    return true;
  }

  function inventaire(filtres) {
    const cible = $('#liste-inventaire');
    cible.innerHTML = '';

    const liste = filtrer(filtres);
    $('#compte-resultats').textContent = liste.length === 1
      ? '1 article affiché'
      : `${liste.length} articles affichés`;

    if (!liste.length) {
      cible.innerHTML = '<p class="vide">Aucun article ne correspond à cette recherche.</p>';
      return;
    }

    const parEmplacement = Etat.reglages().groupement === 'zone';
    const familles = parEmplacement ? ZONES : RAYONS;

    for (const famille of familles) {
      const articles = liste
        .filter((a) => (parEmplacement ? a.zone : a.rayon) === famille.id)
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      if (!articles.length) continue;
      cible.append(groupe(famille.nom, famille.emoji, famille.note, articles));
    }
  }

  /* ---------- La tournée de fermeture ---------- */

  function tournee() {
    const cible = $('#liste-tournee');
    cible.innerHTML = '';

    for (const zone of Etat.avancementParZone()) {
      const fait = zone.comptes === zone.total;
      const bloc = document.createElement('button');
      bloc.type = 'button';
      bloc.className = 'etape' + (fait ? ' etape-faite' : '');
      bloc.innerHTML = `
        <span class="etape-emoji"></span>
        <span class="etape-texte"><b></b><small></small></span>
        <span class="etape-compte"></span>`;
      bloc.querySelector('.etape-emoji').textContent = fait ? '✅' : zone.emoji;
      bloc.querySelector('b').textContent = zone.nom;
      bloc.querySelector('small').textContent = zone.note || '';
      bloc.querySelector('.etape-compte').textContent = `${zone.comptes} / ${zone.total}`;
      bloc.addEventListener('click', () => actions.ouvrirZone?.(zone.id));
      cible.append(bloc);
    }
  }

  /* ---------- Les archives ---------- */

  function archives() {
    const cible = $('#liste-archives');
    const liste = Etat.archives();
    cible.innerHTML = '';

    if (!liste.length) {
      cible.innerHTML = `<p class="vide">Aucun inventaire archivé pour l’instant.
        À la fermeture, l’onglet <b>Fermeture</b> fige le stock d’un seul geste.</p>`;
      return;
    }

    for (const archive of liste) {
      const carte = document.createElement('article');
      carte.className = 'archive';
      carte.innerHTML = `
        <div class="archive-texte">
          <b class="archive-titre"></b>
          <span class="archive-details"></span>
          <span class="archive-note"></span>
        </div>
        <div class="archive-actions">
          <button type="button" class="bouton" data-geste="voir">👁️ Consulter</button>
          <button type="button" class="bouton" data-geste="imprimer">🖨️ Imprimer</button>
          <button type="button" class="bouton" data-geste="restaurer">↩️ Recharger</button>
          <button type="button" class="bouton discret" data-geste="supprimer">🗑️</button>
        </div>`;

      carte.querySelector('.archive-titre').textContent = archive.titre;
      const signature = archive.par ? ` · par ${archive.par}` : '';
      carte.querySelector('.archive-details').textContent =
        `${dateLisible(archive.date, true)}${signature} · ${archive.lignes.length} articles comptés`;

      const note = carte.querySelector('.archive-note');
      if (archive.note) note.textContent = '« ' + archive.note + ' »'; else note.hidden = true;

      for (const bouton of carte.querySelectorAll('[data-geste]')) {
        bouton.addEventListener('click', () => actions.archive?.(bouton.dataset.geste, archive.id));
      }
      cible.append(carte);
    }
  }

  /** Le détail d'une archive, tel qu'on le lit dans la fenêtre de consultation. */
  function detailArchive(archive) {
    const parRayon = new Map();
    for (const ligne of archive.lignes) {
      if (!parRayon.has(ligne.rayon)) parRayon.set(ligne.rayon, []);
      parRayon.get(ligne.rayon).push(ligne);
    }

    const morceaux = [];
    for (const r of RAYONS) {
      const lignes = parRayon.get(r.id);
      if (!lignes) continue;
      morceaux.push(`<h4>${r.emoji} ${r.nom}</h4><table class="tableau"><tbody>` +
        lignes
          .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
          .map((l) => `<tr><td>${echapper(l.nom)}${l.format ? ` <small>${echapper(l.format)}</small>` : ''}</td>` +
            `<td class="nombre">${l.quantite}${l.estime ? ' <small>est.</small>' : ''} ${echapper(l.unite || '')}</td></tr>`)
          .join('') +
        '</tbody></table>');
    }
    return morceaux.join('');
  }

  /** Échappe le texte destiné à une chaîne HTML. */
  function echapper(texte) {
    return String(texte ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  /* ---------- Tout redessiner ---------- */

  function tout(filtres) {
    tableauDeBord();
    inventaire(filtres);
    tournee();
    archives();
  }

  return { brancher, tout, tableauDeBord, inventaire, majLigne, tournee, archives, detailArchive, dateLisible, quantiteLisible, echapper, filtrer };
})();
