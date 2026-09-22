/**
 * Écrit un scénario de tournage par leçon publiée, dans production/scenarios/.
 *
 *   node outils/exporter-scenarios.mjs
 *
 * Tout vient de `assets/js/lecons.js` : le scénario est toujours à jour avec
 * le site. Les quantités sont celles du nombre de portions de référence de
 * la leçon — pour une vidéo, on ne peut pas s'adapter à la tablée, c'est
 * justement ce qui distingue la capsule de la vidéo.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = resolve(RACINE, 'production/scenarios');

const { CHEFS } = await import(resolve(RACINE, 'assets/js/chefs.js'));
const { LECONS, PARCOURS, TECHNIQUES } = await import(resolve(RACINE, 'assets/js/lecons.js'));

const chef = (id) => CHEFS.find((c) => c.id === id);
const parcours = (id) => PARCOURS.find((p) => p.id === id);

/* Les mêmes règles d'arrondi que le site, pour que la vidéo dise la même chose. */
const nombreFr = (v, d = 0) => v.toLocaleString('fr-CA', { minimumFractionDigits: d, maximumFractionDigits: d });
function quantite(q, u) {
  if (q === null || q === undefined) return '';
  if (u === '') return q % 1 === 0.5 ? `${Math.floor(q) || ''}${Math.floor(q) ? ' ' : ''}½` : String(q);
  if (u === 'g' && q >= 1000) return `${nombreFr(q / 1000, 2)} kg`;
  if (u === 'ml' && q >= 1000) return `${nombreFr(q / 1000, 2)} L`;
  return `${nombreFr(q, Number.isInteger(q) ? 0 : 1)} ${u}`;
}
const H_ASPIRE = /^(haut|haric|hach|homard|hareng|hamburg|hot)/;
function enMots(ingredient) {
  const nom = ingredient.nom.charAt(0).toLowerCase() + ingredient.nom.slice(1);
  const q = quantite(ingredient.q, ingredient.u);
  if (!q) return nom;
  if (ingredient.u === '') return `${q} ${nom}`;
  const debut = nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const elision = /^[aeiouyh]/.test(debut) && !H_ASPIRE.test(debut);
  return `${q} ${elision ? 'd’' : 'de '}${nom}`;
}
function remplacer(texte, lecon) {
  return texte.replace(/{{([a-z-]+)(?::q)?}}/g, (tout, cle) => {
    const i = lecon.ingredients.find((x) => x.cle === cle);
    if (!i) return tout;
    return tout.endsWith(':q}}') ? quantite(i.q, i.u) : enMots(i);
  });
}

/** Durée parlée estimée : 2,5 mots par seconde. */
const secondes = (texte) => Math.round(texte.split(/\s+/).length / 2.5);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const NOMS_SCENES = {
  planche: 'Planche à découper, couteau en action',
  soin: 'Fusil d’aiguisage, lame qui glisse',
  balance: 'Balance de cuisine, bol posé',
  casserole: 'Marmite qui frémit sur le feu',
  thermometre: 'Sonde plantée dans la pièce, afficheur',
  passoire: 'Chinois au-dessus d’un bol, filet de liquide',
  frigo: 'Réfrigérateur entrouvert, plaque sur la grille',
  poele: 'Poêle sur le feu, pièce qui grésille',
  assiette: 'Assiette servie, couverts, vapeur',
  four: 'Four, hublot qui rougeoie',
  bol: 'Bol et fouet',
  pate: 'Rouleau sur l’abaisse farinée',
  riz: 'Casserole de riz, couvercle qui frémit',
  poisson: 'Pavé de saumon peau vers le bas dans la poêle',
  petrissage: 'Deux mains qui pétrissent',
};

mkdirSync(DOSSIER, { recursive: true });

let ecrits = 0;
for (const lecon of LECONS.filter((l) => l.statut === 'publiee')) {
  const c = chef(lecon.chefId);
  const p = parcours(lecon.parcoursId);
  let horloge = 0;
  const lignes = [];

  lignes.push(`# Scénario — ${lecon.titre}`, '');
  lignes.push(`**Parcours** : ${p.titre} · leçon ${lecon.numero}  `);
  lignes.push(`**Chef** : ${c.titre} (${c.role}) — ${c.pedagogie}  `);
  lignes.push(`**Accroche** : ${lecon.accroche}  `);
  lignes.push(`**Portions de référence** : ${lecon.portions} ${lecon.portionsLibelle ?? 'convives'}  `);
  lignes.push(`**Techniques enseignées** : ${lecon.techniques.map((t) => TECHNIQUES[t]?.nom ?? t).join(', ')}`, '');
  lignes.push('> Généré par `node outils/exporter-scenarios.mjs` à partir de `assets/js/lecons.js`. Modifiez la leçon, pas ce fichier.', '');

  lignes.push('## Ouverture (10 s)', '');
  lignes.push(`Portrait du chef en médaillon, titre à l'écran : *${lecon.titre}*.  `);
  lignes.push(`**${c.titre}** (voix) : « ${lecon.accroche} »`, '');

  lignes.push('## Ce qu’on aura fait', '', lecon.resultat, '');

  lignes.push('## Ingrédients à montrer', '');
  lignes.push('| Quantité | Ingrédient | Note |', '|---|---|---|');
  for (const i of lecon.ingredients) {
    lignes.push(`| ${quantite(i.q, i.u) || '—'} | ${i.nom} | ${[i.note, i.substitution ? `à défaut : ${i.substitution}` : ''].filter(Boolean).join(' · ')} |`);
  }
  lignes.push('');

  lignes.push('## Plans', '');
  lecon.etapes.forEach((e, index) => {
    const narration = remplacer(e.voix, lecon);
    const duree = secondes(narration) + 3;
    lignes.push(`### Plan ${index + 1} — ${e.titre}`, '');
    lignes.push(`| | |`, `|---|---|`);
    lignes.push(`| **Minutage** | ${mmss(horloge)} → ${mmss(horloge + duree)} (${duree} s de narration) |`);
    lignes.push(`| **Image** | ${NOMS_SCENES[e.scene] ?? e.scene} |`);
    lignes.push(`| **Texte à l’écran** | ${remplacer(e.texte, lecon)} |`);
    if (e.duree) lignes.push(`| **Durée réelle du geste** | ${e.duree}${e.minuterie ? ` — afficher une minuterie de ${e.minuterie} min` : ''} |`);
    lignes.push('');
    lignes.push(`**Narration (${c.titre})** :`, '', `> ${narration}`, '');
    if (e.piege) lignes.push(`**Carton « Le piège »** : ${e.piege}  `);
    if (e.reussite) lignes.push(`**Carton « Signe de réussite »** : ${e.reussite}`);
    lignes.push('');
    horloge += duree;
  });

  lignes.push('## Fermeture (10 s)', '');
  lignes.push(`**${c.titre}** (voix) : « ${lecon.debrief.reussi} »  `);
  lignes.push(`Carton : *Trois leçons gratuites — La Brigade.* Adresse du site.`, '');
  lignes.push(`**Durée totale estimée** : ${mmss(horloge + 20)}`, '');

  writeFileSync(resolve(DOSSIER, `${lecon.id}.md`), lignes.join('\n'));
  console.log(`écrit  production/scenarios/${lecon.id}.md  (${mmss(horloge + 20)})`);
  ecrits++;
}
console.log(`${ecrits} scénario(s).`);
