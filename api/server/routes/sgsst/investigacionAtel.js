const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const { saveConvo } = require('~/models/Conversation');
const { saveMessage, updateMessageText, getMessages } = require('~/models/Message');
const { updateTagsForConversation } = require('~/models/ConversationTag');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

// ─── DB Model Import ─────────────────────────────────────────────────────────
const InvestigacionAtelData = require('~/models/InvestigacionAtelData');

// ─── HELPER: Gemini with model fallback ──────────────────────────────────────
async function generateWithRetry(model, promptParts) {
    const genAI = new GoogleGenerativeAI(model.apiKey);
    const currentModelName = model.model.replace('models/', '');
    const fallbackOrder = [
        'gemini-3-flash-preview',
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
    ];
    let modelsToTry = [currentModelName];
    for (const m of fallbackOrder) {
        if (m !== currentModelName) modelsToTry.push(m);
    }
    let lastError;
    for (const modelName of modelsToTry) {
        try {
            if (modelName !== currentModelName) {
                console.warn(`[InvestigacionATEL] Usando modelo de respaldo: ${modelName}`);
            }
            const fallbackModel = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: model.generationConfig || {},
            });
            return await fallbackModel.generateContent(promptParts);
        } catch (err) {
            console.warn(`[InvestigacionATEL] Falló ${modelName}: ${err.message}`);
            lastError = err;
        }
    }
    throw new Error(`Todos los modelos fallaron. Último error: ${lastError?.message}`);
}

// ─── GET /api/sgsst/investigacion-atel/data ───────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const stored = await InvestigacionAtelData.findOne({ user: req.user.id }).lean();
        if (stored) {
            return res.json({
                formData: stored.formData || {},
                equipoList: stored.equipoList || [],
                testigosList: stored.testigosList || [],
                images: stored.images || {},
            });
        }
        res.json({ formData: {}, equipoList: [], testigosList: [], images: {} });
    } catch (error) {
        logger.error('[InvestigacionATEL] Data load error:', error);
        res.status(500).json({ error: 'Error al cargar los datos del reporte.' });
    }
});

// ─── POST /api/sgsst/investigacion-atel/save ─────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { formData, equipoList, testigosList, images } = req.body;
        await InvestigacionAtelData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { formData, equipoList, testigosList, images, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[InvestigacionATEL] Data save error:', error);
        res.status(500).json({ error: 'Error al guardar los datos.' });
    }
});

// ─── POST /api/sgsst/investigacion-atel/generate ─────────────────────────────
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            formData = {},
            equipoList = [],
            testigosList = [],
            images,
            modelName,
            userName,
        } = req.body;

        const {
            tipoEvento, fechaEvento, horaEvento, lugarEvento, departamento, municipio,
            actividadMomento, descripcionHechos,
            afectadoNombre, afectadoCedula, afectadoCargo, afectadoEps, afectadoArl,
            tipoContrato, jornadaLaboral, experienciaLaboral, tiempoEnCargo,
            naturalezaLesion, parteCuerpo, diasIncapacidad, agenteCausal, consecuencias,
        } = formData;

        if (!descripcionHechos) {
            return res.status(400).json({ error: 'La descripción de los hechos es requerida para generar el informe.' });
        }

        // ── Resolve API Key ──
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[InvestigacionATEL] No user Google key:', err.message);
        }
        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }
        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }
        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        // ── Company Info ──
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci?.companyName) companyInfoBlock = buildCompanyContextString(ci);
        } catch (ciErr) {
            logger.warn('[InvestigacionATEL] Error loading company info:', ciErr.message);
        }

        // ── Image Parts ──
        const imageParts = [];
        if (images) {
            for (let i = 1; i <= 4; i++) {
                const imgKey = `foto${i}`;
                if (images[imgKey]?.startsWith('data:image/')) {
                    try {
                        const regex = /^data:(image\/[a-zA-Z]*);base64,([^"]*)$/;
                        const matches = images[imgKey].match(regex);
                        if (matches && matches.length === 3) {
                            imageParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
                        }
                    } catch (err) {
                        logger.warn(`[InvestigacionATEL] Error processing image ${i}:`, err.message);
                    }
                }
            }
        }

        const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        // ── Build Header ──
        const headerHtml = buildStandardHeader({
            title: `INFORME DE INVESTIGACIÓN DE ${tipoEvento?.toUpperCase() || 'EVENTO'} LABORAL`,
            companyInfo: loadedCompanyInfo,
            date: dateStr,
            norm: 'Resolución 1401 de 2007 — Ministerio de Protección Social',
            responsibleName: userName || req.user?.name,
        });

        // ── Format Blocks ──
        const testigosBlock = testigosList.length > 0 && testigosList[0].nombre
            ? testigosList.map((t, i) => `Testigo ${i + 1}: ${t.nombre || 'N/A'} | CC: ${t.cedula || 'N/A'} | Cargo: ${t.cargo || 'N/A'}\nVersión: "${t.testimonio || 'Sin testimonio documentado'}"`).join('\n\n')
            : 'No se documentaron testigos.';

        const equipoBlock = equipoList.length > 0 && equipoList[0].nombre
            ? equipoList.map((e) => `• ${e.nombre || 'N/A'} (CC: ${e.cedula || 'N/A'}) — ${e.rol || 'Investigador'}`).join('\n')
            : '• Equipo investigador pendiente de asignar';

        // ── Master Prompt (Resolución 1401 compliant) ──
        const systemPromptText = `Eres un experto en Investigación de Accidentes e Incidentes Laborales certificado bajo la normatividad colombiana (Resolución 1401 de 2007, Decreto 1072 de 2015).

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
"${descripcionHechos}"

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

${imageParts.length > 0 ? `*(Tienes ${imageParts.length} foto(s) de evidencia adjuntas — analízalas y refiérete a ellas en el informe)*` : ''}

════════════════════════════════════════════════════════════════════════════
📐 INSTRUCCIONES ESTRICTAS PARA GENERAR EL INFORME
════════════════════════════════════════════════════════════════════════════

Genera un INFORME DE INVESTIGACIÓN PROFESIONAL y VISUAL en HTML cumpliendo la Resolución 1401 de 2007.
El informe debe verse como un DASHBOARD TÉCNICO de alta calidad.

1. **ENCABEZADO (Obligatorio — incluye exactamente este HTML):**
${headerHtml}

2. **DESCRIPCIÓN ANALÍTICA DEL EVENTO:**
   Narra perícialmente cómo ocurrió el evento en tres momentos: ANTES, DURANTE y DESPUÉS.
   Incluye análisis de las condiciones del entorno, estado del trabajador y factores organizacionales.
   Si hay fotos, refiérete a ellas con frases como "Como se evidencia en la fotografía 1...".

3. **METODOLOGÍA 1 — 5 PORQUÉS (Diagrama Visual Tipo Cascada):**
   Crea 5 tarjetas conectadas con flechas descendentes (CSS únicamente).
   - Diseño: divs con background azul pastel oscureciendo progresivamente hacia la causa raíz.
   - La tarjeta final (Causa Raíz) en rojo/naranja destacado.
   - Usa inline styles. Cada tarjeta tiene: Pregunta → Respuesta.
   - PRECAUCIÓN: Aplica siempre color: #111 en las tarjetas con fondos claros.

4. **METODOLOGÍA 2 — DIAGRAMA DE ISHIKAWA (ESPINA DE PESCADO — ESTILO CLÁSICO OBLIGATORIO):**
   Construye el diagrama con el estilo clásico de espina de pescado: columna vertebral horizontal y espinas diagonales a ambos lados. USA EXCLUSIVAMENTE el siguiente patrón CSS para garantizar consistencia y que NUNCA se descuadre:

   **ESTRUCTURA OBLIGATORIA:**
   - Contenedor principal: \`<div style="position:relative;width:100%;padding:20px 0;font-family:inherit;">\` con título centrado.
   - Columna vertebral horizontal: \`<div style="position:relative;display:flex;align-items:center;margin:0 20px;">\` con una línea \`<div style="flex:1;height:4px;background:#1e40af;"></div>\` a la izquierda y la cabeza del pescado a la derecha.
   - **CABEZA DEL PESCADO** (el accidente, lado DERECHO): \`<div class="diagram-node" style="background:#dc2626;color:#fff;padding:16px 20px;border-radius:8px;font-weight:800;font-size:13px;text-align:center;max-width:180px;min-width:140px;border:3px solid #b91c1c;line-height:1.4;">NOMBRE DEL ACCIDENTE</div>\`
   - **ESPINAS SUPERIORES** (3 categorías arriba de la línea, conectadas con líneas diagonales): Utiliza \`<div style="position:absolute;width:2px;height:80px;background:#1e40af;transform-origin:bottom center;transform:rotate(-45deg);bottom:50%;left:XX%;"></div>\` para cada espina diagonal superior.
   - **ESPINAS INFERIORES** (3 categorías abajo): \`transform:rotate(45deg);top:50%;\`
   - **CATEGORÍAS** (en la punta de cada espina): \`<div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px 14px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;min-width:130px;">NOMBRE CATEGORÍA</div>\`
   - **CAUSAS SECUNDARIAS** (a lo largo de cada espina, texto con viñetas): \`<div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:6px 10px;border-radius:0 4px 4px 0;margin:3px 0;">- causa secundaria</div>\`

   ESTRUCTURA COMPLETA DEL HTML — COPIA EXACTAMENTE ESTA ESTRUCTURA BASE Y RELLÉNALA:

   <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;margin:24px 0;">
     <h3 style="text-align:center;color:#1e40af;margin-bottom:20px;font-size:16px;text-transform:uppercase;">DIAGRAMA DE ISHIKAWA — ANÁLISIS CAUSA-EFECTO</h3>
     <table style="width:100%;border-collapse:collapse;">
       <tr>
         <!-- FILA SUPERIOR: 3 categorías arriba -->
         <td style="width:30%;vertical-align:bottom;padding:10px;border-right:none;">
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-bottom:8px;">MANO DE OBRA</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
           <div style="text-align:right;margin-top:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(-6deg);transform-origin:right center;"></div></div>
         </td>
         <td style="width:30%;vertical-align:bottom;padding:10px;">
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-bottom:8px;">MÉTODO</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
           <div style="text-align:right;margin-top:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(-3deg);transform-origin:right center;"></div></div>
         </td>
         <td style="width:30%;vertical-align:bottom;padding:10px;">
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-bottom:8px;">MATERIAL</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
           <div style="text-align:right;margin-top:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(-1deg);transform-origin:right center;"></div></div>
         </td>
         <!-- COLUMNA VERTEBRAL + CABEZA (rowspan=2) -->
         <td rowspan="2" style="width:10%;vertical-align:middle;padding:0;">
           <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
             <div style="width:4px;background:#1e40af;flex:1;"></div>
           </div>
         </td>
         <td rowspan="2" style="width:0;vertical-align:middle;padding:10px 0;">
           <div class="diagram-node" style="background:#dc2626;color:#fff;padding:20px 16px;border-radius:8px;font-weight:800;font-size:13px;text-align:center;min-width:140px;border:3px solid #b91c1c;line-height:1.5;">[NOMBRE EVENTO/ACCIDENTE]</div>
         </td>
       </tr>
       <tr>
         <!-- FILA INFERIOR: 3 categorías abajo -->
         <td style="width:30%;vertical-align:top;padding:10px;">
           <div style="text-align:right;margin-bottom:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(6deg);transform-origin:right center;"></div></div>
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-top:8px;margin-bottom:6px;">MÁQUINA / EQUIPO</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
         </td>
         <td style="width:30%;vertical-align:top;padding:10px;">
           <div style="text-align:right;margin-bottom:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(3deg);transform-origin:right center;"></div></div>
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-top:8px;margin-bottom:6px;">ENTORNO / AMBIENTE</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
         </td>
         <td style="width:30%;vertical-align:top;padding:10px;">
           <div style="text-align:right;margin-bottom:6px;"><div style="display:inline-block;width:80%;height:2px;background:#3b82f6;transform:rotate(1deg);transform-origin:right center;"></div></div>
           <div class="diagram-node" style="background:#dbeafe;border:2px solid #3b82f6;border-radius:6px;padding:10px;font-weight:700;font-size:12px;color:#1e3a8a;text-align:center;margin-top:8px;margin-bottom:6px;">GESTIÓN / ADMINISTRACIÓN</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 1]</div>
           <div class="diagram-node" style="font-size:11px;color:#1e293b;background:#f1f5f9;border-left:3px solid #3b82f6;padding:5px 8px;border-radius:0 4px 4px 0;margin:2px 0;">• [Causa 2]</div>
         </td>
       </tr>
     </table>
   </div>

   **REGLA CRÍTICA:** REEMPLAZA TODOS los [Causa X] y [NOMBRE EVENTO] con el contenido real del accidente investigado. MANTÉN EXACTAMENTE la estructura HTML de la tabla de 2 filas x 3+2 columnas de arriba, NO la cambies a cuadrícula cuadrada.


5. **METODOLOGÍA 3 — ÁRBOL DE CAUSAS (MUY EXTENSO, PROFUNDO Y CON CONEXIONES CORRECTAS):**
   Construye un árbol descendente que muestre la cadena causal completa del accidente. ¡ESTA SECCIÓN DEBE SER MUY DETALLADA, con mínimo 4-5 niveles de profundidad!

   **TIPOS DE CONEXIONES OBLIGATORIAS (Metodología oficial INSST NTP 274/274-bis):**
   - **Relación SECUENCIAL** (un hecho causa directamente otro): Conecta UN nodo padre con UN nodo hijo. Usa una línea vertical entre ambos.
   - **Relación CONJUNCIÓN** (varios hechos simultáneos causan uno): Conecta MÚLTIPLES nodos de un mismo nivel hacia UN nodo inferior mediante líneas que convergen. Indica esto con un arco horizontal en la base que une las líneas antes de bajar.
   - **Relación DISYUNCIÓN** (un hecho con varias expresiones alternativas): Un nodo superior genera MÚLTIPLES ramas paralelas hacia abajo.

   **NOMENCLATURA GRÁFICA OFICIAL OBLIGATORIA:**
   1. **CÍRCULOS** = "Hechos Inusuales" o eventos (variaciones de la situación normal que sucedieron). CSS: \`border-radius:50%;width:130px;height:130px;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;text-align:center;border:3px solid #334155;flex-shrink:0;font-size:11px;font-weight:600;color:#111;\`
   2. **CUADRADOS/RECTÁNGULOS** = "Hechos Permanentes" o condiciones de base (cosas que siempre existen en el sistema). CSS: \`border-radius:6px;padding:14px 18px;text-align:center;border:3px solid #334155;font-size:12px;font-weight:600;color:#111;min-width:160px;\`


   Patrón base de conectores (usa siempre este patrón CSS puro):

   <!-- Contenedor de un nivel con nodo padre -->
   <div style="display:flex;flex-direction:column;align-items:center;">
     [NODO PADRE - círculo o cuadrado]
     <!-- Línea vertical descendente -->
     <div style="width:2px;height:30px;background:#475569;"></div>
     <!-- Si hay múltiples hijos: barra horizontal conectora -->
     <div style="display:flex;align-items:flex-start;gap:40px;position:relative;">
       <!-- Línea horizontal que une los hijos -->
       <div style="position:absolute;top:0;left:0;right:0;height:2px;background:#475569;"></div>
       <!-- Cada hijo tiene su línea vertical y luego el nodo -->
       <div style="display:flex;flex-direction:column;align-items:center;">
         <div style="width:2px;height:20px;background:#475569;"></div>
         [NODO HIJO]
       </div>
       <div style="display:flex;flex-direction:column;align-items:center;">
         <div style="width:2px;height:20px;background:#475569;"></div>
         [NODO HIJO 2]
       </div>
     </div>
   </div>

   - Cadena Visual del árbol: CONSECUENCIA (rectángulo rojo/naranja arriba) → HECHOS DIRECTOS (círculos) → CAUSAS INMEDIATAS (rectángulos: Actos Inseguros + Condiciones Inseguras) → CAUSAS BÁSICAS (rectángulos: Factores Personales + Factores de Trabajo) → CAUSA RAÍZ (rectángulo verde/rojo profundo al fondo, el más importante).

   - Utiliza \`class="diagram-node"\` en TODAS las figuras (Círculos y Cuadros) obligatoriamente.
   - PRECAUCIÓN: El texto interior de los cuadros/círculos siempre debe ser oscuro (\`color:#111\`) para asegurar su lectura. Nunca texto blanco sobre fondo amarillo o claro.
   - Paleta recomendada: Naranja/Rojo para consecuencias, Beige/Amarillo para causas intermedias, Verde oscuro o Teal para causa raíz.

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
- La presentación debe ser de nivel PROFESIONAL y causar impacto visual al director de SST.
`;

        // ── Generate ──
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const selectedModelName = modelName || 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({
            model: selectedModelName,
            generationConfig: { maxOutputTokens: 65000, temperature: 0.65 },
        });

        const parts = [systemPromptText, ...imageParts];

        console.log(`[InvestigacionATEL] Generando informe. Modelo: ${selectedModelName}`);

        const generateWithTimeout = async (mod, prmpt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación superó el tiempo límite.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await generateWithRetry(mod, prmpt);
                const genResponse = await genResult.response;
                return genResponse.text();
            })();
            return Promise.race([genPromise, timeoutPromise]);
        };

        const resultText = await generateWithTimeout(model, parts);

        let cleanedReport = resultText
            .replace(/```html/g, '')
            .replace(/```/g, '')
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .trim();

        if (loadedCompanyInfo) {
            // ── Equipo investigador (from equipoList) ───────────────────────
            const jefeInmediato = equipoList.find(e =>
                (e.rol || '').toLowerCase().includes('jefe') || (e.rol || '').toLowerCase().includes('supervisor')
            );
            const copasst = equipoList.find(e =>
                (e.rol || '').toLowerCase().includes('copasst') || (e.rol || '').toLowerCase().includes('vig')
            );
            const sig1Name = (jefeInmediato?.nombre || 'Jefe Inmediato / Supervisor').toUpperCase();
            const sig1CC   = jefeInmediato?.cedula ? 'CC. ' + jefeInmediato.cedula : '';
            const sig2Name = (copasst?.nombre || 'Representante COPASST').toUpperCase();
            const sig2CC   = copasst?.cedula ? 'CC. ' + copasst.cedula : '';

            // ── Empresa (from companyInfo) ──────────────────────────────────
            const responsible   = (loadedCompanyInfo.responsibleSST || 'Responsable SG-SST').toUpperCase();
            const license       = loadedCompanyInfo.licenseNumber || '';
            const licenseExpiry = loadedCompanyInfo.licenseExpiry ? ' — Vence: ' + loadedCompanyInfo.licenseExpiry : '';
            const legalRep      = (loadedCompanyInfo.legalRepresentative || 'Representante Legal').toUpperCase();
            const companyName   = loadedCompanyInfo.companyName || '';

            // ── Trabajador afectado ─────────────────────────────────────────
            const workerName  = formData?.afectadoNombre ? formData.afectadoNombre.toUpperCase() : 'TRABAJADOR AFECTADO';
            const workerCC    = formData?.afectadoCedula ? 'CC. ' + formData.afectadoCedula : '';
            const workerCargo = formData?.afectadoCargo || '';

            // ── Testigos (max 3) ────────────────────────────────────────────
            const validTestigos = (testigosList || []).filter(t => t.nombre && t.nombre.trim() !== '').slice(0, 3);

            // ── Inline styles ───────────────────────────────────────────────
            const sigBox  = 'border-bottom:2px solid #333;width:85%;margin:0 auto 8px auto;min-height:70px;display:flex;align-items:center;justify-content:center;background-color:#f9f9f9;cursor:pointer;border-radius:8px 8px 0 0;transition:all 0.3s ease;';
            const sigNm   = 'font-weight:800;font-size:12px;color:#1e293b;text-transform:uppercase;';
            const sigSb   = 'font-size:11px;color:#64748b;font-weight:600;margin-top:2px;';
            const sigIn   = 'font-size:10px;color:#94a3b8;margin-top:1px;';
            const tdS     = 'width:33.33%;padding:14px 10px;text-align:center;vertical-align:bottom;';
            const lbl     = 'color:#999;font-size:10px;';

            const buildHtmlSigs = (signaturesArray) => {
                let html = '<table style="width:100%;border-collapse:collapse;margin-bottom:28px;"><tr>';
                for (let i = 0; i < signaturesArray.length; i++) {
                    if (i > 0 && i % 3 === 0) html += '</tr><tr>';
                    html += signaturesArray[i];
                }
                const remainder = signaturesArray.length % 3;
                if (remainder > 0) {
                    html += Array(3 - remainder).fill('<td style="' + tdS + '"></td>').join('');
                }
                html += '</tr></table>';
                return html;
            };

            const buildSigCell = (id, expectedName, role, subInfo, ccInfo) =>
                '<td style="' + tdS + '">' +
                '<div class="signature-placeholder" data-signature-id="' + id + '" style="' + sigBox + '">' +
                '<span style="' + lbl + '">Haga clic para insertar FIRMA DIGITAL</span></div>' +
                '<div style="' + sigNm + '">' + expectedName + '</div>' +
                '<div style="' + sigSb + '">' + role + '</div>' +
                '<div style="' + sigIn + '">' + (subInfo || '') + (subInfo && ccInfo ? ' &bull; ' : '') + (ccInfo || '') + '</div>' +
                '</td>';

            const equipoSigs = [
                buildSigCell('jefe-inmediato', sig1Name, 'Jefe Inmediato / Supervisor', sig1CC, ''),
                buildSigCell('copasst', sig2Name, 'Representante COPASST / Vig&iacute;a SST', sig2CC, ''),
                buildSigCell('responsable-sst', responsible, 'Responsable SG-SST', license ? 'Lic. No. ' + license + licenseExpiry : '', ''),
                buildSigCell('representante-legal', legalRep, 'Representante Legal', companyName, '')
            ];

            const afectadoSigs = [
                buildSigCell('trabajador-afectado', workerName, 'Trabajador Afectado', workerCC, workerCargo)
            ];

            validTestigos.forEach((t, i) => {
                afectadoSigs.push(buildSigCell('testigo-' + (i+1), t.nombre.toUpperCase(), 'Testigo ' + (i+1), t.cedula ? 'CC. ' + t.cedula : '', t.cargo));
            });

            cleanedReport += '<div style="margin-top:50px;page-break-inside:avoid;">' +
            '<div style="border-top:2px solid #e2e8f0;padding-top:12px;margin-bottom:12px;text-align:center;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Firmas de Conformidad &mdash; Investigaci&oacute;n de Accidente/Incidente (Res. 1401/2007)</div>' +
            '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Equipo investigador y empresa</div>' +
            buildHtmlSigs(equipoSigs) +
            '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Trabajador afectado y testigos</div>' +
            buildHtmlSigs(afectadoSigs) +
            '<div style="text-align:center;font-size:10px;color:#cbd5e1;margin-top:20px;font-style:italic;">Documento generado electr&oacute;nicamente por el Gestor Inteligente SGSST &mdash; WAPPY IA By WAPPY LTDA &copy; 2025</div>' +
            '</div>';
        }

        res.json({
            report: cleanedReport,
            conversationId: crypto.randomUUID(),
        });

    } catch (error) {
        logger.error('[InvestigacionATEL] Generation error:', error);
        res.status(500).json({ error: `Error generando el informe: ${error.message}` });
    }
});

// ─── POST /api/sgsst/investigacion-atel/save-report ──────────────────────────
router.post('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { content, title, tags } = req.body;
        if (!content) return res.status(400).json({ error: 'Content is required' });

        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = title || `Investigación ATEL - ${dateStr}`;
        const reportTags = tags || ['sgsst-investigacion-atel'];

        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-investigacion-atel',
            model: 'sgsst-investigacion-atel',
        }, { context: 'SGSST Investigacion ATEL Save' });

        await saveMessage(req, {
            messageId,
            conversationId,
            text: content,
            sender: 'SGSST Investigación ATEL',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST ATEL message' });

        try {
            await updateTagsForConversation(req.user.id, conversationId, reportTags);
        } catch (tagErr) { }

        res.status(201).json({ conversationId, messageId, title: reportTitle });
    } catch (error) {
        logger.error('[InvestigacionATEL save-report] Error:', error);
        res.status(500).json({ error: 'Error saving report' });
    }
});

// ─── PUT /api/sgsst/investigacion-atel/save-report ───────────────────────────
router.put('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { conversationId, messageId, content } = req.body;
        if (!conversationId || !messageId || !content) {
            return res.status(400).json({ error: 'Missing parameters' });
        }
        await updateMessageText(req, { messageId, text: content });
        res.json({ success: true, conversationId, messageId });
    } catch (error) {
        res.status(500).json({ error: 'Error updating report' });
    }
});

module.exports = router;
