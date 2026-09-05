/**
 * Le branchement de l'écran : onglets, filtres, fiches, fermeture, partage.
 *
 * Rien ici ne connaît la forme du stock — cela regarde `catalogue.js` — ni
 * ne dessine — cela regarde `rendu.js`. On y noue les gestes aux effets.
 */

'use strict';

(() => {

  const $ = (selecteur) => document.querySelector(selecteur);
  const $$ = (selecteur) => [...document.querySelectorAll(selecteur)];

  const CLE_PREMIERE_VISITE = 'lac-pere.visite';

  /** Ce que la liste montre en ce moment. */
  const filtres = { recherche: '', rayon: '', zone: '', etat: '' };

  /** L'article ouvert dans la fiche — `null` quand on en crée un. */
  let ficheOuverte = null;
  let archiveOuverte = null;

  /* ---------- Messages passagers ---------- */

  let minuterieMessage = null;

  function message(texte, ton = 'ok') {
    const boite = $('#message');
    boite.textContent = texte;
    boite.className = 'message message-' + ton;
    boite.hidden = false;
    clearTimeout(minuterieMessage);
    minuterieMessage = setTimeout(() => { boite.hidden = true; }, 4000);
  }

  /* ---------- Onglets ---------- */

  function montrer(vue) {
    for (const onglet of $$('.onglet')) {
      onglet.setAttribute('aria-selected', String(onglet.dataset.vue === vue));
    }
    for (const bloc of $$('.vue')) {
      bloc.hidden = bloc.id !== 'vue-' + vue;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Remplissage des menus déroulants ---------- */

  function remplirListes() {
    const optionsRayons = RAYONS.map((r) => `<option value="${r.id}">${r.emoji} ${r.nom}</option>`).join('');
    const optionsZones = ZONES.map((z) => `<option value="${z.id}">${z.emoji} ${z.nom}</option>`).join('');

    $('#filtre-rayon').insertAdjacentHTML('beforeend', optionsRayons);
    $('#filtre-zone').insertAdjacentHTML('beforeend', optionsZones);
    $('#fiche-rayon').innerHTML = optionsRayons;
    $('#fiche-zone').innerHTML = optionsZones;
    $('#liste-unites').innerHTML = UNITES.map((u) => `<option value="${u}"></option>`).join('');
  }

  /* ---------- Redessiner ---------- */

  function rafraichir() {
    Rendu.tout(filtres);
    $('#banniere-saison').textContent = Etat.saison() ? 'Saison ' + Etat.saison() : 'Inventaire du domaine';
    $('#bouton-groupement').textContent = Etat.reglages().groupement === 'zone'
      ? '🗂️ Grouper par rayon'
      : '🗂️ Grouper par emplacement';
  }

  /* ---------- La fiche d'un article ---------- */

  function ouvrirFiche(id) {
    ficheOuverte = id ? Etat.article(id) : null;
    const a = ficheOuverte;

    $('#titre-fiche').textContent = a ? a.nom : 'Nouvel article';
    $('#fiche-nom').value = a?.nom ?? '';
    $('#fiche-format').value = a?.format ?? '';
    $('#fiche-rayon').value = a?.rayon ?? filtres.rayon ?? RAYONS[0].id;
    $('#fiche-zone').value = a?.zone ?? filtres.zone ?? ZONES[0].id;
    $('#fiche-quantite').value = a && a.quantite !== null ? a.quantite : '';
    $('#fiche-unite').value = a?.unite ?? 'unité';
    $('#fiche-seuil').value = a?.seuil ?? 0;
    $('#fiche-estime').checked = Boolean(a?.estime);
    $('#fiche-note').value = a?.note ?? '';

    $('#fiche-supprimer').hidden = !a;
    $('#fiche-signature').textContent = a?.maj
      ? `Dernière saisie : ${Rendu.dateLisible(a.maj, true)}${a.par ? ' par ' + a.par : ''}.`
      : 'Jamais compté.';

    $('#dialogue-fiche').showModal();
  }

  function enregistrerFiche(evenement) {
    evenement.preventDefault();

    const champs = {
      nom: $('#fiche-nom').value.trim(),
      format: $('#fiche-format').value.trim(),
      rayon: $('#fiche-rayon').value,
      zone: $('#fiche-zone').value,
      unite: $('#fiche-unite').value.trim() || 'unité',
      seuil: Number($('#fiche-seuil').value) || 0,
      note: $('#fiche-note').value.trim(),
      estime: $('#fiche-estime').checked,
    };

    if (!champs.nom) { message('Un article a besoin d’un nom.', 'alerte'); return; }

    const brute = $('#fiche-quantite').value;
    const quantite = brute === '' ? null : Math.max(0, Number(brute) || 0);

    if (ficheOuverte) {
      Etat.majArticle(ficheOuverte.id, { ...champs, quantite });
      message('Fiche enregistrée.');
    } else {
      Etat.ajouterArticle({ ...champs, quantite });
      message('Article ajouté au stock.');
    }

    $('#dialogue-fiche').close();
    rafraichir();
  }

  function supprimerFiche() {
    if (!ficheOuverte) return;
    const nom = ficheOuverte.nom;
    if (!confirm(`Retirer « ${nom} » de l’inventaire ?`)) return;
    Etat.supprimerArticle(ficheOuverte.id);
    $('#dialogue-fiche').close();
    rafraichir();
    message(`« ${nom} » retiré de la liste.`);
  }

  /* ---------- Fermeture et archives ---------- */

  function archiver() {
    const stats = Etat.statistiques();
    if (!stats.comptes) {
      message('Rien n’est encore compté : l’archive serait vide.', 'alerte');
      return;
    }

    const restants = stats.restants
      ? `\n\n${stats.restants} article(s) ne sont pas comptés — ils ne figureront pas dans l’archive.`
      : '';
    if (!confirm(`Archiver ${stats.comptes} article(s) comptés ?${restants}`)) return;

    const archive = Etat.archiver({
      titre: `Inventaire de fermeture ${Etat.saison()}`,
      note: $('#champ-note-fermeture').value.trim(),
    });

    $('#champ-note-fermeture').value = '';
    rafraichir();
    montrer('archives');
    message(`Fermeture archivée : ${archive.lignes.length} articles figés.`);
  }

  function gererArchive(geste, id) {
    const archive = Etat.archives().find((a) => a.id === id);
    if (!archive) return;

    if (geste === 'voir') {
      archiveOuverte = archive;
      $('#titre-archive').textContent = archive.titre;
      $('#details-archive').textContent =
        `${Rendu.dateLisible(archive.date, true)}${archive.par ? ' · relevé par ' + archive.par : ''} · ` +
        `${archive.lignes.length} articles` + (archive.note ? ` · « ${archive.note} »` : '');
      $('#contenu-archive').innerHTML = Rendu.detailArchive(archive);
      $('#dialogue-archive').showModal();
      return;
    }

    if (geste === 'imprimer') { Exporteur.imprimer(archive); return; }

    if (geste === 'restaurer') {
      if (!confirm(`Recharger « ${archive.titre} » ?\n\nLes quantités actuelles seront remplacées par celles de cette archive. L’archive, elle, ne bouge pas.`)) return;
      Etat.restaurerArchive(id);
      rafraichir();
      montrer('inventaire');
      message('Archive rechargée dans l’inventaire courant.');
      return;
    }

    if (geste === 'supprimer') {
      if (!confirm(`Supprimer définitivement « ${archive.titre} » ?\n\nCette archive ne pourra pas être retrouvée.`)) return;
      Etat.supprimerArchive(id);
      rafraichir();
      message('Archive supprimée.');
    }
  }

  function reinitialiser() {
    if (!confirm('Vider tous les décomptes ?\n\nLes articles restent, les quantités repartent à « non compté ». Les archives sont conservées.')) return;
    if (!confirm('Confirmez une dernière fois : les quantités actuelles seront perdues si elles ne sont pas archivées.')) return;
    Etat.reinitialiserComptage();
    rafraichir();
    message('Décomptes remis à zéro — bonne tournée.');
  }

  /* ---------- Partage ---------- */

  function lireFichier(fichier) {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      let contenu;
      try {
        contenu = JSON.parse(lecteur.result);
      } catch {
        message('Fichier illisible : ce n’est pas une sauvegarde valide.', 'alerte');
        return;
      }

      // Deux questions plutôt qu'une : la fusion, sans danger, est proposée
      // d'abord ; le remplacement, qui écrase tout, demande un second oui.
      let mode = 'fusionner';
      if (!confirm('Reprendre ce fichier ?\n\nOK : FUSIONNER — pour chaque article, la saisie la plus récente gagne. Rien ne se perd.\nAnnuler : voir l’autre façon de faire.')) {
        if (!confirm('Autre façon : REMPLACER.\n\nTout votre inventaire actuel serait effacé et remplacé par celui du fichier.\n\nOK : remplacer. Annuler : ne rien faire.')) return;
        mode = 'remplacer';
      }

      try {
        const bilan = Etat.importer(contenu, mode);
        rafraichir();
        remplirChampsFermeture();
        message(mode === 'remplacer'
          ? 'Inventaire remplacé par le fichier reçu.'
          : `Fusion faite : ${bilan.mis} article(s) mis à jour, ${bilan.ajoutes} ajouté(s), ${bilan.archives} archive(s) reprise(s).`);
      } catch (erreur) {
        message(erreur.message, 'alerte');
      }
    };
    lecteur.readAsText(fichier);
  }

  /* ---------- Réglages ---------- */

  function remplirChampsFermeture() {
    $('#champ-saison').value = Etat.saison();
    $('#champ-responsable').value = Etat.responsable();
  }

  function ouvrirReglages() {
    $('#reglages-responsable').value = Etat.responsable();
    $('#reglages-saison').value = Etat.saison();
    $('#dialogue-reglages').showModal();
  }

  /* ---------- Branchements ---------- */

  function brancherFiltres() {
    let minuterie = null;
    $('#champ-recherche').addEventListener('input', (e) => {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => {
        filtres.recherche = e.target.value;
        Rendu.inventaire(filtres);
      }, 150);
    });

    $('#filtre-rayon').addEventListener('change', (e) => {
      filtres.rayon = e.target.value;
      Rendu.inventaire(filtres);
    });

    $('#filtre-zone').addEventListener('change', (e) => {
      filtres.zone = e.target.value;
      Rendu.inventaire(filtres);
    });

    for (const chip of $$('#filtres-etat .chip')) {
      chip.addEventListener('click', () => {
        filtres.etat = chip.dataset.etat;
        for (const autre of $$('#filtres-etat .chip')) {
          autre.setAttribute('aria-pressed', String(autre === chip));
        }
        Rendu.inventaire(filtres);
      });
    }

    $('#bouton-groupement').addEventListener('click', () => {
      Etat.definirReglage('groupement', Etat.reglages().groupement === 'zone' ? 'rayon' : 'zone');
      rafraichir();
    });
  }

  function brancherTout() {
    for (const onglet of $$('.onglet')) {
      onglet.addEventListener('click', () => montrer(onglet.dataset.vue));
    }

    brancherFiltres();

    $('#bouton-ajouter').addEventListener('click', () => ouvrirFiche(null));
    $('#formulaire-fiche').addEventListener('submit', enregistrerFiche);
    $('#fiche-annuler').addEventListener('click', () => $('#dialogue-fiche').close());
    $('#fiche-supprimer').addEventListener('click', supprimerFiche);

    $('#bouton-reglages').addEventListener('click', ouvrirReglages);
    $('#reglages-annuler').addEventListener('click', () => $('#dialogue-reglages').close());
    $('#reglages-enregistrer').addEventListener('click', () => {
      Etat.definirResponsable($('#reglages-responsable').value);
      Etat.definirSaison($('#reglages-saison').value);
      remplirChampsFermeture();
      rafraichir();
      $('#dialogue-reglages').close();
      message('C’est noté — vos saisies porteront votre nom.');
    });

    $('#bouton-aide').addEventListener('click', () => $('#dialogue-aide').showModal());
    $('#aide-fermer').addEventListener('click', () => $('#dialogue-aide').close());

    $('#champ-saison').addEventListener('change', (e) => { Etat.definirSaison(e.target.value); rafraichir(); });
    $('#champ-responsable').addEventListener('change', (e) => Etat.definirResponsable(e.target.value));

    $('#bouton-archiver').addEventListener('click', archiver);
    $('#bouton-imprimer-courant').addEventListener('click', () => Exporteur.imprimer({ filtres: {} }));
    $('#bouton-reinitialiser').addEventListener('click', reinitialiser);

    $('#archive-fermer').addEventListener('click', () => $('#dialogue-archive').close());
    $('#archive-imprimer').addEventListener('click', () => archiveOuverte && Exporteur.imprimer(archiveOuverte));
    $('#archive-csv').addEventListener('click', () => archiveOuverte && Exporteur.tableur(archiveOuverte));

    $('#bouton-sauvegarde').addEventListener('click', () => {
      Exporteur.sauvegarde();
      message('Sauvegarde téléchargée — gardez-la en lieu sûr.');
    });

    $('#bouton-envoyer').addEventListener('click', async () => {
      const issue = await Exporteur.partagerFichier();
      if (issue === 'telecharge') message('Fichier téléchargé : joignez-le à un courriel.');
      if (issue === 'partage') message('Fichier envoyé.');
    });

    $('#bouton-restaurer').addEventListener('click', () => $('#champ-fichier').click());
    $('#champ-fichier').addEventListener('change', (e) => {
      const fichier = e.target.files?.[0];
      if (fichier) lireFichier(fichier);
      e.target.value = '';
    });

    $('#bouton-imprimer').addEventListener('click', () => Exporteur.imprimer({ filtres }));
    $('#bouton-csv').addEventListener('click', () => {
      Exporteur.tableur({ filtres });
      message('Tableur téléchargé.');
    });
    $('#bouton-copier').addEventListener('click', async () => {
      message(await Exporteur.copier({ filtres }) ? 'Inventaire copié.' : 'La copie a échoué.', 'ok');
    });
    $('#bouton-partager-texte').addEventListener('click', async () => {
      const issue = await Exporteur.partager({ filtres });
      if (issue === 'copie') message('Partage indisponible : l’inventaire a été copié.');
    });
  }

  /* ---------- Les gestes que la liste déclenche ---------- */

  /**
   * Après un décompte : un filtre d'état peut faire sortir l'article de la
   * liste — dans ce cas seulement, on redessine tout.
   */
  function apresSaisie(id) {
    if (filtres.etat) Rendu.inventaire(filtres);
    else Rendu.majLigne(id);
    Rendu.tableauDeBord();
    Rendu.tournee();
  }

  const actions = {
    saisir(id, valeur) {
      Etat.majQuantite(id, valeur === '' ? null : valeur, { estime: false });
      apresSaisie(id);
    },

    ajuster(id, pas) {
      Etat.ajusterQuantite(id, pas);
      apresSaisie(id);
    },

    ouvrirFiche,

    ouvrirZone(zoneId) {
      filtres.zone = zoneId;
      filtres.etat = '';
      $('#filtre-zone').value = zoneId;
      for (const chip of $$('#filtres-etat .chip')) {
        chip.setAttribute('aria-pressed', String(chip.dataset.etat === ''));
      }
      montrer('inventaire');
      Rendu.inventaire(filtres);
      message(`Emplacement : ${Etat.zone(zoneId).nom}`);
    },

    archive: gererArchive,
  };

  /* ---------- Départ ---------- */

  Etat.charger();
  remplirListes();
  Rendu.brancher(actions);
  brancherTout();
  remplirChampsFermeture();
  rafraichir();

  // Le guide s'ouvre une seule fois, à la toute première visite.
  try {
    if (!localStorage.getItem(CLE_PREMIERE_VISITE)) {
      localStorage.setItem(CLE_PREMIERE_VISITE, new Date().toISOString());
      $('#dialogue-aide').showModal();
    }
  } catch { /* stockage refusé : on se passe du guide automatique */ }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
