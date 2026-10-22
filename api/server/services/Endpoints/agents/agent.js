const { Providers } = require('@librechat/agents');
const {
  primeResources,
  getModelMaxTokens,
  extractLibreChatParams,
  optionalChainWithEmptyCheck,
} = require('@librechat/api');
const {
  ErrorTypes,
  EModelEndpoint,
  EToolResources,
  isAgentsEndpoint,
  replaceSpecialVars,
  providerEndpointMap,
} = require('librechat-data-provider');
const generateArtifactsPrompt = require('~/app/clients/prompts/artifacts');
const { getProviderConfig } = require('~/server/services/Endpoints');
const { processFiles } = require('~/server/services/Files/process');
const { getFiles, getToolFilesByIds } = require('~/models/File');
const { getConvoFiles } = require('~/models/Conversation');

/**
 * @param {object} params
 * @param {ServerRequest} params.req
 * @param {ServerResponse} params.res
 * @param {Agent} params.agent
 * @param {string | null} [params.conversationId]
 * @param {Array<IMongoFile>} [params.requestFiles]
 * @param {typeof import('~/server/services/ToolService').loadAgentTools | undefined} [params.loadTools]
 * @param {TEndpointOption} [params.endpointOption]
 * @param {Set<string>} [params.allowedProviders]
 * @param {boolean} [params.isInitialAgent]
 * @returns {Promise<Agent & {
 * tools: StructuredTool[],
 * attachments: Array<MongoFile>,
 * toolContextMap: Record<string, unknown>,
 * maxContextTokens: number,
 * userMCPAuthMap?: Record<string, Record<string, string>>
 * }>}
 */
const initializeAgent = async ({
  req,
  res,
  agent,
  loadTools,
  requestFiles,
  conversationId,
  endpointOption,
  allowedProviders,
  isInitialAgent = false,
}) => {
  const appConfig = req.config;
  const isPublicChat = req.body?.isPublicChat === true;
  if (isPublicChat) {
    agent.tools = [];
    agent.skills = [];
    agent.additional_instructions = '';
    agent.artifacts = undefined;
    agent.model = 'gemini-3.5-flash-lite';
    if (!agent.model_parameters) {
      agent.model_parameters = {};
    }
    agent.model_parameters.model = 'gemini-3.5-flash-lite';

    let contextSection = '';
    const moodContext = req.body?.moodContext;
    if (moodContext) {
      const moodMap = {
        happy: 'Feliz / Motivado (buena energía y satisfacción)',
        neutral: 'Tranquilo / Estable (jornada habitual)',
        sad: 'Estresado / Agotado (con sobrecarga, malestar o fatiga)',
      };
      const moodLabel = moodMap[moodContext.mood] || moodContext.mood || 'No especificado';
      const dept = moodContext.department?.trim() ? moodContext.department.trim() : 'No especificado';
      const factors = Array.isArray(moodContext.stressors) && moodContext.stressors.length > 0
        ? moodContext.stressors.join(', ')
        : 'Ninguno seleccionado';

      contextSection = `\n\n📌 CONTEXTO PREVIO DEL TRABAJADOR (Registrado en el Termómetro Psicosocial):
- Estado de ánimo: ${moodLabel}
- Área o departamento: ${dept}
- Factores de estrés reportados: ${factors}
PAUTA CLAVE: Ya conoces este contexto previo. NO le preguntes desde cero qué le pasa o qué contestó en el cuestionario; valida sus emociones y enfócate directamente en escucharlo y ayudarlo con base en esos factores con cercanía y calidez.`;
    }

    agent.instructions = `Eres un profesional en Terapia Ocupacional y Salud Mental Ocupacional. Tu único propósito en este chat es escuchar, orientar y brindar apoyo emocional y técnico a los trabajadores de la empresa en un espacio 100% privado, seguro y confidencial.
${contextSection}

IMPORTANTE: 
1. Rol y Destinatario: Estás hablando DIRECTAMENTE con un trabajador (empleado) de la empresa que está experimentando estrés, fatiga, sobrecarga o malestar emocional. NUNCA respondas como si hablaras con el responsable de SG-SST, el empleador o el administrador del sistema. Tampoco asumas un rol de consultor externo para la gestión estratégica. Usa un lenguaje directo, empático, cálido y comprensivo hacia el trabajador.
2. Enfoque Humano y de Apoyo: NO le pidas contratos, evidencias, pruebas (como correos o testigos) ni realices preguntas burocráticas o de auditoría. Tu enfoque es puramente de apoyo, escucha empática, orientación en salud mental, límites saludables y autocuidado.
3. Estilo de Respuesta: Responde de forma directa, limpia y estructurada. NO utilices tablas HTML, bloques de código complejos ni herramientas. Tus respuestas deben ser en texto claro, cálido, cercano y legible, usando Markdown sencillo (negritas, listas con guiones) para estructurar el mensaje si es necesario.
4. Prevención y Seguridad: Si el trabajador muestra un riesgo grave o ideas de daño (autolesión o suicidio), bríndale recursos de apoyo inmediato y motívalo a buscar ayuda profesional externa de manera empática.
5. Transparencia: NO menciones que eres una IA ni utilices formatos de citas de documentos (como etiquetas de archivos o referencias técnicas). Mantén el tono de un terapeuta humano y cercano.
6. Evitar Saludos Duplicados: Ya se le ha dado una bienvenida inicial al usuario en la interfaz del chat. NO vuelvas a presentarte, ni saludes de forma introductoria o corporativa como si fuera el inicio del chat. Empieza directamente respondiendo a lo que el trabajador te ha dicho, con naturalidad, de manera corta y conversacional.`;
  }
  if (
    isAgentsEndpoint(endpointOption?.endpoint) &&
    allowedProviders.size > 0 &&
    !allowedProviders.has(agent.provider)
  ) {
    throw new Error(
      `{ "type": "${ErrorTypes.INVALID_AGENT_PROVIDER}", "info": "${agent.provider}" }`,
    );
  }
  let currentFiles;

  const _modelOptions = structuredClone(
    Object.assign(
      { model: agent.model },
      agent.model_parameters ?? { model: agent.model },
      isInitialAgent === true ? endpointOption?.model_parameters : {},
    ),
  );

  const { resendFiles, maxContextTokens, modelOptions } = extractLibreChatParams(_modelOptions);

  if (isInitialAgent && conversationId != null && resendFiles) {
    const fileIds = (await getConvoFiles(conversationId)) ?? [];
    /** @type {Set<EToolResources>} */
    const toolResourceSet = new Set();
    for (const tool of agent.tools) {
      if (EToolResources[tool]) {
        toolResourceSet.add(EToolResources[tool]);
      }
    }
    const toolFiles = await getToolFilesByIds(fileIds, toolResourceSet);
    if (requestFiles.length || toolFiles.length) {
      currentFiles = await processFiles(requestFiles.concat(toolFiles));
    }
  } else if (isInitialAgent && requestFiles.length) {
    currentFiles = await processFiles(requestFiles);
  }

  const { attachments, tool_resources } = await primeResources({
    req,
    getFiles,
    appConfig,
    agentId: agent.id,
    attachments: currentFiles,
    tool_resources: agent.tool_resources,
    requestFileSet: new Set(requestFiles?.map((file) => file.file_id)),
  });

  const provider = agent.provider;
  if (!isPublicChat) {
    if (!Array.isArray(agent.tools)) {
      agent.tools = [];
    }
    if (!agent.tools.includes('wappy_renderizar_widget_interactivo')) {
      agent.tools.push('wappy_renderizar_widget_interactivo');
    }
    if (!agent.tools.includes('wappy_memoria_procedimental')) {
      agent.tools.push('wappy_memoria_procedimental');
    }
  }
  const {
    tools: structuredTools,
    toolContextMap,
    userMCPAuthMap,
  } = (await loadTools?.({
    req,
    res,
    provider,
    agentId: agent.id,
    tools: agent.tools,
    model: agent.model,
    tool_resources,
  })) ?? {};

  agent.endpoint = provider;
  const { getOptions, overrideProvider } = getProviderConfig({ provider, appConfig });
  if (overrideProvider !== agent.provider) {
    agent.provider = overrideProvider;
  }

  const _endpointOption =
    isInitialAgent === true
      ? Object.assign({}, endpointOption, { model_parameters: modelOptions })
      : { model_parameters: modelOptions };

  const options = await getOptions({
    req,
    res,
    optionsOnly: true,
    overrideEndpoint: provider,
    overrideModel: agent.model,
    endpointOption: _endpointOption,
  });

  const tokensModel =
    agent.provider === EModelEndpoint.azureOpenAI ? agent.model : options.llmConfig?.model;
  const maxOutputTokens = optionalChainWithEmptyCheck(
    options.llmConfig?.maxOutputTokens,
    options.llmConfig?.maxTokens,
    0,
  );
  const agentMaxContextTokens = optionalChainWithEmptyCheck(
    maxContextTokens,
    getModelMaxTokens(tokensModel, providerEndpointMap[provider], options.endpointTokenConfig),
    18000,
  );

  if (
    agent.endpoint === EModelEndpoint.azureOpenAI &&
    options.llmConfig?.azureOpenAIApiInstanceName == null
  ) {
    agent.provider = Providers.OPENAI;
  }

  if (options.provider != null) {
    agent.provider = options.provider;
  }

  /** @type {import('@librechat/agents').GenericTool[]} */
  let tools = options.tools?.length ? options.tools : structuredTools;
  if (
    (agent.provider === Providers.GOOGLE || agent.provider === Providers.VERTEXAI) &&
    options.tools?.length &&
    structuredTools?.length
  ) {
    throw new Error(`{ "type": "${ErrorTypes.GOOGLE_TOOL_CONFLICT}"}`);
  } else if (
    (agent.provider === Providers.OPENAI ||
      agent.provider === Providers.AZURE ||
      agent.provider === Providers.ANTHROPIC) &&
    options.tools?.length &&
    structuredTools?.length
  ) {
    tools = structuredTools.concat(options.tools);
  }

  if (Array.isArray(tools)) {
    const seenToolNames = new Set();
    tools = tools.filter((tool) => {
      const name = tool?.name || (typeof tool === 'string' ? tool : null);
      if (!name) return true;
      if (seenToolNames.has(name)) return false;
      seenToolNames.add(name);
      return true;
    });
  }

  if (isPublicChat) {
    tools = [];
    agent.tools = [];
    agent.skills = [];
  }

  /** @type {import('@librechat/agents').ClientOptions} */
  agent.model_parameters = { ...options.llmConfig };
  if (options.configOptions) {
    agent.model_parameters.configuration = options.configOptions;
  }

  if (isPublicChat) {
    agent.model = 'gemini-3.5-flash-lite';
    agent.model_parameters.model = 'gemini-3.5-flash-lite';
  }

  if (agent.instructions && agent.instructions !== '') {
    agent.instructions = replaceSpecialVars({
      text: agent.instructions,
      user: req.user,
    });
  }

  if (typeof agent.artifacts === 'string' && agent.artifacts !== '') {
    agent.additional_instructions = generateArtifactsPrompt({
      endpoint: agent.provider,
      artifacts: agent.artifacts,
    });
  }

  // Inject Global Canvas Prompt Guidelines if canvas tool is configured
  const hasCanvasTool = Array.isArray(agent.tools) && agent.tools.includes('canvas');
  if (hasCanvasTool) {
    let canvasStatusPrompt = '';
    if (conversationId && conversationId !== 'new') {
      try {
        const CanvasSession = require('~/models/CanvasSession');
        const session = await CanvasSession.findOne({ conversationId });
        if (session) {
          canvasStatusPrompt = `
# ESTADO ACTUAL DEL CANVAS (LIENZO):
- ¡ATENCIÓN! Ya existe un documento activo cargado en el Canvas del usuario:
  * Título actual: "${session.title}"
  * Tipo de archivo: "${session.fileType}"
  * Longitud del contenido: ${session.content ? (typeof session.content === 'object' ? JSON.stringify(session.content).length : String(session.content).length) : 0} caracteres.
- **DIRECTRICES DE TRABAJO OBLIGATORIAS**:
  * Si necesitas ver el contenido completo de este documento preexistente, **DEBES usar la herramienta \`canvas\` con la acción \`leer\`** antes de responder.
  * Para **MODIFICAR o EDITAR** partes de este documento preexistente, **DEBES usar la herramienta \`canvas\` con las acciones granulares** (\`buscar_reemplazar\`, \`editar_seccion\` o \`insertar\`). **NO reescribas el documento entero** ni utilices la directiva \`:::canvas\` a menos que el usuario te pida explícitamente reescribir todo desde cero. Esto evita alterar partes del documento que no fueron solicitadas.
`;
        } else {
          canvasStatusPrompt = `
# ESTADO ACTUAL DEL CANVAS (LIENZO):
- El Canvas está actualmente vacío para esta conversación.
[REGLA DE ENTREGABLES Y ACTIVACIÓN DE CANVAS]:
- **RESPUESTA NORMAL SIN CÓDIGO POR DEFECTO:** Si el usuario te pide un aplicativo, formato, calculadora, guion, archivo en Word, archivo en Excel, informe o presentación, PERO NO activó Canvas ni pidió explícitamente abrir el lienzo:
  * ESTÁ TERMINANTEMENTE PROHIBIDO responder con bloques de código (\`\`\`html, \`\`\`javascript, \`\`\`xml, \`\`\`python, etc.). Los usuarios de WAPPY son profesionales de SG-SST, Recursos Humanos y Gerencia sin conocimientos de programación. Ver código en el chat arruina por completo la experiencia de usuario.
  * Debes entregar la solución estructurada directamente en el chat utilizando:
    1. **Tarjetas interactivas (wappy-card)** para checklists, planes de acción, métricas y resúmenes.
    2. **Tablas Markdown estándar** para datos, matrices, cronogramas y cálculos.
    3. **Texto ejecutivo estructurado** con títulos, subtítulos, viñetas y fundamentación legal.
- **ACTIVACIÓN DE CANVAS SÓLO POR PETICIÓN EXPLÍCITA:**
  * ÚNICAMENTE debes llamar a la herramienta \`canvas\` con \`accion: "crear"\` si el usuario solicita EXPRESAMENTE trabajar en el lienzo o generar el archivo en Canvas (ej: "ábrelo en canvas", "hazlo en canvas", "crea un aplicativo interactivo en html").
  * Si el usuario pide un aplicativo interactivo HTML en Canvas, DEBES invocar la herramienta \`canvas\` para que se despliegue en el panel lateral. NUNCA escribas el código HTML en el chat de texto.
`;
        }
      } catch (err) {
        if (req.log) {
          req.log.error('[Canvas Ingestion Error]', err);
        } else {
          console.error('[Canvas Ingestion Error]', err);
        }
      }
    }

    const canvasPrompt = `
# INSTRUCCIONES DEL CANVAS (LIENZO DE TRABAJO DERECHO):
El Canvas permite mostrar al usuario documentos descargables, hojas de cálculo, diapositivas o código interactivo en un panel lateral derecho.

## 0. REGLA FUNDAMENTAL DE ACTIVACIÓN (CERO CÓDIGO EN EL CHAT):
- NUNCA uses Canvas para responder consultas normales, explicaciones técnicas o preguntas del chat. Responde siempre en el chat en Markdown.
- ÚNICAMENTE utiliza Canvas si el usuario pide explícitamente crear un archivo o abrir un lienzo ("en canvas", "archivo en word en canvas", "haz un excel en canvas", "presentación en diapositivas", "crea un aplicativo interactivo en html").
- Si el usuario pide un entregable (guion, aplicativo, tabla, informe) pero NO activa Canvas: ENTREGA TODO DIRECTAMENTE EN EL CHAT USANDO TABLAS MARKDOWN, TARJETAS WAPPY-CARD Y TEXTO EXECUTIVO. ESTÁ TERMINANTEMENTE PROHIBIDO VOLCAR CÓDIGO FUENTE EN EL CHAT.

## 1. LECTURA (Consultar documento existente):
- Si el usuario menciona un documento preexistente en el Canvas y necesitas examinarlo, llama a la herramienta \`canvas\` con \`accion: "leer"\`.

## 2. CREACIÓN (Inicializar un Canvas nuevo tras solicitud expresa):
Cuando el usuario pida EXPLÍCITAMENTE crear un archivo o lienzo nuevo (aplicativo interactivo, documento, hoja de cálculo o diapositivas):
- **OBLIGATORIO:** Invoca de manera inmediata la herramienta \`canvas\` con:
  * \`accion: "crear"\`
  * \`fileType: "html" | "text" | "excel" | "presentation"\`
  * \`title: "Título descriptivo"\`
  * \`content: "Contenido completo del archivo o aplicación"\`
- NUNCA escribas código HTML en el chat de texto. El contenido debe viajar exclusivamente dentro del parámetro \`content\` de la herramienta \`canvas\`. En el chat sólo debes dejar un saludo cordial de 2 líneas explicando que el documento/aplicativo está disponible en el panel derecho de Canvas.

## 3. EDICIÓN (Modificar un Canvas existente):
- **REGLA DE ORO:** Para editar o modificar un Canvas existente, **NUNCA uses la etiqueta :::canvas** ni reescribas todo el archivo, a menos que el usuario te pida rehacerlo completo.
- **En su lugar, usa obligatoriamente las acciones de la herramienta \`canvas\`**:
  * \`buscar_reemplazar\`: Para cambiar fragmentos específicos de texto o código.
  * \`editar_seccion\`: Para modificar una sección específica bajo un título.
  * \`insertar\`: Para añadir contenido en una posición específica (inicio, fin o después de un texto).
- Esto protege el resto del documento y garantiza que no se alteren secciones que el usuario no solicitó modificar.`;
    agent.additional_instructions = (agent.additional_instructions ?? '') + '\n' + canvasStatusPrompt + '\n' + canvasPrompt;
  }

  // Inject Shared Procedural Memory & Generative UI Capabilities across all Specialist Agents (OpenBot Colmena)
  if (!isPublicChat && req?.user?.id) {
    try {
      const CompanyInfo = require('~/models/CompanyInfo');
      const { getProceduralMemoryPromptBlock } = require('~/server/routes/voice/tenshiOpenBotEngine');
      let activeComp = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean();
      if (!activeComp) {
        activeComp = await CompanyInfo.findOne({ user: req.user.id }).sort({ updatedAt: -1 }).lean();
      }
      const procMemBlock = await getProceduralMemoryPromptBlock(req.user.id, activeComp?._id, 10);
      const openBotAgentInstructions = `
# CAPACIDADES INTERACTIVAS OPENBOT (GENERATIVE UI & MEMORIA PROCEDURAL COMPARTIDA):
1. **Widgets Interactivos en el Chat (\`wappy_renderizar_widget_interactivo\`)**:
   - Cuando el usuario te pida simular o calcular un riesgo GTC-45 (ND x NE x NC) o cuando convenga acompañarlo de un simulador vivo en el chat, invoca \`wappy_renderizar_widget_interactivo\` con \`tipo_widget: "risk_calculator"\`.
   - Cuando el usuario te pida una lista de chequeo o verificación preoperacional (Trabajo en Alturas, PESV, Químicos SGA, Extintores, Botiquín, etc.), invoca \`wappy_renderizar_widget_interactivo\` con \`tipo_widget: "inspection_checklist"\` y los ítems correspondientes.
2. **Memoria Procedural y Hábitos de Empresa (\`wappy_memoria_procedimental\`)**:
   - Compartes una misma memoria procedimental corporativa con Tenshi y con los otros 21 especialistas.
   - Si el usuario te enseña una regla operativa, flujo de aprobación o costumbre de su empresa ("recuerda que siempre que...", "en esta empresa cuando..."), guárdala de inmediato usando \`wappy_memoria_procedimental\` con \`accion: "guardar"\`.
   - Si el usuario pregunta qué reglas o hábitos recuerdas de la empresa, usa \`wappy_memoria_procedimental\` con \`accion: "listar"\`.${procMemBlock ? '\n' + procMemBlock : ''}`;
      agent.additional_instructions = (agent.additional_instructions ?? '') + '\n' + openBotAgentInstructions;
    } catch (openBotErr) {
      if (req?.log) {
        req.log.warn('[OpenBot Agent Context Injection Error]', openBotErr.message);
      }
    }
  }

  return {
    ...agent,
    tools,
    attachments,
    resendFiles,
    userMCPAuthMap,
    toolContextMap,
    additional_instructions: agent.additional_instructions,
    useLegacyContent: !!options.useLegacyContent,
    maxContextTokens: Math.round((agentMaxContextTokens - maxOutputTokens) * 0.9),
  };
};

module.exports = { initializeAgent };
