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
  const procesos = [...new Set(matrixRows.map(r => r.grupo_trabajo).filter(Boolean))];
  if (procesos.length === 0) procesos.push('Sin Datos');

  // Hidden Column Z for Data Validation Source
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

  wsDash.getCell('C9').value = { formula: `IF($C$6="TODOS", COUNTIF('Matriz PESV'!Q2:Q${totalRows}, "NO ACEPTABLE"), COUNTIFS('Matriz PESV'!Q2:Q${totalRows}, "NO ACEPTABLE", 'Matriz PESV'!A2:A${totalRows}, $C$6))` };
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

  // ============================================================================
  // HOJA 2: MATRIZ PESV (DATOS)
  // ============================================================================
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
      nivel_riesgo: row.nivel_riesgo,
      aceptabilidad: row.aceptabilidad,
      tratamiento_accion: row.tratamiento_accion,
      plan_accion_medio: row.plan_accion_medio,
      plan_accion_vehiculo: row.plan_accion_vehiculo,
      plan_accion_individuo: row.plan_accion_individuo,
      plan_accion_infraestructura: row.plan_accion_infraestructura,
      responsable: row.responsable,
      fecha_programacion: row.fecha_programacion,
      estado: row.estado,
      observaciones: row.observaciones,
    });

    addedRow.height = 40;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF0F9FF';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Book Antiqua', size: 11, color: { argb: 'FF334155' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.alignment = { vertical: 'top', wrapText: true, indent: 1 };
      
      if (colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 8 || colNumber === 10 || colNumber === 12 || colNumber === 14 || colNumber === 15 || colNumber === 16 || colNumber === 17 || colNumber === 25) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; 
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
  });

  const finalTotalRows = matrixRows.length > 0 ? matrixRows.length + 1 : 2;

  // Calificación (Columna O)
  wsMatriz.addConditionalFormatting({
    ref: `O2:O${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['12'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }, // Rojo
      { type: 'cellIs', operator: 'between', formulae: ['8', '11'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } }, // Amarillo
      { type: 'cellIs', operator: 'between', formulae: ['3', '7'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } } // Verde
    ]
  });

  // Nivel de Riesgo (Columna P)
  wsMatriz.addConditionalFormatting({
    ref: `P2:P${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"NIVEL DE RIESGO ALTO o CRITICO"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"NIVEL DE RIESGO MEDIO o MODERADO"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"NIVEL DE RIESGO BAJO"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  // Aceptabilidad (Columna Q)
  wsMatriz.addConditionalFormatting({
    ref: `Q2:Q${finalTotalRows}`,
    rules: [
      { type: 'cellIs', operator: 'equal', formulae: ['"NO ACEPTABLE"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEF4444' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"ACEPTABLE CON CONTROL ESPECIFICO"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFEAB308' } }, font: { color: { argb: 'FF1E293B' }, bold: true } } },
      { type: 'cellIs', operator: 'equal', formulae: ['"ACEPTABLE"'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF22C55E' } }, font: { color: { argb: 'FFFFFFFF' }, bold: true } } }
    ]
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Matriz_Riesgos_PESV_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
