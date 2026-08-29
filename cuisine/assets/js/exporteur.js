/**
 * L'exportateur : transforme la recette affichée en fichier Word (.docx)
 * véritable, en texte à partager, ou la confie à la feuille de partage du
 * téléphone. Tout se fabrique dans le navigateur, sans bibliothèque : le
 * .docx est une archive ZIP (entrées non compressées) contenant le strict
 * nécessaire OOXML. Le PDF, lui, passe par l'impression du navigateur.
 */

'use strict';

const Exporteur = (() => {

  /* ---------- Lecture de la recette affichée ---------- */

  /**
   * Dépouille le DOM d'une recette (de la maison ou du conseiller) en blocs
   * typés : { type: 'titre'|'sousTitre'|'h4'|'p'|'encart'|'ligne'|'etape', … }.
   */
  function extraire(conteneur) {
    const racine = conteneur.querySelector('.recette') ?? conteneur;
    const blocs = [];
    let numero = 0;

    for (const enfant of racine.children) {
      if (enfant.classList.contains('recette-entete')) {
        const h3 = enfant.querySelector('h3');
        if (h3) blocs.push({ type: 'titre', texte: h3.textContent.trim() });
        const sous = enfant.querySelector('.recette-sous-titre');
        if (sous) blocs.push({ type: 'sousTitre', texte: sous.textContent.trim() });
      } else if (enfant.classList.contains('vitrine-temperatures')) {
        for (const vitrine of enfant.querySelectorAll('.vitrine')) {
          const petits = vitrine.querySelectorAll('small');
          const gros = vitrine.querySelector('.gros');
          const morceaux = [petits[0]?.textContent, gros?.textContent, petits[1]?.textContent]
            .map((t) => (t ?? '').trim()).filter(Boolean);
          if (morceaux.length) blocs.push({ type: 'ligne', texte: morceaux.join(' ') });
        }
      } else if (enfant.classList.contains('encart')) {
        for (const p of enfant.querySelectorAll('p')) blocs.push({ type: 'encart', texte: p.textContent.trim() });
      } else if (enfant.tagName === 'H4') {
        numero = enfant.textContent.toLowerCase().includes('étapes') ? 0 : numero;
        blocs.push({ type: 'h4', texte: enfant.textContent.trim() });
      } else if (enfant.tagName === 'P') {
        blocs.push({ type: 'p', texte: enfant.textContent.trim() });
      } else if (enfant.classList.contains('etapes')) {
        for (const li of enfant.querySelectorAll(':scope > li')) {
          numero++;
          const titre = li.querySelector('.etape-titre')?.textContent.trim() ?? '';
          const duree = li.querySelector('.duree')?.textContent.trim();
          const quand = li.querySelector('.etape-quand')?.textContent.trim();
          const critique = li.classList.contains('critique');
          const entete = numero + '. ' + titre
            + (duree ? ' — ' + duree : '')
            + (quand ? ' (' + quand + ')' : '')
            + (critique ? ' ⚠' : '');
          blocs.push({ type: 'etape', texte: entete, corps: li.querySelector('p')?.textContent.trim() ?? '' });
        }
      } else if (enfant.classList.contains('calendrier')) {
        for (const li of enfant.querySelectorAll(':scope > li')) {
          const parts = [...li.querySelectorAll('span')].map((s) => s.textContent.trim()).filter(Boolean);
          blocs.push({ type: 'ligne', texte: parts.join(' — ') });
        }
      }
    }
    return blocs;
  }

  function titreDe(conteneur) {
    return conteneur.querySelector('h3')?.textContent.trim() || 'Recette de Ma Cuisine';
  }

  /* ---------- Le texte à partager ---------- */

  function versTexte(blocs) {
    const lignes = [];
    for (const bloc of blocs) {
      if (bloc.type === 'titre') lignes.push(bloc.texte.toUpperCase(), '');
      else if (bloc.type === 'h4') lignes.push('', '— ' + bloc.texte + ' —', '');
      else if (bloc.type === 'etape') { lignes.push(bloc.texte); if (bloc.corps) lignes.push(bloc.corps, ''); }
      else lignes.push(bloc.texte, '');
    }
    lignes.push('Composé avec Ma Cuisine — pfrcharlespatrick-rgb.github.io/mon-epicerie/cuisine/');
    return lignes.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /* ---------- Le document Word ---------- */

  function xml(texte) {
    return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Un paragraphe OOXML en mise en forme directe. */
  function paragraphe(texte, { gras = false, italique = false, taille = 22, avant = 0, apres = 120 } = {}) {
    const props = '<w:rPr>' + (gras ? '<w:b/>' : '') + (italique ? '<w:i/>' : '')
      + '<w:sz w:val="' + taille + '"/><w:szCs w:val="' + taille + '"/></w:rPr>';
    return '<w:p><w:pPr><w:spacing w:before="' + avant + '" w:after="' + apres + '"/></w:pPr>'
      + '<w:r>' + props + '<w:t xml:space="preserve">' + xml(texte) + '</w:t></w:r></w:p>';
  }

  function versDocumentXml(blocs) {
    const corps = blocs.map((bloc) => {
      switch (bloc.type) {
        case 'titre': return paragraphe(bloc.texte, { gras: true, taille: 36, apres: 160 });
        case 'sousTitre': return paragraphe(bloc.texte, { italique: true, apres: 200 });
        case 'h4': return paragraphe(bloc.texte, { gras: true, taille: 28, avant: 280, apres: 120 });
        case 'encart': return paragraphe(bloc.texte, { italique: true });
        case 'etape': return paragraphe(bloc.texte, { gras: true, apres: 40 }) + (bloc.corps ? paragraphe(bloc.corps, { apres: 160 }) : '');
        default: return paragraphe(bloc.texte);
      }
    }).join('');

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:body>' + corps + '<w:sectPr><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>';
  }

  /* ---------- L'archive ZIP (entrées non compressées) ---------- */

  const TABLE_CRC = (() => {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    return table;
  })();

  function crc32(octets) {
    let c = 0xffffffff;
    for (const octet of octets) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  /** Assemble un ZIP « stored » à partir de { nom: contenu texte }. */
  function zip(fichiers) {
    const encodeur = new TextEncoder();
    const morceaux = [];
    const centrale = [];
    let decalage = 0;

    const e16 = (v) => [v & 0xff, (v >> 8) & 0xff];
    const e32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

    for (const [nom, contenu] of Object.entries(fichiers)) {
      const nomOctets = encodeur.encode(nom);
      const donnees = encodeur.encode(contenu);
      const controle = crc32(donnees);

      const enTete = new Uint8Array([
        0x50, 0x4b, 0x03, 0x04, ...e16(20), ...e16(0), ...e16(0), ...e16(0), ...e16(0x21),
        ...e32(controle), ...e32(donnees.length), ...e32(donnees.length),
        ...e16(nomOctets.length), ...e16(0),
      ]);
      morceaux.push(enTete, nomOctets, donnees);

      centrale.push(new Uint8Array([
        0x50, 0x4b, 0x01, 0x02, ...e16(20), ...e16(20), ...e16(0), ...e16(0), ...e16(0), ...e16(0x21),
        ...e32(controle), ...e32(donnees.length), ...e32(donnees.length),
        ...e16(nomOctets.length), ...e16(0), ...e16(0), ...e16(0), ...e16(0), ...e32(0), ...e32(decalage),
      ]), nomOctets);

      decalage += enTete.length + nomOctets.length + donnees.length;
    }

    const tailleCentrale = centrale.reduce((s, m) => s + m.length, 0);
    const fin = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06, ...e16(0), ...e16(0),
      ...e16(Object.keys(fichiers).length), ...e16(Object.keys(fichiers).length),
      ...e32(tailleCentrale), ...e32(decalage), ...e16(0),
    ]);

    return new Blob([...morceaux, ...centrale, fin], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  function versDocx(blocs) {
    return zip({
      '[Content_Types].xml':
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        + '</Types>',
      '_rels/.rels':
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        + '</Relationships>',
      'word/document.xml': versDocumentXml(blocs),
    });
  }

  /* ---------- Les gestes ---------- */

  function nomDeFichier(titre) {
    const propre = titre.toLowerCase().replace(/\u0153/g, 'oe').replace(/\u00e6/g, 'ae')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    return (propre || 'recette') + '.docx';
  }

  /** Télécharge la recette affichée en .docx. */
  function telechargerWord(conteneur) {
    const blob = versDocx(extraire(conteneur));
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomDeFichier(titreDe(conteneur));
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  /**
   * Partage la recette par la feuille native (messagerie, courriel…), avec
   * repli sur le presse-papiers. Retourne 'partage', 'copie' ou 'annule'.
   */
  async function partager(conteneur) {
    const titre = titreDe(conteneur);
    const texte = versTexte(extraire(conteneur));
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: texte });
        return 'partage';
      } catch (err) {
        if (err.name === 'AbortError') return 'annule';
        // La feuille a refusé (contenu trop long, contexte) : on copie.
      }
    }
    try {
      await navigator.clipboard.writeText(texte);
      return 'copie';
    } catch {
      return 'annule';
    }
  }

  return {
    telechargerWord,
    partager,
    /**
     * Les rouages qui ne touchent pas au DOM, ouverts aux tests. Le ZIP et son
     * CRC se vérifient octet par octet ou pas du tout : un document Word
     * légèrement faux s'ouvre chez nous et se refuse chez le destinataire.
     */
    interne: { crc32, zip, versTexte, versDocumentXml, versDocx, nomDeFichier, extraire },
  };

})();
