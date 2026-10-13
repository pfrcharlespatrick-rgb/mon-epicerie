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
    const optionsRayons = Etat.rayons().map((r) => `<option value="${r.id}">${r.emoji} ${r.nom}</option>`).join('');
    const optionsZones = Etat.zones().map((z) => `<option value="${z.id}">${z.emoji} ${z.nom}</option>`).join('');

    // Rejouée à chaque retouche des listes : on repart de l'option « tous »,
    // sans quoi les rayons s'empileraient à chaque passage.
    $('#filtre-rayon').innerHTML = '<option value="">Tous les rayons</option>' + optionsRayons;
    $('#filtre-zone').innerHTML = '<option value="">Tous les emplacements</option>' + optionsZones;
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
    $('#fiche-rayon').value = a?.rayon ?? filtres.rayon ?? Etat.rayons()[0].id;
    $('#fiche-zone').value = a?.zone ?? filtres.zone ?? Etat.zones()[0].id;
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
      // Le même nom au même emplacement, c'est presque toujours le même
      // article : on le dit avant de créer un doublon.
      const pareil = Etat.trouverParNom(champs.nom, champs.zone);
      if (pareil && !confirm(`« ${pareil.nom} » existe déjà à cet emplacement.\n\nL’ajouter quand même, en double ?`)) return;
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

  /* ---------- Mes rayons et emplacements ---------- */

  /** Une ligne modifiable : l'icône, le nom, et de quoi retirer l'entrée. */
  function ligneClassement(cle, entree, total) {
    const ligne = document.createElement('div');
    ligne.className = 'classement-ligne';
    ligne.innerHTML = `
      <input type="text" class="classement-emoji" maxlength="4" aria-label="Icône" />
      <input type="text" class="classement-nom" aria-label="Nom" />
      <span class="classement-compte"></span>
      <button type="button" class="bouton discret classement-retirer" aria-label="Retirer">🗑️</button>`;

    const champ = cle === 'rayons' ? 'rayon' : 'zone';
    const combien = Etat.actifs().filter((a) => a[champ] === entree.id).length;

    ligne.querySelector('.classement-emoji').value = entree.emoji ?? '';
    ligne.querySelector('.classement-nom').value = entree.nom;
    ligne.querySelector('.classement-compte').textContent = combien ? `${combien} article(s)` : 'vide';

    ligne.querySelector('.classement-emoji').addEventListener('change', (e) => {
      Etat.majClassement(cle, entree.id, { emoji: e.target.value });
      apresClassement();
    });
    ligne.querySelector('.classement-nom').addEventListener('change', (e) => {
      Etat.majClassement(cle, entree.id, { nom: e.target.value });
      apresClassement();
    });

    const retirer = ligne.querySelector('.classement-retirer');
    // Le dernier de la liste ne se retire pas : il faut bien ranger quelque part.
    retirer.disabled = total <= 1;
    retirer.addEventListener('click', () => {
      const quoi = cle === 'rayons' ? 'le rayon' : 'l’emplacement';
      const avertissement = combien
        ? `\n\nLes ${combien} article(s) qui s’y trouvent seront déplacés, pas supprimés.`
        : '';
      if (!confirm(`Retirer ${quoi} « ${entree.nom} » ?${avertissement}`)) return;
      const bilan = Etat.supprimerClassement(cle, entree.id);
      apresClassement();
      message(bilan.deplaces
        ? `Retiré — ${bilan.deplaces} article(s) déplacé(s) vers « ${bilan.refuge} ».`
        : 'Retiré.');
    });

    return ligne;
  }

  function rendreClassement() {
    for (const [cle, cible] of [['rayons', '#liste-rayons'], ['zones', '#liste-zones']]) {
      const liste = Etat[cle]();
      const boite = $(cible);
      boite.innerHTML = '';
      for (const entree of liste) boite.append(ligneClassement(cle, entree, liste.length));
    }
  }

  /** Après toute retouche des listes : les menus et l'écran suivent. */
  function apresClassement() {
    // Un filtre resté sur un rayon supprimé ne montrerait plus rien, et
    // l'écran n'aurait aucun moyen de dire pourquoi : on le relâche.
    if (filtres.rayon && !Etat.rayons().some((r) => r.id === filtres.rayon)) filtres.rayon = '';
    if (filtres.zone && !Etat.zones().some((z) => z.id === filtres.zone)) filtres.zone = '';

    remplirListes();
    $('#filtre-rayon').value = filtres.rayon;
    $('#filtre-zone').value = filtres.zone;
    rendreClassement();
    rafraichir();
  }

  /* ---------- Le stock suggéré, et la table rase ---------- */

  function chargerStockSuggere() {
    const combien = Etat.nombreSuggeres();
    if (!confirm(`Verser le stock suggéré dans votre inventaire ?\n\n`
      + `Jusqu’à ${combien} articles s’ajouteront, sans quantité. Vous pourrez retirer `
      + `ceux qui ne vous concernent pas, un à un. Rien de ce que vous avez déjà ne sera touché.`)) return;

    const { ajoutes, retablis } = Etat.importerStockSuggere();
    apresClassement();
    montrer('inventaire');

    const morceaux = [];
    if (ajoutes) morceaux.push(`${ajoutes} article(s) ajouté(s)`);
    if (retablis) morceaux.push(`${retablis} rétabli(s)`);
    message(morceaux.length
      ? `${morceaux.join(', ')} — à vous de tailler la liste.`
      : 'Tous ces articles figuraient déjà dans votre inventaire.');
  }

  function toutEffacer() {
    const combien = Etat.actifs().length;
    if (!combien) { message('L’inventaire est déjà vide.', 'alerte'); return; }

    if (!confirm(`Effacer les ${combien} articles de l’inventaire ?\n\n`
      + 'L’inventaire redeviendra vide. Vos archives, elles, sont conservées.')) return;
    if (!confirm('Dernière confirmation : les quantités saisies seront perdues si elles ne sont pas archivées ou sauvegardées.')) return;

    Etat.effacerArticles();
    filtres.recherche = '';
    filtres.rayon = '';
    filtres.zone = '';
    filtres.etat = '';
    $('#champ-recherche').value = '';
    apresClassement();
    montrer('inventaire');
    message(`${combien} article(s) effacés — l’inventaire repart de zéro.`);
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
        // L'article a pu être retiré de la liste depuis : le compter, c'est
        // dire qu'on le veut de nouveau. Sans cela, la quantité se rangeait
        // dans un article invisible, et le geste restait sans effet à l'écran.
        Etat.retablirArticle(p.id);
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

  /**
   * Faut-il joindre la clé Claude au fichier ? On le demande à chaque envoi,
   * jamais d'office : le fichier donne alors accès au crédit de la clé, et
   * c'est à celui qui l'envoie d'en juger.
   */
  function optionsDEnvoi() {
    const cle = Analyseur.cle();
    if (!cle) return {};
    const joindre = confirm(
      'Joindre votre clé Claude au fichier ?\n\n'
      + 'OK : la personne qui le reçoit pourra analyser des photos avec la même clé, sans rien configurer. '
      + 'Le fichier donnera accès à votre crédit — ne l’envoyez qu’à quelqu’un de confiance.\n\n'
      + 'Annuler : le fichier part sans la clé.',
    );
    return joindre ? { cle } : {};
  }


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
      if (!confirm('Reprendre ce fichier ?\n\nOK : FUSIONNER — pour chaque article, la saisie la plus récente gagne. Rien ne se perd.\nAnnuler : voir l’autre façon de faire (une copie exacte du fichier).')) {
        if (!confirm('Autre façon : REMPLACER.\n\nCet appareil devient une copie exacte du fichier : tout ce qu’il contenait est effacé, y compris les articles que le fichier ne connaît pas.\n\nOK : remplacer. Annuler : ne rien faire.')) return;
        mode = 'remplacer';
      }

      try {
        const bilan = Etat.importer(contenu, mode);

        // Une clé jointe au fichier est adoptée si l'appareil n'en a pas :
        // c'est tout l'intérêt de l'avoir jointe. Une clé déjà en place
        // n'est jamais écrasée en silence.
        let noteCle = '';
        if (typeof contenu?.cle === 'string' && contenu.cle.trim()) {
          if (!Analyseur.cle()) {
            Analyseur.definirCle(contenu.cle);
            rafraichirCle();
            noteCle = ' La clé Claude jointe a été installée : l’analyse de photo est prête.';
          } else if (Analyseur.cle() !== contenu.cle.trim()) {
            noteCle = ' Le fichier contenait une autre clé Claude ; la vôtre a été gardée.';
          }
        }

        apresClassement();
        remplirChampsFermeture();
        message((mode === 'remplacer'
          ? 'Inventaire remplacé par le fichier reçu.'
          : `Fusion faite : ${bilan.mis} article(s) mis à jour, ${bilan.ajoutes} ajouté(s), `
            + `${bilan.listes} rayon(s) ou emplacement(s) repris, ${bilan.archives} archive(s) reprise(s).`) + noteCle);
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

    $('#bouton-classement').addEventListener('click', () => {
      rendreClassement();
      $('#dialogue-classement').showModal();
    });
    $('#classement-fermer').addEventListener('click', () => $('#dialogue-classement').close());

    $('#classement-retablir').addEventListener('click', () => {
      const bilan = Etat.retablirListesLivrees();
      apresClassement();
      const morceaux = [];
      if (bilan.rayons) morceaux.push(`${bilan.rayons} rayon(s)`);
      if (bilan.zones) morceaux.push(`${bilan.zones} emplacement(s)`);
      message(morceaux.length
        ? `Rétabli : ${morceaux.join(' et ')}. Vos noms et vos ajouts sont intacts.`
        : 'Toutes les listes livrées sont déjà là — rien à rétablir.');
    });

    for (const [cle, formulaire, champNom, champEmoji] of [
      ['rayons', '#ajout-rayon', '#rayon-nom', '#rayon-emoji'],
      ['zones', '#ajout-zone', '#zone-nom', '#zone-emoji'],
    ]) {
      $(formulaire).addEventListener('submit', (e) => {
        e.preventDefault();
        const entree = Etat.ajouterClassement(cle, { nom: $(champNom).value, emoji: $(champEmoji).value });
        if (!entree) { message('Donnez-lui un nom.', 'alerte'); return; }
        $(champNom).value = '';
        $(champEmoji).value = '';
        apresClassement();
        message(`« ${entree.nom} » ajouté.`);
      });
    }

    $('#bouton-stock-suggere-2').addEventListener('click', chargerStockSuggere);
    $('#bouton-tout-effacer').addEventListener('click', toutEffacer);
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
      $('#champ-cle').type = 'password';
      $('#cle-voir').textContent = '👁️ Voir la clé';
      $('#dialogue-cle').showModal();
    });
    $('#cle-voir').addEventListener('click', () => {
      const champ = $('#champ-cle');
      const cachee = champ.type === 'password';
      champ.type = cachee ? 'text' : 'password';
      $('#cle-voir').textContent = cachee ? '🙈 Masquer la clé' : '👁️ Voir la clé';
    });

    $('#cle-copier').addEventListener('click', async () => {
      const valeur = $('#champ-cle').value.trim();
      if (!valeur) { message('Il n’y a pas de clé à copier sur cet appareil.', 'alerte'); return; }
      try {
        await navigator.clipboard.writeText(valeur);
        message('Clé copiée — collez-la sur l’autre appareil.');
      } catch {
        // Certains navigateurs refusent le presse-papiers : à défaut, on
        // montre la clé et on laisse l'utilisateur la sélectionner.
        $('#champ-cle').type = 'text';
        $('#champ-cle').select();
        $('#cle-voir').textContent = '🙈 Masquer la clé';
        message('Copie refusée par le navigateur — la clé est affichée, copiez-la à la main.', 'alerte');
      }
    });

    $('#cle-annuler').addEventListener('click', () => {
      // La clé ne doit pas rester lisible d'une ouverture à l'autre.
      $('#champ-cle').type = 'password';
      $('#cle-voir').textContent = '👁️ Voir la clé';
      $('#dialogue-cle').close();
    });
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

    $('#bandeau-recharger').addEventListener('click', () => window.location.reload());

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
      Exporteur.sauvegarde(optionsDEnvoi());
      message('Sauvegarde téléchargée — gardez-la en lieu sûr.');
    });

    $('#bouton-envoyer').addEventListener('click', async () => {
      const issue = await Exporteur.partagerFichier(optionsDEnvoi());
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

    chargerStockSuggere,
  };

  /* ---------- Départ ---------- */

  Etat.charger();
  remplirListes();
  Rendu.brancher(actions);
  brancherTout();
  remplirChampsFermeture();
  $('#compte-suggeres').textContent = Etat.nombreSuggeres();
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

  /* ---------- Les nouvelles versions ---------- */

  /**
   * L'application garde une copie d'elle-même pour s'ouvrir sans réseau. La
   * contrepartie est cruelle : une correction publiée n'atteint personne tant
   * que l'ancienne copie n'a pas été chassée, et rien à l'écran ne le dit —
   * l'utilisateur cherche un bouton qui existe pourtant, en ligne.
   *
   * Le service worker prévient donc la page dès qu'une nouvelle version est
   * prête, et la page le dit à qui la regarde, avec le bouton qui va avec.
   */
  function annoncerNouvelleVersion() {
    if (!$('#bandeau-version').hidden) return;
    $('#bandeau-version').hidden = false;
    // Le bandeau est fixe en haut : sans ce décalage, il couvrirait l'en-tête.
    document.body.classList.add('avec-bandeau');
  }

  function surveillerLesVersions(enregistrement) {
    // Une version déjà installée et en attente : la dire tout de suite.
    if (enregistrement.waiting && navigator.serviceWorker.controller) annoncerNouvelleVersion();

    enregistrement.addEventListener('updatefound', () => {
      const nouveau = enregistrement.installing;
      if (!nouveau) return;
      nouveau.addEventListener('statechange', () => {
        // `controller` distingue la toute première visite — où il n'y a rien à
        // annoncer — d'une vraie mise à jour.
        if (nouveau.state === 'installed' && navigator.serviceWorker.controller) annoncerNouvelleVersion();
      });
    });

    // Une application ajoutée à l'écran d'accueil peut rester ouverte des
    // jours : on revérifie chaque fois qu'elle revient à l'avant-plan.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) enregistrement.update().catch(() => {});
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(surveillerLesVersions).catch(() => {});
    });
  }
})();
