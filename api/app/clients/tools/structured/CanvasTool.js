const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const CanvasSession = require('~/models/CanvasSession');
const CompanyInfo = require('~/models/CompanyInfo');
const {
  buildStandardHeader,
  buildSignatureSection,
} = require('~/server/routes/sgsst/reportHeader');
const { syncCanvasToLiveEditor } = require('~/server/routes/sgsst/syncBridge');
const { logger } = require('@librechat/data-schemas');

function hasHeader(html) {
  if (!html || typeof html !== 'string') return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('información resumida de la entidad') ||
    lower.includes('linear-gradient') ||
    lower.includes('registro de inducción') ||
    lower.includes('formato de inspección') ||
    lower.includes('datos generales') ||
    lower.includes('proceso: sg-sst') ||
    lower.includes('proceso:sg-sst')
  );
}

function hasSignature(html) {
  if (!html || typeof html !== 'string') return false;
  const lower = html.toLowerCase();
  return (
    lower.includes('signature-placeholder') ||
    lower.includes('responsable sg-sst') ||
    lower.includes('responsable sst') ||
    lower.includes('trabajador inducido') ||
    lower.includes('representante legal')
  );
}

/**
 * Busca y extrae el bloque del encabezado corporativo (contenedor con degradado linear-gradient y tabla resumen de la entidad)
 * existente en el contenido previo para evitar sobrescribir las ediciones manuales.
 */
function extractExistingHeader(html) {
  if (!html || typeof html !== 'string' || !hasHeader(html)) {
    return null;
  }

  let tableEndMatch = html.match(/<\/table>\s*<\/div>/i);
  if (!tableEndMatch) {
    tableEndMatch = html.match(/<\/table>/i);
  }
  if (!tableEndMatch) return null;

  const headerStartIdx = html.indexOf('<div style="background: linear-gradient');
  if (headerStartIdx === -1) {
    const tableStartIdx = html.indexOf('<div style="overflow-x: auto;');
    if (tableStartIdx === -1) return null;

    const endIdx = html.indexOf(tableEndMatch[0], tableStartIdx);
    if (endIdx === -1) return null;
    return html.substring(tableStartIdx, endIdx + tableEndMatch[0].length);
  }

  const endIdx = html.indexOf(tableEndMatch[0], headerStartIdx);
  if (endIdx === -1) return null;
  return html.substring(headerStartIdx, endIdx + tableEndMatch[0].length);
}

/**
 * Busca y extrae la sección de firmas desde el índice `<div style="margin-top: 50px;"` hasta el final
 * del contenido previo para conservar las firmas digitales y ediciones manuales.
 */
function extractExistingSignature(html) {
  if (!html || typeof html !== 'string' || !hasSignature(html)) return null;

  const variations = [
    '<div style="margin-top: 60px;',
    '<div style="margin-top:60px;',
    '<div style="margin-top: 50px;',
    '<div style="margin-top:50px;',
    '<div style="page-break-inside:avoid;',
    '<div class="signature-placeholder',
  ];

  for (const variation of variations) {
    const index = html.lastIndexOf(variation);
    if (index !== -1) {
      return html.substring(index);
    }
  }
  return null;
}

/**
 * Helper to automatically prepend standard company header and append signature section to text (Word) Canvas documents.
 * Safe against consecutive duplicates by inspecting content substrings and reusing existing headers/signatures.
 */
async function processTextDocument(content, fileType, title, userId, existingContent) {
  if (fileType !== 'text') {
    return content;
  }

  let stringContent = typeof content === 'string' ? content.trim() : (content ? String(content) : '');

  const currentHasHeader = hasHeader(stringContent);
  const currentHasSignature = hasSignature(stringContent);

  if (currentHasHeader && currentHasSignature) {
    return stringContent;
  }

  let headerHtml = null;
  let signatureHtml = null;

  if (existingContent) {
    if (!currentHasHeader) {
      headerHtml = extractExistingHeader(existingContent);
    }
    if (!currentHasSignature) {
      signatureHtml = extractExistingSignature(existingContent);
    }
  }

  let companyInfo = null;
  if ((!currentHasHeader && !headerHtml) || (!currentHasSignature && !signatureHtml)) {
    companyInfo =
      (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
      (await CompanyInfo.findOne({ user: userId }));
  }

  if (!currentHasHeader) {
    if (!headerHtml) {
      headerHtml = buildStandardHeader({
        title: title || 'DOCUMENTO DE TRABAJO',
        companyInfo,
      });
    }
    stringContent = headerHtml + '\n\n' + stringContent;
  }

  if (!currentHasSignature) {
    if (!signatureHtml && companyInfo) {
      signatureHtml = buildSignatureSection(companyInfo);
    }
    if (signatureHtml) {
      stringContent = stringContent + '\n\n' + signatureHtml;
    }
  }

  return stringContent;
}

/**
 * Camino B: Generación / Enriquecimiento de Aplicativos HTML5 en Canvas usando el modelo potente (gemini-3.6-flash).
 * Si el agente orquestador (ej. gemini-3.5-flash-lite) llama a Canvas con fileType='html',
 * esta función transfiere la memoria del chat, los datos de la empresa y los resultados de las herramientas previas
 * (ej. la hoja de Google Sheets creada en este mismo turno) para que gemini-3.6-flash sintetice la aplicación interactiva.
 * La rotación recorre la escalera: gemini-3.6-flash -> 3.5 -> 3.5-flash-lite.
 */
async function processHtmlAppDocument(content, fileType, title, userId, req, existingContent) {
  if (fileType !== 'html') {
    return content;
  }

  let stringContent = typeof content === 'string' ? content.trim() : (content ? String(content) : '');

  // Verificar si ya es un aplicativo completo que cumple con el estándar visual corporativo de WAPPY
  const hasWappyBanner = stringContent.includes('gradient-banner') || stringContent.includes('PROCESO: VERIFICAR') || stringContent.includes('PROCESO: SG-SST');
  const hasCompanyMeta = stringContent.includes('company-nit') || stringContent.includes('Código del Registro') || stringContent.includes('ARL:');
  const isAlreadyFullWappyApp =
    stringContent.length > 3500 &&
    hasWappyBanner &&
    hasCompanyMeta &&
    (stringContent.includes('<script') || stringContent.includes('tailwindcss')) &&
    (stringContent.includes('<!DOCTYPE') || stringContent.includes('<html') || stringContent.includes('<div'));

  if (isAlreadyFullWappyApp) {
    return stringContent;
  }

  // Cargar información corporativa de la empresa
  let companyInfo = null;
  try {
    companyInfo =
      (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
      (await CompanyInfo.findOne({ user: userId }));
  } catch (err) {
    logger.warn('[CanvasTool Camino B] Error cargando CompanyInfo:', err.message);
  }

  // Extraer contexto del usuario y del turno actual
  const userPrompt =
    req?.body?.text ||
    req?.body?.userRequestText ||
    (Array.isArray(req?.body?.messages) && req.body.messages.length > 0
      ? req.body.messages[req.body.messages.length - 1]?.text ||
        req.body.messages[req.body.messages.length - 1]?.content ||
        ''
      : '');

  // Extraer herramientas ejecutadas en este turno (ej. Google Sheets creado previamente)
  let toolsContext = '';
  if (Array.isArray(req?.contentParts)) {
    for (const part of req.contentParts) {
      if (part && part.type === 'tool_result' && part.output) {
        toolsContext += `\n- Resultado de herramienta previa: ${typeof part.output === 'string' ? part.output : JSON.stringify(part.output)}`;
      } else if (part && part.type === 'tool_call' && part.tool_call) {
        toolsContext += `\n- Herramienta ejecutada: ${part.tool_call.name} con argumentos: ${typeof part.tool_call.args === 'string' ? part.tool_call.args : JSON.stringify(part.tool_call.args)}`;
      }
    }
  }

  const companyName = companyInfo?.companyName || 'WAPPY LTDA';
  const companyNit = companyInfo?.nit || '9014373103';
  const companyArl = companyInfo?.arl || 'Sura';
  const companyWorkers = companyInfo?.workerCount || '17';
  const companyRisk = companyInfo?.riskLevel || 'V (Construcción)';
  const registerCode = 'IND-SST-01';
  const currentDate = new Date().toISOString().split('T')[0];

  const prompt = `Eres el Desarrollador Frontend Senior y Diseñador de Interfaces Corporativas de WAPPY.
Tu misión es construir un APLICATIVO WEB INTERACTIVO COMPLETO (Single-File HTML5) con el SISTEMA DE DISEÑO PREMIUM WAPPY (Idéntico a los dashboards y herramientas oficiales de los Agentes Especialistas de SG-SST).

## TÍTULO DEL APLICATIVO:
${title || 'INDICADORES DE GESTIÓN SG-SST'}

## INFORMACIÓN DE LA EMPRESA ACTIVA:
- Razón Social: ${companyName}
- NIT: ${companyNit}
- ARL: ${companyArl}
- Total Trabajadores: ${companyWorkers}
- Nivel de Riesgo: ${companyRisk}
- Código de Registro: ${registerCode}
- Vigencia: ${currentDate}

## SOLICITUD DEL USUARIO / CONTENIDO BASE:
${userPrompt || title || 'Dashboard de Indicadores y Gestión SG-SST'}

${stringContent ? `## DATOS O LÓGICA BASE SUMINISTRADA (Conservar, enriquecer visualmente y nunca degradar):\n${stringContent.slice(0, 4000)}\n` : ''}

${toolsContext ? `## HERRAMIENTAS Y BASES DE DATOS VINCULADAS:\n${toolsContext}\n` : ''}

---

## 🎨 SISTEMA DE DISEÑO VISUAL OBLIGATORIO DE WAPPY (ESTRICTO):

1. **PALETA Y TEMA OSCURO CORPORATIVO (DARK THEME POR DEFECTO):**
   - Fondo general: \`bg-[#0b0f19] text-slate-100 font-sans min-h-screen p-4 md:p-8\`
   - Tipografía: Plus Jakarta Sans o Inter vía Google Fonts.
   - Tailwind CSS vía CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`
   - Lucide Icons vía CDN: \`<script src="https://unpkg.com/lucide@latest"></script>\`
   - Chart.js para gráficas: \`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\`

2. **BLOQUE 1: BANNER SUPERIOR OFICIAL WAPPY (\`gradient-banner\`):**
   Incluye exactamente este banner en la parte superior:
\`\`\`html
<header class="max-w-[1400px] mx-auto mb-6">
    <div class="gradient-banner bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-500 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-5 z-10 w-full md:w-auto">
            <div class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shadow-inner shrink-0">
                <img src="https://wappy.club/assets/logo.png" onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/FelixBedoya15/LibreChat-WAPPY/main/client/public/images/logo.png';" class="h-full w-full object-contain" alt="WAPPY Logo">
            </div>
            <div>
                <h1 class="text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase text-white">${(title || 'INDICADORES DE GESTIÓN SG-SST').toUpperCase()}</h1>
                <h2 class="text-xs md:text-sm font-bold tracking-wider text-teal-100 uppercase mt-1">SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO</h2>
                <p class="text-[10px] md:text-xs text-teal-200 mt-0.5 opacity-90">Conforme a la Resolución 0312 de 2019 y Decreto 1072 de 2015</p>
            </div>
        </div>
        <div class="flex flex-col md:items-end gap-3 z-10 text-left md:text-right w-full md:w-auto">
            <span class="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-xs font-black tracking-wider uppercase text-white whitespace-nowrap">PROCESO: VERIFICAR | V.02</span>
        </div>
    </div>
</header>
\`\`\`

3. **BLOQUE 2: FICHA DE METADATOS DE LA EMPRESA ACTIVA:**
   Incluye esta ficha corporativa conectada:
\`\`\`html
<div class="max-w-[1400px] mx-auto mb-6">
    <div class="bg-slate-900/60 backdrop-blur-md p-5 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-teal-500">
        <div>
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xl font-bold text-white tracking-wide">${companyName}</span>
                <span class="text-xs font-bold px-2.5 py-0.5 bg-teal-950/80 text-teal-400 rounded-md border border-teal-800/50">NIT</span>
                <span class="text-xs font-semibold text-slate-300">${companyNit}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                <span>ARL: <strong class="text-slate-200">${companyArl}</strong></span>
                <span>Trabajadores: <strong class="text-slate-200">${companyWorkers}</strong></span>
                <span>Nivel Riesgo: <strong class="text-slate-200">${companyRisk}</strong></span>
            </p>
        </div>
        <div class="text-left md:text-right">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Código del Registro</span>
            <span class="text-lg font-black text-white">${registerCode}</span>
            <span class="text-[10px] text-slate-400 mt-0.5 block">Vigencia: ${currentDate}</span>
        </div>
    </div>
</div>
\`\`\`

4. **BLOQUE 3: TARJETAS KPI DE ALTO IMPACTO (Métricas con bordes neón y valores grandes):**
   - Grilla responsive (\`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1400px] mx-auto mb-6\`).
   - Tarjetas con fondo \`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden\`.
   - Borde inferior o lateral de color distintivo (Verde \`border-b-2 border-b-teal-500\`, Naranja \`border-b-2 border-b-amber-500\`, Cyan \`border-b-2 border-b-cyan-500\`, Morado \`border-b-2 border-b-indigo-500\`).
   - Iconos Lucide estilizados en cada tarjeta.
   - Cifra principal en \`text-3xl font-black text-white my-2\`.
   - Subtexto técnico explicativo (ej: *Accidentes / 240.000 HHT*, *Días perdidos / 240.000 HHT*, *% Horas perdidas por incapacidad*, *Horas hombre trabajadas*).

5. **BLOQUE 4: GRÁFICOS INTERACTIVOS (Chart.js en Dark Mode):**
   - Contenedores de gráficos (\`grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1400px] mx-auto mb-6\`).
   - Fondo de tarjeta \`bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl\`.
   - Paleta de datasets neón/SST: Teal (\`#14b8a6\`), Cyan (\`#06b6d4\`), Ámbar (\`#f59e0b\`), Esmeralda (\`#10b981\`).
   - Gridlines tenues (\`rgba(255, 255, 255, 0.05)\`) y textos en \`#94a3b8\`.

6. **BLOQUE 5: TABLAS INTERACTIVAS Y CONTROLES:**
   - Tabla reactiva con buscador, filtros y celdas estilizadas.
   - Botón funcional de Imprimir / Descargar PDF (\`window.print()\`).

7. **BLOQUE 6: BOTÓN FLOTANTE "ASISTENTE IA":**
\`\`\`html
<div id="wappy-ai-floating-btn" class="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-teal-300/30">
    <i data-lucide="bot" class="w-4 h-4"></i>
    <span>ASISTENTE IA</span>
    <span class="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
</div>
\`\`\`

8. **SCRIPTS:**
   - Incluye \`lucide.createIcons();\` para renderizar todos los iconos.

RESPUESTA ESTRICTA: Responde ÚNICAMENTE con el documento HTML5 completo (empezando con <!DOCTYPE html>), sin explicaciones, sin introducciones y sin bloques de markdown con comillas invertidas.`;

  try {
    const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
    logger.info('[CanvasTool Camino B] Delegando generación técnica de aplicativo HTML a gemini-3.6-flash (Diseño WAPPY Premium)...');
    const result = await generateWithKeyRotation('gemini-3.6-flash', userId, prompt);
    const response = await result?.response;
    let generatedHtml = response?.text ? response.text() : '';

    if (generatedHtml) {
      generatedHtml = generatedHtml
        .replace(/^```(?:html)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    if (
      generatedHtml &&
      generatedHtml.length > 500 &&
      (generatedHtml.includes('<html') || generatedHtml.includes('<div') || generatedHtml.includes('<!DOCTYPE'))
    ) {
      logger.info(
        `[CanvasTool Camino B] Aplicativo HTML generado con éxito por gemini-3.6-flash (${generatedHtml.length} caracteres).`,
      );
      return generatedHtml;
    }
  } catch (err) {
    logger.error('[CanvasTool Camino B] Error delegando generación a gemini-3.6-flash, preservando contenido original:', err);
  }

  return stringContent;
}

/**
 * Camino B para Documentos de Texto (Word/Markdown): Enriquecimiento Pesado con gemini-3.6-flash.
 * Cuando se solicita un informe, diagnóstico, política, plan, acta o documento técnico en Canvas (fileType='text'),
 * si el contenido suministrado es escueto (< 3500 caracteres o carece de al menos 2 tablas técnicas completas),
 * esta función delega la síntesis a gemini-3.6-flash con rotación completa de claves y circuit breaker.
 * Garantiza la inclusión obligatoria de tablas técnicas de datos y fundamentación normativa colombiana (Decreto 1072/2015, Res. 0312/2019).
 */
async function processTextReportDocument(content, fileType, title, userId, req, existingContent) {
  if (fileType !== 'text') {
    return content;
  }

  let stringContent = typeof content === 'string' ? content.trim() : (content ? String(content) : '');

  // Conteo de tablas (Markdown o HTML)
  const markdownTableCount = (stringContent.match(/\|[\s-:]+\|/g) || []).length;
  const htmlTableCount = (stringContent.match(/<table[\s>]/gi) || []).length;
  const totalTables = markdownTableCount + htmlTableCount;

  // Si ya es un documento exhaustivo (más de 3500 caracteres y al menos 2 tablas técnicas), preservarlo
  const isAlreadyComprehensiveReport = stringContent.length >= 3500 && totalTables >= 2;
  if (isAlreadyComprehensiveReport) {
    return stringContent;
  }

  // Cargar información corporativa de la empresa
  let companyInfo = null;
  try {
    companyInfo =
      (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
      (await CompanyInfo.findOne({ user: userId }));
  } catch (err) {
    logger.warn('[CanvasTool Camino B - Text] Error cargando CompanyInfo:', err.message);
  }

  // Extraer requerimiento del usuario y contexto
  const userPrompt =
    req?.body?.text ||
    req?.body?.userRequestText ||
    (Array.isArray(req?.body?.messages) && req.body.messages.length > 0
      ? req.body.messages[req.body.messages.length - 1]?.text ||
        req.body.messages[req.body.messages.length - 1]?.content ||
        ''
      : '');

  let screenContext = req?.body?.screenContext || '';
  let agentContext = req?.body?.agentContext || '';

  // Extraer resultados de herramientas previas del turno si existen
  let toolsContext = '';
  if (Array.isArray(req?.contentParts)) {
    for (const part of req.contentParts) {
      if (part && part.type === 'tool_result' && part.output) {
        toolsContext += `\n- Herramienta previa: ${typeof part.output === 'string' ? part.output : JSON.stringify(part.output)}`;
      }
    }
  }

  const companyContext = companyInfo
    ? `Empresa: ${companyInfo.companyName || 'Empresa Activa'}\nNIT: ${companyInfo.nit || 'Sin NIT'}\nActividad Económica / Sector: ${companyInfo.economicSector || 'General'}\nClase de Riesgo ARL: ${companyInfo.riskLevel || 'Riesgo III'}\nNúmero de Colaboradores: ${companyInfo.numWorkers || companyInfo.employeeCount || 'No especificado'}\nCiudad / Sede: ${companyInfo.city || companyInfo.address || 'Colombia'}\nResponsable SG-SST: ${companyInfo.sstResponsible || 'Especialista SST'}`
    : 'No hay información de empresa registrada en el perfil.';

  const prompt = `Eres el Especialista Principal y Consultor Senior en Seguridad y Salud en el Trabajo (SG-SST) de WAPPY IA y Somos SST en Colombia.
Tu tarea es REDACTAR UN INFORME O DOCUMENTO TÉCNICO EXHAUSTIVO, RIGUROSO Y FORMAL para el Sistema de Gestión de Seguridad y Salud en el Trabajo.

## TÍTULO DEL DOCUMENTO:
${title || 'Informe Técnico SG-SST'}

## CONTEXTO CORPORATIVO DE LA EMPRESA:
${companyContext}

## REQUERIMIENTO DEL USUARIO / PROPÓSITO:
${userPrompt || title || 'Informe Técnico Especializado en SG-SST'}

${agentContext ? `## CONTEXTO DEL ESPECIALISTA / AGENTE:\n${agentContext}\n` : ''}
${screenContext ? `## CONTEXTO DE PANTALLA ACTIVA:\n${screenContext}\n` : ''}
${toolsContext ? `## DATOS DE HERRAMIENTAS PREVIAS:\n${toolsContext}\n` : ''}
${stringContent ? `## BORRADOR O BASE INICIAL SUMINISTRADA:\n${stringContent}\n` : ''}

## REGLAS TÉCNICAS OBLIGATORIAS (SG-SST COLOMBIA):
1. EXTENSIÓN Y DENSIDAD TÉCNICA: Documento formal y exhaustivo pero conciso y ágil (alrededor de 800 a 1,200 palabras de desarrollo técnico sustancial, sin rellenos redundantes).
2. MARCO LEGAL VIGENTE: Fundamenta con rigor en la legislación colombiana aplicable (Decreto Único Reglamentario 1072 de 2015 Libro 2 Parte 2 Título 4 Capítulo 6, Resolución 0312 de 2019 - Estándares Mínimos, Ley 1562 de 2012, y normas técnicas específicas como GTC 45, NTC o resoluciones sectoriales según el tema).
3. INCLUSIÓN OBLIGATORIA DE TABLAS TÉCNICAS (MÍNIMO 2 A 3 TABLAS ESTRUCTURADAS EN FORMATO MARKDOWN):
   - Cada tabla debe tener encabezados claros y 3 a 5 filas de datos realistas y coherentes con la empresa y su actividad económica.
   - TABLA 1: Diagnóstico Demográfico y Población Trabajadora Expuesta (Variables: Grupo de Edad, Género, Nivel de Escolaridad, Cargos Críticos, Sede, % Población, Horarios/Turnos).
   - TABLA 2: Matriz de Hallazgos Ocupacionales, Factores de Peligro y Efectos en Salud (Variables: Proceso/Área, Factor de Riesgo identificado, Fuente generadora, Posibles efectos en la salud, Nivel de Deficiencia/Exposición/Riesgo, Prioridad).
   - TABLA 3: Plan de Intervención Prioritaria con Jerarquía de Controles (Variables: Medida de intervención clasificada por Jerarquía [Eliminación, Sustitución, Ingeniería, Administrativo, EPP], Meta/Indicador, Responsable de Ejecución, Periodicidad/Fecha de Cumplimiento).
4. ESTRUCTURA FORMAL DEL DOCUMENTO:
   - 1. Introducción y Justificación Técnica.
   - 2. Objetivos (General y Específicos del SG-SST).
   - 3. Alcance y Población Objeto.
   - 4. Marco Normativo y Legal Aplicable (citando artículos pertinentes).
   - 5. Metodología de Evaluación y Recolección de Datos.
   - 6. Diagnóstico y Resultados Detallados (incorporando las Tablas 1 y 2).
   - 7. Plan de Acción y Jerarquía de Controles (incorporando la Tabla 3).
   - 8. Indicadores de Gestión y Seguimiento (Estructura, Proceso y Resultado).
   - 9. Conclusiones y Recomendaciones de la Consultoría Ocupacional.
5. PROHIBICIÓN DE PLACEHOLDERS: NO uses textos como "[Insertar tabla aquí]", "[Completar]", "[Definir fecha]" o "N/A". Redacta datos técnicos creíbles y representativos para el sector de la empresa.
6. FORMATO DE SALIDA: Entrega ÚNICAMENTE el texto en Markdown estructurado (con títulos #, ##, ###, viñetas, negritas y tablas markdown | ... |). NO incluyas bloques de código externos con triple comilla invertida (\`\`\`markdown ni \`\`\`), ni mensajes introductorios como "A continuación presento..." ni firmas al final (el sistema inyecta el membrete oficial y firmas automáticamente).`;

  try {
    const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
    const result = await generateWithKeyRotation(
      { model: 'gemini-3.6-flash', generationConfig: { maxOutputTokens: 3500 } },
      userId,
      prompt,
      { generationConfig: { maxOutputTokens: 3500 } }
    );
    const response = await result?.response;
    let generatedReport = response?.text ? response.text() : '';

    if (generatedReport) {
      generatedReport = generatedReport
        .replace(/^```(?:markdown|text)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    if (generatedReport && generatedReport.length > 500) {
      logger.info(
        `[CanvasTool Camino B - Text] Informe enriquecido exitosamente por gemini-3.6-flash (${generatedReport.length} caracteres).`,
      );
      return generatedReport;
    }
  } catch (err) {
    logger.error('[CanvasTool Camino B - Text] Error delegando redacción a gemini-3.6-flash, preservando contenido original:', err);
  }

  return stringContent;
}

/**
 * Canvas Tool
 * Permite al agente leer, crear y editar documentos, hojas de cálculo, diapositivas y código HTML
 * en tiempo real dentro del panel lateral de la conversación.
 */
class CanvasTool extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'canvas';
    this.description =
      'Herramienta interactiva de pantalla dividida (Canvas). Permite crear, visualizar y editar 4 tipos de lienzos/archivos interactivos:\n' +
      '1. Documento Word / Texto enriquecido ("text"): Úsalo cuando el usuario solicite crear un archivo en Word, redactar un documento formal descargable o abrir un lienzo de texto (ej: "crea un archivo en word", "redáctalo en un documento", "haz un word de...", "ábreme un canvas de texto").\n' +
      '2. Hoja de cálculo ("excel"): Úsalo cuando el usuario solicite crear un archivo en Excel, una hoja de cálculo, grilla de datos, tabla con fórmulas o presupuesto (ej: "crea un archivo en excel", "haz un excel", "genera una hoja de cálculo", "créame una grilla en excel").\n' +
      '3. Presentación ("presentation"): Úsalo cuando el usuario solicite crear una presentación, diapositivas, slides, charla o material de capacitación (ej: "crea una presentación", "haz diapositivas", "diseña un powerpoint", "slides en canvas").\n' +
      '4. Aplicativo interactivo ("html"): Úsalo cuando el usuario solicite crear un aplicativo, calculadora interactiva, formulario, widget, juego o simulador web (ej: "crea un aplicativo", "desarrolla un aplicativo interactivo", "haz una calculadora en html", "prototipo interactivo").\n' +
      'REGLA CRÍTICA DE DISTINCIÓN: Canvas se activa ÚNICAMENTE ante solicitudes expresas de crear o editar archivos, documentos, hojas de cálculo, presentaciones, aplicativos o lienzos ("créalo en canvas", "crea un archivo en word", "haz un excel", "crea una presentación", "crea un aplicativo", etc.). ESTÁ TERMINANTEMENTE PROHIBIDO invocar canvas para responder dudas, preguntas, conceptos técnicos, consultas normativas o explicaciones en el chat donde el usuario no haya pedido crear un archivo o lienzo (ej: "¿qué es la Resolución 1843?", "¿cuáles son los procedimientos?", "explícame las responsabilidades"); esas consultas se responden de forma inmediata y ligera en el cuerpo del chat en formato Markdown. (NOTA: Para la Matriz de Peligros IPEVR / GTC-45, usa matriz_ipevar).';
    this.req = fields.req;

    this.schema = z.object({
      accion: z
        .enum(['crear', 'actualizar', 'leer', 'editar_seccion', 'buscar_reemplazar', 'insertar'])
        .describe(
          'Acción a realizar: "crear" para inicializar un archivo nuevo; "actualizar" para modificar el contenido completo; "leer" para inspeccionar el estado actual; "editar_seccion" para editar solo una sección por su título; "buscar_reemplazar" para buscar y reemplazar texto específico; "insertar" para inyectar contenido en una posición específica.',
        ),

      fileType: z
        .enum(['text', 'excel', 'presentation', 'html'])
        .describe(
          'Tipo de archivo/lienzo del Canvas a crear o gestionar. Selecciónalo según la solicitud del usuario:\n' +
            '- "text" (Word / Documento formal en Canvas): Úsalo si el usuario solicita crear un archivo en Word, un documento formal descargable o un documento en Canvas ("crea un archivo en word", "un documento en word", "redáctalo en un word", "créalo en canvas", "ábreme un lienzo de texto").\n' +
            '- "excel" (Hoja de cálculo en Canvas): Úsalo si el usuario solicita crear un archivo en Excel, una hoja de cálculo, tabla con fórmulas o presupuesto ("crea un archivo en excel", "haz un excel", "en una hoja de cálculo", "un excel de..."). (Para Matriz IPEVAR / GTC-45, usa matriz_ipevar).\n' +
            '- "presentation" (Presentación / Diapositivas en Canvas): Úsalo si el usuario solicita crear una presentación, diapositivas o material de capacitación ("crea una presentación", "haz diapositivas", "diseña una presentación", "powerpoint", "slides").\n' +
            '- "html" (Aplicativo interactivo / Código en Canvas): Úsalo si el usuario solicita crear un aplicativo, calculadora, simulador, formulario interactivo o código web ("crea un aplicativo", "un aplicativo interactivo", "una calculadora en html", "desarrolla un aplicativo").\n' +
            'IMPORTANTE: NUNCA uses ningún fileType si el usuario solo hace una pregunta o pide una explicación ordinaria en el chat.',
        ),

      title: z
        .string()
        .optional()
        .describe('Título del documento o archivo. Obligatorio al crear o renombrar.'),

      content: z
        .any()
        .optional()
        .describe(
          'Contenido principal del archivo. OBLIGATORIO al crear o actualizar completamente. Si usas acciones parciales o "leer", envía un string vacío o no lo envíes.\n' +
            '- Para "text" y "html": una cadena de texto (Markdown, HTML enriquecido o código HTML/CSS plano).\n' +
            '- Para "excel": un JSON stringificado o array bidimensional directo representando la grilla, ej: [["Col1", "Col2"], ["Dato1", "Dato2"]].\n' +
            '- Para "presentation": un JSON stringificado o array directo representando las diapositivas, ej: [{"title": "SST", "bullets": ["Seguridad", "Salud"]}].',
        ),

      // Para accion="editar_seccion"
      titulo_seccion: z
        .string()
        .optional()
        .describe(
          'Título exacto (o fragmento) de la sección a editar. El sistema buscará el bloque de texto o etiqueta de encabezado bajo ese título y lo reemplazará. Requerido para accion="editar_seccion". Solo para fileType="text" o fileType="html".',
        ),

      nuevo_contenido_seccion: z
        .string()
        .optional()
        .describe(
          'Nuevo contenido HTML/Markdown para reemplazar la sección identificada por titulo_seccion. Requerido para accion="editar_seccion". Solo para fileType="text" o fileType="html".',
        ),

      // Para accion="buscar_reemplazar"
      buscar: z
        .string()
        .optional()
        .describe(
          'Texto exacto o fragmento a buscar en el documento. Requerido para accion="buscar_reemplazar". Solo para fileType="text" o fileType="html".',
        ),

      reemplazar: z
        .string()
        .optional()
        .describe(
          'Texto o HTML que reemplazará al encontrado. Requerido para accion="buscar_reemplazar". Solo para fileType="text" o fileType="html".',
        ),

      reemplazar_todo: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          'Si true (por defecto), reemplaza todas las ocurrencias. Si false, solo la primera.',
        ),

      // Para accion="insertar"
      posicion: z
        .enum(['inicio', 'fin', 'despues_de'])
        .optional()
        .describe(
          'Dónde insertar: "inicio" = al principio, "fin" = al final (para html se inserta de forma inteligente antes de la etiqueta body/html), "despues_de" = después del texto indicado en "insertar_despues_de_texto". Solo para fileType="text" o fileType="html".',
        ),

      insertar_contenido: z
        .string()
        .optional()
        .describe(
          'Contenido HTML/Markdown a insertar. Requerido para accion="insertar". Solo para fileType="text" o fileType="html".',
        ),

      insertar_despues_de_texto: z
        .string()
        .optional()
        .describe(
          'Texto o fragmento de título después del cual se insertará el nuevo contenido. Solo cuando posicion="despues_de".',
        ),
    });
  }

  async _call(input, runManager) {
    try {
      const conversationId =
        runManager?.configurable?.thread_id ||
        runManager?.metadata?.thread_id ||
        this.req?.body?.conversationId;

      if (!conversationId || conversationId === 'new') {
        return JSON.stringify({
          error:
            'No se encontró un ID de conversación válido. Asegúrate de que el chat esté iniciado.',
        });
      }

      const userId = this.req?.user?.id;
      const userRole = this.req?.user?.role;
      const isPro = userRole === 'ADMIN' || userRole === 'USER_PRO';
      let companyInfo = null;
      if (userId) {
        companyInfo =
          (await CompanyInfo.findOne({ user: userId, isActive: true })) ||
          (await CompanyInfo.findOne({ user: userId }));
      }

      const {
        accion,
        fileType,
        title,
        content,
        titulo_seccion,
        nuevo_contenido_seccion,
        buscar,
        reemplazar,
        reemplazar_todo,
        posicion,
        insertar_contenido,
        insertar_despues_de_texto,
      } = input;

      // ── LEER ────────────────────────────────────────────────────────────────
      if (accion === 'leer') {
        const session = await CanvasSession.findOne({ conversationId });
        if (!session) {
          return JSON.stringify({
            mensaje:
              'El Canvas está vacío. Puedes crear un nuevo archivo utilizando accion="crear".',
            content: '',
            title: 'Archivo sin título',
            fileType: 'text',
          });
        }

        let displayContent = session.content;

        return JSON.stringify({
          mensaje: 'Canvas leído correctamente.',
          title: session.title,
          fileType: session.fileType,
          version: session.version,
          content: displayContent,
        });
      }

      // ── CREAR / ACTUALIZAR ──────────────────────────────────────────────────
      if (accion === 'crear') {
        if (!content || (typeof content === 'string' && !content.trim())) {
          return JSON.stringify({
            error: 'No se puede crear un Canvas vacío. Debes proporcionar el contenido del archivo o aplicativo.',
          });
        }
      }

      let session = await CanvasSession.findOne({ conversationId });
      const isWriteAction = [
        'crear',
        'actualizar',
        'editar_seccion',
        'buscar_reemplazar',
        'insertar',
      ].includes(accion);
      if (isWriteAction && session) {
        if (!isPro && (session.aiRewriteCount || 0) >= 3) {
          return JSON.stringify({
            error:
              'Límite de Ediciones IA alcanzado. Has reescrito este documento con IA 3 veces en este chat (límite del Plan Gratuito). Adquiere el Plan Pro para obtener reescrituras ilimitadas.',
          });
        }
      }
      let parsedContent = content;
      let activeTitle = title || (session ? session.title : 'Archivo sin título');

      // --- Dynamic Title Extraction ---
      if (
        (accion === 'crear' || accion === 'actualizar') &&
        (fileType === 'text' || (session && session.fileType === 'text')) &&
        typeof parsedContent === 'string'
      ) {
        const isDefaultTitle = (t) =>
          !t ||
          t === 'Archivo sin título' ||
          t === 'Archivo de Canvas sin título' ||
          t === 'DOCUMENTO DE TRABAJO' ||
          t.trim() === '';
        if (isDefaultTitle(activeTitle)) {
          const match = parsedContent.match(/<(h[12])\b[^>]*>(.*?)<\/\1>/i);
          if (match) {
            const extractedTitle = match[2].replace(/<[^>]*>/g, '').trim();
            if (extractedTitle) {
              activeTitle = extractedTitle;
              parsedContent = parsedContent.replace(match[0], '');
              // Clean up leading spaces or empty tags
              parsedContent = parsedContent.replace(
                /^\s*(?:<p>\s*<br\s*\/?>\s*<\/p>|<p>\s*<\/p>|\s)+/i,
                '',
              );
            }
          }
        }
      }
      // ---------------------------------

      // Si es excel o presentation, intentar parsear el JSON de forma segura (aceptando strings u objetos directos)
      if (fileType === 'excel' || fileType === 'presentation') {
        try {
          if (content) {
            if (typeof content === 'string') {
              parsedContent = JSON.parse(content);
            } else {
              parsedContent = content;
            }
          }
        } catch (e) {
          return JSON.stringify({
            error:
              'El campo "content" debe ser un JSON stringificado válido para los tipos "excel" y "presentation".',
            detalles: e.message,
          });
        }
      }

      if (accion === 'crear') {
        if (session) {
          // Si ya existe, nos comportamos como actualizar para no destruir el historial del usuario
          const activeFileType = fileType || session.fileType;

          // Safety Check: Prevent overwriting a larger text/html document with a very short one
          if (
            (activeFileType === 'text' || activeFileType === 'html') &&
            session.content &&
            parsedContent &&
            session.content.length > 800 &&
            parsedContent.length < session.content.length * 0.6
          ) {
            return JSON.stringify({
              error: `El Canvas ya contiene un documento de mayor tamaño (${session.content.length} caracteres) y estás intentando sobrescribirlo completamente con un contenido mucho más corto (${parsedContent.length} caracteres). Para evitar perder información o el diseño de la plantilla preestablecida, DEBES usar acciones granulares como "buscar_reemplazar", "editar_seccion" o "insertar" en lugar de "actualizar"/"crear".`,
            });
          }

          if (activeFileType === 'text') {
            parsedContent = await processTextReportDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              session.content,
            );
            parsedContent = await processTextDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              session.content,
            );
          } else if (activeFileType === 'html') {
            parsedContent = await processHtmlAppDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              session.content,
            );
          }

          const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
          const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
          const newHistoryItem = {
            version: nextVersion,
            content: parsedContent ?? session.content,
            title: activeTitle,
            fileType: activeFileType,
            updatedAt: new Date(),
          };

          const maxHistory = isPro ? 20 : 5;
          const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

          session.content = parsedContent ?? session.content;
          session.title = activeTitle;
          session.fileType = activeFileType;
          session.version = nextVersion;
          session.history = updatedHistory;
          if (!isPro) {
            session.aiRewriteCount = (session.aiRewriteCount || 0) + 1;
          }
          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text o html
          if (activeFileType === 'text' || activeFileType === 'html') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `La sesión de Canvas ya existía. Se actualizó el archivo a la versión ${session.version} (preservando el historial).`,
            title: session.title,
            version: session.version,
          });
        } else {
          // Si no existe, crear de cero con versión 1
          if (fileType === 'text') {
            parsedContent = await processTextReportDocument(
              parsedContent,
              fileType,
              activeTitle,
              userId,
              this.req,
              null,
            );
            parsedContent = await processTextDocument(
              parsedContent,
              fileType,
              activeTitle,
              userId,
              null,
            );
          } else if (fileType === 'html') {
            parsedContent = await processHtmlAppDocument(
              parsedContent,
              fileType,
              activeTitle,
              userId,
              this.req,
              null,
            );
          }

          session = new CanvasSession({
            user: userId,
            conversationId,
            content: parsedContent ?? '',
            title: activeTitle,
            fileType,
            version: 1,
            history: [
              {
                version: 1,
                content: parsedContent ?? '',
                title: activeTitle,
                fileType,
                updatedAt: new Date(),
              },
            ],
          });

          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text o html
          if (fileType === 'text' || fileType === 'html') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `Archivo Canvas de tipo "${fileType}" creado exitosamente. El usuario puede verlo y descargarlo en la barra lateral derecha.`,
            title: session.title,
            version: session.version,
          });
        }
      }

      if (accion === 'actualizar') {
        if (!session) {
          // Si no existe, lo creamos automáticamente con versión 1
          const activeFileType = fileType || 'text';

          if (activeFileType === 'text') {
            parsedContent = await processTextReportDocument(
              parsedContent,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              null,
            );
            parsedContent = await processTextDocument(
              parsedContent,
              activeFileType,
              activeTitle,
              userId,
              null,
            );
          } else if (activeFileType === 'html') {
            parsedContent = await processHtmlAppDocument(
              parsedContent,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              null,
            );
          }

          session = new CanvasSession({
            user: userId,
            conversationId,
            content: parsedContent ?? '',
            title: activeTitle,
            fileType: activeFileType,
            version: 1,
            history: [
              {
                version: 1,
                content: parsedContent ?? '',
                title: activeTitle,
                fileType: activeFileType,
                updatedAt: new Date(),
              },
            ],
          });

          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text o html
          if (activeFileType === 'text' || activeFileType === 'html') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `La sesión de Canvas no existía. Se creó automáticamente con versión 1.`,
            title: session.title,
            version: session.version,
          });
        } else {
          // Si existe, lo actualizamos normalmente
          const activeFileType = fileType || session.fileType;

          // Safety Check: Prevent overwriting a larger text/html document with a very short one
          if (
            (activeFileType === 'text' || activeFileType === 'html') &&
            session.content &&
            parsedContent &&
            session.content.length > 800 &&
            parsedContent.length < session.content.length * 0.6
          ) {
            return JSON.stringify({
              error: `El Canvas ya contiene un documento de mayor tamaño (${session.content.length} caracteres) y estás intentando sobrescribirlo completamente con un contenido mucho más corto (${parsedContent.length} caracteres). Para evitar perder información o el diseño de la plantilla preestablecida, DEBES usar acciones granulares como "buscar_reemplazar", "editar_seccion" o "insertar" en lugar de "actualizar"/"crear".`,
            });
          }

          if (activeFileType === 'text') {
            parsedContent = await processTextReportDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              session.content,
            );
            parsedContent = await processTextDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              session.content,
            );
          } else if (activeFileType === 'html') {
            parsedContent = await processHtmlAppDocument(
              parsedContent ?? session.content,
              activeFileType,
              activeTitle,
              userId,
              this.req,
              session.content,
            );
          }

          const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
          const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
          const newHistoryItem = {
            version: nextVersion,
            content: parsedContent ?? session.content,
            title: activeTitle,
            fileType: activeFileType,
            updatedAt: new Date(),
          };

          const maxHistory = isPro ? 20 : 5;
          const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

          session.content = parsedContent ?? session.content;
          session.title = activeTitle;
          session.fileType = activeFileType;
          session.version = nextVersion;
          session.history = updatedHistory;
          if (!isPro) {
            session.aiRewriteCount = (session.aiRewriteCount || 0) + 1;
          }
          if (companyInfo) {
            session.companyId = companyInfo._id;
          }

          await session.save();

          // Sincronizar a LiveEditor si es tipo text o html
          if (activeFileType === 'text' || activeFileType === 'html') {
            await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
          }

          return JSON.stringify({
            success: true,
            mensaje: `Archivo Canvas actualizado correctamente a la versión ${session.version}.`,
            title: session.title,
            version: session.version,
          });
        }
      }

      // ── EDITAR SECCIÓN ────────────────────────────────────────────────────
      if (accion === 'editar_seccion') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text' && activeFileType !== 'html') {
          return JSON.stringify({
            error:
              'La acción "editar_seccion" solo está soportada para archivos de tipo "text" o "html".',
          });
        }
        if (!titulo_seccion || !nuevo_contenido_seccion) {
          return JSON.stringify({
            error:
              'Se requieren "titulo_seccion" y "nuevo_contenido_seccion" para accion="editar_seccion".',
          });
        }
        if (!session || !session.content) {
          return JSON.stringify({
            error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.',
          });
        }

        let updatedContent = session.content;
        const escapedTitle = titulo_seccion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Match heading containing the title text + everything until next heading or end
        const sectionRegex = new RegExp(
          `(<h[1-6][^>]*>[^<]*${escapedTitle}[^<]*</h[1-6]>)(.*?)(?=<h[1-6]|$)`,
          'is',
        );
        const match = sectionRegex.exec(updatedContent);

        if (!match) {
          return JSON.stringify({
            error: `No se encontró una sección con el título o coincidencia "${titulo_seccion}". Verifica que el título exista en el documento.`,
          });
        }

        updatedContent = updatedContent.replace(
          sectionRegex,
          match[1] + '\n' + nuevo_contenido_seccion + '\n',
        );

        updatedContent = await processTextDocument(
          updatedContent,
          activeFileType,
          activeTitle,
          userId,
          session.content,
        );

        const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
        const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          fileType: activeFileType,
          updatedAt: new Date(),
        };

        const maxHistory = isPro ? 20 : 5;
        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;
        if (!isPro) {
          session.aiRewriteCount = (session.aiRewriteCount || 0) + 1;
        }
        if (companyInfo) {
          session.companyId = companyInfo._id;
        }

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Sección "${titulo_seccion}" actualizada en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
        });
      }

      // ── BUSCAR Y REEMPLAZAR ───────────────────────────────────────────────
      if (accion === 'buscar_reemplazar') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text' && activeFileType !== 'html') {
          return JSON.stringify({
            error:
              'La acción "buscar_reemplazar" solo está soportada para archivos de tipo "text" o "html".',
          });
        }
        if (!buscar || reemplazar === undefined) {
          return JSON.stringify({
            error: 'Se requieren "buscar" y "reemplazar" para accion="buscar_reemplazar".',
          });
        }
        if (!session || !session.content) {
          return JSON.stringify({
            error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.',
          });
        }

        const flags = reemplazar_todo !== false ? 'gi' : 'i';
        const searchRegex = new RegExp(buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        const matches = (session.content.match(searchRegex) || []).length;

        if (matches === 0) {
          return JSON.stringify({ error: `No se encontró el texto "${buscar}" en el documento.` });
        }

        let updatedContent = session.content.replace(searchRegex, reemplazar);
        updatedContent = await processTextDocument(
          updatedContent,
          activeFileType,
          activeTitle,
          userId,
          session.content,
        );

        const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
        const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          fileType: activeFileType,
          updatedAt: new Date(),
        };

        const maxHistory = isPro ? 20 : 5;
        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;
        if (!isPro) {
          session.aiRewriteCount = (session.aiRewriteCount || 0) + 1;
        }
        if (companyInfo) {
          session.companyId = companyInfo._id;
        }

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Se reemplazaron ${matches} ocurrencia(s) de "${buscar}" por "${reemplazar}" en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
          reemplazos: matches,
        });
      }

      // ── INSERTAR ──────────────────────────────────────────────────────────
      if (accion === 'insertar') {
        const activeFileType = fileType || (session ? session.fileType : 'text');
        if (activeFileType !== 'text' && activeFileType !== 'html') {
          return JSON.stringify({
            error:
              'La acción "insertar" solo está soportada para archivos de tipo "text" o "html".',
          });
        }
        if (!insertar_contenido || !posicion) {
          return JSON.stringify({
            error: 'Se requieren "insertar_contenido" y "posicion" para accion="insertar".',
          });
        }
        if (!session || !session.content) {
          return JSON.stringify({
            error: 'El Canvas está vacío o no existe. Usa accion="crear" primero.',
          });
        }

        const currentContent = session.content || '';
        let updatedContent;

        if (posicion === 'inicio') {
          updatedContent = insertar_contenido + '\n' + currentContent;
        } else if (posicion === 'fin') {
          if (activeFileType === 'html') {
            // Inserción inteligente al final en HTML (antes de body o html close tags)
            const bodyCloseIndex = currentContent.lastIndexOf('</body>');
            const htmlCloseIndex = currentContent.lastIndexOf('</html>');
            const index =
              bodyCloseIndex !== -1 ? bodyCloseIndex : htmlCloseIndex !== -1 ? htmlCloseIndex : -1;
            if (index !== -1) {
              updatedContent =
                currentContent.substring(0, index) +
                '\n' +
                insertar_contenido +
                '\n' +
                currentContent.substring(index);
            } else {
              updatedContent = currentContent + '\n' + insertar_contenido;
            }
          } else {
            // Si tiene bloque de firmas en Word, queremos insertar ANTES del bloque de firmas.
            const sigIndex = currentContent.indexOf('<div style="margin-top: 50px;');
            const sigAlternativeIndex = currentContent.indexOf('<div style="margin-top:50px;');
            const index =
              sigIndex !== -1 ? sigIndex : sigAlternativeIndex !== -1 ? sigAlternativeIndex : -1;

            if (index !== -1) {
              updatedContent =
                currentContent.substring(0, index) +
                '\n' +
                insertar_contenido +
                '\n\n' +
                currentContent.substring(index);
            } else {
              updatedContent = currentContent + '\n' + insertar_contenido;
            }
          }
        } else if (posicion === 'despues_de') {
          if (!insertar_despues_de_texto) {
            return JSON.stringify({
              error: '"insertar_despues_de_texto" es requerido cuando posicion="despues_de".',
            });
          }
          const escapedRef = insertar_despues_de_texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const refRegex = new RegExp(`(${escapedRef}.*?(?:</[^>]+>))`, 'i');
          if (!refRegex.test(currentContent)) {
            return JSON.stringify({
              error: `No se encontró el texto de referencia "${insertar_despues_de_texto}" en el documento.`,
            });
          }
          updatedContent = currentContent.replace(refRegex, `$1\n${insertar_contenido}`);
        } else {
          return JSON.stringify({
            error: 'Posición inválida. Usa "inicio", "fin" o "despues_de".',
          });
        }

        updatedContent = await processTextDocument(
          updatedContent,
          activeFileType,
          activeTitle,
          userId,
          session.content,
        );

        const maxHistoryVersion = (session.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
        const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
        const newHistoryItem = {
          version: nextVersion,
          content: updatedContent,
          title: activeTitle,
          fileType: activeFileType,
          updatedAt: new Date(),
        };

        const maxHistory = isPro ? 20 : 5;
        const updatedHistory = [...(session.history || []), newHistoryItem].slice(-maxHistory);

        session.content = updatedContent;
        session.title = activeTitle;
        session.version = nextVersion;
        session.history = updatedHistory;
        if (!isPro) {
          session.aiRewriteCount = (session.aiRewriteCount || 0) + 1;
        }
        if (companyInfo) {
          session.companyId = companyInfo._id;
        }

        await session.save();

        await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);

        return JSON.stringify({
          success: true,
          mensaje: `Contenido insertado correctamente en posición "${posicion}" en el Canvas (versión ${session.version}).`,
          title: session.title,
          version: session.version,
        });
      }

      return JSON.stringify({ error: `Acción desconocida: "${accion}".` });
    } catch (error) {
      console.error('[Canvas Tool] Error:', error);
      return JSON.stringify({
        error: 'Ocurrió un error al procesar la acción de Canvas.',
        details: error.message,
      });
    }
  }
}

/**
 * Aplica directamente la modificación solicitada por el usuario sobre el Canvas existente.
 * Se usa como red de seguridad cuando el modelo leyó el Canvas pero terminó el turno sin escribir.
 */
async function applyCanvasModification(conversationId, userRequest, userId) {
  const session = await CanvasSession.findOne({ conversationId });
  if (!session || !session.content || !['html', 'text'].includes(session.fileType)) {
    return null;
  }
  const existing = String(session.content);
  const prompt = `Eres un desarrollador experto. Aplica EXACTAMENTE la siguiente modificación solicitada por el usuario al documento ${session.fileType === 'html' ? 'HTML (aplicativo single-file con Tailwind; si piden gráficas usa Chart.js vía <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> y conéctalas a los datos y a la función de render existente para que se actualicen en vivo)' : 'de texto/HTML'}.
Conserva TODO lo demás (estructura, datos, scripts, estilos, copilot).

## MODIFICACIÓN SOLICITADA:
${userRequest}

## DOCUMENTO ACTUAL:
${existing}

Responde ÚNICAMENTE con el documento completo modificado, sin bloques de markdown ni explicaciones.`;

  const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
  const result = await generateWithKeyRotation(
    { model: 'gemini-3.6-flash', generationConfig: { maxOutputTokens: 65000 } },
    userId,
    prompt,
  );
  const response = await result?.response;
  let updated = response?.text ? response.text() : '';
  updated = updated.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!updated || updated.length < existing.length * 0.6) {
    logger.warn('[CanvasTool applyCanvasModification] Resultado inválido o truncado, se conserva el original.');
    return null;
  }

  const maxHistoryVersion = (session.history || []).reduce((m, i) => Math.max(m, i.version || 0), 0);
  const nextVersion = Math.max(maxHistoryVersion, session.version || 0) + 1;
  session.content = updated;
  session.version = nextVersion;
  session.history = [
    ...(session.history || []),
    { version: nextVersion, content: updated, title: session.title, fileType: session.fileType, updatedAt: new Date() },
  ];
  session.markModified('history');
  await session.save();
  await syncCanvasToLiveEditor(conversationId, session.content, session.title, userId);
  return { title: session.title, version: nextVersion };
}

CanvasTool.processHtmlAppDocument = processHtmlAppDocument;
CanvasTool.processTextReportDocument = processTextReportDocument;
CanvasTool.syncCanvasToLiveEditor = syncCanvasToLiveEditor;
CanvasTool.applyCanvasModification = applyCanvasModification;

module.exports = CanvasTool;
