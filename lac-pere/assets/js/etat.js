/**
 * L'état de l'inventaire : ce qui est compté, par qui, quand — et les
 * inventaires de fermeture archivés.
 *
 * Tout vit dans le navigateur (localStorage). Rien ne part vers un serveur.
 * Le partage entre employés se fait par fichier de sauvegarde `.json`, que
 * l'application sait fusionner sans écraser le travail de l'autre : à
 * article égal, la saisie la plus récente l'emporte.
 */

'use strict';

const Etat = (() => {

  const CLE = 'lac-pere.inventaire';
  const VERSION_DONNEES = 1;

  /** Les champs décrivant l'article, par opposition à son décompte. */
  const CHAMPS_DESCRIPTIFS = ['nom', 'rayon', 'zone', 'unite', 'format', 'seuil'];

  let donnees = null;

  /* ---------- Lecture et écriture du stockage ---------- */

  function vierge() {
    return {
      version: VERSION_DONNEES,
      saison: String(new Date().getFullYear()),
      responsable: '',
      // L'inventaire commence vide : il ne contient que ce que l'on y met.
      // Le stock suggéré du catalogue s'importe à la demande, pas d'office —
      // une liste de deux cents articles qu'on n'a pas est un brouillard, pas
      // un inventaire.
      articles: [],
      archives: [],
      // Copiés des listes livrées au premier chargement, puis à l'utilisateur :
      // il peut les renommer, en ajouter, en retirer.
      rayons: RAYONS_LIVRES.map((r) => ({ ...r })),
      zones: ZONES_LIVREES.map((z) => ({ ...z })),
      reglages: { groupement: 'rayon' },
    };
  }

  function lireStockage() {
    try {
      const brut = localStorage.getItem(CLE);
      if (!brut) return null;
      const objet = JSON.parse(brut);
      return objet && typeof objet === 'object' ? objet : null;
    } catch {
      return null;
    }
  }

  function sauver() {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch {
      /* Navigation privée ou stockage plein : l'écran reste juste, la
         sauvegarde `.json` demeure le filet de sécurité. */
    }
  }

  /**
   * Verse le stock suggéré dans l'inventaire — sur demande expresse, jamais
   * de lui-même. Les articles déjà présents ne sont pas touchés, et les
   * rayons ou emplacements qu'ils réclament sont rétablis s'ils manquent.
   *
   * Retourne le nombre d'articles réellement ajoutés.
   */
  function importerStockSuggere() {
    const connus = new Map(donnees.articles.map((a) => [a.id, a]));
    let ajoutes = 0;
    let retablis = 0;

    for (const modele of ARTICLES_SUGGERES) {
      const existant = connus.get(modele.id);

      // Un article retiré porte une pierre tombale plutôt que de disparaître,
      // pour que la fusion d'un fichier ne le ressuscite pas dans le dos de
      // celui qui l'a écarté. Mais redemander le stock suggéré, c'est
      // justement demander qu'il revienne : on lève la pierre, en gardant ce
      // qui avait été compté.
      if (existant) {
        if (existant.retire) {
          delete existant.retire;
          retablirClassement('rayons', RAYONS_LIVRES, existant.rayon);
          retablirClassement('zones', ZONES_LIVREES, existant.zone);
          retablis++;
        }
        continue;
      }

      // Un rayon ou un emplacement supprimé par l'utilisateur réapparaît si
      // un article importé s'y rattache : mieux vaut le rétablir que de
      // ranger l'article n'importe où.
      retablirClassement('rayons', RAYONS_LIVRES, modele.rayon);
      retablirClassement('zones', ZONES_LIVREES, modele.zone);

      donnees.articles.push({
        ...modele,
        quantite: null,
        estime: false,
        note: '',
        maj: null,
        par: '',
        origine: 'catalogue',
        perso: false,
      });
      ajoutes++;
    }

    if (ajoutes || retablis) sauver();
    return { ajoutes, retablis };
  }

  /** Remet dans la liste un rayon ou un emplacement livré qui en avait disparu. */
  function retablirClassement(cle, livres, id) {
    if (donnees[cle].some((entree) => entree.id === id)) return;
    const modele = livres.find((entree) => entree.id === id);
    if (modele) donnees[cle].push({ ...modele });
  }

  function charger() {
    donnees = lireStockage() ?? vierge();
    donnees.version = VERSION_DONNEES;
    donnees.articles ??= [];
    donnees.archives ??= [];
    donnees.reglages ??= { groupement: 'rayon' };
    // Les inventaires d'avant cette version n'ont pas de listes propres :
    // on les leur donne, à partir des listes livrées.
    if (!Array.isArray(donnees.rayons) || !donnees.rayons.length) {
      donnees.rayons = RAYONS_LIVRES.map((r) => ({ ...r }));
    }
    if (!Array.isArray(donnees.zones) || !donnees.zones.length) {
      donnees.zones = ZONES_LIVREES.map((z) => ({ ...z }));
    }
    sauver();
    return donnees;
  }

  /* ---------- Accès ---------- */

  const tout = () => donnees.articles;
  const article = (id) => donnees.articles.find((a) => a.id === id) ?? null;
  const reglages = () => donnees.reglages;
  const archives = () => donnees.archives;
  const saison = () => donnees.saison;
  const responsable = () => donnees.responsable;

  function definirSaison(valeur) {
    donnees.saison = String(valeur || '').trim();
    sauver();
  }

  function definirResponsable(nom) {
    donnees.responsable = String(nom || '').trim();
    sauver();
  }

  function definirReglage(cle, valeur) {
    donnees.reglages[cle] = valeur;
    sauver();
  }

  /* ---------- Modification des articles ---------- */

  /** Horodate la saisie et signe du nom du responsable. */
  function signer(cible) {
    cible.maj = new Date().toISOString();
    cible.par = donnees.responsable || '';
  }

  function majQuantite(id, quantite, options = {}) {
    const cible = article(id);
    if (!cible) return null;
    cible.quantite = quantite === null || quantite === '' ? null : Math.max(0, Number(quantite) || 0);
    if ('estime' in options) cible.estime = Boolean(options.estime);
    signer(cible);
    sauver();
    return cible;
  }

  /** Ajoute (ou retire) une unité — le geste du comptage rapide. */
  function ajusterQuantite(id, pas) {
    const cible = article(id);
    if (!cible) return null;
    const depart = cible.quantite ?? 0;
    return majQuantite(id, Math.max(0, depart + pas), { estime: false });
  }

  function majArticle(id, champs) {
    const cible = article(id);
    if (!cible) return null;
    for (const [cle, valeur] of Object.entries(champs)) cible[cle] = valeur;
    if (CHAMPS_DESCRIPTIFS.some((champ) => champ in champs)) cible.perso = true;
    signer(cible);
    sauver();
    return cible;
  }

  /** Fabrique un identifiant lisible et unique à partir du nom. */
  function identifiant(nom) {
    const base = 'perso-' + nom
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    let id = base || 'perso-article';
    let n = 2;
    while (article(id)) id = `${base}-${n++}`;
    return id;
  }

  function ajouterArticle(champs) {
    const nouvel = {
      id: identifiant(champs.nom || 'article'),
      nom: champs.nom || 'Sans nom',
      rayon: champs.rayon || donnees.rayons[0].id,
      zone: champs.zone || donnees.zones[0].id,
      unite: champs.unite || 'unité',
      format: champs.format || '',
      seuil: Number(champs.seuil) || 0,
      quantite: champs.quantite === undefined || champs.quantite === '' ? null : Number(champs.quantite),
      estime: Boolean(champs.estime),
      note: champs.note || '',
      origine: 'ajout',
      perso: true,
    };
    signer(nouvel);
    donnees.articles.push(nouvel);
    sauver();
    return nouvel;
  }

  /**
   * Retire un article. Un article du catalogue livré ne disparaît pas
   * vraiment — il reviendrait au prochain chargement : on le marque `retire`,
   * ce qui le sort des listes sans perdre son histoire.
   */
  function supprimerArticle(id) {
    const cible = article(id);
    if (!cible) return;
    if (cible.origine === 'ajout') {
      donnees.articles = donnees.articles.filter((a) => a.id !== id);
    } else {
      cible.retire = true;
      signer(cible);
    }
    sauver();
  }

  function retablirArticle(id) {
    const cible = article(id);
    if (!cible) return;
    delete cible.retire;
    sauver();
  }

  const actifs = () => donnees.articles.filter((a) => !a.retire);

  /* ---------- Chiffres du tableau de bord ---------- */

  function statistiques() {
    const liste = actifs();
    const comptes = liste.filter((a) => a.quantite !== null);
    const aCommander = comptes.filter((a) => (a.seuil || 0) > 0 && a.quantite <= a.seuil);
    const epuises = comptes.filter((a) => a.quantite === 0);
    const estimes = comptes.filter((a) => a.estime);
    const dates = comptes.map((a) => a.maj).filter(Boolean).sort();

    return {
      total: liste.length,
      comptes: comptes.length,
      restants: liste.length - comptes.length,
      aCommander: aCommander.length,
      epuises: epuises.length,
      estimes: estimes.length,
      avancement: liste.length ? Math.round((comptes.length / liste.length) * 100) : 0,
      derniereMaj: dates.length ? dates[dates.length - 1] : null,
    };
  }

  /** L'avancement du comptage, zone par zone — la tournée d'inventaire. */
  function avancementParZone() {
    return donnees.zones.map((zone) => {
      const liste = actifs().filter((a) => a.zone === zone.id);
      const comptes = liste.filter((a) => a.quantite !== null).length;
      return { ...zone, total: liste.length, comptes };
    }).filter((z) => z.total > 0);
  }

  /* ---------- Archives de fermeture ---------- */

  /**
   * Fige l'état du stock : c'est le geste de la fermeture. L'archive est une
   * copie complète et immuable — elle ne bougera plus, quoi qu'on compte
   * ensuite.
   */
  function archiver({ titre, note }) {
    const archive = {
      id: 'arch-' + Date.now().toString(36),
      titre: titre || `Inventaire de fermeture ${donnees.saison}`,
      note: note || '',
      saison: donnees.saison,
      par: donnees.responsable || '',
      date: new Date().toISOString(),
      lignes: actifs()
        .filter((a) => a.quantite !== null)
        .map((a) => ({
          id: a.id, nom: a.nom, rayon: a.rayon, zone: a.zone,
          unite: a.unite, format: a.format, seuil: a.seuil,
          quantite: a.quantite, estime: a.estime, note: a.note, par: a.par,
        })),
    };
    donnees.archives.unshift(archive);
    sauver();
    return archive;
  }

  function supprimerArchive(id) {
    donnees.archives = donnees.archives.filter((a) => a.id !== id);
    sauver();
  }

  /** Recharge les quantités d'une archive dans l'inventaire courant. */
  function restaurerArchive(id) {
    const archive = donnees.archives.find((a) => a.id === id);
    if (!archive) return false;
    for (const ligne of archive.lignes) {
      const cible = article(ligne.id);
      if (cible) {
        cible.quantite = ligne.quantite;
        cible.estime = ligne.estime;
        cible.note = ligne.note || '';
        cible.maj = archive.date;
        cible.par = ligne.par || archive.par;
      } else {
        donnees.articles.push({ ...ligne, origine: 'ajout', perso: true, maj: archive.date });
      }
    }
    sauver();
    return true;
  }

  /**
   * Vide l'inventaire de tous ses articles — le geste de qui repart de rien.
   * Les archives sont conservées : ce sont les inventaires déjà signés, la
   * mémoire du domaine, et rien ici ne doit pouvoir l'effacer par mégarde.
   * Les rayons et emplacements restent eux aussi, avec leurs noms.
   */
  function effacerArticles() {
    const combien = donnees.articles.length;
    donnees.articles = [];
    sauver();
    return combien;
  }

  /** Remet tous les décomptes à « non compté » — le début d'une tournée. */
  function reinitialiserComptage() {
    for (const a of donnees.articles) {
      a.quantite = null;
      a.estime = false;
      a.maj = null;
      a.par = '';
    }
    sauver();
  }

  /* ---------- Sauvegarde, partage et fusion ---------- */

  function exporter() {
    return {
      application: 'lac-pere-inventaire',
      version: VERSION_DONNEES,
      exporteLe: new Date().toISOString(),
      exportePar: donnees.responsable || '',
      donnees,
    };
  }

  /**
   * Reprend un fichier reçu d'un collègue.
   *
   * En mode « fusionner », article par article, la saisie la plus récente
   * gagne : deux personnes peuvent compter chacune leur bâtiment et réunir
   * les deux fichiers sans rien perdre. En mode « remplacer », le fichier
   * reçu devient la vérité.
   */
  function importer(fichier, mode = 'fusionner') {
    const entrant = fichier?.donnees ?? fichier;
    if (!entrant || !Array.isArray(entrant.articles)) {
      throw new Error('Ce fichier ne ressemble pas à une sauvegarde de l’inventaire.');
    }

    if (mode === 'remplacer') {
      donnees = { ...vierge(), ...entrant };
      if (!Array.isArray(donnees.rayons) || !donnees.rayons.length) donnees.rayons = RAYONS_LIVRES.map((r) => ({ ...r }));
      if (!Array.isArray(donnees.zones) || !donnees.zones.length) donnees.zones = ZONES_LIVREES.map((z) => ({ ...z }));
      sauver();
      return { ajoutes: entrant.articles.length, mis: 0, archives: (entrant.archives ?? []).length };
    }

    let ajoutes = 0;
    let mis = 0;

    for (const entrantArticle of entrant.articles) {
      const cible = article(entrantArticle.id);
      if (!cible) {
        donnees.articles.push({ ...entrantArticle });
        ajoutes++;
        continue;
      }
      const dateEntrante = entrantArticle.maj ? Date.parse(entrantArticle.maj) : 0;
      const dateLocale = cible.maj ? Date.parse(cible.maj) : 0;
      if (dateEntrante > dateLocale) {
        Object.assign(cible, entrantArticle);
        mis++;
      }
    }

    // Les archives portent un identifiant unique : on ajoute celles qu'on
    // n'a pas, sans jamais toucher aux siennes.
    const connues = new Set(donnees.archives.map((a) => a.id));
    let archivesAjoutees = 0;
    for (const archive of entrant.archives ?? []) {
      if (!connues.has(archive.id)) {
        donnees.archives.push(archive);
        archivesAjoutees++;
      }
    }
    donnees.archives.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (!donnees.responsable && entrant.responsable) donnees.responsable = entrant.responsable;
    sauver();
    return { ajoutes, mis, archives: archivesAjoutees };
  }

  /* ---------- Petits services partagés ---------- */

  const rayons = () => donnees.rayons;
  const zones = () => donnees.zones;
  const rayon = (id) => donnees.rayons.find((r) => r.id === id) ?? { id, nom: 'Rayon inconnu', emoji: '📦', famille: '—' };
  const zone = (id) => donnees.zones.find((z) => z.id === id) ?? { id, nom: 'Emplacement inconnu', emoji: '📍' };

  /* ---------- Rayons et emplacements : les listes de l'utilisateur ---------- */

  /** Un identifiant propre à cette liste, dérivé du nom. */
  function identifiantClassement(cle, nom) {
    const base = 'perso-' + nom
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    let id = base === 'perso-' ? 'perso-liste' : base;
    let n = 2;
    while (donnees[cle].some((entree) => entree.id === id)) id = `${base}-${n++}`;
    return id;
  }

  function ajouterClassement(cle, { nom, emoji }) {
    const propre = String(nom || '').trim().slice(0, 60);
    if (!propre) return null;
    const entree = {
      id: identifiantClassement(cle, propre),
      nom: propre,
      emoji: String(emoji || '').trim().slice(0, 4) || (cle === 'rayons' ? '📦' : '📍'),
      famille: cle === 'rayons' ? 'Le mien' : undefined,
      perso: true,
    };
    donnees[cle].push(entree);
    sauver();
    return entree;
  }

  function majClassement(cle, id, champs) {
    const entree = donnees[cle].find((e) => e.id === id);
    if (!entree) return null;
    if (champs.nom !== undefined) {
      const propre = String(champs.nom).trim().slice(0, 60);
      if (propre) entree.nom = propre;
    }
    if (champs.emoji !== undefined) {
      entree.emoji = String(champs.emoji).trim().slice(0, 4) || entree.emoji;
    }
    sauver();
    return entree;
  }

  /**
   * Remet dans les listes les rayons et emplacements livrés qui en ont
   * disparu — le filet de qui a supprimé trop vite.
   *
   * Ce qui est encore là n'est pas touché : un rayon renommé garde son nom,
   * un rayon inventé garde sa place. Les listes retrouvent au passage l'ordre
   * d'origine, les entrées maison à la suite.
   */
  function retablirListesLivrees() {
    const bilan = { rayons: 0, zones: 0 };

    for (const [cle, livres] of [['rayons', RAYONS_LIVRES], ['zones', ZONES_LIVREES]]) {
      const presents = new Map(donnees[cle].map((e) => [e.id, e]));
      const ordonnes = [];

      for (const modele of livres) {
        if (presents.has(modele.id)) {
          ordonnes.push(presents.get(modele.id));
          presents.delete(modele.id);
        } else {
          ordonnes.push({ ...modele });
          bilan[cle]++;
        }
      }

      // Les entrées maison suivent, dans l'ordre où on les a créées.
      for (const restante of presents.values()) ordonnes.push(restante);
      donnees[cle] = ordonnes;
    }

    // Toujours enregistrer : même sans rien rétablir, l'ordre a pu changer,
    // et un ordre remis à l'écran mais jamais sauvé se défait au rechargement.
    sauver();
    return bilan;
  }

  /**
   * Retire un rayon ou un emplacement. Les articles qui s'y trouvaient sont
   * déplacés dans le premier de la liste restante — jamais perdus. Le dernier
   * de la liste ne se supprime pas : il faut bien ranger quelque part.
   */
  function supprimerClassement(cle, id) {
    if (donnees[cle].length <= 1) return { supprime: false, deplaces: 0 };

    const restants = donnees[cle].filter((e) => e.id !== id);
    if (restants.length === donnees[cle].length) return { supprime: false, deplaces: 0 };

    const champ = cle === 'rayons' ? 'rayon' : 'zone';
    const refuge = restants[0].id;
    let deplaces = 0;
    for (const article of donnees.articles) {
      if (article[champ] === id) { article[champ] = refuge; deplaces++; }
    }

    donnees[cle] = restants;
    sauver();
    return { supprime: true, deplaces, refuge: restants[0].nom };
  }

  /** État d'un article, pour la pastille de couleur et les filtres. */
  function etatArticle(a) {
    if (a.quantite === null) return 'non-compte';
    if (a.quantite === 0) return 'epuise';
    if ((a.seuil || 0) > 0 && a.quantite <= a.seuil) return 'bas';
    return 'ok';
  }

  return {
    charger, sauver, tout, actifs, article, statistiques, avancementParZone,
    rayons, zones, ajouterClassement, majClassement, supprimerClassement, retablirListesLivrees,
    importerStockSuggere, effacerArticles, nombreSuggeres: () => ARTICLES_SUGGERES.length,
    majQuantite, ajusterQuantite, majArticle, ajouterArticle, supprimerArticle, retablirArticle,
    archiver, archives, supprimerArchive, restaurerArchive, reinitialiserComptage,
    exporter, importer, reglages, definirReglage, saison, definirSaison,
    responsable, definirResponsable, rayon, zone, etatArticle,
  };
})();
