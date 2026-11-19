const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const crypto = require('crypto');

const MAX_PARALLEL_SPECIALISTS = 4;
const DEFAULT_SPECIALIST_TIMEOUT_MS = 55000;
const TENSHI_AGENT_ID = '3579240c-ac93-4f4f-b0e4-95d87fc1ee27';
const INTERNAL_ROUTER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 WappyInternalRouter/2.0';
const REJECTED_MIDDLEWARE_ERROR_RE = /^illegal request(?:\s*:\s*endpoint mismatch)?$/i;

function isRejectedErrorText(text) {
  const trimmed = String(text || '').trim();
  return Boolean(trimmed && REJECTED_MIDDLEWARE_ERROR_RE.test(trimmed));
}

function extractHttpErrorMessage(rawBody) {
  const raw = String(rawBody || '').trim();
  if (!raw) return '';
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const msg =
        parsed?.message ||
        parsed?.error?.message ||
        (typeof parsed?.error === 'string' ? parsed.error : '') ||
        parsed?.text ||
        '';
      if (msg) return String(msg).trim().slice(0, 300);
    } catch (_e) {
      // Fallback a texto plano
    }
  }
  const sseDataMatch = raw.match(/data:\s*(\{[\s\S]*?\})(?:\r?\n|$)/);
  if (sseDataMatch) {
    try {
      const parsed = JSON.parse(sseDataMatch[1]);
      const msg =
        parsed?.message ||
        parsed?.error?.message ||
        (typeof parsed?.error === 'string' ? parsed.error : '') ||
        parsed?.text ||
        '';
      if (msg) return String(msg).trim().slice(0, 300);
    } catch (_e) {
      // Ignorar JSON parcial
    }
  }
  return raw.replace(/\s+/g, ' ').slice(0, 300);
}

function signInternalJwt(payload, secret, expiresInSeconds = 300) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn: `${expiresInSeconds}s` });
  } catch (_jwtLoadErr) {
    // Fallback estándar RFC 7519 HS256 (compatible con Node 25/26 donde SlowBuffer fue removido)
    if (!secret) {
      throw new Error('JWT_SECRET no configurado para firmar token interno.');
    }
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }),
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', String(secret))
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }
}

/**
 * Normaliza cadenas para emparejamiento robusto de especialistas:
 * reemplaza primero `[_/-]+` por espacio, pasa a minúsculas, quita tildes (NFD),
 * convierte `@` en `a` y elimina caracteres no alfanuméricos.
 * Ej: `psicologo_sst` -> "psicologo sst", `terapeuta_salud_mental` -> "terapeuta salud mental".
 */
function cleanString(str) {
  return String(str || '')
    .replace(/[_/-]+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/@/g, 'a')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapeo exacto de aliases hacia los 22 especialistas reales en MongoDB
 * (excluyendo siempre a `Tenshi` para impedir auto-enrutamiento).
 */
const ALIAS_MAP = {
  // Consultor SG-SST
  'consultor': 'Consultor SG-SST',
  'consultor sst': 'Consultor SG-SST',
  'consultor sg sst': 'Consultor SG-SST',
  'consultor senior sg sst': 'Consultor SG-SST',
  'asesor sst': 'Consultor SG-SST',
  'agente sst': 'Consultor SG-SST',

  // Abogado Laboral
  'abogado': 'Abogado Laboral',
  'abogada': 'Abogado Laboral',
  'abogado laboral': 'Abogado Laboral',
  'juridico': 'Abogado Laboral',
  'juridica': 'Abogado Laboral',
  'consultor juridico laboral': 'Abogado Laboral',
  'abogado rit': 'Abogado Laboral',
  'derecho laboral': 'Abogado Laboral',
  'procesos disciplinarios': 'Abogado Laboral',
  'acoso laboral': 'Abogado Laboral',
  'acoso sexual': 'Abogado Laboral',

  // Médico Laboral
  'medico': 'Médico Laboral',
  'medica': 'Médico Laboral',
  'medico laboral': 'Médico Laboral',
  'consultor medico ocupacional': 'Médico Laboral',
  'doctor': 'Médico Laboral',
  'doctora': 'Médico Laboral',
  'medicina laboral': 'Médico Laboral',
  'salud ocupacional': 'Médico Laboral',

  // Fisioterapeuta Laboral
  'fisioterapeuta': 'Fisioterapeuta Laboral',
  'fisio': 'Fisioterapeuta Laboral',
  'fisioterapeuta laboral': 'Fisioterapeuta Laboral',
  'ergonomo': 'Fisioterapeuta Laboral',
  'ergonomia': 'Fisioterapeuta Laboral',
  'biomecanica': 'Fisioterapeuta Laboral',
  'biomecanico': 'Fisioterapeuta Laboral',
  'especialista en biomecanica laboral': 'Fisioterapeuta Laboral',
  'analista ergonomico rosa': 'Fisioterapeuta Laboral',
  'rosa': 'Fisioterapeuta Laboral',
  'owas': 'Fisioterapeuta Laboral',
  'rula': 'Fisioterapeuta Laboral',
  'ept': 'Fisioterapeuta Laboral',
  'estudio de puesto': 'Fisioterapeuta Laboral',

  // Psicólogo SST
  'psicologo': 'Psicólogo SST',
  'psicologa': 'Psicólogo SST',
  'psicologo sst': 'Psicólogo SST',
  'psicologa sst': 'Psicólogo SST',
  'riesgo psicosocial': 'Psicólogo SST',
  'especialista en riesgo psicosocial': 'Psicólogo SST',
  'psicosocial': 'Psicólogo SST',
  'bateria psicosocial': 'Psicólogo SST',
  'clima laboral': 'Psicólogo SST',
  'estres laboral': 'Psicólogo SST',

  // Terapeuta en Salud Mental
  'terapeuta': 'Terapeuta en Salud Mental',
  'salud mental': 'Terapeuta en Salud Mental',
  'terapeuta salud mental': 'Terapeuta en Salud Mental',
  'terapeuta en salud mental': 'Terapeuta en Salud Mental',
  'consultor de bienestar y salud mental': 'Terapeuta en Salud Mental',
  'burnout': 'Terapeuta en Salud Mental',
  'bienestar emocional': 'Terapeuta en Salud Mental',
  'emocional': 'Terapeuta en Salud Mental',
  'ansiedad': 'Terapeuta en Salud Mental',
  'depresion': 'Terapeuta en Salud Mental',

  // Nutricionista Laboral
  'nutricionista': 'Nutricionista Laboral',
  'nutricion': 'Nutricionista Laboral',
  'nutricionista laboral': 'Nutricionista Laboral',
  'dieta': 'Nutricionista Laboral',
  'alimentacion': 'Nutricionista Laboral',

  // Primer Respondiente
  'primer respondiente': 'Primer Respondiente',
  'primeros auxilios': 'Primer Respondiente',
  'auxilios': 'Primer Respondiente',
  'rcp': 'Primer Respondiente',
  'botiquin': 'Primer Respondiente',

  // Coordinador de Emergencias
  'emergencias': 'Coordinador de Emergencias',
  'coordinador emergencias': 'Coordinador de Emergencias',
  'coordinador de emergencias': 'Coordinador de Emergencias',
  'brigada': 'Coordinador de Emergencias',
  'simulacro': 'Coordinador de Emergencias',
  'pae': 'Coordinador de Emergencias',
  'evacuacion': 'Coordinador de Emergencias',

  // Especialista en Bioseguridad
  'bioseguridad': 'Especialista en Bioseguridad',
  'biologico': 'Especialista en Bioseguridad',
  'riesgo biologico': 'Especialista en Bioseguridad',
  'especialista bioseguridad': 'Especialista en Bioseguridad',
  'pgirh': 'Especialista en Bioseguridad',

  // Ingeniero Electricista SST
  'electricista': 'Ingeniero Electricista SST',
  'ingeniero electricista': 'Ingeniero Electricista SST',
  'riesgo electrico': 'Ingeniero Electricista SST',
  'retie': 'Ingeniero Electricista SST',
  'loto': 'Ingeniero Electricista SST',
  'arco electrico': 'Ingeniero Electricista SST',

  // Ingeniero Químico SST
  'quimico': 'Ingeniero Químico SST',
  'ingeniero quimico': 'Ingeniero Químico SST',
  'riesgo quimico': 'Ingeniero Químico SST',
  'especialista en riesgo quimico': 'Ingeniero Químico SST',
  'sga': 'Ingeniero Químico SST',
  'fds': 'Ingeniero Químico SST',
  'hds': 'Ingeniero Químico SST',
  'sustancias quimicas': 'Ingeniero Químico SST',

  // Coordinador de Seguridad Vial
  'vial': 'Coordinador de Seguridad Vial',
  'seguridad vial': 'Coordinador de Seguridad Vial',
  'pesv': 'Coordinador de Seguridad Vial',
  'riesgo vial': 'Coordinador de Seguridad Vial',
  'especialista en riesgo vial': 'Coordinador de Seguridad Vial',
  'coordinador vial': 'Coordinador de Seguridad Vial',
  'coordinador seguridad vial': 'Coordinador de Seguridad Vial',
  'transito': 'Coordinador de Seguridad Vial',
  'vehiculos': 'Coordinador de Seguridad Vial',

  // Coordinador de Tareas Críticas
  'tareas criticas': 'Coordinador de Tareas Críticas',
  'alturas': 'Coordinador de Tareas Críticas',
  'trabajo en alturas': 'Coordinador de Tareas Críticas',
  'espacios confinados': 'Coordinador de Tareas Críticas',
  'trabajo en caliente': 'Coordinador de Tareas Críticas',
  'excavaciones': 'Coordinador de Tareas Críticas',
  'tsa': 'Coordinador de Tareas Críticas',
  'ats': 'Coordinador de Tareas Críticas',
  'permisos de trabajo': 'Coordinador de Tareas Críticas',

  // Ingeniero de Minas SST
  'minas': 'Ingeniero de Minas SST',
  'mineria': 'Ingeniero de Minas SST',
  'ingeniero de minas': 'Ingeniero de Minas SST',
  'tunel': 'Ingeniero de Minas SST',

  // Auditor SG-SST
  'auditor': 'Auditor SG-SST',
  'auditoria': 'Auditor SG-SST',
  'auditor sg sst': 'Auditor SG-SST',
  'auditor sst': 'Auditor SG-SST',
  'auditor integral sg sst': 'Auditor SG-SST',
  '0312': 'Auditor SG-SST',
  'estandares minimos': 'Auditor SG-SST',
  'phva': 'Auditor SG-SST',

  // Ingeniero Ambiental
  'ambiental': 'Ingeniero Ambiental',
  'ingeniero ambiental': 'Ingeniero Ambiental',
  'medio ambiente': 'Ingeniero Ambiental',
  'residuos': 'Ingeniero Ambiental',
  'ecologia': 'Ingeniero Ambiental',

  // Redactor Creativo
  'redactor': 'Redactor Creativo',
  'redactor creativo': 'Redactor Creativo',
  'blog': 'Redactor Creativo',
  'comunicaciones': 'Redactor Creativo',
  'copywriter': 'Redactor Creativo',

  // Profesional SST
  'profesional': 'Profesional SST',
  'profesional sst': 'Profesional SST',
  'hseq': 'Profesional SST',
  'inspector sst': 'Profesional SST',
  'coordinador sst': 'Profesional SST',

  // Coordinador de Capacitaciones
  'capacitaciones': 'Coordinador de Capacitaciones',
  'capacitacion': 'Coordinador de Capacitaciones',
  'coordinador capacitaciones': 'Coordinador de Capacitaciones',
  'asistente en capacitaciones': 'Coordinador de Capacitaciones',
  'pac': 'Coordinador de Capacitaciones',
  'induccion': 'Coordinador de Capacitaciones',
  'formacion': 'Coordinador de Capacitaciones',
  'academia': 'Coordinador de Capacitaciones',

  // Especialista en Riesgo Climático
  'climatico': 'Especialista en Riesgo Climático',
  'riesgo climatico': 'Especialista en Riesgo Climático',
  'estres termico': 'Especialista en Riesgo Climático',
  'radiacion uv': 'Especialista en Riesgo Climático',
  'clima': 'Especialista en Riesgo Climático',

  // Simulador de Accidentes SST
  'simulador': 'Simulador de Accidentes SST',
  'simulador accidentes': 'Simulador de Accidentes SST',
  'investigacion atel': 'Simulador de Accidentes SST',
  'asistente de investigacion de at': 'Simulador de Accidentes SST',
  'accidente': 'Simulador de Accidentes SST',
  'siniestro': 'Simulador de Accidentes SST',
  'causa raiz': 'Simulador de Accidentes SST',
};

const GENERIC_ALIAS_KEYS = new Set(['consultor', 'profesional']);

const SORTED_ALIAS_ENTRIES = Object.entries(ALIAS_MAP).sort((a, b) => b[0].length - a[0].length);

const GENERIC_STOPWORDS = new Set([
  'de',
  'en',
  'el',
  'la',
  'los',
  'las',
  'del',
  'y',
  'sst',
  'sg',
  'laboral',
  'especialista',
  'consultor',
  'coordinador',
  'ingeniero',
]);

function isTenshiAgent(agent) {
  if (!agent) return false;
  const cleaned = cleanString(agent.name);
  const rawId = String(agent.id || '').trim();
  if (rawId === TENSHI_AGENT_ID) return true;
  return cleaned === 'tenshi' || cleaned.startsWith('tenshi ');
}

/**
 * Resuelve un especialista contra los agentes reales en MongoDB excluyendo siempre a Tenshi.
 * Orden de resolución:
 * (0) Match exacto por `a.id` / `a._id`
 * (1) Match exacto por nombre normalizado
 * (2) `ALIAS_MAP` por llave exacta
 * (3) `ALIAS_MAP` por subcadena (priorizando la llave más larga, evitando falsos positivos de siglas)
 * (4) Puntuación por intersección de palabras significativas (ignorando stopwords genéricas si son la única coincidencia)
 */
function resolveSpecialistAgent(nombreEspecialista, agents) {
  const rawQuery = String(nombreEspecialista || '').trim();
  if (!rawQuery) return null;

  const eligibleAgents = (Array.isArray(agents) ? agents : []).filter((a) => a && !isTenshiAgent(a));
  if (eligibleAgents.length === 0) return null;

  const findByCanonicalName = (canonicalName) => {
    const cleanedTarget = cleanString(canonicalName);
    if (!cleanedTarget) return null;
    return eligibleAgents.find((a) => cleanString(a.name) === cleanedTarget) || null;
  };

  // (0) Match exacto por a.id (o a._id)
  const byId = eligibleAgents.find(
    (a) =>
      (a.id && String(a.id).trim() === rawQuery) ||
      (a._id && String(a._id).trim() === rawQuery),
  );
  if (byId) return byId;

  const queryStr = cleanString(rawQuery);
  if (!queryStr) return null;

  // (1) Match exacto por nombre normalizado
  const byExactName = eligibleAgents.find((a) => cleanString(a.name) === queryStr);
  if (byExactName) return byExactName;

  // (2) ALIAS_MAP por llave exacta
  if (Object.prototype.hasOwnProperty.call(ALIAS_MAP, queryStr)) {
    const byExactAlias = findByCanonicalName(ALIAS_MAP[queryStr]);
    if (byExactAlias) return byExactAlias;
  }

  // (3) ALIAS_MAP por subcadena (priorizando la llave más larga)
  // Primero coincidencia por límites de palabra en llaves específicas (evita falsos positivos con siglas de 3 letras como 'pac'/'ept')
  const paddedQuery = ` ${queryStr} `;
  let genericFallbackAgent = null;

  for (const [aliasKey, targetName] of SORTED_ALIAS_ENTRIES) {
    if (paddedQuery.includes(` ${aliasKey} `)) {
      const matched = findByCanonicalName(targetName);
      if (matched) {
        if (GENERIC_ALIAS_KEYS.has(aliasKey)) {
          if (!genericFallbackAgent) genericFallbackAgent = matched;
        } else {
          return matched;
        }
      }
    }
  }

  // Segundo pase de subcadena para llaves >= 4 caracteres (ej. raíces parciales o compuestos sin espacio)
  for (const [aliasKey, targetName] of SORTED_ALIAS_ENTRIES) {
    if (aliasKey.length < 4) continue;
    if (queryStr.includes(aliasKey)) {
      const matched = findByCanonicalName(targetName);
      if (matched) {
        if (GENERIC_ALIAS_KEYS.has(aliasKey)) {
          if (!genericFallbackAgent) genericFallbackAgent = matched;
        } else {
          return matched;
        }
      }
    }
  }

  if (genericFallbackAgent) {
    return genericFallbackAgent;
  }

  // (4) Puntuación por intersección de palabras significativas
  const queryWords = queryStr.split(' ').filter((w) => w.length >= 2);
  const significantQueryWords = queryWords.filter((w) => !GENERIC_STOPWORDS.has(w));
  if (significantQueryWords.length === 0) {
    return null;
  }

  let bestAgent = null;
  let bestScore = 0;

  for (const a of eligibleAgents) {
    const agName = cleanString(a.name);
    if (!agName) continue;
    const agWords = agName.split(' ').filter(Boolean);
    const significantAgWords = agWords.filter((w) => !GENERIC_STOPWORDS.has(w));

    let significantMatches = 0;
    let score = 0;

    for (const qw of significantQueryWords) {
      if (significantAgWords.includes(qw)) {
        significantMatches++;
        score += 3;
      } else if (
        qw.length >= 4 &&
        significantAgWords.some((aw) => aw.length >= 4 && (aw.includes(qw) || qw.includes(aw)))
      ) {
        significantMatches++;
        score += 2;
      }
    }

    // Si no hubo ninguna coincidencia de palabra significativa, ignorar (evita matches solo por 'sst'/'laboral'/'especialista')
    if (significantMatches === 0) continue;

    // Bonus menor por palabras genéricas adicionales cuando ya hay coincidencia significativa
    for (const qw of queryWords) {
      if (GENERIC_STOPWORDS.has(qw) && agWords.includes(qw)) {
        score += 0.5;
      }
    }

    if (agName.includes(queryStr) || queryStr.includes(agName)) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAgent = a;
    }
  }

  return bestAgent;
}

/**
 * Extrae texto limpio desde un mensaje de agente LibreChat/LangGraph, soportando:
 * - `msg.text` (string)
 * - `msg.content` como array de partes (`{ type: 'text', text: string | { value: string } }` o strings planos)
 * - `msg.content` como string
 */
function extractTextFromAgentMessage(msg) {
  if (!msg) return '';
  if (typeof msg === 'string') return msg;

  if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
    return msg.text;
  }

  if (Array.isArray(msg.content)) {
    let result = '';
    let hadNonTextBetween = false;

    for (const part of msg.content) {
      if (typeof part === 'string') {
        if (part) {
          if (hadNonTextBetween && result.length > 0 && !/\s$/.test(result) && !/^\s/.test(part)) {
            result += '\n\n';
          }
          result += part;
          hadNonTextBetween = false;
        }
        continue;
      }

      if (!part || typeof part !== 'object') continue;

      // Omitir bloques internos de pensamiento o llamadas de herramientas
      if (part.type && part.type !== 'text') {
        if (result.length > 0) hadNonTextBetween = true;
        continue;
      }

      let piece = '';
      if (typeof part.text === 'string') {
        piece = part.text;
      } else if (part.text && typeof part.text === 'object' && typeof part.text.value === 'string') {
        piece = part.text.value;
      } else if (typeof part.value === 'string') {
        piece = part.value;
      }

      if (piece) {
        if (hadNonTextBetween && result.length > 0 && !/\s$/.test(result) && !/^\s/.test(piece)) {
          result += '\n\n';
        }
        result += piece;
        hadNonTextBetween = false;
      }
    }

    if (result.trim().length > 0) {
      return result;
    }
  }

  if (typeof msg.content === 'string' && msg.content.trim().length > 0) {
    return msg.content;
  }

  return typeof msg.text === 'string' ? msg.text : '';
}

function getSpecialistIcon(agentName) {
  const cleaned = cleanString(agentName);
  if (/medico|fisioterapeuta|nutricionista|primer respondiente/.test(cleaned)) return '🩺';
  if (/abogado|juridico/.test(cleaned)) return '⚖️';
  if (/psicologo|terapeuta|salud mental/.test(cleaned)) return '🧠';
  if (/vial|pesv/.test(cleaned)) return '🚗';
  if (/quimico/.test(cleaned)) return '🧪';
  if (/electricista/.test(cleaned)) return '⚡';
  if (/emergencias/.test(cleaned)) return '🚒';
  if (/ambiental|climatico/.test(cleaned)) return '🌿';
  if (/capacitaciones/.test(cleaned)) return '🎓';
  if (/redactor/.test(cleaned)) return '✍️';
  if (/simulador|minas/.test(cleaned)) return '🔍';
  return '🛡️';
}

function formatParallelMarkdown(results, totalDurationMs) {
  const total = results.length;
  const succeededCount = results.filter((r) => r.ok).length;
  const failedCount = total - succeededCount;
  const totalSec = (totalDurationMs / 1000).toFixed(1);

  const lines = [
    `### 🤝 Mesa Técnica Multi-Agente en Paralelo (${succeededCount}/${total} especialistas respondieron en ${totalSec}s)`,
    '',
  ];

  for (const r of results) {
    const icon = getSpecialistIcon(r.agentName || r.requestedName);
    const durSec = ((r.durationMs || 0) / 1000).toFixed(1);
    if (r.ok) {
      lines.push(`#### ${icon} ${r.agentName} (${durSec}s)`);
      lines.push(r.response);
      lines.push('');
    } else {
      lines.push(`#### ⚠️ ${r.agentName || r.requestedName} — No disponible (${durSec}s)`);
      lines.push(`> ${r.error || 'No se pudo obtener respuesta del especialista.'}`);
      lines.push('');
    }
  }

  const timingSummary = results
    .map((r) => `${r.agentName || r.requestedName}: ${((r.durationMs || 0) / 1000).toFixed(1)}s${r.ok ? '' : ' (fallo)'}`)
    .join(' | ');
  lines.push('---');
  lines.push(
    `*Resumen de ejecución paralela: ${succeededCount} exitosos, ${failedCount} fallidos · Tiempo total en paralelo: ${totalSec}s (${timingSummary}).*`,
  );

  return lines.join('\n').trim();
}

function extractDeltaText(dataObj) {
  if (!dataObj || typeof dataObj !== 'object') return '';
  if (dataObj.event === 'on_message_delta') {
    const deltaContent = dataObj.data?.delta?.content;
    if (Array.isArray(deltaContent)) {
      let chunk = '';
      for (const c of deltaContent) {
        if (typeof c === 'string') {
          chunk += c;
        } else if (c && typeof c === 'object' && (!c.type || c.type === 'text')) {
          if (typeof c.text === 'string') {
            chunk += c.text;
          } else if (c.text && typeof c.text === 'object' && typeof c.text.value === 'string') {
            chunk += c.text.value;
          } else if (typeof c.value === 'string') {
            chunk += c.value;
          }
        }
      }
      return chunk;
    }
    if (typeof deltaContent === 'string') {
      return deltaContent;
    }
    if (typeof dataObj.data?.delta?.text === 'string') {
      return dataObj.data.delta.text;
    }
  }
  return '';
}

function processSseLine(line, state) {
  const trimmed = String(line || '').trim();
  if (!trimmed) {
    state.lastEvent = '';
    return;
  }
  if (trimmed.startsWith('event:')) {
    state.lastEvent = trimmed.replace(/^event:\s*/, '').trim().toLowerCase();
    return;
  }
  if (!trimmed.startsWith('data:')) return;

  const dataStr = trimmed.replace(/^data:\s*/, '').trim();
  const currentEvent = state.lastEvent || '';
  state.lastEvent = '';
  if (!dataStr || dataStr === '[DONE]') return;

  try {
    const dataObj = JSON.parse(dataStr);

    // 0. Eventos de error SSE (`event: error` de handleError / uaParser / validateEndpoint / validateModel) o `error: true`
    if (currentEvent === 'error' || dataObj.error === true) {
      const errText =
        (typeof dataObj === 'string' && dataObj) ||
        (typeof dataObj.message === 'string' && dataObj.message) ||
        (typeof dataObj.text === 'string' && dataObj.text) ||
        (typeof dataObj.error === 'string' && dataObj.error) ||
        extractTextFromAgentMessage(dataObj.responseMessage) ||
        'Error interno del servidor de agentes.';
      state.sseError = String(errText).trim();
      return;
    }

    // 1. Respuesta final estructurada
    if (dataObj.final) {
      const fromResponseMsg = extractTextFromAgentMessage(dataObj.responseMessage);
      const fromMsg = fromResponseMsg || extractTextFromAgentMessage(dataObj.message);
      const fromRoot = fromMsg || extractTextFromAgentMessage(dataObj);
      if (fromRoot && fromRoot.trim().length > 0) {
        state.finalResponseText = fromRoot;
      }
    }

    // 2. Deltas incrementales (LangGraph / agentes LibreChat)
    const deltaChunk = extractDeltaText(dataObj);
    if (deltaChunk) {
      state.accumulatedDeltas += deltaChunk;
    } else if (typeof dataObj.text === 'string' && dataObj.text.length > state.accumulatedDeltas.length) {
      // 3. Fallback streams progresivos con campo `text`
      state.accumulatedDeltas = dataObj.text;
    } else if (!state.finalResponseText && (dataObj.responseMessage || dataObj.message)) {
      const candidate =
        extractTextFromAgentMessage(dataObj.responseMessage) ||
        extractTextFromAgentMessage(dataObj.message);
      if (candidate && candidate.trim().length > 0) {
        state.fallbackMessageText = candidate;
      }
    }
  } catch (_e) {
    if (currentEvent === 'error') {
      state.sseError = dataStr.replace(/^"|"$/g, '').trim();
    }
    // Ignorar chunks JSON truncados o líneas de control SSE no-JSON
  }
}

class ConsultarAgenteEspecializado extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'consultar_agente_especializado';
    this.description =
      'Herramienta de enrutamiento: Utiliza esta herramienta SÓLO para delegar una consulta a un Agente Especialista del sistema cuando el usuario hace preguntas o solicitudes técnicas que salen de tu jurisdicción inicial. Debes pasar siempre el nombre exacto del especialista y la instrucción explícita del usuario.';
    this.req = fields.req;

    this.schema = z.object({
      nombre_especialista: z
        .string()
        .describe(
          'El nombre exacto del Agente Especialista al cual deseas consultar, deducido según tu análisis de la solicitud.',
        ),
      consulta_completa: z
        .string()
        .describe(
          'La consulta íntegra y detallada proporcionada por el usuario original, que el especialista deberá responder.',
        ),
    });
  }

  /**
   * Consulta interna estructurada y ultra-confiable a un único Agente Especialista vía loopback local.
   */
  async callSingleSpecialistStructured(input = {}, opts = {}) {
    const startedAt = Date.now();
    const requestedName = String(input?.nombre_especialista || input?.agente || '').trim();
    const question = String(input?.consulta_completa || input?.pregunta || '').trim();

    try {
      const rawUser = this.req?.user;
      const userId = rawUser ? String(rawUser.id || rawUser._id || '') : '';
      if (!userId) {
        return {
          ok: false,
          requestedName,
          agentName: requestedName,
          agentId: null,
          question,
          response: '',
          error: 'Error: Usuario no autenticado para invocar agentes.',
          durationMs: Date.now() - startedAt,
        };
      }

      if (!requestedName || !question) {
        return {
          ok: false,
          requestedName,
          agentName: requestedName,
          agentId: null,
          question,
          response: '',
          error: 'Error: Debes especificar tanto el nombre del especialista como la consulta completa.',
          durationMs: Date.now() - startedAt,
        };
      }

      let agents = Array.isArray(opts.agents) ? opts.agents : null;
      if (!agents) {
        const Agent = mongoose.models.Agent;
        if (!Agent) {
          return {
            ok: false,
            requestedName,
            agentName: requestedName,
            agentId: null,
            question,
            response: '',
            error: 'Error: No se pudo cargar el modelo de Agentes del sistema central.',
            durationMs: Date.now() - startedAt,
          };
        }
        agents = await Agent.find({});
      }

      if (!agents || agents.length === 0) {
        return {
          ok: false,
          requestedName,
          agentName: requestedName,
          agentId: null,
          question,
          response: '',
          error: 'Error: No hay especialistas registrados en el sistema central.',
          durationMs: Date.now() - startedAt,
        };
      }

      const agent = resolveSpecialistAgent(requestedName, agents);
      if (!agent) {
        const validos = agents
          .filter((a) => a && !isTenshiAgent(a))
          .map((a) => a.name)
          .filter(Boolean)
          .join(', ');
        return {
          ok: false,
          requestedName,
          agentName: requestedName,
          agentId: null,
          question,
          response: '',
          error: `No se encontró ningún Agente Especialista que coincida con "${requestedName}". Se sugiere utilizar un especialista de la siguiente lista de válidos en el sistema: [${validos}]. Asegúrate de usar uno de estos nombres textualmente.`,
          durationMs: Date.now() - startedAt,
        };
      }

      const agentId = agent.id || (agent._id ? String(agent._id) : null);

      // Generar token JWT derivado del req actual para invocar el endpoint interno por loopback
      const token =
        opts.token ||
        signInternalJwt({ id: userId }, process.env.JWT_SECRET, 300);

      console.log(`[RouterTool] Derivando consulta a: ${agent.name} (${agentId})`);

      // Detección de necesidad normativa o técnica ocupacional
      const hasNormativeSubject =
        /\b(norma|normativa|normatividad|decreto|resoluci[oó]n|ley|circular|art[ií]culo|c[oó]digo|est[aá]ndar|smlmv|uvt|jurisprudencia|sentencia|legal|requisito|cumplimiento|accidente|incapacidad|fuero|acoso|pesv|alturas|confinad|qu[ií]mic|retie|ergonom|m[eé]dic|sgsst|sg-sst|reglamento|dotaci[oó]n|epp|copasst|ccl|comit[eé]|brigada|evacuaci[oó]n|psicosocial|burnout|bater[ií]a)\b/i.test(
          question,
        );

      let enrichedText = question;
      if (hasNormativeSubject && !/web_search|b[uú]squeda\s+web/i.test(question)) {
        enrichedText = `${question}\n\n[DIRECTIVA MANDATORIA DE VIGENCIA NORMATIVA]: Esta consulta técnica involucra normatividad o cumplimiento legal en Colombia. Es ESTRICTAMENTE OBLIGATORIO que uses tu herramienta 'web_search' en tu primer turno para verificar en tiempo real la normatividad colombiana VIGENTE aplicable (comprueba posibles derogatorias, modificaciones o sentencias recientes). Está TERMINANTEMENTE PROHIBIDO citar normas derogadas o desactualizadas (ej: Res 1409/2012 para alturas derogada por Res 4272/2021; Res 1111/2017 derogada por Res 0312/2019; Res 2346/2007 reemplazada por Res 1843/2025; reformas recientes). Cita las normas vigentes confirmadas.`;
      }

      const agentTools = Array.from(
        new Set([...(Array.isArray(agent.tools) ? agent.tools : []), 'web_search', 'somos_sst']),
      );

      const payload = {
        endpoint: 'agents',
        conversationId: 'new',
        messageId: crypto.randomUUID(),
        text: enrichedText,
        agent_id: agentId,
        ephemeralAgent: {
          tools: agentTools,
        },
      };

      // Usar SIEMPRE loopback local primero (evita tráfico externo / TLS / Cloudflare hacia DOMAIN_SERVER)
      const baseUrl =
        opts.baseUrl || `http://127.0.0.1:${process.env.PORT || 3080}`;
      const timeoutMs =
        Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : DEFAULT_SPECIALIST_TIMEOUT_MS;
      const fetchImpl = opts.fetchImpl || global.fetch;

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/agents/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': INTERNAL_ROUTER_USER_AGENT,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeoutHandle);
        const isTimeout =
          fetchErr?.name === 'AbortError' ||
          /aborted|timeout/i.test(String(fetchErr?.message || ''));
        return {
          ok: false,
          requestedName,
          agentName: agent.name,
          agentId,
          question,
          response: '',
          error: isTimeout
            ? `Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s) esperando respuesta del especialista ${agent.name}.`
            : `Error de conexión interna con el especialista ${agent.name}: ${fetchErr.message}`,
          durationMs: Date.now() - startedAt,
        };
      }

      try {
        if (!response.ok) {
          let rawErrBody = '';
          try {
            rawErrBody =
              typeof response.text === 'function'
                ? await response.text()
                : typeof response.json === 'function'
                  ? JSON.stringify(await response.json())
                  : '';
          } catch (_readErr) {
            rawErrBody = '';
          }
          const httpErrDetail = extractHttpErrorMessage(rawErrBody);
          return {
            ok: false,
            requestedName,
            agentName: agent.name,
            agentId,
            question,
            response: '',
            error: `Error interno conectando con el especialista ${agent.name} (HTTP ${response.status}${httpErrDetail ? `: ${httpErrDetail}` : ''}).`,
            durationMs: Date.now() - startedAt,
          };
        }

        const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
        let resolvedText = '';
        let sseError = '';
        let rawDebugStream = '';

        // Caso 1: Respuesta JSON directa (no SSE) o sin ReadableStream
        if (
          contentType.includes('application/json') ||
          !response.body ||
          typeof response.body.getReader !== 'function'
        ) {
          const rawText =
            typeof response.text === 'function'
              ? await response.text()
              : typeof response.json === 'function'
                ? JSON.stringify(await response.json())
                : '';
          rawDebugStream = rawText;

          if (rawText.trim().startsWith('{')) {
            try {
              const jsonObj = JSON.parse(rawText);
              if (
                jsonObj.error === true ||
                (typeof jsonObj.error === 'string' && !jsonObj.responseMessage)
              ) {
                sseError = extractHttpErrorMessage(rawText);
              } else {
                resolvedText =
                  extractTextFromAgentMessage(jsonObj.responseMessage) ||
                  extractTextFromAgentMessage(jsonObj.message) ||
                  extractTextFromAgentMessage(jsonObj);
              }
            } catch (_e) {
              resolvedText = '';
            }
          } else if (rawText.includes('data:')) {
            const state = {
              finalResponseText: '',
              accumulatedDeltas: '',
              fallbackMessageText: '',
              lastEvent: '',
              sseError: '',
            };
            for (const line of rawText.split('\n')) {
              processSseLine(line, state);
            }
            sseError = state.sseError;
            resolvedText =
              state.finalResponseText || state.accumulatedDeltas || state.fallbackMessageText || '';
          }
        } else {
          // Caso 2: Stream SSE estándar de /api/agents/chat
          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          const state = {
            finalResponseText: '',
            accumulatedDeltas: '',
            fallbackMessageText: '',
            lastEvent: '',
            sseError: '',
          };
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const partialChunk = decoder.decode(value, { stream: true });
            rawDebugStream += partialChunk;

            buffer += partialChunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              processSseLine(line, state);
            }
          }

          // Vaciar bytes pendientes del decoder y la última línea en buffer
          const remaining = decoder.decode();
          if (remaining) {
            rawDebugStream += remaining;
            buffer += remaining;
          }
          if (buffer.trim()) {
            for (const line of buffer.split('\n')) {
              processSseLine(line, state);
            }
          }

          sseError = state.sseError;
          resolvedText =
            state.finalResponseText || state.accumulatedDeltas || state.fallbackMessageText || '';

          // Fallback si el servidor devolvió JSON plano sin header application/json
          if (!resolvedText.trim() && !sseError && rawDebugStream.trim().startsWith('{')) {
            try {
              const jsonFallback = JSON.parse(rawDebugStream.trim());
              if (
                jsonFallback.error === true ||
                (typeof jsonFallback.error === 'string' && !jsonFallback.responseMessage)
              ) {
                sseError = extractHttpErrorMessage(rawDebugStream.trim());
              } else {
                resolvedText =
                  extractTextFromAgentMessage(jsonFallback.responseMessage) ||
                  extractTextFromAgentMessage(jsonFallback.message) ||
                  extractTextFromAgentMessage(jsonFallback);
              }
            } catch (_e) {
              // ignore
            }
          }
        }

        const cleanResponse = String(resolvedText || '').trim();
        const cleanSseError = String(sseError || '').trim();

        // Rechazar explícitamente errores de middleware (`Illegal request`, `Illegal request: Endpoint mismatch`) o eventos SSE `event: error`
        if (cleanSseError && !cleanResponse) {
          return {
            ok: false,
            requestedName,
            agentName: agent.name,
            agentId,
            question,
            response: '',
            error: `El servidor interno rechazó la consulta al especialista ${agent.name}: ${cleanSseError}`,
            durationMs: Date.now() - startedAt,
          };
        }

        if (isRejectedErrorText(cleanResponse) || isRejectedErrorText(cleanSseError)) {
          const rejectedReason = isRejectedErrorText(cleanResponse) ? cleanResponse : cleanSseError;
          return {
            ok: false,
            requestedName,
            agentName: agent.name,
            agentId,
            question,
            response: '',
            error: `El servidor interno rechazó la consulta al especialista ${agent.name} (${rejectedReason}).`,
            durationMs: Date.now() - startedAt,
          };
        }

        if (cleanResponse.length > 0) {
          return {
            ok: true,
            requestedName,
            agentName: agent.name,
            agentId,
            question,
            response: cleanResponse,
            durationMs: Date.now() - startedAt,
          };
        }

        const safeDebug =
          rawDebugStream.length > 500
            ? `${rawDebugStream.substring(0, 500)}...`
            : rawDebugStream;
        return {
          ok: false,
          requestedName,
          agentName: agent.name,
          agentId,
          question,
          response: '',
          error: `El especialista ${agent.name} procesó la solicitud pero no generó respuesta legible (texto vacío).${safeDebug ? ` Dump: ${safeDebug}` : ''}`,
          durationMs: Date.now() - startedAt,
        };
      } finally {
        clearTimeout(timeoutHandle);
      }
    } catch (error) {
      const isTimeout =
        error?.name === 'AbortError' || /aborted|timeout/i.test(String(error?.message || ''));
      console.error('[ConsultarAgenteEspecializado Tool] Error:', error);
      return {
        ok: false,
        requestedName,
        agentName: requestedName,
        agentId: null,
        question,
        response: '',
        error: isTimeout
          ? `Tiempo de espera agotado consultando al especialista ${requestedName}.`
          : `Hubo un error de orquestación al contactar al especialista: ${error.message}`,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  /**
   * Motor paralelo multi-agente (`Promise.allSettled`):
   * Ejecuta simultáneamente hasta 4 especialistas distintos, deduplica pares repetidos,
   * tolera fallos parciales y entrega un dictamen consolidado con métricas de tiempo.
   */
  async executeParallelSpecialists(consultas = [], opts = {}) {
    const batchStartedAt = Date.now();
    const hardCap = Math.min(
      MAX_PARALLEL_SPECIALISTS,
      Math.max(1, Number(opts.maxParallel) || MAX_PARALLEL_SPECIALISTS),
    );
    const onSpecialistUpdate =
      typeof opts.onSpecialistUpdate === 'function' ? opts.onSpecialistUpdate : null;
    const safeUpdate = (payload) => {
      if (!onSpecialistUpdate) return;
      try {
        onSpecialistUpdate(payload);
      } catch (_err) {
        // Nunca romper la ejecución paralela por un error del callback observador
      }
    };

    // Cargar catálogo de agentes una sola vez para deduplicación canónica y todo el lote paralelo
    let sharedAgents = Array.isArray(opts.agents) ? opts.agents : null;
    if (!sharedAgents && mongoose.models.Agent) {
      try {
        sharedAgents = await mongoose.models.Agent.find({});
      } catch (_dbErr) {
        sharedAgents = null;
      }
    }

    const rawList = Array.isArray(consultas) ? consultas : [];
    const seenKeys = new Set();
    const normalizedConsultas = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue;
      const nombre_especialista = String(item.nombre_especialista || item.agente || '').trim();
      const consulta_completa = String(item.consulta_completa || item.pregunta || '').trim();
      if (!nombre_especialista || !consulta_completa) continue;

      const previewAgent = sharedAgents
        ? resolveSpecialistAgent(nombre_especialista, sharedAgents)
        : null;
      const canonicalKeyName = cleanString(previewAgent?.name || nombre_especialista);
      const dedupeKey = `${canonicalKeyName}::${cleanString(consulta_completa)}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      normalizedConsultas.push({ nombre_especialista, consulta_completa });
      if (normalizedConsultas.length >= hardCap) break;
    }

    if (normalizedConsultas.length === 0) {
      return {
        ok: false,
        total: 0,
        succeededCount: 0,
        failedCount: 0,
        totalDurationMs: Date.now() - batchStartedAt,
        results: [],
        formattedMarkdown:
          '❌ No se recibieron consultas válidas para ejecutar en paralelo. Debes indicar `nombre_especialista` y `consulta_completa` para cada especialista.',
      };
    }

    const total = normalizedConsultas.length;

    const settled = await Promise.allSettled(
      normalizedConsultas.map(async (item, index) => {
        const previewAgent = sharedAgents
          ? resolveSpecialistAgent(item.nombre_especialista, sharedAgents)
          : null;
        const previewName = previewAgent?.name || item.nombre_especialista;

        safeUpdate({
          index,
          total,
          requestedName: item.nombre_especialista,
          agentName: previewName,
          status: 'running',
          durationMs: 0,
        });

        const res = await this.callSingleSpecialistStructured(item, {
          ...opts,
          agents: sharedAgents || opts.agents,
        });

        safeUpdate({
          index,
          total,
          requestedName: res.requestedName,
          agentName: res.agentName,
          status: res.ok ? 'completed' : 'failed',
          durationMs: res.durationMs,
          ...(res.error ? { error: res.error } : {}),
        });

        return res;
      }),
    );

    const results = settled.map((entry, index) => {
      if (entry.status === 'fulfilled' && entry.value) {
        return entry.value;
      }
      const item = normalizedConsultas[index];
      const errMsg = entry.reason?.message || 'Error inesperado ejecutando especialista en paralelo.';
      const failedRes = {
        ok: false,
        requestedName: item.nombre_especialista,
        agentName: item.nombre_especialista,
        agentId: null,
        question: item.consulta_completa,
        response: '',
        error: errMsg,
        durationMs: Date.now() - batchStartedAt,
      };
      safeUpdate({
        index,
        total,
        requestedName: failedRes.requestedName,
        agentName: failedRes.agentName,
        status: 'failed',
        durationMs: failedRes.durationMs,
        error: failedRes.error,
      });
      return failedRes;
    });

    const succeededCount = results.filter((r) => r.ok).length;
    const failedCount = results.length - succeededCount;
    const totalDurationMs = Date.now() - batchStartedAt;

    return {
      ok: succeededCount >= 1,
      total: results.length,
      succeededCount,
      failedCount,
      totalDurationMs,
      results,
      formattedMarkdown: formatParallelMarkdown(results, totalDurationMs),
    };
  }

  /**
   * Interfaz LangChain retrocompatible al 100% usando `callSingleSpecialistStructured`.
   */
  async _call(input) {
    const res = await this.callSingleSpecialistStructured(input);
    if (res.ok) {
      return `✅ [Respuesta de Especialista ${res.agentName}]:\n${res.response}`;
    }
    return `❌ ${res.error || 'No se pudo completar la consulta con el especialista.'}`;
  }
}

ConsultarAgenteEspecializado.resolveSpecialistAgent = resolveSpecialistAgent;
ConsultarAgenteEspecializado.extractTextFromAgentMessage = extractTextFromAgentMessage;
ConsultarAgenteEspecializado.cleanString = cleanString;
ConsultarAgenteEspecializado.ALIAS_MAP = ALIAS_MAP;
ConsultarAgenteEspecializado.MAX_PARALLEL_SPECIALISTS = MAX_PARALLEL_SPECIALISTS;
ConsultarAgenteEspecializado.INTERNAL_ROUTER_USER_AGENT = INTERNAL_ROUTER_USER_AGENT;
ConsultarAgenteEspecializado.isRejectedErrorText = isRejectedErrorText;

module.exports = ConsultarAgenteEspecializado;
