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
  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 10; c++) {
      wsDash.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  }

  wsDash.getColumn('A').width = 4;
  wsDash.getColumn('B').width = 45;
  wsDash.getColumn('C').width = 15;
  wsDash.getColumn('D').width = 40;
  
  // Hero Header (Dark Slate / Teal)
  wsDash.mergeCells('A1:E4');
  const heroCell = wsDash.getCell('A1');
  heroCell.value = '   📊 DASHBOARD EJECUTIVO — IPEVAR GTC-45';
  heroCell.font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  heroCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate 900
  heroCell.alignment = { vertical: 'middle', horizontal: 'left' };
  for (let c = 1; c <= 5; c++) {
    wsDash.getCell(4, c).border = { bottom: { style: 'thick', color: { argb: 'FF0D9488' } } }; // Teal border
  }

  const totalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // Function to create a styled card header
  const createCardHeader = (row: number, title: string) => {
    wsDash.getCell(`B${row}`).value = title;
    wsDash.getCell(`B${row}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' }, name: 'Segoe UI' };
    
    const hRow = row + 1;
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${hRow}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
      cell.font = { bold: true, color: { argb: 'FF475569' }, name: 'Segoe UI' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
      if (col === 'B') cell.border.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') cell.border.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
    });
    wsDash.getCell(`B${hRow}`).value = ' Categoría';
    wsDash.getCell(`C${hRow}`).value = 'Cantidad';
    wsDash.getCell(`D${hRow}`).value = ' Tendencia (Data Bar)';
    return hRow + 1;
  };

  // Function to add a row to a card
  const addCardRow = (row: number, label: string, countFormula: string, isLast: boolean, colorArgb: string) => {
    ['B', 'C', 'D'].forEach(col => {
      const cell = wsDash.getCell(`${col}${row}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White
      let borders: any = {};
      if (col === 'B') borders.left = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (col === 'D') borders.right = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      if (isLast) borders.bottom = { style: 'thin', color: { argb: 'FFCBD5E1' } };
      cell.border = { ...(cell.border || {}), ...borders };
    });

    wsDash.getCell(`B${row}`).value = ` ${label}`;
    wsDash.getCell(`B${row}`).font = { name: 'Segoe UI', color: { argb: 'FF334155' } };
    
    wsDash.getCell(`C${row}`).value = { formula: countFormula };
    wsDash.getCell(`C${row}`).alignment = { horizontal: 'center' };
    wsDash.getCell(`C${row}`).font = { bold: true, size: 12, color: { argb: colorArgb }, name: 'Segoe UI' };
    
    wsDash.getCell(`D${row}`).value = { formula: countFormula };
    wsDash.getCell(`D${row}`).font = { color: { argb: 'FF94A3B8' }, name: 'Segoe UI' }; 
  };


  // --- CARD 1: Riesgos por Aceptabilidad ---
  let dashRow = 7;
  dashRow = createCardHeader(dashRow, 'Riesgos por Aceptabilidad GTC-45');
  const aceptabilidades = ['NO ACEPTABLE', 'NO ACEPTABLE O ACEPTABLE CON CONTROL ESPECIFICO', 'ACEPTABLE', 'MEJORABLE'];
  const startCard1 = dashRow;

  aceptabilidades.forEach((ac, idx) => {
    addCardRow(dashRow, ac, `COUNTIF('Matriz IPEVAR'!R2:R${totalRows}, "${ac}")`, idx === aceptabilidades.length - 1, 'FF0F172A');
    dashRow++;
  });

  wsDash.addConditionalFormatting({
    ref: `D${startCard1}:D${dashRow - 1}`,
    rules: [
      { type: 'dataBar', gradient: true, color: { argb: 'FF6366F1' }, cfvo: [{ type: 'min' }, { type: 'max' }] } // Indigo Data Bar
    ]
  });


  // --- CARD 2: Riesgos por Proceso ---
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
    rules: [
      { type: 'dataBar', gradient: true, color: { argb: 'FF14B8A6' }, cfvo: [{ type: 'min' }, { type: 'max' }] } // Teal Data Bar
    ]
  });


  // --- CARD 3: Riesgos por Clasificación de Peligro ---
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
    rules: [
      { type: 'dataBar', gradient: true, color: { argb: 'FF8B5CF6' }, cfvo: [{ type: 'min' }, { type: 'max' }] } // Violet Data Bar
    ]
  });



  // ============================================================================
  // HOJA 2: MATRIZ GTC-45 (NATIVE EXCEL TABLE)
  // ============================================================================
  const wsMatriz = wb.addWorksheet('Matriz IPEVAR', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] // Freeze headers and first 2 columns (Proceso, Zona)
  });

  // Prepare Data Rows for Native Table
  const tableRows = matrixRows.map((row, index) => {
    const rNum = index + 2;
    return [
      row.proceso || '',
      row.zona || '',
      row.actividad || '',
      row.tareas || '',
      row.rutinaria || '',
      row.peligro_descripcion || '',
      row.peligro_clasificacion || '',
      row.efectos_posibles || '',
      row.controles_fuente || '',
      row.controles_medio || '',
      row.controles_individuo || '',
      Number(row.nd) || 0,
      Number(row.ne) || 0,
      { formula: `L${rNum}*M${rNum}`, result: row.np }, // NP
      Number(row.nc) || 0,
      { formula: `N${rNum}*O${rNum}`, result: row.nr }, // NR
      row.interpretacion_nr || '',
      row.aceptabilidad || '',
      row.medida_eliminacion || '',
      row.medida_sustitucion || '',
      row.medida_ingenieria || '',
      row.medida_administrativa || '',
      row.medida_eppu || '',
      row.factores_reduccion || '',
    ];
  });

  // Add Native Excel Table (List Object)
  wsMatriz.addTable({
    name: 'TablaMatrizIPEVAR',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: null, // Removed native theme to avoid unwanted green/blue rows
      showRowStripes: false, // Turn off zebra striping completely
    },
    columns: [
      { name: 'Proceso', filterButton: true },
      { name: 'Zona / Lugar', filterButton: true },
      { name: 'Actividad', filterButton: true },
      { name: 'Tareas', filterButton: true },
      { name: 'Rutinaria', filterButton: true },
      { name: 'Descripción del Peligro', filterButton: true },
      { name: 'Clasificación', filterButton: true },
      { name: 'Efectos Posibles', filterButton: true },
      { name: 'Ctrl. Fuente', filterButton: true },
      { name: 'Ctrl. Medio', filterButton: true },
      { name: 'Ctrl. Individuo', filterButton: true },
      { name: 'ND', filterButton: true },
      { name: 'NE', filterButton: true },
      { name: 'NP', filterButton: true },
      { name: 'NC', filterButton: true },
      { name: 'NR (Nivel)', filterButton: true },
      { name: 'Interpretación NR', filterButton: true },
      { name: 'Aceptabilidad del Riesgo', filterButton: true },
      { name: 'Eliminación', filterButton: true },
      { name: 'Sustitución', filterButton: true },
      { name: 'Ctrl. Ingeniería', filterButton: true },
      { name: 'Ctrl. Administrativos', filterButton: true },
      { name: 'Equipos/EPP', filterButton: true },
      { name: 'Factores de Reducción', filterButton: true },
    ],
    rows: tableRows.length > 0 ? tableRows : [['', '', '', '', '', '', '', '', '', '', '', 0, 0, 0, 0, 0, '', '', '', '', '', '', '', '']]
  });

  // Apply Specific Column Widths & Alignments Over the Table
  // Increased width of 'Factores de Reducción' (index 23) from 28 to 65
  const colWidths = [28, 22, 28, 35, 12, 50, 22, 35, 22, 22, 22, 10, 10, 10, 10, 12, 22, 40, 25, 25, 25, 30, 30, 65];
  
  colWidths.forEach((width, index) => {
    const colNumber = index + 1;
    const col = wsMatriz.getColumn(colNumber);
    col.width = width;
    
    // Apply alignment to all cells in the column (skipping header)
    col.eachCell({ includeEmpty: true }, (cell, rowNum) => {
      if (rowNum === 1) {
        // Manually style the header with the platform Teal color
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; 
        cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF115E59' } }, left: { style: 'thin', color: { argb: 'FF115E59' } },
          bottom: { style: 'medium', color: { argb: 'FF115E59' } }, right: { style: 'thin', color: { argb: 'FF115E59' } }
        };
      } else {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font = { name: 'Segoe UI', size: 10 };
        // Center numeric columns (ND, NE, NP, NC, NR) and Rutinaria
        if (colNumber === 5 || (colNumber >= 12 && colNumber <= 17)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
        }
        
        // Add a subtle border to data cells for structure
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });
  });
  
  wsMatriz.getRow(1).height = 45; // Make header taller


  // -- Formato Condicional (Semaforización Nativa) --
  const finalTotalRows = tableRows.length > 0 ? tableRows.length + 1 : 2;

  // NP (Columna N)
  wsMatriz.addConditionalFormatting({
    ref: `N2:N${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['24', '40'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['10', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['2', '8'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // NR (Columna P)
  wsMatriz.addConditionalFormatting({
    ref: `P2:P${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['600', '4000'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel I
      { type: 'cellIs', operator: 'between', formulae: ['150', '500'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Nivel II
      { type: 'cellIs', operator: 'between', formulae: ['40', '120'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Nivel III
      { type: 'cellIs', operator: 'between', formulae: ['0', '20'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF3B82F6' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Nivel IV
    ]
  });


  // Generar y Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_IPEVAR_GTC45_PRO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
