import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface EppItem {
  id: string;
  nombre: string;
  tipo: 'Regular' | 'Alturas';
  marca?: string;
  referencia?: string;
  serial?: string;
  fechaUltimaInspeccion?: string;
  fechaProximaInspeccion?: string;
  inspeccionadoPor?: string;
  resultadoInspeccion?: 'Aprobado' | 'Rechazado' | 'N/A';
  fechaEntrega: string;
  fechaVencimiento?: string;
  cantidad: number;
  estado: 'Entregado' | 'Vencido' | 'Inspección Requerida' | 'Fuera de Servicio';
  observaciones?: string;
}

interface WorkerEppDoc {
  workerId: string;
  documento: string;
  nombreTrabajador: string;
  cargo: string;
  entregas: EppItem[];
}

interface SocioWorker {
  id: string;
  nombre: string;
  identificacion: string;
  cargo: string;
}

export const exportEppToExcel = async (
  eppDocs: WorkerEppDoc[],
  allWorkers: SocioWorker[]
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: RESUMEN DE TRABAJADORES
  // ============================================================================
  const wsSummary = wb.addWorksheet('Resumen de Trabajadores', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsSummary.mergeCells('A1:H2');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = '🛡️ RESUMEN GENERAL DE EPP - TRABAJADORES';
  titleCell.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Fila de Info
  wsSummary.mergeCells('A3:H3');
  const infoCell = wsSummary.getCell('A3');
  infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Normatividad: SG-SST / Res. 0312 / Equipos de Alturas Res. 4272`;
  infoCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers
  const summaryHeaders = [
    'Trabajador',
    'Documento / Identificación',
    'Cargo',
    'Total Entregas',
    'Vigentes / Al Día',
    'Vencidos ❌',
    'Requieren Inspección ⚠️',
    'Fuera de Servicio'
  ];

  const headerRow1 = wsSummary.addRow(summaryHeaders);
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
  allWorkers.forEach((worker) => {
    const doc = eppDocs.find(d => d.workerId === worker.id);
    const entregas = doc ? doc.entregas : [];
    
    const total = entregas.length;
    const vigentes = entregas.filter(e => e.estado === 'Entregado').length;
    const vencidos = entregas.filter(e => e.estado === 'Vencido').length;
    const reqInspeccion = entregas.filter(e => e.estado === 'Inspección Requerida').length;
    const fueraServicio = entregas.filter(e => e.estado === 'Fuera de Servicio').length;

    const dataRow = wsSummary.addRow([
      worker.nombre,
      worker.identificacion,
      worker.cargo || 'Sin registrar',
      total,
      vigentes,
      vencidos,
      reqInspeccion,
      fueraServicio
    ]);

    dataRow.height = 22;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Segoe UI' };
      
      // Alineación
      if (colNum <= 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Bordes
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Highlights
      if (colNum === 6 && vencidos > 0) { // Vencidos highlight en rojo claro
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 10, name: 'Segoe UI' };
      } else if (colNum === 7 && reqInspeccion > 0) { // Requiere inspección en amarillo claro
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A10' } };
        cell.font = { bold: true, color: { argb: 'FF854D0E' }, size: 10, name: 'Segoe UI' };
      } else if (colNum === 5 && vigentes > 0) { // Vigentes en verde claro
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        cell.font = { color: { argb: 'FF166534' }, size: 10, name: 'Segoe UI' };
      }
    });
  });

  // Ajustar anchos
  wsSummary.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(40, Math.max(12, maxLen + 2));
  });

  // ============================================================================
  // HOJA 2: HISTORIAL DE ENTREGAS DETALLADO
  // ============================================================================
  const wsHistorial = wb.addWorksheet('Historial Detallado', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsHistorial.mergeCells('A1:Q2');
  const titleCell2 = wsHistorial.getCell('A1');
  titleCell2.value = '📋 HISTORIAL DE ENTREGAS E INSPECCIONES EPP Y ALTURAS';
  titleCell2.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

  // Info
  wsHistorial.mergeCells('A3:Q3');
  const infoCell2 = wsHistorial.getCell('A3');
  infoCell2.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Detalle completo de todos los implementos asignados`;
  infoCell2.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell2.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers
  const historyHeaders = [
    'Trabajador',
    'Documento',
    'Cargo',
    'Elemento / EPP',
    'Tipo EPP',
    'Cantidad',
    'Fecha Entrega',
    'Fecha Vencimiento',
    'Estado',
    'Marca (Alturas)',
    'Referencia (Alturas)',
    'Serial (Alturas)',
    'Última Inspección',
    'Próxima Inspección',
    'Inspeccionado Por',
    'Resultado Inspección',
    'Observaciones'
  ];

  const headerRow2 = wsHistorial.addRow(historyHeaders);
  headerRow2.height = 25;
  headerRow2.eachCell((cell) => {
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

  // Llenar Datos
  let hasData = false;
  eppDocs.forEach((doc) => {
    const workerName = doc.nombreTrabajador;
    const workerDoc = doc.documento;
    const workerCargo = doc.cargo;

    doc.entregas.forEach((ent) => {
      hasData = true;
      const dataRow = wsHistorial.addRow([
        workerName,
        workerDoc,
        workerCargo || 'Sin registrar',
        ent.nombre,
        ent.tipo === 'Alturas' ? 'Alturas' : 'Regular',
        ent.cantidad,
        ent.fechaEntrega,
        ent.fechaVencimiento || 'N/A',
        ent.estado,
        ent.marca || 'N/A',
        ent.referencia || 'N/A',
        ent.serial || 'N/A',
        ent.fechaUltimaInspeccion || 'N/A',
        ent.fechaProximaInspeccion || 'N/A',
        ent.inspeccionadoPor || 'N/A',
        ent.resultadoInspeccion || 'N/A',
        ent.observaciones || ''
      ]);

      dataRow.height = 22;
      dataRow.eachCell((cell, colNum) => {
        cell.font = { size: 10, name: 'Segoe UI' };
        
        // Alineación
        if (colNum <= 4 || colNum === 17 || colNum === 15) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // Bordes
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Resaltar según el Estado (Col 9)
        if (colNum === 9) {
          if (cell.value === 'Vencido') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 10, name: 'Segoe UI' };
          } else if (cell.value === 'Inspección Requerida') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A10' } };
            cell.font = { bold: true, color: { argb: 'FF854D0E' }, size: 10, name: 'Segoe UI' };
          } else if (cell.value === 'Entregado') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            cell.font = { color: { argb: 'FF166534' }, size: 10, name: 'Segoe UI' };
          }
        }
      });
    });
  });

  // Si no hay datos detallados, agregar fila informativa
  if (!hasData) {
    const emptyRow = wsHistorial.addRow(['No se han registrado entregas de EPP aún']);
    wsHistorial.mergeCells(`A4:Q4`);
    emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    emptyRow.getCell(1).font = { italic: true, size: 10, name: 'Segoe UI' };
    emptyRow.height = 30;
  }

  // Ajustar anchos
  wsHistorial.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(35, Math.max(10, maxLen + 2));
  });

  // Escribir archivo y descargar
  const buffer = await wb.xlsx.writeBuffer();
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';
  const blob = new Blob([buffer], { type: fileType });
  saveAs(blob, `Reporte_General_EPP_Wappy_${new Date().toISOString().slice(0,10)}.xlsx`);
};
