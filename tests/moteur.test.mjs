/**
 * Le moteur : formats d'affichage et calendrier à rebours.
 *
 * Ce sont des fonctions pures — aucune raison de les laisser sans filet, et
 * beaucoup de raisons de les tenir : les nombres qu'elles produisent sont ceux
 * que l'on lit debout devant le four.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { chargerMoteur, MAINTENANT } from './aide/cuisine.mjs';

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

/**
 * Un contexte daté. `maintenant` est fourni explicitement : le calendrier ne
 * consulte plus l'horloge de la machine, si bien que ces tests disent la même
 * chose à trois heures du matin qu'à midi, et en janvier qu'en août.
 */
const ctxDe = (service, poids, maintenant = MAINTENANT) => {
  const p = piece();
  return { poids: poids ?? p.poids.defaut, cuisson: p.cuissons[1], equip: {}, service, maintenant };
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
  const ctx = { poids: dinde.poids.defaut, cuisson: dinde.cuissons?.[0] ?? null, equip: {}, service, maintenant: MAINTENANT };
  const liste = moments(Moteur.calendrier(dinde.etapes(ctx), ctx));

  assert.ok(liste.some((m) => /^\d+ jours avant$/.test(m)), `aucun « N jours avant » dans ${liste.join(' / ')}`);
  assert.equal(liste.some((m) => /^1 jours avant$/.test(m)), false, 'le singulier doit rester au singulier');
});

test('le calendrier prévient quand le jour même commence la veille', () => {
  const dinde = PIECES.find((p) => /dinde/i.test(p.nom));
  const tot = new Date(2026, 11, 25, 6, 0);   // service très tôt : on remonte avant minuit
  const ctx = { poids: dinde.poids.max, cuisson: dinde.cuissons?.[0] ?? null, equip: {}, service: tot, maintenant: MAINTENANT };
  assert.match(Moteur.calendrier(dinde.etapes(ctx), ctx), /commence la veille du service/);

  const tard = new Date(2026, 11, 25, 19, 0);
  const ctx2 = { ...ctx, service: tard };
  assert.equal(/commence la veille du service/.test(Moteur.calendrier(dinde.etapes(ctx2), ctx2)), false);
});

/** Le calendrier prévient-il qu'il faudrait déjà avoir commencé ? */
function enRetard(service, maintenant) {
  const ctx = ctxDe(service, undefined, maintenant);
  return /L’horloge est contre vous/.test(Moteur.calendrier(piece().etapes(ctx), ctx));
}

/** L'heure à laquelle il faudrait se mettre au travail pour servir à `service`. */
function departDuJour(service) {
  const ctx = ctxDe(service);
  const total = piece().etapes(ctx).filter((e) => e.quand === 'jour').reduce((s, e) => s + e.duree, 0);
  return new Date(service.getTime() - total * 60000);
}

test('l’avertissement de retard ne dépend plus de l’heure qu’il est vraiment', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  const depart = departDuJour(service);
  const enPleinTravail = new Date(Math.round((depart.getTime() + service.getTime()) / 2));

  // La même question posée depuis n'importe quel moment reçoit la réponse que
  // ce moment commande — et rien d'autre ne s'en mêle.
  const aTemps = [new Date(2026, 0, 1, 3, 0), new Date(2025, 11, 31, 23, 59), new Date(depart.getTime() - 3600000)];
  for (const maintenant of aTemps) {
    assert.equal(enRetard(service, maintenant), false, `depuis ${maintenant.toISOString()}`);
  }

  const tropTard = [enPleinTravail, new Date(service.getTime() - 60000)];
  for (const maintenant of tropTard) {
    assert.equal(enRetard(service, maintenant), true, `depuis ${maintenant.toISOString()}`);
  }
});

test('l’avertissement s’allume à la minute où le départ est manqué', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  const depart = departDuJour(service);

  assert.equal(enRetard(service, new Date(depart.getTime() - 60000)), false, 'une minute avant le départ : tout va bien');
  assert.equal(enRetard(service, depart), false, 'pile à l’heure du départ : encore temps');
  assert.equal(enRetard(service, new Date(depart.getTime() + 60000)), true, 'une minute trop tard : on prévient');
});

test('un service déjà passé ne fait pas courir aux fourneaux', () => {
  const service = new Date(2026, 7, 29, 18, 0);
  assert.equal(enRetard(service, new Date(2026, 7, 29, 17, 59)), true, 'une minute avant le service : il est trop tard, mais on peut encore agir');
  assert.equal(enRetard(service, service), false, 'à l’heure du service : plus rien à dire');
  assert.equal(enRetard(service, new Date(2026, 7, 30, 9, 0)), false, 'le lendemain : la recette se consulte, elle ne se court plus');
});

test('sans horloge fournie, le moteur retombe sur celle de la machine', () => {
  // C'est ce que fait l'application : `ctx.maintenant` lui est inutile.
  const p = piece();
  const service = new Date(Date.now() + 365 * 24 * 3600000);
  const ctx = { poids: p.poids.defaut, cuisson: p.cuissons[1], equip: {}, service };
  assert.doesNotThrow(() => Moteur.calendrier(p.etapes(ctx), ctx));
  assert.equal(/L’horloge est contre vous/.test(Moteur.calendrier(p.etapes(ctx), ctx)), false,
    'un service dans un an ne saurait être en retard');
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
  const html = Moteur.calendrier(etapes, { service, poids: 1000, cuisson: null, equip: {}, maintenant: MAINTENANT });
  assert.equal(html.includes('<script>'), false);
  assert.match(html, /&lt;script&gt;/);
});
