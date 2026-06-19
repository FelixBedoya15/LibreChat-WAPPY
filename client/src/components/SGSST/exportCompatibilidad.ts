import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MatrixRow, getChemicalCompatibility } from './MatrizCompatibilidadConstants';

export const exportCompatibilidadToExcel = async (matrixRows: MatrixRow[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: INVENTARIO QUÍMICO
  // ============================================================================
  const wsInv = wb.addWorksheet('Inventario Químico', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsInv.mergeCells('A1:K2');
  const titleCell = wsInv.getCell('A1');
  titleCell.value = '📋 INVENTARIO DE SUSTANCIAS Y PRODUCTOS QUÍMICOS';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Fila de Info
  wsInv.mergeCells('A3:K3');
  const infoCell = wsInv.getCell('A3');
  infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Normatividad: Decreto 1496 de 2018 / SGA / NTC 3966`;
  infoCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers de la Tabla
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } }; // Teal Oscuro
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      right: { style: 'thin', color: { argb: 'FF042F2E' } }
    };
  });

  // Llenar Filas de Datos
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
      
      // Bordes finos
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // FDS / Rotulado Inconforme Highlight
      if ((colNum === 9 || colNum === 10) && cell.value === 'No') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
        cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 10, name: 'Segoe UI' };
      }
    });
  });

  // Ajustar anchos de columna
  const colWidths = [6, 25, 20, 12, 30, 25, 18, 20, 12, 14, 40];
  colWidths.forEach((w, i) => {
    wsInv.getColumn(i + 1).width = w;
  });


  // ============================================================================
  // HOJA 2: MATRIZ DE COMPATIBILIDAD CRUZADA (N x N)
  // ============================================================================
  const wsCross = wb.addWorksheet('Matriz de Compatibilidad', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsCross.mergeCells('A1:O2');
  const titleCellCross = wsCross.getCell('A1');
  titleCellCross.value = '⚡ MATRIZ CRUZADA DE COMPATIBILIDAD QUÍMICA (Semáforo)';
  titleCellCross.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCellCross.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Dark Blue
  titleCellCross.alignment = { vertical: 'middle', horizontal: 'center' };

  if (matrixRows.length > 0) {
    // Fila 4: Headers de Columnas
    wsCross.getCell(4, 1).value = 'Productos';
    wsCross.getCell(4, 1).font = { bold: true, size: 10, name: 'Segoe UI' };
    wsCross.getCell(4, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    wsCross.getCell(4, 1).alignment = { vertical: 'middle', horizontal: 'center' };
    wsCross.getCell(4, 1).border = {
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      right: { style: 'medium', color: { argb: 'FF94A3B8' } }
    };

    matrixRows.forEach((row, i) => {
      const colLetter = String.fromCharCode(66 + i); // B, C, D...
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

    // Rellenar cuadrícula
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
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light Red
          cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 8, name: 'Segoe UI' };
        } else if (compat.status === 'caution') {
          cell.value = '⚠ PRECAUCIÓN';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Light Yellow
          cell.font = { bold: true, color: { argb: 'FF92400E' }, size: 8, name: 'Segoe UI' };
        } else {
          cell.value = '✓ COMPATIBLE';
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light Green
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

    // Agregar Leyenda al final
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

  // Generar y Guardar Archivo
  const buffer = await wb.xlsx.writeBuffer();
  const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(fileBlob, `Matriz_Compatibilidad_Quimica_${new Date().toISOString().slice(0,10)}.xlsx`);
};
