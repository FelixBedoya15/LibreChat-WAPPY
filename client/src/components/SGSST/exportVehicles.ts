import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface InspeccionVehicular {
  fecha: string;
  kilometraje: number;
  luces: 'Bueno' | 'Malo';
  frenos: 'Bueno' | 'Malo';
  llantas: 'Bueno' | 'Malo';
  direccion: 'Bueno' | 'Malo';
  cinturones: 'Bueno' | 'Malo';
  resultado: 'Aprobado' | 'Rechazado';
  firmaConductor?: string;
  observaciones?: string;
}

interface VehicleDoc {
  placa: string;
  marca: string;
  referencia: string;
  modelo: string;
  anio?: number;
  tipo: string;
  conductorId: string;
  conductorNombre: string;
  soatVencimiento: string;
  tecnomecanicaVencimiento?: string;
  ultimoMantenimiento?: string;
  proximoMantenimiento?: string;
  kilometrajeActual: number;
  inspecciones: InspeccionVehicular[];
}

export const exportVehiclesToExcel = async (vehiclesList: VehicleDoc[]) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: RESUMEN DE FLOTA
  // ============================================================================
  const wsFleet = wb.addWorksheet('Resumen de Flota', {
    views: [{ showGridLines: true }]
  });

  // Título Hero
  wsFleet.mergeCells('A1:L2');
  const titleCell = wsFleet.getCell('A1');
  titleCell.value = '🚗 PLAN ESTRATÉGICO DE SEGURIDAD VIAL (PESV) - HOJAS DE VIDA';
  titleCell.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }; // Dark Teal
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Fila de Info
  wsFleet.mergeCells('A3:L3');
  const infoCell = wsFleet.getCell('A3');
  infoCell.value = `Generado el: ${new Date().toLocaleDateString('es-CO')} | Normatividad: PESV Ley 1503 de 2011 / Res. 20223040040595`;
  infoCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Headers
  const fleetHeaders = [
    'Placa',
    'Tipo',
    'Marca',
    'Referencia',
    'Modelo',
    'Año',
    'Conductor Asignado',
    'Kilometraje',
    'Vencimiento SOAT 📄',
    'Vencimiento RTM 🔧',
    'Próximo Mantenimiento',
    'Estado'
  ];

  const headerRow1 = wsFleet.addRow(fleetHeaders);
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

  const today = new Date();
  today.setHours(0,0,0,0);

  // Llenar Datos
  vehiclesList.forEach((veh) => {
    // Calcular si está vencido
    let isExpired = false;
    if (veh.soatVencimiento) {
      const soat = new Date(veh.soatVencimiento + 'T12:00:00');
      if (soat < today) isExpired = true;
    }
    if (veh.tecnomecanicaVencimiento) {
      const rtm = new Date(veh.tecnomecanicaVencimiento + 'T12:00:00');
      if (rtm < today) isExpired = true;
    }
    const ultInsp = (veh.inspecciones || []).slice(-1)[0];
    if (ultInsp && ultInsp.resultado === 'Rechazado') {
      isExpired = true;
    }

    const estadoStr = isExpired ? 'Alerta / No Conforme' : 'Conforme';

    const dataRow = wsFleet.addRow([
      veh.placa,
      veh.tipo,
      veh.marca,
      veh.referencia || 'N/A',
      veh.modelo || 'N/A',
      veh.anio || 'N/A',
      veh.conductorNombre,
      veh.kilometrajeActual,
      veh.soatVencimiento,
      veh.tecnomecanicaVencimiento || 'N/A',
      veh.proximoMantenimiento || 'N/A',
      estadoStr
    ]);

    dataRow.height = 22;
    dataRow.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Segoe UI' };
      
      if (colNum === 1 || colNum === 6 || colNum === 8 || colNum === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Resaltado de Estado
      if (colNum === 12) {
        if (isExpired) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { bold: true, color: { argb: 'FF991B1B' }, size: 10, name: 'Segoe UI' };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          cell.font = { color: { argb: 'FF166534' }, size: 10, name: 'Segoe UI' };
        }
      }
    });
  });

  // Ajustar anchos
  wsFleet.columns.forEach((col) => {
    let maxLen = 0;
    col.eachCell!({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(35, Math.max(12, maxLen + 2));
  });

  // ============================================================================
  // HOJA 2: HISTORIAL DE INSPECCIONES PRE-OPERACIONALES
  // ============================================================================
  const wsInspecciones = wb.addWorksheet('Inspecciones Pre-operacionales', {
    views: [{ showGridLines: true }]
  });

  // Título
  wsInspecciones.mergeCells('A1:L2');
  const titleCell2 = wsInspecciones.getCell('A1');
  titleCell2.value = '📋 LISTAS DE CHEQUEO PRE-OPERACIONALES DE CONDUCTORES';
  titleCell2.font = { size: 15, bold: true, color: { argb: 'FFFFFFFF' }, name: 'Segoe UI' };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };

  // Headers
  const inspHeaders = [
    'Placa',
    'Conductor',
    'Fecha Inspección',
    'Kilometraje',
    'Luces',
    'Frenos',
    'Llantas',
    'Dirección',
    'Cinturones',
    'Resultado',
    '¿Firmado?',
    'Observaciones'
  ];

  const headerRow2 = wsInspecciones.addRow(inspHeaders);
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

  let hasInsp = false;
  vehiclesList.forEach((veh) => {
    (veh.inspecciones || []).forEach((insp) => {
      hasInsp = true;
      const dataRow = wsInspecciones.addRow([
        veh.placa,
        veh.conductorNombre,
        insp.fecha,
        insp.kilometraje,
        insp.luces,
        insp.frenos,
        insp.llantas,
        insp.direccion,
        insp.cinturones,
        insp.resultado,
        insp.firmaConductor ? 'Sí' : 'No',
        insp.observaciones || ''
      ]);

      dataRow.height = 22;
      dataRow.eachCell((cell, colNum) => {
        cell.font = { size: 10, name: 'Segoe UI' };
        
        if (colNum >= 3 && colNum <= 11) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Resaltado de fallos
        if (['luces', 'frenos', 'llantas', 'direccion', 'cinturones'].includes(inspHeaders[colNum-1].toLowerCase()) && cell.value === 'Malo') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2FF' } };
          cell.font = { bold: true, color: { argb: 'FF991B1B' } };
        }

        if (colNum === 10) {
          if (cell.value === 'Rechazado') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { bold: true, color: { argb: 'FF991B1B' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            cell.font = { color: { argb: 'FF166534' } };
          }
        }
      });
    });
  });

  if (!hasInsp) {
    wsInspecciones.addRow(['No se han registrado inspecciones pre-operacionales aún']);
    wsInspecciones.mergeCells('A4:L4');
    wsInspecciones.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
    wsInspecciones.getCell('A4').font = { italic: true, name: 'Segoe UI', size: 10 };
  }

  wsInspecciones.columns.forEach((col) => {
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
  saveAs(blob, `Reporte_PESV_Vehiculos_${new Date().toISOString().slice(0,10)}.xlsx`);
};
