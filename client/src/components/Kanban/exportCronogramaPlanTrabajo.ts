import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { excelSerialToDate } from '~/components/SGSST/excelWorkerMapper';

export interface CronogramaExportTask {
  _id?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  sourceModule?: string;
  actionType?: 'correctiva' | 'preventiva' | 'mejora' | string;
  priority?: 'alta' | 'media' | 'baja' | string;
  status?: 'todo' | 'due_soon' | 'overdue' | 'done' | string;
  assignedTo?: string;
  location?: string;
  emailAttendees?: string[];
  observations?: { id: string; text: string; author?: string; createdAt: string }[];
  rescheduleHistory?: {
    id: string;
    previousDate: string;
    newDate: string;
    reason: string;
    changedBy?: string;
  }[];
  closureDetails?: {
    howItWasClosed?: string;
    evidenceRef?: string;
    effectiveness?: string;
    closedBy?: string;
    closedAt?: string;
  };
}

export const MODULE_CATEGORY_LABELS: Record<string, string> = {
  manual: 'Tareas Generales / Plan de Trabajo',
  training: 'Capacitación SST',
  medical_exam: 'Examen Médico Ocupacional',
  copasst_finding: 'COPASST / Comité',
  audit_finding: 'Auditoría / Hallazgo',
  diagnostico_finding: 'Diagnóstico Inicial 0312',
  unsafe_act_finding: 'Actos y Condiciones Inseguras',
  ipevar_finding: 'Matriz IPEVR (GTC 45)',
  atel_finding: 'Investigación ATEL',
  pesv_inspection_finding: 'PESV / Seguridad Vial',
  soat: 'PESV / Vencimiento SOAT',
  rtm: 'PESV / Tecnomecánica (RTM)',
  other: 'Otro Compromiso SG-SST',
};

const LIST_CATEGORIAS = [
  'Tareas Generales / Plan de Trabajo',
  'Capacitación SST',
  'Examen Médico Ocupacional',
  'COPASST / Comité',
  'Auditoría / Hallazgo',
  'Diagnóstico Inicial 0312',
  'Actos y Condiciones Inseguras',
  'Matriz IPEVR (GTC 45)',
  'Investigación ATEL',
  'PESV / Seguridad Vial',
  'Otro Compromiso SG-SST',
];

const LIST_TIPO_ACCION = ['Preventiva', 'Correctiva', 'Mejora'];
const LIST_PRIORIDAD = ['Alta', 'Media', 'Baja'];
const LIST_ESTADO = [
  'Pendiente (todo)',
  'Próxima a vencer (due_soon)',
  'Vencida (overdue)',
  'Completada (done)',
];

/**
 * Convierte cualquier etiqueta de categoría/módulo en el `type` interno del modelo KanbanTask
 */
export function resolveTaskTypeFromModuleString(raw?: string): {
  type: string;
  sourceModule: string;
} {
  const val = String(raw || '').trim();
  const low = val.toLowerCase();
  if (!val) {
    return { type: 'manual', sourceModule: 'Plan de Trabajo SG-SST' };
  }
  if (low.includes('capacita') || low.includes('inducci') || low.includes('formaci') || low.includes('training')) {
    return { type: 'training', sourceModule: val };
  }
  if (low.includes('examen') || low.includes('medic') || low.includes('médic') || low.includes('emo')) {
    return { type: 'medical_exam', sourceModule: val };
  }
  if (low.includes('copasst') || low.includes('comit') || low.includes('vigia') || low.includes('vigía') || low.includes('convivencia')) {
    return { type: 'copasst_finding', sourceModule: val };
  }
  if (low.includes('audit') || low.includes('revisi')) {
    return { type: 'audit_finding', sourceModule: val };
  }
  if (low.includes('0312') || low.includes('diagnos') || low.includes('diagnós') || low.includes('estandar')) {
    return { type: 'diagnostico_finding', sourceModule: val };
  }
  if (low.includes('acto') || low.includes('condici') || low.includes('inspecci')) {
    return { type: 'unsafe_act_finding', sourceModule: val };
  }
  if (low.includes('ipevr') || low.includes('gtc') || low.includes('peligro') || low.includes('matriz de riesgo')) {
    return { type: 'ipevar_finding', sourceModule: val };
  }
  if (low.includes('atel') || low.includes('accidente') || low.includes('incidente') || low.includes('enfermedad')) {
    return { type: 'atel_finding', sourceModule: val };
  }
  if (low.includes('pesv') || low.includes('vial') || low.includes('vehicul') || low.includes('soat') || low.includes('rtm')) {
    return { type: 'pesv_inspection_finding', sourceModule: val };
  }
  return { type: 'manual', sourceModule: val };
}

/**
 * Normaliza fechas provenientes de Excel (serial numérico, DD/MM/YYYY o YYYY-MM-DD) a YYYY-MM-DD
 */
export function normalizeTaskDate(rawDate: any): string {
  if (rawDate === null || rawDate === undefined || rawDate === '') {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 7);
    return fallback.toISOString().split('T')[0];
  }
  if (typeof rawDate === 'number') {
    const converted = excelSerialToDate(rawDate);
    if (converted) return converted;
  }
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback.toISOString().split('T')[0];
}

/**
 * Mapeo inteligente directo (Opción 3: Carga Directa e Inmediata 1 a 1)
 * Convierte cualquier fila de un Excel de Plan de Trabajo Anual / Cronograma SG-SST al esquema KanbanTask.
 */
export function smartMapExcelToKanbanTasks(rawRows: any[]): any[] {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const normalizeKey = (k: string) =>
    String(k || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const results: any[] = [];

  for (const row of rawRows) {
    if (!row || typeof row !== 'object') continue;

    const getVal = (candidates: string[]): any => {
      for (const [k, v] of Object.entries(row)) {
        if (v === undefined || v === null || String(v).trim() === '') continue;
        const nk = normalizeKey(k);
        if (candidates.some((c) => nk === c || nk.includes(c))) {
          return v;
        }
      }
      return '';
    };

    const rawTitle =
      row.title ??
      getVal([
        'actividad',
        'titulo',
        'tarea',
        'compromiso',
        'accion',
        'hito',
        'tema',
        'objetivo',
        'nombre',
        'title',
      ]);
    const title = String(rawTitle || '').trim();
    if (!title) continue;
    // Ignorar si es repetición de cabecera
    if (/^(actividad|titulo de la accion|nombre de la actividad)$/i.test(title)) continue;

    const rawDesc =
      row.description ??
      getVal(['descripcion', 'alcance', 'hallazgo', 'detalle', 'meta', 'observacion', 'causaraiz']);
    const description = String(rawDesc || '').trim();

    const rawDate =
      row.dueDate ??
      getVal(['fechaprogramada', 'fechalimite', 'fecha', 'vencimiento', 'fechacierre', 'plazo', 'duedate']);
    const dueDate = normalizeTaskDate(rawDate);

    const rawStart = row.startTime ?? getVal(['horainicio', 'starttime', 'inicio']);
    const startTime = String(rawStart || '09:00').trim() || '09:00';

    const rawEnd = row.endTime ?? getVal(['horafin', 'endtime', 'fin']);
    const endTime = String(rawEnd || '10:00').trim() || '10:00';

    const rawModule =
      row.sourceModule ??
      row.type ??
      getVal(['categoria', 'modulo', 'origen', 'fuente', 'programa', 'ciclo', 'sourcemodule']);
    const { type, sourceModule } = resolveTaskTypeFromModuleString(rawModule);

    const rawActionType = String(
      row.actionType ?? getVal(['tipoaccion', 'acpm', 'acciontipo', 'clasificacion']),
    )
      .toLowerCase()
      .trim();
    let actionType: 'correctiva' | 'preventiva' | 'mejora' = 'preventiva';
    if (rawActionType.includes('corr')) actionType = 'correctiva';
    else if (rawActionType.includes('mej')) actionType = 'mejora';
    else if (rawActionType.includes('prev')) actionType = 'preventiva';

    const rawPriority = String(
      row.priority ?? getVal(['prioridad', 'criticidad', 'urgencia', 'severidad']),
    )
      .toLowerCase()
      .trim();
    let priority: 'alta' | 'media' | 'baja' = 'media';
    if (rawPriority.includes('alt')) priority = 'alta';
    else if (rawPriority.includes('baj')) priority = 'baja';

    const rawStatus = String(row.status ?? getVal(['estado', 'status', 'cumplimiento', 'situacion']))
      .toLowerCase()
      .trim();
    let status: 'todo' | 'due_soon' | 'overdue' | 'done' = 'todo';
    if (
      rawStatus.includes('complet') ||
      rawStatus.includes('hecha') ||
      rawStatus.includes('done') ||
      rawStatus.includes('cerrad') ||
      rawStatus.includes('cumplid')
    ) {
      status = 'done';
    } else if (rawStatus.includes('vencid') || rawStatus.includes('overdue') || rawStatus.includes('retras')) {
      status = 'overdue';
    } else if (rawStatus.includes('proxim') || rawStatus.includes('due_soon')) {
      status = 'due_soon';
    }

    const rawAssigned =
      row.assignedTo ?? getVal(['responsable', 'asignado', 'encargado', 'lider', 'ejecutor']);
    const assignedTo = String(rawAssigned || 'Coordinador SST').trim();

    const rawLocation = row.location ?? getVal(['ubicacion', 'lugar', 'sede', 'enlace', 'meet']);
    const location = String(rawLocation || '').trim();

    results.push({
      title,
      description,
      dueDate,
      startTime,
      endTime,
      type,
      sourceModule,
      actionType,
      priority,
      status,
      assignedTo,
      location,
    });
  }

  return results;
}

/**
 * Exporta el Plan de Trabajo Anual SG-SST / Cronograma Gantt o descarga la Plantilla Oficial (.xlsx)
 * con listas desplegables (Hoja 2: Listas de Opciones), idéntico al Perfil Sociodemográfico.
 */
export async function exportCronogramaPlanTrabajoToExcel(
  tasks: CronogramaExportTask[],
  fileName: string = 'Plan_Trabajo_Cronograma_SGSST.xlsx',
  isTemplate: boolean = false,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Wappy IA — Somos SST';
  wb.lastModifiedBy = 'Wappy IA — Somos SST';
  wb.created = new Date();
  wb.modified = new Date();

  // ============================================================================
  // HOJA 1: PLAN DE TRABAJO SG-SST / CRONOGRAMA GANTT
  // ============================================================================
  const ws = wb.addWorksheet('Plan de Trabajo SG-SST', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  // ============================================================================
  // HOJA 2: LISTAS DE OPCIONES (REFERENCIA PARA MENÚS DESPLEGABLES)
  // ============================================================================
  const wsOptions = wb.addWorksheet('Listas de Opciones', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
  });

  const optionsHeaders = [
    { header: 'Categorías / Módulos SG-SST', key: 'categoria', width: 34, data: LIST_CATEGORIAS },
    { header: 'Tipo de Acción ACPM', key: 'actionType', width: 22, data: LIST_TIPO_ACCION },
    { header: 'Prioridad', key: 'priority', width: 18, data: LIST_PRIORIDAD },
    { header: 'Estado de la Actividad', key: 'status', width: 28, data: LIST_ESTADO },
  ];

  wsOptions.columns = optionsHeaders.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  const optHeaderRow = wsOptions.getRow(1);
  optHeaderRow.height = 30;
  optHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  const maxOptRows = Math.max(...optionsHeaders.map((h) => h.data.length));
  for (let r = 0; r < maxOptRows; r++) {
    const rowValues: Record<string, string> = {};
    optionsHeaders.forEach((col) => {
      rowValues[col.key] = col.data[r] || '';
    });
    const added = wsOptions.addRow(rowValues);
    added.height = 20;
  }

  // Columnas Oficiales de la Hoja 1 (compatibles 100% con KANBAN_ACPM_FIELDS)
  ws.columns = [
    {
      header: 'Actividad / Compromiso Plan de Trabajo SG-SST',
      key: 'title',
      width: 42,
    },
    {
      header: 'Descripción / Alcance / Hallazgo',
      key: 'description',
      width: 46,
    },
    {
      header: 'Fecha Programada / Fecha Límite (YYYY-MM-DD)',
      key: 'dueDate',
      width: 24,
    },
    {
      header: 'Hora Inicio (HH:MM)',
      key: 'startTime',
      width: 16,
    },
    {
      header: 'Hora Fin (HH:MM)',
      key: 'endTime',
      width: 16,
    },
    {
      header: 'Categoría / Módulo SG-SST',
      key: 'sourceModule',
      width: 32,
    },
    {
      header: 'Tipo de Acción ACPM (Correctiva / Preventiva / Mejora)',
      key: 'actionType',
      width: 26,
    },
    {
      header: 'Prioridad (Alta / Media / Baja)',
      key: 'priority',
      width: 20,
    },
    {
      header: 'Estado (Pendiente / Próxima / Vencida / Completada)',
      key: 'status',
      width: 26,
    },
    {
      header: 'Responsable Asignado',
      key: 'assignedTo',
      width: 28,
    },
    {
      header: 'Ubicación / Lugar / Enlace Meet',
      key: 'location',
      width: 28,
    },
    {
      header: 'Bitácora de Observaciones y Reprogramaciones',
      key: 'observationsSummary',
      width: 40,
    },
    {
      header: 'Acta de Cierre y Evidencia ACPM',
      key: 'closureSummary',
      width: 40,
    },
  ];

  // Estilo de cabecera principal (WAPPY Teal #0F766E)
  const headerRow = ws.getRow(1);
  headerRow.height = 36;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      right: { style: 'thin', color: { argb: 'FF042F2E' } },
    };
  });

  const currentYear = new Date().getFullYear();
  const rowsData: CronogramaExportTask[] =
    isTemplate || !tasks || tasks.length === 0
      ? [
          {
            title: 'Inducción y Reinducción Anual en SG-SST',
            description:
              'Capacitación obligatoria en identificación de peligros, política SST y plan de emergencias para todo el personal.',
            dueDate: `${currentYear}-02-15`,
            startTime: '08:00',
            endTime: '10:00',
            type: 'training',
            sourceModule: 'Capacitación SST',
            actionType: 'preventiva',
            priority: 'alta',
            status: 'todo',
            assignedTo: 'Coordinador SST',
            location: 'Sala de Capacitación / Google Meet',
          },
          {
            title: 'Inspección Planeada de Extintores, Botiquines y Camillas',
            description:
              'Verificación mensual del estado físico, presión, señalización y vigencia de equipos de atención de emergencias.',
            dueDate: `${currentYear}-03-10`,
            startTime: '09:00',
            endTime: '11:30',
            type: 'unsafe_act_finding',
            sourceModule: 'Actos y Condiciones Inseguras',
            actionType: 'preventiva',
            priority: 'media',
            status: 'todo',
            assignedTo: 'Brigada de Emergencias / COPASST',
            location: 'Planta Operativa y Oficinas',
          },
          {
            title: 'Simulacro Anual de Evacuación y Respuesta ante Emergencias',
            description:
              'Ejercicio práctico de evacuación, activación de cadena de llamadas, conteo en punto de encuentro y evaluación del PONS.',
            dueDate: `${currentYear}-10-24`,
            startTime: '10:00',
            endTime: '12:00',
            type: 'copasst_finding',
            sourceModule: 'COPASST / Comité',
            actionType: 'mejora',
            priority: 'alta',
            status: 'todo',
            assignedTo: 'Comité de Emergencias / Coordinador SST',
            location: 'Todas las sedes',
          },
        ]
      : tasks;

  rowsData.forEach((t, idx) => {
    const rowNumber = idx + 2;
    const dueStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
    const moduleLabel =
      MODULE_CATEGORY_LABELS[t.type || ''] ||
      t.sourceModule ||
      'Tareas Generales / Plan de Trabajo';
    const actionLabel =
      t.actionType === 'correctiva'
        ? 'Correctiva'
        : t.actionType === 'mejora'
          ? 'Mejora'
          : 'Preventiva';
    const priorityLabel =
      t.priority === 'alta' ? 'Alta' : t.priority === 'baja' ? 'Baja' : 'Media';
    const statusLabel =
      t.status === 'done'
        ? 'Completada (done)'
        : t.status === 'overdue'
          ? 'Vencida (overdue)'
          : t.status === 'due_soon'
            ? 'Próxima a vencer (due_soon)'
            : 'Pendiente (todo)';

    const obsText =
      Array.isArray(t.observations) && t.observations.length > 0
        ? t.observations.map((o) => `[${o.author || 'SST'}: ${o.text}]`).join(' | ')
        : '';
    const reschedText =
      Array.isArray(t.rescheduleHistory) && t.rescheduleHistory.length > 0
        ? t.rescheduleHistory
            .map((r) => `Reprog: ${r.previousDate} -> ${r.newDate} (${r.reason})`)
            .join(' | ')
        : '';
    const combinedNotes = [obsText, reschedText].filter(Boolean).join(' — ');

    const closureText = t.closureDetails?.howItWasClosed
      ? `${t.closureDetails.howItWasClosed} | Evidencia: ${
          t.closureDetails.evidenceRef || 'N/A'
        } | Eficacia: ${t.closureDetails.effectiveness || 'eficaz'}`
      : '';

    const addedRow = ws.addRow({
      title: t.title || '',
      description: t.description || '',
      dueDate: dueStr,
      startTime: t.startTime || '09:00',
      endTime: t.endTime || '10:00',
      sourceModule: moduleLabel,
      actionType: actionLabel,
      priority: priorityLabel,
      status: statusLabel,
      assignedTo: t.assignedTo || 'Coordinador SST',
      location: t.location || '',
      observationsSummary: combinedNotes,
      closureSummary: closureText,
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
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if ([3, 4, 5, 7, 8, 9].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(rowsData.length + 1, 2), column: ws.columns.length },
  };

  // Validaciones desplegables hasta la fila 500
  const maxValidationRows = Math.max(rowsData.length + 100, 500);
  const validationsMap: Record<string, string> = {
    sourceModule: `'Listas de Opciones'!$A$2:$A$${LIST_CATEGORIAS.length + 1}`,
    actionType: `'Listas de Opciones'!$B$2:$B$${LIST_TIPO_ACCION.length + 1}`,
    priority: `'Listas de Opciones'!$C$2:$C$${LIST_PRIORIDAD.length + 1}`,
    status: `'Listas de Opciones'!$D$2:$D$${LIST_ESTADO.length + 1}`,
  };

  for (const [key, formula] of Object.entries(validationsMap)) {
    const col = ws.getColumn(key);
    if (!col || !col.letter) continue;
    const letter = col.letter;
    for (let r = 2; r <= maxValidationRows; r++) {
      const cell = ws.getCell(`${letter}${r}`);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: false,
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
