// export-word.js - Export Word Relevé d'activité
// © 2025 Quentin THOMAS
// Génère un document Word (1 tableau par GEH, 1 ligne par prélèvement)
// Format identique au modèle activite.docx

function exportActiviteWord() {
  var m = getCurrentMission();
  if (!m) { alert('Aucune mission sélectionnée'); return; }

  if (typeof docx === 'undefined') {
    alert('Bibliothèque Word non chargée. Vérifiez votre connexion.');
    return;
  }

  try {
    var doc = buildActiviteDoc(m);
    docx.Packer.toBlob(doc).then(function(blob) {
      var rawName = (m.clientSite || 'Mission').replace(/[^a-zA-Z0-9\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00e7\s-]/g, '').trim();
      var fn = rawName + '_activite.docx';
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = fn;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch(function(err) {
      console.error('Erreur génération Word:', err);
      alert('Erreur lors de la génération du document Word.\n' + err.message);
    });
  } catch(err) {
    console.error('Erreur export Word:', err);
    alert('Erreur lors de l\'export Word.\n' + err.message);
  }
}

function buildActiviteDoc(m) {
  var BLUE  = '00ACE8';
  var WHITE = 'FFFFFF';

  // Largeurs colonnes en DXA (identiques au modèle activite.docx)
  var COL_WIDTHS = [1710, 1610, 1083, 1667, 692, 1642, 1703, 2664, 2587];
  var TABLE_WIDTH = COL_WIDTHS.reduce(function(a, b) { return a + b; }, 0); // 15358

  var HEADERS = [
    'Nom de l\u2019op\u00e9rateur',
    'Plage horaire de pr\u00e9l\u00e8vement',
    'Dur\u00e9e d\u2019exposition',
    'Agent chimique pr\u00e9lev\u00e9',
    'VLEP (8h/CT)',
    'EPI',
    'Ventilation g\u00e9n\u00e9rale et captages localis\u00e9s',
    'T\u00e2ches r\u00e9alis\u00e9es',
    'Observation'
  ];

  var D = docx;
  var BorderStyle = D.BorderStyle;
  var WidthType    = D.WidthType;
  var ShadingType  = D.ShadingType;
  var VerticalAlign = D.VerticalAlign;
  var AlignmentType = D.AlignmentType;
  var PageOrientation = D.PageOrientation;

  // Bordures données (trait bleu sur 4 côtés)
  var dataBorders = {
    top:    { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    left:   { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    right:  { style: BorderStyle.SINGLE, size: 4, color: BLUE },
  };

  // Bordures en-tête (blanc sur 4 côtés - fond bleu)
  var headerBorders = {
    top:    { style: BorderStyle.SINGLE, size: 6, color: WHITE },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: WHITE },
    left:   { style: BorderStyle.SINGLE, size: 6, color: WHITE },
    right:  { style: BorderStyle.SINGLE, size: 6, color: WHITE },
  };

  function makeHeaderCell(text, width) {
    return new D.TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: headerBorders,
      shading: { fill: BLUE, type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      children: [new D.Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new D.TextRun({ text: text, bold: true, color: WHITE, size: 16, font: 'Arial' })]
      })]
    });
  }

  function makeDataCell(text, width) {
    return new D.TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: dataBorders,
      verticalAlign: VerticalAlign.CENTER,
      children: [new D.Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new D.TextRun({ text: text || '', size: 20, font: 'Arial' })]
      })]
    });
  }

  // Cellule plage horaire : date en gras + horaires dessous
  function makePlageCell(date, heures, width) {
    var children = [];
    if (date) {
      children.push(new D.Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new D.TextRun({ text: date, bold: true, size: 20, font: 'Arial' })]
      }));
    }
    var plages = (heures || '').split(' / ');
    plages.forEach(function(p) {
      if (p) children.push(new D.Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new D.TextRun({ text: p, size: 20, font: 'Arial' })]
      }));
    });
    if (!children.length) {
      children.push(new D.Paragraph({ children: [] }));
    }
    return new D.TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: dataBorders,
      verticalAlign: VerticalAlign.CENTER,
      children: children
    });
  }

  function makeHeaderRow() {
    return new D.TableRow({
      cantSplit: true,
      height: { value: 229, rule: 'atLeast' },
      children: HEADERS.map(function(h, i) { return makeHeaderCell(h, COL_WIDTHS[i]); })
    });
  }

  // r = { operateur, date, heures, agents, vlep, taches }
  function makeDataRow(r) {
    return new D.TableRow({
      children: [
        makeDataCell(r.operateur,  COL_WIDTHS[0]),
        makePlageCell(r.date, r.heures, COL_WIDTHS[1]),
        makeDataCell('',           COL_WIDTHS[2]),  // Durée expo - vide
        makeDataCell(r.agents,     COL_WIDTHS[3]),
        makeDataCell(r.vlep,       COL_WIDTHS[4]),  // "8h" ou "CT"
        makeDataCell('',           COL_WIDTHS[5]),  // EPI - vide
        makeDataCell('',           COL_WIDTHS[6]),  // Ventilation - vide
        makeDataCell(r.taches,     COL_WIDTHS[7]),
        makeDataCell('',           COL_WIDTHS[8]),  // Observation - vide
      ]
    });
  }

  function buildTable(rows) {
    return new D.Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: COL_WIDTHS,
      rows: [makeHeaderRow()].concat(rows.map(makeDataRow))
    });
  }

  function gehTitle(name) {
    return new D.Paragraph({
      spacing: { before: 240, after: 120 },
      indent: { left: 180 },
      children: [new D.TextRun({ text: 'GEH : ' + name, bold: true, size: 18, font: 'Arial' })]
    });
  }

  // === Construire les données par GEH ===
  var gehMap = {};
  var gehOrder = [];

  m.gehs.forEach(function(g) {
    if (!g.name) return;
    gehMap[g.id] = { gehName: g.num + ' - ' + g.name, rows: [] };
    gehOrder.push(g.id);
  });

  m.prelevements.forEach(function(p) {
    var gehId = p.gehId;
    if (!gehMap[gehId]) return;

    p.subPrelevements.forEach(function(sb) {
      // Agents : liste des noms séparés par " / "
      var agentNames = p.agents.map(function(a) { return a.name; }).join(' / ');

      // VLEP : "8h" ou "CT" selon le type de prélèvement
      var vlepStr = p.type === 'CT' ? 'CT' : '8h';

      // Date
      var dateStr = formatDateFR(sb.date) || '';

      // Plages horaires
      var plagesStr = '';
      if (sb.plages) {
        plagesStr = sb.plages
          .filter(function(pl) { return pl.debut || pl.fin; })
          .map(function(pl) { return (pl.debut || '?') + ' - ' + (pl.fin || '?'); })
          .join(' / ');
      }

      // Tâches / activité = champ observations du sub-prélèvement
      var taches = sb.observations || sb.activite || '';

      gehMap[gehId].rows.push({
        operateur: sb.operateur || '',
        date:      dateStr,
        heures:    plagesStr,
        agents:    agentNames,
        vlep:      vlepStr,
        taches:    taches
      });
    });
  });

  // === Construire le document ===
  var docChildren = [];
  var gehsWithData = gehOrder.filter(function(id) {
    return gehMap[id] && gehMap[id].rows.length > 0;
  });

  gehsWithData.forEach(function(id, idx) {
    var geh = gehMap[id];
    docChildren.push(gehTitle(geh.gehName));
    docChildren.push(buildTable(geh.rows));
    // Saut de page entre les GEH (sauf après le dernier)
    if (idx < gehsWithData.length - 1) {
      docChildren.push(new D.Paragraph({ children: [new D.PageBreak()] }));
    }
  });

  if (docChildren.length === 0) {
    docChildren.push(new D.Paragraph({
      children: [new D.TextRun({ text: 'Aucun prélèvement enregistré.', size: 20, font: 'Arial' })]
    }));
  }

  return new D.Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 11906,
            height: 16838,
            orientation: PageOrientation.LANDSCAPE
          },
          margin: { top: 1417, right: 1417, bottom: 1417, left: 1417 }
        }
      },
      children: docChildren
    }]
  });
}

console.log('✓ Export Word chargé');
