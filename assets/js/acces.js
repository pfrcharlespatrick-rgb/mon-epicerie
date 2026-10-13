/**
 * La Brigade — l'accès aux leçons payantes.
 *
 * Il n'y a pas de serveur, pas de compte, pas de mot de passe. Le paiement
 * se fait chez Stripe, sur une page que nous ne touchons pas ; en retour,
 * le client reçoit un code d'accès, qu'il entre ici une seule fois.
 *
 * Ce que le site connaît de ce code, c'est son empreinte SHA-256 — une
 * signature à sens unique. On peut publier l'empreinte au grand jour : il
 * est impossible d'en retrouver le code. Quand un client tape son code, on
 * calcule l'empreinte dans son navigateur et on la compare. Si elle figure
 * dans la liste, l'accès est mémorisé sur l'appareil.
 *
 * Le code peut aussi arriver dans l'adresse (`brigade.html?code=…`) : c'est
 * ainsi que la page de retour de Stripe déverrouille l'élève sans qu'il
 * ait rien à taper.
 */

import { CONFIG } from './config-brigade.js';

const CLE = 'mon-epicerie/brigade/acces/v1';

/** Un code s'écrit en majuscules, sans espaces ni tirets : « brigade 7k3m » vaut « BRIGADE7K3M ». */
export function normaliserCode(code) {
  return String(code ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Empreinte SHA-256 d'un code normalisé, en hexadécimal. */
export async function empreinte(code) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Le navigateur refuse de calculer l’empreinte : la page doit être ouverte en https (ou sur localhost).',
    );
  }
  const octets = new TextEncoder().encode(normaliserCode(code));
  const condensat = await crypto.subtle.digest('SHA-256', octets);
  return [...new Uint8Array(condensat)].map((o) => o.toString(16).padStart(2, '0')).join('');
}

function lireMemoire() {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? 'null');
  } catch {
    return null;
  }
}

/** L'appareil a-t-il déjà validé un code ? */
export function estDeverrouille() {
  const memoire = lireMemoire();
  return Boolean(memoire?.empreinte) && CONFIG.empreintes.includes(memoire.empreinte);
}

/** Toutes les leçons sont-elles ouvertes, quel qu'en soit le motif ? */
export function accesComplet() {
  return CONFIG.modeDemo || estDeverrouille();
}

/** Peut-on ouvrir cette leçon sur cet appareil ? */
export function peutOuvrir(lecon) {
  return Boolean(lecon?.gratuit) || accesComplet();
}

/**
 * Vérifie un code et, s'il est bon, mémorise l'accès.
 * Retourne `{ ok, message }` ; le message s'affiche tel quel.
 */
export async function verifierCode(code) {
  const propre = normaliserCode(code);
  if (propre.length < 6) {
    return { ok: false, message: 'Le code est trop court. Vérifiez votre reçu ou votre courriel.' };
  }
  if (CONFIG.empreintes.length === 0) {
    return {
      ok: false,
      message: 'Aucun code n’est encore configuré sur ce site. Le propriétaire doit ajouter ses empreintes dans config-brigade.js.',
    };
  }

  let signature;
  try {
    signature = await empreinte(propre);
  } catch (erreur) {
    return { ok: false, message: erreur.message };
  }

  if (!CONFIG.empreintes.includes(signature)) {
    return { ok: false, message: 'Ce code n’est pas reconnu. Vérifiez les lettres — le O et le 0 se ressemblent.' };
  }

  try {
    localStorage.setItem(CLE, JSON.stringify({ empreinte: signature, date: new Date().toISOString() }));
  } catch {
    // Navigation privée ou stockage plein : l'accès vaudra pour la session
    // en cours, on l'indique dans le message.
    return { ok: true, message: 'Code accepté. Votre navigateur ne mémorise pas les données : il faudra le retaper à la prochaine visite.' };
  }
  return { ok: true, message: 'Bienvenue dans la Brigade. Toutes les leçons sont ouvertes sur cet appareil.' };
}

/** Oublie l'accès mémorisé sur cet appareil. */
export function verrouiller() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
}

/**
 * Extrait un code de l'adresse de la page, puis l'en retire — un code n'a
 * pas à rester visible dans la barre d'adresse ni dans l'historique.
 * Le code peut être dans la partie `?code=` avant ou après le `#`.
 */
export function codeDansAdresse() {
  const url = new URL(location.href);
  let code = url.searchParams.get('code');

  // brigade.html#rejoindre?code=XXXX : certains outils collent la requête après le dièse.
  if (!code && url.hash.includes('?')) {
    const [ancre, requete] = url.hash.split('?');
    code = new URLSearchParams(requete).get('code');
    if (code) url.hash = ancre;
  }
  if (!code) return null;

  url.searchParams.delete('code');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  return code;
}
