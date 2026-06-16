import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MatrixRow } from './MatrizPESVConstants';

export const exportMatrizPESVToExcel = async (matrixRows: MatrixRow[]) => {
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

  // Light Theme Background
  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // Light blue 50
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 25;
  wsDash.getColumn('D').width = 40;
  
  // Hero Header
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   🚗 DASHBOARD INTERACTIVO — MATRIZ PESV';
  heroCell.font = { size: 28, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } }; // Light Blue/Sky 600
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF075985' } } }; // Sky 800
  }

  // --- INTERACTIVE SLICER (DROPDOWN) ---
  const procesos = [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');

  // Hidden Column Z for Data Validation Source
  wsDash.getColumn('Z').hidden = true;
  wsDash.getCell('Z1').value = 'TODOS';
  procesos.forEach((p, i) => wsDash.getCell(`Z${i+2}`).value = p);
  const numProcesos = procesos.length + 1;

  wsDash.getCell('B6').value = ' 🔍 FILTRO MAESTRO (PROCESO):';
  wsDash.getCell('B6').font = { size: 14, bold: true, color: { argb: 'FF1E293B' }, name: 'Book Antiqua' };
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

  // --- KPI CARDS (ROW 8-9) ---
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

  wsDash.getCell('C9').value = { formula: `IF($C$6="TODOS", COUNTIF('Matriz PESV'!O2:O${totalRows}, "No Aceptable"), COUNTIFS('Matriz PESV'!O2:O${totalRows}, "No Aceptable", 'Matriz PESV'!A2:A${totalRows}, $C$6))` };
  wsDash.getCell('C9').font = { size: 24, bold: true, color: { argb: 'FFEF4444' }, name: 'Book Antiqua' };

  wsDash.getCell('D9').value = { formula: `IF(B9=0, 0, C9/B9)` };
  wsDash.getCell('D9').font = { size: 24, bold: true, color: { argb: 'FFF97316' }, name: 'Book Antiqua' };
  wsDash.getCell('D9').numFmt = '0.00%';
  wsDash.getRow(9).height = 40;

  const getInteractiveFormula = (colTarget: string, valTarget: string) => {
    return `IF($C$6="TODOS", COUNTIF('Matriz PESV'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}"), COUNTIFS('Matriz PESV'!${colTarget}2:${colTarget}${totalRows}, "${valTarget}", 'Matriz PESV'!A2:A${totalRows}, $C$6))`;
  };

  const createCardHeader = (row: number, title: string) => {
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

  const addCardRow = (row: number, label: string, countFormula: string, isLast: boolean, colorArgb: string) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      let borders: any = {};
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = { ...(cell.border || {}), ...borders };
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
    { name: 'No Aceptable', color: 'FFEF4444' },
    { name: 'No Aceptable o Aceptable con Control Específico', color: 'FFF97316' },
    { name: 'Aceptable con Control Específico', color: 'FFEAB308' },
    { name: 'Aceptable', color: 'FF22C55E' }
  ];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac.name, getInteractiveFormula('O', ac.name), idx === aceptabilidades.length - 1, ac.color);
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0284C7' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Riesgos por Actor Vial');
  const actores = ['Peatón', 'Pasajero', 'Conductor de motocicleta', 'Conductor de vehículo liviano', 'Conductor de vehículo pesado', 'Ciclista'];
  const startCard2 = dashRow;

  actores.forEach((act, idx) => {
    addCardRow(dashRow, act, getInteractiveFormula('C', act), idx === actores.length - 1, 'FF0284C7');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard2}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF0284C7' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });

  // ============================================================================
  // HOJA 2: MATRIZ PESV (DATOS)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz PESV', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }]
  });

  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 22 }
  };

  wsMatriz.columns = [
    { header: 'Proceso', key: 'proceso', width: 28 },
    { header: 'Zona / Trayecto', key: 'zona', width: 22 },
    { header: 'Actor Vial', key: 'actor_vial', width: 25 },
    { header: 'Tipo Desplazamiento', key: 'tipo_desplazamiento', width: 20 },
    { header: 'Factor de Riesgo', key: 'factor_riesgo', width: 22 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 50 },
    { header: 'Efectos / Consecuencias', key: 'consecuencias', width: 35 },
    { header: 'Ctrl. Persona', key: 'controles_existentes_persona', width: 25 },
    { header: 'Ctrl. Vehículo', key: 'controles_existentes_vehiculo', width: 25 },
    { header: 'Ctrl. Vía / Entorno', key: 'controles_existentes_via', width: 25 },
    { header: 'Probabilidad', key: 'probabilidad', width: 12 },
    { header: 'Severidad', key: 'severidad', width: 12 },
    { header: 'Nivel de Riesgo', key: 'nivel_riesgo', width: 15 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 20 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 40 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 30 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 30 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 65 },
    { header: 'Responsable', key: 'responsable', width: 25 },
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
      proceso: row.proceso,
      zona: row.zona,
      actor_vial: row.actor_vial,
      tipo_desplazamiento: row.tipo_desplazamiento,
      factor_riesgo: row.factor_riesgo,
      peligro_descripcion: row.peligro_descripcion,
      consecuencias: row.consecuencias,
      controles_existentes_persona: row.controles_existentes_persona,
      controles_existentes_vehiculo: row.controles_existentes_vehiculo,
      controles_existentes_via: row.controles_existentes_via,
      probabilidad: Number(row.probabilidad) || 0,
      severidad: Number(row.severidad) || 0,
      nivel_riesgo: { formula: `K${rowNumber}*L${rowNumber}`, result: row.nivel_riesgo },
      interpretacion_nr: row.interpretacion_nr,
      aceptabilidad: row.aceptabilidad,
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion: row.factores_reduccion,
      responsable: row.responsable,
    });

    addedRow.height = 40;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF0F9FF';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      
      if (colNumber === 4 || colNumber === 5 || (colNumber >= 11 && colNumber <= 15)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });

  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // Nivel de Riesgo (Columna M)
  wsMatriz.addConditionalFormatting({
    ref: `M2:M${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['200'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Crítico
      { type: 'cellIs', operator: 'between', formulae: ['100', '199'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Alto
      { type: 'cellIs', operator: 'between', formulae: ['40', '99'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Medio
      { type: 'cellIs', operator: 'between', formulae: ['0', '39'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Bajo
    ]
  });

  // Aceptabilidad (Columna O)
  wsMatriz.addConditionalFormatting({
    ref: `O2:O${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"No Aceptable o Aceptable con Control Específico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Aceptable con Control Específico"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"Aceptable"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_Riesgos_PESV_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
