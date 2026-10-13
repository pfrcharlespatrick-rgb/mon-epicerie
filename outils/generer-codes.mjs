/**
 * Génère des codes d'accès pour La Brigade, avec leur empreinte SHA-256.
 *
 *   node outils/generer-codes.mjs        → un code
 *   node outils/generer-codes.mjs 5      → cinq codes
 *
 * Le code se donne au client ; l'empreinte se colle dans `empreintes` de
 * `assets/js/config-brigade.js`. La même chose, sans terminal, existe dans
 * `outils/codes.html`.
 *
 * L'alphabet évite les caractères qui se confondent (0/O, 1/I/L) : un code
 * se dicte au téléphone sans erreur.
 */

import { randomInt, createHash } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const nombre = Math.max(1, Math.min(100, Number(process.argv[2] ?? 1) || 1));

const normaliser = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
const groupe = (n) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

console.log('Codes à remettre aux clients        Empreintes à coller dans config-brigade.js');
console.log('──────────────────────────────────  ────────────────────────────────────────────────────────────────');
for (let i = 0; i < nombre; i++) {
  const code = `BRIGADE-${groupe(4)}-${groupe(4)}`;
  const empreinte = createHash('sha256').update(normaliser(code)).digest('hex');
  console.log(`${code.padEnd(34)}  '${empreinte}',`);
}
