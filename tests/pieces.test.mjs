/**
 * La base de connaissances et sa composition, pièce par pièce.
 *
 * `pieces.js` est fait de closures écrites à la main : une coquille dans l'une
 * d'elles ne se voit que le jour où quelqu'un choisit cette pièce-là, avec ce
 * poids-là, sans thermomètre. On les traverse donc toutes, à toutes leurs
 * bornes, plutôt que d'attendre ce jour-là.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerMoteur, contexteDe } from './aide/cuisine.mjs';

const { Moteur, PIECES, CATEGORIES } = chargerMoteur();

const TOUT_EQUIPEMENT = {
  thermometre: true, fonte: true, cocotte: true, grille: true,
  bbq: true, ficelle: true, parchemin: true, mijoteuse: true,
};

/** Toutes les combinaisons qu'un utilisateur peut réellement demander. */
function* combinaisons() {
  for (const piece of PIECES) {
    for (const poids of [piece.poids.min, piece.poids.defaut, piece.poids.max]) {
      for (const cuisson of piece.cuissons?.length ? piece.cuissons : [null]) {
        for (const equip of [{}, TOUT_EQUIPEMENT]) {
          yield { piece, ctx: contexteDe(piece, { poids, cuisson, equip }) };
        }
      }
    }
  }
}

const nomDe = ({ piece, ctx }) =>
  `${piece.id} / ${ctx.poids} g / ${ctx.cuisson?.id ?? 'sans cuisson'} / ${ctx.equip.thermometre ? 'équipé' : 'dépourvu'}`;

// --- Forme de la base -------------------------------------------------------

test('chaque pièce est complète et rattachée à une catégorie connue', () => {
  const categories = new Set(CATEGORIES.map((c) => c.id));
  for (const piece of PIECES) {
    for (const champ of ['id', 'nom', 'categorie', 'emoji', 'description', 'poids']) {
      assert.ok(piece[champ], `${piece.id} : ${champ} manquant`);
    }
    for (const fn of ['intro', 'besoins', 'etapes', 'conservation', 'accompagnement']) {
      assert.equal(typeof piece[fn], 'function', `${piece.id} : ${fn} n’est pas une fonction`);
    }
    assert.ok(categories.has(piece.categorie), `${piece.id} : catégorie inconnue « ${piece.categorie} »`);
  }
});

test('les identifiants de pièces sont distincts', () => {
  const ids = PIECES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('chaque catégorie a au moins une pièce', () => {
  for (const c of CATEGORIES) {
    assert.ok(PIECES.some((p) => p.categorie === c.id), `catégorie vide : ${c.nom}`);
  }
});

test('les bornes de poids se tiennent', () => {
  for (const { id, poids } of PIECES) {
    assert.ok(poids.min > 0, `${id} : minimum nul`);
    assert.ok(poids.min <= poids.defaut, `${id} : défaut sous le minimum`);
    assert.ok(poids.defaut <= poids.max, `${id} : défaut au-dessus du maximum`);
    assert.ok(poids.indication, `${id} : sans indication de portion`);
  }
});

test('les cuissons montent en température et sont distinctes', () => {
  for (const piece of PIECES) {
    if (!piece.cuissons?.length) continue;
    const ids = piece.cuissons.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${piece.id} : deux cuissons de même identifiant`);

    for (const c of piece.cuissons) {
      assert.ok(c.nom && c.note, `${piece.id}/${c.id} : nom ou note manquant`);
      if (typeof c.retrait === 'number' && typeof c.coeur === 'number') {
        assert.ok(c.retrait < c.coeur,
          `${piece.id}/${c.id} : le retrait (${c.retrait}) doit précéder la cible (${c.coeur}), le repos fait monter la température`);
        assert.ok(c.coeur - c.retrait <= 15, `${piece.id}/${c.id} : ${c.coeur - c.retrait} °C de repos, c’est beaucoup`);
      }
    }
  }
});

// --- Les étapes -------------------------------------------------------------

test('chaque étape de chaque pièce est bien formée', () => {
  for (const cas of combinaisons()) {
    for (const etape of cas.piece.etapes(cas.ctx)) {
      assert.ok(etape.titre?.trim(), `${nomDe(cas)} : étape sans titre`);
      assert.ok(etape.texte?.trim(), `${nomDe(cas)} : étape « ${etape.titre} » sans texte`);
      assert.ok(Number.isFinite(etape.duree) && etape.duree >= 0,
        `${nomDe(cas)} : durée illisible pour « ${etape.titre} » (${etape.duree})`);
      const quand = etape.quand;
      const valide = quand === 'jour' || quand === 'veille' || (typeof quand === 'object' && quand?.joursAvant > 0);
      assert.ok(valide, `${nomDe(cas)} : « quand » inattendu pour « ${etape.titre} » (${JSON.stringify(quand)})`);
    }
  }
});

test('chaque recette a du travail le jour même et se termine par un repos ou un service', () => {
  for (const cas of combinaisons()) {
    const etapes = cas.piece.etapes(cas.ctx);
    assert.ok(etapes.length >= 3, `${nomDe(cas)} : ${etapes.length} étape(s), c’est peu`);
    assert.ok(etapes.some((e) => e.quand === 'jour'), `${nomDe(cas)} : rien à faire le jour même`);
  }
});

test('les fenêtres de cuisson grandissent avec la pièce', () => {
  for (const piece of PIECES) {
    const cuisson = piece.cuissons?.[0] ?? null;
    const total = (poids) => piece.etapes(contexteDe(piece, { poids, cuisson }))
      .filter((e) => e.quand === 'jour')
      .reduce((s, e) => s + e.duree, 0);
    assert.ok(total(piece.poids.max) >= total(piece.poids.min),
      `${piece.id} : la grosse pièce ne cuit pas plus longtemps que la petite`);
  }
});

// --- La composition ---------------------------------------------------------

test('toutes les pièces composent, à toutes leurs bornes, avec ou sans équipement', () => {
  for (const cas of combinaisons()) {
    let html;
    assert.doesNotThrow(() => { html = Moteur.composer(cas.piece, cas.ctx); }, nomDe(cas));
    assert.match(html, /^<div class="recette">/, nomDe(cas));
    assert.match(html, /<\/div>$/, nomDe(cas));
  }
});

test('aucune recette ne laisse fuiter « NaN », « undefined » ou « null »', () => {
  // Les limites de mot sont indispensables : « nulle part » est du français,
  // pas une valeur qui a débordé.
  const vilains = [/\bNaN\b/, /\bundefined\b/, /\bnull\b/];
  for (const cas of combinaisons()) {
    const html = Moteur.composer(cas.piece, cas.ctx);
    for (const vilain of vilains) {
      assert.equal(vilain.test(html), false, `${nomDe(cas)} : ${vilain} dans la recette`);
    }
  }
});

test('la recette annonce toujours les sections qui font la charte de la maison', () => {
  for (const cas of combinaisons()) {
    const html = Moteur.composer(cas.piece, cas.ctx);
    for (const titre of ['Ce qu’il vous faut', 'Les étapes', 'Conservation et réchauffage', 'Pour l’accompagner']) {
      assert.ok(html.includes(titre), `${nomDe(cas)} : section « ${titre} » absente`);
    }
    assert.ok(html.includes('Le jour même, comptez'), `${nomDe(cas)} : durée du jour absente`);
  }
});

test('sans thermomètre, la recette le dit ; avec, elle se tait', () => {
  const piece = PIECES[0];
  const sans = Moteur.composer(piece, contexteDe(piece, { equip: {} }));
  const avec = Moteur.composer(piece, contexteDe(piece, { equip: TOUT_EQUIPEMENT }));
  assert.match(sans, /Sans thermomètre à sonde/);
  assert.equal(/Sans thermomètre à sonde/.test(avec), false);
});

test('la température de retrait choisie se retrouve dans la recette', () => {
  for (const piece of PIECES) {
    for (const cuisson of piece.cuissons ?? []) {
      if (typeof cuisson.retrait !== 'number') continue;
      const html = Moteur.composer(piece, contexteDe(piece, { cuisson }));
      assert.ok(html.includes(cuisson.retrait + ' °C'),
        `${piece.id}/${cuisson.id} : la température de retrait n’apparaît nulle part`);
    }
  }
});

test('la dose de sel suit le poids de la pièce', () => {
  const dose = (html) => Number((html.match(/(\d+) g de gros sel/) ?? [])[1] ?? 0);
  for (const piece of PIECES) {
    const petite = dose(Moteur.composer(piece, contexteDe(piece, { poids: piece.poids.min })));
    if (!petite) continue;   // cette pièce ne se sale pas à sec
    const grosse = dose(Moteur.composer(piece, contexteDe(piece, { poids: piece.poids.max })));
    assert.ok(grosse >= petite, `${piece.id} : ${grosse} g de sel pour la grosse contre ${petite} g pour la petite`);
    assert.ok(petite >= 4, `${piece.id} : dose de sel invraisemblable (${petite} g)`);
  }
});

// --- Le poids venu d'ailleurs ----------------------------------------------

test('poidsValide() écarte ce qui n’est pas un poids', () => {
  const piece = PIECES[0];
  for (const valeur of [NaN, undefined, null, 'beaucoup', 0, -500, Infinity, '']) {
    assert.equal(Moteur.poidsValide(valeur, piece), null, `« ${valeur} » aurait dû être écarté`);
  }
});

test('poidsValide() ramène un poids aberrant dans les bornes de la pièce', () => {
  const piece = PIECES.find((p) => p.id === 'cote-de-boeuf');
  assert.equal(Moteur.poidsValide(piece.poids.max * 20, piece), piece.poids.max);
  assert.equal(Moteur.poidsValide(1, piece), piece.poids.min);
  assert.equal(Moteur.poidsValide(1800, piece), 1800);
  assert.equal(Moteur.poidsValide('1800', piece), 1800, 'un champ de formulaire rend du texte');
  assert.equal(Moteur.poidsValide(1800.6, piece), 1801, 'les grammes sont entiers');
});

test('un poids corrompu ne peut pas produire une recette « NaN g »', () => {
  // Le chemin réel : une entrée de carnet écrite par une version antérieure,
  // ou retouchée à la main dans le stockage du navigateur.
  const piece = PIECES[0];
  const poids = Moteur.poidsValide(NaN, piece);
  assert.equal(poids, null, 'l’application doit refuser de composer plutôt que d’afficher NaN');
});
