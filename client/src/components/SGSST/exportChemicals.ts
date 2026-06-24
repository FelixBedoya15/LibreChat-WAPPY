import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ChemicalProduct {
  id: string;
  nombre: string;
  fabricante: string;
  estadoFisico: 'Líquido' | 'Sólido' | 'Gaseoso';
  pictogramasSga: string[];
  claseOnu: string;
  ubicacion: string;
  cantidadAlmacenada: string;
  tieneFds: 'Sí' | 'No';
  tieneRotuloSga: 'Sí' | 'No';
  requisitosAlmacenamiento: string;
  incompatibilidades: string[];
  trabajadoresExpuestos: string[];
  observaciones?: string;
}

interface SocioWorker {
  id: string;
  nombre: string;
}

export const exportChemicalsToExcel = async (
  chemicalsList: ChemicalProduct[],
  allWorkers: SocioWorker[]
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: INVENTARIO DE PRODUCTOS QUÍMICOS
  // ============================================================================
  const wsInv = wb.addWorksheet('Inventario Químico', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsInv.mergeCells('A1:L2');
  const titleCell = wsInv.getCell('A1');
  titleCell.value = '🧪 INVENTARIO Y ROTULADO DE PRODUCTOS QUÍMICOS (SGA)';
  titleCell.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Info
  wsInv.mergeCells('A3:L3');
  const infoCell = wsInv.getCell('A3');
  infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Normatividad: Decreto 1496 de 2018 / SGA / NTC 4435 (FDS)`;
  infoCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers
  const invHeaders = [
    'Nombre del Producto',
    'Fabricante / Proveedor',
    'Estado Físico',
    'Clase ONU',
    'Pictogramas SGA',
    'Ubicación Almacén',
    'Cantidad Almacenada',
    '¿Tiene FDS? (Ficha)',
    '¿Tiene Rótulo SGA?',
    'Trabajadores Expuestos',
    'Requisitos Almacenamiento',
    'Incompatibilidades'
  ];

  const headerRow1 = wsInv.addRow(invHeaders);
  headerRow1.height = 25;
  headerRow1.eachCell((cell) => {
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

  // Llenar Datos
  chemicalsList.forEach((prod) => {
    // Buscar los nombres de los trabajadores expuestos
    const expNames = (prod.trabajadoresExpuestos || []).map(id => {
      const w = allWorkers.find(worker => worker.id === id);
      return w ? w.nombre : '';
    }).filter(Boolean).join(', ');

    const dataRow = wsInv.addRow([
      prod.nombre,
      prod.fabricante || 'Desconocido',
      prod.estadoFisico,
      prod.claseOnu || 'N/A',
      (prod.pictogramasSga || []).join(', '),
      prod.ubicacion || 'General',
      prod.cantidadAlmacenada || 'Sin registrar',
      prod.tieneFds,
      prod.tieneRotuloSga,
      expNames || 'Ninguno',
      prod.requisitosAlmacenamiento || 'N/A',
      (prod.incompatibilidades || []).join(', ') || 'Ninguna'
    ]);

    dataRow.height = 22;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Segoe UI' };
      
      if (colNum === 3 || colNum === 4 || colNum === 8 || colNum === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // FDS / Rotulado Alerta Highlight
      if ((colNum === 8 || colNum === 9) && cell.value === 'No') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { bold: true, color: { argb: 'FF991B1B' } };
      } else if ((colNum === 8 || colNum === 9) && cell.value === 'Sí') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        cell.font = { color: { argb: 'FF166534' } };
      }
    });
  });

  if (chemicalsList.length === 0) {
    wsInv.addRow(['No se han registrado productos químicos en el inventario aún']);
    wsInv.mergeCells('A4:L4');
    wsInv.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
    wsInv.getCell('A4').font = { italic: true, name: 'Segoe UI', size: 10 };
  }

  // Ajustar anchos
  wsInv.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(30, Math.max(12, maxLen + 2));
  });

  // Escribir archivo
  const buffer = await wb.xlsx.writeBuffer();
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';
  const blob = new Blob([buffer], { type: fileType });
  saveAs(blob, `Inventario_Productos_Quimicos_SGA_${new Date().toISOString().slice(0,10)}.xlsx`);
};
