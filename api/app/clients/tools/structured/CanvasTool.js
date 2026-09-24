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

  // Camino B: Siempre sintetizar o elevar el aplicativo HTML con el modelo potente (gemini-3.8-flash)
  // Cualquier código base o especificación recibida se suministra a gemini-3.8-flash como referencia.

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

  const companyContext = companyInfo
    ? `Empresa: ${companyInfo.companyName || 'Empresa Activa'}\nNIT: ${companyInfo.nit || 'Sin NIT'}\nSector: ${companyInfo.economicSector || 'General'}`
    : 'No hay información de empresa registrada.';

  const prompt = `Eres el Arquitecto de Frontend y Especialista Técnico en SG-SST de WAPPY.
Tu tarea es construir un APLICATIVO WEB INTERACTIVO COMPLETO (Single-File HTML5) para proyectar en el Canvas lateral de WAPPY.

## TÍTULO DEL APLICATIVO:
${title || 'Aplicativo Interactivo SG-SST'}

## CONTEXTO DE LA EMPRESA:
${companyContext}

## REQUERIMIENTO DEL USUARIO:
${userPrompt || title || 'Aplicativo interactivo para gestión de indicadores o procesos SG-SST'}

${toolsContext ? `## RECURSOS Y BASES DE DATOS VINCULADAS EN ESTA SESIÓN (GOOGLE SHEETS / HERRAMIENTAS):\n${toolsContext}\n` : ''}

${stringContent ? `## ESPECIFICACIONES O BASE SUMINISTRADA:\n${stringContent}\n` : ''}

## REQUISITOS TÉCNICOS Y DE DISEÑO OBLIGATORIOS:
1. Formato Single-File HTML: Embebido en un solo archivo con <!DOCTYPE html>, <html>, <head> y <body>.
2. Estilos: Incluye Tailwind CSS vía CDN (<script src="https://cdn.tailwindcss.com"></script>). Usa tipografía moderna, tarjetas con bordes suaves, sombras y diseño responsive.
3. Visualización y Gráficos: Si el aplicativo involucra métricas o indicadores, incluye Chart.js (<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>) con gráficos interactivos que se actualicen en tiempo real.
4. Interactividad JS Completa:
   - Formularios para ingresar o editar datos.
   - Cálculo automático de fórmulas (ej. Fórmulas de la Res. 0312 si es accidentalidad: IF, IS, PAM, TA, TAus).
   - Filtros por período, año o sede.
   - Tabla de datos reactiva con opción de agregar filas.
5. Conexión de Datos: Si arriba se especificó una hoja de Google Sheets, incluye el enlace directo a la hoja, muestra los encabezados correspondientes y precarga datos iniciales coherentes.
6. RESPUESTA: Responde ÚNICAMENTE con el código HTML5 completo, sin bloques de markdown con triple comilla invertida (sin \`\`\`html ni \`\`\`), sin comentarios explicativos antes ni después. Solo el código HTML directo.`;

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

    if (
      generatedHtml &&
      generatedHtml.length > 500 &&
      (generatedHtml.includes('<html') || generatedHtml.includes('<div') || generatedHtml.includes('<!DOCTYPE'))
    ) {
      logger.info(
        `[CanvasTool Camino B] Aplicativo HTML generado con éxito por gemini-3.8-flash (${generatedHtml.length} caracteres).`,
      );
      return generatedHtml;
    }
  } catch (err) {
    logger.error('[CanvasTool Camino B] Error delegando generación a gemini-3.8-flash, preservando contenido original:', err);
  }

  // Si no se pudo generar con Gemini y el contenido original no es código HTML (ej. solo son instrucciones de texto):
  if (!stringContent || (!stringContent.includes('<html') && !stringContent.includes('<!DOCTYPE') && !stringContent.includes('<div'))) {
    logger.info('[CanvasTool Camino B] Suministrando aplicativo HTML interactivo predeterminado con fórmulas de Res. 0312 y Chart.js...');
    return buildEmergencySGSSTHtmlApp({ title, userPrompt, toolsContext, companyInfo });
  }

  return stringContent;
}

function buildEmergencySGSSTHtmlApp({ title, userPrompt, toolsContext, companyInfo }) {
  const compName = companyInfo?.companyName || 'Empresa Activa';
  const compNit = companyInfo?.nit || '901.437.310';
  const compWorkers = companyInfo?.totalWorkers || 50;

  let sheetsUrl = '';
  const searchStr = (toolsContext || '') + ' ' + (userPrompt || '');
  const urlMatch = searchStr.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+/);
  if (urlMatch) {
    sheetsUrl = urlMatch[0];
  }

  const sheetsBtn = sheetsUrl
    ? '<a href="' + sheetsUrl + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>Abrir Google Sheets</a>'
    : '';

  return '<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>' + (title || 'Indicadores de Accidentalidad - Resolución 0312') + '</title>\n' +
'  <script src="https://cdn.tailwindcss.com"></script>\n' +
'  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n' +
'  <style>\n' +
'    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");\n' +
'    body { font-family: "Inter", sans-serif; }\n' +
'  </style>\n' +
'</head>\n' +
'<body class="bg-slate-50 text-slate-800 p-4 md:p-6 min-h-screen">\n' +
'  <div class="max-w-6xl mx-auto space-y-6">\n' +
'    <div class="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">\n' +
'      <div>\n' +
'        <div class="flex items-center gap-2 mb-1">\n' +
'          <span class="bg-teal-500/30 text-teal-200 border border-teal-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">SG-SST Res. 0312 de 2019</span>\n' +
'          <span class="bg-white/10 text-white/90 text-xs px-2.5 py-0.5 rounded-full font-medium">Art. 30</span>\n' +
'        </div>\n' +
'        <h1 class="text-2xl font-bold tracking-tight">' + (title || 'Tablero de Indicadores de Accidentalidad') + '</h1>\n' +
'        <p class="text-teal-100 text-sm mt-1">' + compName + ' — NIT: ' + compNit + '</p>\n' +
'      </div>\n' +
'      ' + sheetsBtn + '\n' +
'    </div>\n' +
'    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">\n' +
'      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">\n' +
'        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Índice de Frecuencia (IF)</span>\n' +
'        <div class="flex items-baseline gap-2 mt-2">\n' +
'          <span id="kpi-if" class="text-3xl font-bold text-teal-600">0.00</span>\n' +
'          <span class="text-xs text-slate-500 font-medium">x 240.000 HHT</span>\n' +
'        </div>\n' +
'        <p class="text-xs text-slate-400 mt-2">Fórmula: (N° AT mes / HHT mes) * 240.000</p>\n' +
'      </div>\n' +
'      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">\n' +
'        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Índice de Severidad (IS)</span>\n' +
'        <div class="flex items-baseline gap-2 mt-2">\n' +
'          <span id="kpi-is" class="text-3xl font-bold text-amber-600">0.00</span>\n' +
'          <span class="text-xs text-slate-500 font-medium">días perdidos</span>\n' +
'        </div>\n' +
'        <p class="text-xs text-slate-400 mt-2">Fórmula: ((Días Incap. + Cargados) / HHT) * 240.000</p>\n' +
'      </div>\n' +
'      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">\n' +
'        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proporción Mortales (PAM)</span>\n' +
'        <div class="flex items-baseline gap-2 mt-2">\n' +
'          <span id="kpi-pam" class="text-3xl font-bold text-rose-600">0.0%</span>\n' +
'        </div>\n' +
'        <p class="text-xs text-slate-400 mt-2">Fórmula: (AT Mortales / Total AT) * 100</p>\n' +
'      </div>\n' +
'      <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">\n' +
'        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa Accidentalidad (TA)</span>\n' +
'        <div class="flex items-baseline gap-2 mt-2">\n' +
'          <span id="kpi-ta" class="text-3xl font-bold text-indigo-600">0.0%</span>\n' +
'        </div>\n' +
'        <p class="text-xs text-slate-400 mt-2">Fórmula: (Total AT / N° Trabajadores) * 100</p>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">\n' +
'      <div class="flex justify-between items-center mb-4">\n' +
'        <h2 class="text-base font-bold text-slate-800">Evolución Mensual (IF vs IS)</h2>\n' +
'        <span class="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Actualización reactiva</span>\n' +
'      </div>\n' +
'      <div class="h-64">\n' +
'        <canvas id="indicatorsChart"></canvas>\n' +
'      </div>\n' +
'    </div>\n' +
'    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">\n' +
'      <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">\n' +
'        <div>\n' +
'          <h2 class="text-sm font-bold text-slate-800">Registro Mensual de Accidentalidad</h2>\n' +
'          <p class="text-xs text-slate-500">Modifica los valores para calcular las fórmulas automáticamente en tiempo real</p>\n' +
'        </div>\n' +
'        <button onclick="addRow()" class="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95">\n' +
'          + Agregar Mes\n' +
'        </button>\n' +
'      </div>\n' +
'      <div class="overflow-x-auto">\n' +
'        <table class="w-full text-left text-xs text-slate-700">\n' +
'          <thead class="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">\n' +
'            <tr>\n' +
'              <th class="p-3">Mes</th>\n' +
'              <th class="p-3">N° AT</th>\n' +
'              <th class="p-3">Días Incap.</th>\n' +
'              <th class="p-3">Días Cargados</th>\n' +
'              <th class="p-3">HHT</th>\n' +
'              <th class="p-3">AT Mortales</th>\n' +
'              <th class="p-3">N° Trabajadores</th>\n' +
'              <th class="p-3 text-teal-700 font-bold">IF</th>\n' +
'              <th class="p-3 text-amber-700 font-bold">IS</th>\n' +
'              <th class="p-3 text-right">Acción</th>\n' +
'            </tr>\n' +
'          </thead>\n' +
'          <tbody id="table-body" class="divide-y divide-slate-100">\n' +
'          </tbody>\n' +
'        </table>\n' +
'      </div>\n' +
'    </div>\n' +
'  </div>\n' +
'  <script>\n' +
'    var defaultWorkers = ' + Number(compWorkers || 50) + ';\n' +
'    var monthlyData = [\n' +
'      { month: "Enero", at: 1, lostDays: 4, chargedDays: 0, hht: 8400, fatal: 0, workers: defaultWorkers },\n' +
'      { month: "Febrero", at: 0, lostDays: 0, chargedDays: 0, hht: 8200, fatal: 0, workers: defaultWorkers },\n' +
'      { month: "Marzo", at: 2, lostDays: 7, chargedDays: 0, hht: 8500, fatal: 0, workers: defaultWorkers }\n' +
'    ];\n' +
'    var chartInstance = null;\n' +
'    function renderTable() {\n' +
'      var tbody = document.getElementById("table-body");\n' +
'      if (!tbody) return;\n' +
'      tbody.innerHTML = "";\n' +
'      monthlyData.forEach(function(row, idx) {\n' +
'        var ifVal = row.hht > 0 ? ((row.at / row.hht) * 240000).toFixed(2) : "0.00";\n' +
'        var isVal = row.hht > 0 ? (((row.lostDays + row.chargedDays) / row.hht) * 240000).toFixed(2) : "0.00";\n' +
'        var tr = document.createElement("tr");\n' +
'        tr.className = "hover:bg-slate-50/80 transition-colors";\n' +
'        tr.innerHTML = \'<td class="p-3"><input type="text" value="\' + row.month + \'" onchange="updateData(\' + idx + \', \\\'month\\\', this.value)" class="w-24 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="0" value="\' + row.at + \'" oninput="updateData(\' + idx + \', \\\'at\\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="0" value="\' + row.lostDays + \'" oninput="updateData(\' + idx + \', \\\'lostDays\\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="0" value="\' + row.chargedDays + \'" oninput="updateData(\' + idx + \', \\\'chargedDays\\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="0" value="\' + row.hht + \'" oninput="updateData(\' + idx + \', \\\'hht\\\', parseFloat(this.value)||0)" class="w-20 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="0" value="\' + row.fatal + \'" oninput="updateData(\' + idx + \', \\\'fatal\\\', parseFloat(this.value)||0)" class="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3"><input type="number" min="1" value="\' + row.workers + \'" oninput="updateData(\' + idx + \', \\\'workers\\\', parseFloat(this.value)||1)" class="w-16 bg-transparent border border-slate-200 rounded px-2 py-1 text-xs text-center focus:bg-white"></td>\' +\n' +
'          \'<td class="p-3 font-bold text-teal-700">\' + ifVal + \'</td>\' +\n' +
'          \'<td class="p-3 font-bold text-amber-700">\' + isVal + \'</td>\' +\n' +
'          \'<td class="p-3 text-right"><button onclick="deleteRow(\' + idx + \')" class="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 rounded hover:bg-rose-50">Eliminar</button></td>\';\n' +
'        tbody.appendChild(tr);\n' +
'      });\n' +
'      recalcKPIs();\n' +
'      updateChart();\n' +
'    }\n' +
'    function updateData(index, field, value) {\n' +
'      monthlyData[index][field] = value;\n' +
'      renderTable();\n' +
'    }\n' +
'    function addRow() {\n' +
'      var months = ["Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];\n' +
'      var nextMonth = months[monthlyData.length % months.length] || ("Mes " + (monthlyData.length + 1));\n' +
'      monthlyData.push({ month: nextMonth, at: 0, lostDays: 0, chargedDays: 0, hht: 8000, fatal: 0, workers: defaultWorkers });\n' +
'      renderTable();\n' +
'    }\n' +
'    function deleteRow(idx) {\n' +
'      if (monthlyData.length > 1) {\n' +
'        monthlyData.splice(idx, 1);\n' +
'        renderTable();\n' +
'      }\n' +
'    }\n' +
'    function recalcKPIs() {\n' +
'      var totalAT = 0, totalLostDays = 0, totalChargedDays = 0, totalHHT = 0, totalFatal = 0, totalWorkers = 0;\n' +
'      monthlyData.forEach(function(r) {\n' +
'        totalAT += r.at;\n' +
'        totalLostDays += r.lostDays;\n' +
'        totalChargedDays += r.chargedDays;\n' +
'        totalHHT += r.hht;\n' +
'        totalFatal += r.fatal;\n' +
'        totalWorkers = Math.max(totalWorkers, r.workers);\n' +
'      });\n' +
'      var ifAnnual = totalHHT > 0 ? ((totalAT / totalHHT) * 240000).toFixed(2) : "0.00";\n' +
'      var isAnnual = totalHHT > 0 ? (((totalLostDays + totalChargedDays) / totalHHT) * 240000).toFixed(2) : "0.00";\n' +
'      var pamVal = totalAT > 0 ? ((totalFatal / totalAT) * 100).toFixed(1) : "0.0";\n' +
'      var taVal = totalWorkers > 0 ? ((totalAT / totalWorkers) * 100).toFixed(1) : "0.0";\n' +
'      var ifElem = document.getElementById("kpi-if");\n' +
'      var isElem = document.getElementById("kpi-is");\n' +
'      var pamElem = document.getElementById("kpi-pam");\n' +
'      var taElem = document.getElementById("kpi-ta");\n' +
'      if (ifElem) ifElem.textContent = ifAnnual;\n' +
'      if (isElem) isElem.textContent = isAnnual;\n' +
'      if (pamElem) pamElem.textContent = pamVal + "%";\n' +
'      if (taElem) taElem.textContent = taVal + "%";\n' +
'    }\n' +
'    function updateChart() {\n' +
'      var chartEl = document.getElementById("indicatorsChart");\n' +
'      if (!chartEl || typeof Chart === "undefined") return;\n' +
'      var labels = monthlyData.map(function(r) { return r.month; });\n' +
'      var ifData = monthlyData.map(function(r) { return r.hht > 0 ? parseFloat(((r.at / r.hht) * 240000).toFixed(2)) : 0; });\n' +
'      var isData = monthlyData.map(function(r) { return r.hht > 0 ? parseFloat((((r.lostDays + r.chargedDays) / r.hht) * 240000).toFixed(2)) : 0; });\n' +
'      if (chartInstance) { chartInstance.destroy(); }\n' +
'      var ctx = chartEl.getContext("2d");\n' +
'      chartInstance = new Chart(ctx, {\n' +
'        type: "bar",\n' +
'        data: {\n' +
'          labels: labels,\n' +
'          datasets: [\n' +
'            { label: "IF (Índice Frecuencia)", data: ifData, backgroundColor: "rgba(13, 148, 136, 0.75)", borderColor: "rgb(13, 148, 136)", borderWidth: 1.5, borderRadius: 6 },\n' +
'            { label: "IS (Índice Severidad)", data: isData, backgroundColor: "rgba(217, 119, 6, 0.75)", borderColor: "rgb(217, 119, 6)", borderWidth: 1.5, borderRadius: 6 }\n' +
'          ]\n' +
'        },\n' +
'        options: {\n' +
'          responsive: true,\n' +
'          maintainAspectRatio: false,\n' +
'          plugins: { legend: { position: "top", labels: { boxWidth: 12, font: { family: "Inter", size: 11 } } } },\n' +
'          scales: {\n' +
'            y: { beginAtZero: true, grid: { color: "rgba(226, 232, 240, 0.8)" } },\n' +
'            x: { grid: { display: false } }\n' +
'          }\n' +
'        }\n' +
'      });\n' +
'    }\n' +
'    if (document.readyState === "loading") {\n' +
'      document.addEventListener("DOMContentLoaded", renderTable);\n' +
'    } else {\n' +
'      renderTable();\n' +
'    }\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
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
