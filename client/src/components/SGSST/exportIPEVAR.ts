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

  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 15;
  wsDash.getColumn('D').width = 40;
  
  // Hero Header
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   📊 DASHBOARD EJECUTIVO — IPEVAR GTC-45';
  heroCell.font = { size: 28, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; 
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF0D9488' } } };
  }

  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  const createCardHeader = (row: number, title: string) => {
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
    wsDash.getCell(`D${hRow}`).value = ' Tendencia (Data Bar)';
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
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FF94A3B8' }, name: 'Book Antiqua' }; 
  };


  let dashRow = 7;
  dashRow = createCardHeader(dashRow, 'Riesgos por Aceptabilidad GTC-45');
  const aceptabilidades = [
    { name: 'NO ACEPTABLE', color: 'FFEF4444' }, // Rojo
    { name: 'NO ACEPTABLE O ACEPTABLE CON CONTROL ESPECIFICO', color: 'FFF97316' }, // Naranja
    { name: 'MEJORABLE', color: 'FF22C55E' }, // Verde
    { name: 'ACEPTABLE', color: 'FFEAB308' } // Amarillo
  ];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac.name, `COUNTIF('Matriz IPEVAR'!R2:R${totalRows}, "${ac.name}")`, idx === aceptabilidades.length - 1, ac.color);
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF6366F1' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });


  dashRow += 3;
  dashRow = createCardHeader(dashRow, 'Top Riesgos por Proceso');
  const procesos = [...new Set(matrixRows.map(r => r.proceso).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');
  const startCard2 = dashRow;

  procesos.forEach((proc, idx) => {
    addCardRow(dashRow, proc, `COUNTIF('Matriz IPEVAR'!A2:A${totalRows}, "${proc}")`, idx === procesos.length - 1, 'FF0F172A');
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
    addCardRow(dashRow, clasif, `COUNTIF('Matriz IPEVAR'!G2:G${totalRows}, "${clasif}")`, idx === clasificaciones.length - 1, 'FF0F172A');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard3}:D${dashRow - 1}`,
    rules: [{ type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] }]
  });


  // ============================================================================
  // HOJA 2: MATRIZ GTC-45 (DATOS)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }]
  });

  // Activar Filtros Automáticos sin usar addTable para no perder control del color de cabecera
  wsMatriz.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: 24 }
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
    { header: 'NC', key: 'nc', width: 10 },
    { header: 'NR (Nivel)', key: 'nr', width: 12 },
    { header: 'Interpretación NR', key: 'interpretacion_nr', width: 22 },
    { header: 'Aceptabilidad del Riesgo', key: 'aceptabilidad', width: 40 },
    { header: 'Eliminación', key: 'medida_eliminacion', width: 25 },
    { header: 'Sustitución', key: 'medida_sustitucion', width: 25 },
    { header: 'Ctrl. Ingeniería', key: 'medida_ingenieria', width: 25 },
    { header: 'Ctrl. Administrativos', key: 'medida_administrativa', width: 30 },
    { header: 'Equipos/EPP', key: 'medida_eppu', width: 30 },
    { header: 'Factores de Reducción', key: 'factores_reduccion', width: 65 }, // Mucho más ancho
  ];

  wsMatriz.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Book Antiqua', size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal exacto de la plataforma
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF115E59' } }, left: { style: 'thin', color: { argb: 'FF115E59' } },
      bottom: { style: 'medium', color: { argb: 'FF115E59' } }, right: { style: 'thin', color: { argb: 'FF115E59' } }
    };
  });
  wsMatriz.getRow(1).height = 45;

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

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // Filas blancas, sin colores
      cell.alignment = { vertical: 'top', wrapText: true };
      
      if (colNumber === 5 || (colNumber >= 12 && colNumber <= 17)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
      }
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // -- Formato Condicional (Semaforización Nativa a Medida) --
  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // NP (Columna N)
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'between', formulae: ['6', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['2', '4'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // NR (Columna P)
  wsMatriz.addConditionalFormatting({
    ref: `P2:P${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } } // Amarillo
    ]
  });

  // Interpretación NR (Columna Q)
  wsMatriz.addConditionalFormatting({
    ref: `Q2:Q${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"I"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'equal', formulae: ['"II"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'equal', formulae: ['"III"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'equal', formulae: ['"IV"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
    ]
  });

  // Aceptabilidad (Columna R)
  wsMatriz.addConditionalFormatting({
    ref: `R2:R${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"NO ACEPTABLE"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'equal', formulae: ['"NO ACEPTABLE O ACEPTABLE CON CONTROL ESPECIFICO"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF97316' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Naranja
      { type: 'cellIs', operator: 'equal', formulae: ['"MEJORABLE"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Verde
      { type: 'cellIs', operator: 'equal', formulae: ['"ACEPTABLE"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
    ]
  });

  // Lista Desplegable (Data Validation) para Rutinaria (Columna E)
  const validationRows = Math.max(finalTotalRows + 50, 100); // Aplicar a más filas por si el usuario añade nuevas
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

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVAR_GTC45_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
