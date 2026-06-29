const ExcelJS = require('exceljs');

// Helper functions for IPEVAR GTC-45
function getInterpretacionNP(np) {
  if (np === undefined || np === null || isNaN(np)) return '—';
  if (np >= 24) return 'Muy Alto (MA)';
  if (np >= 10) return 'Alto (A)';
  if (np >= 6) return 'Medio (M)';
  return 'Bajo (B)';
}

// Helper functions for Chemical Compatibility
function getChemicalCompatibility(classA, classB) {
  if (!classA || !classB || classA === 'No Peligroso' || classB === 'No Peligroso') {
    return {
      status: 'compatible',
      reason: 'Sustancias no clasificadas como peligrosas bajo el SGA.',
      recommendation: 'Pueden almacenarse juntas. Seguir las recomendaciones generales de orden, limpieza e higiene.'
    };
  }

  const cA = classA.split(':')[0].trim();
  const cB = classB.split(':')[0].trim();

  // Mismos grupos
  if (cA === cB) {
    if (cA === 'Clase 1') {
      return {
        status: 'incompatible',
        reason: 'Explosivos de la misma clase pero potencialmente de diferentes grupos de compatibilidad.',
        recommendation: 'Se requiere segregación física. Solo pueden almacenarse juntos bajo análisis y autorización de expertos.'
      };
    }
    if (cA === 'Clase 7') {
      return {
        status: 'incompatible',
        reason: 'Materiales Radiactivos.',
        recommendation: 'Almacenar en celdas de blindaje específicas separadas de cualquier otro material.'
      };
    }
    if (cA === 'Clase 8') {
      return {
        status: 'caution',
        reason: 'Sustancias corrosivas de naturaleza ácida y alcalina (bases).',
        recommendation: 'Verificar incompatibilidades específicas en FDS. Evitar almacenamiento conjunto de ácidos y bases (pueden neutralizarse violentamente). Utilizar cubetos o diques de contención independientes.'
      };
    }
    return {
      status: 'compatible',
      reason: 'Pertenecen a la misma clase de peligro de la ONU.',
      recommendation: 'Pueden almacenarse juntos de forma segura. Respetar diques de contención en líquidos.'
    };
  }

  // Clase 1 Explosivos y Clase 7 Radiactivos incompatibles con todo
  if (cA === 'Clase 1' || cB === 'Clase 1') {
    return {
      status: 'incompatible',
      reason: 'Sustancias Explosivas (Clase 1) presentan alto riesgo de detonación simpática.',
      recommendation: 'Segregación física absoluta. Almacenar en polvorines autorizados alejados de cualquier otra sustancia.'
    };
  }
  if (cA === 'Clase 7' || cB === 'Clase 7') {
    return {
      status: 'incompatible',
      reason: 'Materiales Radiactivos (Clase 7) emiten radiación ionizante.',
      recommendation: 'Segregación física absoluta. Almacenar en áreas restringidas con blindaje técnico de plomo o concreto.'
    };
  }

  // Clase 3 vs Clase 5
  if ((cA === 'Clase 3' && (cB === 'Clase 5.1' || cB === 'Clase 5.2')) ||
      (cB === 'Clase 3' && (cA === 'Clase 5.1' || cA === 'Clase 5.2'))) {
    return {
      status: 'incompatible',
      reason: 'La combinación de un combustible y un comburente causa incendios de alta intensidad.',
      recommendation: 'Segregación total. Separar por muros corta-fuego o a distancia mínima de 5 metros.'
    };
  }

  // Clase 3 vs Clase 8
  if ((cA === 'Clase 3' && cB === 'Clase 8') || (cB === 'Clase 3' && cA === 'Clase 8')) {
    return {
      status: 'incompatible',
      reason: 'El contacto de vapores inflamables con corrosivos puede generar reacciones fuertemente exotérmicas.',
      recommendation: 'Segregación técnica. Mantener alejados.'
    };
  }

  // Clase 5.1 vs Clase 8
  if ((cA === 'Clase 5.1' && cB === 'Clase 8') || (cB === 'Clase 5.1' && cA === 'Clase 8')) {
    return {
      status: 'incompatible',
      reason: 'Las sustancias comburentes reaccionan de manera inestable y violenta con ácidos corrosivos.',
      recommendation: 'Segregación. Almacenar de forma independiente con contención de derrames separada.'
    };
  }

  // Clase 4.3 vs Líquidos/Corrosivos
  if (cA === 'Clase 4.3' || cB === 'Clase 4.3') {
    if (cA === 'Clase 3' || cB === 'Clase 3' || cA === 'Clase 8' || cB === 'Clase 8') {
      return {
        status: 'incompatible',
        reason: 'Sustancias que desprenden gases inflamables en contacto con agua reaccionan exotérmicamente.',
        recommendation: 'Segregación total. Mantener en áreas herméticamente cerradas libres de humedad.'
      };
    }
  }

  return {
    status: 'caution',
    reason: 'Clases de peligro diferentes compatibles bajo restricciones generales.',
    recommendation: 'Almacenar juntos solo si se cuenta con sistemas de contención separados y ventilación apropiada.'
  };
}

/**
 * Generates GTC-45 / IPEVAR elegant excel sheets matching frontend exportIPEVAR.ts
 */
async function exportIPEVARToExcel(matrixRows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // 1. DASHBOARD ANALÍTICO
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 25;
  wsDash.getColumn('D').width = 40;
  
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   ⚡ DASHBOARD INTERACTIVO — IPEVAR GTC-45';
  heroCell.font = { size: 28, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF042F2E' } } };
  }

  const procesos = [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');

  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  procesos.forEach((p, i) => wsDash.getCell(`Z${i+2}`).value = p);
  const numProcesos = procesos.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (PROCESO):';
  wsDash.getCell('B6').font = { size: 14, bold: true, color: { argb: 'FF334155' }, name: 'Book Antiqua' };
  wsDash.getCell('B6').alignment = { vertical: 'middle', horizontal: 'right' };

  const filterCell = wsDash.getCell('C6');
  filterCell.value = 'TODOS';
  filterCell.font = { size: 14, bold: true, color: { argb: 'FF0F766E' }, name: 'Book Antiqua' };
  filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  filterCell.border = {
    top: { style: 'medium', color: { argb: 'FF0D9488' } }, left: { style: 'medium', color: { argb: 'FF0D9488' } },
    bottom: { style: 'medium', color: { argb: 'FF0D9488' } }, right: { style: 'medium', color: { argb: 'FF0D9488' } }
  };
  filterCell.alignment = { vertical: 'middle', horizontal: 'center' };
  filterCell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`'Dashboard Analítico'!$Z$1:$Z$${numProcesos}`]
  };

  const kpiHeaders = [
    { col: 'B', title: 'Total Riesgos Evaluados' },
    { col: 'C', title: 'Riesgos Críticos (No Aceptable)' },
    { col: 'D', title: '% Criticidad Global' }
  ];

  kpiHeaders.forEach(kpi => {
    const headerCell = wsDash.getCell(`${kpi.col}8`);
    headerCell.value = kpi.title;
    headerCell.font = { size: 12, bold: true, color: { argb: 'FF334155' }, name: 'Book Antiqua' };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const valueCell = wsDash.getCell(`${kpi.col}9`);
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  wsDash.getCell('B9').value = { formula: `IF($C$6="TODOS", COUNTA('Matriz IPEVAR'!A2:A${totalRows}), COUNTIF('Matriz IPEVAR'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('B9').font = { size: 24, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };

  wsDash.getCell('C9').value = { formula: `IF($C$6="TODOS", COUNTIF('Matriz IPEVAR'!S2:S${totalRows}, "No Aceptable"), COUNTIFS('Matriz IPEVAR'!S2:S${totalRows}, "No Aceptable", 'Matriz IPEVAR'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('C9').font = { size: 24, bold: true, color: { argb: 'FFEF4444' }, name: 'Book Antiqua' };

  wsDash.getCell('D9').value = { formula: `IF(B9=0, 0, C9/B9)` };
  wsDash.getCell('D9').font = { size: 24, bold: true, color: { argb: 'FFF97316' }, name: 'Book Antiqua' };
  wsDash.getCell('D9').numFmt = '0.00%';
  wsDash.getRow(9).height = 40;

  const getInteractiveFormula = (colTarget, valTarget) => {
    return `IF($C$6="TODOS", COUNTIF('Matriz IPEVAR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}"), COUNTIFS('Matriz IPEVAR'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}", 'Matriz IPEVAR'!A2:A${totalRows}, $C$6))`;
  };

  const createCardHeader = (row, title) => {
    wsDash.getCell(`B${row}`).value = title;
    wsDash.getCell(`B${row}`).font = { size: 16, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };
    
    const hRow = row + 1;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    });
    wsDash.getCell(`B${hRow}`).value = ' Categoría';
    wsDash.getCell(`C${hRow}`).value = 'Cantidad';
    wsDash.getCell(`D${hRow}`).value = ' Tendencia Interactiva';
    return hRow + 1;
  };

  const addCardRow = (row, label, countFormula, isLast, colorArgb) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      let borders = {};
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = Object.assign({}, cell.border || {}, borders);
    });

    wsDash.getCell(`B${row}`).value = ` ${label}`;
    wsDash.getCell(`B${row}`).font = { name: 'Book Antiqua', color: { argb: 'FF334155' } };
    
    wsDash.getCell(`C${row}`).value = { formula: countFormula };
    wsDash.getCell(`C${row}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colorArgb }, name: 'Book Antiqua' };
    
    wsDash.getCell(`D${row}`).value = { formula: countFormula };
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  };

  let dashRow = 12;
  dashRow = createCardHeader(dashRow, 'Riesgos por Aceptabilidad GTC-45');
  const aceptabilidades = [
    { name: 'No Aceptable', color: 'FFEF4444' },
    { name: 'No Aceptable o Aceptable con Control Específico', color: 'FFF97316' },
    { name: 'Mejorable', color: 'FF22C55E' },
    { name: 'Aceptable', color: 'FFEAB308' }
  ];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac.name, getInteractiveFormula('S', ac.name), idx === aceptabilidades.length - 1, ac.color);
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF3B82F6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Top Riesgos por Proceso');
  const startCard2 = dashRow;

  procesos.forEach((proc, idx) => {
    addCardRow(dashRow, proc, getInteractiveFormula('A', proc), idx === procesos.length - 1, 'FF14B8A6');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard2}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF14B8A6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Riesgos por Clasificación de Peligro');
  const clasificaciones = [...new Set(matrixRows.map(r => r.peligro_clasificacion).filter(Boolean))];
  if (clasificaciones.length === 0) clasificaciones.push('Sin Datos');
  const startCard3 = dashRow;

  clasificaciones.forEach((clasif, idx) => {
    addCardRow(dashRow, clasif, getInteractiveFormula('G', clasif), idx === clasificaciones.length - 1, 'FF8B5CF6');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard3}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // 2. HOJA DE MATRIZ DATOS
  const wsMatriz = wb.addWorksheet('Matriz IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }]
  });

  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 31 }
  };

  wsMatriz.columns = [
    { header: 'Proceso', key: 'proceso', width: 28 },
    { header: 'Zona / Lugar', key: 'zona', width: 22 },
    { header: 'Actividad', key: 'actividad', width: 28 },
    { header: 'Tareas', key: 'tareas', width: 35 },
    { header: 'Rutinaria', key: 'rutinaria', width: 12 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 50 },
    { header: 'Clasificación', key: 'peligro_clasificacion', width: 22 },
    { header: 'Efectos Posibles', key: 'efectos_posibles', width: 35 },
    { header: 'Ctrl. Fuente', key: 'controles_fuente', width: 22 },
    { header: 'Ctrl. Medio', key: 'controles_medio', width: 22 },
    { header: 'Ctrl. Individuo', key: 'controles_individuo', width: 22 },
    { header: 'ND', key: 'nd', width: 10 },
    { header: 'NE', key: 'ne', width: 10 },
    { header: 'NP', key: 'np', width: 10 },
    { header: 'Interpretación NP', key: 'interpretacion_np', width: 18 },
    { header: 'NC', key: 'nc', width: 10 },
    { header: 'NR (Nivel)', key: 'nr', width: 12 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 22 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 40 },
    { header: 'Nro. Expuestos', key: 'nro_expuestos', width: 15 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 30 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 15 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 30 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 30 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 65 },
    { header: 'ND Cualitativo (Anexo C)', key: 'nd_cualitativo', width: 22 },
    { header: 'Dominio Psicosocial', key: 'psicosocial_dominio', width: 25 },
    { header: 'Dimensión Psicosocial', key: 'psicosocial_dimension', width: 25 }
  ];

  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF042F2E' } } };
  });
  wsMatriz.getRow(1).height = 55;

  matrixRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const addedRow = wsMatriz.addRow({
      proceso: row.proceso,
      zona: row.zona,
      actividad: row.actividad,
      tareas: row.tareas,
      rutinaria: row.rutinaria,
      peligro_descripcion: row.peligro_descripcion,
      peligro_clasificacion: row.peligro_clasificacion,
      efectos_posibles: row.efectos_posibles,
      controles_fuente: row.controles_fuente,
      controles_medio: row.controles_medio,
      controles_individuo: row.controles_individuo,
      nd: Number(row.nd) || 0,
      ne: Number(row.ne) || 0,
      np: { formula: `L${rowNumber}*M${rowNumber}`, result: row.np },
      interpretacion_np: getInterpretacionNP(row.np),
      nc: Number(row.nc) || 0,
      nr: { formula: `N${rowNumber}*P${rowNumber}`, result: row.nr },
      interpretacion_nr: row.interpretacion_nr,
      aceptabilidad: row.aceptabilidad,
      nro_expuestos: row.nro_expuestos !== undefined ? row.nro_expuestos : 1,
      peor_consecuencia: row.peor_consecuencia || '',
      requisito_legal: row.requisito_legal || '',
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion: row.factores_reduccion,
      nd_cualitativo: row.nd_cualitativo,
      psicosocial_dominio: row.psicosocial_dominio,
      psicosocial_dimension: row.psicosocial_dimension,
    });

    addedRow.height = 40;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      
      if (colNumber === 5 || (colNumber >= 12 && colNumber <= 18)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });

  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // Formatting semáforos
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['6', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['2', '4'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  wsMatriz.addConditionalFormatting({
    ref: `Q2:Q${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }
    ]
  });

  wsMatriz.addConditionalFormatting({
    ref: `R2:R${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"I"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"II"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"III"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"IV"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }
    ]
  });

  wsMatriz.addConditionalFormatting({
    ref: `S2:S${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable o Aceptable con Control Específico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Mejorable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }
    ]
  });

  const validationRows = Math.max(finalTotalRows + 50, 100);
  for (let r = 2; r <= validationRows; r++) {
    wsMatriz.getCell(`E${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Sí,No"'],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Valor inválido',
      error: 'Por favor, seleccione "Sí" o "No" de la lista desplegable.'
    };
  }

  return await wb.xlsx.writeBuffer();
}

/**
 * Generates PESV elegant excel sheets matching frontend exportPESV.ts
 */
async function exportMatrizPESVToExcel(matrixRows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // 1. DASHBOARD ANALÍTICO
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 25;
  wsDash.getColumn('D').width = 40;
  
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   🚗 DASHBOARD INTERACTIVO — MATRIZ PESV';
  heroCell.font = { size: 28, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF075985' } } };
  }

  const procesos = [...new Set(matrixRows.map(r => r.grupo_trabajo).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');

  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  procesos.forEach((p, i) => wsDash.getCell(`Z${i+2}`).value = p);
  const numProcesos = procesos.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (GRUPO TRABAJO):';
  wsDash.getCell('B6').font = { size: 12, bold: true, color: { argb: 'FF1E293B' }, name: 'Book Antiqua' };
  wsDash.getCell('B6').alignment = { vertical: 'middle', horizontal: 'right' };

  const filterCell = wsDash.getCell('C6');
  filterCell.value = 'TODOS';
  filterCell.font = { size: 14, bold: true, color: { argb: 'FF0284C7' }, name: 'Book Antiqua' };
  filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
  filterCell.border = {
    top: { style: 'medium', color: { argb: 'FF0284C7' } }, left: { style: 'medium', color: { argb: 'FF0284C7' } },
    bottom: { style: 'medium', color: { argb: 'FF0284C7' } }, right: { style: 'medium', color: { argb: 'FF0284C7' } }
  };
  filterCell.alignment = { vertical: 'middle', horizontal: 'center' };
  filterCell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`'Dashboard Analítico'!$Z$1:$Z$${numProcesos}`]
  };

  const kpiHeaders = [
    { col: 'B', title: 'Total Riesgos Viales' },
    { col: 'C', title: 'Riesgos Críticos (No Aceptable)' },
    { col: 'D', title: '% Criticidad Vial' }
  ];

  kpiHeaders.forEach(kpi => {
    const headerCell = wsDash.getCell(`${kpi.col}8`);
    headerCell.value = kpi.title;
    headerCell.font = { size: 12, bold: true, color: { argb: 'FF1E293B' }, name: 'Book Antiqua' };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

    const valueCell = wsDash.getCell(`${kpi.col}9`);
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    valueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    valueCell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  });

  wsDash.getCell('B9').value = { formula: `IF($C$6="TODOS", COUNTA('Matriz PESV'!A2:A${totalRows}), COUNTIF('Matriz PESV'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('B9').font = { size: 24, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };

  wsDash.getCell('C9').value = { formula: `IF($C$6="TODOS", COUNTIF('Matriz PESV'!Q2:Q${totalRows}, "NO ACEPTABLE"), COUNTIFS('Matriz PESV'!Q2:Q${totalRows}, "NO ACEPTABLE", 'Matriz PESV'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('C9').font = { size: 24, bold: true, color: { argb: 'FFEF4444' }, name: 'Book Antiqua' };

  wsDash.getCell('D9').value = { formula: `IF(B9=0, 0, C9/B9)` };
  wsDash.getCell('D9').font = { size: 24, bold: true, color: { argb: 'FFF97316' }, name: 'Book Antiqua' };
  wsDash.getCell('D9').numFmt = '0.00%';
  wsDash.getRow(9).height = 40;

  const getInteractiveFormula = (colTarget, valTarget) => {
    return `IF($C$6="TODOS", COUNTIF('Matriz PESV'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}"), COUNTIFS('Matriz PESV'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}", 'Matriz PESV'!A2:A${totalRows}, $C$6))`;
  };

  const createCardHeader = (row, title) => {
    wsDash.getCell(`B${row}`).value = title;
    wsDash.getCell(`B${row}`).font = { size: 16, bold: true, color: { argb: 'FF0F172A' }, name: 'Book Antiqua' };
    
    const hRow = row + 1;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Book Antiqua' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    });
    wsDash.getCell(`B${hRow}`).value = ' Categoría';
    wsDash.getCell(`C${hRow}`).value = 'Cantidad';
    wsDash.getCell(`D${hRow}`).value = ' Tendencia Interactiva';
    return hRow + 1;
  };

  const addCardRow = (row, label, countFormula, isLast, colorArgb) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      let borders = {};
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = Object.assign({}, cell.border || {}, borders);
    });

    wsDash.getCell(`B${row}`).value = ` ${label}`;
    wsDash.getCell(`B${row}`).font = { name: 'Book Antiqua', color: { argb: 'FF334155' } };
    
    wsDash.getCell(`C${row}`).value = { formula: countFormula };
    wsDash.getCell(`C${row}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colorArgb }, name: 'Book Antiqua' };
    
    wsDash.getCell(`D${row}`).value = { formula: countFormula };
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  };

  let dashRow = 12;
  dashRow = createCardHeader(dashRow, 'Riesgos por Aceptabilidad PESV');
  const aceptabilidades = [
    { name: 'NO ACEPTABLE', color: 'FFEF4444' },
    { name: 'ACEPTABLE CON CONTROL ESPECIFICO', color: 'FFEAB308' },
    { name: 'ACEPTABLE', color: 'FF22C55E' }
  ];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac.name, getInteractiveFormula('Q', ac.name), idx === aceptabilidades.length - 1, ac.color);
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0284C7' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Riesgos por Rol en la Vía');
  const actores = ['Peatón', 'Pasajero', 'Conductor de motocicleta', 'Conductor de vehículo liviano', 'Conductor de vehículo pesado', 'Ciclista', 'Otro'];
  const startCard2 = dashRow;

  actores.forEach((act, idx) => {
    addCardRow(dashRow, act, getInteractiveFormula('D', act), idx === actores.length - 1, 'FF0284C7');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard2}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0284C7' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // 2. MATRIZ PESV
  const wsMatriz = wb.addWorksheet('Matriz PESV', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }]
  });

  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 24 }
  };

  wsMatriz.columns = [
    { header: 'Grupo de Trabajo', key: 'grupo_trabajo', width: 28 },
    { header: 'Cargo', key: 'cargo', width: 22 },
    { header: 'Tipo Desplazamiento', key: 'tipo_desplazamiento', width: 20 },
    { header: 'Rol en la Vía', key: 'rol_via', width: 25 },
    { header: 'Factor de Riesgo', key: 'factor_riesgo', width: 22 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 50 },
    { header: 'Controles Existentes', key: 'controles_existentes_descripcion', width: 35 },
    { header: 'Tipo de Controles', key: 'controles_existentes_tipo', width: 20 },
    { header: 'NP Cualitativo', key: 'np_cualitativo', width: 20 },
    { header: 'NP Cuantitativo', key: 'np_cuantitativo', width: 15 },
    { header: 'NE Cualitativo', key: 'ne_cualitativo', width: 20 },
    { header: 'NE Cuantitativo', key: 'ne_cuantitativo', width: 15 },
    { header: 'NC Cualitativo', key: 'nc_cualitativo', width: 20 },
    { header: 'NC Cuantitativo', key: 'nc_cuantitativo', width: 15 },
    { header: 'Calificación', key: 'calificacion', width: 15 },
    { header: 'Nivel de Riesgo', key: 'nivel_riesgo', width: 30 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 35 },
    { header: 'Tratamiento / Acción', key: 'tratamiento_accion', width: 25 },
    { header: 'Plan Acción (Medio)', key: 'plan_accion_medio', width: 30 },
    { header: 'Plan Acción (Vehículo)', key: 'plan_accion_vehiculo', width: 30 },
    { header: 'Plan Acción (Individuo)', key: 'plan_accion_individuo', width: 30 },
    { header: 'Plan Acción (Infraestructura)', key: 'plan_accion_infraestructura', width: 30 },
    { header: 'Responsable', key: 'responsable', width: 25 },
    { header: 'Fecha / Periodicidad', key: 'fecha_programacion', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Observaciones', key: 'observaciones', width: 35 }
  ];

  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF075985' } } };
  });
  wsMatriz.getRow(1).height = 55;

  matrixRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const addedRow = wsMatriz.addRow({
      grupo_trabajo: row.grupo_trabajo,
      cargo: row.cargo,
      tipo_desplazamiento: row.tipo_desplazamiento,
      rol_via: row.rol_via,
      factor_riesgo: row.factor_riesgo,
      peligro_descripcion: row.peligro_descripcion,
      controles_existentes_descripcion: row.controles_existentes_descripcion,
      controles_existentes_tipo: row.controles_existentes_tipo,
      np_cualitativo: row.np_cualitativo,
      np_cuantitativo: Number(row.np_cuantitativo) || 3,
      ne_cualitativo: row.ne_cualitativo,
      ne_cuantitativo: Number(row.ne_cuantitativo) || 3,
      nc_cualitativo: row.nc_cualitativo,
      nc_cuantitativo: Number(row.nc_cuantitativo) || 3,
      calificacion: { formula: `J${rowNumber}+L${rowNumber}+N${rowNumber}`, result: row.calificacion },
      nivel_riesgo: row.nivel_riesgo || 'MODERADO',
      aceptabilidad: row.aceptabilidad,
      tratamiento_accion: row.tratamiento_accion,
      plan_accion_medio: row.plan_accion_medio,
      plan_accion_vehiculo: row.plan_accion_vehiculo,
      plan_accion_individuo: row.plan_accion_individuo,
      plan_accion_infraestructura: row.plan_accion_infraestructura,
      responsable: row.responsable,
      fecha_programacion: row.fecha_programacion,
      estado: row.estado,
      observaciones: row.observaciones
    });

    addedRow.height = 40;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF0F9FF';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      
      if (colNumber >= 9 && colNumber <= 15) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });

  return await wb.xlsx.writeBuffer();
}

/**
 * Generates Chemical Compatibility elegant excel sheets matching frontend exportCompatibilidad.ts
 */
async function exportCompatibilidadToExcel(matrixRows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // 1. INVENTARIO QUÍMICO
  const wsInv = wb.addWorksheet('Inventario Químico', {
    views: [{ showGridLines: true }]
  });

  wsInv.mergeCells('A1:K2');
  const titleCell = wsInv.getCell('A1');
  titleCell.value = '📋 INVENTARIO DE SUSTANCIAS Y PRODUCTOS QUÍMICOS';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  wsInv.mergeCells('A3:K3');
  const infoCell = wsInv.getCell('A3');
  infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Normatividad: Decreto 1496 de 2018 / SGA / NTC 3966`;
  infoCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const headers = [
    'Nro',
    'Nombre del Producto',
    'Fabricante / Proveedor',
    'Estado Físico',
    'Clase de Peligro ONU',
    'Pictogramas SGA',
    'Cantidad Almacenada',
    'Ubicación en Almacén',
    '¿Tiene FDS?',
    '¿Tiene Rótulo SGA?',
    'Requisitos de Almacenamiento'
  ];

  const headerRow = wsInv.addRow(headers);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      right: { style: 'thin', color: { argb: 'FF042F2E' } }
    };
  });

  matrixRows.forEach((row, index) => {
    const dataRow = wsInv.addRow([
      index + 1,
      row.nombre,
      row.fabricante || 'Desconocido',
      row.estado_fisico,
      row.clasificacion_onu,
      (row.pictogramas_sga || []).join(', '),
      row.cantidad_almacenada,
      row.ubicacion,
      row.tiene_fds,
      row.tiene_rotulo,
      row.requisitos_almacenamiento || 'Ninguno'
    ]);

    dataRow.height = 22;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Segoe UI' };
      cell.alignment = { vertical: 'middle', horizontal: colNum === 1 || colNum === 9 || colNum === 10 ? 'center' : 'left', wrapText: true };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if ((colNum === 9 || colNum === 10) && cell.value === 'No') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 10, name: 'Segoe UI' };
      }
    });
  });

  const colWidths = [6, 25, 20, 12, 30, 25, 18, 20, 12, 14, 40];
  colWidths.forEach((w, i) => {
    wsInv.getColumn(i + 1).width = w;
  });

  // 2. MATRIZ DE COMPATIBILIDAD CRUZADA (N x N)
  const wsCross = wb.addWorksheet('Matriz de Compatibilidad', {
    views: [{ showGridLines: true }]
  });

  wsCross.mergeCells('A1:O2');
  const titleCellCross = wsCross.getCell('A1');
  titleCellCross.value = '⚡ MATRIZ CRUZADA DE COMPATIBILIDAD QUÍMICA (Semáforo)';
  titleCellCross.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCellCross.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  titleCellCross.alignment = { vertical: 'middle', horizontal: 'center' };

  if (matrixRows.length > 0) {
    wsCross.getCell(4, 1).value = 'Productos';
    wsCross.getCell(4, 1).font = { bold: true, size: 10, name: 'Segoe UI' };
    wsCross.getCell(4, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    wsCross.getCell(4, 1).alignment = { vertical: 'middle', horizontal: 'center' };
    wsCross.getCell(4, 1).border = {
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      right: { style: 'medium', color: { argb: 'FF94A3B8' } }
    };

    matrixRows.forEach((row, i) => {
      const colLetter = String.fromCharCode(66 + i);
      const cell = wsCross.getCell(`${colLetter}4`);
      cell.value = row.nombre;
      cell.font = { bold: true, size: 9, name: 'Segoe UI' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF94A3B8' } } };
      wsCross.getColumn(colLetter).width = 16;
    });

    wsCross.getRow(4).height = 30;
    wsCross.getColumn('A').width = 22;

    matrixRows.forEach((rowI, i) => {
      const rowNum = 5 + i;
      const rowCellHeader = wsCross.getCell(`A${rowNum}`);
      rowCellHeader.value = rowI.nombre;
      rowCellHeader.font = { bold: true, size: 9, name: 'Segoe UI' };
      rowCellHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      rowCellHeader.alignment = { vertical: 'middle', horizontal: 'left' };
      rowCellHeader.border = { right: { style: 'medium', color: { argb: 'FF94A3B8' } } };

      wsCross.getRow(rowNum).height = 25;

      matrixRows.forEach((rowJ, j) => {
        const colLetter = String.fromCharCode(66 + j);
        const cell = wsCross.getCell(`${colLetter}${rowNum}`);
        
        const compat = getChemicalCompatibility(rowI.clasificacion_onu, rowJ.clasificacion_onu);

        if (compat.status === 'incompatible') {
          cell.value = '❌ INCOMPATIBLE';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 8, name: 'Segoe UI' };
        } else if (compat.status === 'caution') {
          cell.value = '⚠ PRECAUCIÓN';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { bold: true, color: { argb: 'FF92400E' }, size: 8, name: 'Segoe UI' };
        } else {
          cell.value = '✓ COMPATIBLE';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
          cell.font = { bold: true, color: { argb: 'FF065F46' }, size: 8, name: 'Segoe UI' };
        }

        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    const legendStartRow = 5 + matrixRows.length + 2;
    wsCross.mergeCells(`A${legendStartRow}:D${legendStartRow}`);
    const legendHeader = wsCross.getCell(`A${legendStartRow}`);
    legendHeader.value = '📌 LEYENDA Y CRITERIOS DE SEGREGACIÓN (NTC 3966)';
    legendHeader.font = { bold: true, size: 10, name: 'Segoe UI' };
    
    const l1 = wsCross.addRow(['✓ COMPATIBLE', 'Las sustancias pueden almacenarse juntas. Verificar diques para contención de líquidos.']);
    l1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    l1.getCell(1).font = { bold: true, color: { argb: 'FF065F46' }, size: 9, name: 'Segoe UI' };

    const l2 = wsCross.addRow(['⚠ PRECAUCIÓN', 'Existen restricciones. Verificar incompatibilidades específicas en FDS de cada producto. Separar físicamente.']);
    l2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    l2.getCell(1).font = { bold: true, color: { argb: 'FF92400E' }, size: 9, name: 'Segoe UI' };

    const l3 = wsCross.addRow(['❌ INCOMPATIBLE', 'No deben almacenarse juntos. Requiere separación de 5 metros o mediante muros corta-fuego de 2 horas.']);
    l3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
    l3.getCell(1).font = { bold: true, color: { argb: 'FF991B1B' }, size: 9, name: 'Segoe UI' };
  }

  return await wb.xlsx.writeBuffer();
}

module.exports = {
  exportIPEVARToExcel,
  exportMatrizPESVToExcel,
  exportCompatibilidadToExcel
};
