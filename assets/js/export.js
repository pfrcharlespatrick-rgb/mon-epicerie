/**
 * Exportation : texte récapitulatif, presse-papiers, sauvegarde et
 * restauration de fichier.
 */

import { DETAILLANTS, RAYON_PAR_ID } from './catalogue.js';
import { etat, articlesPrepares } from './etat.js';

const DATE_LONGUE = new Intl.DateTimeFormat('fr-CA', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Regroupe les articles préparés comme ils le sont à l'écran. */
function grouperPourTexte(articles) {
  const groupes = new Map();

  if (etat.groupement === 'magasin') {
    const ordre = [...DETAILLANTS.map((d) => d.nom), 'Magasin à déterminer'];
    for (const nom of ordre) groupes.set(nom, []);
    for (const article of articles) {
      const cle = groupes.has(article.magasin) ? article.magasin : 'Magasin à déterminer';
      groupes.get(cle).push(article);
    }
  } else {
    for (const rayon of RAYON_PAR_ID.values()) groupes.set(rayon.nom, []);
    for (const article of articles) {
      const nom = RAYON_PAR_ID.get(article.rayon)?.nom ?? 'Divers & Animaux';
      groupes.get(nom).push(article);
    }
  }

  return [...groupes.entries()].filter(([, liste]) => liste.length > 0);
}

/** Construit le récapitulatif texte de la liste préparée. */
export function texteRecapitulatif() {
  const articles = articlesPrepares();
  if (articles.length === 0) return null;

  const restants = articles.filter((a) => !a.coche).length;
  const lignes = [
    `MON ÉPICERIE — ${DATE_LONGUE.format(new Date())}`,
    `${restants} article(s) à acheter sur ${articles.length}`,
    '',
  ];

  for (const [titre, liste] of grouperPourTexte(articles)) {
    lignes.push(`— ${titre.toUpperCase()} —`);
    for (const article of liste) {
      const details = [article.qte, etat.groupement === 'magasin' ? '' : article.magasin]
        .filter(Boolean)
        .join(', ');
      lignes.push(`  ${article.coche ? '[x]' : '[ ]'} ${article.nom}${details ? ` (${details})` : ''}`);
    }
    lignes.push('');
  }

  return lignes.join('\n').trimEnd();
}

/**
 * Copie du texte dans le presse-papiers. `navigator.clipboard` demande un
 * contexte sécurisé ; la méthode historique sert de secours (fichier local,
 * navigateur ancien).
 */
export async function copierTexte(texte) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texte);
      return true;
    }
  } catch {
    // On tente la méthode de secours ci-dessous.
  }

  const zone = document.createElement('textarea');
  zone.value = texte;
  zone.setAttribute('readonly', '');
  zone.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.append(zone);
  zone.select();

  let reussi = false;
  try {
    reussi = document.execCommand('copy');
  } catch {
    reussi = false;
  } finally {
    zone.remove();
  }

  return reussi;
}

/** Déclenche le téléchargement d'une sauvegarde complète. */
export function telechargerSauvegarde() {
  const contenu = JSON.stringify(
    {
      application: 'mon-epicerie',
      version: 1,
      exporte: new Date().toISOString(),
      articles: etat.articles,
    },
    null,
    2,
  );

  const blob = new Blob([contenu], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `epicerie-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(lien);
  lien.click();
  lien.remove();
  // Laisse au navigateur le temps de démarrer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Lit un fichier de sauvegarde et en extrait le tableau d'articles.
 * Accepte le format actuel comme celui, plus ancien, d'un simple tableau.
 * Lève une erreur au message lisible si le fichier ne convient pas.
 */
export async function lireSauvegarde(fichier) {
  if (fichier.size > 5 * 1024 * 1024) {
    throw new Error('Ce fichier est trop volumineux pour être une liste d’épicerie.');
  }

  let donnees;
  try {
    donnees = JSON.parse(await fichier.text());
  } catch {
    throw new Error('Ce fichier n’est pas un JSON valide.');
  }

  const articles = Array.isArray(donnees) ? donnees : donnees?.articles;
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('Aucun article trouvé dans ce fichier.');
  }

  return articles;
}

/** Renseigne l'en-tête qui n'apparaît qu'à l'impression. */
export function preparerImpression() {
  const articles = articlesPrepares();
  const restants = articles.filter((a) => !a.coche).length;

  document.getElementById('impression-date').textContent =
    `Généré le ${DATE_LONGUE.format(new Date())}`;
  document.getElementById('impression-compte').textContent =
    `${restants} article(s) à acheter sur ${articles.length}`;
}
