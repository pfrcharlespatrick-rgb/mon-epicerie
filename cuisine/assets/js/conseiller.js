/**
 * Le conseiller à l'œil : photographiez la pièce (ou son étiquette), et le
 * conseiller — Claude, appelé directement depuis le navigateur avec votre
 * propre clé — l'identifie, lit l'étiquette, et compose la recette selon la
 * charte de la maison. La clé et les photos ne passent par aucun serveur à
 * nous : le navigateur parle directement à api.anthropic.com.
 *
 * Le pont vers Mon Épicerie : les deux pages vivent sur le même domaine, donc
 * le même localStorage. On lit la liste de la semaine pour dire au conseiller
 * ce qui attend déjà dans le panier, et on peut y verser les ingrédients
 * manquants d'une recette.
 */

'use strict';

const Conseiller = (() => {

  const CLE_API = 'ma-cuisine.cle-api';
  const CLE_EPICERIE = 'mon-epicerie/v1';
  const MODELE = 'claude-opus-5';

  /* ---------- La clé ---------- */

  function cle() {
    try { return localStorage.getItem(CLE_API) || ''; } catch { return ''; }
  }

  function definirCle(valeur) {
    try {
      if (valeur) localStorage.setItem(CLE_API, valeur.trim());
      else localStorage.removeItem(CLE_API);
    } catch { /* stockage indisponible */ }
  }

  /* ---------- La photo ---------- */

  /**
   * Réduit la photo à une taille raisonnable pour l'analyse (l'étiquette
   * reste lisible bien en deçà de la pleine résolution d'un téléphone).
   * Retourne { data (base64 sans en-tête), media_type }.
   */
  function preparerPhoto(fichier) {
    return new Promise((resoudre, rejeter) => {
      const image = new Image();
      const url = URL.createObjectURL(fichier);
      image.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 1400;
        const echelle = Math.min(1, MAX / Math.max(image.width, image.height));
        const canevas = document.createElement('canvas');
        canevas.width = Math.round(image.width * echelle);
        canevas.height = Math.round(image.height * echelle);
        canevas.getContext('2d').drawImage(image, 0, 0, canevas.width, canevas.height);
        const donneesUrl = canevas.toDataURL('image/jpeg', 0.85);
        resoudre({ data: donneesUrl.split(',')[1], media_type: 'image/jpeg', apercu: donneesUrl });
      };
      image.onerror = () => { URL.revokeObjectURL(url); rejeter(new Error('Cette image ne peut pas être lue.')); };
      image.src = url;
    });
  }

  /* ---------- Le pont vers Mon Épicerie ---------- */

  function etatEpicerie() {
    try { return JSON.parse(localStorage.getItem(CLE_EPICERIE) ?? 'null'); } catch { return null; }
  }

  /** Les articles retenus pour la semaine (quantité, magasin ou coche). */
  function listeDeLaSemaine() {
    const donnees = etatEpicerie();
    if (!donnees || !Array.isArray(donnees.articles)) return [];
    return donnees.articles
      .filter((a) => a && (a.qte || a.magasin || a.coche))
      .map((a) => ({ nom: a.nom, qte: a.qte || '' }));
  }

  /**
   * Verse des ingrédients dans la liste d'épicerie, dans le format que
   * l'application d'à côté assainit elle-même au chargement. Les doublons
   * (même nom, insensible aux accents) sont ignorés.
   */
  function verserALEpicerie(items) {
    const donnees = etatEpicerie() ?? { version: 2, articles: [], supprimes: [], rayonsPerso: [], magasinsPerso: [] };
    if (!Array.isArray(donnees.articles)) donnees.articles = [];

    const normaliser = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const connus = new Set(donnees.articles.map((a) => normaliser(a?.nom ?? '')));

    let ajoutes = 0;
    for (const item of items) {
      const nom = String(item?.nom ?? '').trim().slice(0, 120);
      if (!nom || connus.has(normaliser(nom))) continue;
      donnees.articles.unshift({
        id: 'perso-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        nom,
        qte: String(item?.qte ?? '').trim().slice(0, 120),
        magasin: '',
        rayon: 'misc',
        coche: false,
        catalogue: false,
      });
      connus.add(normaliser(nom));
      ajoutes++;
    }

    if (ajoutes) {
      try { localStorage.setItem(CLE_EPICERIE, JSON.stringify(donnees)); } catch { return 0; }
    }
    return ajoutes;
  }

  /* ---------- La charte, telle que le conseiller doit la servir ---------- */

  const CHARTE = [
    'Tu es le conseiller culinaire de la maison : tu écris exclusivement en français, dans une prose littéraire et soignée,',
    'avec le vocabulaire culinaire du Québec, le système métrique et les degrés Celsius.',
    '',
    'On te soumet la photo d’une pièce de viande, de poisson, de fruits de mer ou de légumes — souvent avec son étiquette.',
    'Commence par lire la photo avec rigueur : la pièce exacte, le poids inscrit, la date « meilleur avant », l’état apparent.',
    'Si la date est dépassée ou la pièce suspecte, dis-le franchement et sans détour ; sur la volaille et le poisson, ne transige jamais.',
    '',
    'Tes règles, toujours : tu raisonnes par température à cœur, jamais par la seule horloge — chiffre exact au retrait du feu',
    'et après repos, fenêtre de temps donnée en ordre de grandeur seulement. Tu prescris le salage à sec la veille quand la pièce',
    's’y prête, en expliquant pourquoi, avec la dose en grammes selon le poids. Tu prévois toujours un repos après cuisson.',
    'Tu ne jettes jamais un suc, un fond ou un liquide de cuisson sans dire comment le tourner en sauce. Tu signales les étapes',
    'où l’on peut tout gâcher, avec les signes de réussite au toucher, à l’œil et à l’odeur. Tu signales quand une méthode',
    'populaire est inférieure à une autre, en donnant le compromis, sans faire la leçon. Tu tiens compte de l’équipement possédé',
    'et de la liste d’épicerie fournie : substitutions d’abord, plutôt que de renvoyer au magasin.',
    '',
    'PREMIÈRE RÉPONSE : réponds UNIQUEMENT par un objet JSON (aucun texte autour, aucune clôture de code) de cette forme :',
    '{',
    '  "identification": "ce que la photo montre : la pièce, le poids lu, la date lue, l’état",',
    '  "titre": "nom du plat proposé",',
    '  "sousTitre": "une ligne qui donne le ton",',
    '  "alerte": null ou "avertissement franc de salubrité ou de fraîcheur",',
    '  "retrait": null ou nombre — température à cœur en °C au retrait du feu,',
    '  "cible": null ou "chaîne — température (ou critère) à l’assiette",',
    '  "cibleNote": "à quoi se reconnaît la cuisson réussie",',
    '  "dureeJour": "temps total le jour même, p. ex. 2 h 30",',
    '  "besoins": "paragraphe : ce qu’il faut, substitutions comprises",',
    '  "etapes": [ { "quand": "avant"|"veille"|"jour", "titre": "titre court", "duree": "45 min", "critique": false, "texte": "prose de l’étape" } ],',
    '  "sauce": "paragraphe : la sauce tirée des sucs",',
    '  "conservation": "paragraphe : conservation et réchauffage",',
    '  "accompagnement": "paragraphe",',
    '  "calendrier": null ou [ { "moment": "16 h 30 ou La veille", "titre": "le geste" } ] — seulement si une heure de service est fournie, en remontant depuis elle,',
    '  "epicerie": [ { "nom": "ingrédient probablement manquant", "qte": "2" } ] — court, seulement le vraisemblablement absent d’une cuisine ordinaire et de la liste fournie',
    '}',
    'Toutes les valeurs textuelles sont en prose française sans balises HTML. Entre 5 et 9 étapes, chacune avec sa durée.',
    '',
    'RÉPONSES SUIVANTES : la conversation continue sur la même photo ; réponds alors en prose seulement, sans JSON,',
    'en deux ou trois paragraphes au plus, fidèle aux mêmes règles.',
  ].join('\n');

  /* ---------- L'appel ---------- */

  /**
   * Envoie la conversation au modèle, en flux, et retourne le texte complet.
   * `surProgres(nbCaracteres)` permet d'animer l'attente.
   */
  async function consulter(messages, surProgres) {
    const reponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cle(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 12000,
        stream: true,
        system: [{ type: 'text', text: CHARTE, cache_control: { type: 'ephemeral' } }],
        messages,
      }),
    });

    if (!reponse.ok) {
      let detail = '';
      try { detail = (await reponse.json())?.error?.message ?? ''; } catch { /* corps illisible */ }
      if (reponse.status === 401) throw new Error('La clé est refusée. Vérifiez-la dans « Connexion au conseiller ».');
      if (reponse.status === 429) throw new Error('Le conseiller est très demandé — patientez une minute et recommencez.');
      if (reponse.status === 529) throw new Error('Le service est surchargé pour le moment. Réessayez dans quelques instants.');
      throw new Error(detail || ('Le service a répondu ' + reponse.status + '.'));
    }

    const lecteur = reponse.body.getReader();
    const decodeur = new TextDecoder();
    let tampon = '';
    let texte = '';
    let arret = null;

    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      tampon += decodeur.decode(value, { stream: true });

      const lignes = tampon.split('\n');
      tampon = lignes.pop();
      for (const ligne of lignes) {
        if (!ligne.startsWith('data: ')) continue;
        let evenement;
        try { evenement = JSON.parse(ligne.slice(6)); } catch { continue; }
        if (evenement.type === 'content_block_delta' && evenement.delta?.type === 'text_delta') {
          texte += evenement.delta.text;
          if (surProgres) surProgres(texte.length);
        } else if (evenement.type === 'message_delta' && evenement.delta?.stop_reason) {
          arret = evenement.delta.stop_reason;
        } else if (evenement.type === 'error') {
          throw new Error(evenement.error?.message ?? 'Le flux s’est interrompu.');
        }
      }
    }

    if (arret === 'refusal') {
      throw new Error('Le conseiller a préféré ne pas répondre à cette demande. Reformulez, ou choisissez une autre photo.');
    }
    if (arret === 'max_tokens') {
      throw new Error('La réponse a débordé la place prévue — reformulez plus simplement.');
    }
    return texte;
  }

  /** Le premier tour : la photo, la demande, et tout le contexte de la maison. */
  function premierTour(photo, demande, contexte) {
    const morceaux = [];
    morceaux.push('Voici la pièce photographiée. Ma demande : ' + (demande || 'compose la recette qui lui rend justice.'));
    if (contexte.service) {
      morceaux.push('Heure du service visée : ' + contexte.service + '. Donne le calendrier à rebours avec les heures réelles.');
    }
    if (contexte.equipement.length) {
      morceaux.push('Dans ma cuisine, je possède : ' + contexte.equipement.join(', ') + '. Je n’ai rien d’autre de spécialisé.');
    }
    if (contexte.epicerie.length) {
      morceaux.push('Sur ma liste d’épicerie cette semaine : '
        + contexte.epicerie.map((a) => a.nom + (a.qte ? ' (' + a.qte + ')' : '')).join(', ') + '.');
    }
    morceaux.push('Date d’aujourd’hui : ' + new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date()) + '.');

    return {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: photo.media_type, data: photo.data } },
        { type: 'text', text: morceaux.join('\n') },
      ],
    };
  }

  /** Extrait l'objet JSON d'une réponse, même enrobée d'une phrase ou d'une clôture. */
  function extraireJSON(texte) {
    const debut = texte.indexOf('{');
    const fin = texte.lastIndexOf('}');
    if (debut === -1 || fin <= debut) return null;
    try { return JSON.parse(texte.slice(debut, fin + 1)); } catch { return null; }
  }

  return { cle, definirCle, preparerPhoto, listeDeLaSemaine, verserALEpicerie, consulter, premierTour, extraireJSON };

})();
