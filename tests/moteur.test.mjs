/**
 * Le moteur : formats d'affichage et calendrier à rebours.
 *
 * Ce sont des fonctions pures — aucune raison de les laisser sans filet, et
 * beaucoup de raisons de les tenir : les nombres qu'elles produisent sont ceux
 * que l'on lit debout devant le four.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerMoteur } from './aide/cuisine.mjs';

const { Moteur, PIECES } = chargerMoteur();

/** Les moments de la colonne de gauche du calendrier. */
const moments = (html) => [...html.matchAll(/class="moment">([^<]*)</g)].map((m) => m[1]);

// --- Formats ----------------------------------------------------------------

test('poids() bascule du gramme au kilo à la bonne borne', () => {
  assert.equal(Moteur.poids(450), '450 g');
  assert.equal(Moteur.poids(999), '999 g');
  assert.equal(Moteur.poids(1000), '1 kg');
  assert.equal(Moteur.poids(1800), '1,8 kg');
  assert.equal(Moteur.poids(1050), '1,1 kg');
  assert.equal(Moteur.poids(1949), '1,9 kg');
});

test('poids() écrit la virgule décimale, jamais le point', () => {
  for (const g of [1100, 1250, 2750, 4500]) {
    assert.equal(Moteur.poids(g).includes('.'), false, `${g} → ${Moteur.poids(g)}`);
  }
});

test('duree() passe aux heures à 60 min et garde deux chiffres aux minutes', () => {
  assert.equal(Moteur.duree(45), '45 min');
  assert.equal(Moteur.duree(59), '59 min');
  assert.equal(Moteur.duree(60), '1 h');
  assert.equal(Moteur.duree(61), '1 h 01');
  assert.equal(Moteur.duree(95), '1 h 35');
  assert.equal(Moteur.duree(120), '2 h');
  assert.equal(Moteur.duree(1440), '24 h');
});

test('plage() lit comme une phrase', () => {
  assert.equal(Moteur.plage(45, 70), '45 min à 1 h 10');
  assert.equal(Moteur.plage(60, 60), '1 h à 1 h');
});

test('heure() suit l’usage d’ici : « 16 h 30 », « 9 h »', () => {
  const a = (h, m) => Moteur.heure(new Date(2026, 7, 29, h, m));
  assert.equal(a(9, 0), '9 h');
  assert.equal(a(16, 30), '16 h 30');
  assert.equal(a(0, 0), '0 h');
  assert.equal(a(0, 5), '0 h 05');
  assert.equal(a(23, 59), '23 h 59');
});

test('echapper() neutralise le HTML', () => {
  assert.equal(Moteur.echapper('<script>&"'), '&lt;script&gt;&amp;"');
  assert.equal(Moteur.echapper('Côte de bœuf'), 'Côte de bœuf');
});

// --- Le calendrier à rebours ------------------------------------------------

const piece = () => PIECES.find((p) => p.id === 'cote-de-boeuf');
const ctxDe = (service, poids) => {
  const p = piece();
  return { poids: poids ?? p.poids.defaut, cuisson: p.cuissons[1], equip: {}, service };
};

test('sans heure de service, pas de calendrier', () => {
  const p = piece();
  const ctx = ctxDe(null);
  assert.equal(Moteur.calendrier(p.etapes(ctx), ctx), '');
});

test('le calendrier remonte depuis l’heure du service', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  const p = piece();
  const ctx = ctxDe(service);
  const etapes = p.etapes(ctx);
  const html = Moteur.calendrier(etapes, ctx);

  const liste = moments(html);
  assert.equal(liste.at(-1), '18 h', 'la dernière ligne est le service');
  assert.equal(liste[0], 'La veille, en soirée', 'le salage garde son libellé de jour');

  // Le premier geste du jour tombe exactement au total des étapes du jour.
  const totalJour = etapes.filter((e) => e.quand === 'jour').reduce((s, e) => s + e.duree, 0);
  assert.equal(liste[1], Moteur.heure(new Date(service.getTime() - totalJour * 60000)));
});

test('chaque étape du jour part quand la précédente finit', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  const p = piece();
  const ctx = ctxDe(service);
  const etapes = p.etapes(ctx);
  const liste = moments(Moteur.calendrier(etapes, ctx));

  const duJour = etapes.filter((e) => e.quand === 'jour');
  let curseur = new Date(service.getTime() - duJour.reduce((s, e) => s + e.duree, 0) * 60000);
  for (const [i, etape] of duJour.entries()) {
    assert.equal(liste[i + 1], Moteur.heure(curseur), `étape « ${etape.titre} »`);
    curseur = new Date(curseur.getTime() + etape.duree * 60000);
  }
});

test('les étapes des jours d’avance gardent leur libellé, au pluriel juste', () => {
  const dinde = PIECES.find((p) => /dinde/i.test(p.nom));
  const service = new Date(2026, 11, 25, 17, 0);
  const ctx = { poids: dinde.poids.defaut, cuisson: dinde.cuissons?.[0] ?? null, equip: {}, service };
  const liste = moments(Moteur.calendrier(dinde.etapes(ctx), ctx));

  assert.ok(liste.some((m) => /^\d+ jours avant$/.test(m)), `aucun « N jours avant » dans ${liste.join(' / ')}`);
  assert.equal(liste.some((m) => /^1 jours avant$/.test(m)), false, 'le singulier doit rester au singulier');
});

test('le calendrier prévient quand le jour même commence la veille', () => {
  const dinde = PIECES.find((p) => /dinde/i.test(p.nom));
  const tot = new Date(2026, 11, 25, 6, 0);   // service très tôt : on remonte avant minuit
  const ctx = { poids: dinde.poids.max, cuisson: dinde.cuissons?.[0] ?? null, equip: {}, service: tot };
  assert.match(Moteur.calendrier(dinde.etapes(ctx), ctx), /commence la veille du service/);

  const tard = new Date(2026, 11, 25, 19, 0);
  const ctx2 = { ...ctx, service: tard };
  assert.equal(/commence la veille du service/.test(Moteur.calendrier(dinde.etapes(ctx2), ctx2)), false);
});

test('un service déjà entamé déclenche l’avertissement, pas un service à venir', () => {
  const p = piece();
  const passe = new Date(Date.now() + 30 * 60000);        // dans 30 min : trop tard
  const futur = new Date(Date.now() + 30 * 24 * 3600000); // dans un mois : tout va bien
  assert.match(Moteur.calendrier(p.etapes(ctxDe(passe)), ctxDe(passe)), /L’horloge est contre vous/);
  assert.equal(/L’horloge est contre vous/.test(Moteur.calendrier(p.etapes(ctxDe(futur)), ctxDe(futur))), false);
});

test('le changement d’heure ne décale pas le calendrier', () => {
  // Nuit du 1er novembre 2026 : deux heures du matin sonnent deux fois. Le
  // calendrier raisonne en durées absolues ; l'heure affichée doit rester
  // celle qu'indiquera l'horloge murale.
  const service = new Date(2026, 10, 1, 12, 0);
  const p = piece();
  const ctx = ctxDe(service, p.poids.max);
  const etapes = p.etapes(ctx);
  const totalJour = etapes.filter((e) => e.quand === 'jour').reduce((s, e) => s + e.duree, 0);
  const attendu = Moteur.heure(new Date(service.getTime() - totalJour * 60000));
  assert.equal(moments(Moteur.calendrier(etapes, ctx))[1], attendu);
});

test('le calendrier échappe ce qu’il affiche', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  const etapes = [{ quand: 'jour', titre: '<script>alert(1)</script>', duree: 10 }];
  const html = Moteur.calendrier(etapes, { service, poids: 1000, cuisson: null, equip: {} });
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
});
