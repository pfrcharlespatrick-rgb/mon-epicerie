/**
 * La Brigade — réglages de vente et d'accès.
 *
 * C'est LE fichier à modifier pour lancer les ventes. Il n'y a rien d'autre
 * à toucher : le guide de lancement (GUIDE-LANCEMENT.md) explique chaque
 * ligne, pas à pas, sans rien connaître à la programmation.
 *
 *   modeDemo        true  : tout le contenu est ouvert et un bandeau
 *                           « démonstration » l'annonce. Parfait pour
 *                           montrer le site avant de vendre.
 *                   false : les leçons payantes se verrouillent, et
 *                           seuls un code d'accès valide (ou le lien de
 *                           retour de paiement) les ouvre.
 *   lienPaiement    l'adresse de votre lien de paiement Stripe.
 *   empreintes      les empreintes SHA-256 de vos codes d'accès — jamais
 *                   les codes eux-mêmes, qui ne doivent apparaître nulle
 *                   part dans ce site. Générez-les avec outils/codes.html.
 */

export const CONFIG = {
  nomEcole: 'La Brigade',
  slogan: 'L’école de cuisine qui cuisine avec vous',

  modeDemo: true,

  // Exemple : 'https://buy.stripe.com/xxxxxxxxxxxx'
  lienPaiement: '',

  prix: '49 $',
  prixDetail: 'Paiement unique · accès à vie · toutes les leçons, celles d’aujourd’hui et celles à venir',
  devise: 'CAD',

  // Une empreinte par ligne, entre guillemets, séparées par des virgules.
  // Exemple : 'a3f1c2…',
  empreintes: [],

  // Où vos clients écrivent s'ils ont perdu leur code. Laissez vide pour
  // masquer la mention.
  courrielSoutien: '',

  // Le nom qui apparaît dans le bas de page et dans les mentions.
  editeur: 'Mon Épicerie',
};
