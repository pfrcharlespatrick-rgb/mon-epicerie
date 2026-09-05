/**
 * L'analyse à l'œil : photographiez une armoire, un garde-manger, un
 * congélateur, et Claude — appelé directement depuis le navigateur avec votre
 * propre clé — dresse la liste de ce qu'il y voit, avec les quantités.
 *
 * Rien ne passe par un serveur à nous : la clé et les photos vont du
 * téléphone à api.anthropic.com, et nulle part ailleurs. Les propositions
 * reviennent à l'écran ; c'est l'utilisateur qui décide de les appliquer.
 *
 * Le principe qui gouverne tout le reste : ce qui est compté et ce qui est
 * estimé ne doivent jamais se confondre. Le modèle doit dire lequel des deux
 * il fait, et l'application le retient.
 */

'use strict';

const Analyseur = (() => {

  const CLE_API = 'lac-pere.cle-api';
  const MODELE = 'claude-opus-5';
  const MAX_PHOTOS = 6;

  // 1100 px de côté : au-delà, le service réduit l'image de toute façon, et
  // les étiquettes d'une tablette restent parfaitement lisibles en deçà.
  const COTE_ANALYSE = 1100;
  const QUALITE = 0.72;

  // Au-delà de cette taille, les navigateurs de téléphone abandonnent l'envoi
  // plutôt que d'échouer proprement : mieux vaut le dire avant de partir.
  const POIDS_MAX = 4.5 * 1024 * 1024;

  /* ---------- La clé ---------- */

  function cle() {
    try { return localStorage.getItem(CLE_API) || ''; } catch { return ''; }
  }

  function definirCle(valeur) {
    try {
      const propre = String(valeur || '').trim();
      if (propre) localStorage.setItem(CLE_API, propre);
      else localStorage.removeItem(CLE_API);
    } catch { /* stockage indisponible */ }
  }

  /* ---------- Les photos ---------- */

  /**
   * Réduit la photo à une taille raisonnable : les étiquettes restent
   * lisibles bien en deçà de la pleine résolution d'un téléphone, et une
   * photo légère part vite même sur le réseau du domaine.
   */
  /** Redessine l'image à la taille voulue et rend son data-URL JPEG. */
  function redimensionner(image, cote, qualite) {
    const echelle = Math.min(1, cote / Math.max(image.width, image.height));
    const canevas = document.createElement('canvas');
    canevas.width = Math.max(1, Math.round(image.width * echelle));
    canevas.height = Math.max(1, Math.round(image.height * echelle));
    canevas.getContext('2d').drawImage(image, 0, 0, canevas.width, canevas.height);
    const donnees = canevas.toDataURL('image/jpeg', qualite);
    // Un canevas de téléphone occupe plusieurs mégaoctets tant qu'il garde ses
    // dimensions. Le ramener à 1×1 rend la mémoire tout de suite, au lieu
    // d'attendre le ramasse-miettes — six photos plus loin, c'est ce qui
    // décide si la page tient debout.
    canevas.width = 1;
    canevas.height = 1;
    return donnees;
  }

  function preparerPhoto(fichier) {
    return new Promise((resoudre, rejeter) => {
      const image = new Image();
      const url = URL.createObjectURL(fichier);
      image.onload = () => {
        URL.revokeObjectURL(url);
        // Deux tailles, et non une seule : la vignette d'écran ne pèse rien,
        // et surtout la grande image n'a pas à rester en mémoire une fois
        // encodée. Six photos de téléphone gardées en pleine taille suffisent
        // à faire abandonner la requête au navigateur, sans autre explication
        // qu'un « Load failed ».
        const grande = redimensionner(image, COTE_ANALYSE, QUALITE);
        const vignette = redimensionner(image, 240, 0.7);
        resoudre({ data: grande.split(',')[1], media_type: 'image/jpeg', apercu: vignette });
      };
      image.onerror = () => { URL.revokeObjectURL(url); rejeter(new Error('Cette image ne peut pas être lue.')); };
      image.src = url;
    });
  }

  /** Le poids réel de ce qu'on s'apprête à envoyer, en octets. */
  const poidsDesPhotos = (photos) => photos.reduce((total, p) => total + Math.ceil(p.data.length * 3 / 4), 0);

  const lisible = (octets) => (octets / (1024 * 1024)).toFixed(1).replace('.', ',') + ' Mo';

  /* ---------- Ce qu'on apprend au modèle ---------- */

  /** Le catalogue de l'emplacement visé, tel que le modèle doit le retrouver. */
  function catalogueDeLaZone(zoneId) {
    return Etat.actifs()
      .filter((a) => a.zone === zoneId)
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .map((a) => `${a.id} | ${a.nom}${a.format ? ' (' + a.format + ')' : ''} | se compte en ${a.unite}`);
  }

  const CONSIGNES = [
    'Tu inventories le stock d’un domaine de pêche isolé, à partir de photos d’armoires, de garde-mangers,',
    'de congélateurs, de hangars. Tu écris en français du Québec. Ton travail sert à savoir ce qu’il reste',
    'au moment de la fermeture : une erreur de comptage coûte un voyage d’avion l’an prochain.',
    '',
    'La règle qui prime sur toutes les autres : ne jamais faire passer une estimation pour un décompte.',
    'Tu comptes ce que tu vois distinctement ; tu estimes le reste en le disant. Une pile dont on ne voit',
    'que la façade, une caisse entamée, une tablette dans l’ombre : ce sont des estimations, et tu expliques',
    'en une courte phrase sur quoi tu te fondes.',
    '',
    'Tu n’inventes rien. Un article dont rien n’apparaît sur les photos ne figure pas dans ta réponse —',
    'l’absence d’un article n’est pas une quantité nulle, sauf si l’on voit clairement sa place vide et que',
    'tu peux le dire. Tu ne t’occupes pas des dates de péremption.',
    '',
    'On te fournit le catalogue de l’emplacement photographié : identifiant, nom, format, unité de compte.',
    'Quand ce que tu vois correspond à une entrée, reprends son identifiant EXACT et son unité. Quand tu vois',
    'quelque chose qui n’y figure pas, mets "id": null, donne-lui un nom clair et choisis son rayon dans la',
    'liste fournie. Compte toujours dans l’unité du catalogue : si l’article se compte en « caisse » et que',
    'tu vois douze canettes libres, dis-le dans la note plutôt que de changer d’unité.',
    '',
    'Plusieurs photos peuvent montrer le MÊME rayonnage sous des angles différents : réunis-les en un seul',
    'décompte, ne compte pas deux fois la même boîte. C’est le cas le plus fréquent, et le piège principal.',
    '',
    'Réponds UNIQUEMENT par un objet JSON, sans texte autour ni clôture de code, de cette forme :',
    '{',
    '  "observations": "deux ou trois phrases : ce que montrent les photos, ce qui reste incertain",',
    '  "articles": [',
    '    {',
    '      "id": "identifiant du catalogue, ou null si l’article n’y figure pas",',
    '      "nom": "nom de l’article",',
    '      "quantite": nombre entier ou décimal,',
    '      "unite": "l’unité de compte",',
    '      "format": "le format du contenant, si lisible",',
    '      "rayon": "identifiant de rayon — obligatoire seulement quand id est null",',
    '      "certitude": "compté" ou "estimé",',
    '      "note": "une phrase : ce que tu vois, et sur quoi repose une estimation"',
    '    }',
    '  ]',
    '}',
    'Classe les articles du plus certain au plus incertain. Sois exhaustif sur ce qui est visible.',
  ].join('\n');

  /* ---------- L'appel ---------- */

  /**
   * Envoie une requête au service et rend la réponse — ou lève une erreur
   * dite en français.
   *
   * `fetch` distingue mal deux échecs très différents : le service qui refuse
   * (on a un code et un message) et la requête qui n'est jamais partie (un
   * `TypeError` nu, que Safari nomme « Load failed »). Le second cas est le
   * plus déroutant pour qui n'y peut rien : on le nomme, et on dit quoi faire.
   */
  async function appeler(corps, poids) {
    let reponse;
    try {
      reponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cle(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(corps),
      });
    } catch (erreur) {
      const taille = poids ? ` L’envoi pesait ${lisible(poids)}.` : '';
      throw new Error(
        'La demande n’a pas pu partir — le téléphone a abandonné avant d’atteindre Claude.' + taille
        + ' Vérifiez le réseau, puis réessayez avec moins de photos.'
        + ' Le bouton « 🔌 Tester la connexion » dira si la clé et le réseau sont en cause.'
        + ' (Détail technique : ' + (erreur?.message || 'échec réseau') + ')',
      );
    }

    if (!reponse.ok) {
      let detail = '';
      try { detail = (await reponse.json())?.error?.message ?? ''; } catch { /* corps illisible */ }
      if (reponse.status === 401) throw new Error('La clé est refusée. Vérifiez-la dans « 🔑 Ma clé Claude ».');
      if (reponse.status === 400 && /credit|balance/i.test(detail)) {
        throw new Error('Le compte Anthropic n’a plus de crédit. Rechargez-le dans la console.');
      }
      if (reponse.status === 413) throw new Error('L’envoi est trop volumineux : retirez des photos et réessayez.');
      if (reponse.status === 429) throw new Error('Trop de demandes d’un coup — patientez une minute et recommencez.');
      if (reponse.status === 529) throw new Error('Le service est surchargé. Réessayez dans quelques instants.');
      throw new Error(detail || ('Le service a répondu ' + reponse.status + '.'));
    }

    return reponse;
  }

  /**
   * Un aller-retour minuscule, sans photo : il coûte une fraction de cent et
   * répond à la seule question qui compte quand rien ne marche — est-ce la
   * clé et le réseau, ou bien les photos ?
   */
  async function tester() {
    if (!cle()) throw new Error('Il manque la clé : touchez « 🔑 Ma clé Claude » pour l’ajouter.');
    const reponse = await appeler({
      model: MODELE,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Réponds exactement : prêt.' }],
    });
    await reponse.json();
    return true;
  }


  /**
   * Envoie les photos au modèle, en flux, et retourne les propositions.
   * `surProgres(nbCaracteres)` sert à animer l'attente.
   */
  async function analyser({ photos, zoneId, precisions }, surProgres) {
    if (!cle()) throw new Error('Il manque la clé : touchez « 🔑 Ma clé Claude » pour l’ajouter.');
    if (!photos.length) throw new Error('Ajoutez au moins une photo.');

    const poids = poidsDesPhotos(photos);
    if (poids > POIDS_MAX) {
      throw new Error(`Ces photos pèsent ${lisible(poids)} — c’est trop pour un seul envoi. `
        + 'Retirez-en deux ou trois et analysez en plusieurs fois.');
    }

    const zone = Etat.zone(zoneId);
    const catalogue = catalogueDeLaZone(zoneId);

    const systeme = [
      CONSIGNES,
      '',
      'CATALOGUE DE L’EMPLACEMENT « ' + zone.nom + ' » (identifiant | nom (format) | unité) :',
      catalogue.length ? catalogue.join('\n') : '(aucun article encore rattaché à cet emplacement)',
      '',
      'RAYONS DISPONIBLES (pour les articles hors catalogue) :',
      RAYONS.map((r) => r.id + ' = ' + r.nom).join('\n'),
    ].join('\n');

    const contenu = photos.map((photo) => ({
      type: 'image',
      source: { type: 'base64', media_type: photo.media_type, data: photo.data },
    }));

    const demande = [
      `Voici ${photos.length > 1 ? photos.length + ' photos' : 'une photo'} de « ${zone.nom} »`
        + (zone.note ? ' (' + zone.note + ')' : '') + '.',
      photos.length > 1
        ? 'Elles peuvent montrer les mêmes tablettes sous des angles différents — réunis-les en un seul décompte.'
        : '',
      precisions ? 'Précisions de la personne qui a pris la photo : ' + precisions : '',
      'Dresse l’inventaire de ce que tu y vois.',
    ].filter(Boolean).join('\n');

    contenu.push({ type: 'text', text: demande });

    const reponse = await appeler({
      model: MODELE,
      max_tokens: 16000,
      stream: true,
      // Le catalogue ne bouge pas d'une photo à l'autre : on le met en cache
      // pour que la deuxième armoire coûte moins cher que la première.
      system: [{ type: 'text', text: systeme, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: contenu }],
    }, poids);

    const texte = await lireLeFlux(reponse, surProgres);
    const objet = extraireJSON(texte);
    if (!objet || !Array.isArray(objet.articles)) {
      throw new Error('La réponse est arrivée dans une forme inattendue. Réessayez, ou changez de photo.');
    }
    return normaliser(objet, zoneId);
  }

  /** Déroule le flux d'événements et rend le texte complet. */
  async function lireLeFlux(reponse, surProgres) {
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

    if (arret === 'refusal') throw new Error('Le modèle a préféré ne pas répondre à cette photo.');
    if (arret === 'max_tokens') throw new Error('L’armoire est trop chargée pour une seule réponse — photographiez-la en deux fois.');
    return texte;
  }

  /** Extrait l'objet JSON, même enrobé d'une phrase ou d'une clôture de code. */
  function extraireJSON(texte) {
    const debut = texte.indexOf('{');
    const fin = texte.lastIndexOf('}');
    if (debut === -1 || fin <= debut) return null;
    try { return JSON.parse(texte.slice(debut, fin + 1)); } catch { return null; }
  }

  /**
   * Ramène la réponse du modèle à ce que l'application sait appliquer :
   * identifiants vérifiés, quantités numériques, rayons connus. Ce qui ne
   * tient pas debout est écarté plutôt que d'entrer dans l'inventaire.
   */
  function normaliser(objet, zoneId) {
    const rayonsConnus = new Set(RAYONS.map((r) => r.id));
    const propositions = [];

    for (const brut of objet.articles) {
      const quantite = Number(brut?.quantite);
      if (!Number.isFinite(quantite) || quantite < 0) continue;

      const nom = String(brut?.nom ?? '').trim().slice(0, 120);
      if (!nom) continue;

      const existant = brut?.id ? Etat.article(String(brut.id)) : null;
      const rayon = existant?.rayon
        ?? (rayonsConnus.has(String(brut?.rayon)) ? String(brut.rayon) : RAYONS[0].id);

      propositions.push({
        id: existant?.id ?? null,
        nom: existant?.nom ?? nom,
        quantite: Math.round(quantite * 100) / 100,
        unite: existant?.unite ?? String(brut?.unite ?? 'unité').trim().slice(0, 30),
        format: existant?.format ?? String(brut?.format ?? '').trim().slice(0, 60),
        rayon,
        zone: zoneId,
        // Le doute est la position par défaut : seul un « compté » explicite
        // vaut décompte, tout le reste est marqué comme estimé.
        estime: String(brut?.certitude ?? '').toLowerCase().trim() !== 'compté',
        note: String(brut?.note ?? '').trim().slice(0, 200),
        ancienne: existant && existant.quantite !== null ? existant.quantite : null,
      });
    }

    return {
      observations: String(objet.observations ?? '').trim().slice(0, 600),
      propositions,
    };
  }

  return { cle, definirCle, preparerPhoto, analyser, tester, poidsDesPhotos, lisible, MAX_PHOTOS };
})();
