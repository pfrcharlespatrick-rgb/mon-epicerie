/**
 * Le moteur : à partir d'une pièce et du contexte (poids, cuisson choisie,
 * équipement, heure du service, date « meilleur avant »), compose la recette
 * complète — en-tête, étapes numérotées, sauce, conservation, calendrier à
 * rebours. Aucun état ici : uniquement des fonctions.
 */

'use strict';

const Moteur = {

  /* ---------- Formats ---------- */

  /** 1800 → « 1,8 kg », 450 → « 450 g ». */
  poids(g) {
    if (g >= 1000) {
      const kg = Math.round(g / 100) / 10;
      return String(kg).replace('.', ',') + ' kg';
    }
    return g + ' g';
  },

  /** 95 → « 1 h 35 », 45 → « 45 min ». */
  duree(min) {
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60);
    const reste = min % 60;
    return reste ? h + ' h ' + String(reste).padStart(2, '0') : h + ' h';
  },

  /** Fenêtre affichable : « 45 min à 1 h 10 ». */
  plage(min, max) {
    return this.duree(min) + ' à ' + this.duree(max);
  },

  /** Une Date → « 16 h 30 ». */
  heure(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    return h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '');
  },

  /** Une Date → « samedi 24 août ». */
  jour(date) {
    return new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  },

  echapper(texte) {
    return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  /* ---------- Le calendrier à rebours ---------- */

  /**
   * Depuis l'heure du service, remonte les étapes du jour pour dater chaque
   * départ ; les étapes de la veille et des jours d'avance gardent leur
   * libellé de jour. Retourne du HTML, ou une chaîne vide sans heure fournie.
   */
  calendrier(etapes, ctx) {
    if (!ctx.service) return '';
    const service = ctx.service;

    const duJour = etapes.filter((e) => e.quand === 'jour');
    const totalJour = duJour.reduce((somme, e) => somme + e.duree, 0);

    let curseur = new Date(service.getTime() - totalJour * 60000);
    const debutJour = new Date(curseur);

    const lignes = [];
    for (const etape of etapes) {
      if (etape.quand === 'veille') {
        lignes.push({ moment: 'La veille, en soirée', titre: etape.titre });
      } else if (etape.quand && typeof etape.quand === 'object' && etape.quand.joursAvant) {
        const n = etape.quand.joursAvant;
        lignes.push({ moment: n + ' jour' + (n > 1 ? 's' : '') + ' avant', titre: etape.titre });
      } else {
        lignes.push({ moment: this.heure(curseur), titre: etape.titre });
        curseur = new Date(curseur.getTime() + etape.duree * 60000);
      }
    }
    lignes.push({ moment: this.heure(service), titre: 'Le service', final: true });

    const enRetard = debutJour < new Date() && service > new Date();
    const memeJour = debutJour.toDateString() === service.toDateString();

    return '<h4>Le calendrier à rebours</h4>'
      + '<p class="explication">Pour servir le ' + this.jour(service) + ' à ' + this.heure(service)
      + ', voici l’heure de chaque départ' + (memeJour ? '' : ' — attention, le jour même commence la veille du service') + '. '
      + 'Les fenêtres de cuisson sont comptées larges : mieux vaut une viande qui patiente au chaud qu’une tablée qui patiente à froid.</p>'
      + (enRetard ? '<div class="encart alerte"><p><b>L’horloge est contre vous :</b> à rebours, il faudrait déjà avoir commencé. Reculez l’heure du service, ou choisissez une pièce plus rapide.</p></div>' : '')
      + '<ul class="calendrier">'
      + lignes.map((l) => '<li><span class="moment">' + this.echapper(l.moment) + '</span><span>' + this.echapper(l.titre) + '</span></li>').join('')
      + '</ul>';
  },

  /* ---------- La composition ---------- */

  /** Compose la recette entière et retourne son HTML. */
  composer(piece, ctx) {
    const etapes = piece.etapes(ctx);
    const cuisson = ctx.cuisson;

    // Fenêtre du jour même, pour l'annonce d'en-tête.
    const totalJour = etapes.filter((e) => e.quand === 'jour').reduce((s, e) => s + e.duree, 0);
    const aUneVeille = etapes.some((e) => e.quand === 'veille');

    const vitrines = [];
    if (cuisson && cuisson.retrait) {
      vitrines.push('<div class="vitrine"><small>Retrait du feu à</small><span class="gros">' + cuisson.retrait + ' °C</span><small>à cœur</small></div>');
    }
    if (cuisson && cuisson.coeur) {
      const valeur = typeof cuisson.coeur === 'number' ? cuisson.coeur + ' °C' : this.echapper(String(cuisson.coeur)) + (String(cuisson.coeur).match(/^[\d\s à]+$/) ? ' °C' : '');
      vitrines.push('<div class="vitrine"><small>' + (cuisson.retrait ? 'Après repos, à table à' : 'La cible') + '</small><span class="gros">' + valeur + '</span><small>' + this.echapper(cuisson.note) + '</small></div>');
    }
    vitrines.push('<div class="vitrine"><small>Le jour même, comptez</small><span class="gros">' + this.duree(totalJour) + '</span><small>' + (aUneVeille ? 'plus le salage de la veille' : 'de bout en bout') + '</small></div>');

    const quandLibelle = (quand) => {
      if (quand === 'veille') return 'La veille';
      if (quand && typeof quand === 'object' && quand.joursAvant) return quand.joursAvant + ' jour' + (quand.joursAvant > 1 ? 's' : '') + ' avant';
      return 'Le jour même';
    };

    const listeEtapes = etapes.map((e) =>
      '<li' + (e.critique ? ' class="critique"' : '') + '>'
      + '<div class="etape-en-tete">'
      + '<span class="etape-titre">' + this.echapper(e.titre) + '</span>'
      + (e.dureeTexte ? '<span class="duree">' + this.echapper(e.dureeTexte) + '</span>' : '')
      + '<span class="etape-quand">' + quandLibelle(e.quand) + '</span>'
      + (e.critique ? '<span class="critique-note">⚠ là où tout peut se gâcher</span>' : '')
      + '</div>'
      + '<p>' + e.texte + '</p>'
      + '</li>'
    ).join('');

    const noteThermometre = ctx.equip.thermometre ? '' :
      '<div class="encart"><p><b>Sans thermomètre à sonde.</b> Les repères du toucher et de l’œil donnés dans les étapes vous mèneront à bon port, mais je vous le dis sans détour : une sonde à moins de vingt dollars est l’achat qui change le plus une cuisine. On cesse de deviner, on sait — et on ne surcuit plus jamais « pour être sûr ». Cochez-la dans « Ma cuisine » quand elle sera dans votre tiroir.</p></div>';

    return '<div class="recette">'
      + '<div class="recette-entete">'
      + '<h3>' + this.echapper(piece.nom) + ' — ' + this.poids(ctx.poids) + '</h3>'
      + '<p class="recette-sous-titre">' + (cuisson && cuisson.nom ? 'Cuisson ' + this.echapper(cuisson.nom.toLowerCase()) + '. ' : '') + this.echapper(piece.description) + '.</p>'
      + '</div>'
      + '<div class="vitrine-temperatures">' + vitrines.join('') + '</div>'
      + piece.intro(ctx)
      + '<h4>Ce qu’il vous faut</h4>'
      + piece.besoins(ctx)
      + noteThermometre
      + '<h4>Les étapes</h4>'
      + '<ol class="etapes">' + listeEtapes + '</ol>'
      + (piece.sauce ? '<h4>La sauce, jamais perdue</h4>' + piece.sauce(ctx) : '')
      + '<h4>Conservation et réchauffage</h4>'
      + piece.conservation(ctx)
      + '<h4>Pour l’accompagner</h4>'
      + piece.accompagnement(ctx)
      + this.calendrier(etapes, ctx)
      + '</div>';
  },

  /* ---------- La recette venue du conseiller (photo) ---------- */

  /**
   * Rend une recette composée par le conseiller à partir d'une photo — même
   * habillage que les recettes de la maison. `r` est l'objet JSON retourné
   * par le modèle : tout y est échappé, rien n'y est interprété.
   */
  composerConseil(r) {
    const e = (t) => this.echapper(t ?? '');
    const par = (t) => (t ? '<p>' + e(t) + '</p>' : '');

    const vitrines = [];
    if (r.retrait) {
      vitrines.push('<div class="vitrine"><small>Retrait du feu à</small><span class="gros">' + e(String(r.retrait)) + ' °C</span><small>à cœur</small></div>');
    }
    if (r.cible) {
      vitrines.push('<div class="vitrine"><small>' + (r.retrait ? 'Après repos, à table à' : 'La cible') + '</small><span class="gros">' + e(String(r.cible)) + '</span><small>' + e(r.cibleNote ?? '') + '</small></div>');
    }
    if (r.dureeJour) {
      vitrines.push('<div class="vitrine"><small>Le jour même, comptez</small><span class="gros">' + e(String(r.dureeJour)) + '</span><small>d’après la photo</small></div>');
    }

    const quandLibelle = (quand) => (quand === 'veille' ? 'La veille' : quand === 'avant' ? 'Les jours d’avant' : 'Le jour même');

    const etapes = Array.isArray(r.etapes) ? r.etapes : [];
    const listeEtapes = etapes.map((et) =>
      '<li' + (et.critique ? ' class="critique"' : '') + '>'
      + '<div class="etape-en-tete">'
      + '<span class="etape-titre">' + e(et.titre) + '</span>'
      + (et.duree ? '<span class="duree">' + e(et.duree) + '</span>' : '')
      + '<span class="etape-quand">' + quandLibelle(et.quand) + '</span>'
      + (et.critique ? '<span class="critique-note">⚠ là où tout peut se gâcher</span>' : '')
      + '</div>'
      + '<p>' + e(et.texte) + '</p>'
      + '</li>'
    ).join('');

    const calendrier = Array.isArray(r.calendrier) && r.calendrier.length
      ? '<h4>Le calendrier à rebours</h4><ul class="calendrier">'
        + r.calendrier.map((l) => '<li><span class="moment">' + e(l.moment) + '</span><span>' + e(l.titre) + '</span></li>').join('')
        + '</ul>'
      : '';

    return '<div class="recette">'
      + '<div class="recette-entete">'
      + '<h3>' + e(r.titre ?? 'La recette') + '</h3>'
      + (r.sousTitre ? '<p class="recette-sous-titre">' + e(r.sousTitre) + '</p>' : '')
      + '</div>'
      + (r.identification ? '<div class="encart"><p><b>Ce que la photo montre.</b> ' + e(r.identification) + '</p></div>' : '')
      + (r.alerte ? '<div class="encart alerte"><p><b>Un mot franc.</b> ' + e(r.alerte) + '</p></div>' : '')
      + (vitrines.length ? '<div class="vitrine-temperatures">' + vitrines.join('') + '</div>' : '')
      + (r.besoins ? '<h4>Ce qu’il vous faut</h4>' + par(r.besoins) : '')
      + (listeEtapes ? '<h4>Les étapes</h4><ol class="etapes">' + listeEtapes + '</ol>' : '')
      + (r.sauce ? '<h4>La sauce, jamais perdue</h4>' + par(r.sauce) : '')
      + (r.conservation ? '<h4>Conservation et réchauffage</h4>' + par(r.conservation) : '')
      + (r.accompagnement ? '<h4>Pour l’accompagner</h4>' + par(r.accompagnement) : '')
      + calendrier
      + '</div>';
  },
};
