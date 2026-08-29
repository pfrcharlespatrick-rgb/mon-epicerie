/**
 * Filtres et regroupement : la règle qui décide de ce qu'on voit.
 *
 * `rendu.js` construit le DOM, mais deux fonctions y sont de pure décision et
 * se vérifient sans navigateur : `correspond()` — un article passe-t-il les
 * filtres ? — et `grouper()`. Les deux doivent juger d'un rayon inconnu de la
 * même façon, sans quoi un article s'affiche dans un groupe qu'aucun filtre
 * n'atteint.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { RACINE } from './aide/cuisine.mjs';
import { installerStockage } from './aide/stockage.mjs';

installerStockage();

const E = await import(path.join(RACINE, 'assets/js/etat.js'));
const R = await import(path.join(RACINE, 'assets/js/rendu.js'));

// L'index des rayons se construit au chargement : sans lui, tout rayon paraît
// inconnu. C'est ce que fait `app.js` avant le premier rendu.
E.charger();

const art = (extra = {}) => ({ id: 'a', nom: 'Truite', qte: '', magasin: '', rayon: 'produce', coche: false, catalogue: false, ...extra });

function filtres(champs) {
  Object.assign(E.etat, { rayonActif: 'tous', magasinActif: 'tous', recherche: '', groupement: 'rayon', ...champs });
}

test('sans filtre, tout passe', () => {
  filtres({});
  assert.equal(R.correspond(art()), true);
});

test('le filtre de rayon ne laisse passer que son rayon', () => {
  filtres({ rayonActif: 'produce' });
  assert.equal(R.correspond(art({ rayon: 'produce' })), true);
  assert.equal(R.correspond(art({ rayon: 'dairy' })), false);
});

test('le filtre « sans magasin » distingue le vide du reste', () => {
  filtres({ magasinActif: '__sans_magasin__' });
  assert.equal(R.correspond(art({ magasin: '' })), true);
  assert.equal(R.correspond(art({ magasin: 'Maxi' })), false);
});

test('la recherche ignore accents et casse, et fouille jusqu’au magasin', () => {
  filtres({ recherche: 'epinard' });
  assert.equal(R.correspond(art({ nom: 'Épinards' })), true);
  filtres({ recherche: 'maxi' });
  assert.equal(R.correspond(art({ magasin: 'Maxi' })), true);
  filtres({ recherche: '2 kg' });
  assert.equal(R.correspond(art({ qte: '2 kg' })), true);
  filtres({ recherche: 'introuvable' });
  assert.equal(R.correspond(art()), false);
});

test('les filtres se cumulent', () => {
  filtres({ rayonActif: 'produce', magasinActif: 'Maxi', recherche: 'truite' });
  assert.equal(R.correspond(art({ rayon: 'produce', magasin: 'Maxi', nom: 'Truite' })), true);
  assert.equal(R.correspond(art({ rayon: 'produce', magasin: 'IGA', nom: 'Truite' })), false);
});

test('un article dont le rayon a disparu reste atteignable par un filtre', () => {
  // Il s'affiche sous « Divers » au regroupement : le filtre « Divers » doit
  // donc le montrer aussi, sinon on le voit sans jamais pouvoir l'isoler.
  filtres({ rayonActif: 'misc' });
  const orphelin = art({ rayon: 'rayon-envole' });
  assert.equal(R.correspond(orphelin), true);

  filtres({});
  const groupes = R.grouper([orphelin]);
  assert.equal(groupes.length, 1);
  assert.equal(groupes[0].titre, 'Divers & Animaux');
});

test('le regroupement par rayon suit l’ordre des allées et saute les vides', () => {
  filtres({ groupement: 'rayon' });
  const groupes = R.grouper([art({ rayon: 'dairy', nom: 'Lait' }), art({ rayon: 'produce', nom: 'Tomates' })]);
  assert.deepEqual(groupes.map((g) => g.titre), ['Fruits & Légumes', 'Produits laitiers']);
  assert.ok(groupes.every((g) => g.articles.length > 0));
});

test('le regroupement par magasin rassemble les sans-magasin à part', () => {
  filtres({ groupement: 'magasin' });
  const groupes = R.grouper([
    art({ magasin: 'Maxi', nom: 'Lait' }),
    art({ magasin: '', nom: 'Pain' }),
    art({ magasin: 'Enseigne inconnue', nom: 'Truite' }),
  ]);
  const indetermine = groupes.find((g) => g.titre === 'Magasin à déterminer');
  assert.ok(indetermine, 'il faut un groupe pour les articles sans enseigne');
  assert.deepEqual(indetermine.articles.map((a) => a.nom), ['Pain', 'Truite'],
    'une enseigne inconnue rejoint les indéterminés plutôt que de disparaître');
  assert.equal(groupes.find((g) => g.titre === 'Maxi').articles.length, 1);
});

test('aucun article ne se perd au regroupement', () => {
  const articles = [
    art({ rayon: 'produce' }), art({ rayon: 'dairy' }),
    art({ rayon: 'inconnu' }), art({ rayon: 'misc' }),
  ];
  for (const groupement of ['rayon', 'magasin']) {
    filtres({ groupement });
    const total = R.grouper(articles).reduce((s, g) => s + g.articles.length, 0);
    assert.equal(total, articles.length, `regroupement par ${groupement}`);
  }
});
