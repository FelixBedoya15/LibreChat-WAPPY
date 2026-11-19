'use strict';

const ALLOWED_TENSHI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-4-hydrogen',
];

const CORE_ALWAYS_ACTIVE_TOOLS = [
  'wappy_navegar',
  'leer_pantalla',
  'operar_interfaz_visual',
  'wappy_diligenciar_formulario',
  'wappy_controlar_videollamada',
  'wappy_iniciar_estudio_ergonomico_vivo',
  'wappy_abrir_chat_agente',
  'wappy_buscar_historial_instantaneo',
  'gestionar_memoria',
  'wappy_memoria_procedimental',
  'wappy_renderizar_widget_interactivo',
  'seleccionar_empresa',
  'wappy_activar_empresa',
  'wappy_actualizar_empresa',
  'wappy_consultar_empresas',
  'wappy_consultar_detalle_empresa',
  'wappy_enviar_correo',
  'wappy_gestionar_agenda',
];

const ADMIN_ONLY_TOOLS = ['wappy_consultar_metricas_admin', 'wappy_admin_sistema'];

const POPOVER_ENABLED_TOOLS_MAP = {
  web_search: ['web_search'],
  file_search: ['file_search'],
  web_scraper_live: ['web_scraper_live'],
  somos_sst: [
    'somos_sst',
    'wappy_resumen_general_360',
    'wappy_mcp_sst',
    'wappy_crear_informe',
    'wappy_leer_informe_aplicativo',
    'wappy_consultar_trabajadores',
    'wappy_registrar_trabajador',
    'wappy_actualizar_trabajador',
    'wappy_retirar_trabajador',
    'wappy_reintegrar_trabajador',
    'wappy_ejecutar_accion_usuario',
    'wappy_activar_herramienta_agente',
  ],
  matriz_ipevar: ['matriz_ipevar'],
  matriz_pesv: ['matriz_pesv'],
  matriz_compatibilidad: ['matriz_compatibilidad'],
  consultar_analitica_psicosocial: ['consultar_analitica_psicosocial'],
  consultar_analitica_actos_condiciones: ['consultar_analitica_actos_condiciones'],
  wappy_investigar_trabajador_360: ['wappy_investigar_trabajador_360'],
  forensic_audit: ['forensic_audit'],
  canvas: ['canvas_tool'],
  canvas_tool: ['canvas_tool'],
  editor_live: ['editor_live'],
  editor_rit: ['editor_rit'],
  blog_editor: ['blog_editor', 'wappy_consultar_blog', 'wappy_leer_articulo_blog', 'wappy_abrir_articulo_blog'],
  consultar_agente_especializado: [
    'consultar_agente_especializado',
    'consultar_multiples_especialistas_paralelo',
    'wappy_crear_agente',
    'wappy_actualizar_agente',
    'wappy_eliminar_agente',
    'wappy_consultar_agentes_y_automatizaciones',
  ],
  gestor_automatizaciones: ['gestor_automatizaciones'],
  academia_marketplace_qr: [
    'wappy_generar_qr',
    'wappy_consultar_marketplace',
    'wappy_consultar_cursos',
    'wappy_abrir_curso',
    'wappy_leer_curso',
    'wappy_consultar_blog',
    'wappy_abrir_articulo_blog',
    'wappy_leer_articulo_blog',
  ],
  api_pubchem: ['wappy_consultar_quimico_pubchem'],
  api_medlineplus: ['wappy_consultar_rehabilitacion_medlineplus'],
  api_clima_viento: ['wappy_consultar_clima_viento'],
  api_emergencias_osm: ['wappy_geocodificar_emergencias'],
  calculator: ['calculator'],
};

const CONNECTOR_TOOL_MAP = {
  antigravity: ['wappy_delegar_orden_antigravity'],
  notebooklm: ['notebooklm_listar_cuadernos', 'notebooklm_consultar', 'notebooklm_generar_studio'],
  google_flow: ['google_flow_generar_imagen', 'google_flow_generar_video'],
  google_drive: [
    'google_drive',
    'wappy_importar_sociodemografico_drive',
    'wappy_importar_hito1_drive',
  ],
  google_gmail: ['google_gmail'],
  google_calendar: ['google_calendar'],
  google_docs: ['google_docs'],
  google_sheets: ['google_sheets'],
  google_slides: ['google_slides'],
  onedrive: ['onedrive'],
};

function sanitizeRequestedTenshiModel(requestedModel) {
  if (typeof requestedModel !== 'string') return null;
  const clean = requestedModel.replace(/^models\//i, '').trim();
  return ALLOWED_TENSHI_MODELS.includes(clean) ? clean : null;
}

function buildTenshiModelFallbacks(requestedModel, envModelsRaw = '') {
  const envModels = String(envModelsRaw || '')
    .split(',')
    .map((m) => m.trim().replace(/^models\//i, ''))
    .filter(
      (m) =>
        m &&
        ALLOWED_TENSHI_MODELS.includes(m) &&
        !m.includes('live') &&
        !m.includes('native-audio') &&
        !m.includes('transcribe') &&
        !m.includes('tts'),
    );

  const explicitModel = sanitizeRequestedTenshiModel(requestedModel);
  const defaultOrder = [
    'gemini-3.5-flash-lite',
    ...envModels.filter((m) => m !== 'gemini-3.5-flash-lite'),
    ...ALLOWED_TENSHI_MODELS,
  ];

  const ordered = explicitModel
    ? [explicitModel, ...defaultOrder.filter((m) => m !== explicitModel)]
    : defaultOrder;

  return {
    explicitModel,
    modelFallbacks: [...new Set(ordered)].filter((m) => ALLOWED_TENSHI_MODELS.includes(m)),
  };
}

function buildTenshiGenerationConfig(
  modelName,
  { hasTools = true, temperature = 0.7, maxOutputTokens = 65536 } = {},
) {
  const cleanModel = String(modelName || '').replace(/^models\//i, '').trim().toLowerCase();
  const cfg = {
    temperature,
    maxOutputTokens,
  };

  if (/^gemini-[34]|hydrogen/i.test(cleanModel)) {
    const isLite = cleanModel === 'gemini-3.5-flash-lite';
    cfg.thinkingConfig = {
      thinkingLevel: isLite && hasTools ? 'MINIMAL' : 'LOW',
    };
  }

  return cfg;
}

function deduplicateFunctionDeclarations(declarations = []) {
  const seen = new Set();
  const out = [];
  for (const decl of declarations) {
    if (!decl || typeof decl !== 'object' || !decl.name) continue;
    const key = String(decl.name).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(decl);
  }
  return out;
}

function normalizeConnectorsObject(connectors) {
  if (!connectors || typeof connectors !== 'object' || Array.isArray(connectors)) {
    return null;
  }
  const normalized = {};
  for (const [k, v] of Object.entries(connectors)) {
    const cleanKey = k === 'one_drive' ? 'onedrive' : String(k).trim();
    normalized[cleanKey] = Boolean(v);
  }
  return normalized;
}

function selectTenshiTools({
  declarationRegistry = {},
  baseDeclarations = [],
  dynamicToolsMap = {},
  activeTools = [],
  enabledTools = undefined,
  connectors = undefined,
  isAdminUser = false,
  isInlineWidgetIntent = false,
  lastUserLower = '',
  forceGestorAuto = false,
} = {}) {
  const normConnectors = normalizeConnectorsObject(connectors);
  let selected = [];

  if (Array.isArray(enabledTools)) {
    // Explicit session mode (Popover 1 + Connectors)
    const allowedNames = new Set(CORE_ALWAYS_ACTIVE_TOOLS);
    if (isAdminUser) {
      for (const adminTool of ADMIN_ONLY_TOOLS) {
        allowedNames.add(adminTool);
      }
    }

    for (const rawToggle of enabledTools) {
      const key = String(rawToggle || '').trim();
      if (!key) continue;
      const mapped = POPOVER_ENABLED_TOOLS_MAP[key];
      if (Array.isArray(mapped)) {
        for (const n of mapped) allowedNames.add(n);
      } else if (declarationRegistry[key]) {
        allowedNames.add(key);
      }
    }

    if (normConnectors) {
      for (const [connKey, toolNames] of Object.entries(CONNECTOR_TOOL_MAP)) {
        if (normConnectors[connKey] === true) {
          for (const n of toolNames) allowedNames.add(n);
        }
      }
    }

    // Avoid sending both wappy_consultar_analitica_* and consultar_analitica_* duplicates
    if (allowedNames.has('consultar_analitica_psicosocial')) {
      allowedNames.delete('wappy_consultar_analitica_psicosocial');
    }
    if (allowedNames.has('consultar_analitica_actos_condiciones')) {
      allowedNames.delete('wappy_consultar_analitica_actos_condiciones');
    }

    for (const name of allowedNames) {
      const decl = declarationRegistry[name];
      if (decl) selected.push(decl);
    }
  } else {
    // Legacy / Voice compatible mode
    selected = [...baseDeclarations];
    if (isAdminUser) {
      for (const adminTool of ADMIN_ONLY_TOOLS) {
        if (declarationRegistry[adminTool]) selected.push(declarationRegistry[adminTool]);
      }
    }
    for (const toolName of activeTools || []) {
      const decl = dynamicToolsMap[toolName] || declarationRegistry[toolName];
      if (decl) selected.push(decl);
    }
    if (forceGestorAuto && declarationRegistry.gestor_automatizaciones) {
      selected.push(declarationRegistry.gestor_automatizaciones);
    }

    // Respect explicitly disabled connectors even in legacy mode
    if (normConnectors) {
      const blockedByConnector = new Set();
      for (const [connKey, toolNames] of Object.entries(CONNECTOR_TOOL_MAP)) {
        if (normConnectors[connKey] === false) {
          for (const n of toolNames) blockedByConnector.add(n);
        }
      }
      if (blockedByConnector.size > 0) {
        selected = selected.filter((d) => d && !blockedByConnector.has(d.name));
      }
    }

    // Never keep both wappy_consultar_analitica_psicosocial AND consultar_analitica_psicosocial duplicated semantically
    const hasCanonicalPsico = selected.some((d) => d?.name === 'consultar_analitica_psicosocial');
    if (hasCanonicalPsico) {
      selected = selected.filter((d) => d?.name !== 'wappy_consultar_analitica_psicosocial');
    }
    const hasCanonicalActos = selected.some((d) => d?.name === 'consultar_analitica_actos_condiciones');
    if (hasCanonicalActos) {
      selected = selected.filter((d) => d?.name !== 'wappy_consultar_analitica_actos_condiciones');
    }
  }

  if (
    isInlineWidgetIntent &&
    !String(lastUserLower || '').includes('canvas') &&
    !String(lastUserLower || '').includes('lienzo')
  ) {
    selected = selected.filter((t) => t?.name !== 'canvas_tool');
  }

  return deduplicateFunctionDeclarations(selected);
}

function normalizeNotebookEntry(entry, cachedById = new Map()) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const id = entry.trim();
    if (!id) return null;
    const cached = cachedById.get(id);
    return {
      id,
      title: cached?.title || id,
      emoji: cached?.emoji || '📓',
    };
  }
  if (typeof entry === 'object') {
    const id = String(entry.id || entry.notebook_id || '').trim();
    const cached = id ? cachedById.get(id) : null;
    const title = String(entry.title || entry.name || cached?.title || id || '').trim();
    const emoji = String(entry.emoji || cached?.emoji || '📓').trim() || '📓';
    if (!id && !title) return null;
    return { id, title, emoji };
  }
  return null;
}

function resolveSelectedNotebooks({ bodySelectedNotebooks, nbSess, connectors } = {}) {
  const normConnectors = normalizeConnectorsObject(connectors);
  if (normConnectors && normConnectors.notebooklm === false) {
    return [];
  }

  const cachedList = Array.isArray(nbSess?.cachedNotebooks) ? nbSess.cachedNotebooks : [];
  const cachedById = new Map();
  for (const nb of cachedList) {
    const id = String(nb?.id || nb?.notebook_id || '').trim();
    if (id) {
      cachedById.set(id, {
        id,
        title: String(nb?.title || nb?.name || '').trim(),
        emoji: String(nb?.emoji || '📓').trim() || '📓',
      });
    }
  }

  const rawSource =
    Array.isArray(bodySelectedNotebooks) && bodySelectedNotebooks.length > 0
      ? bodySelectedNotebooks
      : Array.isArray(nbSess?.agentNotebooks?.tenshi) && nbSess.agentNotebooks.tenshi.length > 0
        ? nbSess.agentNotebooks.tenshi
        : [];

  const seen = new Set();
  const normalized = [];
  for (const item of rawSource) {
    const entry = normalizeNotebookEntry(item, cachedById);
    if (!entry) continue;
    const dedupKey = (entry.id || entry.title).toLowerCase();
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    normalized.push(entry);
  }
  return normalized;
}

function buildNotebookLmPromptBlock({ nbSess, selectedNotebooks = [], connectors } = {}) {
  const normConnectors = normalizeConnectorsObject(connectors);
  if (normConnectors && normConnectors.notebooklm === false) {
    return '';
  }

  const hasSession = Boolean(nbSess && Array.isArray(nbSess.cookies) && nbSess.cookies.length > 0);
  if (!hasSession && selectedNotebooks.length === 0) {
    return '';
  }

  if (selectedNotebooks.length > 0) {
    const nbLines = selectedNotebooks
      .map((nb) => `  * ${nb.emoji || '📓'} "${nb.title || nb.id}" (ID: \`${nb.id || nb.title}\`)`)
      .join('\n');
    return (
      `### 📓 SEGUNDO CEREBRO (GOOGLE NOTEBOOKLM) — CUADERNOS ACTIVOS EN ESTA SESIÓN:\n` +
      `- El usuario ha vinculado explícitamente los siguientes cuadernos de Google NotebookLM como tu **Segundo Cerebro** para esta sesión (${selectedNotebooks.length}):\n` +
      `${nbLines}\n` +
      `- REGLA ESTRICTA DE CONSULTA: Cuando invoques \`notebooklm_consultar\`, \`notebooklm_generar_studio\` o \`notebooklm_listar_cuadernos\`, consulta **ESTRICTAMENTE** estos cuadernos seleccionados pasando su ID exacto (\`${selectedNotebooks[0].id || selectedNotebooks[0].title}\` por defecto si el usuario no nombra otro de esta lista). Fundamenta tus respuestas con las fuentes documentales contenidas en ellos.\n\n`
    );
  }

  const cachedNbs = Array.isArray(nbSess?.cachedNotebooks) ? nbSess.cachedNotebooks : [];
  let block = `### 📓 [ACCESO TOTAL DE TENSHI A GOOGLE NOTEBOOKLM (SEGUNDO CEREBRO)]:\n`;
  block += `- Como Tenshi (Orquestadora Universal), tienes acceso TOTAL e irrestricto a TODOS los cuadernos de Google NotebookLM del usuario (usando \`notebooklm_listar_cuadernos\`, \`notebooklm_consultar\` y \`notebooklm_generar_studio\`).\n`;
  if (cachedNbs.length > 0) {
    block +=
      `- Cuadernos disponibles en su cuenta (${cachedNbs.length}):\n` +
      cachedNbs
        .map(
          (nb) =>
            `  * ${nb.emoji || '📓'} "${nb.title}" (ID: \`${nb.id}\`, ${nb.sources_count || 0} fuentes)`,
        )
        .join('\n') +
      '\n\n';
  } else {
    block += `- Cuenta vinculada activa (${nbSess?.email || 'Google NotebookLM'}). Si el usuario pregunta por sus cuadernos, invoca \`notebooklm_listar_cuadernos\`.\n\n`;
  }
  return block;
}

function generateSmartTenshiTitle(rawText = '', attachments = []) {
  let clean = String(rawText || '')
    .replace(/\[RESULTADO_GUI\][\s\S]*/i, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[*_`#>~|[\]()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean && Array.isArray(attachments) && attachments.length > 0) {
    const firstName = String(attachments[0]?.name || '').trim();
    clean = firstName ? `Análisis: ${firstName}` : 'Consulta con archivo adjunto';
  }

  if (!clean) {
    return 'Nuevo chat';
  }

  // Capitalize first character
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);

  if (clean.length <= 55) {
    return clean;
  }

  const sliced = clean.slice(0, 54);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace >= 24 ? sliced.slice(0, lastSpace) : sliced;
  return `${cut.replace(/[,:;.!?-]+$/, '').trim()}…`;
}

function buildCompanyScopeFilter(userIds = [], companyIdStr = null) {
  const cleanUserIds = [...new Set((userIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  if (companyIdStr) {
    return {
      user: { $in: cleanUserIds },
      companyId: String(companyIdStr),
    };
  }
  return {
    user: { $in: cleanUserIds },
    $or: [{ companyId: null }, { companyId: { $exists: false } }],
  };
}

async function ensureLegacyTenshiConversation({
  TenshiConversation,
  TenshiMessage,
  userIds,
  ownerUserId,
  companyIdStr,
}) {
  const companyScope = buildCompanyScopeFilter(userIds, companyIdStr);
  const legacyMsgQuery = {
    $and: [
      companyScope,
      { $or: [{ conversationId: null }, { conversationId: { $exists: false } }, { conversationId: '' }] },
    ],
  };

  const legacyCount = await TenshiMessage.countDocuments(legacyMsgQuery);
  if (!legacyCount || legacyCount <= 0) {
    return null;
  }

  let legacyConvo = await TenshiConversation.findOne({
    $and: [companyScope, { isLegacyDefault: true }],
  });

  const latestLegacy = await TenshiMessage.findOne(legacyMsgQuery)
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  if (!legacyConvo) {
    legacyConvo = await TenshiConversation.create({
      user: ownerUserId,
      companyId: companyIdStr || null,
      title: 'Chat Principal',
      lastMessageAt: latestLegacy?.createdAt || new Date(),
      messageCount: legacyCount,
      isLegacyDefault: true,
    });
  }

  const legacyConvoId = String(legacyConvo._id);
  await TenshiMessage.updateMany(legacyMsgQuery, {
    $set: { conversationId: legacyConvoId },
  });

  const totalCount = await TenshiMessage.countDocuments({
    $and: [companyScope, { conversationId: legacyConvoId }],
  });
  const latestMsg = await TenshiMessage.findOne({
    $and: [companyScope, { conversationId: legacyConvoId }],
  })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  await TenshiConversation.updateOne(
    { _id: legacyConvo._id },
    {
      $set: {
        messageCount: totalCount,
        lastMessageAt: latestMsg?.createdAt || legacyConvo.lastMessageAt || new Date(),
      },
    },
  );

  legacyConvo.messageCount = totalCount;
  if (latestMsg?.createdAt) {
    legacyConvo.lastMessageAt = latestMsg.createdAt;
  }
  return legacyConvo;
}

// ---------------------------------------------------------------------------
// Safe recursive-descent arithmetic evaluator (zero eval / zero Function)
// ---------------------------------------------------------------------------
const SAFE_MATH_FUNCS = {
  abs: Math.abs,
  sqrt: Math.sqrt,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  log: Math.log,
  log10: Math.log10,
  exp: Math.exp,
};

const SAFE_MATH_CONSTS = {
  pi: Math.PI,
  e: Math.E,
};

function tokenizeMathExpression(expr) {
  const s = String(expr || '').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').trim();
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let dotCount = 0;
      while (i < s.length && /[0-9.]/.test(s[i])) {
        if (s[i] === '.') dotCount++;
        if (dotCount > 1) throw new Error(`Número inválido en expresión: "${numStr}."`);
        numStr += s[i++];
      }
      if (i < s.length && (s[i] === 'e' || s[i] === 'E')) {
        numStr += s[i++];
        if (i < s.length && (s[i] === '+' || s[i] === '-')) numStr += s[i++];
        while (i < s.length && /[0-9]/.test(s[i])) numStr += s[i++];
      }
      const val = Number(numStr);
      if (!Number.isFinite(val)) throw new Error(`Número fuera de rango: "${numStr}"`);
      tokens.push({ type: 'number', value: val });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) ident += s[i++];
      tokens.push({ type: 'ident', value: ident.toLowerCase() });
      continue;
    }
    if (ch === '*' && s[i + 1] === '*') {
      tokens.push({ type: 'op', value: '^' });
      i += 2;
      continue;
    }
    if ('+-*/^%();'.includes(ch)) {
      tokens.push({ type: ch === '(' || ch === ')' || ch === ';' ? ch : 'op', value: ch });
      i++;
      continue;
    }
    throw new Error(`Carácter no permitido en calculadora segura: "${ch}"`);
  }
  return tokens;
}

function evaluateSafeArithmeticExpression(expr, extraVars = {}) {
  const tokens = tokenizeMathExpression(expr);
  if (tokens.length === 0) {
    throw new Error('La expresión matemática está vacía.');
  }

  const varMap = { ...SAFE_MATH_CONSTS };
  if (extraVars && typeof extraVars === 'object') {
    for (const [k, v] of Object.entries(extraVars)) {
      const n = Number(v);
      if (Number.isFinite(n)) {
        varMap[String(k).toLowerCase()] = n;
      }
    }
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpression() {
    let left = parseTerm();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parsePower();
    while (
      peek()?.type === 'op' &&
      (peek().value === '*' || peek().value === '/' || peek().value === '%')
    ) {
      const op = consume().value;
      const right = parsePower();
      if ((op === '/' || op === '%') && right === 0) {
        throw new Error('División por cero.');
      }
      left = op === '*' ? left * right : op === '/' ? left / right : left % right;
    }
    return left;
  }

  function parsePower() {
    let base = parseUnary();
    if (peek()?.type === 'op' && peek().value === '^') {
      consume();
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary() {
    if (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const val = parseUnary();
      return op === '-' ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Fin inesperado de la expresión matemática.');

    if (tok.type === 'number') {
      consume();
      return tok.value;
    }

    if (tok.type === 'ident') {
      consume();
      if (peek()?.type === '(') {
        const fn = SAFE_MATH_FUNCS[tok.value];
        if (!fn) throw new Error(`Función matemática no permitida: "${tok.value}"`);
        consume(); // '('
        const args = [];
        if (peek()?.type !== ')') {
          args.push(parseExpression());
          while (peek()?.type === ';') {
            consume();
            args.push(parseExpression());
          }
        }
        if (peek()?.type !== ')') {
          throw new Error(`Falta paréntesis de cierre en "${tok.value}(...)"`);
        }
        consume(); // ')'
        return fn(...args);
      }
      if (Object.prototype.hasOwnProperty.call(varMap, tok.value)) {
        return varMap[tok.value];
      }
      throw new Error(`Variable desconocida en expresión: "${tok.value}"`);
    }

    if (tok.type === '(') {
      consume();
      const val = parseExpression();
      if (peek()?.type !== ')') {
        throw new Error('Paréntesis sin cerrar en la expresión.');
      }
      consume();
      return val;
    }

    throw new Error(`Token inesperado: "${tok.value}"`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Tokens sobrantes en la expresión a partir de "${tokens[pos].value}"`);
  }
  if (!Number.isFinite(result)) {
    throw new Error('El resultado matemático no es un número finito.');
  }
  return result;
}

function roundTo(n, decimals = 4) {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(n) + Number.EPSILON) * factor) / factor;
}

function evaluateSafeSstCalculator(args = {}) {
  const formulaRaw = String(args.formula_sst || args.formula || '').trim().toLowerCase();
  const exprRaw = String(args.expresion || args.expression || '').trim();
  const vars = args.variables && typeof args.variables === 'object' ? args.variables : args;

  const num = (...keys) => {
    for (const k of keys) {
      if (vars[k] !== undefined && vars[k] !== null && vars[k] !== '') {
        const v = Number(vars[k]);
        if (Number.isFinite(v)) return v;
      }
    }
    return NaN;
  };

  if (formulaRaw) {
    if (formulaRaw === 'if' || formulaRaw === 'indice_frecuencia' || formulaRaw === 'frecuencia') {
      const at = num('accidentes', 'at', 'numero_accidentes', 'n_at');
      const hht = num('hht', 'horas_hombre_trabajadas');
      const k = Number.isFinite(num('constante', 'k')) ? num('constante', 'k') : 240000;
      if (!Number.isFinite(at) || !Number.isFinite(hht) || hht <= 0) {
        return { error: 'Para calcular IF se requieren "accidentes" (AT) y "hht" > 0.' };
      }
      const val = (at * k) / hht;
      return {
        ok: true,
        formula: 'IF = (Número de AT × K) / HHT',
        normativa: 'Res. 0312 de 2019 Art. 30 / NTC 3701 (K = 240.000)',
        variables: { accidentes: at, hht, constante: k },
        resultado: roundTo(val, 4),
        interpretacion: `Se presentaron ${roundTo(val, 2)} accidentes de trabajo por cada ${k.toLocaleString('es-CO')} horas hombre trabajadas.`,
      };
    }

    if (formulaRaw === 'is' || formulaRaw === 'indice_severidad' || formulaRaw === 'severidad') {
      const dp = num('dias_perdidos', 'dp', 'dias_incapacidad') || 0;
      const dc = num('dias_cargados', 'dc') || 0;
      const hht = num('hht', 'horas_hombre_trabajadas');
      const k = Number.isFinite(num('constante', 'k')) ? num('constante', 'k') : 240000;
      if (!Number.isFinite(hht) || hht <= 0) {
        return { error: 'Para calcular IS se requieren "dias_perdidos" (y opcional "dias_cargados") y "hht" > 0.' };
      }
      const val = ((dp + dc) * k) / hht;
      return {
        ok: true,
        formula: 'IS = ((Días Perdidos + Días Cargados) × K) / HHT',
        normativa: 'Res. 0312 de 2019 Art. 30 / NTC 3701 (K = 240.000)',
        variables: { dias_perdidos: dp, dias_cargados: dc, hht, constante: k },
        resultado: roundTo(val, 4),
        interpretacion: `Se perdieron/cargaron ${roundTo(val, 2)} días por cada ${k.toLocaleString('es-CO')} horas hombre trabajadas.`,
      };
    }

    if (formulaRaw === 'ili' || formulaRaw === 'lesiones_incapacitantes') {
      let ifVal = num('if', 'indice_frecuencia');
      let isVal = num('is', 'indice_severidad');
      if (!Number.isFinite(ifVal) || !Number.isFinite(isVal)) {
        const at = num('accidentes', 'at');
        const dp = num('dias_perdidos', 'dp') || 0;
        const dc = num('dias_cargados', 'dc') || 0;
        const hht = num('hht', 'horas_hombre_trabajadas');
        const k = Number.isFinite(num('constante', 'k')) ? num('constante', 'k') : 240000;
        if (Number.isFinite(at) && Number.isFinite(hht) && hht > 0) {
          ifVal = (at * k) / hht;
          isVal = ((dp + dc) * k) / hht;
        }
      }
      if (!Number.isFinite(ifVal) || !Number.isFinite(isVal)) {
        return { error: 'Para calcular ILI se requieren "if" y "is" (o "accidentes", "dias_perdidos" y "hht").' };
      }
      const val = (ifVal * isVal) / 1000;
      return {
        ok: true,
        formula: 'ILI = (IF × IS) / 1000',
        normativa: 'NTC 3701 — Índice de Lesiones Incapacitantes',
        variables: { if: roundTo(ifVal, 4), is: roundTo(isVal, 4) },
        resultado: roundTo(val, 4),
      };
    }

    if (
      formulaRaw === 'tasa_accidentalidad' ||
      formulaRaw === 'frecuencia_0312' ||
      formulaRaw === 'accidentalidad'
    ) {
      const at = num('accidentes', 'at', 'numero_accidentes');
      const trab = num('trabajadores', 'numero_trabajadores', 'n_trabajadores');
      if (!Number.isFinite(at) || !Number.isFinite(trab) || trab <= 0) {
        return { error: 'Se requieren "accidentes" y "trabajadores" > 0.' };
      }
      const val = (at / trab) * 100;
      return {
        ok: true,
        formula: 'Frecuencia AT (Res. 0312) = (Número de AT / Número de trabajadores) × 100',
        normativa: 'Resolución 0312 de 2019 Art. 30',
        variables: { accidentes: at, trabajadores: trab },
        resultado: roundTo(val, 4),
        unidad: '% (AT por cada 100 trabajadores)',
      };
    }

    if (formulaRaw === 'porcentaje_0312' || formulaRaw === 'cumplimiento_0312' || formulaRaw === 'res_0312') {
      const cumplidos = num('estandares_cumplidos', 'puntaje_obtenido', 'obtenido');
      const totales = Number.isFinite(num('estandares_totales', 'puntaje_maximo', 'total'))
        ? num('estandares_totales', 'puntaje_maximo', 'total')
        : 100;
      if (!Number.isFinite(cumplidos) || totales <= 0) {
        return { error: 'Se requieren "puntaje_obtenido"/"estandares_cumplidos" y "puntaje_maximo"/"estandares_totales" > 0.' };
      }
      const pct = (cumplidos / totales) * 100;
      const valoracion =
        pct < 60
          ? 'CRÍTICO (< 60%) — Plan de Mejoramiento inmediato ante MinTrabajo y seguimiento trimestral ARL'
          : pct <= 85
            ? 'MODERADAMENTE ACEPTABLE (60% – 85%) — Plan de Mejoramiento con seguimiento semestral'
            : 'ACEPTABLE (> 85%) — Mantener calificación y evidencias en el Plan Anual';
      return {
        ok: true,
        formula: 'Cumplimiento Res. 0312 = (Obtenido / Total) × 100',
        normativa: 'Resolución 0312 de 2019 Art. 28',
        variables: { obtenido: cumplidos, total: totales },
        resultado: roundTo(pct, 2),
        unidad: '%',
        valoracion,
      };
    }

    if (formulaRaw === 'dosis_ruido' || formulaRaw === 'ruido') {
      const nivelDb = num('nivel_db', 'db', 'l', 'laeq');
      const horasExp = num('horas_exposicion', 't_exp', 'horas', 't');
      const limiteDb = Number.isFinite(num('limite_db', 'tlv')) ? num('limite_db', 'tlv') : 85;
      const tasaIntercambio = Number.isFinite(num('tasa_intercambio', 'q')) ? num('tasa_intercambio', 'q') : 3;
      if (!Number.isFinite(nivelDb) || !Number.isFinite(horasExp) || horasExp < 0) {
        return { error: 'Para dosis de ruido se requieren "nivel_db" (dBA) y "horas_exposicion".' };
      }
      const tiempoPermitido = 8 / Math.pow(2, (nivelDb - limiteDb) / tasaIntercambio);
      const dosisPct = (horasExp / tiempoPermitido) * 100;
      return {
        ok: true,
        formula: 'T_permitido = 8 / 2^((L - 85) / Q); Dosis(%) = (T_exp / T_permitido) × 100',
        normativa: 'Resolución 1792 de 1990 / ACGIH TLV (85 dBA, Q=3 dB)',
        variables: { nivel_db: nivelDb, horas_exposicion: horasExp, limite_db: limiteDb, tasa_intercambio: tasaIntercambio },
        tiempo_maximo_permitido_horas: roundTo(tiempoPermitido, 4),
        resultado: roundTo(dosisPct, 2),
        unidad: '% de dosis permitida',
        cumple_tlv: dosisPct <= 100,
      };
    }

    if (formulaRaw === 'twa_quimico' || formulaRaw === 'dosis_quimico' || formulaRaw === 'quimico') {
      const conc = num('concentracion', 'c');
      const tlv = num('tlv', 'limite_permisible', 'vlm');
      const horas = Number.isFinite(num('horas_jornada', 'horas')) ? num('horas_jornada', 'horas') : 8;
      if (!Number.isFinite(conc) || !Number.isFinite(tlv) || tlv <= 0) {
        return { error: 'Para evaluación química se requieren "concentracion" y "tlv" > 0.' };
      }
      const factorBriefScala = horas > 8 ? (8 / horas) * ((24 - horas) / 16) : 1;
      const tlvCorregido = tlv * factorBriefScala;
      const indiceExposicion = conc / tlvCorregido;
      return {
        ok: true,
        formula: 'Índice Exposición = Concentración / TLV_corregido (Brief & Scala si jornada > 8h)',
        variables: { concentracion: conc, tlv, horas_jornada: horas },
        factor_brief_scala: roundTo(factorBriefScala, 4),
        tlv_corregido: roundTo(tlvCorregido, 4),
        resultado: roundTo(indiceExposicion, 4),
        porcentaje_tlv: roundTo(indiceExposicion * 100, 2),
        nivel_riesgo:
          indiceExposicion >= 1
            ? 'SUPERIOR AL TLV (Inaceptable — Control de Ingeniería/EPP inmediato)'
            : indiceExposicion >= 0.5
              ? 'NIVEL DE ACCIÓN (≥ 50% TLV — Monitoreo y vigilancia médica)'
              : 'ACEPTABLE (< 50% TLV)',
      };
    }

    if (formulaRaw === 'ausentismo') {
      const diasAusencia = num('dias_ausencia', 'dias_incapacidad', 'dias');
      const diasProgramados = num('dias_programados', 'dias_trabajados_programados');
      if (!Number.isFinite(diasAusencia) || !Number.isFinite(diasProgramados) || diasProgramados <= 0) {
        return { error: 'Para ausentismo se requieren "dias_ausencia" y "dias_programados" > 0.' };
      }
      const pct = (diasAusencia / diasProgramados) * 100;
      return {
        ok: true,
        formula: 'Ausentismo = (Días de ausencia por causa médica / Días programados) × 100',
        normativa: 'Resolución 0312 de 2019 Art. 30',
        variables: { dias_ausencia: diasAusencia, dias_programados: diasProgramados },
        resultado: roundTo(pct, 4),
        unidad: '%',
      };
    }
  }

  if (!exprRaw) {
    return {
      error:
        'Debes indicar una "expresion" matemática (ej. "(4 * 240000) / 185000") o una "formula_sst" válida (IF, IS, ILI, tasa_accidentalidad, porcentaje_0312, dosis_ruido, twa_quimico, ausentismo).',
    };
  }

  try {
    const val = evaluateSafeArithmeticExpression(exprRaw, vars);
    return {
      ok: true,
      expresion: exprRaw,
      resultado: roundTo(val, 6),
      resultado_exacto: val,
    };
  } catch (err) {
    return {
      error: `Error evaluando expresión matemática: ${err.message}`,
      expresion: exprRaw,
    };
  }
}

module.exports = {
  ALLOWED_TENSHI_MODELS,
  CORE_ALWAYS_ACTIVE_TOOLS,
  ADMIN_ONLY_TOOLS,
  POPOVER_ENABLED_TOOLS_MAP,
  CONNECTOR_TOOL_MAP,
  sanitizeRequestedTenshiModel,
  buildTenshiModelFallbacks,
  buildTenshiGenerationConfig,
  deduplicateFunctionDeclarations,
  normalizeConnectorsObject,
  selectTenshiTools,
  resolveSelectedNotebooks,
  buildNotebookLmPromptBlock,
  generateSmartTenshiTitle,
  buildCompanyScopeFilter,
  ensureLegacyTenshiConversation,
  evaluateSafeArithmeticExpression,
  evaluateSafeSstCalculator,
};
