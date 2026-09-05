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

  /** Les photos préparées et les propositions issues de la dernière analyse. */
  let photos = [];
  let propositions = [];

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
    $('#analyse-zone').innerHTML = optionsZones;
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

  /* ---------- L'analyse de photo ---------- */

  function rafraichirCle() {
    const munie = Boolean(Analyseur.cle());
    $('#analyse-sans-cle').hidden = munie;
    $('#bouton-cle').textContent = munie ? '🔑 Ma clé Claude ✓' : '🔑 Ma clé Claude';
  }

  /** Redessine la bande d'aperçus, avec de quoi retirer une photo. */
  function rendrePhotos() {
    const bande = $('#analyse-apercus');
    bande.innerHTML = '';

    for (const [index, photo] of photos.entries()) {
      const vignette = document.createElement('div');
      vignette.className = 'apercu';
      vignette.innerHTML = '<img alt="" /><button type="button" class="retirer" aria-label="Retirer cette photo">✕</button>';
      vignette.querySelector('img').src = photo.apercu;
      vignette.querySelector('.retirer').addEventListener('click', () => {
        photos.splice(index, 1);
        rendrePhotos();
      });
      bande.append(vignette);
    }

    $('#analyse-invite').textContent = photos.length
      ? `📷 Ajouter une photo (${photos.length} sur ${Analyseur.MAX_PHOTOS})`
      : '📷 Prendre une photo ou en choisir dans l’album';

    // Le poids annoncé avant l'envoi : c'est lui qui décide si la demande
    // partira, et il vaut mieux le voir monter que le découvrir en échec.
    const poids = $('#analyse-poids');
    if (photos.length) {
      poids.hidden = false;
      poids.textContent = `${photos.length} photo(s) prête(s) — ${Analyseur.lisible(Analyseur.poidsDesPhotos(photos))} à envoyer.`;
    } else {
      poids.hidden = true;
    }
  }

  async function ajouterPhotos(fichiers) {
    for (const fichier of fichiers) {
      if (photos.length >= Analyseur.MAX_PHOTOS) {
        message(`Six photos à la fois au maximum — analysez celles-ci d'abord.`, 'alerte');
        break;
      }
      try {
        photos.push(await Analyseur.preparerPhoto(fichier));
      } catch {
        message('Une des images n’a pas pu être lue.', 'alerte');
      }
    }
    rendrePhotos();
  }

  /** Une proposition à relire : la quantité reste modifiable avant d'être appliquée. */
  function ligneProposition(proposition, index) {
    const ligne = document.createElement('article');
    ligne.className = 'proposition' + (proposition.estime ? ' proposition-estimee' : '');

    ligne.innerHTML = `
      <label class="proposition-choix">
        <input type="checkbox" checked />
      </label>
      <div class="proposition-texte">
        <b class="proposition-nom"></b>
        <span class="proposition-details"></span>
        <span class="proposition-note"></span>
      </div>
      <div class="proposition-quantite">
        <input type="number" min="0" step="1" inputmode="decimal" />
        <span class="proposition-unite"></span>
      </div>`;

    ligne.querySelector('.proposition-nom').textContent = proposition.nom;

    const details = [
      proposition.format,
      Etat.rayon(proposition.rayon).nom,
      proposition.id ? null : 'nouvel article',
      proposition.estime ? 'estimé' : 'compté',
      proposition.ancienne !== null ? 'avant : ' + proposition.ancienne : null,
    ].filter(Boolean).join(' · ');
    ligne.querySelector('.proposition-details').textContent = details;

    const note = ligne.querySelector('.proposition-note');
    if (proposition.note) note.textContent = '« ' + proposition.note + ' »'; else note.hidden = true;

    const champ = ligne.querySelector('.proposition-quantite input');
    champ.value = proposition.quantite;
    champ.addEventListener('change', () => {
      propositions[index].quantite = Math.max(0, Number(champ.value) || 0);
    });

    ligne.querySelector('.proposition-unite').textContent = proposition.unite;
    ligne.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      propositions[index].retenue = e.target.checked;
    });

    return ligne;
  }

  function rendrePropositions(observations) {
    $('#analyse-observations').textContent = observations || '';
    const cible = $('#analyse-propositions');
    cible.innerHTML = '';

    for (const [index, proposition] of propositions.entries()) {
      cible.append(ligneProposition(proposition, index));
    }

    const estimes = propositions.filter((p) => p.estime).length;
    $('#analyse-compte').textContent = propositions.length
      ? `${propositions.length} article(s) proposé(s), dont ${estimes} estimé(s)`
      : 'Aucun article reconnu sur ces photos.';
    $('#analyse-resultat').hidden = false;
  }

  function cocherTout(valeur) {
    for (const p of propositions) p.retenue = valeur;
    for (const case_ of $$('#analyse-propositions input[type="checkbox"]')) case_.checked = valeur;
  }

  async function analyser() {
    if (!Analyseur.cle()) { $('#dialogue-cle').showModal(); return; }

    $('#analyse-erreur').hidden = true;
    $('#analyse-resultat').hidden = true;
    $('#analyse-attente').hidden = false;
    $('#bouton-analyser').disabled = true;

    const debut = Date.now();
    const minuterie = setInterval(() => {
      const secondes = Math.round((Date.now() - debut) / 1000);
      $('#analyse-attente-texte').textContent = `Claude examine les tablettes… ${secondes} s`;
    }, 1000);

    try {
      const resultat = await Analyseur.analyser({
        photos,
        zoneId: $('#analyse-zone').value,
        precisions: $('#analyse-precisions').value.trim(),
      });
      propositions = resultat.propositions.map((p) => ({ ...p, retenue: true }));
      rendrePropositions(resultat.observations);
    } catch (erreur) {
      const encart = $('#analyse-erreur');
      encart.textContent = erreur.message;
      encart.hidden = false;
    } finally {
      clearInterval(minuterie);
      $('#analyse-attente').hidden = true;
      $('#analyse-attente-texte').textContent = 'Claude examine les tablettes…';
      $('#bouton-analyser').disabled = false;
    }
  }

  /** Verse les propositions retenues dans l'inventaire, et va les montrer. */
  function appliquerPropositions() {
    const retenues = propositions.filter((p) => p.retenue);
    if (!retenues.length) { message('Aucune proposition n’est cochée.', 'alerte'); return; }

    let mis = 0;
    let ajoutes = 0;

    for (const p of retenues) {
      const note = p.note ? 'D’après photo : ' + p.note : '';
      if (p.id && Etat.article(p.id)) {
        Etat.majQuantite(p.id, p.quantite, { estime: p.estime });
        if (note) Etat.majArticle(p.id, { note });
        mis++;
      } else {
        Etat.ajouterArticle({
          nom: p.nom, rayon: p.rayon, zone: p.zone, unite: p.unite,
          format: p.format, seuil: 0, quantite: p.quantite, estime: p.estime, note,
        });
        ajoutes++;
      }
    }

    const zoneId = $('#analyse-zone').value;
    propositions = [];
    photos = [];
    rendrePhotos();
    $('#analyse-resultat').hidden = true;
    $('#analyse-precisions').value = '';

    rafraichir();
    actions.ouvrirZone(zoneId);
    message(`${mis} article(s) mis à jour, ${ajoutes} ajouté(s) — tout est modifiable.`);
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

    $('#bouton-cle').addEventListener('click', () => {
      $('#champ-cle').value = Analyseur.cle();
      $('#dialogue-cle').showModal();
    });
    $('#cle-annuler').addEventListener('click', () => $('#dialogue-cle').close());
    $('#cle-enregistrer').addEventListener('click', () => {
      Analyseur.definirCle($('#champ-cle').value);
      rafraichirCle();
      $('#dialogue-cle').close();
      message(Analyseur.cle() ? 'Clé enregistrée — l’analyse est prête.' : 'Clé effacée.');
    });
    $('#cle-effacer').addEventListener('click', () => {
      Analyseur.definirCle('');
      $('#champ-cle').value = '';
      rafraichirCle();
      $('#dialogue-cle').close();
      message('Clé effacée de cet appareil.');
    });

    $('#bouton-tester').addEventListener('click', async (e) => {
      const bouton = e.currentTarget;
      bouton.disabled = true;
      bouton.textContent = '🔌 Essai en cours…';
      $('#analyse-erreur').hidden = true;
      try {
        await Analyseur.tester();
        message('La clé et la connexion fonctionnent — le problème vient donc des photos.');
      } catch (erreur) {
        const encart = $('#analyse-erreur');
        encart.textContent = erreur.message;
        encart.hidden = false;
      } finally {
        bouton.disabled = false;
        bouton.textContent = '🔌 Tester la connexion';
      }
    });

    $('#analyse-photos').addEventListener('change', (e) => {
      ajouterPhotos([...e.target.files]);
      e.target.value = '';
    });
    $('#bouton-vider-photos').addEventListener('click', () => {
      photos = [];
      rendrePhotos();
      $('#analyse-resultat').hidden = true;
    });
    $('#bouton-analyser').addEventListener('click', analyser);
    $('#bouton-tout-cocher').addEventListener('click', () => cocherTout(true));
    $('#bouton-tout-decocher').addEventListener('click', () => cocherTout(false));
    $('#bouton-appliquer').addEventListener('click', appliquerPropositions);

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
      $('#analyse-zone').value = zoneId;
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
  rafraichirCle();
  rendrePhotos();
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
