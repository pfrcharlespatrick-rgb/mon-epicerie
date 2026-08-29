/**
 * Un `localStorage` de fortune pour les tests.
 *
 * Les deux applications ne connaissent du monde extérieur que cette interface :
 * la remplacer suffit à faire tourner `etat.js` et `conseiller.js` hors du
 * navigateur, sans dépendance ni simulateur de DOM.
 */

/** Installe un stockage vierge sur `globalThis` et retourne de quoi le piloter. */
export function installerStockage() {
  const contenu = new Map();

  const stockage = {
    getItem: (cle) => (contenu.has(cle) ? contenu.get(cle) : null),
    setItem: (cle, valeur) => { contenu.set(cle, String(valeur)); },
    removeItem: (cle) => { contenu.delete(cle); },
    clear: () => { contenu.clear(); },
    key: (i) => [...contenu.keys()][i] ?? null,
    get length() { return contenu.size; },
  };

  globalThis.localStorage = stockage;

  return {
    stockage,
    /** Vide tout : à appeler avant chaque test. */
    vider: () => contenu.clear(),
    /** Dépose un objet JSON sous une clé. */
    poser: (cle, valeur) => contenu.set(cle, JSON.stringify(valeur)),
    /** Relit un objet JSON sous une clé. */
    prendre: (cle) => JSON.parse(contenu.get(cle) ?? 'null'),
    /** Dépose une chaîne telle quelle (pour tester le JSON invalide). */
    poserBrut: (cle, texte) => contenu.set(cle, texte),
  };
}

/**
 * Rend le stockage indisponible, comme en navigation privée ou quota dépassé :
 * chaque écriture lève. Les applications doivent rester utilisables.
 */
export function rendreStockageIndisponible() {
  globalThis.localStorage = {
    getItem() { throw new Error('stockage indisponible'); },
    setItem() { throw new Error('quota dépassé'); },
    removeItem() { throw new Error('stockage indisponible'); },
  };
}
