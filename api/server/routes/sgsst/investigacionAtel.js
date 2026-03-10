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

// ─── In-memory form data store (per user) ────────────────────────────────────
const investigacionDataStore = new Map();

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
    const stored = investigacionDataStore.get(req.user.id) || {};
    res.json({
        formData: stored.formData || {},
        equipoList: stored.equipoList || [],
        testigosList: stored.testigosList || [],
        images: stored.images || {},
    });
});

// ─── POST /api/sgsst/investigacion-atel/save ─────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    const { formData, equipoList, testigosList, images } = req.body;
    investigacionDataStore.set(req.user.id, { formData, equipoList, testigosList, images });
    res.json({ success: true });
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

4. **METODOLOGÍA 2 — DIAGRAMA DE ISHIKAWA (Espina de Pescado Visual):**
   Construye un diagrama real usando CSS Grid/Flexbox:
   - Cabeza del pescado (el accidente) a la derecha, en una caja destacada.
   - 6 espinas principales: Mano de Obra, Máquina/Equipo, Entorno/Ambiente, Material, Método, Gestión/Administración.
   - Cada espina con 2-3 causas secundarias.
   - DEBE parecer un verdadero diagrama de espina de pescado, no una lista.
   - Usa líneas horizontales/diagonales con border CSS para simular las espinas.
   - Paleta recomendada: fondo #f8fafc, espinas en tonos de azul, rojo para la cabeza.
   - PRECAUCIÓN: Aplica color: #111 o color: #FFF según el fondo de cada sección.

5. **METODOLOGÍA 3 — ÁRBOL DE CAUSAS:**
   Organigrama descendente mostrando la cadena causal:
   CONSECUENCIA → HECHOS DIRECTOS → CAUSAS INMEDIATAS → CAUSAS BÁSICAS → CAUSA RAÍZ
   Usa display:flex y border para simular un árbol. Conecta los nodos con líneas verticales CSS.
   Paleta: naranja para consecuencias, amarillo para causas inmediatas, rojo para causa raíz.
   PRECAUCIÓN: Aplica color: #111 en cajas con fondo claro.

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
            // ── Investigadores (from equipoList) ──────────────────────
            const jefeInmediato = equipoList.find(e =>
                (e.rol || '').toLowerCase().includes('jefe') || (e.rol || '').toLowerCase().includes('supervisor')
            );
            const copasst = equipoList.find(e =>
                (e.rol || '').toLowerCase().includes('copasst') || (e.rol || '').toLowerCase().includes('vig')
            );
            const sig1Name = (jefeInmediato?.nombre || 'Jefe Inmediato / Supervisor').toUpperCase();
            const sig1CC = jefeInmediato?.cedula ? `CC. ${jefeInmediato.cedula}` : '';
            const sig2Name = (copasst?.nombre || 'Representante COPASST').toUpperCase();
            const sig2CC = copasst?.cedula ? `CC. ${copasst.cedula}` : '';

            // ── Empresa (from companyInfo) ─────────────────────────────
            const responsible = (loadedCompanyInfo.responsibleSST || 'Responsable SG-SST').toUpperCase();
            const license = loadedCompanyInfo.licenseNumber || '';
            const licenseExpiry = loadedCompanyInfo.licenseExpiry ? ` — Vence: ${loadedCompanyInfo.licenseExpiry}` : '';
            const legalRep = (loadedCompanyInfo.legalRepresentative || 'Representante Legal').toUpperCase();
            const companyName = loadedCompanyInfo.companyName || '';

            const sigBox = 'border-bottom:2px solid #333;width:80%;margin:0 auto 10px auto;min-height:80px;display:flex;align-items:center;justify-content:center;background-color:#f9f9f9;cursor:pointer;border-radius:8px 8px 0 0;transition:all 0.3s ease;';
            const sigNm = 'font-weight:800;font-size:13px;color:#1e293b;text-transform:uppercase;';
            const sigSb = 'font-size:11px;color:#64748b;font-weight:600;margin-top:2px;';
            const sigIn = 'font-size:10px;color:#94a3b8;margin-top:1px;';
            const tdS = 'width:25%;padding:14px 10px;text-align:center;vertical-align:bottom;';

            cleanedReport += `
<div style="margin-top:50px;page-break-inside:avoid;">
    <div style="border-top:2px solid #e2e8f0;padding-top:12px;margin-bottom:12px;text-align:center;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">
        Firmas de Conformidad &mdash; Investigación de Accidente/Incidente (Res. 1401/2007)
    </div>
    <table style="width:100%;border-collapse:collapse;">
        <tr>
            <td style="${tdS}">
                <div class="signature-placeholder" data-signature-id="jefe-inmediato" style="${sigBox}">
                    <span style="color:#999;font-size:11px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="${sigNm}">${sig1Name}</div>
                <div style="${sigSb}">Jefe Inmediato / Supervisor</div>
                <div style="${sigIn}">${sig1CC}</div>
            </td>
            <td style="${tdS}">
                <div class="signature-placeholder" data-signature-id="copasst" style="${sigBox}">
                    <span style="color:#999;font-size:11px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="${sigNm}">${sig2Name}</div>
                <div style="${sigSb}">Representante COPASST / Vigía SST</div>
                <div style="${sigIn}">${sig2CC}</div>
            </td>
            <td style="${tdS}">
                <div class="signature-placeholder" data-signature-id="responsable-sst" style="${sigBox}">
                    <span style="color:#999;font-size:11px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="${sigNm}">${responsible}</div>
                <div style="${sigSb}">Responsable SG-SST</div>
                <div style="${sigIn}">${license ? `Lic. No. ${license}${licenseExpiry}` : ''}</div>
            </td>
            <td style="${tdS}">
                <div class="signature-placeholder" data-signature-id="representante-legal" style="${sigBox}">
                    <span style="color:#999;font-size:11px;">Haga clic para insertar FIRMA DIGITAL</span>
                </div>
                <div style="${sigNm}">${legalRep}</div>
                <div style="${sigSb}">Representante Legal</div>
                <div style="${sigIn}">${companyName}</div>
            </td>
        </tr>
    </table>
    <div style="text-align:center;font-size:10px;color:#cbd5e1;margin-top:18px;font-style:italic;">
        Documento generado electr&oacute;nicamente por el Gestor Inteligente SGSST &mdash; WAPPY IA By WAPPY LTDA &copy; 2025
    </div>
</div>`;
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
