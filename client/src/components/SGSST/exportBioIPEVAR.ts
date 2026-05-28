import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BioRiskRow } from './BioMatrizIPEVAR';

export const exportBioIPEVARToExcel = async (
  matrixRows: BioRiskRow[],
  fitScore: number,
  chartConclusions: Record<string, string> = {}
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // ============================================================================
  // HOJA 1: DASHBOARD ANALÍTICO (POWERBI INTERACTIVE STYLE)
  // ============================================================================
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  // Light Theme Background Slate 50
  for (let r = 1; r <= 120; r++) {
    for (let c = 1; c <= 12; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 40;
  wsDash.getColumn('C').width = 20;
  wsDash.getColumn('D').width = 30;
  wsDash.getColumn('E').width = 4;
  wsDash.getColumn('F').width = 40;
  wsDash.getColumn('G').width = 20;
  wsDash.getColumn('H').width = 30;

  // Hero Header
  wsDash.mergeCells('A1:H4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   ⚡ DASHBOARD BIO-INDIVIDUAL — IPEVAR GTC-45';
  heroCell.font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 8; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF042F2E' } } };
  }

  // --- INTERACTIVE SLICER (DROPDOWN BY DOMINIO) ---
  const dominios = [...new Set(matrixRows.map(r => r.dominio_bio).filter(Boolean))];
  if (dominios.length === 0) dominios.push('Sin Datos');

  // Hidden Column Z for Dropdown Data Validation Source
  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  dominios.forEach((d, i) => wsDash.getCell(`Z${i+2}`).value = d);
  const numDominios = dominios.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (DOMINIO):';
  wsDash.getCell('B6').font = { size: 12, bold: true, color: { argb: 'FF334155' }, name: 'Book Antiqua' };
  wsDash.getCell('B6').alignment = { vertical: 'middle', horizontal: 'right' };

  const filterCell = wsDash.getCell('C6');
  filterCell.value = 'TODOS';
  filterCell.font = { size: 12, bold: true, color: { argb: 'FF0F766E' }, name: 'Book Antiqua' };
  filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  filterCell.border = {
    top: { style: 'medium', color: { argb: 'FF0D9488' } }, left: { style: 'medium', color: { argb: 'FF0D9488' } },
    bottom: { style: 'medium', color: { argb: 'FF0D9488' } }, right: { style: 'medium', color: { argb: 'FF0D9488' } }
  };
  filterCell.alignment = { vertical: 'middle', horizontal: 'center' };
  filterCell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`'Dashboard Analítico'!$Z$1:$Z$${numDominios}`]
  };

  // --- KPI CARDS ---
  const kpis = [
    { col: 'B', title: 'Riesgos Bio Evaluados', formula: `IF($C$6="TODOS", COUNTA('Matriz Bio-IPEVAR'!A2:A${totalRows}), COUNTIF('Matriz Bio-IPEVAR'!A2:A${totalRows}, $C$6))`, color: 'FF0F172A' },
    { col: 'C', title: 'Riesgos Críticos / Altos', formula: `IF($C$6="TODOS", COUNTIF('Matriz Bio-IPEVAR'!N2:N${totalRows}, "Crítico")+COUNTIF('Matriz Bio-IPEVAR'!N2:N${totalRows}, "Alto"), COUNTIFS('Matriz Bio-IPEVAR'!N2:N${totalRows}, "Crítico", 'Matriz Bio-IPEVAR'!A2:A${totalRows}, $C$6)+COUNTIFS('Matriz Bio-IPEVAR'!N2:N${totalRows}, "Alto", 'Matriz Bio-IPEVAR'!A2:A${totalRows}, $C$6))`, color: 'FFEF4444' },
    { col: 'D', title: 'Índice de Vulnerabilidad FIT', formula: `${fitScore}%`, color: 'FF8B5CF6' },
  ];

  kpis.forEach(k => {
    const headCell = wsDash.getCell(`${k.col}8`);
    headCell.value = k.title;
    headCell.font = { size: 10, bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua' };
    headCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    headCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const valCell = wsDash.getCell(`${k.col}9`);
    if (k.formula.startsWith('=')) {
      valCell.value = { formula: k.formula.substring(1) };
    } else if (k.formula.includes('%')) {
      valCell.value = parseFloat(k.formula) / 100;
      valCell.numFmt = '0%';
    } else {
      valCell.value = { formula: k.formula };
    }
    valCell.font = { size: 20, bold: true, color: { argb: k.color }, name: 'Book Antiqua' };
    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valCell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });
  wsDash.getRow(8).height = 24;
  wsDash.getRow(9).height = 36;

  // --- DYNAMIC CARD GENERATOR FOR SECTIONS ---
  const getInteractiveFormula = (colTarget: string, valTarget: string) => {
    return `IF($C$6="TODOS", COUNTIF('Matriz Bio-IPEVAR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}"), COUNTIFS('Matriz Bio-IPEVAR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}", 'Matriz Bio-IPEVAR'!A2:A${totalRows}, $C$6))`;
  };

  const createSection = (startCol: string, valCol: string, trendCol: string, row: number, title: string, headers: string[]) => {
    wsDash.getCell(`${startCol}${row}`).value = title;
    wsDash.getCell(`${startCol}${row}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };
    
    const hRow = row + 1;
    [startCol, valCol, trendCol].forEach((col, idx) => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.value = headers[idx];
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua', size: 10 };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (idx === 0) cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (idx === 2) cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    });
    return hRow + 1;
  };

  const addDataRow = (
    startCol: string,
    valCol: string,
    trendCol: string,
    row: number,
    label: string,
    formula: string,
    isLast: boolean,
    colorArgb: string
  ) => {
    [startCol, valCol, trendCol].forEach((col, idx) => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      let borders: any = {};
      if (idx === 0) borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (idx === 2) borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = { ...(cell.border || {}), ...borders };
    });

    wsDash.getCell(`${startCol}${row}`).value = ` ${label}`;
    wsDash.getCell(`${startCol}${row}`).font = { name: 'Book Antiqua', color: { argb: 'FF334155' }, size: 10 };
    
    wsDash.getCell(`${valCol}${row}`).value = { formula };
    wsDash.getCell(`${valCol}${row}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`${valCol}${row}`).font = { bold: true, size: 11, color: { argb: colorArgb }, name: 'Book Antiqua' };
    
    wsDash.getCell(`${trendCol}${row}`).value = { formula };
    wsDash.getCell(`${trendCol}${row}`).font = { color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 1 }; // blended
  };

  const addConclusionBox = (col: string, startRow: number, endRow: number, conclusionText: string) => {
    wsDash.mergeCells(`${col}${startRow}:${col}${endRow}`);
    const cell = wsDash.getCell(`${col}${startRow}`);
    cell.value = `💡 Conclusión del Auditor:\n${conclusionText || 'No se ha generado conclusión para este análisis. Use el generador IA en la plataforma.'}`;
    cell.font = { italic: true, size: 10, color: { argb: 'FF0F766E' }, name: 'Book Antiqua' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4F1' } }; // Light Teal background
    cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
    
    // Add borders to merged area
    for (let r = startRow; r <= endRow; r++) {
      const borderCell = wsDash.getCell(`${col}${r}`);
      borderCell.border = {
        top: r === startRow ? { style: 'thin', color: { argb: 'FF99D1C4' } } : undefined,
        bottom: r === endRow ? { style: 'thin', color: { argb: 'FF99D1C4' } } : undefined,
        left: { style: 'medium', color: { argb: 'FF0D9488' } },
        right: { style: 'thin', color: { argb: 'FF99D1C4' } }
      };
    }
  };

  // ----------------------------------------------------------------------------
  // SECTION 1: Clasificación de Bio-Riesgos & Origen
  // ----------------------------------------------------------------------------
  let rowL = 12;
  let rowR = 12;

  // Izquierda: Clasificación
  rowL = createSection('B', 'C', 'D', rowL, 'Clasificación de Bio-Riesgos', ['Nivel', 'Cantidad', 'Visualización']);
  const levels = [
    { name: 'Crítico', color: 'FFEF4444' },
    { name: 'Alto', color: 'FFF97316' },
    { name: 'Moderado', color: 'FFEAB308' },
    { name: 'Bajo', color: 'FF22C55E' }
  ];
  const startFormatL1 = rowL;
  levels.forEach((l, idx) => {
    addDataRow('B', 'C', 'D', rowL, l.name, getInteractiveFormula('N', l.name), idx === levels.length - 1, l.color);
    rowL++;
  });
  wsDash.addConditionalFormatting({
    ref: `D${startFormatL1}:D${rowL - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF3B82F6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // Conclusión Izquierda
  addConclusionBox('B', rowL + 1, rowL + 4, chartConclusions.clasificacion_bio);
  rowL += 5;

  // Derecha: Origen del Riesgo
  rowR = createSection('F', 'G', 'H', rowR, 'Origen de los Riesgos', ['Clasificación Origen', 'Cantidad', 'Visualización']);
  const origenes = [
    { name: 'Inherente a la Tarea', color: 'FF0D9488' },
    { name: 'Condición Insegura', color: 'FFF59E0B' },
    { name: 'Acto Inseguro', color: 'FFEF4444' }
  ];
  const startFormatR1 = rowR;
  origenes.forEach((o, idx) => {
    addDataRow('F', 'G', 'H', rowR, o.name, getInteractiveFormula('C', o.name), idx === origenes.length - 1, o.color);
    rowR++;
  });
  wsDash.addConditionalFormatting({
    ref: `H${startFormatR1}:H${rowR - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0D9488' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // Conclusión Derecha (Usaremos la conclusión de dominio o general si no hay específica)
  addConclusionBox('F', rowR + 1, rowR + 4, chartConclusions.dominio_bio);
  rowR += 5;

  // max de los dos
  let nextSectionRow = Math.max(rowL, rowR) + 1;

  // ----------------------------------------------------------------------------
  // SECTION 2: Controles Existentes & Jerarquía Propuesta
  // ----------------------------------------------------------------------------
  rowL = nextSectionRow;
  rowR = nextSectionRow;

  // Izquierda: Cobertura Controles Existentes
  rowL = createSection('B', 'C', 'D', rowL, 'Cobertura Controles Existentes', ['Fase Control', 'Cantidad', 'Cobertura']);
  // Note: Cobertura exist tiene formulas basadas en no-vacíos en Columna O, P, Q
  // we count countif of columns NOT equal to 'Ninguno' or empty.
  const emptyCheckFormula = (col: string) => {
    return `SUMPRODUCT(--('Matriz Bio-IPEVAR'!${col}2:${col}${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!${col}2:${col}${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!${col}2:${col}${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  };
  const emptyCheckFuente = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!O2:O${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!O2:O${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!O2:O${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckMedio = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!P2:P${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!P2:P${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!P2:P${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckIndividuo = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!Q2:Q${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!Q2:Q${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!Q2:Q${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;

  addDataRow('B', 'C', 'D', rowL, 'Ctrl. Fuente', emptyCheckFuente, false, 'FF0F766E');
  rowL++;
  addDataRow('B', 'C', 'D', rowL, 'Ctrl. Medio', emptyCheckMedio, false, 'FF3B82F6');
  rowL++;
  addDataRow('B', 'C', 'D', rowL, 'Ctrl. Individuo', emptyCheckIndividuo, true, 'FF8B5CF6');
  rowL++;

  wsDash.addConditionalFormatting({
    ref: `D${rowL - 3}:D${rowL - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF10B981' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  addConclusionBox('B', rowL + 1, rowL + 4, chartConclusions.controles_existentes);
  rowL += 5;

  // Derecha: Jerarquía Controles Propuestos
  rowR = createSection('F', 'G', 'H', rowR, 'Jerarquía Medidas Propuestas', ['Medida Control', 'Cantidad', 'Distribución']);
  const emptyCheckElim = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!R2:R${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!R2:R${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!R2:R${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckSust = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!S2:S${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!S2:S${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!S2:S${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckIng = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!T2:T${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!T2:T${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!T2:T${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckAdm = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!U2:U${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!U2:U${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!U2:U${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;
  const emptyCheckEPP = `SUMPRODUCT(--('Matriz Bio-IPEVAR'!V2:V${totalRows}<>"Ninguno")*--('Matriz Bio-IPEVAR'!V2:V${totalRows}<>"ninguno")*--('Matriz Bio-IPEVAR'!V2:V${totalRows}<>"")*IF($C$6="TODOS",1,--('Matriz Bio-IPEVAR'!A2:A${totalRows}=$C$6)))`;

  addDataRow('F', 'G', 'H', rowR, '1. Eliminación', emptyCheckElim, false, 'FFEF4444');
  rowR++;
  addDataRow('F', 'G', 'H', rowR, '2. Sustitución', emptyCheckSust, false, 'FFF97316');
  rowR++;
  addDataRow('F', 'G', 'H', rowR, '3. Ctrl. Ingeniería', emptyCheckIng, false, 'FFF59E0B');
  rowR++;
  addDataRow('F', 'G', 'H', rowR, '4. Ctrl. Administrativos', emptyCheckAdm, false, 'FF3B82F6');
  rowR++;
  addDataRow('F', 'G', 'H', rowR, '5. Equipos/EPP', emptyCheckEPP, true, 'FF8B5CF6');
  rowR++;

  wsDash.addConditionalFormatting({
    ref: `H${rowR - 5}:H${rowR - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  addConclusionBox('F', rowR + 1, rowR + 4, chartConclusions.jerarquia_controles_propuestos);
  rowR += 5;

  // ----------------------------------------------------------------------------
  // SECTION 3: Efectos Posibles a la Salud (Efectos a la salud)
  // ----------------------------------------------------------------------------
  nextSectionRow = Math.max(rowL, rowR) + 1;
  wsDash.mergeCells(`B${nextSectionRow}:H${nextSectionRow}`);
  const s3Title = wsDash.getCell(`B${nextSectionRow}`);
  s3Title.value = 'Efectos Posibles a la Salud Reportados (Top 5)';
  s3Title.font = { size: 14, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };
  
  const healthHRow = nextSectionRow + 1;
  ['B', 'C', 'D'].forEach((col, idx) => {
    const cell = wsDash.getCell(`${col}${healthHRow}`);
    cell.value = ['Condición de Salud', 'Incidencia', 'Visualización'][idx];
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua', size: 10 };
    cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    if (idx === 0) cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    if (idx === 2) cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
  });

  // Calculate top 5 health effects statically or by simple map
  const mapE: Record<string, number> = {};
  matrixRows.forEach(r => {
    if (!r.efectos_posibles) return;
    const terms = r.efectos_posibles
      .split(/[,,;,.]/)
      .map(t => t.trim())
      .filter(t => t.length > 2 && t.toLowerCase() !== 'ninguno' && t.toLowerCase() !== 'ninguna' && t.toLowerCase() !== 'no aplica');
    terms.forEach(t => {
      const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      mapE[cap] = (mapE[cap] || 0) + 1;
    });
  });
  const chartE = Object.entries(mapE)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  let dataHealthRow = healthHRow + 1;
  if (chartE.length === 0) {
    wsDash.mergeCells(`B${dataHealthRow}:D${dataHealthRow}`);
    wsDash.getCell(`B${dataHealthRow}`).value = ' Sin efectos de salud específicos registrados.';
    wsDash.getCell(`B${dataHealthRow}`).font = { name: 'Book Antiqua', italic: true, color: { argb: 'FF94A3B8' }, size: 10 };
    dataHealthRow++;
  } else {
    chartE.forEach((e, idx) => {
      addDataRow('B', 'C', 'D', dataHealthRow, e.label, e.value.toString(), idx === chartE.length - 1, 'FFF43F5E');
      dataHealthRow++;
    });
    wsDash.addConditionalFormatting({
      ref: `D${healthHRow + 1}:D${dataHealthRow - 1}`,
      rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FFF43F5E' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
    });
  }

  // Merge the conclusion box on the right of top health effects
  addConclusionBox('F', healthHRow, dataHealthRow - 1, chartConclusions.efectos_salud);


  // ============================================================================
  // HOJA 2: MATRIZ GTC-45 (DATOS)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz Bio-IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }]
  });

  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 26 }
  };

  wsMatriz.columns = [
    { header: 'Dominio Bio', key: 'dominio_bio', width: 20 },
    { header: 'Dimensión Bio / Detalle', key: 'dimension_bio', width: 22 },
    { header: 'Origen del Riesgo', key: 'origen_riesgo', width: 22 },
    { header: 'Peligro según Cargo', key: 'peligro_cargo', width: 30 },
    { header: 'Actividad Expuesta', key: 'actividad_expuesta', width: 30 },
    { header: 'Efectos Posibles', key: 'efectos_posibles', width: 30 },
    { header: 'Factor Vulnerabilidad Individual', key: 'factor_individual', width: 30 },
    { header: 'Nivel Susceptibilidad', key: 'nivel_susceptibilidad', width: 15 },
    { header: 'Nivel Exposición', key: 'nivel_exposicion', width: 15 },
    { header: 'Índice Bio-Riesgo Bruto', key: 'indice_bio_riesgo_bruto', width: 18 },
    { header: 'Percepción Riesgo (Pts)', key: 'percepcion_riesgo_pts', width: 18 },
    { header: 'Factor Reducción', key: 'factor_reduccion_percepcion', width: 18 },
    { header: 'Índice Bio-Riesgo Efectivo', key: 'indice_bio_riesgo_efectivo', width: 18 },
    { header: 'Clasificación Bio-Riesgo', key: 'clasificacion_bio', width: 18 },
    { header: 'Ctrl. Fuente', key: 'controles_fuente', width: 22 },
    { header: 'Ctrl. Medio', key: 'controles_medio', width: 22 },
    { header: 'Ctrl. Individuo', key: 'controles_individuo', width: 22 },
    { header: 'Medida Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Medida Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Medida Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Medida Administrativa', key: 'medida_administrativa', width: 28 },
    { header: 'Medida EPP/U', key: 'medida_eppu', width: 25 },
    { header: 'Justificación Reducción', key: 'factores_reduccion_texto', width: 50 },
    { header: 'Plan Acción Individual', key: 'plan_accion_bio', width: 30 },
    { header: 'Restricciones Laborales', key: 'restricciones_laborales', width: 30 },
    { header: 'Seguimiento Médico', key: 'seguimiento_medico', width: 18 }
  ];

  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF042F2E' } } };
  });
  wsMatriz.getRow(1).height = 50;

  matrixRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const addedRow = wsMatriz.addRow({
      dominio_bio: row.dominio_bio,
      dimension_bio: row.dimension_bio,
      origen_riesgo: row.origen_riesgo,
      peligro_cargo: row.peligro_cargo,
      actividad_expuesta: row.actividad_expuesta,
      efectos_posibles: row.efectos_posibles,
      factor_individual: row.factor_individual,
      nivel_susceptibilidad: Number(row.nivel_susceptibilidad) || 1,
      nivel_exposicion: Number(row.nivel_exposicion) || 1,
      indice_bio_riesgo_bruto: { formula: `H${rowNumber}*I${rowNumber}`, result: row.indice_bio_riesgo_bruto },
      percepcion_riesgo_pts: Number(row.percepcion_riesgo_pts) || 0,
      factor_reduccion_percepcion: { formula: `MIN(0.4, K${rowNumber}/500)`, result: row.factor_reduccion_percepcion },
      indice_bio_riesgo_efectivo: { formula: `J${rowNumber}*(1-L${rowNumber})`, result: row.indice_bio_riesgo_efectivo },
      clasificacion_bio: { 
        formula: `IF(M${rowNumber}>=20, "Crítico", IF(M${rowNumber}>=12, "Alto", IF(M${rowNumber}>=6, "Moderado", "Bajo")))`, 
        result: row.clasificacion_bio 
      },
      controles_fuente: row.controles_fuente,
      controles_medio: row.controles_medio,
      controles_individuo: row.controles_individuo,
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion_texto: row.factores_reduccion_texto,
      plan_accion_bio: row.plan_accion_bio,
      restricciones_laborales: row.restricciones_laborales,
      seguimiento_medico: row.seguimiento_medico
    });

    addedRow.height = 36;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 10, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      
      // Center numerical or index columns
      if (colNumber >= 8 && colNumber <= 14) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      
      if (colNumber === 12) {
        cell.numFmt = '0%';
      }
      if (colNumber === 13) {
        cell.numFmt = '0.0';
      }

      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Conditional Formatting (Color Semaphores)
  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // Bruto (Col J) & Efectivo (Col M)
  const formatRules = [
    { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Red
    { type: 'cellIs', operator: 'between', formulae: ['12', '19.9'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Orange
    { type: 'cellIs', operator: 'between', formulae: ['6', '11.9'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Yellow
    { type: 'cellIs', operator: 'lessThan', formulae: ['6'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Green
  ];

  wsMatriz.addConditionalFormatting({ ref: `J2:J${finalTotalRows}`, rules: formatRules });
  wsMatriz.addConditionalFormatting({ ref: `M2:M${finalTotalRows}`, rules: formatRules });

  // Clasificación Bio (Col N)
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"Crítico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Alto"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Moderado"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Bajo"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_BioIPEVAR_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
