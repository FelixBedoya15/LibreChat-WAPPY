import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MatrixRow } from './MatrizIPEVARConstants';

export const exportMatrizIPEVARToExcel = async (matrixRows: MatrixRow[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();
  
  // -- HOJA 1: MATRIZ GTC-45 --
  const wsMatriz = wb.addWorksheet('Matriz IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 5 }]
  });

  // Definir Columnas
  wsMatriz.columns = [
    { header: 'Proceso', key: 'proceso', width: 25 },
    { header: 'Zona / Lugar', key: 'zona', width: 20 },
    { header: 'Actividad', key: 'actividad', width: 25 },
    { header: 'Tareas', key: 'tareas', width: 30 },
    { header: 'Rutinaria', key: 'rutinaria', width: 10 },
    { header: 'Descripción del Peligro', key: 'peligro_descripcion', width: 45 },
    { header: 'Clasificación', key: 'peligro_clasificacion', width: 20 },
    { header: 'Efectos Posibles', key: 'efectos_posibles', width: 30 },
    { header: 'Ctrl. Fuente', key: 'controles_fuente', width: 20 },
    { header: 'Ctrl. Medio', key: 'controles_medio', width: 20 },
    { header: 'Ctrl. Individuo', key: 'controles_individuo', width: 20 },
    { header: 'ND', key: 'nd', width: 8 },
    { header: 'NE', key: 'ne', width: 8 },
    { header: 'NP', key: 'np', width: 8 },
    { header: 'NC', key: 'nc', width: 8 },
    { header: 'NR', key: 'nr', width: 10 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 20 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 35 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 20 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 20 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 20 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 25 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 25 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 25 },
  ];

  // Estilo de Cabecera
  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' } // Teal 600
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });
  wsMatriz.getRow(1).height = 40;

  // Añadir Datos
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
      interpretacion_nr: row.interpretacion_nr, // Podría ser fórmula con IFs anidados, pero valor estático está bien
      aceptabilidad: row.aceptabilidad,
      medida_eliminacion: row.medida_eliminacion,
      medida_sustitucion: row.medida_sustitucion,
      medida_ingenieria: row.medida_ingenieria,
      medida_administrativa: row.medida_administrativa,
      medida_eppu: row.medida_eppu,
      factores_reduccion: row.factores_reduccion,
    });

    // Formato de celdas por fila
    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (colNumber >= 12 && colNumber <= 17) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; // Centrar numéricos
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
      };
    });
  });

  // -- Formato Condicional para NP, NR e Interpretación --
  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // NP (Columna N)
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${totalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFF0000' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFFF00' } }, font: { color: { argb: 'FF000000' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['2', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF00B050' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // NR (Columna P)
  wsMatriz.addConditionalFormatting({
    ref: `P2:P${totalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFF0000' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel I
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFFF00' } }, font: { color: { argb: 'FF000000' }, bold: true } } }, // Nivel II
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF00B050' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel III
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF0070C0' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Nivel IV (Aunque técnicamente 20, cubrimos hasta 0)
    ]
  });

  // -- HOJA 2: DASHBOARD (RESUMEN EJECUTIVO) --
  const wsDash = wb.addWorksheet('Dashboard Analítico', {
    views: [{ showGridLines: false }]
  });

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 15;
  wsDash.getColumn('D').width = 45;
  
  // Título
  wsDash.mergeCells('B2:D3');
  const titleCell = wsDash.getCell('B2');
  titleCell.value = '📊 ANALÍTICA IPEVAR — RESUMEN EJECUTIVO GTC-45';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FF0D9488' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  titleCell.border = { bottom: { style: 'medium', color: { argb: 'FF0D9488' } } };

  // Resumen por Nivel de Riesgo (NR)
  wsDash.getCell('B5').value = 'Riesgos por Nivel de Consecuencia (Interpretación NR)';
  wsDash.getCell('B5').font = { size: 13, bold: true, color: { argb: 'FF334155' } };
  wsDash.getCell('B5').border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };

  const nrLevels = ['I', 'II', 'III', 'IV'];
  const colorsNR = ['FFEF4444', 'FFEAB308', 'FF22C55E', 'FF3B82F6']; // Tailwind Red 500, Yellow 500, Green 500, Blue 500
  let dashRow = 7;

  wsDash.getCell(`B${dashRow-1}`).value = 'Nivel';
  wsDash.getCell(`C${dashRow-1}`).value = 'Cantidad';
  wsDash.getCell(`D${dashRow-1}`).value = 'Proporción Visual';
  wsDash.getCell(`B${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };
  wsDash.getCell(`C${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };
  wsDash.getCell(`D${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };

  nrLevels.forEach((nivel, idx) => {
    wsDash.getCell(`B${dashRow}`).value = `Nivel ${nivel} (${nivel === 'I' ? 'No Aceptable' : nivel === 'II' ? 'No Aceptable o Aceptable con Ctrl' : nivel === 'III' ? 'Mejorable' : 'Aceptable'})`;
    wsDash.getCell(`C${dashRow}`).value = { formula: `COUNTIF('Matriz IPEVAR'!Q2:Q${totalRows}, "${nivel}")` };
    wsDash.getCell(`C${dashRow}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${dashRow}`).font = { bold: true, color: { argb: colorsNR[idx] } };
    
    // Barra visual basada en repetición de bloque
    wsDash.getCell(`D${dashRow}`).value = { formula: `REPT("█", C${dashRow})` };
    wsDash.getCell(`D${dashRow}`).font = { color: { argb: colorsNR[idx] } };
    dashRow++;
  });

  // Resumen por Clasificación de Peligro
  dashRow += 3;
  wsDash.getCell(`B${dashRow}`).value = 'Riesgos por Clasificación de Peligro';
  wsDash.getCell(`B${dashRow}`).font = { size: 13, bold: true, color: { argb: 'FF334155' } };
  wsDash.getCell(`B${dashRow}`).border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
  dashRow += 2;

  const clasificaciones = [...new Set(matrixRows.map(r => r.peligro_clasificacion).filter(Boolean))];
  
  wsDash.getCell(`B${dashRow-1}`).value = 'Clasificación';
  wsDash.getCell(`C${dashRow-1}`).value = 'Cantidad';
  wsDash.getCell(`D${dashRow-1}`).value = 'Proporción Visual';
  wsDash.getCell(`B${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };
  wsDash.getCell(`C${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };
  wsDash.getCell(`D${dashRow-1}`).font = { bold: true, color: { argb: 'FF64748B' } };

  clasificaciones.forEach((clasif) => {
    wsDash.getCell(`B${dashRow}`).value = clasif;
    wsDash.getCell(`C${dashRow}`).value = { formula: `COUNTIF('Matriz IPEVAR'!G2:G${totalRows}, "${clasif}")` };
    wsDash.getCell(`C${dashRow}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${dashRow}`).font = { bold: true, color: { argb: 'FF0F172A' } };
    wsDash.getCell(`D${dashRow}`).value = { formula: `REPT("▉", C${dashRow})` };
    wsDash.getCell(`D${dashRow}`).font = { color: { argb: 'FF94A3B8' } }; // Slate 400
    dashRow++;
  });

  // Generar y Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVAR_GTC45_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
