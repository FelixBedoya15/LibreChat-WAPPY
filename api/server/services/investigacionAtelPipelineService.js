'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const { logger } = require('~/config');
const CompanyInfo = require('~/models/CompanyInfo');
const InvestigacionAtelData = require('~/models/InvestigacionAtelData');
const SgsstWorker = require('~/models/SgsstWorker');
const PerfilSociodemograficoData = require('~/models/PerfilSociodemograficoData');
const { SgsstCopasstComite } = require('~/models/SgsstCopasst');
const {
  generateWithKeyRotation,
  autoPersistGeneratedReport,
} = require('~/server/routes/sgsst/sgsstGemini');
const {
  buildStandardHeader,
  buildCompanyContextString,
} = require('~/server/routes/sgsst/reportHeader');
const feedWorkerEvent = require('~/server/routes/sgsst/feedWorkerHelper');
const {
  extractTextFromFile,
  cleanAndParseJson,
} = require('~/server/routes/sgsst/fileExtractorHelper');
const { Message } = require('~/db/models');

const ALLOWED_GEMINI_TEXT_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

const ATEL_STRUCTURED_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tipoEvento: {
      type: 'string',
      enum: ['Incidente', 'Accidente Leve', 'Accidente Grave', 'Accidente Mortal'],
    },
    fechaEvento: { type: 'string' },
    horaEvento: { type: 'string' },
    lugarEvento: { type: 'string' },
    departamento: { type: 'string' },
    municipio: { type: 'string' },
    actividadMomento: { type: 'string' },
    afectadoNombre: { type: 'string' },
    afectadoCedula: { type: 'string' },
    afectadoCargo: { type: 'string' },
    afectadoEps: { type: 'string' },
    afectadoArl: { type: 'string' },
    tipoContrato: {
      type: 'string',
      enum: [
        'Indefinido',
        'Fijo',
        'Obra o labor',
        'Aprendizaje',
        'Prestación de servicios',
        'Temporal',
      ],
    },
    jornadaLaboral: {
      type: 'string',
      enum: ['Diurna', 'Nocturna', 'Mixta', 'Por turnos'],
    },
    experienciaLaboral: { type: 'string' },
    tiempoEnCargo: { type: 'string' },
    descripcionHechos: { type: 'string' },
    naturalezaLesion: {
      type: 'string',
      enum: [
        'Golpe / Contusión',
        'Herida / Laceración',
        'Fractura',
        'Esguince / Torcedura',
        'Quemadura',
        'Amputación',
        'Intoxicación',
        'Electrocución',
        'Trauma craneoencefálico',
        'Sin lesión (Incidente)',
        'Muerte',
        'Otra',
      ],
    },
    parteCuerpo: { type: 'string' },
    diasIncapacidad: { type: 'string' },
    agenteCausal: { type: 'string' },
    consecuencias: { type: 'string' },
    equipoInvestigador: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          cedula: { type: 'string' },
          rol: { type: 'string' },
        },
      },
    },
    testigos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          cedula: { type: 'string' },
          cargo: { type: 'string' },
          testimonio: { type: 'string' },
        },
      },
    },
  },
};

function resolveValidModelName(candidateModel, reqUser) {
  const cleanCandidate = String(candidateModel || '').replace('models/', '').trim();
  if (ALLOWED_GEMINI_TEXT_MODELS.includes(cleanCandidate)) {
    return cleanCandidate;
  }
  const userPref = String(reqUser?.personalization?.geminiModels?.sstManagement || '')
    .replace('models/', '')
    .trim();
  if (ALLOWED_GEMINI_TEXT_MODELS.includes(userPref)) {
    return userPref;
  }
  return 'gemini-3.6-flash';
}

function normalizeDateYmd(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoPrefix) return isoPrefix[1];
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${String(dmy[2]).padStart(2, '0')}-${String(dmy[1]).padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return s;
}

function normalizeDigits(val) {
  return String(val || '').replace(/\D+/g, '').trim();
}

function normalizeText(val) {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (/^(n\/a|na|no aplica|ningun[oa]|sin dato|null|undefined)$/i.test(s)) return '';
  return s;
}

function mapTipoEventoLabel(rawTipo, rawGravedad) {
  const combined = `${rawTipo || ''} ${rawGravedad || ''}`.toLowerCase();
  if (combined.includes('mortal') || combined.includes('muerte') || combined.includes('fatal')) {
    return 'Accidente Mortal';
  }
  if (combined.includes('grave') || combined.includes('amputa')) {
    return 'Accidente Grave';
  }
  if (combined.includes('incidente') || combined.includes('casi accidente')) {
    return 'Incidente';
  }
  if (
    combined.includes('accidente') ||
    combined.includes('leve') ||
    /\bat\b/.test(combined) ||
    combined.includes('furat')
  ) {
    return 'Accidente Leve';
  }
  return normalizeText(rawTipo) || 'Accidente Leve';
}

function extractGeminiResponseText(geminiResult) {
  if (!geminiResult) return '';
  if (typeof geminiResult?.response?.text === 'function') {
    return geminiResult.response.text() || '';
  }
  if (geminiResult?.text) {
    return typeof geminiResult.text === 'function' ? geminiResult.text() : String(geminiResult.text);
  }
  if (typeof geminiResult === 'string') {
    return geminiResult;
  }
  return '';
}

function getATELAnnualModel() {
  if (mongoose.models.ATELAnnualData) {
    return mongoose.models.ATELAnnualData;
  }
  try {
    require('~/server/routes/sgsst/atel-data');
  } catch (err) {
    logger.warn('[InvestigacionAtelPipeline] Could not load ATELAnnualData:', err.message);
  }
  return mongoose.models.ATELAnnualData || null;
}

function buildOfficialSignaturesHtml({ loadedCompanyInfo, formData, equipoList, testigosList }) {
  const ci = loadedCompanyInfo || {};
  const safeEquipo = Array.isArray(equipoList) ? equipoList : [];
  const safeTestigos = Array.isArray(testigosList) ? testigosList : [];

  const jefeInmediato = safeEquipo.find(
    (e) =>
      (e?.rol || '').toLowerCase().includes('jefe') ||
      (e?.rol || '').toLowerCase().includes('supervisor'),
  );
  const copasst = safeEquipo.find(
    (e) =>
      (e?.rol || '').toLowerCase().includes('copasst') ||
      (e?.rol || '').toLowerCase().includes('vig'),
  );

  const sig1Name = (jefeInmediato?.nombre || 'Jefe Inmediato / Supervisor').toUpperCase();
  const sig1CC = jefeInmediato?.cedula ? `CC. ${jefeInmediato.cedula}` : '';
  const sig2Name = (copasst?.nombre || 'Representante COPASST').toUpperCase();
  const sig2CC = copasst?.cedula ? `CC. ${copasst.cedula}` : '';

  const responsible = (ci.responsibleSST || 'Responsable SG-SST').toUpperCase();
  const license = ci.licenseNumber || '';
  const licenseExpiry = ci.licenseExpiry ? ` — Vence: ${ci.licenseExpiry}` : '';
  const legalRep = (ci.legalRepresentative || 'Representante Legal').toUpperCase();
  const companyName = ci.companyName || '';

  const workerName = formData?.afectadoNombre
    ? String(formData.afectadoNombre).toUpperCase()
    : 'TRABAJADOR AFECTADO';
  const workerCC = formData?.afectadoCedula ? `CC. ${formData.afectadoCedula}` : '';
  const workerCargo = formData?.afectadoCargo || '';

  const validTestigos = safeTestigos
    .filter((t) => t && t.nombre && String(t.nombre).trim() !== '')
    .slice(0, 3);

  const sigBox =
    'border-bottom:2px solid #333;width:85%;margin:0 auto 8px auto;min-height:70px;display:flex;align-items:center;justify-content:center;background-color:#f9f9f9;cursor:pointer;border-radius:8px 8px 0 0;transition:all 0.3s ease;';
  const sigNm = 'font-weight:800;font-size:12px;color:#1e293b;text-transform:uppercase;';
  const sigSb = 'font-size:11px;color:#64748b;font-weight:600;margin-top:2px;';
  const sigIn = 'font-size:10px;color:#94a3b8;margin-top:1px;';
  const tdS = 'width:33.33%;padding:14px 10px;text-align:center;vertical-align:bottom;';
  const lbl = 'color:#999;font-size:10px;';

  const buildHtmlSigs = (signaturesArray) => {
    let html = '<table style="width:100%;border-collapse:collapse;margin-bottom:28px;"><tr>';
    for (let i = 0; i < signaturesArray.length; i++) {
      if (i > 0 && i % 3 === 0) html += '</tr><tr>';
      html += signaturesArray[i];
    }
    const remainder = signaturesArray.length % 3;
    if (remainder > 0) {
      html += Array(3 - remainder)
        .fill(`<td style="${tdS}"></td>`)
        .join('');
    }
    html += '</tr></table>';
    return html;
  };

  const buildSigCell = (id, expectedName, role, subInfo, ccInfo) =>
    `<td style="${tdS}">` +
    `<div class="signature-placeholder" data-signature-id="${id}" style="${sigBox}">` +
    `<span style="${lbl}">Haga clic para insertar FIRMA DIGITAL</span></div>` +
    `<div style="${sigNm}">${expectedName}</div>` +
    `<div style="${sigSb}">${role}</div>` +
    `<div style="${sigIn}">${subInfo || ''}${subInfo && ccInfo ? ' &bull; ' : ''}${ccInfo || ''}</div>` +
    `</td>`;

  const equipoSigs = [
    buildSigCell('jefe-inmediato', sig1Name, 'Jefe Inmediato / Supervisor', sig1CC, ''),
    buildSigCell('copasst', sig2Name, 'Representante COPASST / Vig&iacute;a SST', sig2CC, ''),
    buildSigCell(
      'responsable-sst',
      responsible,
      'Responsable SG-SST',
      license ? `Lic. No. ${license}${licenseExpiry}` : '',
      '',
    ),
    buildSigCell('representante-legal', legalRep, 'Representante Legal', companyName, ''),
  ];

  const afectadoSigs = [
    buildSigCell('trabajador-afectado', workerName, 'Trabajador Afectado', workerCC, workerCargo),
  ];

  validTestigos.forEach((t, i) => {
    afectadoSigs.push(
      buildSigCell(
        `testigo-${i + 1}`,
        String(t.nombre).toUpperCase(),
        `Testigo ${i + 1}`,
        t.cedula ? `CC. ${t.cedula}` : '',
        t.cargo || '',
      ),
    );
  });

  return (
    '<div style="margin-top:50px;page-break-inside:avoid;">' +
    '<div style="border-top:2px solid #e2e8f0;padding-top:12px;margin-bottom:12px;text-align:center;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Firmas de Conformidad &mdash; Investigaci&oacute;n de Accidente/Incidente (Res. 1401/2007)</div>' +
    '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Equipo investigador y empresa</div>' +
    buildHtmlSigs(equipoSigs) +
    '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Trabajador afectado y testigos</div>' +
    buildHtmlSigs(afectadoSigs) +
    '<div style="text-align:center;font-size:10px;color:#cbd5e1;margin-top:20px;font-style:italic;">Documento generado electr&oacute;nicamente por el Gestor Inteligente SGSST &mdash; WAPPY IA By WAPPY LTDA &copy; 2025</div>' +
    '</div>'
  );
}

function buildRes1401MasterPrompt({
  formData,
  equipoList,
  testigosList,
  companyInfoBlock,
}) {
  const {
    tipoEvento,
    fechaEvento,
    horaEvento,
    lugarEvento,
    departamento,
    municipio,
    actividadMomento,
    descripcionHechos,
    afectadoNombre,
    afectadoCedula,
    afectadoCargo,
    afectadoEps,
    afectadoArl,
    tipoContrato,
    jornadaLaboral,
    experienciaLaboral,
    tiempoEnCargo,
    naturalezaLesion,
    parteCuerpo,
    diasIncapacidad,
    agenteCausal,
    consecuencias,
  } = formData || {};

  const safeTestigos = Array.isArray(testigosList) ? testigosList : [];
  const safeEquipo = Array.isArray(equipoList) ? equipoList : [];

  const testigosBlock =
    safeTestigos.length > 0 && safeTestigos[0]?.nombre
      ? safeTestigos
          .map(
            (t, i) =>
              `Testigo ${i + 1}: ${t.nombre || 'N/A'} | CC: ${t.cedula || 'N/A'} | Cargo: ${t.cargo || 'N/A'}\nVersión: "${t.testimonio || 'Sin testimonio documentado'}"`,
          )
          .join('\n\n')
      : 'No se documentaron testigos.';

  const equipoBlock =
    safeEquipo.length > 0 && safeEquipo[0]?.nombre
      ? safeEquipo
          .map(
            (e) =>
              `• ${e.nombre || 'N/A'} (CC: ${e.cedula || 'N/A'}) — ${e.rol || 'Investigador'}`,
          )
          .join('\n')
      : '• Equipo investigador pendiente de asignar';

  return `Eres un experto en Investigación de Accidentes e Incidentes Laborales certificado bajo la normatividad colombiana (Resolución 1401 de 2007, Decreto 1072 de 2015).

Tienes la siguiente información para investigar:

════════════════════════════════════════
📋 DATOS DEL EVENTO
════════════════════════════════════════
- Tipo de Evento: ${tipoEvento || 'No especificado'}
- Fecha: ${fechaEvento || 'N/A'} | Hora: ${horaEvento || 'N/A'}
- Lugar/Área: ${lugarEvento || 'N/A'}
- Departamento: ${departamento || 'N/A'} | Municipio: ${municipio || 'N/A'}
- Actividad al momento del evento: ${actividadMomento || 'N/A'}

════════════════════════════════════════
👷 TRABAJADOR AFECTADO
════════════════════════════════════════
- Nombre: ${afectadoNombre || 'N/A'}
- Cédula: ${afectadoCedula || 'N/A'}
- Cargo: ${afectadoCargo || 'N/A'}
- EPS: ${afectadoEps || 'N/A'} | ARL: ${afectadoArl || 'N/A'}
- Tipo de contrato: ${tipoContrato || 'N/A'}
- Jornada laboral: ${jornadaLaboral || 'N/A'}
- Experiencia laboral total: ${experienciaLaboral || 'N/A'} años
- Tiempo en el cargo actual: ${tiempoEnCargo || 'N/A'}

════════════════════════════════════════
📖 DESCRIPCIÓN DE LOS HECHOS
════════════════════════════════════════
"${descripcionHechos || 'Sin descripción registrada'}"

Naturaleza de la lesión: ${naturalezaLesion || 'N/A'}
Parte del cuerpo afectada: ${parteCuerpo || 'N/A'}
Agente causal: ${agenteCausal || 'N/A'}
Consecuencias: ${consecuencias || 'N/A'}
Días de incapacidad: ${diasIncapacidad || '0'}

════════════════════════════════════════
👥 TESTIGOS
════════════════════════════════════════
${testigosBlock}

════════════════════════════════════════
🔍 EQUIPO INVESTIGADOR (Art. 7 Res. 1401/2007)
════════════════════════════════════════
${equipoBlock}

════════════════════════════════════════
🏢 DATOS DE LA EMPRESA
════════════════════════════════════════
${companyInfoBlock || 'No disponible'}

════════════════════════════════════════════════════════════════════════════
📐 INSTRUCCIONES ESTRICTAS PARA GENERAR EL INFORME
════════════════════════════════════════════════════════════════════════════

Genera un INFORME DE INVESTIGACIÓN PROFESIONAL y VISUAL en HTML cumpliendo la Resolución 1401 de 2007.
El informe debe verse como un DASHBOARD TÉCNICO de alta calidad.

1. **ENCABEZADO:** No generes ningún encabezado del documento ni logos. El sistema los insertará automáticamente.

2. **DESCRIPCIÓN ANALÍTICA DEL EVENTO:**
   Narra perícialmente cómo ocurrió el evento en tres momentos: ANTES, DURANTE y DESPUÉS.
   Incluye análisis de las condiciones del entorno, estado del trabajador y factores organizacionales.

3. **METODOLOGÍA 1 — 5 PORQUÉS (Diagrama Visual Tipo Cascada):**
   Crea 5 tarjetas conectadas con flechas descendentes (CSS únicamente).
   - Diseño: divs con background azul pastel oscureciendo progresivamente hacia la causa raíz.
   - La tarjeta final (Causa Raíz) en rojo/naranja destacado.
   - Usa inline styles. Cada tarjeta tiene: Pregunta → Respuesta.
   - PRECAUCIÓN: Aplica siempre color: #111 en las tarjetas con fondos claros.

4. **METODOLOGÍA 2 — DIAGRAMA DE ISHIKAWA (ESPINA DE PESCADO — SVG OBLIGATORIO):**
   DEBES CONSTRUIR ESTE DIAGRAMA USANDO SVG INLINE. Es la única forma de garantizar líneas diagonales precisas y consistentes.

    Utiliza de base la siguiente estructura SVG para el Diagrama de Ishikawa y rellena el contenido del accidente (sustituye las etiquetas entre [CORCHETES] con datos reales):

   <div class="diagram-node" style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0369a1;border-radius:14px;padding:20px;margin:24px 0;overflow-x:auto;">
   <h3 style="text-align:center;color:#0c4a6e;font-size:17px;font-weight:800;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">DIAGRAMA DE ISHIKAWA — ANÁLISIS CAUSA-EFECTO</h3>
   <svg viewBox="0 0 1010 480" width="100%" style="min-width:700px;font-family:Arial,sans-serif;">
     <!-- ESPINA DORSAL CENTRAL -->
     <line x1="60" y1="240" x2="798" y2="240" stroke="#1e3a8a" stroke-width="4"/>
     <polygon points="798,232 818,240 798,248" fill="#1e3a8a"/>
     <!-- Cola del pez -->
     <polyline points="60,215 30,240 60,265" fill="none" stroke="#1e3a8a" stroke-width="3"/>
     <!-- CABEZA DEL PEZ (PROBLEMA) -->
     <polygon class="diagram-node" points="818,160 930,190 968,240 930,290 818,320" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
     <text x="878" y="220" text-anchor="middle" font-size="11" font-weight="800" fill="white">[NOMBRE</text>
     <text x="878" y="236" text-anchor="middle" font-size="11" font-weight="800" fill="white">ACCIDENTE]</text>
     <text x="878" y="254" text-anchor="middle" font-size="10" font-weight="700" fill="white">[CONSECUENCIA</text>
     <text x="878" y="270" text-anchor="middle" font-size="10" font-weight="700" fill="white">PRINCIPAL]</text>
     <!-- HUESO 1 SUPERIOR: MANO DE OBRA -->
     <line x1="180" y1="240" x2="108" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="180" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="18" y="65" width="148" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="92" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MANO DE OBRA]</text>
     <line x1="155" y1="178" x2="118" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="62" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="143" y1="202" x2="106" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="50" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 2 SUPERIOR: MÉTODO -->
     <line x1="380" y1="240" x2="308" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="380" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="221" y="65" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="291" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MÉTODO]</text>
     <line x1="355" y1="178" x2="318" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="262" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="343" y1="202" x2="306" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="248" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 3 SUPERIOR: MATERIAL -->
     <line x1="580" y1="240" x2="508" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="580" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="421" y="65" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="491" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MATERIAL]</text>
     <line x1="555" y1="178" x2="518" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="462" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="543" y1="202" x2="506" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="448" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 4 INFERIOR: MAQUINARIA -->
     <line x1="180" y1="240" x2="108" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="18" y="385" width="148" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="92" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MAQUINARIA]</text>
     <line x1="155" y1="302" x2="118" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="60" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="143" y1="278" x2="106" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="48" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 5 INFERIOR: ENTORNO -->
     <line x1="380" y1="240" x2="308" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="221" y="385" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="291" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[ENTORNO]</text>
     <line x1="355" y1="302" x2="318" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="260" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="343" y1="278" x2="306" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="248" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 6 INFERIOR: GESTIÓN -->
     <line x1="580" y1="240" x2="508" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="421" y="385" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="491" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[GESTIÓN / ADM.]</text>
     <line x1="555" y1="302" x2="518" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="460" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="543" y1="278" x2="506" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="448" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
   </svg>
   </div>

   REGLAS ABSOLUTAS PARA ISHIKAWA:
   - NUNCA uses tablas HTML para este diagrama. SIEMPRE usa el SVG de arriba.
   - Reemplaza CADA texto entre [CORCHETES] con el contenido real del accidente investigado.
   - Si una causa es muy larga, divide en 2 lineas SVG <text> con dy="13" en la segunda.
   - NUNCA muevas las coordenadas x1,y1,x2,y2 de las líneas ni los puntos de los rectángulos.

5. **METODOLOGÍA 3 — ÁRBOL DE CAUSAS (MUY EXTENSO, PROFUNDO Y CON CONECTORES VISIBLES):**
   Construye un árbol descendente con mínimo 4-5 niveles de profundidad. ¡Los conectores son OBLIGATORIOS y deben verse claramente entre cada par de nodos!
   IMPORTANTE: El título de esta sección en el informe debe ser simplemente "ÁRBOL DE CAUSAS" sin añadir referencias a metodologías ni normas en el titulo.

   TIPOS DE RELACIONES:
   - SECUENCIAL: 1 padre → 1 hijo (línea vertical)
   - CONJUNCIÓN: varios nodos → 1 resultado (convergen con barra horizontal)
   - DISYUNCIÓN: 1 nodo → múltiples ramas descendentes

   NOMENCLATURA OBLIGATORIA:
   1. CÍRCULOS = "Hechos Inusuales" (eventos que ocurrieron)
   2. RECTÁNGULOS = "Hechos Permanentes" (condiciones siempre existentes en el sistema)

   ESTILOS EXACTOS DE NODOS (usa class="diagram-node" en todos):
   CÍRCULO: <div class="diagram-node" style="border-radius:50%;width:120px;height:120px;display:flex;align-items:center;justify-content:center;text-align:center;border:3px solid #334155;background:#fef9c3;color:#111;font-size:11px;font-weight:600;padding:8px;flex-shrink:0;">[texto]</div>
   RECTÁNGULO normal: <div class="diagram-node" style="border-radius:8px;padding:14px 18px;text-align:center;border:3px solid #334155;background:#e0f2fe;color:#111;font-size:12px;font-weight:600;min-width:160px;max-width:280px;">[texto]</div>
   CONSECUENCIA (primer nodo): <div class="diagram-node" style="border-radius:8px;padding:16px 24px;text-align:center;border:3px solid #991b1b;background:#fca5a5;color:#7f1d1d;font-size:13px;font-weight:800;width:80%;max-width:500px;">[CONSECUENCIA]</div>
   CAUSA RAÍZ (último nodo): <div class="diagram-node" style="border-radius:8px;padding:16px 24px;text-align:center;border:3px solid #065f46;background:#d1fae5;color:#065f46;font-size:13px;font-weight:800;width:90%;max-width:600px;">[CAUSA RAÍZ]</div>

   Cadena visual: CONSECUENCIA → HECHOS DIRECTOS (círculos) → CAUSAS INMEDIATAS (rects) → CAUSAS BÁSICAS (rects) → CAUSA RAÍZ (rect verde).
   Usa class="diagram-node" en TODOS y líneas conectoras verticales/horizontales con background:#334155.

6. **TABLA DE CLASIFICACIÓN DE CAUSAS (Res. 1401/2007 Art. 4):**
   Tabla HTML bien formateada con:
   - Causas Básicas: (Factores del trabajador + Factores de trabajo)
   - Causas Inmediatas: (Actos inseguros + Condiciones inseguras)
   Aplica thead con fondo azul oscuro y color blanco.

7. **PLAN DE ACCIÓN Y MEDIDAS DE INTERVENCIÓN:**
   Tabla colorida (4 columnas: Control Propuesto | Tipo Jerarquía | Responsable | Fecha límite).
   Sigue la jerarquía de controles: Eliminación → Sustitución → Ingeniería → Administrativo → EPP.
   Usa filas con fondo claro SIEMPRE con color: #111.

8. **CONCLUSIONES Y COMPROMISOS:**
   Párrafo técnico con las principales conclusiones y compromisos empresariales para evitar recurrencia.
   Incluye el número de días para investigar (máx. 15 días hábiles Res. 1401/2007 Art. 4).

═══════════════════════════════
REGLAS DE DISEÑO OBLIGATORIAS:
═══════════════════════════════
- NUNCA apliques background claro SIN agregar color:#111 o color:#000 al mismo elemento.
- NO insertes firmas (el sistema las agrega automáticamente).
- NO incluyas etiquetas <html>, <body>, <head>, ni bloques de código \`\`\`.
- Devuelve SOLO el contenido HTML interno listo para renderizar.
- Todos los diagramas deben verse REALMENTE como diagramas, no como listas de texto.
- La presentación debe ser de nivel PROFESIONAL y causar impacto visual al director de SST.`;
}

function buildSummaryMarkdownFromPipeline({
  alreadyProcessed,
  caseId,
  formData,
  equipoList,
  reportConversationId,
  reportTitle,
  reportHtml,
}) {
  const reportLink = reportConversationId
    ? `https://wappy.club/c/${reportConversationId}`
    : null;
  const equipoStr =
    Array.isArray(equipoList) && equipoList.length > 0
      ? equipoList
          .map((e) => `${e.nombre || 'Integrante'} (${e.rol || 'Investigador'})`)
          .join(', ')
      : 'Equipo pendiente de asignar';

  let plainHighlights = '';
  if (reportHtml && typeof reportHtml === 'string') {
    const bodyWithoutSvgAndStyles = reportHtml
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' [Diagrama de Ishikawa SVG Oficial Generado] ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&mdash;/gi, '—')
      .replace(/&bull;/gi, '•')
      .replace(/\s+/g, ' ')
      .trim();
    if (bodyWithoutSvgAndStyles) {
      plainHighlights = bodyWithoutSvgAndStyles.slice(0, 1400);
    }
  }

  return [
    `### 📋 Informe Oficial Extraído del Aplicativo Investigación ATEL (Res. 1401 de 2007)`,
    `- **Estado del Expediente:** ${alreadyProcessed ? '♻️ Ya registrado e investigado previamente (Idempotente — Sin duplicación)' : '✅ Nuevo caso registrado, cruzado 360° e investigado en el aplicativo'}`,
    `- **ID Expediente ATEL:** \`${caseId}\``,
    reportTitle ? `- **Título en Historial del Aplicativo:** ${reportTitle}` : null,
    reportLink ? `- **Enlace Directo al Informe Oficial en WAPPY:** [Ver Informe Oficial ATEL](${reportLink})` : null,
    `- **Trabajador Afectado:** ${formData?.afectadoNombre || 'N/A'} (CC: ${formData?.afectadoCedula || 'N/A'}) — Cargo: ${formData?.afectadoCargo || 'N/A'}`,
    `- **Seguridad Social / Vínculo:** EPS: ${formData?.afectadoEps || 'N/A'} | ARL: ${formData?.afectadoArl || 'N/A'} | Contrato: ${formData?.tipoContrato || 'N/A'}`,
    `- **Evento y Fecha:** ${formData?.tipoEvento || 'ATEL'} | Fecha: ${formData?.fechaEvento || 'N/A'} ${formData?.horaEvento ? `(${formData.horaEvento})` : ''} | Lugar: ${formData?.lugarEvento || 'N/A'} (${formData?.municipio || ''}${formData?.departamento ? `, ${formData.departamento}` : ''})`,
    `- **Lesión y Agente Causal:** ${formData?.naturalezaLesion || 'N/A'} en ${formData?.parteCuerpo || 'N/A'} | Agente: ${formData?.agenteCausal || 'N/A'} | Incapacidad: ${formData?.diasIncapacidad || '0'} día(s)`,
    `- **Descripción de los Hechos:** ${formData?.descripcionHechos || 'N/A'}`,
    `- **Equipo Investigador (Art. 7 Res. 1401):** ${equipoStr}`,
    `- **Componentes del Informe HTML Generado:** Encabezado Corporativo + Análisis Antes/Durante/Después + 5 Porqués en Cascada + Diagrama de Ishikawa SVG (6 huesos) + Árbol de Causas con Conectores + Tabla Art. 4 Causas Básicas/Inmediatas + Plan de Acción por Jerarquía de Controles + Firmas Digitales de Conformidad.`,
    plainHighlights ? `\n**Síntesis Técnica Extraída del Informe Oficial:**\n> ${plainHighlights}...` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Ejecuta de extremo a extremo los 4 pasos reales dentro del aplicativo de Investigación ATEL (Hito 7):
 *  1) Mapeo IA de los 23 campos de InvestigacionATEL.tsx + Cruce 360° (SgsstWorker, PerfilSociodemograficoData, CompanyInfo, COPASST)
 *  2) Registro idempotente en InvestigacionAtelData + ATELAnnualData + feedWorkerEvent
 *  3) Ejecución del análisis pericial IA Res. 1401 de 2007 y persistencia en Historial (sgsst-investigacion-atel)
 *  4) Extracción del Informe Oficial HTML para continuar el flujo (req._generatedAppReports)
 */
async function runAtelAppInvestigationPipeline({
  req = null,
  userId = null,
  companyId = null,
  inputFields = {},
  rawDocumentText = '',
  fileBuffer = null,
  fileName = '',
  mimeType = '',
  sourceDriveFileId = '',
  generateOfficialReport = true,
  modelName = 'gemini-3.6-flash',
} = {}) {
  const effectiveUserId =
    userId ||
    req?.user?.id ||
    req?.user?._id ||
    (typeof req?.user === 'string' ? req.user : null);

  if (!effectiveUserId) {
    throw new Error('Se requiere un userId autenticado para ejecutar el pipeline de Investigación ATEL.');
  }

  const resolvedModel = resolveValidModelName(modelName, req?.user);
  const cleanDriveId = normalizeText(sourceDriveFileId || inputFields?.sourceDriveFileId || inputFields?.archivo_drive_id);
  const cleanDriveFileName = normalizeText(fileName || inputFields?.sourceDriveFileName || inputFields?.nombre_archivo_drive);

  // Resolver CompanyInfo activa o explícita
  let loadedCompanyInfo = null;
  const rawCompId = companyId || req?.companyId || req?.body?.companyId || null;
  if (rawCompId && mongoose.Types.ObjectId.isValid(String(rawCompId))) {
    loadedCompanyInfo = await CompanyInfo.findById(String(rawCompId)).lean();
  }
  if (!loadedCompanyInfo) {
    loadedCompanyInfo = await CompanyInfo.findOne({ user: String(effectiveUserId), isActive: true }).lean();
  }
  if (!loadedCompanyInfo) {
    loadedCompanyInfo = await CompanyInfo.findOne({ user: String(effectiveUserId) }).lean();
  }
  const effectiveCompanyId =
    loadedCompanyInfo?._id ||
    (rawCompId && mongoose.Types.ObjectId.isValid(String(rawCompId))
      ? new mongoose.Types.ObjectId(String(rawCompId))
      : null);

  const baseCaseFilter = {
    user: effectiveUserId,
    ...(effectiveCompanyId ? { companyId: effectiveCompanyId } : {}),
  };

  // Pre-chequeo rápido por sourceDriveFileId si ya fue procesado antes
  let preMatchedDriveCase = null;
  if (cleanDriveId) {
    preMatchedDriveCase = await InvestigacionAtelData.findOne({
      ...baseCaseFilter,
      'formData.sourceDriveFileId': cleanDriveId,
    }).lean();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 1 — Mapeo IA de los 23 campos reales de InvestigacionATEL.tsx + Cruce 360°
  // ═══════════════════════════════════════════════════════════════════════════
  let extractedText = normalizeText(rawDocumentText);
  const hasBuffer = Buffer.isBuffer(fileBuffer) && fileBuffer.length > 0;
  const isPdf =
    hasBuffer &&
    ((mimeType && mimeType.includes('pdf')) ||
      (cleanDriveFileName && cleanDriveFileName.toLowerCase().endsWith('.pdf')) ||
      (fileBuffer.length >= 4 && fileBuffer.slice(0, 4).toString() === '%PDF'));
  const isImage =
    hasBuffer &&
    ((mimeType && mimeType.startsWith('image/')) ||
      (cleanDriveFileName && /\.(png|jpe?g|webp|bmp|gif)$/i.test(cleanDriveFileName)));

  if (!extractedText && hasBuffer) {
    try {
      extractedText = await extractTextFromFile({
        buffer: fileBuffer,
        fileName: cleanDriveFileName,
        mimeType,
      });
    } catch (extErr) {
      logger.debug(`[InvestigacionAtelPipeline] Fallback multimodal en archivo "${cleanDriveFileName}": ${extErr.message}`);
    }
  }

  let aiMappedData = {};
  const needsAiMapping =
    !preMatchedDriveCase &&
    (Boolean(extractedText) ||
      isPdf ||
      isImage ||
      (inputFields &&
        Object.keys(inputFields).length > 0 &&
        (!inputFields.actividadMomento || !inputFields.naturalezaLesion || !inputFields.agenteCausal)));

  if (needsAiMapping) {
    try {
      const mappingPrompt = `Eres un asistente de Inteligencia Artificial experto en Seguridad y Salud en el Trabajo (SG-SST) en Colombia (Resolución 1401 de 2007).
Tu labor es transcribir, interpretar y mapear con máxima fidelidad técnica toda la información disponible del formulario FURAT (Formato Único de Reporte de Accidente de Trabajo) o reporte de accidente/incidente a los 23 campos exactos del aplicativo Investigación ATEL.
PROHIBIDO inventar nombres, cédulas o hechos inexistentes; extrae fielmente lo reportado.

CAMPOS A EXTRAER:
1. 'tipoEvento': Clasificar en 'Accidente Leve', 'Accidente Grave', 'Accidente Mortal' o 'Incidente'.
2. 'fechaEvento': Fecha exacta del evento en formato YYYY-MM-DD.
3. 'horaEvento': Hora del accidente en formato HH:MM (24 horas, ej: 08:30).
4. 'lugarEvento': Sitio o área exacta donde ocurrió el evento.
5. 'departamento' y 'municipio': Departamento y municipio donde ocurrió.
6. 'actividadMomento': Tarea u ocupación que desarrollaba en el instante del hecho.
7. 'afectadoNombre': Nombre completo del trabajador afectado.
8. 'afectadoCedula': Número de documento o cédula sin puntos ni letras.
9. 'afectadoCargo': Ocupación o cargo del trabajador.
10. 'afectadoEps': EPS reportada.
11. 'afectadoArl': ARL reportada.
12. 'tipoContrato': 'Indefinido', 'Fijo', 'Obra o labor', 'Aprendizaje', 'Prestación de servicios' o 'Temporal'.
13. 'jornadaLaboral': 'Diurna', 'Nocturna', 'Mixta' o 'Por turnos'.
14. 'experienciaLaboral': Tiempo de experiencia o fecha de ingreso reportada.
15. 'tiempoEnCargo': Tiempo laborado en el cargo o previo al accidente.
16. 'descripcionHechos': Relato completo e íntegro de los hechos (Sección IV del FURAT o descripción recibida). NUNCA lo dejes vacío si existe texto descriptivo.
17. 'naturalezaLesion': Opción exacta del enum (ej: 'Golpe / Contusión', 'Herida / Laceración', 'Fractura', 'Esguince / Torcedura', 'Quemadura', 'Sin lesión (Incidente)', 'Otra').
18. 'parteCuerpo': Zona anatómica afectada con detalle.
19. 'agenteCausal': Máquina, herramienta, superficie o agente causante del evento.
20. 'diasIncapacidad': Días de incapacidad reportados como texto numérico (ej: "0", "3", "15").
21. 'consecuencias': Consecuencias observadas, atención médica o daños.
22. 'equipoInvestigador': Lista con nombre, cedula y rol ('Jefe Inmediato / Supervisor', 'Encargado SST / HSEQ', 'Representante COPASST / Vigía') si aparecen en el documento.
23. 'testigos': Lista de personas que presenciaron el evento con nombre, cedula, cargo y testimonio si aparecen.`;

      const partialFieldsDigest =
        inputFields && Object.keys(inputFields).length > 0
          ? `\nDatos estructurados recibidos adicionalmente:\n${JSON.stringify(inputFields, null, 2)}`
          : '';

      let mappingPayload;
      if (isPdf || isImage) {
        const resolvedMime = isPdf ? 'application/pdf' : mimeType || 'image/jpeg';
        mappingPayload = [
          { text: `${mappingPrompt}${partialFieldsDigest}` },
          {
            inlineData: {
              mimeType: resolvedMime,
              data: fileBuffer.toString('base64'),
            },
          },
        ];
        if (extractedText && !extractedText.includes('Empty PDF')) {
          mappingPayload.push({ text: `Texto extraído de referencia:\n${extractedText}` });
        }
      } else {
        mappingPayload = `${mappingPrompt}${partialFieldsDigest}\n\nNombre del archivo: ${cleanDriveFileName || 'Reporte ATEL'}\n\nContenido del documento FURAT / Reporte:\n${extractedText || '(Sin texto adjunto, usa los datos estructurados recibidos)'}`;
      }

      const geminiMapRes = await generateWithKeyRotation(
        {
          model: resolvedModel,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: ATEL_STRUCTURED_RESPONSE_SCHEMA,
          },
        },
        effectiveUserId,
        mappingPayload,
      );
      const rawJsonText = extractGeminiResponseText(geminiMapRes);
      if (rawJsonText) {
        aiMappedData = cleanAndParseJson(rawJsonText) || {};
      }
    } catch (mapErr) {
      logger.warn(`[InvestigacionAtelPipeline] Aviso en mapeo IA estructurado: ${mapErr.message}`);
    }
  }

  const storedBaseForm = preMatchedDriveCase?.formData || {};
  const rawInput = inputFields || {};

  // Consolidar los 23 campos exactos de InvestigacionATEL.tsx
  const resolvedFechaEvento = normalizeDateYmd(
    normalizeText(rawInput.fechaEvento) ||
      normalizeText(rawInput.fecha_accidente) ||
      normalizeText(aiMappedData.fechaEvento) ||
      normalizeText(storedBaseForm.fechaEvento) ||
      normalizeText(storedBaseForm.fechaAccidente) ||
      new Date().toISOString().slice(0, 10),
  );

  const formData = {
    ...storedBaseForm,
    tipoEvento: mapTipoEventoLabel(
      normalizeText(rawInput.tipoEvento) ||
        normalizeText(aiMappedData.tipoEvento) ||
        normalizeText(storedBaseForm.tipoEvento) ||
        normalizeText(rawInput.tipo_evento),
      normalizeText(rawInput.gravedad),
    ),
    fechaEvento: resolvedFechaEvento,
    fechaAccidente: resolvedFechaEvento,
    horaEvento:
      normalizeText(rawInput.horaEvento) ||
      normalizeText(rawInput.hora_accidente) ||
      normalizeText(aiMappedData.horaEvento) ||
      normalizeText(storedBaseForm.horaEvento) ||
      '',
    lugarEvento:
      normalizeText(rawInput.lugarEvento) ||
      normalizeText(rawInput.lugar_accidente) ||
      normalizeText(aiMappedData.lugarEvento) ||
      normalizeText(storedBaseForm.lugarEvento) ||
      '',
    departamento:
      normalizeText(rawInput.departamento) ||
      normalizeText(aiMappedData.departamento) ||
      normalizeText(storedBaseForm.departamento) ||
      normalizeText(loadedCompanyInfo?.departamento) ||
      '',
    municipio:
      normalizeText(rawInput.municipio) ||
      normalizeText(aiMappedData.municipio) ||
      normalizeText(storedBaseForm.municipio) ||
      normalizeText(loadedCompanyInfo?.city) ||
      '',
    actividadMomento:
      normalizeText(rawInput.actividadMomento) ||
      normalizeText(rawInput.actividad_momento) ||
      normalizeText(aiMappedData.actividadMomento) ||
      normalizeText(storedBaseForm.actividadMomento) ||
      '',
    afectadoNombre:
      normalizeText(rawInput.afectadoNombre) ||
      normalizeText(aiMappedData.afectadoNombre) ||
      normalizeText(rawInput.nombre_o_cargo) ||
      normalizeText(storedBaseForm.afectadoNombre) ||
      '',
    afectadoCedula:
      normalizeDigits(rawInput.afectadoCedula) ||
      normalizeDigits(rawInput.cedula_trabajador) ||
      normalizeDigits(aiMappedData.afectadoCedula) ||
      normalizeDigits(storedBaseForm.afectadoCedula) ||
      (normalizeDigits(rawInput.nombre_o_cargo).length >= 5
        ? normalizeDigits(rawInput.nombre_o_cargo)
        : ''),
    afectadoCargo:
      normalizeText(rawInput.afectadoCargo) ||
      normalizeText(rawInput.cargo_trabajador) ||
      normalizeText(aiMappedData.afectadoCargo) ||
      normalizeText(storedBaseForm.afectadoCargo) ||
      '',
    afectadoEps:
      normalizeText(rawInput.afectadoEps) ||
      normalizeText(aiMappedData.afectadoEps) ||
      normalizeText(storedBaseForm.afectadoEps) ||
      '',
    afectadoArl:
      normalizeText(rawInput.afectadoArl) ||
      normalizeText(aiMappedData.afectadoArl) ||
      normalizeText(storedBaseForm.afectadoArl) ||
      normalizeText(loadedCompanyInfo?.arl) ||
      '',
    tipoContrato:
      normalizeText(rawInput.tipoContrato) ||
      normalizeText(aiMappedData.tipoContrato) ||
      normalizeText(storedBaseForm.tipoContrato) ||
      '',
    jornadaLaboral:
      normalizeText(rawInput.jornadaLaboral) ||
      normalizeText(aiMappedData.jornadaLaboral) ||
      normalizeText(storedBaseForm.jornadaLaboral) ||
      'Diurna',
    experienciaLaboral:
      normalizeText(rawInput.experienciaLaboral) ||
      normalizeText(aiMappedData.experienciaLaboral) ||
      normalizeText(storedBaseForm.experienciaLaboral) ||
      '',
    tiempoEnCargo:
      normalizeText(rawInput.tiempoEnCargo) ||
      normalizeText(aiMappedData.tiempoEnCargo) ||
      normalizeText(storedBaseForm.tiempoEnCargo) ||
      '',
    descripcionHechos:
      normalizeText(rawInput.descripcionHechos) ||
      normalizeText(aiMappedData.descripcionHechos) ||
      normalizeText(rawInput.descripcion_accidente) ||
      normalizeText(storedBaseForm.descripcionHechos) ||
      normalizeText(storedBaseForm.descripcionAccidente) ||
      (extractedText ? extractedText.slice(0, 3000) : ''),
    naturalezaLesion:
      normalizeText(rawInput.naturalezaLesion) ||
      normalizeText(rawInput.naturaleza_lesion) ||
      normalizeText(aiMappedData.naturalezaLesion) ||
      normalizeText(storedBaseForm.naturalezaLesion) ||
      'Otra',
    parteCuerpo:
      normalizeText(rawInput.parteCuerpo) ||
      normalizeText(rawInput.parte_cuerpo) ||
      normalizeText(aiMappedData.parteCuerpo) ||
      normalizeText(storedBaseForm.parteCuerpo) ||
      '',
    diasIncapacidad: String(
      rawInput.diasIncapacidad ??
        rawInput.dias_incapacidad ??
        aiMappedData.diasIncapacidad ??
        storedBaseForm.diasIncapacidad ??
        '0',
    ).trim() || '0',
    agenteCausal:
      normalizeText(rawInput.agenteCausal) ||
      normalizeText(rawInput.agente_causal) ||
      normalizeText(aiMappedData.agenteCausal) ||
      normalizeText(storedBaseForm.agenteCausal) ||
      '',
    consecuencias:
      normalizeText(rawInput.consecuencias) ||
      normalizeText(aiMappedData.consecuencias) ||
      normalizeText(rawInput.gravedad) ||
      normalizeText(storedBaseForm.consecuencias) ||
      '',
  };

  if (cleanDriveId) {
    formData.sourceDriveFileId = cleanDriveId;
  }
  if (cleanDriveFileName) {
    formData.sourceDriveFileName = cleanDriveFileName;
  }

  let equipoList = Array.isArray(rawInput.equipoInvestigador) && rawInput.equipoInvestigador.length > 0
    ? rawInput.equipoInvestigador
    : Array.isArray(aiMappedData.equipoInvestigador) && aiMappedData.equipoInvestigador.length > 0
      ? aiMappedData.equipoInvestigador
      : Array.isArray(preMatchedDriveCase?.equipoList)
        ? preMatchedDriveCase.equipoList
        : [];

  let testigosList = Array.isArray(rawInput.testigos) && rawInput.testigos.length > 0
    ? rawInput.testigos
    : Array.isArray(aiMappedData.testigos) && aiMappedData.testigos.length > 0
      ? aiMappedData.testigos
      : Array.isArray(preMatchedDriveCase?.testigosList)
        ? preMatchedDriveCase.testigosList
        : [];

  // Cruce 360° con SgsstWorker y PerfilSociodemograficoData
  try {
    const workerScopeFilter = effectiveCompanyId
      ? { companyId: effectiveCompanyId }
      : { user: effectiveUserId };
    let matchedWorker = null;
    if (formData.afectadoCedula) {
      matchedWorker = await SgsstWorker.findOne({
        ...workerScopeFilter,
        documento: { $regex: formData.afectadoCedula, $options: 'i' },
      }).lean();
    }
    if (!matchedWorker && formData.afectadoNombre) {
      const escapedName = formData.afectadoNombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchedWorker = await SgsstWorker.findOne({
        ...workerScopeFilter,
        nombre: { $regex: escapedName, $options: 'i' },
      }).lean();
    }

    let matchedSocio = null;
    if (PerfilSociodemograficoData) {
      const socioDoc = await PerfilSociodemograficoData.findOne(workerScopeFilter).lean();
      if (socioDoc && Array.isArray(socioDoc.trabajadores)) {
        matchedSocio = socioDoc.trabajadores.find((t) => {
          const tCed = normalizeDigits(t.identificacion || t.cedula || t.documento);
          if (formData.afectadoCedula && tCed && tCed === formData.afectadoCedula) {
            return true;
          }
          if (
            formData.afectadoNombre &&
            t.nombre &&
            String(t.nombre).trim().toLowerCase() === formData.afectadoNombre.toLowerCase()
          ) {
            return true;
          }
          return false;
        });
      }
    }

    if (matchedWorker || matchedSocio) {
      if (!formData.afectadoNombre) {
        formData.afectadoNombre = normalizeText(matchedWorker?.nombre || matchedSocio?.nombre);
      }
      if (!formData.afectadoCedula) {
        formData.afectadoCedula = normalizeDigits(
          matchedWorker?.documento || matchedSocio?.identificacion || matchedSocio?.cedula,
        );
      }
      if (!formData.afectadoCargo) {
        formData.afectadoCargo = normalizeText(matchedWorker?.cargo || matchedSocio?.cargo);
      }
      if (!formData.afectadoEps) {
        formData.afectadoEps = normalizeText(matchedWorker?.eps || matchedSocio?.eps);
      }
      if (!formData.afectadoArl) {
        formData.afectadoArl = normalizeText(matchedSocio?.arl || loadedCompanyInfo?.arl);
      }
      if (!formData.tipoContrato && matchedSocio?.tipoContrato) {
        formData.tipoContrato = normalizeText(matchedSocio.tipoContrato);
      }
      if (!formData.jornadaLaboral && matchedSocio?.jornadaLaboral) {
        formData.jornadaLaboral = normalizeText(matchedSocio.jornadaLaboral);
      }
      if (!formData.experienciaLaboral && matchedSocio?.antiguedadAnos !== undefined && matchedSocio?.antiguedadAnos !== '') {
        formData.experienciaLaboral = String(matchedSocio.antiguedadAnos);
      }
    }
  } catch (crossErr) {
    logger.warn(`[InvestigacionAtelPipeline] Aviso en cruce 360° de trabajador: ${crossErr.message}`);
  }

  // Enriquecer equipoList con CompanyInfo (Responsable SST / Representante Legal) y COPASST (SgsstCopasstComite)
  try {
    equipoList = (Array.isArray(equipoList) ? equipoList : []).filter(
      (e) => e && normalizeText(e.nombre),
    );

    const hasSstRole = equipoList.some((e) => /sst|hseq|seguridad/i.test(e.rol || ''));
    if (!hasSstRole && normalizeText(loadedCompanyInfo?.responsibleSST)) {
      equipoList.push({
        nombre: loadedCompanyInfo.responsibleSST.trim(),
        cedula: normalizeText(loadedCompanyInfo.licenseNumber)
          ? `Lic. SST ${loadedCompanyInfo.licenseNumber}`
          : '',
        rol: 'Encargado SST / HSEQ',
      });
    }

    const hasCopasstRole = equipoList.some((e) => /copasst|vig[ií]a/i.test(e.rol || ''));
    if (!hasCopasstRole && SgsstCopasstComite) {
      const copasstQuery = effectiveCompanyId
        ? { companyId: effectiveCompanyId }
        : { user: effectiveUserId };
      const comiteDoc = await SgsstCopasstComite.findOne(copasstQuery)
        .sort({ updatedAt: -1 })
        .lean();
      if (comiteDoc) {
        const repCandidate =
          (Array.isArray(comiteDoc.representantesTrabajadores) &&
            comiteDoc.representantesTrabajadores.find((m) => normalizeText(m?.nombre))) ||
          (Array.isArray(comiteDoc.representantesEmpleador) &&
            comiteDoc.representantesEmpleador.find((m) => normalizeText(m?.nombre))) ||
          (normalizeText(comiteDoc.vigia?.nombre) ? comiteDoc.vigia : null);

        if (repCandidate && normalizeText(repCandidate.nombre)) {
          equipoList.push({
            nombre: repCandidate.nombre.trim(),
            cedula: normalizeText(repCandidate.cedula),
            rol: 'Representante COPASST / Vigía',
          });
        }
      }
    }

    const hasSupervisorRole = equipoList.some((e) => /jefe|supervisor/i.test(e.rol || ''));
    if (!hasSupervisorRole && normalizeText(loadedCompanyInfo?.legalRepresentative)) {
      equipoList.push({
        nombre: loadedCompanyInfo.legalRepresentative.trim(),
        cedula: normalizeText(loadedCompanyInfo.legalRepresentativeId),
        rol: 'Jefe Inmediato / Supervisor',
      });
    }
  } catch (eqErr) {
    logger.warn(`[InvestigacionAtelPipeline] Aviso enriqueciendo equipoList con COPASST: ${eqErr.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 2 — Registro Idempotente en InvestigacionAtelData + ATELAnnualData + feedWorkerEvent
  // ═══════════════════════════════════════════════════════════════════════════
  let existingCase = preMatchedDriveCase;
  if (!existingCase) {
    const companyCases = await InvestigacionAtelData.find(baseCaseFilter)
      .sort({ updatedAt: -1 })
      .lean();
    existingCase = companyCases.find((c) => {
      const cf = c?.formData || {};
      if (cleanDriveId && cf.sourceDriveFileId && String(cf.sourceDriveFileId).trim() === cleanDriveId) {
        return true;
      }
      const cDate = normalizeDateYmd(cf.fechaEvento || cf.fechaAccidente);
      if (!cDate || cDate !== formData.fechaEvento) {
        return false;
      }
      const cCed = normalizeDigits(cf.afectadoCedula);
      if (formData.afectadoCedula && cCed && cCed === formData.afectadoCedula) {
        return true;
      }
      const cName = normalizeText(cf.afectadoNombre).toLowerCase();
      if (
        formData.afectadoNombre &&
        cName &&
        cName === formData.afectadoNombre.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }

  const alreadyProcessed = Boolean(existingCase);
  const caseId = existingCase?.id || crypto.randomUUID();

  // Preservar testimonios recibidos desde el Portal del Colaborador y metadatos previos del informe
  if (existingCase) {
    if (existingCase.formData?.reportConversationId && !formData.reportConversationId) {
      formData.reportConversationId = existingCase.formData.reportConversationId;
    }
    if (existingCase.formData?.reportMessageId && !formData.reportMessageId) {
      formData.reportMessageId = existingCase.formData.reportMessageId;
    }
    if (existingCase.formData?.reportTitle && !formData.reportTitle) {
      formData.reportTitle = existingCase.formData.reportTitle;
    }
    if (existingCase.formData?.sourceDriveFileId && !formData.sourceDriveFileId) {
      formData.sourceDriveFileId = existingCase.formData.sourceDriveFileId;
    }
    if (existingCase.formData?.sourceDriveFileName && !formData.sourceDriveFileName) {
      formData.sourceDriveFileName = existingCase.formData.sourceDriveFileName;
    }

    const storedWitnesses = Array.isArray(existingCase.testigosList)
      ? existingCase.testigosList
      : [];
    if (storedWitnesses.length > 0) {
      if (testigosList.length === 0) {
        testigosList = storedWitnesses;
      } else {
        testigosList = testigosList.map((t) => {
          const ced = normalizeDigits(t?.cedula || t?.identificacion);
          if (!ced) return t;
          const prev = storedWitnesses.find(
            (s) => normalizeDigits(s?.cedula || s?.identificacion) === ced,
          );
          if (prev?.estado === 'recibido' && !normalizeText(t?.testimonio)) {
            return {
              ...t,
              testimonio: prev.testimonio,
              estado: 'recibido',
              solicitudActiva: false,
              fechaTestimonio: prev.fechaTestimonio,
              foto1: prev.foto1 || null,
              foto2: prev.foto2 || null,
            };
          }
          return t;
        });
      }
    }
  }

  await InvestigacionAtelData.findOneAndUpdate(
    { user: effectiveUserId, companyId: effectiveCompanyId, id: caseId },
    {
      $set: {
        companyId: effectiveCompanyId,
        formData,
        equipoList,
        testigosList,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  // Actualizar ATELAnnualData (estadísticas mensuales sin duplicar evento)
  try {
    const ATELAnnualModel = getATELAnnualModel();
    if (ATELAnnualModel && formData.fechaEvento) {
      const ymdParts = formData.fechaEvento.split('-');
      const year = Number(ymdParts[0]) || new Date().getFullYear();
      const monthIdx = Math.max(0, Math.min(11, (Number(ymdParts[1]) || 1) - 1));
      const monthNames = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const monthKey = monthNames[monthIdx] || 'enero';
      const rawTipoInput = String(rawInput.tipo_evento || formData.tipoEvento || '').toLowerCase();
      const annualEventType = rawTipoInput.includes('enfermedad') || rawTipoInput === 'el'
        ? 'EL'
        : rawTipoInput.includes('ausentismo')
          ? 'Ausentismo'
          : 'AT';

      let atelDoc = await ATELAnnualModel.findOne({
        user: effectiveUserId,
        companyId: effectiveCompanyId,
        year,
      });
      if (!atelDoc) {
        atelDoc = new ATELAnnualModel({
          user: effectiveUserId,
          companyId: effectiveCompanyId,
          year,
          months: {},
        });
      }

      let monthsObj = atelDoc.months;
      if (monthsObj instanceof Map) {
        monthsObj = Object.fromEntries(monthsObj);
      } else if (!monthsObj || typeof monthsObj !== 'object') {
        monthsObj = {};
      }

      if (!monthsObj[monthKey]) {
        monthsObj[monthKey] = { numTrabajadores: '', diasProgramados: '', events: [] };
      }
      if (!Array.isArray(monthsObj[monthKey].events)) {
        monthsObj[monthKey].events = [];
      }

      const normCed = normalizeDigits(formData.afectadoCedula);
      const normName = normalizeText(formData.afectadoNombre).toLowerCase();
      const duplicateAnnual = monthsObj[monthKey].events.find((ev) => {
        if (ev.id && String(ev.id) === `event_${caseId}`) return true;
        if (String(ev.fecha || '') !== formData.fechaEvento) return false;
        const evCed = normalizeDigits(ev.colaborador?.cedula || ev.documento);
        const evName = normalizeText(ev.colaborador?.nombre || ev.documento).toLowerCase();
        if (normCed && evCed && normCed === evCed) return true;
        if (normName && evName && normName === evName) return true;
        return false;
      });

      if (!duplicateAnnual) {
        monthsObj[monthKey].events.push({
          id: `event_${caseId}`,
          fecha: formData.fechaEvento,
          tipo: annualEventType,
          causaInmediata:
            formData.descripcionHechos || 'Evento registrado desde Investigación ATEL',
          peligro: formData.agenteCausal || 'Riesgo Ocupacional',
          consecuencia: formData.naturalezaLesion || formData.tipoEvento || 'Leve',
          diasIncapacidad: Number(formData.diasIncapacidad) || 0,
          diasCargados: 0,
          parteCuerpo: formData.parteCuerpo || 'Cuerpo general',
          colaborador: {
            nombre: formData.afectadoNombre || 'Colaborador',
            cedula: formData.afectadoCedula || '',
            cargo: formData.afectadoCargo || '',
          },
        });
        atelDoc.months = monthsObj;
        atelDoc.markModified('months');
        atelDoc.updatedAt = new Date();
        await atelDoc.save();
      }
    }
  } catch (annualErr) {
    logger.warn(`[InvestigacionAtelPipeline] Aviso actualizando ATELAnnualData: ${annualErr.message}`);
  }

  // Alimentar Hoja de Vida Bio-Individual del trabajador (idempotente por referencia caseId)
  if (formData.afectadoCedula) {
    try {
      await feedWorkerEvent(
        effectiveUserId,
        formData.afectadoCedula,
        'atel',
        `${formData.tipoEvento || 'ATEL'} - ${formData.naturalezaLesion || ''}`.trim(),
        0,
        caseId,
        {
          companyId: effectiveCompanyId,
          nombre: formData.afectadoNombre || undefined,
          cargo: formData.afectadoCargo || undefined,
          eps: formData.afectadoEps || undefined,
          tipo: formData.tipoEvento || 'Accidente de Trabajo',
          parteCuerpo: formData.parteCuerpo || '',
          consecuencia: formData.naturalezaLesion || '',
          diasIncapacidad: Number(formData.diasIncapacidad) || 0,
        },
      );
    } catch (feedErr) {
      logger.warn(`[InvestigacionAtelPipeline] Aviso en feedWorkerEvent: ${feedErr.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 3 — Análisis IA Interno del Aplicativo (Res. 1401 de 2007) y Guardado en Historial
  // ═══════════════════════════════════════════════════════════════════════════
  let reportHtml = '';
  let reportConversationId = formData.reportConversationId || null;
  let reportMessageId = formData.reportMessageId || null;
  let reportTitle =
    formData.reportTitle ||
    `Investigación ATEL — ${formData.afectadoNombre || 'Evento'} (${formData.fechaEvento || ''})`;

  if (alreadyProcessed && reportConversationId && Message) {
    try {
      const existingMsg = await Message.findOne({ conversationId: reportConversationId })
        .sort({ createdAt: -1 })
        .lean();
      if (existingMsg && normalizeText(existingMsg.text)) {
        reportHtml = existingMsg.text;
        reportMessageId = existingMsg.messageId || reportMessageId;
      }
    } catch (msgErr) {
      logger.warn(`[InvestigacionAtelPipeline] Error consultando informe previo en Message: ${msgErr.message}`);
    }
  }

  if (generateOfficialReport !== false && !reportHtml && normalizeText(formData.descripcionHechos)) {
    const dateStr = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const companyInfoBlock = loadedCompanyInfo?.companyName
      ? buildCompanyContextString(loadedCompanyInfo)
      : '';

    const headerHtml = buildStandardHeader({
      title: `INFORME DE INVESTIGACIÓN DE ${String(formData.tipoEvento || 'EVENTO').toUpperCase()} LABORAL`,
      companyInfo: loadedCompanyInfo,
      date: dateStr,
      norm: 'Resolución 1401 de 2007 — Ministerio de Protección Social',
      responsibleName: req?.user?.name || loadedCompanyInfo?.responsibleSST,
    });

    const systemPromptText = buildRes1401MasterPrompt({
      formData,
      equipoList,
      testigosList,
      companyInfoBlock,
    });

    const genRes = await generateWithKeyRotation(
      {
        model: resolvedModel,
        generationConfig: { maxOutputTokens: 65536, temperature: 0.65 },
      },
      effectiveUserId,
      [systemPromptText],
    );

    const rawReportHtml = extractGeminiResponseText(genRes);
    let cleanedReport = rawReportHtml
      .replace(/```html/gi, '')
      .replace(/```/g, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .trim();

    const signaturesHtml = buildOfficialSignaturesHtml({
      loadedCompanyInfo,
      formData,
      equipoList,
      testigosList,
    });

    reportHtml = `${headerHtml}\n${cleanedReport}\n${signaturesHtml}`;
    reportTitle = `Investigación ATEL — ${formData.afectadoNombre || 'Evento'} (${formData.fechaEvento || ''})`;

    const persistReq =
      req && req.user
        ? req
        : {
            user: { id: String(effectiveUserId) },
            companyId: effectiveCompanyId ? String(effectiveCompanyId) : undefined,
            config: req?.config,
          };

    const persisted = await autoPersistGeneratedReport(persistReq, {
      htmlContent: reportHtml,
      title: reportTitle,
      tags: [
        'sgsst-investigacion-atel',
        ...(effectiveCompanyId
          ? [`company-${effectiveCompanyId}`, `company_${effectiveCompanyId}`]
          : []),
      ],
      model: resolvedModel,
    });

    if (persisted?.conversationId) {
      reportConversationId = persisted.conversationId;
      reportMessageId = persisted.messageId || null;
      reportTitle = persisted.title || reportTitle;

      formData.reportConversationId = reportConversationId;
      formData.reportMessageId = reportMessageId;
      formData.reportTitle = reportTitle;

      await InvestigacionAtelData.updateOne(
        { user: effectiveUserId, companyId: effectiveCompanyId, id: caseId },
        {
          $set: {
            'formData.reportConversationId': reportConversationId,
            'formData.reportMessageId': reportMessageId,
            'formData.reportTitle': reportTitle,
            updatedAt: new Date(),
          },
        },
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 4 — Extracción del Informe Oficial del Aplicativo para Continuar el Flujo
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryMarkdown = buildSummaryMarkdownFromPipeline({
    alreadyProcessed,
    caseId,
    formData,
    equipoList,
    reportConversationId,
    reportTitle,
    reportHtml,
  });

  const pipelineOutput = {
    exito: true,
    alreadyProcessed,
    caseId,
    formData,
    equipoList,
    testigosList,
    reportHtml,
    reportConversationId,
    reportMessageId,
    reportTitle,
    summaryMarkdown,
  };

  if (req && typeof req === 'object') {
    if (!Array.isArray(req._generatedAppReports)) {
      req._generatedAppReports = [];
    }
    const existingIdx = req._generatedAppReports.findIndex(
      (r) => r && r.caseId && String(r.caseId) === String(caseId),
    );
    const enrichedEntry = {
      ...pipelineOutput,
      appModule: 'investigacion_atel',
      generatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      req._generatedAppReports[existingIdx] = enrichedEntry;
    } else {
      req._generatedAppReports.push(enrichedEntry);
    }
  }

  return pipelineOutput;
}

module.exports = {
  runAtelAppInvestigationPipeline,
};
