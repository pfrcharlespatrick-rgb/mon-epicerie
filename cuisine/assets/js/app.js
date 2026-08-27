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
  let derniereRecette = null; // { pieceId, poids, cuissonId, service, peremption }

  /* ---------- Raccourcis DOM ---------- */

  const $ = (selecteur) => document.querySelector(selecteur);
  const filtres = $('#filtres-categories');
  const grille = $('#grille-pieces');
  const sectionDetails = $('#section-details');
  const sectionRecette = $('#section-recette');
  const contenuRecette = $('#contenu-recette');
  const champPoids = $('#champ-poids');
  const champService = $('#champ-service');
  const champPeremption = $('#champ-peremption');
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
      peremption: donnees.peremption || null,
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
      peremption: champPeremption.value || null,
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
        composer(entree);
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

  /* ---------- Départ ---------- */

  rendreFiltres();
  rendreGrille();

})();
