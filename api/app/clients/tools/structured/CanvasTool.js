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
 * Camino B: Generación / Enriquecimiento de Aplicativos HTML5 en Canvas usando el modelo potente (gemini-3.8-flash).
 * Si el agente orquestador (ej. gemini-3.5-flash-lite) llama a Canvas con fileType='html',
 * esta función transfiere la memoria del chat, los datos de la empresa y los resultados de las herramientas previas
 * (ej. la hoja de Google Sheets creada en este mismo turno) para que gemini-3.8-flash sintetice la aplicación interactiva.
 * La rotación recorre la escalera completa: gemini-3.8-flash -> 3.7 -> 3.6 -> 3.5 -> 3.5-flash-lite.
 */
async function processHtmlAppDocument(content, fileType, title, userId, req, existingContent) {
  if (fileType !== 'html') {
    return content;
  }

  let stringContent = typeof content === 'string' ? content.trim() : (content ? String(content) : '');

  // 1. Si ya es un aplicativo HTML completo y robusto que sigue el estándar oficial WAPPY (skill-formatos-sst),
  // preservarlo directamente sin re-generar para evitar sobrecargas o roturas:
  const isAlreadyStandardWappyApp =
    stringContent.length > 1500 &&
    (stringContent.includes('gradient-banner') || stringContent.includes('glass-card') || stringContent.includes('WappySSTDb')) &&
    (stringContent.includes('</html>') || stringContent.includes('</body>'));

  if (isAlreadyStandardWappyApp) {
    logger.info('[CanvasTool Camino B] El contenido ya es un aplicativo HTML conforme a skill-formatos-sst. Preservando intacto.');
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

  const compName = companyInfo?.companyName || 'Empresa Activa';
  const compNit = companyInfo?.nit || '901.437.310';
  const compArl = companyInfo?.arl || 'Positiva Compañía de Seguros';
  const compWorkers = Number(companyInfo?.workerCount || companyInfo?.totalWorkers || 50);
  const compRisk = companyInfo?.riskLevel || 'Clase I';
  const compSector = companyInfo?.economicActivity || companyInfo?.economicSector || 'Servicios / General';

  const companyContext = `Empresa: ${compName}
NIT: ${compNit}
ARL: ${compArl}
Trabajadores: ${compWorkers}
Riesgo: ${compRisk}
Sector/Actividad: ${compSector}`;

  const prompt = `Eres el Arquitecto de Frontend y Especialista Técnico en SG-SST de WAPPY.
Tu tarea es construir un APLICATIVO WEB INTERACTIVO COMPLETO (Single-File HTML5) para proyectar en el Canvas lateral de WAPPY, cumpliendo ESTRICTAMENTE con la especificación de "skill-formatos-sst.md".

## TÍTULO DEL APLICATIVO:
${title || 'Aplicativo Interactivo SG-SST'}

## CONTEXTO DE LA EMPRESA ACTIVA:
${companyContext}

## REQUERIMIENTO DEL USUARIO:
${userPrompt || title || 'Aplicativo interactivo para gestión de indicadores o procesos SG-SST'}

${toolsContext ? `## RECURSOS Y BASES DE DATOS VINCULADAS EN ESTA SESIÓN (GOOGLE SHEETS / HERRAMIENTAS):\n${toolsContext}\n` : ''}

${stringContent ? `## ESPECIFICACIONES O BASE SUMINISTRADA:\n${stringContent}\n` : ''}

## REGLAS DE DISEÑO Y ESTRUCTURA OBLIGATORIAS (WAPPY STANDARD - skill-formatos-sst.md):
1. ESTRUCTURA VISUAL ENCABEZADO OFICIAL WAPPY (OBLIGATORIO NUNCA CAMBIAR):
   - BLOQUE 1: Banner Superior Gradiente:
     <div class="gradient-banner bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg ...">
       Incluye el selector de logo dinámico con id="logo-upload-input", img id="logo-preview-img", título h1 id="app-document-title", subtítulo id="app-document-subtitle" y badge id="app-document-badge".
     </div>
   - BLOQUE 2: Ficha de Metadatos de la Empresa Activa:
     <div class="glass-card bg-white dark:bg-slate-900/40 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-md border-l-4 border-l-blue-500 ...">
       Muestra y permite editar: span id="company-name", span id="company-nit", span id="company-arl", span id="company-workers", span id="company-risk", span id="change-code", span id="last-updated-text".
     </div>
   - BARRA DE GOOGLE SHEETS: Si arriba hay una hoja de Google Sheets, incluye el id="wappy-sheets-sync-bar" con id="sheets-open-drive-link" apuntando al enlace directo a Drive y botón de exportar.

2. PERSISTENCIA OBLIGATORIA (IndexedDB & LocalStorage):
   - Incluye las funciones openDB(), saveGlobalLogoToDB(), loadGlobalLogoFromDB(), uploadLogoImage(), saveDocHeader().
   - Nombre de base IndexedDB: "WappySSTDb", almacén: "mediaStore", clave: "wappy_sst_global_logo".
   - LocalStorage key: "wappy_sst_doc_header".

3. ESTILOS Y LIBRERÍAS CDN:
   - Tailwind CSS (<script src="https://cdn.tailwindcss.com"></script>)
   - Chart.js (<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>)
   - Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script>) con ejecución lucide.createIcons() al cargar.

4. CALIDAD, SINTAXIS Y SEGURIDAD:
   - NUNCA inventes llamadas fetch a endpoints ficticios como /api/sheets/... que fallen en el navegador. Usa persistencia local y enlace directo a Drive.
   - Todo el código JavaScript debe estar completamente cerrado y libre de errores de sintaxis.
   - El código debe ser limpio y conciso (máximo 15,000 caracteres) para garantizar que NUNCA se corte por límites de tokens.

5. RESPUESTA:
   - Responde ÚNICAMENTE con el código HTML5 completo (desde <!DOCTYPE html> hasta </html>), sin markdown (\`\`\`html), sin explicaciones.`;

  try {
    const { generateWithKeyRotation } = require('~/server/routes/sgsst/sgsstGemini');
    logger.info('[CanvasTool Camino B] Delegando generación técnica de aplicativo HTML a gemini-3.8-flash (Rotación completa)...');
    const result = await generateWithKeyRotation('gemini-3.8-flash', userId, prompt);
    const response = await result?.response;
    let generatedHtml = response?.text ? response.text() : '';

    if (generatedHtml) {
      generatedHtml = generatedHtml
        .replace(/^```(?:html)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    // Validación estricta: debe contener etiquetas de cierre completas y el encabezado oficial de WAPPY
    const isComplete =
      generatedHtml &&
      generatedHtml.length > 1000 &&
      generatedHtml.length < 45000 &&
      (generatedHtml.includes('</html>') || generatedHtml.includes('</body>')) &&
      generatedHtml.includes('gradient-banner') &&
      (generatedHtml.includes('glass-card') || generatedHtml.includes('border-l-blue-500'));

    if (isComplete) {
      logger.info(
        `[CanvasTool Camino B] Aplicativo HTML conforme a skill-formatos-sst generado con éxito por gemini-3.8-flash (${generatedHtml.length} caracteres).`,
      );
      return generatedHtml;
    } else {
      logger.warn(
        `[CanvasTool Camino B] El HTML generado por la IA está incompleto, truncado (${generatedHtml?.length || 0} chars) o no cumple el estándar oficial WAPPY de skill-formatos-sst. Utilizando aplicativo maestro garantizado...`,
      );
    }
  } catch (err) {
    logger.error('[CanvasTool Camino B] Error delegando generación a gemini-3.8-flash, suministrando aplicativo maestro garantizado:', err);
  }

  // Fallback maestro: aplicativo 100% conforme con skill-formatos-sst.md, responsivo, con fórmulas Res. 0312, Chart.js, IndexedDB y Google Sheets
  logger.info('[CanvasTool Camino B] Suministrando aplicativo HTML interactivo oficial (skill-formatos-sst) con fórmulas de Res. 0312 y Chart.js...');
  return buildEmergencySGSSTHtmlApp({ title, userPrompt, toolsContext, companyInfo });
}

function buildEmergencySGSSTHtmlApp({ title, userPrompt, toolsContext, companyInfo }) {
  const compName = companyInfo?.companyName || 'Empresa Activa';
  const compNit = companyInfo?.nit || '901.437.310';
  const compArl = companyInfo?.arl || 'Positiva Compañía de Seguros';
  const compWorkers = Number(companyInfo?.workerCount || companyInfo?.totalWorkers || 50);
  const compRisk = companyInfo?.riskLevel || 'Clase I';
  const compActivity = companyInfo?.economicActivity || companyInfo?.economicSector || 'Servicios';
  const todayStr = new Date().toISOString().split('T')[0];
  const docTitle = title || 'Aplicativo Indicadores de Accidentalidad (Res. 0312)';

  let sheetsUrl = '';
  const searchStr = (toolsContext || '') + ' ' + (userPrompt || '');
  const urlMatch = searchStr.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/);
  if (urlMatch) {
    sheetsUrl = urlMatch[0];
  }

  const sheetsSyncBarHtml = `
    <!-- Barra de Sincronización con Google Sheets (WAPPY Real-Time Cloud) -->
    <div id="wappy-sheets-sync-bar" class="max-w-[1400px] mx-auto px-4 md:px-6 mt-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-sm text-xs text-white">
        <div class="flex items-center gap-3">
          <span id="sheets-status-indicator" class="flex items-center gap-1.5 px-3 py-1 rounded-full ${sheetsUrl ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'} font-bold text-[11px]">
            <span class="h-2 w-2 rounded-full ${sheetsUrl ? 'bg-emerald-400' : 'bg-teal-400'}"></span>
            ${sheetsUrl ? 'Google Sheets Conectado' : 'Almacenamiento Local Autónomo'}
          </span>
          <span id="sheets-status-details" class="text-slate-300 text-[11px] hidden sm:inline">
            ${sheetsUrl ? 'Sincronizado con Google Drive — Registro en tiempo real' : 'Cálculos reactivos y persistencia en navegador (IndexedDB / LocalStorage)'}
          </span>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          ${sheetsUrl ? `
          <a id="sheets-open-drive-link" href="${sheetsUrl}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-[11px]">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            Abrir en Drive
          </a>` : ''}
          <button type="button" onclick="exportCSV()" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95 text-[11px]">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            Exportar CSV
          </button>
          <button type="button" onclick="exportUpdatedHTML()" class="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-[11px]">
            <i data-lucide="file-down" class="w-3.5 h-3.5"></i>
            Descargar HTML
          </button>
        </div>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${docTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: { 50: '#f0fdfa', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' }
          }
        }
      }
    };
  </script>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");
    body { font-family: "Inter", sans-serif; }
    .glass-card { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  </style>
</head>
<body class="bg-slate-50 dark:bg-[#080c14] text-slate-800 dark:text-slate-200 min-h-screen p-3 sm:p-6 transition-colors duration-200">
  <div class="max-w-[1400px] mx-auto space-y-6">

    <!-- 🏛️ BLOQUE 1: Banner Superior Gradiente Oficial WAPPY -->
    <header class="max-w-[1400px] mx-auto pt-2">
      <div class="gradient-banner bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="absolute inset-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <path fill="currentColor" d="M47.7,-67.2C61.4,-57.1,71.5,-41.8,78.2,-24.5C84.9,-7.2,88.2,12.1,81.3,28.8C74.4,45.5,57.3,59.6,39.6,68.4C21.9,77.2,3.6,80.7,-14.2,78.7C-32,76.7,-49.3,69.2,-64.1,56.5C-78.9,43.8,-91.2,25.9,-93.8,6.8C-96.4,-12.3,-89.3,-32.6,-76.3,-48.1C-63.3,-63.6,-44.4,-74.3,-26.8,-76.6C-9.2,-78.9,7.1,-72.8,22.8,-71.8C38.5,-70.8,34,-77.3,47.7,-67.2Z" transform="translate(100 100)"></path>
          </svg>
        </div>

        <div class="flex items-center gap-5 z-10 w-full md:w-auto">
          <!-- Selector e Imagen del Logotipo Dinámico -->
          <div onclick="document.getElementById('logo-upload-input').click()" class="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 active:scale-95 transition-all shadow-inner relative overflow-hidden group shrink-0" title="Haga clic para subir logotipo">
            <img id="logo-preview-img" src="" alt="Logo" class="h-full w-full object-cover rounded-2xl absolute inset-0 z-10 hidden">
            <div id="logo-placeholder-icon" class="flex flex-col items-center justify-center text-white/80">
              <i data-lucide="image" class="w-6 h-6 mb-0.5 group-hover:scale-110 transition-transform"></i>
              <span class="text-[8px] font-black tracking-widest uppercase">LOGO</span>
            </div>
          </div>
          <input type="file" id="logo-upload-input" class="hidden" accept="image/*" onchange="uploadLogoImage()">

          <div class="flex-1 min-w-0">
            <h1 contenteditable="true" id="app-document-title" onblur="saveDocHeader()" class="text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase focus:outline-none border-b border-transparent focus:border-white/40 truncate">${docTitle}</h1>
            <h2 contenteditable="true" id="app-document-subtitle" onblur="saveDocHeader()" class="text-xs md:text-sm font-semibold tracking-wider text-teal-100 uppercase mt-1 focus:outline-none border-b border-transparent focus:border-white/40">SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO — RES. 0312 / DEC. 1072</h2>
            <p contenteditable="true" id="app-document-desc" onblur="saveDocHeader()" class="text-[10px] md:text-xs text-teal-100 mt-0.5 opacity-90 focus:outline-none border-b border-transparent focus:border-white/40">Medición y Seguimiento Estadístico de la Frecuencia, Severidad y Mortalidad Laboral</p>
          </div>
        </div>

        <div class="flex flex-col md:items-end gap-3 z-10 text-left md:text-right w-full md:w-auto shrink-0">
          <span contenteditable="true" id="app-document-badge" onblur="saveDocHeader()" class="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase focus:outline-none whitespace-nowrap">PROCESO: SG-SST | V.02</span>
        </div>
      </div>
    </header>

    <!-- 🏢 BLOQUE 2: Ficha de Metadatos de la Empresa Activa Oficial WAPPY -->
    <div class="max-w-[1400px] mx-auto">
      <div class="glass-card bg-white dark:bg-slate-900/60 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-blue-500">
        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="flex-grow">
            <div class="flex items-center gap-2 flex-wrap">
              <span contenteditable="true" id="company-name" onblur="saveDocHeader()" class="text-lg font-bold focus:outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500 text-slate-900 dark:text-white">${compName}</span>
              <span class="text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800/40">NIT</span>
              <span contenteditable="true" id="company-nit" onblur="saveDocHeader()" class="text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none border-b border-transparent hover:border-slate-300 dark:hover:border-slate-500 focus:border-blue-500">${compNit}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>ARL: <span contenteditable="true" id="company-arl" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">${compArl}</span></span>
              <span>Trabajadores: <span contenteditable="true" id="company-workers" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">${compWorkers}</span></span>
              <span>Riesgo: <span contenteditable="true" id="company-risk" onblur="saveDocHeader()" class="font-medium hover:underline focus:outline-none text-slate-700 dark:text-slate-300">${compRisk}</span></span>
              <span>Actividad: <span class="font-medium text-slate-700 dark:text-slate-300">${compActivity}</span></span>
            </p>
          </div>
        </div>
        <div class="text-left md:text-right w-full md:w-auto pt-3 md:pt-0 border-t border-slate-200 dark:border-slate-800 md:border-t-0 shrink-0">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Código del Registro</span>
          <span contenteditable="true" id="change-code" onblur="saveDocHeader()" class="text-base font-extrabold focus:outline-none hover:underline focus:border-blue-500 border-b border-transparent text-slate-900 dark:text-white">IND-SST-AT-01</span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Vigencia: <span contenteditable="true" id="last-updated-text" onblur="saveDocHeader()" class="font-medium text-slate-700 dark:text-slate-300 focus:outline-none hover:underline focus:border-blue-500 border-b border-transparent">${todayStr}</span></span>
        </div>
      </div>
    </div>

    ${sheetsSyncBarHtml}

    <!-- 📊 INDICADORES CLAVE RES. 0312 DE 2019 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Índice Frecuencia (IF)</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">Res. 0312</span>
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="kpi-if" class="text-3xl font-black text-teal-600 dark:text-teal-400">0.00</span>
          <span class="text-xs text-slate-400 font-medium">x 240k HHT</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">(Total AT / HHT) * 240.000</p>
      </div>

      <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Índice Severidad (IS)</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">Días</span>
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="kpi-is" class="text-3xl font-black text-amber-600 dark:text-amber-400">0.00</span>
          <span class="text-xs text-slate-400 font-medium">perdidos</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">((Días Incap. + Carg.) / HHT) * 240.000</p>
      </div>

      <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Proporción Mortales</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">PAM</span>
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="kpi-pam" class="text-3xl font-black text-rose-600 dark:text-rose-400">0.0%</span>
          <span class="text-xs text-slate-400 font-medium">meta: 0%</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">(AT Mortales / Total AT) * 100</p>
      </div>

      <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Tasa Accidentalidad</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">TA</span>
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="kpi-ta" class="text-3xl font-black text-indigo-600 dark:text-indigo-400">0.0%</span>
          <span class="text-xs text-slate-400 font-medium">anual</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">(Total AT / N° Trabajadores) * 100</p>
      </div>

      <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Índice Lesiones (ILI)</span>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">Magnitud</span>
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="kpi-ili" class="text-3xl font-black text-cyan-600 dark:text-cyan-400">0.00</span>
          <span class="text-xs text-slate-400 font-medium">combinado</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">(IF * IS) / 1.000</p>
      </div>
    </div>

    <!-- 📈 GRÁFICO EVOLUTIVO -->
    <div class="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Evolución Mensual: Índice de Frecuencia (IF) vs Índice de Severidad (IS)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Actualización reactiva en tiempo real al ingresar registros</p>
        </div>
        <span class="text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800/40">Reactivo</span>
      </div>
      <div class="h-64 md:h-72">
        <canvas id="indicatorsChart"></canvas>
      </div>
    </div>

    <!-- 📋 TABLA DE REGISTROS MENSUALES -->
    <div class="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h2 class="text-sm font-bold text-slate-900 dark:text-white">Registro Mensual de Accidentalidad y Horas Hombre (HHT)</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Edita los valores directamente en la tabla. Las fórmulas de la Resolución 0312 se calculan al instante.</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="addRow()" class="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            Agregar Mes
          </button>
        </div>
      </div>
      <div class="overflow-x-auto w-full" style="-webkit-overflow-scrolling: touch;">
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3">Mes</th>
              <th class="p-3 text-center">N° AT</th>
              <th class="p-3 text-center">Días Incap.</th>
              <th class="p-3 text-center">Días Cargados</th>
              <th class="p-3 text-center">HHT</th>
              <th class="p-3 text-center">AT Mortales</th>
              <th class="p-3 text-center">Trabajadores</th>
              <th class="p-3 text-center text-teal-600 dark:text-teal-400 font-black">IF (240k)</th>
              <th class="p-3 text-center text-amber-600 dark:text-amber-400 font-black">IS (240k)</th>
              <th class="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-slate-100 dark:divide-slate-800/80">
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    // --- PERSISTENCIA WAPPY IA (IndexedDB & LocalStorage) ---
    const dbName = 'WappySSTDb';
    const dbVersion = 1;
    const storeName = 'mediaStore';

    let appDocHeader = {
      companyName: "${compName}",
      companyNit: "${compNit}",
      companyArl: "${compArl}",
      companyWorkers: "${compWorkers}",
      companyRisk: "${compRisk}",
      changeCode: "IND-SST-AT-01",
      lastUpdated: "${todayStr}",
      appTitle: "${docTitle}",
      appSubtitle: "SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO — RES. 0312 / DEC. 1072",
      appDesc: "Medición y Seguimiento Estadístico de la Frecuencia, Severidad y Mortalidad Laboral",
      appBadge: "PROCESO: SG-SST | V.02",
      logoBase64: ""
    };

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    async function saveGlobalLogoToDB(logoBase64) {
      try {
        const db = await openDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        await store.put({ id: 'wappy_sst_global_logo', logoBase64: logoBase64 });
      } catch(e) { console.error("Error saving global logo to IndexedDB:", e); }
    }

    async function loadGlobalLogoFromDB() {
      try {
        const db = await openDB();
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.get('wappy_sst_global_logo');
          req.onsuccess = (e) => resolve(e.target.result ? e.target.result.logoBase64 : '');
          req.onerror = () => resolve('');
        });
      } catch(e) { console.error("Error loading global logo from IndexedDB:", e); return ''; }
    }

    function uploadLogoImage() {
      const input = document.getElementById('logo-upload-input');
      const file = input && input.files ? input.files[0] : null;
      if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
          const base64 = e.target.result;
          appDocHeader.logoBase64 = base64;
          const previewImg = document.getElementById('logo-preview-img');
          const placeholder = document.getElementById('logo-placeholder-icon');
          if (previewImg) {
            previewImg.src = base64;
            previewImg.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
          await saveGlobalLogoToDB(base64);
          saveDocHeader();
        };
        reader.readAsDataURL(file);
      }
    }

    function saveDocHeader() {
      const getVal = (id) => { const el = document.getElementById(id); return el ? el.innerText.trim() : ''; };
      appDocHeader.companyName = getVal('company-name') || appDocHeader.companyName;
      appDocHeader.companyNit = getVal('company-nit') || appDocHeader.companyNit;
      appDocHeader.companyArl = getVal('company-arl') || appDocHeader.companyArl;
      appDocHeader.companyWorkers = getVal('company-workers') || appDocHeader.companyWorkers;
      appDocHeader.companyRisk = getVal('company-risk') || appDocHeader.companyRisk;
      appDocHeader.changeCode = getVal('change-code') || appDocHeader.changeCode;
      appDocHeader.lastUpdated = getVal('last-updated-text') || appDocHeader.lastUpdated;
      appDocHeader.appTitle = getVal('app-document-title') || appDocHeader.appTitle;
      try {
        localStorage.setItem('wappy_sst_doc_header', JSON.stringify(appDocHeader));
      } catch(e) {}
    }

    // --- DATOS Y MODELO REACTIVO DE ACCIDENTALIDAD (RES. 0312) ---
    var defaultWorkers = ${compWorkers};
    var monthlyData = [
      { month: "Enero", at: 1, lostDays: 3, chargedDays: 0, hht: Math.round(defaultWorkers * 170), fatal: 0, workers: defaultWorkers },
      { month: "Febrero", at: 0, lostDays: 0, chargedDays: 0, hht: Math.round(defaultWorkers * 165), fatal: 0, workers: defaultWorkers },
      { month: "Marzo", at: 2, lostDays: 6, chargedDays: 0, hht: Math.round(defaultWorkers * 172), fatal: 0, workers: defaultWorkers }
    ];

    try {
      var savedData = localStorage.getItem('wappy_accidents_records');
      if (savedData) {
        var parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          monthlyData = parsed;
        }
      }
    } catch(e) {}

    var chartInstance = null;

    function renderTable() {
      var tbody = document.getElementById("table-body");
      if (!tbody) return;
      tbody.innerHTML = "";
      monthlyData.forEach(function(row, idx) {
        var ifVal = row.hht > 0 ? ((row.at / row.hht) * 240000).toFixed(2) : "0.00";
        var isVal = row.hht > 0 ? (((row.lostDays + row.chargedDays) / row.hht) * 240000).toFixed(2) : "0.00";
        var tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors";
        tr.innerHTML = '<td class="p-3"><input type="text" value="' + row.month + '" onchange="updateData(' + idx + ', \\'month\\', this.value)" class="w-24 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="0" value="' + row.at + '" oninput="updateData(' + idx + ', \\'at\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="0" value="' + row.lostDays + '" oninput="updateData(' + idx + ', \\'lostDays\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="0" value="' + row.chargedDays + '" oninput="updateData(' + idx + ', \\'chargedDays\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="0" value="' + row.hht + '" oninput="updateData(' + idx + ', \\'hht\\', parseFloat(this.value)||0)" class="w-24 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="0" value="' + row.fatal + '" oninput="updateData(' + idx + ', \\'fatal\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center"><input type="number" min="1" value="' + row.workers + '" oninput="updateData(' + idx + ', \\'workers\\', parseFloat(this.value)||1)" class="w-16 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center focus:bg-white dark:focus:bg-slate-800"></td>' +
          '<td class="p-3 text-center font-bold text-teal-600 dark:text-teal-400">' + ifVal + '</td>' +
          '<td class="p-3 text-center font-bold text-amber-600 dark:text-amber-400">' + isVal + '</td>' +
          '<td class="p-3 text-right"><button type="button" onclick="deleteRow(' + idx + ')" class="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40">Eliminar</button></td>';
        tbody.appendChild(tr);
      });
      recalcKPIs();
      updateChart();
      try {
        localStorage.setItem('wappy_accidents_records', JSON.stringify(monthlyData));
      } catch(e) {}
    }

    function updateData(index, field, value) {
      if (monthlyData[index]) {
        monthlyData[index][field] = value;
        renderTable();
      }
    }

    function addRow() {
      var allMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      var nextMonth = allMonths[monthlyData.length % allMonths.length] || ("Mes " + (monthlyData.length + 1));
      monthlyData.push({ month: nextMonth, at: 0, lostDays: 0, chargedDays: 0, hht: Math.round(defaultWorkers * 170), fatal: 0, workers: defaultWorkers });
      renderTable();
    }

    function deleteRow(idx) {
      if (monthlyData.length > 1) {
        monthlyData.splice(idx, 1);
        renderTable();
      }
    }

    function recalcKPIs() {
      var totalAT = 0, totalLostDays = 0, totalChargedDays = 0, totalHHT = 0, totalFatal = 0, maxWorkers = defaultWorkers;
      monthlyData.forEach(function(r) {
        totalAT += (Number(r.at) || 0);
        totalLostDays += (Number(r.lostDays) || 0);
        totalChargedDays += (Number(r.chargedDays) || 0);
        totalHHT += (Number(r.hht) || 0);
        totalFatal += (Number(r.fatal) || 0);
        if (Number(r.workers) > maxWorkers) maxWorkers = Number(r.workers);
      });

      var ifVal = totalHHT > 0 ? ((totalAT / totalHHT) * 240000) : 0;
      var isVal = totalHHT > 0 ? (((totalLostDays + totalChargedDays) / totalHHT) * 240000) : 0;
      var pamVal = totalAT > 0 ? ((totalFatal / totalAT) * 100) : 0;
      var taVal = maxWorkers > 0 ? ((totalAT / maxWorkers) * 100) : 0;
      var iliVal = (ifVal * isVal) / 1000;

      var ifEl = document.getElementById("kpi-if");
      var isEl = document.getElementById("kpi-is");
      var pamEl = document.getElementById("kpi-pam");
      var taEl = document.getElementById("kpi-ta");
      var iliEl = document.getElementById("kpi-ili");

      if (ifEl) ifEl.textContent = ifVal.toFixed(2);
      if (isEl) isEl.textContent = isVal.toFixed(2);
      if (pamEl) pamEl.textContent = pamVal.toFixed(1) + "%";
      if (taEl) taEl.textContent = taVal.toFixed(1) + "%";
      if (iliEl) iliEl.textContent = iliVal.toFixed(2);
    }

    function updateChart() {
      var chartEl = document.getElementById("indicatorsChart");
      if (!chartEl || typeof Chart === "undefined") return;
      var labels = monthlyData.map(function(r) { return r.month; });
      var ifData = monthlyData.map(function(r) { return r.hht > 0 ? parseFloat(((r.at / r.hht) * 240000).toFixed(2)) : 0; });
      var isData = monthlyData.map(function(r) { return r.hht > 0 ? parseFloat((((r.lostDays + r.chargedDays) / r.hht) * 240000).toFixed(2)) : 0; });

      if (chartInstance) { chartInstance.destroy(); }
      var ctx = chartEl.getContext("2d");
      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            { label: "IF (Índice Frecuencia)", data: ifData, backgroundColor: "rgba(13, 148, 136, 0.8)", borderColor: "rgb(13, 148, 136)", borderWidth: 1.5, borderRadius: 6 },
            { label: "IS (Índice Severidad)", data: isData, backgroundColor: "rgba(217, 119, 6, 0.8)", borderColor: "rgb(217, 119, 6)", borderWidth: 1.5, borderRadius: 6 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { family: "Inter", size: 11, weight: "bold" } } } },
          scales: {
            y: { beginAtZero: true, grid: { color: "rgba(226, 232, 240, 0.5)" } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    function exportCSV() {
      var csv = "\\uFEFFMes,Accidentes_Trabajo,Dias_Incapacidad,Dias_Cargados,HHT,AT_Mortales,Trabajadores,IF,IS\\n";
      monthlyData.forEach(function(r) {
        var ifVal = r.hht > 0 ? ((r.at / r.hht) * 240000).toFixed(2) : "0.00";
        var isVal = r.hht > 0 ? (((r.lostDays + r.chargedDays) / r.hht) * 240000).toFixed(2) : "0.00";
        csv += [r.month, r.at, r.lostDays, r.chargedDays, r.hht, r.fatal, r.workers, ifVal, isVal].join(",") + "\\n";
      });
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Indicadores_Accidentalidad_Res0312.csv";
      link.click();
    }

    function exportUpdatedHTML() {
      var htmlContent = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
      var blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Aplicativo_Indicadores_SST.html";
      link.click();
    }

    // Inicialización al cargar la ventana
    window.addEventListener('DOMContentLoaded', async function() {
      try {
        var dbLogo = await loadGlobalLogoFromDB();
        if (dbLogo) {
          appDocHeader.logoBase64 = dbLogo;
          var previewImg = document.getElementById('logo-preview-img');
          var placeholder = document.getElementById('logo-placeholder-icon');
          if (previewImg) {
            previewImg.src = dbLogo;
            previewImg.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
        }

        var savedHeader = localStorage.getItem('wappy_sst_doc_header');
        if (savedHeader) {
          var data = JSON.parse(savedHeader);
          if (data.companyName && document.getElementById('company-name')) document.getElementById('company-name').innerText = data.companyName;
          if (data.companyNit && document.getElementById('company-nit')) document.getElementById('company-nit').innerText = data.companyNit;
          if (data.companyArl && document.getElementById('company-arl')) document.getElementById('company-arl').innerText = data.companyArl;
          if (data.companyWorkers && document.getElementById('company-workers')) document.getElementById('company-workers').innerText = data.companyWorkers;
          if (data.companyRisk && document.getElementById('company-risk')) document.getElementById('company-risk').innerText = data.companyRisk;
          if (data.appTitle && document.getElementById('app-document-title')) document.getElementById('app-document-title').innerText = data.appTitle;
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
      } catch(e) {
        console.warn("Inicialización UI:", e);
      }
      renderTable();
    });
  </script>
</body>
</html>`;
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
      'Herramienta interactiva de pantalla dividida (Canvas). Úsala para crear o editar: documentos de texto enriquecidos ("text") - OBLIGATORIO para políticas, reglamentos, manuales, contratos, cartas, planes, actas, informes y cualquier documento tradicional -, hojas de cálculo ("excel"), presentaciones ("presentation") y prototipos visuales/aplicaciones interactivas ("html") - SOLO para aplicaciones, páginas o juegos interactivos. El usuario ve los cambios reflejados en tiempo real en la barra lateral derecha.';
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
          'Tipo de archivo/lienzo del Canvas a crear o gestionar. Respeta estrictamente lo que pida el usuario mapeándolo según este diccionario de variables:\n' +
            '- "text" (Word / Documento tradicional - PRIORIDAD POR DEFECTO): Úsalo si el usuario menciona: documento, word, doc, docx, redactar, escribir, política, manual, reglamento, contrato, carta, plan, acta, informe, procedimiento, guía, circular, memorando, texto, minuta, estandares, sanción, llamado de atención, descripción de cargo, perfil sociodemográfico o notificación.\n' +
            '- "excel" (Hoja de cálculo): Úsalo si el usuario menciona: excel, hoja de cálculo, hoja de calculo, tabla de datos, grilla, matriz, indicadores, accidentalidad, fórmulas, celdas, cálculo, presupuesto, listado, registro, base de datos, gráfico, cronograma, plan de trabajo, seguimiento o inventario.\n' +
            '- "presentation" (Presentación / Slides): Úsalo si el usuario menciona: presentación, presentacion, diapositivas, slides, diapos, powerpoint, ppt, pptx, exposición, capacitación, inducción, charla de 5 minutos, láminas, filminas.\n' +
            '- "html" (Prototipo HTML / Código): Úsalo si el usuario menciona: código, codigo, html, css, js, javascript, programar, desarrollar, aplicación, app, prototipo, iframe, página web, calculadora interactiva, formulario interactivo, simulador interactivo, juego o widget.',
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
            '- Para "text": una cadena de texto (Markdown, HTML enriquecido o texto estructurado).\n' +
            '- Para "html": especificaciones técnicas, fórmulas SG-SST (ej. Res. 0312), enlaces a Google Sheets o bosquejo del aplicativo. El Especialista Técnico de WAPPY ("gemini-3.8-flash") sintetizará el aplicativo HTML5 interactivo completo con Tailwind CSS y Chart.js.\n' +
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

module.exports = CanvasTool;
