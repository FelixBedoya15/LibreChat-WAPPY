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
    agent.additional_instructions = '';
    agent.artifacts = undefined;
    agent.model = 'gemini-3.1-flash-lite';
    agent.instructions = `Eres un profesional en Terapia Ocupacional y Salud Mental Ocupacional. Tu único propósito en este chat es escuchar, orientar y brindar apoyo emocional y técnico a los trabajadores de la empresa en un espacio 100% privado, seguro y confidencial.

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

  if (isPublicChat) {
    tools = [];
  }

  /** @type {import('@librechat/agents').ClientOptions} */
  agent.model_parameters = { ...options.llmConfig };
  if (options.configOptions) {
    agent.model_parameters.configuration = options.configOptions;
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
  * Si necesitas ver, continuar, modificar, auditar o completar este documento preexistente, **DEBES usar la herramienta \`canvas\` con la acción \`leer\`** para cargar su contenido en tu contexto antes de responder.
  * Una vez leído, genera el bloque completo \`:::canvas\` con las actualizaciones necesarias.
`;
        } else {
          canvasStatusPrompt = `
# ESTADO ACTUAL DEL CANVAS (LIENZO):
- El Canvas está actualmente vacío para esta conversación. Si necesitas producir un informe, política, contrato u otro documento, puedes inicializarlo usando la directiva \`:::canvas\`.
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
El Canvas permite mostrar al usuario documentos, hojas de cálculo, diapositivas o código interactivo en un panel lateral derecho.

## 1. LECTURA (Consultar documento existente):
- Si el usuario menciona un documento preexistente y necesitas examinarlo, llama a la herramienta \`canvas\` con \`accion: "leer"\`. Esto es sumamente rápido y eficiente.

## 2. ESCRITURA/EDICIÓN (Streaming en tiempo real):
Para crear, inicializar o actualizar el Canvas con contenido nuevo, **NO uses la herramienta canvas**. En su lugar, genera el bloque de marcas en tu respuesta de texto con esta sintaxis:

:::canvas{identifier="unique-id" fileType="text|excel|presentation|html" title="Título del Documento"}
[Tu contenido aquí en formato crudo sin comillas escapadas ni formateo JSON]
:::

### Reglas de Formato de Contenido según 'fileType':
- **fileType="text"** (Word/Documentos tradicionales): El contenido debe ser texto formateado en Markdown estándar (títulos, listas, negritas, tablas). Úsalo para políticas, reglamentos, manuales, contratos, cartas, planes, actas, informes.
- **fileType="excel"** (Hojas de cálculo): Debe ser un JSON o array bidimensional de datos, ej: [["Columna 1", "Columna 2"], ["Dato A1", "Dato A2"]]
- **fileType="presentation"** (Diapositivas): Debe ser un array de objetos JSON, ej: [{"title": "Diapositiva 1", "bullets": ["Punto A", "Punto B"]}]
- **fileType="html"** (Aplicaciones/Código): Código HTML/CSS/JS plano (puedes usar Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>).

### Reglas Críticas:
- Usa un \`identifier\` único y consistente en kebab-case para el documento (ej. "politica-de-induccion"). Si estás actualizando el documento actual, usa el mismo identificador.
- **NO ESCAPES las comillas ni los saltos de línea dentro del bloque :::canvas.** Escribe el código HTML o el texto de forma natural.
- **NO imprimas el contenido del documento en el chat normal.** Todo el contenido debe ir dentro del bloque \`:::canvas\`. En tu chat normal de respuesta, da un saludo o resumen breve y conversacional sobre lo que creaste o modificaste.
`;
    agent.additional_instructions = (agent.additional_instructions ?? '') + '\n' + canvasStatusPrompt + '\n' + canvasPrompt;
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
