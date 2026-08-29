/**
 * Chargeur des fichiers de `cuisine/`.
 *
 * Contrairement à ceux de l'épicerie, ces fichiers ne sont pas des modules :
 * la page s'ouvre par un double-clic, chaque script pose son objet
 * (`Moteur`, `PIECES`, `Exporteur`, `Conseiller`) dans la portée globale. On
 * les rejoue donc dans un contexte `vm`, exactement comme le ferait un
 * navigateur, et on récupère les objets à la sortie.
 */

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = path.resolve(fileURLToPath(import.meta.url), '../../..');

/**
 * Évalue les fichiers demandés (chemins relatifs à la racine du dépôt) dans un
 * même contexte, et retourne les globales nommées.
 *
 * @param {string[]} fichiers  p. ex. ['cuisine/assets/js/moteur.js']
 * @param {string[]} noms      globales à extraire, p. ex. ['Moteur', 'PIECES']
 * @param {object}   extras    globales supplémentaires (document, fetch…)
 */
export function charger(fichiers, noms, extras = {}) {
  // Le bac à sable a déjà tout le standard (Date, JSON, Intl, les tableaux
  // typés…). On n'y ajoute que ce qui vient du navigateur, plus les pièces de
  // théâtre demandées par l'appelant (fetch, localStorage, document).
  const contexte = vm.createContext({
    TextEncoder, TextDecoder, Blob, URL, console,
    ...extras,
  });

  for (const fichier of fichiers) {
    const code = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
    vm.runInContext(code, contexte, { filename: fichier });
  }

  // Les `const` de premier niveau d'un script vivent dans la portée lexicale
  // globale, et non comme propriétés du contexte : on les cueille par une
  // expression évaluée dans le même contexte, comme le ferait un script de la
  // page qui lirait ses voisins.
  let sortie;
  try {
    sortie = vm.runInContext(`({ ${noms.join(', ')} })`, contexte);
  } catch (err) {
    throw new Error(`Globales introuvables dans ${fichiers.join(', ')} : ${err.message}`);
  }
  return sortie;
}

/** Le moteur et la base de connaissances, prêts à composer. */
export function chargerMoteur() {
  return charger(
    ['cuisine/assets/js/moteur.js', 'cuisine/assets/js/pieces.js'],
    ['Moteur', 'PIECES', 'CATEGORIES'],
  );
}

/**
 * Ramène une valeur du bac à sable dans le monde des tests.
 *
 * Un objet créé là-bas a le `Object.prototype` de là-bas : `deepEqual` le
 * refuserait, non pour son contenu mais pour son ascendance. L'aller-retour
 * par JSON règle la question — et ne perd rien, ces valeurs étant justement
 * celles qui voyagent en JSON.
 */
export const rapatrier = (valeur) => JSON.parse(JSON.stringify(valeur ?? null));

/**
 * Un contexte de composition complet, avec des valeurs par défaut sensées.
 *
 * `maintenant` vaut par défaut une date fixe et lointaine : les tests ne
 * doivent dépendre ni de l'heure à laquelle on les lance, ni du jour.
 */
export const MAINTENANT = new Date(2026, 7, 29, 10, 0);   // samedi 29 août 2026, 10 h

export function contexteDe(piece, { poids, cuisson, equip = {}, service = null, maintenant = MAINTENANT } = {}) {
  return {
    poids: poids ?? piece.poids.defaut,
    cuisson: cuisson ?? piece.cuissons?.[0] ?? null,
    equip,
    service,
    maintenant,
  };
}
