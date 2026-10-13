/**
 * La Brigade — les scènes des capsules.
 *
 * Chaque étape d'une leçon désigne une scène ; la capsule l'affiche derrière le
 * chef pendant qu'il parle. Ce sont des illustrations vectorielles en aplats,
 * dessinées ici en code — pas de fichier image, pas de téléchargement, et
 * elles restent nettes à n'importe quelle taille.
 *
 * Les animations (vapeur qui monte, flamme qui danse, couteau qui tranche…)
 * sont des classes CSS définies dans `brigade.css`. On anime des groupes
 * `<g>` : le navigateur gère l'origine de la transformation via
 * `transform-box: fill-box`, réglé dans la feuille de style.
 *
 * Toutes les scènes tiennent dans une boîte de 320 × 200 et partagent le même
 * plan de travail, pour que les enchaînements restent calmes à l'œil.
 */

const BOIS = '#c9955c';
const BOIS_FONCE = '#a8743f';
const ACIER = '#c7d0d9';
const ACIER_FONCE = '#8d9aa8';
const NOIR = '#3a3f4a';
const FLAMME = '#f39c2b';
const FLAMME_2 = '#e0552b';
const VAPEUR = '#ffffff';
const CREME = '#fbf3e6';
const LIQUIDE = '#e9b96a';

/** Le plan de travail commun : une ligne de comptoir et une ombre douce. */
const comptoir = (y = 168) => `
  <rect x="0" y="${y}" width="320" height="${200 - y}" fill="#ead9c0"/>
  <rect x="0" y="${y}" width="320" height="3" fill="#d9c3a3"/>`;

/** Trois volutes de vapeur qui montent en décalé. */
const vapeur = (x, y, echelle = 1) =>
  [0, 1, 2]
    .map(
      (i) => `
  <g class="anim-vapeur" style="animation-delay:${i * 0.7}s" opacity="0">
    <path d="M${x + (i - 1) * 16 * echelle} ${y} c -6 -10 6 -14 0 -26 c -6 -10 6 -14 0 -24"
          stroke="${VAPEUR}" stroke-width="${5 * echelle}" stroke-linecap="round" fill="none" opacity=".85"/>
  </g>`,
    )
    .join('');

/** Une flamme de brûleur, en deux langues qui dansent. */
const flamme = (x, y) => `
  <g class="anim-flamme">
    <path d="M${x - 22} ${y} q 8 -22 22 -30 q 14 8 22 30 z" fill="${FLAMME}"/>
    <path d="M${x - 11} ${y} q 4 -12 11 -17 q 7 5 11 17 z" fill="${FLAMME_2}"/>
  </g>`;

/** Le brûleur : une grille sombre sous une flamme. */
const bruleur = (x, y) => `
  ${flamme(x, y)}
  <rect x="${x - 60}" y="${y}" width="120" height="6" rx="3" fill="${NOIR}"/>`;

export const SCENES = {
  /** Planche à découper, couteau qui tranche un demi-oignon. */
  planche: () => `
  ${comptoir()}
  <rect x="40" y="128" width="240" height="40" rx="8" fill="${BOIS}"/>
  <rect x="40" y="128" width="240" height="8" rx="4" fill="${BOIS_FONCE}" opacity=".5"/>
  <!-- demi-oignon et ses anneaux -->
  <path d="M96 128 a 30 30 0 0 1 60 0 z" fill="#f4e4c1"/>
  <path d="M104 128 a 22 22 0 0 1 44 0" stroke="#d8b98a" stroke-width="2" fill="none"/>
  <path d="M112 128 a 14 14 0 0 1 28 0" stroke="#d8b98a" stroke-width="2" fill="none"/>
  <path d="M120 128 a 6 6 0 0 1 12 0" stroke="#d8b98a" stroke-width="2" fill="none"/>
  <!-- tranches déjà coupées -->
  ${[0, 1, 2, 3].map((i) => `<rect x="${168 + i * 11}" y="${104 + i * 2}" width="6" height="${24 - i * 2}" rx="3" fill="#f4e4c1" stroke="#d8b98a" stroke-width="1"/>`).join('')}
  <!-- couteau -->
  <g class="anim-couteau">
    <path d="M150 60 L 250 60 L 236 92 L 160 92 Q 148 92 150 78 Z" fill="${ACIER}"/>
    <path d="M150 60 L 250 60 L 246 66 L 154 66 Z" fill="${ACIER_FONCE}" opacity=".6"/>
    <rect x="250" y="56" width="52" height="16" rx="8" fill="${NOIR}"/>
    <circle cx="266" cy="64" r="2" fill="${ACIER}"/><circle cx="284" cy="64" r="2" fill="${ACIER}"/>
  </g>`,

  /** Le fusil d'aiguisage et la lame qui glisse dessus. */
  soin: () => `
  ${comptoir()}
  <rect x="150" y="30" width="14" height="128" rx="7" fill="${ACIER_DEGRADE()}"/>
  <rect x="146" y="150" width="22" height="26" rx="6" fill="${NOIR}"/>
  <g class="anim-glisse">
    <path d="M60 70 L 150 92 L 150 106 L 70 92 Q 58 88 60 70 Z" fill="${ACIER}"/>
    <rect x="18" y="58" width="46" height="16" rx="8" transform="rotate(14 41 66)" fill="${NOIR}"/>
  </g>
  ${[0, 1, 2].map((i) => `<circle class="anim-etincelle" style="animation-delay:${i * 0.4}s" cx="${152 + i * 4}" cy="${96 - i * 6}" r="2" fill="${FLAMME}"/>`).join('')}`,

  /** La balance de cuisine et son bol. */
  balance: () => `
  ${comptoir()}
  <rect x="96" y="120" width="128" height="48" rx="10" fill="${ACIER}"/>
  <rect x="112" y="108" width="96" height="16" rx="6" fill="${ACIER_FONCE}"/>
  <rect x="126" y="136" width="68" height="20" rx="4" fill="#1f2a37"/>
  <text x="160" y="151" text-anchor="middle" font-family="ui-monospace, monospace" font-size="13" font-weight="700" fill="#7fe0a8" class="anim-clignote">150 g</text>
  <path d="M104 108 q 56 -46 112 0 z" fill="${CREME}" stroke="#d9c3a3" stroke-width="2"/>
  <path d="M120 96 q 40 -20 80 0" stroke="#d9c3a3" stroke-width="2" fill="none"/>`,

  /** Une marmite qui frémit sur le feu. */
  casserole: () => `
  ${comptoir()}
  ${bruleur(160, 162)}
  <rect x="86" y="72" width="148" height="88" rx="10" fill="${ACIER}"/>
  <rect x="86" y="72" width="148" height="12" rx="6" fill="${ACIER_FONCE}"/>
  <rect x="60" y="86" width="30" height="10" rx="5" fill="${ACIER_FONCE}"/>
  <rect x="230" y="86" width="30" height="10" rx="5" fill="${ACIER_FONCE}"/>
  <rect x="96" y="84" width="128" height="10" fill="${LIQUIDE}"/>
  ${[0, 1, 2, 3].map((i) => `<circle class="anim-bulle" style="animation-delay:${i * 0.55}s" cx="${112 + i * 32}" cy="90" r="3" fill="#fff" opacity=".8"/>`).join('')}
  ${vapeur(160, 66)}`,

  /** Un thermomètre à sonde planté dans une pièce de viande. */
  thermometre: () => `
  ${comptoir()}
  <ellipse cx="150" cy="150" rx="90" ry="14" fill="#d9c3a3"/>
  <path d="M74 140 q 20 -60 76 -60 q 66 0 76 60 z" fill="#b8663a"/>
  <path d="M84 138 q 22 -46 66 -46 q 54 0 66 46 z" fill="#d0844f"/>
  <path d="M96 130 q 20 -30 56 -30 q 40 0 56 30" stroke="#8a4a26" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="6 10"/>
  <g>
    <rect x="182" y="30" width="6" height="90" rx="3" transform="rotate(28 185 75)" fill="${ACIER}"/>
    <rect x="196" y="20" width="60" height="34" rx="8" transform="rotate(28 226 37)" fill="${NOIR}"/>
    <rect x="204" y="28" width="44" height="18" rx="3" transform="rotate(28 226 37)" fill="#1f2a37"/>
    <text x="226" y="43" text-anchor="middle" transform="rotate(28 226 37)" font-family="ui-monospace, monospace" font-size="12" font-weight="700" fill="#7fe0a8" class="anim-clignote">175 °F</text>
  </g>`,

  /** Le chinois et son filet de bouillon. */
  passoire: () => `
  ${comptoir()}
  <path d="M100 150 q 60 24 120 0 v 18 q -60 20 -120 0 z" fill="${CREME}" stroke="#d9c3a3" stroke-width="2"/>
  <rect x="104" y="140" width="112" height="14" fill="${LIQUIDE}"/>
  <path d="M96 56 L 224 56 L 172 122 L 148 122 Z" fill="${ACIER}"/>
  <path d="M96 56 L 224 56 L 218 64 L 102 64 Z" fill="${ACIER_FONCE}"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="${112 + i * 20}" y1="70" x2="${140 + i * 8}" y2="110" stroke="${ACIER_FONCE}" stroke-width="1" opacity=".5"/>`).join('')}
  <rect x="222" y="52" width="60" height="10" rx="5" fill="${NOIR}"/>
  ${[0, 1, 2].map((i) => `<circle class="anim-goutte" style="animation-delay:${i * 0.5}s" cx="160" cy="124" r="3" fill="${LIQUIDE}"/>`).join('')}
  <path d="M158 100 q 20 -50 20 -70" stroke="${LIQUIDE}" stroke-width="0" fill="none"/>`,

  /** Le réfrigérateur, porte entrouverte sur une grille. */
  frigo: () => `
  ${comptoir(176)}
  <rect x="96" y="18" width="128" height="158" rx="10" fill="${ACIER}"/>
  <rect x="96" y="18" width="128" height="60" rx="10" fill="${ACIER_FONCE}" opacity=".35"/>
  <rect x="104" y="84" width="112" height="86" rx="6" fill="#e7f3fb"/>
  ${[0, 1].map((i) => `<rect x="108" y="${104 + i * 30}" width="104" height="3" rx="1.5" fill="#b9d3e4"/>`).join('')}
  <ellipse cx="160" cy="104" rx="30" ry="6" fill="${CREME}" stroke="#d9c3a3" stroke-width="1.5"/>
  <path d="M138 100 q 22 -18 44 0 z" fill="#d0844f"/>
  <rect x="208" y="30" width="6" height="40" rx="3" fill="#fff"/>
  <rect x="208" y="94" width="6" height="60" rx="3" fill="#fff"/>
  ${[0, 1, 2].map((i) => `<g class="anim-froid" style="animation-delay:${i * 0.9}s" opacity="0"><path d="M${120 + i * 40} 140 v 12 m -6 -6 h 12 m -4 -4 l 8 8 m 0 -8 l -8 8" stroke="#7fb6d8" stroke-width="1.5" stroke-linecap="round"/></g>`).join('')}`,

  /** La poêle sur le feu, une pièce de viande qui grésille. */
  poele: () => `
  ${comptoir()}
  ${bruleur(150, 162)}
  <rect x="216" y="112" width="90" height="12" rx="6" fill="${NOIR}"/>
  <path d="M60 110 h 180 v 26 q 0 14 -14 14 h -152 q -14 0 -14 -14 z" fill="${ACIER_FONCE}"/>
  <rect x="70" y="116" width="160" height="18" rx="6" fill="#2f353f"/>
  <path d="M100 118 q 12 -22 50 -22 q 38 0 50 22 z" fill="#c0703c"/>
  <path d="M110 116 q 12 -14 40 -14 q 28 0 40 14 z" fill="#d98a4d"/>
  ${[0, 1, 2, 3, 4].map((i) => `<circle class="anim-gresille" style="animation-delay:${i * 0.3}s" cx="${96 + i * 26}" cy="114" r="2" fill="#fff" opacity="0"/>`).join('')}
  ${vapeur(150, 96, 0.8)}`,

  /** L'assiette servie, couverts, vapeur. */
  assiette: () => `
  ${comptoir()}
  <ellipse cx="160" cy="146" rx="96" ry="24" fill="#ffffff"/>
  <ellipse cx="160" cy="146" rx="96" ry="24" fill="none" stroke="#e2d4bf" stroke-width="2"/>
  <ellipse cx="160" cy="146" rx="70" ry="16" fill="none" stroke="#efe5d5" stroke-width="2"/>
  <path d="M112 142 q 14 -26 48 -26 q 34 0 48 26 z" fill="#c9773f"/>
  <path d="M122 140 q 12 -18 38 -18 q 26 0 38 18 z" fill="#e0955a"/>
  ${[0, 1, 2].map((i) => `<ellipse cx="${138 + i * 22}" cy="${126 - (i % 2) * 4}" rx="7" ry="3" fill="#6aa84f" transform="rotate(${-20 + i * 20} ${138 + i * 22} 126)"/>`).join('')}
  <rect x="42" y="104" width="6" height="70" rx="3" fill="${ACIER}"/>
  ${[0, 1, 2].map((i) => `<rect x="${40 + i * 4}" y="96" width="2.5" height="14" rx="1" fill="${ACIER}"/>`).join('')}
  <rect x="272" y="104" width="6" height="70" rx="3" fill="${ACIER}"/>
  <path d="M272 104 l 6 0 l 4 -14 l -8 -6 z" fill="${ACIER}"/>
  ${vapeur(160, 112, 0.7)}`,

  /** Le four, hublot qui rougeoie. */
  four: () => `
  ${comptoir(178)}
  <rect x="60" y="30" width="200" height="148" rx="10" fill="${ACIER}"/>
  <rect x="60" y="30" width="200" height="30" rx="10" fill="${ACIER_FONCE}" opacity=".4"/>
  ${[0, 1, 2].map((i) => `<circle cx="${90 + i * 26}" cy="45" r="6" fill="${NOIR}"/>`).join('')}
  <rect x="200" y="39" width="44" height="12" rx="6" fill="#1f2a37"/>
  <text x="222" y="49" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="#7fe0a8">375 °F</text>
  <rect x="72" y="70" width="176" height="90" rx="8" fill="${NOIR}"/>
  <rect x="80" y="78" width="160" height="74" rx="6" fill="#4a2a12"/>
  <rect class="anim-lueur" x="80" y="78" width="160" height="74" rx="6" fill="${FLAMME}" opacity=".35"/>
  <rect x="88" y="122" width="144" height="4" rx="2" fill="#8a7a6a"/>
  <path d="M116 120 q 44 -30 88 0 z" fill="#d9a15c"/>
  <path d="M124 118 q 36 -22 72 0 z" fill="#f0c27b"/>
  <rect x="72" y="66" width="176" height="6" rx="3" fill="#fff" opacity=".5"/>`,

  /** Le bol et le fouet. */
  bol: () => `
  ${comptoir()}
  <path d="M70 98 q 90 110 180 0 z" fill="${CREME}" stroke="#d9c3a3" stroke-width="2"/>
  <path d="M70 98 h 180" stroke="#d9c3a3" stroke-width="3"/>
  <path d="M86 100 q 74 40 148 0" fill="#f5d38a"/>
  <g class="anim-fouet">
    <rect x="186" y="18" width="10" height="56" rx="5" transform="rotate(20 191 46)" fill="${NOIR}"/>
    <path d="M176 78 q -30 40 8 60 q 36 -20 10 -60 z" transform="rotate(20 180 100)" fill="none" stroke="${ACIER}" stroke-width="3"/>
    <path d="M182 78 q -12 40 2 60 q 16 -20 6 -60 z" transform="rotate(20 180 100)" fill="none" stroke="${ACIER}" stroke-width="3"/>
  </g>`,

  /** Le rouleau à pâte sur une abaisse farinée. */
  pate: () => `
  ${comptoir()}
  <rect x="40" y="128" width="240" height="40" rx="8" fill="${BOIS}"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${60 + i * 42}" cy="${140 + (i % 2) * 14}" r="${2 + (i % 3)}" fill="#fff" opacity=".8"/>`).join('')}
  <ellipse cx="160" cy="128" rx="84" ry="10" fill="#f3dfb4"/>
  <ellipse cx="160" cy="124" rx="84" ry="10" fill="#f8e9c8"/>
  <g class="anim-roule">
    <rect x="92" y="78" width="136" height="30" rx="15" fill="#e5c39a"/>
    <rect x="92" y="78" width="136" height="10" rx="5" fill="#fff" opacity=".35"/>
    <rect x="60" y="86" width="34" height="14" rx="7" fill="${BOIS_FONCE}"/>
    <rect x="226" y="86" width="34" height="14" rx="7" fill="${BOIS_FONCE}"/>
  </g>`,

  /** La casserole de riz, couvercle fermé, vapeur sur les bords. */
  riz: () => `
  ${comptoir()}
  ${bruleur(160, 162)}
  <rect x="86" y="86" width="148" height="74" rx="10" fill="${ACIER}"/>
  <rect x="60" y="96" width="30" height="10" rx="5" fill="${ACIER_FONCE}"/>
  <rect x="230" y="96" width="30" height="10" rx="5" fill="${ACIER_FONCE}"/>
  <g class="anim-couvercle">
    <path d="M84 86 q 76 -30 152 0 z" fill="${ACIER_FONCE}"/>
    <rect x="150" y="60" width="20" height="10" rx="5" fill="${NOIR}"/>
  </g>
  ${[0, 1].map((i) => `<g class="anim-vapeur" style="animation-delay:${i * 0.8}s" opacity="0"><path d="M${100 + i * 120} 84 c -4 -8 4 -12 0 -22" stroke="${VAPEUR}" stroke-width="4" stroke-linecap="round" fill="none"/></g>`).join('')}
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<ellipse cx="${100 + i * 20}" cy="${150 - (i % 2) * 4}" rx="4" ry="2" fill="#fff"/>`).join('')}`,

  /** Le pavé de saumon, peau vers le bas, dans la poêle. */
  poisson: () => `
  ${comptoir()}
  ${bruleur(150, 162)}
  <rect x="216" y="112" width="90" height="12" rx="6" fill="${NOIR}"/>
  <path d="M60 110 h 180 v 26 q 0 14 -14 14 h -152 q -14 0 -14 -14 z" fill="${ACIER_FONCE}"/>
  <rect x="70" y="116" width="160" height="18" rx="6" fill="#2f353f"/>
  <path d="M96 116 q 4 -30 30 -30 h 60 q 20 0 22 30 z" fill="#f28c6b"/>
  <path d="M104 116 q 4 -20 24 -20 h 56 q 14 0 16 20 z" fill="#f7a98b"/>
  ${[0, 1, 2, 3].map((i) => `<path d="M${112 + i * 20} 100 q 6 -6 12 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`).join('')}
  <rect x="96" y="112" width="112" height="4" fill="#b8532f"/>
  ${[0, 1, 2, 3].map((i) => `<circle class="anim-gresille" style="animation-delay:${i * 0.35}s" cx="${100 + i * 30}" cy="114" r="2" fill="#fff" opacity="0"/>`).join('')}
  ${vapeur(150, 90, 0.7)}`,

  /** Deux mains qui pétrissent une pâte. */
  petrissage: () => `
  ${comptoir()}
  <rect x="40" y="140" width="240" height="28" rx="8" fill="${BOIS}"/>
  ${[0, 1, 2, 3].map((i) => `<circle cx="${70 + i * 60}" cy="${150 + (i % 2) * 8}" r="2" fill="#fff" opacity=".8"/>`).join('')}
  <g class="anim-petrit">
    <ellipse cx="160" cy="124" rx="52" ry="26" fill="#f3dfb4"/>
    <ellipse cx="160" cy="116" rx="44" ry="18" fill="#f8e9c8"/>
  </g>
  <g class="anim-main-gauche">
    <rect x="76" y="76" width="50" height="60" rx="22" fill="#f1c7a5"/>
    ${[0, 1, 2].map((i) => `<rect x="${80 + i * 15}" y="118" width="12" height="26" rx="6" fill="#f1c7a5"/>`).join('')}
  </g>
  <g class="anim-main-droite">
    <rect x="194" y="76" width="50" height="60" rx="22" fill="#f1c7a5"/>
    ${[0, 1, 2].map((i) => `<rect x="${198 + i * 15}" y="118" width="12" height="26" rx="6" fill="#f1c7a5"/>`).join('')}
  </g>`,
};

/** Un léger dégradé pour le fusil : défini ici pour rester dans une seule chaîne. */
function ACIER_DEGRADE() {
  return ACIER_FONCE;
}

/**
 * Rend une scène complète, prête à être insérée dans la page.
 * Une scène inconnue retombe sur l'assiette : la capsule ne doit jamais
 * s'interrompre pour une faute de frappe dans les données.
 */
export function rendreScene(nom, { classe = '' } = {}) {
  const dessin = (SCENES[nom] ?? SCENES.assiette)();
  return `<svg class="scene ${classe}" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <rect width="320" height="200" fill="${CREME}"/>
    ${dessin}
  </svg>`;
}
