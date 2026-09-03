/**
 * Sortir l'inventaire du navigateur : feuille imprimable (ou PDF), tableur
 * CSV, texte à coller, et la sauvegarde `.json` qui sert aussi à passer le
 * relais entre employés.
 *
 * La feuille imprimée est bâtie dans la page elle-même — pas de fenêtre
 * surgissante à bloquer — et l'impression ne montre qu'elle.
 */

'use strict';

const Exporteur = (() => {

  const $ = (selecteur) => document.querySelector(selecteur);
  const echapper = (t) => Rendu.echapper(t);

  /* ---------- Rassembler ce qu'on exporte ---------- */

  /**
   * Ramène tout export à une même forme : un titre, une date, une signature
   * et des lignes. Que l'on parte de l'inventaire courant ou d'une archive,
   * la suite ne voit plus la différence.
   */
  function portee(source) {
    if (source && source.lignes) {
      return {
        titre: source.titre,
        date: source.date,
        par: source.par,
        saison: source.saison,
        note: source.note,
        archive: true,
        lignes: source.lignes,
      };
    }

    const filtres = source?.filtres ?? {};
    const lignes = (source?.lignes ?? Rendu.filtrer(filtres)).map((a) => ({
      id: a.id, nom: a.nom, rayon: a.rayon, zone: a.zone, unite: a.unite,
      format: a.format, seuil: a.seuil, quantite: a.quantite, estime: a.estime,
      note: a.note, par: a.par, maj: a.maj,
    }));

    return {
      titre: source?.titre ?? `Inventaire — saison ${Etat.saison()}`,
      date: new Date().toISOString(),
      par: Etat.responsable(),
      saison: Etat.saison(),
      note: source?.note ?? '',
      archive: false,
      lignes,
    };
  }

  /** Range les lignes par rayon, dans l'ordre du catalogue. */
  function parRayon(lignes) {
    return RAYONS
      .map((r) => ({
        rayon: r,
        lignes: lignes
          .filter((l) => l.rayon === r.id)
          .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
      }))
      .filter((g) => g.lignes.length);
  }

  const quantiteTexte = (l) =>
    l.quantite === null || l.quantite === undefined ? '—' : `${l.quantite}${l.estime ? ' (est.)' : ''}`;

  /* ---------- Feuille imprimable ---------- */

  function feuille(p) {
    const groupes = parRayon(p.lignes);
    const comptes = p.lignes.filter((l) => l.quantite !== null && l.quantite !== undefined);
    const bas = comptes.filter((l) => (l.seuil || 0) > 0 && l.quantite <= l.seuil);

    const entete = `
      <header class="feuille-entete">
        <div>
          <h1>Domaine de pêche du Lac Péré</h1>
          <p class="feuille-sous-titre">${echapper(p.titre)}</p>
        </div>
        <dl class="feuille-meta">
          <div><dt>Date</dt><dd>${echapper(Rendu.dateLisible(p.date, true))}</dd></div>
          <div><dt>Saison</dt><dd>${echapper(p.saison || '—')}</dd></div>
          <div><dt>Relevé par</dt><dd>${echapper(p.par || '—')}</dd></div>
          <div><dt>Articles comptés</dt><dd>${comptes.length} sur ${p.lignes.length}</dd></div>
        </dl>
      </header>`;

    const remarque = p.note
      ? `<p class="feuille-note"><b>Remarque —</b> ${echapper(p.note)}</p>`
      : '';

    const alerte = bas.length
      ? `<p class="feuille-note"><b>À commander —</b> ${bas.length} article(s) au seuil ou en dessous.</p>`
      : '';

    const corps = groupes.map((g) => `
      <section class="feuille-groupe">
        <h2>${echapper(g.rayon.nom)}</h2>
        <table>
          <thead>
            <tr><th>Article</th><th>Format</th><th>Emplacement</th><th class="nombre">Quantité</th><th>Unité</th><th>Remarque</th></tr>
          </thead>
          <tbody>
            ${g.lignes.map((l) => `
              <tr${(l.seuil || 0) > 0 && l.quantite !== null && l.quantite <= l.seuil ? ' class="ligne-basse"' : ''}>
                <td>${echapper(l.nom)}</td>
                <td>${echapper(l.format || '')}</td>
                <td>${echapper(Etat.zone(l.zone).nom)}</td>
                <td class="nombre">${echapper(quantiteTexte(l))}</td>
                <td>${echapper(l.unite || '')}</td>
                <td>${echapper(l.note || '')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </section>`).join('');

    const pied = `
      <footer class="feuille-pied">
        <div class="signature"><span>Relevé par</span><span class="trait"></span></div>
        <div class="signature"><span>Vérifié par</span><span class="trait"></span></div>
        <div class="signature"><span>Date</span><span class="trait"></span></div>
      </footer>`;

    return entete + remarque + alerte + corps + pied;
  }

  function imprimer(source) {
    const p = portee(source);
    $('#zone-impression').innerHTML = feuille(p);
    window.print();
  }

  /* ---------- Texte à coller ---------- */

  function texte(source) {
    const p = portee(source);
    const lignes = [
      'DOMAINE DE PÊCHE DU LAC PÉRÉ',
      p.titre.toUpperCase(),
      `${Rendu.dateLisible(p.date, true)}${p.par ? ' — relevé par ' + p.par : ''}`,
      '',
    ];

    for (const g of parRayon(p.lignes)) {
      lignes.push(`— ${g.rayon.nom.toUpperCase()} —`);
      for (const l of g.lignes) {
        const detail = [l.format, Etat.zone(l.zone).nom].filter(Boolean).join(', ');
        lignes.push(`  ${l.nom}${detail ? ` (${detail})` : ''} : ${quantiteTexte(l)} ${l.unite || ''}`.trimEnd());
      }
      lignes.push('');
    }

    return lignes.join('\n').trimEnd();
  }

  /* ---------- Tableur ---------- */

  function csv(source) {
    const p = portee(source);
    const cellule = (valeur) => {
      const texteCellule = String(valeur ?? '');
      return /[";\n]/.test(texteCellule) ? '"' + texteCellule.replace(/"/g, '""') + '"' : texteCellule;
    };

    const lignes = [['Rayon', 'Article', 'Format', 'Emplacement', 'Quantité', 'Unité', 'Seuil', 'Estimé', 'Remarque', 'Relevé par', 'Dernière saisie']];

    for (const g of parRayon(p.lignes)) {
      for (const l of g.lignes) {
        lignes.push([
          g.rayon.nom, l.nom, l.format || '', Etat.zone(l.zone).nom,
          l.quantite === null || l.quantite === undefined ? '' : l.quantite,
          l.unite || '', l.seuil || 0, l.estime ? 'oui' : 'non',
          l.note || '', l.par || '', l.maj ? Rendu.dateLisible(l.maj, true) : '',
        ]);
      }
    }

    // Point-virgule et BOM : Excel en français ouvre le fichier sans rien régler.
    return '﻿' + lignes.map((ligne) => ligne.map(cellule).join(';')).join('\r\n');
  }

  /* ---------- Fichiers ---------- */

  function telecharger(nomFichier, contenu, type) {
    const lien = document.createElement('a');
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    lien.href = url;
    lien.download = nomFichier;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Un nom de fichier qui se classe tout seul par date. */
  function nomDate(prefixe, extension) {
    const d = new Date();
    const jour = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    return `${prefixe}-${jour}.${extension}`;
  }

  const sauvegarde = () =>
    telecharger(nomDate('inventaire-lac-pere', 'json'), JSON.stringify(Etat.exporter(), null, 2), 'application/json');

  const tableur = (source) =>
    telecharger(nomDate('inventaire-lac-pere', 'csv'), csv(source), 'text/csv;charset=utf-8');

  /* ---------- Presse-papiers et partage ---------- */

  async function copier(source) {
    const contenu = texte(source);
    try {
      await navigator.clipboard.writeText(contenu);
      return true;
    } catch {
      // Certains navigateurs refusent le presse-papiers hors geste direct :
      // on retombe sur la vieille méthode, qui passe partout.
      const zone = document.createElement('textarea');
      zone.value = contenu;
      zone.setAttribute('readonly', '');
      zone.style.position = 'fixed';
      zone.style.opacity = '0';
      document.body.append(zone);
      zone.select();
      const reussi = document.execCommand?.('copy');
      zone.remove();
      return Boolean(reussi);
    }
  }

  async function partager(source) {
    const p = portee(source);
    const contenu = texte(source);

    if (navigator.share) {
      try {
        await navigator.share({ title: p.titre, text: contenu });
        return 'partage';
      } catch (erreur) {
        if (erreur?.name === 'AbortError') return 'annule';
      }
    }
    return (await copier(source)) ? 'copie' : 'echec';
  }

  /** Envoie le fichier de sauvegarde par le partage du téléphone, si possible. */
  async function partagerFichier() {
    const fichier = new File(
      [JSON.stringify(Etat.exporter(), null, 2)],
      nomDate('inventaire-lac-pere', 'json'),
      { type: 'application/json' },
    );

    if (navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier], title: 'Inventaire du Lac Péré' });
        return 'partage';
      } catch (erreur) {
        if (erreur?.name === 'AbortError') return 'annule';
      }
    }
    sauvegarde();
    return 'telecharge';
  }

  return { imprimer, texte, csv, tableur, sauvegarde, telecharger, copier, partager, partagerFichier, feuille, portee };
})();
