/**
 * Le conseiller : la frontière avec le modèle.
 *
 * Tout ce qui entre ici vient d'ailleurs — la réponse d'un modèle, une
 * conversation en flux, un inventaire relu du navigateur. Ce sont des données,
 * jamais des promesses : la maison doit tenir même quand la réponse arrive
 * tronquée, enrobée de prose, ou pas du tout.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { charger, rapatrier } from './aide/cuisine.mjs';
import { installerStockage } from './aide/stockage.mjs';

const boite = installerStockage();

/** Une réponse en flux, telle que l'API la renvoie : des lignes « data: ». */
function reponseEnFlux(morceaux, { ok = true, status = 200, corps = {} } = {}) {
  if (!ok) return { ok, status, json: async () => corps };
  const encodeur = new TextEncoder();
  let i = 0;
  return {
    ok, status,
    body: {
      getReader: () => ({
        read: async () => (i < morceaux.length
          ? { done: false, value: encodeur.encode(morceaux[i++]) }
          : { done: true, value: undefined }),
      }),
    },
  };
}

const delta = (texte) => `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: texte } })}\n`;
const fin = (raison) => `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: raison } })}\n`;

/** Charge le conseiller avec un `fetch` de théâtre. */
function conseillerAvec(reponse) {
  const appels = [];
  const { Conseiller } = charger(['cuisine/assets/js/conseiller.js'], ['Conseiller'], {
    localStorage: globalThis.localStorage,
    fetch: async (url, options) => { appels.push({ url, options: JSON.parse(options.body) }); return reponse; },
    document: undefined,
  });
  return { Conseiller, appels };
}

const conseiller = () => conseillerAvec(reponseEnFlux([])).Conseiller;

// --- La clé -----------------------------------------------------------------

test('la clé se pose, se relit et s’efface', () => {
  boite.vider();
  const C = conseiller();
  assert.equal(C.cle(), '');
  C.definirCle('  sk-ant-exemple  ');
  assert.equal(C.cle(), 'sk-ant-exemple', 'les espaces de garde sont retirés');
  C.definirCle('');
  assert.equal(C.cle(), '');
});

// --- L'extraction du JSON ---------------------------------------------------

test('extraireJSON() retrouve l’objet même enrobé de prose ou de clôtures', () => {
  const C = conseiller();
  const lu = (texte) => rapatrier(C.extraireJSON(texte));
  assert.deepEqual(lu('{"titre":"Rôti"}'), { titre: 'Rôti' });
  assert.deepEqual(lu('Voici votre recette :\n{"titre":"Rôti"}\nBon appétit !'), { titre: 'Rôti' });
  assert.deepEqual(lu('```json\n{"titre":"Rôti"}\n```'), { titre: 'Rôti' });
  assert.deepEqual(lu('{"a":{"b":[1,2]},"c":"}"}'), { a: { b: [1, 2] }, c: '}' });
});

test('extraireJSON() rend null plutôt que de lever', () => {
  const C = conseiller();
  for (const texte of ['', 'aucune accolade', '{ tronqué', '}{', '{"a":]', '{"a":1', 'null']) {
    assert.equal(C.extraireJSON(texte), null, `« ${texte} »`);
  }
});

// --- L'inventaire -----------------------------------------------------------

test('l’inventaire absent rend trois zones vides plutôt que rien', () => {
  boite.vider();
  const stock = conseiller().inventaire();
  for (const zone of ['gardeManger', 'frigo', 'congelateur']) {
    assert.deepEqual(rapatrier(stock[zone]), { items: [], quand: null }, zone);
  }
});

test('l’inventaire écarte ce qui n’est pas un aliment nommé', () => {
  boite.vider();
  boite.poser('ma-cuisine.inventaire', {
    gardeManger: { items: ['farine', '', '   ', 42, null, { nom: 'sel' }, 'sauce soya'], quand: '2026-08-29' },
    frigo: { items: 'pas un tableau' },
    congelateur: null,
  });
  const stock = conseiller().inventaire();
  assert.deepEqual(rapatrier(stock.gardeManger.items), ['farine', 'sauce soya']);
  assert.equal(stock.gardeManger.quand, '2026-08-29');
  assert.deepEqual(rapatrier(stock.frigo.items), []);
  assert.deepEqual(rapatrier(stock.congelateur), { items: [], quand: null });
});

test('un inventaire illisible ne fait pas tomber la page', () => {
  boite.vider();
  boite.poserBrut('ma-cuisine.inventaire', '{pas du JSON');
  assert.doesNotThrow(() => conseiller().inventaire());
});

// --- La consultation en flux ------------------------------------------------

test('consulter() recompose le texte à travers les morceaux du flux', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([delta('Bonjour '), delta('la '), delta('cuisine.')]));
  assert.equal(await Conseiller.consulter([], null, 'charte'), 'Bonjour la cuisine.');
});

test('consulter() recolle un événement coupé au milieu par le réseau', async () => {
  const complet = delta('Côte de bœuf');
  const coupe = [complet.slice(0, 12), complet.slice(12, 30), complet.slice(30)];
  const { Conseiller } = conseillerAvec(reponseEnFlux(coupe));
  assert.equal(await Conseiller.consulter([], null, 'charte'), 'Côte de bœuf');
});

test('consulter() rapporte la progression au fil de l’eau', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([delta('abc'), delta('de')]));
  const vus = [];
  await Conseiller.consulter([], (n) => vus.push(n), 'charte');
  assert.deepEqual(vus, [3, 5]);
});

test('consulter() ignore les lignes qui ne sont pas des événements', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([
    ': ping\n', 'event: content_block_delta\n', 'data: {pas du JSON}\n', delta('utile'),
  ]));
  assert.equal(await Conseiller.consulter([], null, 'charte'), 'utile');
});

test('consulter() explique en français ce que le service a répondu', async () => {
  for (const [status, motif] of [[401, /clé est refusée/], [429, /très demandé/], [529, /surchargé/]]) {
    const { Conseiller } = conseillerAvec(reponseEnFlux([], { ok: false, status }));
    await assert.rejects(() => Conseiller.consulter([], null, 'charte'), motif, `statut ${status}`);
  }
});

test('consulter() reprend le message d’erreur du service quand il y en a un', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([], { ok: false, status: 400, corps: { error: { message: 'requête mal formée' } } }));
  await assert.rejects(() => Conseiller.consulter([], null, 'charte'), /requête mal formée/);
});

test('consulter() distingue une réponse écourtée d’un refus', async () => {
  const tronquee = conseillerAvec(reponseEnFlux([delta('début'), fin('max_tokens')]));
  await assert.rejects(() => tronquee.Conseiller.consulter([], null, 'charte'), /débordé la place prévue/);

  const refus = conseillerAvec(reponseEnFlux([fin('refusal')]));
  await assert.rejects(() => refus.Conseiller.consulter([], null, 'charte'), /préféré ne pas répondre/);

  const normale = conseillerAvec(reponseEnFlux([delta('tout va bien'), fin('end_turn')]));
  assert.equal(await normale.Conseiller.consulter([], null, 'charte'), 'tout va bien');
});

test('consulter() relaie une erreur survenue en cours de flux', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([
    delta('début'), `data: ${JSON.stringify({ type: 'error', error: { message: 'coupure' } })}\n`,
  ]));
  await assert.rejects(() => Conseiller.consulter([], null, 'charte'), /coupure/);
});

test('consulter() parle bien à l’API d’Anthropic, et à elle seule', async () => {
  const { Conseiller, appels } = conseillerAvec(reponseEnFlux([delta('ok')]));
  await Conseiller.consulter([{ role: 'user', content: 'bonjour' }], null, 'ma charte');
  assert.equal(appels.length, 1);
  assert.equal(appels[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(appels[0].options.stream, true);
  assert.equal(appels[0].options.system[0].text, 'ma charte');
});

// --- L'inventaire par la photo ---------------------------------------------

test('analyserInventaire() ne retient que des noms d’aliments', async () => {
  const { Conseiller } = conseillerAvec(reponseEnFlux([
    delta('Voici ce que je vois :\n["farine tout usage", "", 42, "lait 2 %"]\nBonne cuisine.'),
  ]));
  const liste = await Conseiller.analyserInventaire({ media_type: 'image/jpeg', data: 'AAAA' }, 'garde-manger');
  assert.deepEqual(rapatrier(liste), ['farine tout usage', 'lait 2 %']);
});

test('analyserInventaire() rend une liste vide quand la réponse n’en est pas une', async () => {
  for (const texte of ['aucun tableau ici', '[', '[tronqué', '{"a":1}']) {
    const { Conseiller } = conseillerAvec(reponseEnFlux([delta(texte)]));
    assert.deepEqual(rapatrier(await Conseiller.analyserInventaire({ media_type: 'image/jpeg', data: 'A' }, 'frigo')), [], texte);
  }
});

// --- Le premier tour --------------------------------------------------------

const contexteVide = { poids: null, service: null, equipement: [], epicerie: [], inventaire: null };
const texteDe = (message) => message.content.find((c) => c.type === 'text').text;

test('sans photo, le message le dit et s’appuie sur le stock', () => {
  const message = conseiller().premierTour(null, 'un souper pour quatre', contexteVide);
  assert.equal(message.content.some((c) => c.type === 'image'), false);
  assert.match(texteDe(message), /Pas de photo cette fois/);
  assert.match(texteDe(message), /un souper pour quatre/);
});

test('avec photo, l’image précède le texte', () => {
  const message = conseiller().premierTour({ media_type: 'image/jpeg', data: 'AAAA' }, '', contexteVide);
  assert.equal(message.content[0].type, 'image');
  assert.equal(message.content[0].source.data, 'AAAA');
  assert.match(texteDe(message), /Voici la pièce photographiée/);
});

test('un poids fourni fait foi ; sans lui, on le fait estimer', () => {
  const C = conseiller();
  const photo = { media_type: 'image/jpeg', data: 'A' };
  assert.match(texteDe(C.premierTour(photo, '', { ...contexteVide, poids: 1800 })), /1800 g — il fait foi/);
  assert.match(texteDe(C.premierTour(photo, '', contexteVide)), /lis-le sur l’étiquette, ou estime-le/);
  assert.match(texteDe(C.premierTour(null, '', contexteVide)), /Aucun poids fourni/);
});

test('le contexte de la maison accompagne la demande', () => {
  const message = conseiller().premierTour(null, 'quelque chose', {
    poids: null, service: '2026-08-29T18:00',
    equipement: ['thermomètre à sonde', 'cocotte'],
    epicerie: [{ nom: 'Poireau', qte: '2' }, { nom: 'Beurre', qte: '' }],
    inventaire: {
      gardeManger: { items: ['farine'] },
      frigo: { items: [] },
      congelateur: { items: ['poitrines de poulet'] },
    },
  });
  const texte = texteDe(message);
  assert.match(texte, /Heure du service visée : 2026-08-29T18:00/);
  assert.match(texte, /thermomètre à sonde, cocotte/);
  assert.match(texte, /Poireau \(2\), Beurre/);
  assert.match(texte, /garde-manger : farine ; congélateur : poitrines de poulet/);
  assert.equal(/frigidaire/.test(texte), false, 'une zone vide n’est pas annoncée');
});

test('les dates de péremption ne sont jamais demandées au conseiller', () => {
  const message = conseiller().premierTour({ media_type: 'image/jpeg', data: 'A' }, 'ma demande', contexteVide);
  assert.equal(/péremption|meilleur avant/i.test(texteDe(message)), false);
});
