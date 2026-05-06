import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MatrixRow } from './MatrizIPEVARConstants';

export const exportMatrizIPEVARToExcel = async (matrixRows: MatrixRow[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  // ============================================================================
  // HOJA 1: DASHBOARD ANALÍTICO (RESUMEN EJECUTIVO)
  // ============================================================================
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  // Background color for the whole dashboard (Slate 50)
  for (let r = 1; r <= 50; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 15;
  wsDash.getColumn('D').width = 45;
  
  // Hero Header (Dark Slate / Teal)
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   📊 DASHBOARD EJECUTIVO — IPEVAR GTC-45';
  heroCell.font = { size: 22, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  // Add a nice bottom border to the hero
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF0D9488' } } }; // Teal border
  }

  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // --- CARD 1: Riesgos por Nivel de Consecuencia ---
  let dashRow = 7;
  wsDash.getCell(`B${dashRow}`).value = 'Riesgos por Nivel de Consecuencia (Interpretación NR)';
  wsDash.getCell(`B${dashRow}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
  
  dashRow++;
  // Card Header
  ['B', 'C', 'D'].forEach(col => {
    const cell = wsDash.getCell(`${col}${dashRow}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
    cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Segoe UI' };
    cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
  });
  wsDash.getCell(`B${dashRow}`).value = ' Nivel';
  wsDash.getCell(`C${dashRow}`).value = 'Cantidad';
  wsDash.getCell(`D${dashRow}`).value = ' Proporción Visual';
  
  dashRow++;
  const nrLevels = ['I', 'II', 'III', 'IV'];
  const colorsNR = ['FFEF4444', 'FFEAB308', 'FF22C55E', 'FF3B82F6']; // Red, Yellow, Green, Blue

  nrLevels.forEach((nivel, idx) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${dashRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White card body
      if (col === 'B') cell.border = { left: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'D') cell.border = { right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });

    wsDash.getCell(`B${dashRow}`).value = ` Nivel ${nivel} (${nivel === 'I' ? 'No Aceptable' : nivel === 'II' ? 'No Aceptable o Aceptable con Ctrl' : nivel === 'III' ? 'Mejorable' : 'Aceptable'})`;
    wsDash.getCell(`B${dashRow}`).font = { name: 'Segoe UI', color: { argb: 'FF334155' } };
    
    wsDash.getCell(`C${dashRow}`).value = { formula: `COUNTIF('Matriz IPEVAR'!Q2:Q${totalRows}, "${nivel}")` };
    wsDash.getCell(`C${dashRow}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${dashRow}`).font = { bold: true, size: 12, color: { argb: colorsNR[idx] }, name: 'Segoe UI' };
    
    wsDash.getCell(`D${dashRow}`).value = { formula: `REPT("█", C${dashRow})` };
    wsDash.getCell(`D${dashRow}`).font = { color: { argb: colorsNR[idx] }, size: 14 };
    dashRow++;
  });
  // Close card 1 bottom border
  ['B', 'C', 'D'].forEach(col => { 
    const cell = wsDash.getCell(`${col}${dashRow-1}`);
    cell.border = { ...(cell.border || {}), bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }; 
  });


  // --- CARD 2: Riesgos por Clasificación de Peligro ---
  dashRow += 3;
  wsDash.getCell(`B${dashRow}`).value = 'Riesgos por Clasificación de Peligro';
  wsDash.getCell(`B${dashRow}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
  
  dashRow++;
  // Card Header
  ['B', 'C', 'D'].forEach(col => {
    const cell = wsDash.getCell(`${col}${dashRow}`);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Segoe UI' };
    cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
  });
  wsDash.getCell(`B${dashRow}`).value = ' Clasificación';
  wsDash.getCell(`C${dashRow}`).value = 'Cantidad';
  wsDash.getCell(`D${dashRow}`).value = ' Proporción Visual';

  dashRow++;
  const clasificaciones = [...new Set(matrixRows.map(r => r.peligro_clasificacion).filter(Boolean))];
  
  if (clasificaciones.length === 0) {
    clasificaciones.push('Sin Datos');
  }

  clasificaciones.forEach((clasif) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${dashRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      if (col === 'B') cell.border = { left: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'D') cell.border = { right: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });

    wsDash.getCell(`B${dashRow}`).value = ` ${clasif}`;
    wsDash.getCell(`B${dashRow}`).font = { name: 'Segoe UI', color: { argb: 'FF334155' } };

    wsDash.getCell(`C${dashRow}`).value = { formula: `COUNTIF('Matriz IPEVAR'!G2:G${totalRows}, "${clasif}")` };
    wsDash.getCell(`C${dashRow}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${dashRow}`).font = { bold: true, size: 12, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
    
    wsDash.getCell(`D${dashRow}`).value = { formula: `REPT("▉", C${dashRow})` };
    wsDash.getCell(`D${dashRow}`).font = { color: { argb: 'FF94A3B8' }, size: 12 }; // Slate 400
    dashRow++;
  });
  // Close card 2 bottom border
  ['B', 'C', 'D'].forEach(col => { 
    const cell = wsDash.getCell(`${col}${dashRow-1}`);
    cell.border = { ...(cell.border || {}), bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }; 
  });


  // ============================================================================
  // HOJA 2: MATRIZ GTC-45 (DATOS)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] // Freeze headers and first 2 columns (Proceso, Zona)
  });

  // Activar Filtros Automáticos (AutoFilter) para toda la tabla
  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 24 }
  };

  // Definir Columnas
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
    { header: 'NC', key: 'nc', width: 10 },
    { header: 'NR', key: 'nr', width: 12 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 22 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 40 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 30 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 30 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 28 },
  ];

  // Estilo Premium de Cabecera
  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal 600
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF115E59' } }, left: { style: 'thin', color: { argb: 'FF115E59' } },
      bottom: { style: 'medium', color: { argb: 'FF115E59' } }, right: { style: 'thin', color: { argb: 'FF115E59' } }
    };
  });
  wsMatriz.getRow(1).height = 45; // Cabecera más alta

  // Añadir Datos con Zebra Striping
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
      nc: Number(row.nc) || 0,
      nr: { formula: `N${rowNumber}*O${rowNumber}`, result: row.nr },
      interpretacion_nr: row.interpretacion_nr,
      aceptabilidad: row.aceptabilidad,
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion: row.factores_reduccion,
    });

    // Color Zebra (Alterno)
    const isEven = index % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Blanco o Slate 50

    // Formato de celdas por fila
    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } }; // Slate 800
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true }; // Alineación Superior
      
      // Centrar columnas numéricas y cortas
      if (colNumber === 5 || (colNumber >= 12 && colNumber <= 17)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
      }
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, // Slate 200 sutil
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // -- Formato Condicional para NP, NR e Interpretación --
  
  // NP (Columna N)
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${totalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['2', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // NR (Columna P)
  wsMatriz.addConditionalFormatting({
    ref: `P2:P${totalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel I (Rojo)
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Nivel II (Amarillo)
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel III (Verde)
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF3B82F6' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Nivel IV (Azul)
    ]
  });

  // Generar y Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVAR_GTC45_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
