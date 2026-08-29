/**
 * Branchement de l'interface : choix de la pièce, formulaire des détails,
 * composition de la recette, carnet et équipement dans localStorage.
 * Tout reste dans le navigateur — aucune requête vers l'extérieur.
 */

'use strict';

(() => {

  const CLE_EQUIPEMENT = 'ma-cuisine.equipement';
  const CLE_CARNET = 'ma-cuisine.carnet';

  const EQUIPEMENT = [
    { id: 'thermometre', nom: 'Thermomètre à sonde', note: 'l’outil qui change tout — les recettes raisonnent par température à cœur' },
    { id: 'fonte', nom: 'Poêlon en fonte', note: 'pour les saisies franches' },
    { id: 'cocotte', nom: 'Cocotte en fonte émaillée', note: 'pour les braisés' },
    { id: 'grille', nom: 'Plaque avec grille', note: 'l’air circule sous les rôtis' },
    { id: 'bbq', nom: 'BBQ', note: 'cuissons directes ou indirectes' },
    { id: 'ficelle', nom: 'Ficelle de boucher', note: 'rôtis réguliers, pattes liées' },
    { id: 'parchemin', nom: 'Papier parchemin', note: 'cuissons douces sans attache' },
    { id: 'mijoteuse', nom: 'Mijoteuse', note: 'l’option des jours pressés' },
  ];

  /* ---------- État ---------- */

  const lire = (cle, defaut) => {
    try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch { return defaut; }
  };
  const ecrire = (cle, valeur) => {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage plein ou privé : tant pis */ }
  };

  let equip = Object.assign(
    { thermometre: true, fonte: true, cocotte: true, grille: true, bbq: false, ficelle: false, parchemin: true, mijoteuse: false },
    lire(CLE_EQUIPEMENT, {}),
  );

  let categorieActive = null;
  let pieceActive = null;
  let cuissonActive = null;
  let derniereRecette = null; // { pieceId, poids, cuissonId, service }

  /* ---------- Raccourcis DOM ---------- */

  const $ = (selecteur) => document.querySelector(selecteur);
  const filtres = $('#filtres-categories');
  const grille = $('#grille-pieces');
  const sectionDetails = $('#section-details');
  const sectionRecette = $('#section-recette');
  const contenuRecette = $('#contenu-recette');
  const champPoids = $('#champ-poids');
  const champService = $('#champ-service');
  const choixCuissons = $('#choix-cuissons');

  /* ---------- Catégories et pièces ---------- */

  function rendreFiltres() {
    const boutons = [{ id: null, nom: 'Tout', emoji: '🍽️' }, ...CATEGORIES];
    filtres.innerHTML = '';
    for (const cat of boutons) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'chip';
      bouton.textContent = cat.emoji + ' ' + cat.nom;
      bouton.setAttribute('aria-pressed', String(categorieActive === cat.id));
      bouton.addEventListener('click', () => {
        categorieActive = cat.id;
        rendreFiltres();
        rendreGrille();
      });
      filtres.append(bouton);
    }
  }

  function rendreGrille() {
    grille.innerHTML = '';
    for (const piece of PIECES) {
      if (categorieActive && piece.categorie !== categorieActive) continue;
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'piece';
      bouton.setAttribute('aria-pressed', String(pieceActive?.id === piece.id));
      bouton.innerHTML = '<span class="emoji"></span><span><b></b><small></small></span>';
      bouton.querySelector('.emoji').textContent = piece.emoji;
      bouton.querySelector('b').textContent = piece.nom;
      bouton.querySelector('small').textContent = piece.description;
      bouton.addEventListener('click', () => choisirPiece(piece));
      grille.append(bouton);
    }
  }

  function choisirPiece(piece) {
    pieceActive = piece;
    cuissonActive = piece.cuissons[0];
    rendreGrille();

    $('#details-titre').textContent = piece.emoji + ' ' + piece.nom;
    champPoids.min = piece.poids.min;
    champPoids.max = piece.poids.max;
    champPoids.value = piece.poids.defaut;
    $('#indice-poids').textContent = piece.poids.indication;

    rendreCuissons();
    sectionRecette.hidden = true;
    sectionDetails.hidden = false;
    sectionDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function rendreCuissons() {
    choixCuissons.innerHTML = '';
    for (const cuisson of pieceActive.cuissons) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'chip';
      bouton.textContent = cuisson.nom;
      bouton.setAttribute('aria-pressed', String(cuissonActive?.id === cuisson.id));
      bouton.addEventListener('click', () => {
        cuissonActive = cuisson;
        rendreCuissons();
      });
      choixCuissons.append(bouton);
    }
    $('#indice-cuisson').textContent = cuissonActive
      ? cuissonActive.nom + ' : ' + cuissonActive.note + '.'
      : '';
    $('#champ-cuissons').style.display = pieceActive.cuissons.length > 1 ? '' : 'none';
  }

  /* ---------- Composition ---------- */

  function composer(donnees) {
    const piece = PIECES.find((p) => p.id === donnees.pieceId);
    if (!piece) return;
    const cuisson = piece.cuissons.find((c) => c.id === donnees.cuissonId) ?? piece.cuissons[0];
    const ctx = {
      poids: donnees.poids,
      cuisson,
      equip,
      service: donnees.service ? new Date(donnees.service) : null,
    };
    contenuRecette.innerHTML = Moteur.composer(piece, ctx);
    derniereRecette = donnees;
    sectionRecette.hidden = false;
    sectionRecette.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#formulaire-details').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    if (!pieceActive) return;
    const poids = Math.round(Number(champPoids.value));
    if (!Number.isFinite(poids) || poids <= 0) return;
    composer({
      pieceId: pieceActive.id,
      poids,
      cuissonId: cuissonActive?.id,
      service: champService.value || null,
    });
  });

  $('#bouton-recommencer').addEventListener('click', () => {
    sectionRecette.hidden = true;
    sectionDetails.hidden = true;
    pieceActive = null;
    rendreGrille();
    $('#section-choix').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#bouton-imprimer').addEventListener('click', () => window.print());

  /* ---------- Word et partage : la recette voyage ---------- */

  function brancherExport(idWord, idPartage, conteneur) {
    $(idWord).addEventListener('click', () => Exporteur.telechargerWord(conteneur));
    $(idPartage).addEventListener('click', async () => {
      const bouton = $(idPartage);
      const sort = await Exporteur.partager(conteneur);
      if (sort === 'copie') {
        bouton.textContent = '✓ Copié — collez-le où bon vous semble';
        setTimeout(() => { bouton.textContent = '📤 Partager'; }, 3000);
      }
    });
  }

  brancherExport('#bouton-word-recette', '#bouton-partager-recette', contenuRecette);

  /* ---------- Le carnet ---------- */

  $('#bouton-enregistrer').addEventListener('click', () => {
    if (!derniereRecette) return;
    const piece = PIECES.find((p) => p.id === derniereRecette.pieceId);
    const carnet = lire(CLE_CARNET, []);
    carnet.unshift({
      ...derniereRecette,
      titre: piece.nom + ' — ' + Moteur.poids(derniereRecette.poids),
      gardeLe: new Date().toISOString(),
    });
    ecrire(CLE_CARNET, carnet.slice(0, 100));
    const bouton = $('#bouton-enregistrer');
    bouton.textContent = '✓ Gardée au carnet';
    setTimeout(() => { bouton.textContent = '💾 Garder au carnet'; }, 2000);
  });

  function rendreCarnet() {
    const liste = $('#liste-carnet');
    const carnet = lire(CLE_CARNET, []);
    if (!carnet.length) {
      liste.innerHTML = '<p class="carnet-vide">Le carnet est vierge : composez une recette, puis gardez-la ici. Elle se recomposera à l’identique, poids et cuisson compris.</p>';
      return;
    }
    liste.innerHTML = '';
    carnet.forEach((entree, index) => {
      const ligne = document.createElement('div');
      ligne.className = 'entree-carnet';
      const infos = document.createElement('div');
      const titre = document.createElement('b');
      titre.textContent = entree.titre;
      const sous = document.createElement('small');
      sous.textContent = 'gardée le ' + new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date(entree.gardeLe));
      infos.append(titre, sous);
      const boutons = document.createElement('div');
      boutons.className = 'boutons';
      const ouvrir = document.createElement('button');
      ouvrir.type = 'button';
      ouvrir.className = 'bouton';
      ouvrir.textContent = 'Rouvrir';
      ouvrir.addEventListener('click', () => {
        $('#dialogue-carnet').close();
        if (entree.type === 'conseil') {
          // Une recette du conseiller : on la recompose depuis son JSON gardé.
          // La conversation, elle, ne reprend pas — la photo n'est pas conservée.
          dernierConseil = entree.json;
          conversation = [];
          contenuConseil.innerHTML = Moteur.composerConseil(entree.json);
          boutonEpicerie.hidden = !(entree.json?.epicerie?.length);
          boutonEpicerie.textContent = '🛒 Manquants vers Mon Épicerie';
          filConseil.innerHTML = '';
          resultatConseiller.hidden = false;
          resultatConseiller.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          composer(entree);
        }
      });
      const oublier = document.createElement('button');
      oublier.type = 'button';
      oublier.className = 'bouton discret';
      oublier.textContent = '✕';
      oublier.setAttribute('aria-label', 'Retirer du carnet');
      oublier.addEventListener('click', () => {
        const restant = lire(CLE_CARNET, []);
        restant.splice(index, 1);
        ecrire(CLE_CARNET, restant);
        rendreCarnet();
      });
      boutons.append(ouvrir, oublier);
      ligne.append(infos, boutons);
      liste.append(ligne);
    });
  }

  $('#bouton-carnet').addEventListener('click', () => {
    rendreCarnet();
    $('#dialogue-carnet').showModal();
  });

  /* ---------- Ce que j'ai dans ma cuisine ---------- */

  function rendreEquipement() {
    const liste = $('#liste-equipement');
    liste.innerHTML = '';
    for (const objet of EQUIPEMENT) {
      const etiquette = document.createElement('label');
      const case_ = document.createElement('input');
      case_.type = 'checkbox';
      case_.checked = Boolean(equip[objet.id]);
      case_.addEventListener('change', () => {
        equip[objet.id] = case_.checked;
        ecrire(CLE_EQUIPEMENT, equip);
        // Une recette à l'écran se recompose avec le nouvel attirail.
        if (derniereRecette && !sectionRecette.hidden) composer(derniereRecette);
      });
      const texte = document.createElement('span');
      const nom = document.createElement('b');
      nom.textContent = objet.nom;
      const note = document.createElement('small');
      note.textContent = ' — ' + objet.note;
      texte.append(nom, note);
      etiquette.append(case_, texte);
      liste.append(etiquette);
    }
  }

  $('#bouton-equipement').addEventListener('click', () => {
    rendreEquipement();
    $('#dialogue-equipement').showModal();
  });

  /* ---------- Le conseiller à l'œil (photo) ---------- */

  let photoCourante = null;
  let conversation = [];
  let dernierConseil = null;

  const sectionConseiller = $('#section-conseiller');
  const resultatConseiller = $('#resultat-conseiller');
  const contenuConseil = $('#contenu-conseil');
  const filConseil = $('#fil-conseil');
  const attente = $('#attente-conseiller');
  const erreurConseiller = $('#erreur-conseiller');
  const boutonConsulter = $('#bouton-consulter');
  const boutonEpicerie = $('#bouton-epicerie');

  const PHRASES_ATTENTE = [
    'Le conseiller examine la pièce…',
    'Il lit l’étiquette à la loupe…',
    'Il consulte votre liste d’épicerie…',
    'Il pèse la méthode et son contraire…',
    'Il compose les étapes, une à une…',
    'Il règle le calendrier à rebours…',
  ];
  let minuterieAttente = null;

  function montrerAttente(oui) {
    attente.hidden = !oui;
    boutonConsulter.disabled = oui;
    const boutonReplique = document.querySelector('#formulaire-replique button');
    if (boutonReplique) {
      boutonReplique.disabled = oui;
      boutonReplique.textContent = oui ? '…' : 'Envoyer';
    }
    clearInterval(minuterieAttente);
    if (oui) {
      let i = 0;
      $('#attente-texte').textContent = PHRASES_ATTENTE[0];
      minuterieAttente = setInterval(() => {
        i = (i + 1) % PHRASES_ATTENTE.length;
        $('#attente-texte').textContent = PHRASES_ATTENTE[i];
      }, 4000);
    }
  }

  function montrerErreur(message) {
    erreurConseiller.hidden = !message;
    if (message) {
      erreurConseiller.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = message;
      erreurConseiller.append(p);
      erreurConseiller.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function majEtatCle() {
    $('#conseiller-hors-ligne').hidden = Boolean(Conseiller.cle());
  }

  $('#champ-photo').addEventListener('change', async (evenement) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;
    montrerErreur('');
    try {
      photoCourante = await Conseiller.preparerPhoto(fichier);
      const apercu = $('#apercu-photo');
      apercu.src = photoCourante.apercu;
      apercu.hidden = false;
      $('#invite-photo').textContent = '📷 Changer de photo';
    } catch (err) {
      photoCourante = null;
      montrerErreur(err.message);
    }
  });

  /** Rend une réponse en prose : un paragraphe par bloc de texte. */
  function enParagraphes(texte, conteneur) {
    for (const morceau of String(texte).split(/\n{2,}/)) {
      if (!morceau.trim()) continue;
      const p = document.createElement('p');
      p.textContent = morceau.trim();
      conteneur.append(p);
    }
  }

  function contexteConseiller() {
    const service = $('#champ-service-photo').value;
    const poids = Math.round(Number($('#champ-poids-photo').value));
    return {
      service: service
        ? Moteur.jour(new Date(service)) + ' à ' + Moteur.heure(new Date(service))
        : null,
      poids: Number.isFinite(poids) && poids > 0 ? poids : null,
      equipement: EQUIPEMENT.filter((o) => equip[o.id]).map((o) => o.nom.toLowerCase()),
      epicerie: Conseiller.listeDeLaSemaine(),
      inventaire: Conseiller.inventaire(),
    };
  }

  $('#formulaire-conseiller').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    montrerErreur('');
    if (!Conseiller.cle()) { $('#dialogue-cle').showModal(); return; }
    const demande = $('#champ-demande').value.trim();
    if (!photoCourante && !demande) {
      montrerErreur('Donnez-moi au moins quelques mots — ce que vous voulez cuisiner — ou une photo de la pièce.');
      return;
    }

    conversation = [Conseiller.premierTour(photoCourante, demande, contexteConseiller())];
    montrerAttente(true);
    resultatConseiller.hidden = true;

    try {
      const texte = await Conseiller.consulter(conversation);
      conversation.push({ role: 'assistant', content: [{ type: 'text', text: texte }] });

      dernierConseil = Conseiller.extraireJSON(texte);
      contenuConseil.innerHTML = '';
      if (dernierConseil) {
        contenuConseil.innerHTML = Moteur.composerConseil(dernierConseil);
      } else {
        // Le conseiller a répondu en prose (photo illisible, question, refus poli).
        enParagraphes(texte, contenuConseil);
      }
      boutonEpicerie.hidden = !(dernierConseil?.epicerie?.length);
      boutonEpicerie.textContent = '🛒 Manquants vers Mon Épicerie';
      filConseil.innerHTML = '';
      resultatConseiller.hidden = false;
      resultatConseiller.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      montrerErreur(err.message);
    } finally {
      montrerAttente(false);
    }
  });

  $('#formulaire-replique').addEventListener('submit', async (evenement) => {
    evenement.preventDefault();
    const champ = $('#champ-replique');
    const question = champ.value.trim();
    if (!question) return;
    if (!Conseiller.cle()) { $('#dialogue-cle').showModal(); return; }

    // Une recette rouverte du carnet arrive sans sa conversation (la photo
    // n'est pas conservée) : on la fait renaître depuis le JSON gardé, pour
    // que la réplique reste possible.
    if (!conversation.length) {
      if (!dernierConseil) { montrerErreur('Composez d’abord une recette, puis répliquez-lui.'); return; }
      conversation = [
        { role: 'user', content: 'Pour contexte, voici la recette que tu m’avais composée, telle que gardée à mon carnet (la photo n’est plus disponible) : ' + JSON.stringify(dernierConseil) + '\nRéponds désormais à mes questions en prose, fidèle à la même charte.' },
        { role: 'assistant', content: [{ type: 'text', text: 'Bien reçu : je poursuis sur cette recette, en prose.' }] },
      ];
    }

    const blocQuestion = document.createElement('p');
    blocQuestion.className = 'vous';
    blocQuestion.textContent = question;
    filConseil.append(blocQuestion);
    champ.value = '';

    conversation.push({ role: 'user', content: question });
    montrerAttente(true);
    try {
      const texte = await Conseiller.consulter(conversation);
      conversation.push({ role: 'assistant', content: [{ type: 'text', text: texte }] });
      const bloc = document.createElement('div');
      bloc.className = 'conseiller-dit';
      enParagraphes(texte, bloc);
      filConseil.append(bloc);
      bloc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      conversation.pop();
      montrerErreur(err.message);
    } finally {
      montrerAttente(false);
    }
  });

  boutonEpicerie.addEventListener('click', () => {
    const n = Conseiller.verserALEpicerie(dernierConseil?.epicerie ?? []);
    boutonEpicerie.textContent = n
      ? '✓ ' + n + ' article' + (n > 1 ? 's' : '') + ' sur la liste'
      : '✓ Tout y était déjà';
  });

  $('#bouton-imprimer-conseil').addEventListener('click', () => window.print());
  brancherExport('#bouton-word-conseil', '#bouton-partager-conseil', contenuConseil);

  $('#bouton-garder-conseil').addEventListener('click', () => {
    if (!dernierConseil) return;
    const carnet = lire(CLE_CARNET, []);
    carnet.unshift({
      type: 'conseil',
      json: dernierConseil,
      titre: (dernierConseil.titre ?? 'Recette du conseiller') + ' 📷',
      gardeLe: new Date().toISOString(),
    });
    ecrire(CLE_CARNET, carnet.slice(0, 100));
    const bouton = $('#bouton-garder-conseil');
    bouton.textContent = '✓ Gardée au carnet';
    setTimeout(() => { bouton.textContent = '💾 Garder au carnet'; }, 2000);
  });

  /* ---------- L'inventaire ---------- */

  const ZONES_INVENTAIRE = [
    { id: 'gardeManger', nom: 'Garde-manger', article: 'du garde-manger', emoji: '🥫' },
    { id: 'frigo', nom: 'Frigidaire', article: 'du frigidaire', emoji: '🧀' },
    { id: 'congelateur', nom: 'Congélateur', article: 'du congélateur', emoji: '❄️' },
  ];

  const normaliserNom = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function rendreInventaire() {
    const stock = Conseiller.inventaire();
    const conteneur = $('#zones-inventaire');
    conteneur.innerHTML = '';

    for (const zone of ZONES_INVENTAIRE) {
      const bloc = document.createElement('div');
      bloc.className = 'zone-inventaire';

      const entete = document.createElement('div');
      entete.className = 'zone-entete';
      const titre = document.createElement('b');
      titre.textContent = zone.emoji + ' ' + zone.nom;
      const quand = document.createElement('small');
      quand.textContent = stock[zone.id].quand
        ? 'mis à jour le ' + new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date(stock[zone.id].quand))
        : 'jamais inventorié';
      entete.append(titre, quand);

      const champ = document.createElement('textarea');
      champ.rows = 5;
      champ.dataset.zone = zone.id;
      champ.placeholder = 'Un aliment par ligne — ou analysez une photo ci-dessous.';
      champ.value = stock[zone.id].items.join('\n');

      const boutonPhoto = document.createElement('button');
      boutonPhoto.type = 'button';
      boutonPhoto.className = 'bouton';
      boutonPhoto.textContent = '📷 Analyser une photo ' + zone.article;
      const entree = document.createElement('input');
      entree.type = 'file';
      entree.accept = 'image/*';
      entree.hidden = true;
      boutonPhoto.addEventListener('click', () => {
        if (!Conseiller.cle()) { $('#dialogue-inventaire').close(); $('#dialogue-cle').showModal(); return; }
        entree.click();
      });
      entree.addEventListener('change', async () => {
        const fichier = entree.files?.[0];
        if (!fichier) return;
        boutonPhoto.disabled = true;
        boutonPhoto.textContent = '⏳ Le conseiller dresse la liste…';
        try {
          const photo = await Conseiller.preparerPhoto(fichier);
          const trouves = await Conseiller.analyserInventaire(photo, zone.nom.toLowerCase());
          const existants = champ.value.split('\n').map((l) => l.trim()).filter(Boolean);
          const connus = new Set(existants.map(normaliserNom));
          const nouveaux = trouves.filter((i) => !connus.has(normaliserNom(i)));
          champ.value = [...existants, ...nouveaux].join('\n');
          boutonPhoto.textContent = nouveaux.length
            ? '✓ ' + nouveaux.length + ' aliment' + (nouveaux.length > 1 ? 's' : '') + ' ajouté' + (nouveaux.length > 1 ? 's' : '') + ' — corrigez au besoin'
            : '✓ Rien de neuf reconnu — une autre photo ?';
        } catch (err) {
          boutonPhoto.textContent = '⚠ ' + err.message;
        } finally {
          boutonPhoto.disabled = false;
          entree.value = '';
        }
      });

      bloc.append(entete, champ, boutonPhoto, entree);
      conteneur.append(bloc);
    }
  }

  function sauverInventaire() {
    const stock = Conseiller.inventaire();
    for (const champ of document.querySelectorAll('#zones-inventaire textarea')) {
      const items = champ.value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 120);
      const avant = stock[champ.dataset.zone].items.join('\n');
      stock[champ.dataset.zone] = {
        items,
        quand: items.join('\n') === avant ? stock[champ.dataset.zone].quand : new Date().toISOString(),
      };
    }
    Conseiller.definirInventaire(stock);
  }

  $('#bouton-inventaire').addEventListener('click', () => {
    rendreInventaire();
    $('#dialogue-inventaire').showModal();
  });

  $('#formulaire-inventaire').addEventListener('submit', sauverInventaire);
  $('#dialogue-inventaire').addEventListener('close', sauverInventaire);

  /* ---------- La clé ---------- */

  $('#bouton-cle').addEventListener('click', () => {
    $('#champ-cle').value = Conseiller.cle();
    $('#dialogue-cle').showModal();
  });

  $('#bouton-garder-cle').addEventListener('click', () => {
    Conseiller.definirCle($('#champ-cle').value);
    majEtatCle();
  });

  $('#bouton-oublier-cle').addEventListener('click', () => {
    Conseiller.definirCle('');
    $('#champ-cle').value = '';
    majEtatCle();
    $('#dialogue-cle').close();
  });

  /* ---------- Départ ---------- */

  rendreFiltres();
  rendreGrille();
  majEtatCle();

})();
