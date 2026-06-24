import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface EquipoAlturas {
  id: string;
  nombre: string;
  marca: string;
  referencia: string;
  serial: string;
  fechaFabricacion: string;
  fechaCompra: string;
  fechaUltimaInspeccion: string;
  fechaProximaInspeccion: string;
  inspeccionadoPor: string;
  resultadoInspeccion: 'Aprobado' | 'Rechazado' | 'N/A';
  estado: 'Vigente' | 'Vencido' | 'Requiere Inspección' | 'Retirado';
  firmaTrabajador?: string;
  observaciones?: string;
}

interface WorkerHeightsDoc {
  workerId: string;
  nombreTrabajador: string;
  cargo: string;
  equipos: EquipoAlturas[];
}

export const exportHeightsToExcel = async (heightsList: WorkerHeightsDoc[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: RESUMEN POR TRABAJADOR
  // ============================================================================
  const wsSummary = wb.addWorksheet('Resumen de Asignaciones', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsSummary.mergeCells('A1:G2');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = '🧗 HOJA DE VIDA DE EQUIPOS DE PROTECCIÓN CONTRA CAÍDAS (ALTURAS)';
  titleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Headers
  const summaryHeaders = [
    'Trabajador',
    'Cargo',
    'Total Equipos Asignados',
    'Equipos Vigentes',
    'Equipos Vencidos / Alerta ❌',
    'Pendientes de Inspección ⚠️',
    'Equipos Retirados'
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

  // Llenar datos
  heightsList.forEach((doc) => {
    const total = doc.equipos.length;
    const vigentes = doc.equipos.filter(e => e.estado === 'Vigente').length;
    const vencidos = doc.equipos.filter(e => e.estado === 'Vencido').length;
    const reqInspeccion = doc.equipos.filter(e => e.estado === 'Requiere Inspección').length;
    const retirados = doc.equipos.filter(e => e.estado === 'Retirado').length;

    const dataRow = wsSummary.addRow([
      doc.nombreTrabajador,
      doc.cargo || 'Sin registrar',
      total,
      vigentes,
      vencidos,
      reqInspeccion,
      retirados
    ]);

    dataRow.height = 22;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Segoe UI' };
      
      if (colNum <= 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Color coding alerts
      if (colNum === 5 && vencidos > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { bold: true, color: { argb: 'FF991B1B' } };
      } else if (colNum === 6 && reqInspeccion > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A10' } };
        cell.font = { bold: true, color: { argb: 'FF854D0E' } };
      } else if (colNum === 4 && vigentes > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        cell.font = { color: { argb: 'FF166534' } };
      }
    });
  });

  wsSummary.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(35, Math.max(12, maxLen + 2));
  });

  // ============================================================================
  // HOJA 2: DETALLE HISTÓRICO DE EQUIPOS
  // ============================================================================
  const wsDetail = wb.addWorksheet('Inventario Detallado', {
    views: [{ showGridLines: true }]
  });

  // Título
  wsDetail.mergeCells('A1:N2');
  const titleCell2 = wsDetail.getCell('A1');
  titleCell2.value = '📋 INVENTARIO COMPLETO E INSPECCIÓN ANUAL DE ALTURAS';
  titleCell2.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

  // Headers
  const detailHeaders = [
    'Trabajador',
    'Cargo',
    'Elemento / Equipo',
    'Marca',
    'Referencia',
    'Serial',
    'Fecha Fabricación',
    'Fecha Compra',
    'Última Inspección',
    'Próxima Inspección',
    'Inspector Certificado',
    'Resultado Inspección',
    'Estado Equipo',
    'Observaciones'
  ];

  const headerRow2 = wsDetail.addRow(detailHeaders);
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

  let hasDetail = false;
  heightsList.forEach((doc) => {
    doc.equipos.forEach((eq) => {
      hasDetail = true;
      const dataRow = wsDetail.addRow([
        doc.nombreTrabajador,
        doc.cargo || 'Sin registrar',
        eq.nombre,
        eq.marca || 'N/A',
        eq.referencia || 'N/A',
        eq.serial,
        eq.fechaFabricacion || 'N/A',
        eq.fechaCompra || 'N/A',
        eq.fechaUltimaInspeccion || 'N/A',
        eq.fechaProximaInspeccion || 'N/A',
        eq.inspeccionadoPor || 'N/A',
        eq.resultadoInspeccion || 'N/A',
        eq.estado,
        eq.observaciones || ''
      ]);

      dataRow.height = 22;
      dataRow.eachCell((cell, colNum) => {
        cell.font = { size: 10, name: 'Segoe UI' };
        
        if (colNum <= 3 || colNum === 11 || colNum === 14) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Estado highlighting
        if (colNum === 13) {
          if (eq.estado === 'Vencido' || eq.estado === 'Retirado') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { bold: true, color: { argb: 'FF991B1B' } };
          } else if (eq.estado === 'Requiere Inspección') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF08A10' } };
            cell.font = { bold: true, color: { argb: 'FF854D0E' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            cell.font = { color: { argb: 'FF166534' } };
          }
        }
      });
    });
  });

  if (!hasDetail) {
    wsDetail.addRow(['No se han registrado equipos de alturas en el inventario aún']);
    wsDetail.mergeCells('A4:N4');
    wsDetail.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
    wsDetail.getCell('A4').font = { italic: true, name: 'Segoe UI', size: 10 };
  }

  wsDetail.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(35, Math.max(12, maxLen + 2));
  });

  // Escribir archivo
  const buffer = await wb.xlsx.writeBuffer();
  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8';
  const blob = new Blob([buffer], { type: fileType });
  saveAs(blob, `Reporte_Equipos_Alturas_${new Date().toISOString().slice(0,10)}.xlsx`);
};
