'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('@librechat/data-schemas');
const { v4: uuidv4 } = require('uuid');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const LiveEditorSession = require('~/models/LiveEditorSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { syncLiveEditorToCanvas } = require('./syncBridge');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsstGemini');
const { EModelEndpoint } = require('librechat-data-provider');
const { saveMessage, saveConvo, getMessages } = require('~/models');
const mongoose = require('mongoose');
const { buildSignatureSection } = require('./reportHeader');


async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

/**
 * GET /api/live-editor/history
 * Returns conversations tagged with the given tag(s) for agent tool history.
 * Does NOT filter by company — agent tools are chat-scoped, not company-scoped.
 * Query params:
 *   tags (string | string[]) — e.g. live-doc-{conversationId}, sgsst-live-editor
 */
router.get('/history', requireJwtAuth, async (req, res) => {
  try {
    const { Conversation } = require('~/db/models');
    if (!Conversation) {
      return res.status(500).json({ error: 'Conversation model not available' });
    }

    const rawTags = req.query.tags;
    const filterTags = rawTags
      ? (Array.isArray(rawTags) ? rawTags : [rawTags]).filter(Boolean)
      : [];

    if (filterTags.length === 0) {
      return res.status(400).json({ error: 'At least one tag is required' });
    }

    const conversations = await Conversation.find({
      user: req.user.id,
      tags: { $all: filterTags },
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
      $and: [{ $or: [{ expiredAt: null }, { expiredAt: { $exists: false } }] }],
    })
      .select('conversationId title updatedAt tags')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return res.json({ conversations: conversations || [], count: conversations?.length || 0 });
  } catch (error) {
    logger.error('[LiveEditor History] Error:', error);
    return res.status(500).json({ error: 'Error fetching agent tool history' });
  }
});


/**
 * GET /api/live-editor/:conversationId
 * Obtiene el documento activo de una conversación.
 */
router.get('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    let session = await LiveEditorSession.findOne({ conversationId, user: userId, companyId: companyId });

    // Fallback: buscar sin userId (sesiones heredadas)
    if (!session) {
      session = await LiveEditorSession.findOne({ conversationId });
      if (session && !session.user) {
        session.user = userId;
        await session.save();
      }
    }

    // Fallback: si es una conversación real y no encontramos sesión, buscamos la temporal
    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      const tempSession = await LiveEditorSession.findOne({ conversationId: tempId, user: userId });
      if (tempSession) {
        tempSession.conversationId = conversationId;
        tempSession.companyId = companyId;
        await tempSession.save();
        session = tempSession;

        // También migrar Canvas
        try {
          const CanvasSession = require('~/models/CanvasSession');
          const canvasTemp = await CanvasSession.findOne({ conversationId: tempId });
          if (canvasTemp) {
            canvasTemp.conversationId = conversationId;
            await canvasTemp.save();
          }
        } catch (canvasErr) {
          logger.error('[LiveEditor Migración Canvas] Error:', canvasErr);
        }
      }
    }

    if (!session) {
      return res.json({ content: '', fileName: 'Documento sin título', contentUpdatedAt: null });
    }

    res.json({
      content: session.content,
      fileName: session.fileName,
      contentUpdatedAt: session.contentUpdatedAt,
    });
  } catch (error) {
    logger.error('[LiveEditor GET] Error:', error);
    res.status(500).json({ error: 'Error al obtener el documento' });
  }
});

/**
 * PUT /api/live-editor/:conversationId
 * Actualiza el contenido del documento.
 * Llamado tanto por el panel React (edición manual) como por la tool EditorLive (agente).
 */
router.put('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, fileName } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    const update = {
      $set: {
        content: content ?? '',
        contentUpdatedAt: new Date(),
        companyId,
        ...(fileName ? { fileName } : {}),
      },
      $setOnInsert: { user: userId },
    };

    const session = await LiveEditorSession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      update,
      { upsert: true, new: true },
    );

    // Sincronizar hacia el Canvas
    await syncLiveEditorToCanvas(conversationId, session.content, session.fileName, userId);

    res.json({ success: true, contentUpdatedAt: session.contentUpdatedAt, fileName: session.fileName });
  } catch (error) {
    logger.error('[LiveEditor PUT] Error:', error);
    res.status(500).json({ error: 'Error al actualizar el documento' });
  }
});

/**
 * DELETE /api/live-editor/:conversationId
 * Borra el documento de la conversación (reinicio del editor).
 */
router.delete('/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const companyId = await getActiveCompanyId(req.user.id);
    await LiveEditorSession.findOneAndDelete({ conversationId, user: req.user.id, companyId: companyId });

    // También eliminamos la sesión de Canvas de tipo 'text' si corresponde
    const CanvasSession = require('~/models/CanvasSession');
    await CanvasSession.findOneAndDelete({ conversationId, fileType: 'text' });

    res.json({ success: true });
  } catch (error) {
    logger.error('[LiveEditor DELETE] Error:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

/**
 * POST /api/live-editor/ai-format-rit
 * Toma el texto o HTML de un RIT cargado por el usuario y lo formatea/organiza con IA en capítulos y artículos.
 */
router.post('/ai-format-rit', requireJwtAuth, async (req, res) => {
  try {
    const { content, fileName } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'El contenido del documento es requerido.' });
    }

    // Buscar información de la empresa para personalizar el contexto del RIT
    const companyInfo = await CompanyInfo.findOne({ user: userId, isActive: true }) || await CompanyInfo.findOne({ user: userId });
    
    let companyContext = '';
    if (companyInfo) {
      const { buildCompanyContextString } = require('./reportHeader');
      companyContext = `\nDATOS DE LA EMPRESA CONTEXTO:\n${buildCompanyContextString(companyInfo)}\n`;
    }

    const prompt = `Actúa como un abogado experto en derecho laboral corporativo en Colombia.
Tu tarea es tomar el siguiente texto o HTML extraído de un Reglamento Interno de Trabajo (RIT) preexistente cargado por el usuario, limpiarlo de ruidos de OCR o de extracción de texto (como firmas sueltas, números de página huérfanos, textos repetitivos de pie de página) y estructurarlo formal y profesionalmente de acuerdo con el Código Sustantivo del Trabajo de Colombia y la legislación laboral vigente a 2026.
${companyContext}
REQUERIMIENTOS:
1. IDIOMA: Español técnico, formal y riguroso.
2. ESTRUCTURA: Organiza el documento en Capítulos (usando etiquetas <h2>) y Artículos (usando etiquetas <h3>). Ejemplos:
   <h2>CAPÍTULO I: DISPOSICIONES GENERALES</h2>
   <h3>Artículo 1º. - Objeto</h3>
3. CONTENIDO:
   - Mantén y respeta estrictamente todas las políticas y reglas específicas suministradas por el usuario en su reglamento (horarios de trabajo, deberes, prohibiciones específicas de la empresa, faltas, escala de sanciones, etc.).
   - Optimiza y eleva la redacción de todas las cláusulas al lenguaje jurídico correspondiente.
4. FORMATO:
   - Retorna ÚNICAMENTE el código HTML limpio.
   - NO incluyas la firma o sección de firmas al final de la página (esta se agrega de manera automatizada en el frontend).
   - NO agregues etiquetas doctype, <html>, <head>, <body>, ni bloques de estilos <style>.
   - NO envuelvas la respuesta en bloques de código markdown (como \`\`\`html o \`\`\`).

DOCUMENTO A PROCESAR:
---
${content}
---`;

    logger.info(`[AI Format RIT] Iniciando formateo de RIT para usuario: ${userId}`);

    // Llamar a Gemini 3.5 Flash con rotación de claves
    const result = await generateWithKeyRotation('gemini-3.5-flash', userId, prompt);
    const response = result.response;
    let formattedHtml = response.text();

    // Sanitizar posibles bloques de código markdown devueltos
    formattedHtml = formattedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Strip out HTML document wrappers if they exist
    const bodyMatch = formattedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      formattedHtml = bodyMatch[1].trim();
    }
    formattedHtml = formattedHtml
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim();

    res.json({ success: true, content: formattedHtml });
  } catch (error) {
    logger.error('[AI Format RIT] Error:', error);
    res.status(500).json({ error: 'Falla al estructurar el RIT con IA: ' + error.message });
  }
});

/**
 * POST /api/live-editor/offline-report
 * POST /api/live-analysis/offline-report
 * Generates an HSE report from uploaded assets (images/video) and manual notes for low signal environments.
 */
router.post('/offline-report', requireJwtAuth, async (req, res) => {
  try {
    const { files, notes, template, conversationId: reqConvoId } = req.body;
    const userId = req.user.id;
    const companyId = await getActiveCompanyId(userId);

    logger.info(`[OfflineReport] Starting generation for user: ${userId}, template: ${template}`);

    let conversationId = reqConvoId;
    let isNewConversation = false;
    if (!conversationId || conversationId === 'new') {
      conversationId = uuidv4();
      isNewConversation = true;
    }

    // Determine audit target guidelines based on selected template
    let templateInstructions = "";
    const activeTemplate = (template || 'general').toLowerCase();
    if (activeTemplate === 'alturas') {
      templateInstructions = "ENFOQUE DE AUDITORÍA: Trabajo en alturas (líneas de vida, puntos de anclaje, estado del arnés y conectores, equipo de protección anticaídas certificado). Guía el análisis y la matriz de peligros para priorizar riesgos de caída a distinto nivel, sistemas de acceso y EPP especializado contra caídas.";
    } else if (activeTemplate === 'eléctrico' || activeTemplate === 'electrico') {
      templateInstructions = "ENFOQUE DE AUDITORÍA: Riesgo eléctrico (tableros eléctricos, cableado expuesto, candados y tarjetas LOTO, herramientas aisladas, EPP dieléctrico). Guía el análisis y la matriz de peligros para priorizar riesgos de choque eléctrico, arco eléctrico, quemaduras y control de energías peligrosas.";
    } else if (activeTemplate === '5s') {
      templateInstructions = "ENFOQUE DE AUDITORÍA: Orden y aseo con metodología 5S (Seiri/Clasificar, Seiton/Organizar, Seiso/Limpiar, Seiketsu/Estandarizar, Shitsuke/Disciplina, almacenamiento seguro, pasillos despejados). Enfoca el reporte en las desviaciones de orden, aseo y disciplina locativa.";
    } else if (activeTemplate === 'biomecanico_estandar') {
      templateInstructions = `ENFOQUE DE AUDITORÍA: Riesgo Biomecánico Estándar (Cualitativo) bajo la guía GTC 45. Analiza exhaustivamente posturas (prolongadas, forzadas, mantenidas, anti-gravitacionales), movimientos repetitivos y manipulación manual de cargas.
En la matriz de peligros, enfócate en el peligro Biomecánico, detallando los efectos a la salud asociados (e.g., trastornos musculoesqueléticos, fatiga muscular, lesiones lumbares). Diseña medidas de control orientadas al rediseño de puestos de trabajo, pausas activas especializadas y rotación de tareas.`;
    } else if (activeTemplate === 'biomecanico_mediapipe') {
      templateInstructions = `ENFOQUE DE AUDITORÍA: Análisis Biomecánico Cuantitativo en tiempo real asistido por Visión IA y criterios RULA/REBA.
Durante la sesión se ha registrado telemetría de ángulos articulares: Flexión de Cuello (cervical), Inclinación de Columna (tronco) y Abducción de Brazos. Las alertas críticas se disparan cuando los ángulos superan los 20° en cuello y espalda (posturas de alto riesgo ergonómico) de manera sostenida.
REQUERIMIENTO ADICIONAL OBLIGATORIO:
1. Debes incluir una sección especial titulada '<h3>4.1 Evaluación Ergonómica Cuantitativa RULA/REBA</h3>' inmediatamente después de la tabla de Matriz de Riesgos (antes de la sección 5).
2. En esa sección, inserta una tabla detallada con los ángulos promedio detectados en Cuello/Cervical, Columna/Tronco y Abducción de Brazos, clasificando su nivel de riesgo y recomendación de acción según los estándares ergonómicos RULA/REBA.
3. Analiza las imágenes o secuencias de video de evidencia capturadas, haciendo referencia explícita a la postura observada en las fotos (e.g., 'se observa al trabajador con una flexión de tronco de X grados en la captura de evidencia ergonómica').`;
    } else {
      templateInstructions = "ENFOQUE DE AUDITORÍA: Inspección general de seguridad industrial (ISO 45001 y GTC 45, orden general, señalización, ergonomía, EPP general).";
    }

    const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
    INSTRUCCIÓN DE SISTEMA:
    Eres "Wappy-Audit", Consultor Senior HSE con certificación en ISO 45001 y GTC 45. Tu especialidad es producir Informes Técnicos de Evaluación de Riesgos de MÁXIMA CALIDAD PROFESIONAL.

    ${templateInstructions}

    CONTEXTO DE LA INSPECCIÓN EN CAMPO (BAJA SEÑAL):
    El usuario ha cargado notas de campo y archivos multimedia de forma offline debido a cobertura limitada.
    Notas del Inspector:
    "${notes || 'No se ingresaron notas específicas, analiza detalladamente el material visual proporcionado.'}"

    TAREA:
    Genera un INFORME TÉCNICO EXTENSO Y DETALLADO de Evaluación de Riesgos basado en las notas de campo y los archivos multimedia adjuntos (imágenes o video).
    Sé EXHAUSTIVO. Cada sección debe tener al menos 2 párrafos de análisis profundo.

    REQUERIMIENTOS CRÍTICOS:
    1. **IDIOMA:** OBLIGATORIAMENTE EN ESPAÑOL TÉCNICO Y FORMAL.
    2. **FECHA:** Usa esta fecha: ${currentDate}.
    3. **FORMATO:** Solo HTML limpio. CERO bloques de código markdown (\`\`\`html). 
    4. **VERACIDAD VISUAL Y CONTEXTUAL:** Analiza PROFUNDAMENTE las imágenes o el video corto de 10 segundos adjuntos. El informe debe basarse estrictamente en lo que se observa en los archivos multimedia. Si se trata de un video corto, analiza la secuencia de movimientos y los posibles actos inseguros en movimiento.
    5. **EXTENSIÓN:** El informe debe ser EXTREMADAMENTE EXTENSO Y DETALLADO. Mínimo 3.000 palabras en español. Cada sección debe desarrollarse con profundidad técnica experta. Usa párrafos exhaustivamente justificados.
    6. **MATRIZ DE RIESGOS:** Mantén OBLIGATORIAMENTE un mínimo de 5 peligros. Deduce 5 riesgos especializados basados directamente en LAS IMÁGENES/VIDEO adjuntos y el tema de la conversación. JAMÁS inventes peligros genéricos si no encajan con la evidencia fotográfica/audiovisual enviada.
       - OBLIGATORIAMENTE DEBES INCLUIR en la matriz y en las medidas de control:
         1. **Riesgo Biomecánico / Ergonómico:** Analizando la postura del trabajador, silla, escritorio o movimientos repetitivos observados en la imagen/video (e.g. postura sentada prolongada frente a la pantalla, flexión de cuello, etc.).
         2. **Uso de Elementos de Protección Personal (EPP):** Analizando si el trabajador usa o no EPP adecuado según el entorno observado en las imágenes/video (e.g., gafas de seguridad, protección auditiva, respiratoria, o EPP específico para oficina/computadores como lentes con filtro de luz azul o soporte ergonómico).


    ESTRUCTURA HTML OBLIGATORIA:

    PRIMERA LÍNEA (ANTES de cualquier otro HTML, sin excepción):
    <div id="wappy-kpi" data-riesgo="[ALTO|MEDIO|BAJO]" data-accion="[Inmediata|Programada|Preventiva]" data-consecuencia="[Mortal|Incapacitante|Leve]" data-npeligros="[N]" style="display:none"></div>
    - data-riesgo: El nivel de riesgo predominante que encontraste.
    - data-accion: La acción requerida con mayor urgencia.
    - data-consecuencia: La consecuencia máxima posible de materialización del riesgo crítico (Mortal, Incapacitante o Leve).
    - data-npeligros: El número exacto de peligros que listaste en la Matriz de Riesgos (debe ser ≥ 5).

    LUEGO EL CUERPO DEL INFORME:

    <h2>Informe Técnico de Evaluación de Riesgos y Peligros</h2>
    <p><strong>Fecha de Generación:</strong> ${currentDate}</p>
    <p><strong>Modalidad:</strong> Inspección Asistida por IA - Carga Manual (Modo Baja Señal)</p>
    <p><strong>Metodología Aplicada:</strong> GTC 45 / ISO 45001 / Decreto 1072 de 2015</p>

    <h3>1. Objeto y Alcance de la Inspección</h3>
    <p>[Describe el propósito de la inspección, qué se quería evaluar, cuál es el entorno de trabajo auditado y cuáles son los límites del análisis. Mínimo 2 párrafos detallados.]</p>

    <h3>2. Descripción Exhaustiva del Entorno Analizado</h3>
    <p>[Describe con precisión técnica el entorno observado en las imágenes o video: espacio físico, condiciones ambientales, herramientas y equipos presentes, actividades en ejecución. Usa terminología HSE. Mínimo 3 párrafos.]</p>

    <h3>3. Identificación y Análisis de Actos y Condiciones Inseguras</h3>
    <p>[Analiza detalladamente cada acto inseguro y condición insegura encontrada. Para cada uno: describe el hallazgo, la norma técnica o legal que incumple, y el potencial de daño. Usa viñetas para claridad pero con descripción extensa de cada punto.]</p>
    <ul>
        <li><strong>[Hallazgo 1 - Tipo]:</strong> [Descripción detallada del acto/condición insegura, su causa raíz, consecuencias potenciales y referencia normativa incumplida]</li>
        <li><strong>[Hallazgo N - Tipo]:</strong> [Descripción detallada...]</li>
    </ul>

    <h3>4. Matriz de Identificación de Peligros y Valoración de Riesgos (GTC 45)</h3>
    <p>La siguiente matriz ha sido construida con metodología GTC 45 (Guía Técnica Colombiana), evaluando cada peligro identificado durante la inspección. El nivel de riesgo se obtiene multiplicando Nivel de Deficiencia (ND) × Nivel de Exposición (NE) = Nivel de Probabilidad (NP), y luego NP × Nivel de Consecuencia (NC) = Nivel de Riesgo (NR).</p>
    <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; text-align: left; font-size: 0.88em;">
      <thead style="background-color: #004d99; color: white;">
        <tr>
            <th style="padding: 10px 8px;">#</th>
            <th style="padding: 10px 8px;">Proceso / Zona</th>
            <th style="padding: 10px 8px;">Peligro (Descripción Técnica)</th>
            <th style="padding: 10px 8px;">Clasificación GTC 45</th>
            <th style="padding: 10px 8px;">Efectos Posibles para la Salud</th>
            <th style="padding: 10px 8px;">ND</th>
            <th style="padding: 10px 8px;">NE</th>
            <th style="padding: 10px 8px;">NC</th>
            <th style="padding: 10px 8px;">NR</th>
            <th style="padding: 10px 8px;">Nivel de Riesgo</th>
            <th style="padding: 10px 8px;">Aceptabilidad</th>
        </tr>
      </thead>
      <tbody>
        <!-- OBLIGATORIO: Genera al menos 5 filas. Para cada peligro: ND (1-10), NE (1-4), NC (10-100), NR = ND×NE×NC -->
        <tr style="background:#fff0f0;">
            <td style="padding: 8px; font-weight:bold;">1</td>
            <td style="padding: 8px;">[Zona/Proceso]</td>
            <td style="padding: 8px;">[Descripción técnica del peligro 1]</td>
            <td style="padding: 8px;">[Ej: Biomecánico / Físico / Psicosocial / Químico / Locativo / Eléctrico]</td>
            <td style="padding: 8px;">[Efectos en salud: enfermedades, lesiones posibles]</td>
            <td style="padding: 8px; text-align:center;">[ND]</td>
            <td style="padding: 8px; text-align:center;">[NE]</td>
            <td style="padding: 8px; text-align:center;">[NC]</td>
            <td style="padding: 8px; text-align:center; font-weight:bold;">[NR]</td>
            <td style="padding: 8px; font-weight:bold; color:red;">I - CRÍTICO</td>
            <td style="padding: 8px; color:red; font-weight:bold;">No aceptable</td>
        </tr>
        <!-- Agrega mínimo 4 filas más con el mismo formato -->
      </tbody>
    </table>

    <h3>5. Medidas de Intervención por Jerarquía de Controles (ISO 45001 / GTC 45)</h3>
    <p>Las medidas de control se proponen siguiendo la Jerarquía de Controles establecida en la ISO 45001 y la GTC 45: Eliminación → Sustitución → Controles de Ingeniería → Controles Administrativos → EPP.</p>
    <table border="0" style="border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; width: 100%; text-align: left; font-size: 0.88em;">
      <thead style="background-color: #004d99; color: white;">
        <tr>
            <th style="padding: 10px 8px;">Peligro / Riesgo</th>
            <th style="padding: 10px 8px;">Eliminación / Sustitución</th>
            <th style="padding: 10px 8px;">Controles de Ingeniería</th>
            <th style="padding: 10px 8px;">Controles Administrativos</th>
            <th style="padding: 10px 8px;">EPP Requerido</th>
            <th style="padding: 10px 8px;">Responsable</th>
            <th style="padding: 10px 8px;">Plazo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
            <td style="padding: 8px;">[Peligro 1]</td>
            <td style="padding: 8px;">[Medida concreta]</td>
            <td style="padding: 8px;">[Control específico]</td>
            <td style="padding: 8px;">[Procedimiento, capacitación]</td>
            <td style="padding: 8px;">[EPP específico]</td>
            <td style="padding: 8px;">[Responsable]</td>
            <td style="padding: 8px;">[Plazo]</td>
        </tr>
      </tbody>
    </table>

    <h3>6. Plan de Acción Inmediata (Riesgos Críticos y Altos)</h3>
    <p>[Acciones prioritarias de control para riesgos Nivel I y II. Mínimo 3 acciones.]</p>

    <h3>7. Análisis de Causas Raíz (Los 5 Por Qué)</h3>
    <p>[Aplica "Los 5 Por Qué" detallados para el riesgo más crítico identificado. Mínimo 2 párrafos de análisis.]</p>

    <h3>8. Conclusiones Técnicas y Dictamen Final</h3>
    <p>[Dictamen formal y conclusiones de la auditoría. Mínimo 2 párrafos.]</p>

    <h3>9. Firmas y Responsabilidades</h3>
    <p>El presente informe ha sido generado mediante carga offline asistida por Inteligencia Artificial (Wappy-Audit HSE).</p>
    `;

    const promptParts = [
      { text: prompt }
    ];

    function cleanBase64(b64String) {
      if (!b64String) return '';
      const commaIdx = b64String.indexOf(',');
      if (commaIdx !== -1) {
        return b64String.substring(commaIdx + 1);
      }
      return b64String;
    }

    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file && file.base64) {
          const cleanedData = cleanBase64(file.base64);
          promptParts.push({
            inlineData: {
              data: cleanedData,
              mimeType: file.mimeType || "image/jpeg"
            }
          });
        }
      }
    }

    // Call Gemini 3.5 Flash with key rotation
    const result = await generateWithKeyRotation('gemini-3.5-flash', userId, promptParts);
    const response = result.response;
    let reportHtml = response.text().replace(/```html/g, '').replace(/```/g, '').trim();

    // Attach dynamic signatures
    let finalSignatureHtml = '';
    try {
      const companyInfo = await CompanyInfo.findOne({ user: userId }).lean();
      let matchedWorker = null;

      if (mongoose.models.PerfilSociodemograficoData) {
        const profileData = await mongoose.models.PerfilSociodemograficoData.findOne({ user: userId }).lean();
        if (profileData && profileData.trabajadores) {
          matchedWorker = profileData.trabajadores.find(w => {
            if (w.nombre && reportHtml.includes(w.nombre)) return true;
            if (w.identificacion && reportHtml.includes(w.identificacion)) return true;
            return false;
          });
        }
      }

      if (companyInfo) {
        finalSignatureHtml = buildSignatureSection(companyInfo, matchedWorker);
      }
    } catch (err) {
      logger.error('[OfflineReport Signatures] Error:', err);
    }

    if (finalSignatureHtml) {
      reportHtml += `\\n\\n\${finalSignatureHtml}`;
    }

    // Save user notes to DB as a chat message
    const userMsgId = uuidv4();
    const userMessageData = {
      messageId: userMsgId,
      conversationId,
      text: `Inspección Carga Rápida (\${activeTemplate.toUpperCase()}): \${notes || '(Material multimedia sin notas)'}`,
      content: [{ type: 'text', text: `Inspección Carga Rápida (\${activeTemplate.toUpperCase()}): \${notes || '(Material multimedia sin notas)'}` }],
      user: userId,
      sender: 'User',
      isCreatedByUser: true,
      endpoint: EModelEndpoint.google,
      model: 'gemini-3.5-flash',
    };
    await saveMessage({ user: { id: userId } }, userMessageData, { context: 'OfflineReport - User' });

    // Save AI report message to DB
    const aiMsgId = uuidv4();
    const aiMessageData = {
      messageId: aiMsgId,
      conversationId,
      parentMessageId: userMsgId,
      sender: 'Assistant',
      text: reportHtml,
      content: [{ type: 'text', text: reportHtml }],
      isCreatedByUser: false,
      isHtmlReport: true,
      model: 'gemini-3.5-flash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await saveMessage({ user: { id: userId } }, aiMessageData, { context: 'OfflineReport - AI' });

    // Save/update conversation
    await saveConvo({ user: { id: userId } }, {
      conversationId,
      endpoint: EModelEndpoint.google,
      model: 'gemini-3.5-flash',
      title: `Inspección \${activeTemplate.toUpperCase()} - Carga Offline`,
      tags: ['sgsst-live-analysis']
    }, { context: 'OfflineReport' });

    // Update/upsert LiveEditorSession
    const update = {
      $set: {
        content: reportHtml,
        contentUpdatedAt: new Date(),
        companyId,
        fileName: `Informe de Inspección - \${activeTemplate.toUpperCase()}`,
      },
      $setOnInsert: { user: userId },
    };
    await LiveEditorSession.findOneAndUpdate(
      { conversationId, companyId },
      update,
      { upsert: true, new: true }
    );

    // Sync to Canvas
    await syncLiveEditorToCanvas(conversationId, reportHtml, `Informe de Inspección - \${activeTemplate.toUpperCase()}`, userId);

    res.json({
      success: true,
      conversationId,
      html: reportHtml
    });
  } catch (error) {
    logger.error('[OfflineReport POST] Error:', error);
    res.status(500).json({ error: 'Error al generar el informe de carga offline: ' + error.message });
  }
});

module.exports = router;
