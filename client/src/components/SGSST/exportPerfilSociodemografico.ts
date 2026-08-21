import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportWorkerEntry {
  nombre?: string;
  identificacion?: string;
  edad?: number | string;
  genero?: string;
  estadoCivil?: string;
  nivelEscolaridad?: string;
  direccion?: string;
  telefono?: string;
  cargo?: string;
  fechaNacimiento?: string;
  lugarNacimiento?: string;
  barrio?: string;
  municipioDomicilio?: string;
  correoElectronico?: string;
  deporte?: string;
  alimentacion?: string;
  riesgoCardiovascular?: string;
  emergenciaContacto?: string;
  tipoSangre?: string;
  personasCargo?: number | string;
  estrato?: string;
  vivienda?: string;
  fechaExamenMedico?: string;
  fechaCursoAlturasAutorizado?: string;
  fechaCursoAlturasCoordinador?: string;
  diagnosticoMedico?: string;
  recomendacionesMedicas?: string;
  enfermedades?: string;
  medicamentos?: string;
  fuma?: string;
  alcohol?: string;
  terapiaPsicologica?: string;
  fechaSeguimiento?: string;
  soatVencimiento?: string;
  tecnicomecanicaVencimiento?: string;
  licenciaConduccion?: string;
  licenciaConduccionVencimiento?: string;
  licenciaSST?: string;
  licenciaVencimiento?: string;
  curso50h?: string;
  curso20h?: string;
  esCopasst?: string;
  esComiteConvivencia?: string;
  esBrigadista?: string;
  esComiteSeguridadVial?: string;
  peso?: string | number;
  talla?: string | number;
  imc?: string | number;
  presionArterial?: string;
  frecuenciaCardiaca?: string;
  limitacionesBiomecanicas?: string;
  alergiasQuimicas?: string;
  consentimientoFirmaDigital?: string;
}

export const exportPerfilSociodemograficoToExcel = async (
  trabajadores: ExportWorkerEntry[],
  fileName: string = 'Perfil_Sociodemografico.xlsx'
) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA';
  wb.lastModifiedBy = 'Wappy IA';
  wb.created = new Date();
  wb.modified = new Date();

  const totalRows = trabajadores.length > 0 ? trabajadores.length + 1 : 2;

  // ============================================================================
  // HOJA 1: TRABAJADORES (PERFIL SOCIODEMOGRÁFICO Y CONDICIONES DE SALUD)
  // ============================================================================
  const ws = wb.addWorksheet('Trabajadores', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }]
  });

  // Column definitions with headers and comfortable widths
  ws.columns = [
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Identificación', key: 'identificacion', width: 18 },
    { header: 'Edad', key: 'edad', width: 10 },
    { header: 'Género', key: 'genero', width: 14 },
    { header: 'Estado Civil', key: 'estadoCivil', width: 16 },
    { header: 'Nivel Escolaridad', key: 'nivelEscolaridad', width: 20 },
    { header: 'Dirección', key: 'direccion', width: 26 },
    { header: 'Teléfono', key: 'telefono', width: 18 },
    { header: 'Cargo', key: 'cargo', width: 24 },
    { header: 'Fecha de Nacimiento', key: 'fechaNacimiento', width: 20 },
    { header: 'Lugar de Nacimiento', key: 'lugarNacimiento', width: 22 },
    { header: 'Barrio', key: 'barrio', width: 20 },
    { header: 'Municipio', key: 'municipioDomicilio', width: 20 },
    { header: 'Correo Electrónico', key: 'correoElectronico', width: 28 },
    { header: 'Deporte / Actividad Física', key: 'deporte', width: 26 },
    { header: 'Calidad de Alimentación', key: 'alimentacion', width: 24 },
    { header: 'Riesgo Cardiovascular', key: 'riesgoCardiovascular', width: 24 },
    { header: 'Contacto de Emergencia', key: 'emergenciaContacto', width: 24 },
    { header: 'Tipo de Sangre', key: 'tipoSangre', width: 16 },
    { header: 'Personas a Cargo', key: 'personasCargo', width: 18 },
    { header: 'Estrato', key: 'estrato', width: 12 },
    { header: 'Tipo de Vivienda', key: 'vivienda', width: 18 },
    { header: 'Fecha Examen Médico', key: 'fechaExamenMedico', width: 22 },
    { header: 'Curso Alturas Autorizado', key: 'fechaCursoAlturasAutorizado', width: 24 },
    { header: 'Curso Alturas Coordinador', key: 'fechaCursoAlturasCoordinador', width: 24 },
    { header: 'Diagnóstico Médico', key: 'diagnosticoMedico', width: 30 },
    { header: 'Recomendaciones Medicas', key: 'recomendacionesMedicas', width: 32 },
    { header: 'Enfermedades Actuales', key: 'enfermedades', width: 28 },
    { header: 'Medicamentos', key: 'medicamentos', width: 24 },
    { header: 'Fuma', key: 'fuma', width: 12 },
    { header: 'Alcohol', key: 'alcohol', width: 14 },
    { header: 'Terapia Psicológica', key: 'terapiaPsicologica', width: 20 },
    { header: 'Fecha Seguimiento', key: 'fechaSeguimiento', width: 20 },
    { header: 'Vencimiento SOAT', key: 'soatVencimiento', width: 20 },
    { header: 'Vencimiento Tecnicomecánica', key: 'tecnicomecanicaVencimiento', width: 26 },
    { header: 'Licencia Conducción', key: 'licenciaConduccion', width: 20 },
    { header: 'Vencimiento Licencia Cond', key: 'licenciaConduccionVencimiento', width: 26 },
    { header: 'N° Licencia SGSST', key: 'licenciaSST', width: 20 },
    { header: 'Venc. Licencia SGSST', key: 'licenciaVencimiento', width: 22 },
    { header: 'Curso 50h', key: 'curso50h', width: 14 },
    { header: 'Curso 20h', key: 'curso20h', width: 14 },
    { header: 'COPASST', key: 'esCopasst', width: 14 },
    { header: 'Comité Convivencia', key: 'esComiteConvivencia', width: 20 },
    { header: 'Brigadista', key: 'esBrigadista', width: 14 },
    { header: 'Comité Seg. Vial', key: 'esComiteSeguridadVial', width: 18 },
    { header: 'Peso (kg)', key: 'peso', width: 14 },
    { header: 'Talla (m)', key: 'talla', width: 14 },
    { header: 'IMC', key: 'imc', width: 12 },
    { header: 'Presión Arterial', key: 'presionArterial', width: 18 },
    { header: 'Frecuencia Cardíaca', key: 'frecuenciaCardiaca', width: 20 },
    { header: 'Limitaciones Biomecánicas', key: 'limitacionesBiomecanicas', width: 28 },
    { header: 'Alergias / Sensibilidad Química', key: 'alergiasQuimicas', width: 30 },
    { header: 'Consentimiento Firma', key: 'consentimientoFirmaDigital', width: 22 }
  ];

  // Auto-filter covering all columns
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: totalRows, column: ws.columns.length }
  };

  // Header Row Styling (Teal #0F766E, bold white text, height 36)
  const headerRow = ws.getRow(1);
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Segoe UI' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      right: { style: 'thin', color: { argb: 'FF042F2E' } }
    };
  });

  // Add Data Rows if any
  trabajadores.forEach((w, index) => {
    const rowNumber = index + 2;
    const addedRow = ws.addRow({
      nombre: w.nombre || '',
      identificacion: w.identificacion || '',
      edad: w.edad ?? '',
      genero: w.genero || '',
      estadoCivil: w.estadoCivil || '',
      nivelEscolaridad: w.nivelEscolaridad || '',
      direccion: w.direccion || '',
      telefono: w.telefono || '',
      cargo: w.cargo || '',
      fechaNacimiento: w.fechaNacimiento || '',
      lugarNacimiento: w.lugarNacimiento || '',
      barrio: w.barrio || '',
      municipioDomicilio: w.municipioDomicilio || '',
      correoElectronico: w.correoElectronico || '',
      deporte: w.deporte || '',
      alimentacion: w.alimentacion || '',
      riesgoCardiovascular: w.riesgoCardiovascular || '',
      emergenciaContacto: w.emergenciaContacto || '',
      tipoSangre: w.tipoSangre || '',
      personasCargo: w.personasCargo ?? '',
      estrato: w.estrato || '',
      vivienda: w.vivienda || '',
      fechaExamenMedico: w.fechaExamenMedico || '',
      fechaCursoAlturasAutorizado: w.fechaCursoAlturasAutorizado || '',
      fechaCursoAlturasCoordinador: w.fechaCursoAlturasCoordinador || '',
      diagnosticoMedico: w.diagnosticoMedico || '',
      recomendacionesMedicas: w.recomendacionesMedicas || '',
      enfermedades: w.enfermedades || '',
      medicamentos: w.medicamentos || '',
      fuma: w.fuma || '',
      alcohol: w.alcohol || '',
      terapiaPsicologica: w.terapiaPsicologica || '',
      fechaSeguimiento: w.fechaSeguimiento || '',
      soatVencimiento: w.soatVencimiento || '',
      tecnicomecanicaVencimiento: w.tecnicomecanicaVencimiento || '',
      licenciaConduccion: w.licenciaConduccion || '',
      licenciaConduccionVencimiento: w.licenciaConduccionVencimiento || '',
      licenciaSST: w.licenciaSST || '',
      licenciaVencimiento: w.licenciaVencimiento || '',
      curso50h: w.curso50h || '',
      curso20h: w.curso20h || '',
      esCopasst: w.esCopasst || 'No',
      esComiteConvivencia: w.esComiteConvivencia || 'No',
      esBrigadista: w.esBrigadista || 'No',
      esComiteSeguridadVial: w.esComiteSeguridadVial || 'No',
      peso: w.peso || '',
      talla: w.talla || '',
      imc: w.imc || '',
      presionArterial: w.presionArterial || '',
      frecuenciaCardiaca: w.frecuenciaCardiaca || '',
      limitacionesBiomecanicas: w.limitacionesBiomecanicas || '',
      alergiasQuimicas: w.alergiasQuimicas || '',
      consentimientoFirmaDigital: w.consentimientoFirmaDigital || 'No'
    });

    addedRow.height = 24;
    const isEven = rowNumber % 2 === 0;
    const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Center numeric and short status columns
      if ([2, 3, 4, 19, 20, 21, 23, 24, 25, 30, 31, 33, 34, 35, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 53].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
};
