/**
 * Catalogue de référence : rayons, détaillants et articles.
 *
 * C'est le seul fichier à modifier pour ajouter un rayon, une enseigne ou un
 * produit permanent. Les articles sont écrits comme de simples listes de noms
 * regroupées par rayon ; l'identifiant technique de chaque article est dérivé
 * de son nom (voir `identifiant()`), ce qui le garde stable d'une version à
 * l'autre sans avoir à numéroter quoi que ce soit à la main.
 */

/** Rayons du magasin, dans l'ordre de parcours des allées. */
export const RAYONS = [
  { id: 'produce',   nom: 'Fruits & Légumes',      emoji: '🥬' },
  { id: 'meats',     nom: 'Viandes & Volailles',   emoji: '🥩' },
  { id: 'seafood',   nom: 'Poissons & Fruits de mer', emoji: '🐟' },
  { id: 'dairy',     nom: 'Produits laitiers',     emoji: '🧀' },
  { id: 'bakery',    nom: 'Boulangerie & Pains',   emoji: '🥖' },
  { id: 'pantry',    nom: 'Épicerie & Conserves',  emoji: '🥫' },
  { id: 'frozen',    nom: 'Surgelés',              emoji: '🧊' },
  { id: 'snacks',    nom: 'Collations & Desserts', emoji: '🍪' },
  { id: 'drinks',    nom: 'Boissons & Alcools',    emoji: '🍷' },
  { id: 'household', nom: 'Entretien & Ménage',    emoji: '🧴' },
  { id: 'paper',     nom: 'Papier & Jetable',      emoji: '🧻' },
  { id: 'misc',      nom: 'Divers & Animaux',      emoji: '🐾' },
];

/** Rayon utilisé quand un article arrive sans rayon reconnaissable. */
export const RAYON_DEFAUT = 'misc';

/**
 * Détaillants de la région de Québec. `teinte` est un angle de teinte HSL :
 * la pastille de couleur est calculée à partir de là, ce qui garantit un
 * contraste correct en thème clair comme en thème sombre.
 */
export const DETAILLANTS = [
  { nom: 'Maxi',           teinte: 152 },
  { nom: 'Super C',        teinte: 0 },
  { nom: 'IGA',            teinte: 340 },
  { nom: 'Métro',          teinte: 214 },
  { nom: 'Walmart',        teinte: 200 },
  { nom: 'Costco',         teinte: 4 },
  { nom: 'Jean Coutu',     teinte: 258 },
  { nom: 'Pharmaprix',     teinte: 12 },
  { nom: 'Uniprix',        teinte: 188 },
  { nom: 'Brunet',         teinte: 172 },
  { nom: 'Familiprix',     teinte: 132 },
  { nom: 'Dollarama',      teinte: 40 },
  { nom: 'Bulk Barn',      teinte: 52 },
  { nom: 'Avril Santé',    teinte: 96 },
  { nom: 'Marché Adonis',  teinte: 26 },
  { nom: 'SAQ',            teinte: 282 },
  { nom: 'Autre / Marché', teinte: 220 },
];

/**
 * Articles permanents, regroupés par rayon. Ajouter un produit = ajouter une
 * ligne dans la bonne liste.
 */
const CATALOGUE = {
  produce: [
    'Piment vert',
    'Piment rouge',
    'Piment jaune',
    'Tomates',
    'Tomates cerises / mini tomates',
    'Avocats',
    'Brocoli',
    'Chou-fleur',
    'Chou vert',
    'Navet',
    'Betteraves fraîches',
    'Cœur de céleri',
    'Poireau',
    'Carottes de différentes couleurs',
    'Champignons blancs',
    'Échalotes',
    'Échalotes françaises',
    'Oignon blanc',
    'Oignon rouge',
    'Fèves vertes et jaunes',
    'Épinards',
    'Blé d’Inde',
    'Patate douce',
    'Patates grelots / Patates',
    'Salade en plastique',
    'Trempette de légumes',
    'Bananes',
    'Framboises',
    'Bleuets',
    'Fraises',
    'Clémentines',
    'Citrons',
    'Limes',
    'Ananas',
    'Raisins verts ou rouges',
  ],
  meats: [
    'Porc haché',
    'Veau haché',
    'Dinde hachée',
    'Steak haché extra maigre',
    'Cuisses de poulet',
    'Poitrine de poulet',
    'Brochettes de poulet',
    'Poulet entier cuit',
    'Cœurs de poulet congelés',
    'Patte de cochon',
    'Jambon',
    'Bacon tranché mince',
    'Creton',
    'Boudin',
    'Saucisses à déjeuner',
    'Petite saucisse',
    'Saucisses hot-dog / porc & bœuf',
    'Pâté de foie gras',
    'Pâté chinois',
    'Viande à lunch (charcuterie)',
  ],
  seafood: [
    'Saumon fumé',
    'Saumon (morceau)',
    'Saumon farci aux crevettes',
    'Turbot',
    'Huîtres fraîches',
    'Crabe arrangé / défait',
  ],
  dairy: [
    'Lait 3.25%',
    'Lait 2%',
    'Lait 2% sans lactose',
    'Crème 35%',
    'Beurre sans sel',
    'Beurre salé',
    'Fromage Boivin',
    'Fromage bleu',
    'Fromage Feta',
    'Grosse meule de Fromage Brie',
    'Fromage Velveeta en tranches',
    'Fromage en crotte',
    'Yogourt grec nature',
    'Bio-K à la mangue',
    'Cool Whip',
  ],
  bakery: [
    'Pain baguette',
    'Pain Grand-Père',
    'Pain tranché brioché',
    'Pain blanc/brun tranché',
    'Pain hot-dog',
    'Pain hamburger',
    'Sandwich préparé',
  ],
  pantry: [
    'Confiture de framboises',
    'Pois chiches en conserve',
    'Betteraves tranchées (Habitant)',
    'Olives Kalamata TRANCHÉES',
    'Câpres',
    'Soupe aux pois',
    'Fèves aux lard',
    'Sauce brune en conserve',
    'Sauce hot chicken en conserve',
    'Sauce orange et gingembre',
    'Riz arborio',
    'Riz basmati',
    'Riz sauvage',
    'Riz Danty au poulet',
    'Lentilles',
    'Orge perlé',
    'Quinoa',
    'Avoine Bêlait / Gruau érable',
    'Graines de lin',
    'Graines de chanvre',
    'Canneberges séchées/fraîches',
    'Chapelure',
    'Huile d’avocat',
    'Pam à l’olive',
    'Épices Clamato / Bloody Caesar',
    'Paprika moulu',
    'Sirop d’érable',
    'Café de qualité (vrac/moulu)',
    'Café en grains',
    'Œufs extra gros',
    'Compote de pommes (Jean-Marc)',
    'Collagène en poudre',
  ],
  frozen: [
    'Frites congelées ondulées',
    'Patates congelées',
    'Mini fondues',
  ],
  snacks: [
    'Chips Ruffles crème sure / Rég.',
    'Chips (assortiment)',
    'Méli-mélo',
    'Biscuits (boîte 34)',
    'Palette Caramilk',
    'Tartes au sucre',
    'Tarte aux pommes',
    'Gâteau Reine Elizabeth',
    'Gâteaux Vachon (Mille-feuilles)',
    'Crème glacée vanille',
    'Bûche de Noël crème glacée',
  ],
  drinks: [
    'Bouteilles d’eau',
    'Jus de pomme à l’ancienne',
    'Jus d’orange & mangue',
    'Jus de canneberge',
    'Jus vert de légumes',
    'Clamato (petites bouteilles)',
    'Liqueur (boisson gazeuse)',
    'Pepsi diète (mini)',
    'Pepsi ordinaire (mini)',
    'Vin blanc sans alcool',
    'Vin blanc Sancerre',
    'Vin blanc Chablis',
    'Grey Goose',
  ],
  household: [
    'Savon à linge',
    'Fleecy / Assouplisseur liquide',
    'Spray n Wash (détachant)',
    'Savon à vaisselle',
    'M. Net / Vim',
    'Hertel',
    'Fantastik',
    'Perfection',
    'Gants de plastique (médium)',
    'Sulcowarp pellicule plastique',
  ],
  paper: [
    'Papier de toilette',
    'Kleenex',
    'Essuie-tout (Scott Towers)',
    'Serviettes de table (Napkins)',
    'Verres à vin en plastique',
    'Verres en plastique 10 oz',
    'Ustensiles en plastique',
  ],
  misc: [
    'Plant de basilic',
    'Canne/Nourriture pour Elliot',
    'Batteries / Piles',
    'Agenda 2026',
  ],
};

/**
 * Retire les accents et la ponctuation d'une chaîne pour la comparer ou en
 * faire un identifiant. Sert aussi à la recherche : « epinard » trouve
 * « Épinards ».
 */
export function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Dérive un identifiant stable et lisible à partir du nom d'un article. */
export function identifiant(nom) {
  const base = normaliser(nom)
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'article';
}

/**
 * Construit la liste plate des articles du catalogue. Les identifiants en
 * double (deux produits au nom trop proche) reçoivent un suffixe numérique
 * pour rester distincts.
 */
export function articlesDuCatalogue() {
  const vus = new Map();
  const articles = [];

  for (const rayon of RAYONS) {
    for (const nom of CATALOGUE[rayon.id] ?? []) {
      const base = identifiant(nom);
      const rang = (vus.get(base) ?? 0) + 1;
      vus.set(base, rang);
      articles.push({
        id: rang === 1 ? base : `${base}-${rang}`,
        nom,
        qte: '',
        magasin: '',
        rayon: rayon.id,
        coche: false,
        catalogue: true,
      });
    }
  }

  return articles;
}

/*
 * Les index rayon → métadonnées vivent dans `etat.js` (`rayonParId`,
 * `magasinParNom`) : ils doivent tenir compte des rayons et magasins créés par
 * l'utilisateur, que ce fichier ignore.
 */
