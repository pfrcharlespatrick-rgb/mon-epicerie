/**
 * Le catalogue de départ du Domaine du Lac Péré : les emplacements, les
 * rayons et la liste des articles habituellement tenus en stock.
 *
 * Ce fichier est la seule chose à modifier pour changer ce que voient TOUS
 * les utilisateurs de l'application. Les quantités, elles, vivent dans le
 * navigateur de chacun : ajouter un article ici n'efface jamais un décompte.
 *
 * Un article :
 *   { id, nom, rayon, zone, unite, format, seuil }
 *   - id     : identifiant stable, en minuscules, jamais réutilisé
 *   - rayon  : classement comptable (voir RAYONS)
 *   - zone   : où l'article se trouve physiquement (voir ZONES)
 *   - unite  : ce qu'on compte (boîte, conserve, kg, caisse…)
 *   - format : la taille du contenant, pour lever toute ambiguïté
 *   - seuil  : quantité sous laquelle l'article passe « à commander »
 */

'use strict';

/** Les emplacements physiques, dans l'ordre d'une tournée d'inventaire. */
const ZONES = [
  { id: 'garde-manger', nom: 'Garde-manger', emoji: '🚪', note: 'Réserve sèche de la cuisine principale' },
  { id: 'armoires-cuisine', nom: 'Armoires de cuisine', emoji: '🗄️', note: 'Hauts et bas, autour du comptoir' },
  { id: 'refrigerateur', nom: 'Réfrigérateurs', emoji: '❄️', note: 'Frigos de la cuisine principale' },
  { id: 'congelateur', nom: 'Congélateurs', emoji: '🧊', note: 'Coffres et verticaux' },
  { id: 'reserve', nom: 'Réserve / entrepôt', emoji: '📦', note: 'Caisses non ouvertes, réserve de saison' },
  { id: 'bar', nom: 'Bar et salle à manger', emoji: '🍸', note: 'Bar, comptoir, salle des invités' },
  { id: 'chalets', nom: 'Chalets', emoji: '🏠', note: 'Literie, vaisselle et fournitures des chalets' },
  { id: 'buanderie', nom: 'Buanderie et entretien', emoji: '🧺', note: 'Laveuses, produits ménagers' },
  { id: 'hangar', nom: 'Hangar et quai', emoji: '⚓', note: 'Embarcations, moteurs, essence' },
  { id: 'atelier', nom: 'Atelier', emoji: '🔧', note: 'Outils, quincaillerie, pièces' },
  { id: 'boutique', nom: 'Boutique de pêche', emoji: '🎣', note: 'Articles de pêche vendus ou prêtés' },
  { id: 'bureau', nom: 'Bureau et accueil', emoji: '🗂️', note: 'Papeterie, registres, radio' },
  { id: 'infirmerie', nom: 'Sécurité et premiers soins', emoji: '🚑', note: 'Trousses, extincteurs, VFI' },
];

/** Le classement comptable du stock. L'ordre est celui du rapport imprimé. */
const RAYONS = [
  { id: 'sec', nom: 'Épicerie sèche et conserves', emoji: '🥫', famille: 'Épicerie' },
  { id: 'dejeuner', nom: 'Boulangerie et déjeuner', emoji: '🥐', famille: 'Épicerie' },
  { id: 'frais', nom: 'Frais et laitier', emoji: '🥛', famille: 'Épicerie' },
  { id: 'congele', nom: 'Congelé — viandes et légumes', emoji: '🧊', famille: 'Épicerie' },
  { id: 'condiments', nom: 'Condiments, épices et huiles', emoji: '🧂', famille: 'Épicerie' },
  { id: 'collations', nom: 'Collations et sucré', emoji: '🍪', famille: 'Épicerie' },
  { id: 'boissons', nom: 'Boissons et bar', emoji: '🥤', famille: 'Épicerie' },
  { id: 'cuisine', nom: 'Vaisselle et matériel de cuisine', emoji: '🍳', famille: 'Matériel' },
  { id: 'jetables', nom: 'Papier et jetables', emoji: '🧻', famille: 'Matériel' },
  { id: 'menage', nom: 'Entretien ménager et buanderie', emoji: '🧼', famille: 'Matériel' },
  { id: 'literie', nom: 'Literie et linge de maison', emoji: '🛏️', famille: 'Matériel' },
  { id: 'peche', nom: 'Pêche et embarcations', emoji: '🎣', famille: 'Matériel' },
  { id: 'carburant', nom: 'Carburants et propane', emoji: '⛽', famille: 'Matériel' },
  { id: 'outils', nom: 'Outils et quincaillerie', emoji: '🔧', famille: 'Matériel' },
  { id: 'securite', nom: 'Sécurité et premiers soins', emoji: '🚑', famille: 'Matériel' },
  { id: 'bureau', nom: 'Bureau et accueil', emoji: '🗂️', famille: 'Matériel' },
];

/** Les unités proposées à la saisie. */
const UNITES = [
  'unité', 'boîte', 'conserve', 'sac', 'caisse', 'paquet', 'bouteille', 'pot',
  'douzaine', 'rouleau', 'kg', 'lb', 'L', 'ml', 'gallon', 'poche', 'paire', 'jeu',
];

/**
 * Le stock habituel du domaine. Les quantités ne figurent pas ici : elles
 * sont saisies dans l'application, à la fermeture comme en cours de saison.
 */
const ARTICLES_DEPART = [

  /* --- Épicerie sèche et conserves ------------------------------------- */
  { id: 'sec-farine-tout-usage', nom: 'Farine tout usage', rayon: 'sec', zone: 'garde-manger', unite: 'sac', format: '10 kg', seuil: 2 },
  { id: 'sec-sucre-blanc', nom: 'Sucre blanc', rayon: 'sec', zone: 'garde-manger', unite: 'sac', format: '10 kg', seuil: 1 },
  { id: 'sec-cassonade', nom: 'Cassonade', rayon: 'sec', zone: 'garde-manger', unite: 'sac', format: '1 kg', seuil: 2 },
  { id: 'sec-riz-blanc', nom: 'Riz blanc à grains longs', rayon: 'sec', zone: 'garde-manger', unite: 'sac', format: '8 kg', seuil: 1 },
  { id: 'sec-pates-spaghetti', nom: 'Spaghetti', rayon: 'sec', zone: 'garde-manger', unite: 'paquet', format: '900 g', seuil: 4 },
  { id: 'sec-pates-penne', nom: 'Penne', rayon: 'sec', zone: 'garde-manger', unite: 'paquet', format: '900 g', seuil: 4 },
  { id: 'sec-pates-macaroni', nom: 'Macaroni', rayon: 'sec', zone: 'garde-manger', unite: 'paquet', format: '900 g', seuil: 3 },
  { id: 'sec-pommes-terre-flocons', nom: 'Pommes de terre en flocons', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 2 },
  { id: 'sec-legumineuses-seches', nom: 'Légumineuses sèches (fèves, pois)', rayon: 'sec', zone: 'garde-manger', unite: 'sac', format: '2 kg', seuil: 2 },
  { id: 'sec-conserve-tomates', nom: 'Tomates en conserve', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '796 ml', seuil: 12 },
  { id: 'sec-pate-tomate', nom: 'Pâte de tomate', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '156 ml', seuil: 8 },
  { id: 'sec-sauce-tomate', nom: 'Sauce tomate', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '680 ml', seuil: 8 },
  { id: 'sec-conserve-mais', nom: 'Maïs en grains', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '341 ml', seuil: 12 },
  { id: 'sec-conserve-pois', nom: 'Petits pois', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '398 ml', seuil: 12 },
  { id: 'sec-conserve-feves-brunes', nom: 'Fèves au lard', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '398 ml', seuil: 12 },
  { id: 'sec-conserve-thon', nom: 'Thon en conserve', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '170 g', seuil: 12 },
  { id: 'sec-conserve-saumon', nom: 'Saumon en conserve', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '213 g', seuil: 6 },
  { id: 'sec-soupe-conserve', nom: 'Soupes en conserve', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '284 ml', seuil: 12 },
  { id: 'sec-bouillon-poulet', nom: 'Bouillon de poulet', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '900 ml', seuil: 6 },
  { id: 'sec-bouillon-boeuf', nom: 'Bouillon de bœuf', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '900 ml', seuil: 6 },
  { id: 'sec-lait-evapore', nom: 'Lait évaporé', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '354 ml', seuil: 8 },
  { id: 'sec-lait-poudre', nom: 'Lait en poudre', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 2 },
  { id: 'sec-fruits-conserve', nom: 'Fruits en conserve', rayon: 'sec', zone: 'garde-manger', unite: 'conserve', format: '540 ml', seuil: 6 },
  { id: 'sec-cornichons', nom: 'Cornichons', rayon: 'sec', zone: 'garde-manger', unite: 'pot', format: '1 L', seuil: 3 },
  { id: 'sec-olives', nom: 'Olives', rayon: 'sec', zone: 'garde-manger', unite: 'pot', format: '375 ml', seuil: 3 },
  { id: 'sec-chapelure', nom: 'Chapelure', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 2 },
  { id: 'sec-melange-frit', nom: 'Mélange à friture / panure à poisson', rayon: 'sec', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 3 },

  /* --- Boulangerie et déjeuner ----------------------------------------- */
  { id: 'dej-pain-tranche', nom: 'Pain tranché', rayon: 'dejeuner', zone: 'congelateur', unite: 'paquet', format: '675 g', seuil: 6 },
  { id: 'dej-pain-hamburger', nom: 'Pains à hamburger', rayon: 'dejeuner', zone: 'congelateur', unite: 'paquet', format: '8 pains', seuil: 4 },
  { id: 'dej-pain-hotdog', nom: 'Pains à hot-dog', rayon: 'dejeuner', zone: 'congelateur', unite: 'paquet', format: '12 pains', seuil: 4 },
  { id: 'dej-tortillas', nom: 'Tortillas', rayon: 'dejeuner', zone: 'garde-manger', unite: 'paquet', format: '10 unités', seuil: 3 },
  { id: 'dej-cereales', nom: 'Céréales à déjeuner', rayon: 'dejeuner', zone: 'garde-manger', unite: 'boîte', format: '600 g', seuil: 4 },
  { id: 'dej-gruau', nom: 'Gruau', rayon: 'dejeuner', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 3 },
  { id: 'dej-melange-crepes', nom: 'Mélange à crêpes', rayon: 'dejeuner', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 3 },
  { id: 'dej-sirop-erable', nom: 'Sirop d’érable', rayon: 'dejeuner', zone: 'garde-manger', unite: 'bouteille', format: '540 ml', seuil: 3 },
  { id: 'dej-confiture', nom: 'Confitures', rayon: 'dejeuner', zone: 'garde-manger', unite: 'pot', format: '250 ml', seuil: 4 },
  { id: 'dej-beurre-arachide', nom: 'Beurre d’arachide', rayon: 'dejeuner', zone: 'garde-manger', unite: 'pot', format: '1 kg', seuil: 2 },
  { id: 'dej-miel', nom: 'Miel', rayon: 'dejeuner', zone: 'garde-manger', unite: 'pot', format: '500 g', seuil: 2 },

  /* --- Frais et laitier -------------------------------------------------- */
  { id: 'frais-lait', nom: 'Lait 2 %', rayon: 'frais', zone: 'refrigerateur', unite: 'L', format: '2 L', seuil: 4 },
  { id: 'frais-creme-35', nom: 'Crème 35 %', rayon: 'frais', zone: 'refrigerateur', unite: 'L', format: '1 L', seuil: 2 },
  { id: 'frais-creme-15', nom: 'Crème à café 15 %', rayon: 'frais', zone: 'refrigerateur', unite: 'L', format: '1 L', seuil: 2 },
  { id: 'frais-beurre', nom: 'Beurre', rayon: 'frais', zone: 'refrigerateur', unite: 'lb', format: '454 g', seuil: 4 },
  { id: 'frais-margarine', nom: 'Margarine', rayon: 'frais', zone: 'refrigerateur', unite: 'pot', format: '1 kg', seuil: 2 },
  { id: 'frais-oeufs', nom: 'Œufs', rayon: 'frais', zone: 'refrigerateur', unite: 'douzaine', format: '12 œufs', seuil: 6 },
  { id: 'frais-fromage-cheddar', nom: 'Fromage cheddar', rayon: 'frais', zone: 'refrigerateur', unite: 'unité', format: 'bloc 700 g', seuil: 3 },
  { id: 'frais-fromage-tranche', nom: 'Fromage en tranches', rayon: 'frais', zone: 'refrigerateur', unite: 'paquet', format: '500 g', seuil: 3 },
  { id: 'frais-fromage-rape', nom: 'Fromage râpé', rayon: 'frais', zone: 'refrigerateur', unite: 'sac', format: '1 kg', seuil: 2 },
  { id: 'frais-yogourt', nom: 'Yogourt', rayon: 'frais', zone: 'refrigerateur', unite: 'pot', format: '750 g', seuil: 3 },
  { id: 'frais-charcuterie', nom: 'Charcuteries tranchées', rayon: 'frais', zone: 'refrigerateur', unite: 'paquet', format: '375 g', seuil: 4 },
  { id: 'frais-bacon', nom: 'Bacon', rayon: 'frais', zone: 'refrigerateur', unite: 'paquet', format: '500 g', seuil: 6 },
  { id: 'frais-saucisses-dejeuner', nom: 'Saucisses à déjeuner', rayon: 'frais', zone: 'refrigerateur', unite: 'paquet', format: '500 g', seuil: 4 },
  { id: 'frais-pommes-terre', nom: 'Pommes de terre', rayon: 'frais', zone: 'reserve', unite: 'poche', format: '10 lb', seuil: 2 },
  { id: 'frais-oignons', nom: 'Oignons', rayon: 'frais', zone: 'reserve', unite: 'poche', format: '5 lb', seuil: 2 },
  { id: 'frais-carottes', nom: 'Carottes', rayon: 'frais', zone: 'refrigerateur', unite: 'sac', format: '2 lb', seuil: 2 },
  { id: 'frais-laitue', nom: 'Laitue', rayon: 'frais', zone: 'refrigerateur', unite: 'unité', format: 'pomme', seuil: 2 },
  { id: 'frais-tomates', nom: 'Tomates fraîches', rayon: 'frais', zone: 'refrigerateur', unite: 'kg', format: 'au kilo', seuil: 2 },
  { id: 'frais-citrons', nom: 'Citrons', rayon: 'frais', zone: 'refrigerateur', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'frais-pommes', nom: 'Pommes', rayon: 'frais', zone: 'refrigerateur', unite: 'sac', format: '3 lb', seuil: 2 },

  /* --- Congelé ----------------------------------------------------------- */
  { id: 'cong-boeuf-hache', nom: 'Bœuf haché', rayon: 'congele', zone: 'congelateur', unite: 'lb', format: 'paquets 1 lb', seuil: 10 },
  { id: 'cong-steaks', nom: 'Steaks', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: 'portion', seuil: 12 },
  { id: 'cong-roti-boeuf', nom: 'Rôtis de bœuf', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: '2 à 3 kg', seuil: 2 },
  { id: 'cong-poitrines-poulet', nom: 'Poitrines de poulet', rayon: 'congele', zone: 'congelateur', unite: 'boîte', format: '4 kg', seuil: 2 },
  { id: 'cong-poulet-entier', nom: 'Poulets entiers', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: '1,5 kg', seuil: 3 },
  { id: 'cong-porc-cotelettes', nom: 'Côtelettes de porc', rayon: 'congele', zone: 'congelateur', unite: 'paquet', format: '1 kg', seuil: 4 },
  { id: 'cong-jambon', nom: 'Jambon', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: '3 kg', seuil: 2 },
  { id: 'cong-saucisses', nom: 'Saucisses à hot-dog', rayon: 'congele', zone: 'congelateur', unite: 'paquet', format: '450 g', seuil: 6 },
  { id: 'cong-poisson-filets', nom: 'Filets de poisson', rayon: 'congele', zone: 'congelateur', unite: 'boîte', format: '4 kg', seuil: 2 },
  { id: 'cong-crevettes', nom: 'Crevettes', rayon: 'congele', zone: 'congelateur', unite: 'sac', format: '1 kg', seuil: 2 },
  { id: 'cong-frites', nom: 'Frites surgelées', rayon: 'congele', zone: 'congelateur', unite: 'sac', format: '2 kg', seuil: 4 },
  { id: 'cong-legumes-melange', nom: 'Légumes surgelés mélangés', rayon: 'congele', zone: 'congelateur', unite: 'sac', format: '2 kg', seuil: 4 },
  { id: 'cong-brocoli', nom: 'Brocoli surgelé', rayon: 'congele', zone: 'congelateur', unite: 'sac', format: '2 kg', seuil: 2 },
  { id: 'cong-pain-a-cuire', nom: 'Pâte à pain / brioches à cuire', rayon: 'congele', zone: 'congelateur', unite: 'paquet', format: '6 unités', seuil: 3 },
  { id: 'cong-desserts', nom: 'Tartes et desserts congelés', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: 'tarte', seuil: 3 },
  { id: 'cong-glace', nom: 'Crème glacée', rayon: 'congele', zone: 'congelateur', unite: 'unité', format: '2 L', seuil: 2 },
  { id: 'cong-glacons', nom: 'Glace en sac', rayon: 'congele', zone: 'congelateur', unite: 'sac', format: '5 kg', seuil: 6 },

  /* --- Condiments, épices et huiles -------------------------------------- */
  { id: 'cond-huile-canola', nom: 'Huile de canola', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '3 L', seuil: 2 },
  { id: 'cond-huile-olive', nom: 'Huile d’olive', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '1 L', seuil: 2 },
  { id: 'cond-huile-friture', nom: 'Huile à friture', rayon: 'condiments', zone: 'reserve', unite: 'boîte', format: '16 L', seuil: 1 },
  { id: 'cond-vinaigre-blanc', nom: 'Vinaigre blanc', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '4 L', seuil: 1 },
  { id: 'cond-ketchup', nom: 'Ketchup', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '1 L', seuil: 3 },
  { id: 'cond-moutarde', nom: 'Moutarde', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '750 ml', seuil: 2 },
  { id: 'cond-mayonnaise', nom: 'Mayonnaise', rayon: 'condiments', zone: 'garde-manger', unite: 'pot', format: '1,8 L', seuil: 2 },
  { id: 'cond-relish', nom: 'Relish', rayon: 'condiments', zone: 'garde-manger', unite: 'pot', format: '750 ml', seuil: 2 },
  { id: 'cond-sauce-bbq', nom: 'Sauce BBQ', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '1 L', seuil: 2 },
  { id: 'cond-sauce-soya', nom: 'Sauce soya', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '500 ml', seuil: 2 },
  { id: 'cond-vinaigrette', nom: 'Vinaigrettes', rayon: 'condiments', zone: 'garde-manger', unite: 'bouteille', format: '475 ml', seuil: 3 },
  { id: 'cond-sel', nom: 'Sel de table', rayon: 'condiments', zone: 'garde-manger', unite: 'boîte', format: '1 kg', seuil: 3 },
  { id: 'cond-poivre', nom: 'Poivre moulu', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'pot', format: '200 g', seuil: 2 },
  { id: 'cond-epices-melange', nom: 'Épices à steak / mélanges', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'pot', format: '300 g', seuil: 2 },
  { id: 'cond-herbes-sechees', nom: 'Herbes séchées assorties', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'pot', format: '100 g', seuil: 6 },
  { id: 'cond-ail-poudre', nom: 'Ail en poudre', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'pot', format: '300 g', seuil: 2 },
  { id: 'cond-poudre-pate', nom: 'Poudre à pâte', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'boîte', format: '450 g', seuil: 2 },
  { id: 'cond-soda-cuisson', nom: 'Bicarbonate de soude', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'boîte', format: '500 g', seuil: 2 },
  { id: 'cond-vanille', nom: 'Extrait de vanille', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'bouteille', format: '100 ml', seuil: 1 },
  { id: 'cond-levure', nom: 'Levure sèche', rayon: 'condiments', zone: 'armoires-cuisine', unite: 'pot', format: '450 g', seuil: 1 },

  /* --- Collations et sucré ----------------------------------------------- */
  { id: 'coll-biscuits', nom: 'Biscuits', rayon: 'collations', zone: 'garde-manger', unite: 'paquet', format: '300 g', seuil: 6 },
  { id: 'coll-craquelins', nom: 'Craquelins', rayon: 'collations', zone: 'garde-manger', unite: 'boîte', format: '450 g', seuil: 4 },
  { id: 'coll-croustilles', nom: 'Croustilles', rayon: 'collations', zone: 'garde-manger', unite: 'sac', format: 'format familial', seuil: 8 },
  { id: 'coll-noix', nom: 'Noix mélangées', rayon: 'collations', zone: 'garde-manger', unite: 'pot', format: '700 g', seuil: 3 },
  { id: 'coll-barres-tendres', nom: 'Barres tendres', rayon: 'collations', zone: 'garde-manger', unite: 'boîte', format: '24 barres', seuil: 3 },
  { id: 'coll-chocolat', nom: 'Tablettes de chocolat', rayon: 'collations', zone: 'garde-manger', unite: 'unité', format: 'barre', seuil: 12 },
  { id: 'coll-pepites-chocolat', nom: 'Pépites de chocolat', rayon: 'collations', zone: 'armoires-cuisine', unite: 'sac', format: '1 kg', seuil: 1 },

  /* --- Boissons et bar ---------------------------------------------------- */
  { id: 'bois-cafe-moulu', nom: 'Café moulu', rayon: 'boissons', zone: 'garde-manger', unite: 'boîte', format: '925 g', seuil: 4 },
  { id: 'bois-cafe-filtres', nom: 'Filtres à café', rayon: 'boissons', zone: 'armoires-cuisine', unite: 'paquet', format: '100 filtres', seuil: 3 },
  { id: 'bois-the', nom: 'Thé', rayon: 'boissons', zone: 'armoires-cuisine', unite: 'boîte', format: '100 sachets', seuil: 2 },
  { id: 'bois-tisanes', nom: 'Tisanes', rayon: 'boissons', zone: 'armoires-cuisine', unite: 'boîte', format: '20 sachets', seuil: 2 },
  { id: 'bois-chocolat-chaud', nom: 'Chocolat chaud en poudre', rayon: 'boissons', zone: 'armoires-cuisine', unite: 'boîte', format: '1 kg', seuil: 2 },
  { id: 'bois-jus-orange', nom: 'Jus d’orange', rayon: 'boissons', zone: 'refrigerateur', unite: 'L', format: '1,75 L', seuil: 4 },
  { id: 'bois-jus-assortis', nom: 'Jus assortis en boîte', rayon: 'boissons', zone: 'reserve', unite: 'caisse', format: '24 unités', seuil: 2 },
  { id: 'bois-boissons-gazeuses', nom: 'Boissons gazeuses', rayon: 'boissons', zone: 'reserve', unite: 'caisse', format: '24 canettes', seuil: 4 },
  { id: 'bois-eau-embouteillee', nom: 'Eau embouteillée', rayon: 'boissons', zone: 'reserve', unite: 'caisse', format: '24 bouteilles', seuil: 4 },
  { id: 'bois-biere', nom: 'Bière', rayon: 'boissons', zone: 'bar', unite: 'caisse', format: '24 canettes', seuil: 6 },
  { id: 'bois-vin-rouge', nom: 'Vin rouge', rayon: 'boissons', zone: 'bar', unite: 'bouteille', format: '750 ml', seuil: 6 },
  { id: 'bois-vin-blanc', nom: 'Vin blanc', rayon: 'boissons', zone: 'bar', unite: 'bouteille', format: '750 ml', seuil: 6 },
  { id: 'bois-spiritueux', nom: 'Spiritueux', rayon: 'boissons', zone: 'bar', unite: 'bouteille', format: '750 ml', seuil: 4 },
  { id: 'bois-melangeurs', nom: 'Mélangeurs (tonic, soda, jus de lime)', rayon: 'boissons', zone: 'bar', unite: 'bouteille', format: '1 L', seuil: 4 },

  /* --- Vaisselle et matériel de cuisine ---------------------------------- */
  { id: 'cuis-assiettes', nom: 'Assiettes de service', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 24 },
  { id: 'cuis-bols', nom: 'Bols', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 24 },
  { id: 'cuis-verres', nom: 'Verres', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 24 },
  { id: 'cuis-tasses', nom: 'Tasses à café', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 24 },
  { id: 'cuis-ustensiles', nom: 'Ustensiles de table', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'jeu', format: 'couvert complet', seuil: 24 },
  { id: 'cuis-couteaux-chef', nom: 'Couteaux de cuisine', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'cuis-planches', nom: 'Planches à découper', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 3 },
  { id: 'cuis-chaudrons', nom: 'Chaudrons et casseroles', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'cuis-poeles', nom: 'Poêles', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'cuis-plaques', nom: 'Plaques de cuisson', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'cuis-friteuse', nom: 'Friteuse', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'appareil', seuil: 1 },
  { id: 'cuis-cafetiere', nom: 'Cafetières', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'appareil', seuil: 2 },
  { id: 'cuis-grille-pain', nom: 'Grille-pain', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'appareil', seuil: 1 },
  { id: 'cuis-thermometre', nom: 'Thermomètres à sonde', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 2 },
  { id: 'cuis-contenants', nom: 'Contenants de conservation', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 12 },
  { id: 'cuis-linges-vaisselle', nom: 'Linges à vaisselle', rayon: 'cuisine', zone: 'armoires-cuisine', unite: 'unité', format: 'à l’unité', seuil: 12 },

  /* --- Papier et jetables -------------------------------------------------- */
  { id: 'jet-papier-hygienique', nom: 'Papier hygiénique', rayon: 'jetables', zone: 'reserve', unite: 'caisse', format: '48 rouleaux', seuil: 2 },
  { id: 'jet-essuie-tout', nom: 'Essuie-tout', rayon: 'jetables', zone: 'reserve', unite: 'caisse', format: '24 rouleaux', seuil: 2 },
  { id: 'jet-serviettes-table', nom: 'Serviettes de table', rayon: 'jetables', zone: 'reserve', unite: 'paquet', format: '500 unités', seuil: 3 },
  { id: 'jet-assiettes-carton', nom: 'Assiettes de carton', rayon: 'jetables', zone: 'reserve', unite: 'paquet', format: '100 unités', seuil: 3 },
  { id: 'jet-verres-carton', nom: 'Verres jetables', rayon: 'jetables', zone: 'reserve', unite: 'paquet', format: '100 unités', seuil: 3 },
  { id: 'jet-ustensiles-jetables', nom: 'Ustensiles jetables', rayon: 'jetables', zone: 'reserve', unite: 'paquet', format: '100 unités', seuil: 2 },
  { id: 'jet-sacs-poubelle', nom: 'Sacs à ordures', rayon: 'jetables', zone: 'reserve', unite: 'boîte', format: '100 sacs', seuil: 2 },
  { id: 'jet-sacs-congelation', nom: 'Sacs de congélation', rayon: 'jetables', zone: 'armoires-cuisine', unite: 'boîte', format: '100 sacs', seuil: 3 },
  { id: 'jet-papier-aluminium', nom: 'Papier d’aluminium', rayon: 'jetables', zone: 'armoires-cuisine', unite: 'rouleau', format: '60 m', seuil: 3 },
  { id: 'jet-pellicule-plastique', nom: 'Pellicule plastique', rayon: 'jetables', zone: 'armoires-cuisine', unite: 'rouleau', format: '60 m', seuil: 2 },
  { id: 'jet-papier-parchemin', nom: 'Papier parchemin', rayon: 'jetables', zone: 'armoires-cuisine', unite: 'rouleau', format: '20 m', seuil: 2 },
  { id: 'jet-gants-jetables', nom: 'Gants jetables', rayon: 'jetables', zone: 'armoires-cuisine', unite: 'boîte', format: '100 gants', seuil: 3 },

  /* --- Entretien ménager et buanderie ------------------------------------ */
  { id: 'men-savon-vaisselle', nom: 'Savon à vaisselle', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '4 L', seuil: 2 },
  { id: 'men-lave-vaisselle', nom: 'Détergent à lave-vaisselle', rayon: 'menage', zone: 'buanderie', unite: 'boîte', format: '5 kg', seuil: 1 },
  { id: 'men-savon-lessive', nom: 'Savon à lessive', rayon: 'menage', zone: 'buanderie', unite: 'boîte', format: '9 kg', seuil: 1 },
  { id: 'men-javellisant', nom: 'Eau de Javel', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '3,6 L', seuil: 2 },
  { id: 'men-nettoyant-tout-usage', nom: 'Nettoyant tout usage', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '4 L', seuil: 2 },
  { id: 'men-nettoyant-vitres', nom: 'Nettoyant à vitres', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '1 L', seuil: 2 },
  { id: 'men-desinfectant', nom: 'Désinfectant de surfaces', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '1 L', seuil: 3 },
  { id: 'men-savon-mains', nom: 'Savon à mains', rayon: 'menage', zone: 'buanderie', unite: 'bouteille', format: '4 L', seuil: 2 },
  { id: 'men-eponges', nom: 'Éponges et tampons à récurer', rayon: 'menage', zone: 'buanderie', unite: 'paquet', format: '10 unités', seuil: 3 },
  { id: 'men-balais', nom: 'Balais et vadrouilles', rayon: 'menage', zone: 'buanderie', unite: 'unité', format: 'à l’unité', seuil: 3 },
  { id: 'men-seaux', nom: 'Seaux', rayon: 'menage', zone: 'buanderie', unite: 'unité', format: 'à l’unité', seuil: 3 },
  { id: 'men-chiffons', nom: 'Chiffons d’entretien', rayon: 'menage', zone: 'buanderie', unite: 'paquet', format: '12 unités', seuil: 3 },
  { id: 'men-insecticide', nom: 'Insecticide / attrape-mouches', rayon: 'menage', zone: 'buanderie', unite: 'unité', format: 'à l’unité', seuil: 4 },

  /* --- Literie et linge de maison ---------------------------------------- */
  { id: 'lit-draps-simple', nom: 'Draps — lit simple', rayon: 'literie', zone: 'chalets', unite: 'jeu', format: 'ensemble complet', seuil: 12 },
  { id: 'lit-draps-double', nom: 'Draps — lit double', rayon: 'literie', zone: 'chalets', unite: 'jeu', format: 'ensemble complet', seuil: 8 },
  { id: 'lit-couvertures', nom: 'Couvertures', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 20 },
  { id: 'lit-couvre-lits', nom: 'Couvre-lits', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 20 },
  { id: 'lit-oreillers', nom: 'Oreillers', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 20 },
  { id: 'lit-taies', nom: 'Taies d’oreiller', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 30 },
  { id: 'lit-serviettes-bain', nom: 'Serviettes de bain', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 30 },
  { id: 'lit-debarbouillettes', nom: 'Débarbouillettes', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 30 },
  { id: 'lit-tapis-bain', nom: 'Tapis de bain', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 10 },
  { id: 'lit-rideaux-douche', nom: 'Rideaux de douche', rayon: 'literie', zone: 'chalets', unite: 'unité', format: 'à l’unité', seuil: 4 },

  /* --- Pêche et embarcations ---------------------------------------------- */
  { id: 'pec-chaloupes', nom: 'Chaloupes', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 0 },
  { id: 'pec-moteurs', nom: 'Moteurs hors-bord', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 0 },
  { id: 'pec-reservoirs', nom: 'Réservoirs à essence portatifs', rayon: 'peche', zone: 'hangar', unite: 'unité', format: '25 L', seuil: 2 },
  { id: 'pec-helices', nom: 'Hélices de rechange', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 2 },
  { id: 'pec-ancres', nom: 'Ancres et cordages', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'pec-avirons', nom: 'Avirons', rayon: 'peche', zone: 'hangar', unite: 'paire', format: 'la paire', seuil: 4 },
  { id: 'pec-cannes', nom: 'Cannes à pêche', rayon: 'peche', zone: 'boutique', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'pec-moulinets', nom: 'Moulinets', rayon: 'peche', zone: 'boutique', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'pec-fil', nom: 'Fil à pêche', rayon: 'peche', zone: 'boutique', unite: 'unité', format: 'bobine', seuil: 4 },
  { id: 'pec-leurres', nom: 'Leurres et cuillers', rayon: 'peche', zone: 'boutique', unite: 'unité', format: 'à l’unité', seuil: 24 },
  { id: 'pec-hamecons', nom: 'Hameçons', rayon: 'peche', zone: 'boutique', unite: 'paquet', format: '25 unités', seuil: 6 },
  { id: 'pec-plombs', nom: 'Plombs et émerillons', rayon: 'peche', zone: 'boutique', unite: 'paquet', format: 'assorti', seuil: 6 },
  { id: 'pec-epuisettes', nom: 'Épuisettes', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'pec-couteaux-filet', nom: 'Couteaux à fileter', rayon: 'peche', zone: 'boutique', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'pec-glacieres', nom: 'Glacières', rayon: 'peche', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'pec-sacs-poisson', nom: 'Sacs à poisson', rayon: 'peche', zone: 'hangar', unite: 'paquet', format: '100 sacs', seuil: 2 },

  /* --- Carburants et propane ----------------------------------------------- */
  { id: 'carb-essence', nom: 'Essence', rayon: 'carburant', zone: 'hangar', unite: 'gallon', format: 'baril / gallons', seuil: 40 },
  { id: 'carb-diesel', nom: 'Diesel (génératrice)', rayon: 'carburant', zone: 'hangar', unite: 'gallon', format: 'baril / gallons', seuil: 40 },
  { id: 'carb-huile-2temps', nom: 'Huile à moteur 2 temps', rayon: 'carburant', zone: 'hangar', unite: 'bouteille', format: '1 L', seuil: 6 },
  { id: 'carb-huile-moteur', nom: 'Huile à moteur 4 temps', rayon: 'carburant', zone: 'hangar', unite: 'bouteille', format: '4 L', seuil: 3 },
  { id: 'carb-propane-20', nom: 'Bonbonnes de propane 20 lb', rayon: 'carburant', zone: 'hangar', unite: 'unité', format: '20 lb', seuil: 4 },
  { id: 'carb-propane-100', nom: 'Bonbonnes de propane 100 lb', rayon: 'carburant', zone: 'hangar', unite: 'unité', format: '100 lb', seuil: 2 },
  { id: 'carb-stabilisateur', nom: 'Stabilisateur à essence', rayon: 'carburant', zone: 'hangar', unite: 'bouteille', format: '500 ml', seuil: 2 },
  { id: 'carb-antigel', nom: 'Antigel', rayon: 'carburant', zone: 'atelier', unite: 'bouteille', format: '4 L', seuil: 2 },

  /* --- Outils et quincaillerie --------------------------------------------- */
  { id: 'out-coffre-outils', nom: 'Coffres à outils complets', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 1 },
  { id: 'out-perceuse', nom: 'Perceuses sans fil', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 2 },
  { id: 'out-scie', nom: 'Scies', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 2 },
  { id: 'out-vis-clous', nom: 'Vis et clous assortis', rayon: 'outils', zone: 'atelier', unite: 'boîte', format: 'assorti', seuil: 4 },
  { id: 'out-ruban-adhesif', nom: 'Ruban adhésif (duct tape)', rayon: 'outils', zone: 'atelier', unite: 'rouleau', format: 'à l’unité', seuil: 4 },
  { id: 'out-cordage', nom: 'Cordage', rayon: 'outils', zone: 'atelier', unite: 'rouleau', format: '30 m', seuil: 2 },
  { id: 'out-piles', nom: 'Piles (AA, AAA, D)', rayon: 'outils', zone: 'atelier', unite: 'paquet', format: 'assorti', seuil: 6 },
  { id: 'out-ampoules', nom: 'Ampoules', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 12 },
  { id: 'out-lampes-poche', nom: 'Lampes de poche', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'out-generatrice-pieces', nom: 'Pièces de génératrice (filtres, bougies)', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'assorti', seuil: 2 },
  { id: 'out-peinture', nom: 'Peinture et pinceaux', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'à l’unité', seuil: 2 },
  { id: 'out-bois', nom: 'Bois de réparation', rayon: 'outils', zone: 'atelier', unite: 'unité', format: 'planches', seuil: 10 },

  /* --- Sécurité et premiers soins ------------------------------------------ */
  { id: 'sur-trousses', nom: 'Trousses de premiers soins', rayon: 'securite', zone: 'infirmerie', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'sur-pansements', nom: 'Pansements et bandages', rayon: 'securite', zone: 'infirmerie', unite: 'boîte', format: 'assorti', seuil: 4 },
  { id: 'sur-antiseptique', nom: 'Antiseptique', rayon: 'securite', zone: 'infirmerie', unite: 'bouteille', format: '500 ml', seuil: 2 },
  { id: 'sur-analgesiques', nom: 'Analgésiques', rayon: 'securite', zone: 'infirmerie', unite: 'boîte', format: '100 comprimés', seuil: 2 },
  { id: 'sur-vfi', nom: 'Vestes de flottaison (VFI)', rayon: 'securite', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 20 },
  { id: 'sur-extincteurs', nom: 'Extincteurs', rayon: 'securite', zone: 'infirmerie', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'sur-detecteurs-fumee', nom: 'Détecteurs de fumée', rayon: 'securite', zone: 'infirmerie', unite: 'unité', format: 'à l’unité', seuil: 8 },
  { id: 'sur-fusees-detresse', nom: 'Fusées de détresse', rayon: 'securite', zone: 'hangar', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'sur-couvertures-survie', nom: 'Couvertures de survie', rayon: 'securite', zone: 'infirmerie', unite: 'unité', format: 'à l’unité', seuil: 6 },
  { id: 'sur-chasse-moustiques', nom: 'Chasse-moustiques', rayon: 'securite', zone: 'boutique', unite: 'unité', format: '200 ml', seuil: 12 },

  /* --- Bureau et accueil ---------------------------------------------------- */
  { id: 'bur-radios', nom: 'Radios VHF / émetteurs-récepteurs', rayon: 'bureau', zone: 'bureau', unite: 'unité', format: 'à l’unité', seuil: 4 },
  { id: 'bur-papier', nom: 'Papier à imprimante', rayon: 'bureau', zone: 'bureau', unite: 'paquet', format: '500 feuilles', seuil: 2 },
  { id: 'bur-registres', nom: 'Registres de pêche et formulaires', rayon: 'bureau', zone: 'bureau', unite: 'unité', format: 'à l’unité', seuil: 5 },
  { id: 'bur-stylos', nom: 'Stylos et crayons', rayon: 'bureau', zone: 'bureau', unite: 'boîte', format: '12 unités', seuil: 2 },
  { id: 'bur-cartes', nom: 'Cartes du territoire', rayon: 'bureau', zone: 'bureau', unite: 'unité', format: 'à l’unité', seuil: 5 },
];
