const express = require('express');
const requireJwtAuth = require('../../middleware/requireJwtAuth');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { logger } = require('~/config');
const mongoose = require('mongoose');
const CompanyInfo = require('../../../models/CompanyInfo');

const router = express.Router();

// ─── Helper: Obtener Empresa Activa ──────────────────────────────────────────
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

const SesionCapacitacionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  tema: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, default: '' },
  duracion: { type: String, default: '' },
  responsable: { type: String, default: '' },
  descripcion: { type: String, default: '' },
  estado: { type: String, enum: ['Programada', 'Completada', 'Cancelada'], default: 'Programada' },
  trabajadoresRegistrados: { type: Array, default: [] }, // Array of objects { nombre, cedula, cargo, asistio }
  evidencias: { type: Array, default: [] }, // Array of base64 images
  createdAt: { type: Date, default: Date.now },
});

const ProgramaCapacitacionesDataSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
  sesiones: [SesionCapacitacionSchema],
  planPersonalizado: { type: Array, default: [] }, // [{ workerId, capId, estado, fechaProgramada, fechaCompletada, sesionId }]
  updatedAt: { type: Date, default: Date.now },
});

ProgramaCapacitacionesDataSchema.index({ user: 1, companyId: 1 }, { unique: true });

const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData || 
  mongoose.model('ProgramaCapacitacionesData', ProgramaCapacitacionesDataSchema);

router.get('/data', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const data = await ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId: companyId });
    if (data) {
      return res.json({ sesiones: data.sesiones || [] });
    }
    return res.json({ sesiones: [] });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Load error:', error);
    res.status(500).json({ error: 'Error al cargar cronograma de capacitaciones' });
  }
});

const getStartAndEndTimes = (fecha, hora, duracion) => {
  let startHour = 8;
  let startMin = 0;
  if (hora && typeof hora === 'string') {
    const match = hora.trim().match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      startHour = parseInt(match[1], 10);
      startMin = parseInt(match[2], 10);
    }
  }

  let durationHours = 1;
  if (duracion && typeof duracion === 'string') {
    const numMatch = duracion.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (duracion.toLowerCase().includes('min')) {
        durationHours = num / 60;
      } else if (duracion.toLowerCase().includes('hor')) {
        durationHours = num;
      }
    }
  }

  const startStr = `${fecha}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
  
  const parts = fecha.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const startObj = new Date(year, month, day, startHour, startMin, 0);
  const endObj = new Date(startObj.getTime() + durationHours * 60 * 60 * 1000);
  
  const endYear = endObj.getFullYear();
  const endMonth = String(endObj.getMonth() + 1).padStart(2, '0');
  const endDay = String(endObj.getDate()).padStart(2, '0');
  const endHour = endObj.getHours();
  const endMin = endObj.getMinutes();
  const endStr = `${endYear}-${endMonth}-${endDay}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

  return {
    start: {
      dateTime: startStr,
      timeZone: 'America/Bogota',
    },
    end: {
      dateTime: endStr,
      timeZone: 'America/Bogota',
    }
  };
};

router.post('/save', requireJwtAuth, async (req, res) => {
  try {
    const { sesiones } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    // Obtener las sesiones anteriores para detectar eliminadas
    const oldData = await ProgramaCapacitacionesData.findOne({ user: userId, companyId });
    const oldSessions = oldData ? (oldData.sesiones || []) : [];

    // Guardar cronograma en la base de datos
    await ProgramaCapacitacionesData.findOneAndUpdate(
      { user: userId, companyId: companyId },
      { $set: { sesiones: sesiones || [], companyId, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );

    // Sincronizar de forma silenciosa con Google Calendar
    try {
      const { upsertCalendarEvent, deleteCalendarEvent } = require('../../services/googleCalendar');

      // 1. Eliminar eventos de sesiones borradas de la base de datos
      const newSessionIds = (sesiones || []).map(s => s.id);
      const deletedSessions = oldSessions.filter(s => !newSessionIds.includes(s.id));
      for (const s of deletedSessions) {
        await deleteCalendarEvent(userId, `session-${s.id}`);
      }

      // 2. Crear o actualizar las sesiones activas
      for (const s of (sesiones || [])) {
        const syncId = `session-${s.id}`;
        if (s.estado === 'Cancelada') {
          await deleteCalendarEvent(userId, syncId);
        } else {
          const timeData = getStartAndEndTimes(s.fecha, s.hora, s.duracion);
          const isCompletada = s.estado === 'Completada';
          await upsertCalendarEvent(userId, {
            summary: `${isCompletada ? '✅' : '📅'} Wappy: Capacitación - ${s.tema}`,
            description: `Sesión de capacitación en SST.\nTema: ${s.tema}\nResponsable: ${s.responsable || 'No asignado'}\nDescripción: ${s.descripcion || 'Sin descripción'}\nEstado: ${s.estado}`,
            start: timeData.start,
            end: timeData.end,
            colorId: isCompletada ? '10' : '9' // 10 = Eucalyptus green, 9 = Basil blue/green
          }, syncId);
        }
      }
    } catch (calErr) {
      logger.error('[SGSST Capacitaciones] Google Calendar sync failed:', calErr.message);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Save error:', error);
    res.status(500).json({ error: 'Error al guardar cronograma' });
  }
});

router.post('/generate-acta', requireJwtAuth, async (req, res) => {
  try {
    const { sesion } = req.body;
    if (!sesion) return res.status(400).json({ error: 'Sesion faltante' });

    let loadedCompanyInfo = null;
    try {
      const activeCompanyId = await getActiveCompanyId(req.user.id);
      if (activeCompanyId) {
        loadedCompanyInfo = await CompanyInfo.findOne({ _id: activeCompanyId, user: req.user.id }).lean();
      }
      if (!loadedCompanyInfo) {
        loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
      }
    } catch (e) {
      logger.warn('Failed to load company info for Acta');
    }

    const headerHTML = buildStandardHeader({
      title: 'ACTA DE CAPACITACIÓN Y ENTRENAMIENTO EN SST',
      companyInfo: loadedCompanyInfo,
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      norm: 'Decreto 1072 de 2015 (Art. 2.2.4.6.11) / Resolución 0312 de 2019',
      responsibleName: req.user?.name
    });

    let htmlBody = `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left; width: 30%;">TEMA TRATADO</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; font-weight: bold;">${sesion.tema || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">FECHA Y HORA</th>
            <td style="padding: 10px; color: #334155;">${sesion.fecha || ''} ${sesion.hora ? '- ' + sesion.hora : ''}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">DURACIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155;">${sesion.duracion || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">CAPACITADOR / RESPONSABLE</th>
            <td style="padding: 10px; color: #334155; font-weight: bold;">${sesion.responsable || 'N/A'}</td>
          </tr>
          <tr>
            <th style="background: #0f766e; color: #fff; padding: 10px;text-align: left;">OBJETIVO / DESCRIPCIÓN</th>
            <td style="padding: 10px; background: #f8fafc; color: #334155; line-height: 1.5;">${sesion.descripcion || 'Sin descripción'}</td>
          </tr>
        </table>
      </div>
      
      <h3 style="color: #0f766e; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #0f766e; padding-bottom: 5px;">REGISTRO DE ASISTENCIA Y APROBACIÓN</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <thead>
          <tr style="background: #0f766e; color: white;">
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">N°</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">NOMBRE COMPLETO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">CÉDULA</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af; text-align: left;">CARGO</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">ASISTIÓ</th>
            <th style="padding: 8px; border-bottom: 1px solid #1e40af;">FIRMA DIGITAL</th>
          </tr>
        </thead>
        <tbody>
    `;

    const trabajadores = sesion.trabajadoresRegistrados || [];
    if (trabajadores.length === 0) {
      htmlBody += `<tr><td colspan="6" style="padding: 15px; color: #64748b;">No hay trabajadores registrados en esta sesión.</td></tr>`;
    } else {
      trabajadores.forEach((t, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        htmlBody += `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #334155;">${i + 1}</td>
            <td style="padding: 10px; font-weight: bold; text-align: left; color: #1e293b;">${t.nombre || 'N/A'}</td>
            <td style="padding: 10px; color: #334155;">${t.cedula || 'N/A'}</td>
            <td style="padding: 10px; text-align: left; color: #334155;">${t.cargo || 'N/A'}</td>
            <td style="padding: 10px;">${t.asistio ? '✅ SÍ' : '❌ NO'}</td>
            <td style="padding: 10px; min-width: 150px; min-height: 50px; vertical-align: middle;">
              ${t.asistio ? `<div class="signature-placeholder" data-signature-id="dyn_asistente_${i}" style="border-bottom: 1px dashed #94a3b8; height: 35px; width: 80%; margin: 0 auto; display: flex; align-items: center; justify-content: center; cursor: pointer;"><span style="color: #cbd5e1; font-size: 10px;">Clic para insertar firma</span></div>` : '<span style="color: #cbd5e1;">Ausente</span>'}
            </td>
          </tr>
        `;
      });
    }

    htmlBody += `
        </tbody>
      </table>
    `;

    // Evidencias (fotos)
    let imagesHtml = '';
    const evidencias = sesion.evidencias || [];
    if (evidencias.length > 0) {
      imagesHtml = `
        <div style="margin-top: 30px; margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 5px; font-size: 15px;">ANEXO: EVIDENCIA FOTOGRÁFICA</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px;">`;
      
      evidencias.forEach((src, i) => {
        imagesHtml += `
          <div style="flex: 1; min-width: 250px; text-align: center; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <img src="${src}" style="width: 100%; height: auto; max-width: 300px; border-radius: 4px; object-fit: contain; margin-bottom: 5px;" alt="Evidencia ${i + 1}" />
            <br><span style="font-size: 11px; color: #64748b;">Evidencia ${i + 1} de capacitación</span>
          </div>
        `;
      });
      imagesHtml += `</div></div>`;
    }

    let fullReport = headerHTML + '<div style="margin-top: 20px;">' + htmlBody + '</div>' + imagesHtml;
    
    // Auto-inject Manager/SST signatures
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST Capacitaciones] Generate error:', error);
    res.status(500).json({ error: 'Error al generar acta de capacitación' });
  }
});

// ─── Catálogo de Capacitaciones SG-SST ──────────────────────────────────────
const CATALOGO_CAPACITACIONES = [
  { id: 'CAP-01', tema: 'Inducción y Reinducción SST', normativa: 'Res. 0312/2019', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-02', tema: 'Identificación de Peligros (GTC 45)', normativa: 'Decreto 1072/2015', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-03', tema: 'Uso y Mantenimiento de EPP', normativa: 'Res. 1843/2025', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-04', tema: 'Primeros Auxilios Básicos', normativa: 'Res. 0312/2019', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-05', tema: 'Plan de Emergencias y Evacuación', normativa: 'NSR-10 / Decreto 1072', frecuencia: 'Semestral', aplicaTodos: true },
  { id: 'CAP-06', tema: 'Ergonomía y Pausas Activas', normativa: 'GTC 256', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-07', tema: 'Trabajo en Alturas — Autorizado', normativa: 'Res. 4272/2021', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-08', tema: 'Trabajo en Alturas — Coordinador', normativa: 'Res. 4272/2021', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-09', tema: 'Espacios Confinados', normativa: 'Res. 0491/2020', frecuencia: 'Renovación', aplicaTodos: false },
  { id: 'CAP-10', tema: 'Riesgo Psicosocial y Estrés Laboral', normativa: 'Res. 2764/2022', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-11', tema: 'Seguridad Vial (PESV)', normativa: 'Res. 40595/2015', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-12', tema: 'Reporte de Actos y Condiciones Inseguras', normativa: 'Decreto 1072/2015', frecuencia: 'Anual', aplicaTodos: true },
  { id: 'CAP-13', tema: 'Manejo de Sustancias Químicas (GHS)', normativa: 'GTC 7 / NTC-ISO 11014', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-14', tema: 'Manejo de Herramientas Eléctricas', normativa: 'RETIE 2013', frecuencia: 'Anual', aplicaTodos: false },
  { id: 'CAP-15', tema: 'Prevención y Control de Incendios', normativa: 'NFPA 10 / NTC 3808', frecuencia: 'Anual', aplicaTodos: false },
];

const ENTRENAMIENTO_TO_CAP = {
  'Inducción y Reinducción en SST': 'CAP-01',
  'Identificación de Peligros y Riesgos (GTC 45)': 'CAP-02',
  'Uso y Mantenimiento de EPP': 'CAP-03',
  'Primeros Auxilios Básicos': 'CAP-04',
  'Prevención y Control de Incendios (Extintores)': 'CAP-15',
  'Plan de Emergencias y Evacuación': 'CAP-05',
  'Ergonomía y Pausas Activas': 'CAP-06',
  'Manejo de Sustancias Químicas (GHS)': 'CAP-13',
  'Riesgo Psicosocial y Manejo del Estrés': 'CAP-10',
  'Seguridad Vial (PESV)': 'CAP-11',
  'Reporte de Actos y Condiciones Inseguras': 'CAP-12',
  'Trabajador Autorizado para Trabajo en Alturas': 'CAP-07',
  'Coordinador de Trabajo Seguro en Alturas': 'CAP-08',
  'Administrador del Programa de Protección Contra Caídas': 'CAP-08',
  'Trabajador Entrante para Espacios Confinados': 'CAP-09',
  'Vigía de Seguridad para Espacios Confinados': 'CAP-09',
  'Supervisor de Trabajo en Espacios Confinados': 'CAP-09',
  'Administrador de Programa para Espacios Confinados': 'CAP-09',
  'Manejo Seguro de Herramientas Eléctricas y Manuales': 'CAP-14',
  'Mantenimiento Preventivo de Equipos': 'CAP-14',
  'Buenas Prácticas de Manufactura (BPM)': 'CAP-13',
};

const BIOTAG_CONTRAINDICACIONES = {
  'Vertigo': ['CAP-07', 'CAP-08'],
  'Epilepsia': ['CAP-07', 'CAP-08'],
  'Cardiopatia': ['CAP-07'],
};

const BIOTAG_RECOMENDACIONES = {
  'Restriccion_Mental': 'CAP-10',
  'Lumbalgia': 'CAP-06', 'Hernia_Discal': 'CAP-06', 'No_Carga_Peso': 'CAP-06',
  'Restriccion_Hombro': 'CAP-06', 'Restriccion_Rodilla': 'CAP-06', 'No_Bipedestacion': 'CAP-06',
  'EPOC': 'CAP-13', 'Asma': 'CAP-13', 'Alergia_Quimica': 'CAP-13',
  'HTA': 'CAP-06', 'Hipoacusia': 'CAP-03',
};

const CONTROLES_ADMIN_KEYWORDS = {
  'CAP-01': [/induccion/i, /reinduccion/i, /acogida/i],
  'CAP-02': [/gtc 45/i, /gtc-45/i, /identificacion de peligros/i, /evaluacion de riesgos/i, /matriz de peligros/i, /valoracion.*riesgo/i],
  'CAP-03': [/epp/i, /elementos de proteccion/i, /uso de epp/i, /mantenimiento de epp/i, /casco/i, /gafas/i, /botas/i, /guantes/i, /mascarilla/i, /respirador/i],
  'CAP-04': [/primeros auxilios/i, /auxilio/i, /rcp/i, /reanimacion/i, /vendajes/i, /atencion basica/i],
  'CAP-05': [/plan de emergencias/i, /evacuacion/i, /simulacro/i, /punto de encuentro/i, /brigada/i],
  'CAP-06': [/ergonom/i, /pausa/i, /higiene postural/i, /postura/i, /levantamiento de carga/i, /fisiotera/i, /manipulacion manual/i, /lumbalgia/i, /biomecanic/i, /sobreesfuerzo/i],
  'CAP-07': [/altura/i, /arnes/i, /caida/i, /linea de vida/i, /mosqueton/i, /andamio/i],
  'CAP-08': [/coordinador.*altura/i, /coordinador de trabajo seguro/i],
  'CAP-09': [/confinado/i, /gases/i, /atmosfera/i, /monoxido/i],
  'CAP-10': [/psicosocial/i, /estres/i, /clima laboral/i, /burnout/i, /acoso/i, /salud mental/i, /ansiedad/i],
  'CAP-11': [/vial/i, /pesv/i, /transito/i, /conduccion/i, /manejo defensivo/i, /vias/i, /conductor/i],
  'CAP-12': [/reporte de actos/i, /acto inseguro/i, /condicion insegura/i, /reporte.*condicion/i],
  'CAP-13': [/quimic/i, /sustancia/i, /ghs/i, /rotulado/i, /ficha de seguridad/i, /msds/i, /solvente/i, /toxico/i, /reactivo/i],
  'CAP-14': [/herramienta/i, /maquina/i, /retie/i, /riesgo electrico/i, /taladro/i, /esmeril/i, /pulidora/i, /uso.*seguro/i],
  'CAP-15': [/incendio/i, /extintor/i, /fuego/i, /combate/i, /prevencion de incendios/i]
};

function calcularTemasAplicables(worker, perfilCargo) {
  const capMap = {};

  // Helper de normalización
  const normalizeString = (str) => {
    return str
      ? str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
      : "";
  };

  // 1. Obligatorios para todos
  ['CAP-01', 'CAP-02', 'CAP-05', 'CAP-12'].forEach(id => {
    capMap[id] = { aplica: true, razon: 'Normativo — aplica a todos los trabajadores', excluida: false, prioridad: 'Alta' };
  });

  // 2. Por perfil de cargo
  if (perfilCargo) {
    (perfilCargo.entrenamientosSeleccionados || []).forEach(ent => {
      const capId = ENTRENAMIENTO_TO_CAP[ent];
      if (capId && !capMap[capId]) {
        capMap[capId] = { aplica: true, razon: `Perfil de Cargo: ${perfilCargo.nombreCargo}`, excluida: false, prioridad: 'Alta' };
      }
    });
    if ((perfilCargo.eppSeleccionados || []).length > 0 && !capMap['CAP-03']) {
      capMap['CAP-03'] = { aplica: true, razon: `EPP requerido en cargo: ${perfilCargo.nombreCargo}`, excluida: false, prioridad: 'Media' };
    }
  }

  // 3. Por BioTags Oráculo H1 — recomendaciones
  const activeTags = (worker.bioTagsIA || []).map(tag => normalizeString(tag));
  
  Object.keys(BIOTAG_RECOMENDACIONES).forEach(rawKey => {
    const normKey = normalizeString(rawKey);
    const capId = BIOTAG_RECOMENDACIONES[rawKey];
    if (activeTags.includes(normKey) && !capMap[capId]) {
      capMap[capId] = { aplica: true, razon: `Oráculo H1: ${rawKey} detectado`, excluida: false, prioridad: 'Alta' };
    }
  });

  // 4. Por Controles Administrativos (Matriz 360 - riesgosBioIndividual & riesgosIpevar)
  const todosLosRiesgos = [
    ...(worker.riesgosBioIndividual || []),
    ...(worker.riesgosIpevar || [])
  ];

  todosLosRiesgos.forEach(r => {
    const ctrlText = r.medida_administrativa || r.medidaAdministrativa || '';
    if (!ctrlText) return;

    const normCtrl = normalizeString(ctrlText);

    Object.keys(CONTROLES_ADMIN_KEYWORDS).forEach(capId => {
      const regexes = CONTROLES_ADMIN_KEYWORDS[capId] || [];
      const match = regexes.some(rx => rx.test(normCtrl));
      
      if (match && (!capMap[capId] || !capMap[capId].excluida)) {
        capMap[capId] = {
          aplica: true,
          razon: `Control Administrativo (Matriz 360): "${ctrlText.substring(0, 100)}${ctrlText.length > 100 ? '...' : ''}"`,
          excluida: false,
          prioridad: 'Alta'
        };
      }
    });
  });

  // 5. Por BioTags — contraindicaciones (sobreescriben todo lo anterior por seguridad ocupacional extrema)
  Object.keys(BIOTAG_CONTRAINDICACIONES).forEach(rawKey => {
    const normKey = normalizeString(rawKey);
    if (activeTags.includes(normKey)) {
      const capIds = BIOTAG_CONTRAINDICACIONES[rawKey] || [];
      capIds.forEach(capId => {
        capMap[capId] = { aplica: false, razon: `Oráculo H1: CONTRAINDICADO — ${rawKey}`, excluida: true, prioridad: 'Alta' };
      });
    }
  });

  // 6. Licencia de conducción → PESV
  if (worker.licenciaConduccion && (!capMap['CAP-11'] || !capMap['CAP-11'].excluida)) {
    capMap['CAP-11'] = { aplica: true, razon: 'Conductor con licencia activa — Riesgo Vial', excluida: false, prioridad: 'Alta' };
  }

  // 7. Brigadista
  if (worker.esBrigadista && worker.esBrigadista !== 'No') {
    if ((!capMap['CAP-04'] || !capMap['CAP-04'].excluida)) {
      capMap['CAP-04'] = { aplica: true, razon: 'Brigadista activo — Primeros Auxilios obligatorio', excluida: false, prioridad: 'Alta' };
    }
    if ((!capMap['CAP-15'] || !capMap['CAP-15'].excluida)) {
      capMap['CAP-15'] = { aplica: true, razon: 'Brigadista activo — Control de Incendios', excluida: false, prioridad: 'Alta' };
    }
  }

  return CATALOGO_CAPACITACIONES.map(cat => ({
    capId: cat.id,
    ...(capMap[cat.id] || { aplica: false, razon: 'No aplica según perfil actual', excluida: false, prioridad: 'Baja' }),
  }));
}

// ─── GET /plan-trabajador ─────────────────────────────────────────────────────
router.get('/plan-trabajador', requireJwtAuth, async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    const SgsstWorker = mongoose.models.SgsstWorker || mongoose.model('SgsstWorker');
    
    // --- DIAGNOSTIC: Log all companies for the user ---
    const allCompanies = await CompanyInfo.find({ user: req.user.id }).lean();
    logger.info(`[DEBUG_COMPANIES] User: ${req.user.id}`);
    allCompanies.forEach(c => {
      logger.info(`  - Company: "${c.companyName}" | ID: ${c._id} | isActive: ${c.isActive}`);
    });
    logger.info(`[DEBUG_COMPANIES] Resolved active companyId: ${companyId}`);

    // Dynamically retrieve models to avoid initialization timing issues
    const PerfilSocio = mongoose.models.PerfilSociodemograficoData || mongoose.model('PerfilSociodemograficoData');
    const PerfilCargo = mongoose.models.PerfilCargoData || mongoose.model('PerfilCargoData');

    // Fetch all collections in parallel
    const [socioDoc, cargoDoc, programaDoc, sgsstWorkers] = await Promise.all([
      PerfilSocio.findOne({ user: req.user.id, companyId }).lean(),
      PerfilCargo.findOne({ user: req.user.id, companyId }).lean(),
      ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId }).lean(),
      SgsstWorker.find({ user: req.user.id, companyId }).lean()
    ]);

    const legacyWorkers = socioDoc?.trabajadores || [];
    const perfilesCargo = cargoDoc?.perfilesList || [];
    const planPersonalizado = programaDoc?.planPersonalizado || [];
    
    // Combine legacy workers and SgsstWorkers, preferring SgsstWorkers as the source of truth
    const workerMap = new Map();
    
    // Add legacy workers first
    legacyWorkers.forEach(w => {
      workerMap.set(String(w.identificacion || w.id).trim(), { ...w, isLegacy: true });
    });
    
    // Overwrite/add new SgsstWorkers
    sgsstWorkers.forEach(w => {
      const docId = String(w.documento || w._id).trim();
      const existing = workerMap.get(docId) || {};
      workerMap.set(docId, {
        ...existing,
        ...w,
        id: w._id || w.id, // Ensure we have a valid ID for React
        nombre: w.nombre || existing.nombre,
        cargo: existing.cargo || '', // We will map perfilId later
        perfilId: w.perfilId || existing.perfilId,
        bioTagsIA: w.fitAlerts && w.fitAlerts.length > 0 ? w.fitAlerts : existing.bioTagsIA,
        aptitud: existing.aptitud || 'Sin evaluar'
      });
    });

    const trabajadores = Array.from(workerMap.values());

    console.log(`[DEBUG] GET /plan-trabajador -> userId: ${req.user.id}, companyId: ${companyId}`);
    console.log(`[DEBUG] socioDoc exists: ${!!socioDoc}, SgsstWorkers: ${sgsstWorkers.length}, Total combined: ${trabajadores.length}`);
    console.log(`[DEBUG] cargoDoc exists: ${!!cargoDoc}, perfilesCargo.length: ${perfilesCargo.length}`);

    // Build enriched plan per worker
    const trabajadoresConPlan = trabajadores.map(worker => {
      // Find matching cargo profile by cargo name OR perfilId
      const perfilCargo = perfilesCargo.find(
        p => (worker.perfilId && String(p.id) === String(worker.perfilId)) || 
             (p.nombreCargo && worker.cargo && p.nombreCargo.toLowerCase().trim() === worker.cargo.toLowerCase().trim())
      ) || null;

      // Ensure worker.cargo and perfilId are cross-resolved and set for the frontend
      if (perfilCargo) {
        if (!worker.cargo || worker.cargo === 'Sin cargo' || worker.cargo === 'Sin cargo asignado') {
          worker.cargo = perfilCargo.nombreCargo;
        }
        if (!worker.perfilId) {
          worker.perfilId = perfilCargo.id;
        }
      }

      const temas = calcularTemasAplicables(worker, perfilCargo);

      // Merge with saved plan states
      const temasConEstado = temas.map(t => {
        const saved = planPersonalizado.find(p => String(p.workerId) === String(worker.id || worker._id) && p.capId === t.capId);
        return {
          ...t,
          estado: saved?.estado || (t.aplica ? 'Pendiente' : 'NoAplica'),
          fechaProgramada: saved?.fechaProgramada || '',
          fechaCompletada: saved?.fechaCompletada || '',
          sesionId: saved?.sesionId || '',
        };
      });

      return {
        id: worker.id,
        nombre: worker.nombre,
        cargo: worker.cargo || 'Sin cargo',
        aptitud: worker.bioScoreIAAptitud || 'Sin evaluar',
        bioTagsIA: worker.bioTagsIA || [],
        perfilCargoId: perfilCargo?.id || null,
        temas: temasConEstado,
        completoPct: Math.round(
          (temasConEstado.filter(t => t.estado === 'Completada').length /
            Math.max(temasConEstado.filter(t => t.aplica).length, 1)) * 100
        ),
      };
    });

    // --- DEBUG: Find ALL workers for this user regardless of companyId
    const allUserWorkers = await SgsstWorker.find({ user: req.user.id }).select('_id nombre companyId documento').lean();

    res.json({
      trabajadores: trabajadoresConPlan,
      catalogo: CATALOGO_CAPACITACIONES,
      totalTrabajadores: trabajadoresConPlan.length,
      debugData: {
        userId: req.user.id,
        companyId,
        socioDocExists: !!socioDoc,
        rawTrabajadoresLength: legacyWorkers.length,
        cargoDocExists: !!cargoDoc,
        rawPerfilesLength: perfilesCargo.length,
        sgsstWorkersWithCompanyId: sgsstWorkers.length,
        allUserWorkers: allUserWorkers
      }
    });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] plan-trabajador error:', error);
    res.status(500).json({ error: 'Error al construir el plan de capacitaciones' });
  }
});

// ─── POST /save-plan ──────────────────────────────────────────────────────────
router.post('/save-plan', requireJwtAuth, async (req, res) => {
  try {
    const { planPersonalizado } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);
    await ProgramaCapacitacionesData.findOneAndUpdate(
      { user: req.user.id, companyId },
      { $set: { planPersonalizado: planPersonalizado || [], companyId, updatedAt: Date.now() } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] save-plan error:', error);
    res.status(500).json({ error: 'Error al guardar el plan personalizado' });
  }
});

// ─── POST /generate-programa ──────────────────────────────────────────────────
router.post('/generate-programa', requireJwtAuth, async (req, res) => {
  try {
    const { modelName } = req.body;
    const companyId = await getActiveCompanyId(req.user.id);

    let companyInfo = null;
    try {
      if (companyId) {
        companyInfo = await CompanyInfo.findOne({ _id: companyId, user: req.user.id }).lean();
      }
      if (!companyInfo) {
        companyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
      }
    } catch (e) {}

    const [socioDoc, cargoDoc, programaDoc] = await Promise.all([
      mongoose.models.PerfilSociodemograficoData?.findOne({ user: req.user.id, companyId }).lean(),
      mongoose.models.PerfilCargoData?.findOne({ user: req.user.id, companyId }).lean(),
      ProgramaCapacitacionesData.findOne({ user: req.user.id, companyId }).lean(),
    ]);

    const trabajadores = socioDoc?.trabajadores || [];
    const perfilesCargo = cargoDoc?.perfilesList || [];
    const sesiones = programaDoc?.sesiones || [];

    const resumen = trabajadores.map(w => {
      const pc = perfilesCargo.find(p => p.nombreCargo?.toLowerCase() === w.cargo?.toLowerCase());
      const temas = calcularTemasAplicables(w, pc).filter(t => t.aplica).map(t => {
        const cat = CATALOGO_CAPACITACIONES.find(c => c.id === t.capId);
        return cat ? cat.tema : t.capId;
      });
      return `- ${w.nombre || 'N/A'} (${w.cargo || 'S/C'}) [${w.bioScoreIAAptitud || 'Sin evaluar'}]: ${temas.join(', ')}`;
    }).join('\n');

    const { generateWithKeyRotation } = require('./sgsstGemini');
    const preferredModel = modelName || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();

    const prompt = `Eres un experto en SG-SST Colombia. Genera el PROGRAMA ANUAL DE CAPACITACIÓN Y ENTRENAMIENTO en formato HTML premium según el Decreto 1072/2015 (Art. 2.2.4.6.11) y Res. 0312/2019.

EMPRESA: ${companyInfo?.companyName || 'N/A'} | NIT: ${companyInfo?.nit || 'N/A'} | AÑO: ${new Date().getFullYear()}

TRABAJADORES Y TEMAS ASIGNADOS:\n${resumen || 'Sin trabajadores registrados'}

SESIONES PROGRAMADAS: ${sesiones.length} sesiones en cronograma.

ESTRUCTURA OBLIGATORIA (incluye los 6 elementos del Decreto 1072):
1. OBJETIVOS del programa (prevención AT/EL, cumplimiento normativo)
2. ALCANCE (dependientes, contratistas, cooperados, en misión - Art. 2.2.4.6.11)
3. TEMAS OBLIGATORIOS por cargo y riesgo (tabla: tema, normativa, horas, frecuencia)
4. CRONOGRAMA ANUAL (tabla: tema x mes x responsable x modalidad)
5. RESPONSABLES (personal idóneo: ARL, SENA, externos certificados)
6. RECURSOS (presupuesto estimado, técnicos, humanos)
7. INDICADORES: Cobertura (%), Cumplimiento (%), Eficacia evaluada
8. MATRIZ POR TRABAJADOR (tabla: trabajador x temas asignados x estado)

DISEÑO: tablas elegantes, cabeceras #0f766e, tipografía clara. NO uses bloques de código. Devuelve solo HTML.`;

    const result = await generateWithKeyRotation(preferredModel, req.user.id, prompt);
    let htmlBody = result.response.text().replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
    const header = buildStandardHeader({
      title: `PROGRAMA ANUAL DE CAPACITACIÓN Y ENTRENAMIENTO SG-SST — ${new Date().getFullYear()}`,
      companyInfo,
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      norm: 'Decreto 1072/2015 Art. 2.2.4.6.11 — Resolución 0312/2019',
      responsibleName: req.user?.name,
    });

    let fullReport = header + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (companyInfo) fullReport += buildSignatureSection(companyInfo);

    res.json({ report: fullReport });
  } catch (error) {
    logger.error('[SGSST CapacitacionesPlan] generate-programa error:', error);
    res.status(500).json({ error: 'Error al generar el programa anual' });
  }
});

module.exports = router;
