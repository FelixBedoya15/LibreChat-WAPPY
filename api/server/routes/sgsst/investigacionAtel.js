const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
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
const feedWorkerEvent = require('./feedWorkerHelper');

async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// ─── GET /api/sgsst/investigacion-atel/data ───────────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const stored = await InvestigacionAtelData.findOne({ user: req.user.id, companyId: companyId }).lean();
        if (stored) {
            return res.json({
                formData: stored.formData || {},
                equipoList: stored.equipoList || [],
                testigosList: stored.testigosList || [],
                images: stored.images || {},
                video: stored.video || null,
                inboxTestimonios: stored.inboxTestimonios || []
            });
        }
        res.json({ formData: {}, equipoList: [], testigosList: [], images: {}, video: null, inboxTestimonios: [] });
    } catch (error) {
        logger.error('[InvestigacionATEL] Data load error:', error);
        res.status(500).json({ error: 'Error al cargar los datos del reporte.' });
    }
});

// ─── POST /api/sgsst/investigacion-atel/save ─────────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const { formData, equipoList, testigosList, images, video } = req.body;
        await InvestigacionAtelData.findOneAndUpdate(
            { user: req.user.id, companyId: companyId },
            { $set: { companyId, formData, equipoList, testigosList, images, video, updatedAt: Date.now() } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        logger.error('[InvestigacionATEL] Data save error:', error);
        res.status(500).json({ error: 'Error al guardar los datos.' });
    }
});

// ─── POST /api/sgsst/investigacion-atel/generate ─────────────────────────────
// ─── POST /api/sgsst/investigacion-atel/inbox/testimonio/dismiss ──────────
router.post('/inbox/testimonio/dismiss', requireJwtAuth, async (req, res) => {
    try {
        const companyId = await getActiveCompanyId(req.user.id);
        const { reportId } = req.body;
        const doc = await InvestigacionAtelData.findOne({ user: req.user.id, companyId: companyId });
        if (doc && doc.inboxTestimonios) {
            doc.inboxTestimonios = doc.inboxTestimonios.filter(item => String(item.id) !== String(reportId));
            await doc.save();
        }
        res.json({ success: true, inboxTestimonios: doc?.inboxTestimonios || [] });
    } catch (error) {
        logger.error('[SGSST InvestigacionAtel] Inbox dismiss error:', error);
        res.status(500).json({ error: 'Error al descartar testimonio del buzón' });
    }
});

router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            formData = {},
            equipoList = [],
            testigosList = [],
            images,
            video,
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

        // ── Video Part ──
        if (video?.startsWith('data:video/')) {
            try {
                const regex = /^data:(video\/[a-zA-Z0-9]*);base64,([^"]*)$/;
                const matches = video.match(regex);
                if (matches && matches.length === 3) {
                    imageParts.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                }
            } catch (err) {
                logger.warn('[InvestigacionATEL] Error processing video part:', err.message);
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

${imageParts.length > 0 ? `*(Tienes ${imageParts.length} archivo(s) de evidencia adjuntos (fotos y/o video de 10s) — analízalos profundamente y refiérete a ellos para dar un dictamen técnico preciso)*` : ''}

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

4. **METODOLOGÍA 2 — DIAGRAMA DE ISHIKAWA (ESPINA DE PESCADO — SVG OBLIGATORIO):**
   DEBES CONSTRUIR ESTE DIAGRAMA USANDO SVG INLINE. Es la única forma de garantizar líneas diagonales precisas y consistentes.

   COPIA EXACTAMENTE ESTE BLOQUE HTML y reemplaza SOLO los textos entre [CORCHETES] con el contenido real del accidente:

   <div class="diagram-node" style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0369a1;border-radius:14px;padding:20px;margin:24px 0;overflow-x:auto;">
   <h3 style="text-align:center;color:#0c4a6e;font-size:17px;font-weight:800;margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">DIAGRAMA DE ISHIKAWA — ANÁLISIS CAUSA-EFECTO</h3>
   <svg viewBox="0 0 1010 480" width="100%" style="min-width:700px;font-family:Arial,sans-serif;">
     <!-- ESPINA DORSAL CENTRAL -->
     <line x1="60" y1="240" x2="798" y2="240" stroke="#1e3a8a" stroke-width="4"/>
     <polygon points="798,232 818,240 798,248" fill="#1e3a8a"/>
     <!-- Cola del pez -->
     <polyline points="60,215 30,240 60,265" fill="none" stroke="#1e3a8a" stroke-width="3"/>
     <!-- CABEZA DEL PEZ (PROBLEMA) - Forma de punta apuntada, MAS GRANDE -->
     <polygon class="diagram-node" points="818,160 930,190 968,240 930,290 818,320" fill="#dc2626" stroke="#991b1b" stroke-width="3"/>
     <text x="878" y="220" text-anchor="middle" font-size="11" font-weight="800" fill="white">[NOMBRE</text>
     <text x="878" y="236" text-anchor="middle" font-size="11" font-weight="800" fill="white">ACCIDENTE]</text>
     <text x="878" y="254" text-anchor="middle" font-size="10" font-weight="700" fill="white">[CONSECUENCIA</text>
     <text x="878" y="270" text-anchor="middle" font-size="10" font-weight="700" fill="white">PRINCIPAL]</text>
     <!-- HUESO 1 SUPERIOR: MANO DE OBRA (nace en x=180 de la espina) -->
     <line x1="180" y1="240" x2="108" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="180" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="18" y="65" width="148" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="92" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MANO DE OBRA]</text>
     <!-- Sub-causas hueso 1 -->
     <line x1="155" y1="178" x2="118" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="62" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="143" y1="202" x2="106" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="50" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 2 SUPERIOR: MÉTODO (x=380) -->
     <line x1="380" y1="240" x2="308" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="380" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="221" y="65" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="291" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MÉTODO]</text>
     <line x1="355" y1="178" x2="318" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="262" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="343" y1="202" x2="306" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="248" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 3 SUPERIOR: MATERIAL (x=580) -->
     <line x1="580" y1="240" x2="508" y2="95" stroke="#1d4ed8" stroke-width="2.5"/>
     <circle cx="580" cy="240" r="5" fill="#1d4ed8"/>
     <rect class="diagram-node" x="421" y="65" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="491" y="87" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MATERIAL]</text>
     <line x1="555" y1="178" x2="518" y2="158" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="462" y="154" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="543" y1="202" x2="506" y2="182" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="448" y="178" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 4 INFERIOR: MAQUINARIA (x=180) -->
     <line x1="180" y1="240" x2="108" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="18" y="385" width="148" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="92" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[MAQUINARIA]</text>
     <line x1="155" y1="302" x2="118" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="60" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="143" y1="278" x2="106" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="48" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 5 INFERIOR: ENTORNO (x=380) -->
     <line x1="380" y1="240" x2="308" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="221" y="385" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="291" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[ENTORNO]</text>
     <line x1="355" y1="302" x2="318" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="260" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="343" y1="278" x2="306" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="248" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
     <!-- HUESO 6 INFERIOR: GESTIÓN (x=580) -->
     <line x1="580" y1="240" x2="508" y2="385" stroke="#1d4ed8" stroke-width="2.5"/>
     <rect class="diagram-node" x="421" y="385" width="140" height="34" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
     <text x="491" y="407" text-anchor="middle" font-size="12" font-weight="700" fill="#1e3a8a">[GESTIÓN / ADM.]</text>
     <line x1="555" y1="302" x2="518" y2="322" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="460" y="338" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 1]</text>
     <line x1="543" y1="278" x2="506" y2="298" stroke="#60a5fa" stroke-width="1.5"/>
     <text x="448" y="314" font-size="10" fill="#1e293b" text-anchor="middle">[Causa 2]</text>
   </svg>
   </div>

   REGLAS ABSOLUTAS PARA ISHIKAWA:
   - NUNCA uses tablas HTML para este diagrama. SIEMPRE usa el SVG de arriba.
   - Reemplaza CADA texto entre [CORCHETES] con el contenido real del accidente investigado.
   - Si una causa es muy larga, divide en 2 lineas SVG <text> con dy="13" en la segunda.
   - Puedes ajustar colores de los rect fill (azul claro=#dbeafe, verde=#dcfce7, amarillo=#fef9c3) pero MANTÉN la estructura de líneas SVG sin mover coordenadas.
   - NUNCA muevas las coordenadas x1,y1,x2,y2 de las líneas ni los puntos de los rectángulos.

5. **METODOLOGÍA 3 — ÁRBOL DE CAUSAS (MUY EXTENSO, PROFUNDO Y CON CONECTORES VISIBLES):**
   Construye un árbol descendente con mínimo 4-5 niveles de profundidad. ¡Los conectores son OBLIGATORIOS y deben verse claramente entre cada par de nodos!
   IMPORTANTE: El título de esta sección en el informe debe ser simplemente "ÁRBOL DE CAUSAS" sin añadir referencias a metodologías ni normas en el titulo.

   TIPOS DE RELACIONES:
   - SECUENCIAL: 1 padre → 1 hijo (línea vertical)
   - CONJUNCIÓN: varios nodos → 1 resultado (convergen con barra horizontal)
   - DISYUNCIÓN: 1 nodo → múltiples ramas descendentes

   NOMENCLATURA OBLIGATORIA:
   1. CÍRCULOS = "Hechos Inusuales" (eventos que ocurrieron)
   2. RECTÁNGULOS = "Hechos Permanentes" (condiciones siempre existentes en el sistema)

   PATRÓN CSS DE CONECTORES (copia EXACTAMENTE, nunca omitas las líneas de conexión):

   Nodo con UN hijo (secuencial):
   <div style="display:flex;flex-direction:column;align-items:center;width:100%;">
     [NODO PADRE]
     <div style="width:3px;height:35px;background:#334155;"></div>
     [NODO HIJO]
   </div>

   Nodo con DOS o más hijos (disyunción o conjunción):
   <div style="display:flex;flex-direction:column;align-items:center;width:100%;">
     [NODO PADRE]
     <div style="width:3px;height:30px;background:#334155;"></div>
     <div style="display:flex;justify-content:center;gap:16px;position:relative;width:90%;">
       <div style="position:absolute;top:0;left:5%;right:5%;height:3px;background:#334155;"></div>
       <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
         <div style="width:3px;height:28px;background:#334155;"></div>
         [HIJO 1]
       </div>
       <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
         <div style="width:3px;height:28px;background:#334155;"></div>
         [HIJO 2]
       </div>
     </div>
   </div>

   ESTILOS EXACTOS DE NODOS (usa class="diagram-node" en todos):
   CÍRCULO: <div class="diagram-node" style="border-radius:50%;width:120px;height:120px;display:flex;align-items:center;justify-content:center;text-align:center;border:3px solid #334155;background:#fef9c3;color:#111;font-size:11px;font-weight:600;padding:8px;flex-shrink:0;">[texto]</div>
   RECTÁNGULO normal: <div class="diagram-node" style="border-radius:8px;padding:14px 18px;text-align:center;border:3px solid #334155;background:#e0f2fe;color:#111;font-size:12px;font-weight:600;min-width:160px;max-width:280px;">[texto]</div>
   CONSECUENCIA (primer nodo): <div class="diagram-node" style="border-radius:8px;padding:16px 24px;text-align:center;border:3px solid #991b1b;background:#fca5a5;color:#7f1d1d;font-size:13px;font-weight:800;width:80%;max-width:500px;">[CONSECUENCIA]</div>
   CAUSA RAÍZ (último nodo): <div class="diagram-node" style="border-radius:8px;padding:16px 24px;text-align:center;border:3px solid #065f46;background:#d1fae5;color:#065f46;font-size:13px;font-weight:800;width:90%;max-width:600px;">[CAUSA RAÍZ]</div>

   Cadena visual: CONSECUENCIA → HECHOS DIRECTOS (círculos) → CAUSAS INMEDIATAS (rects) → CAUSAS BÁSICAS (rects) → CAUSA RAÍZ (rect verde).
   Usa class="diagram-node" en TODOS. color siempre #111 excepto Causa Raíz que usa #065f46.



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
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({
            model: finalModelName,
            generationConfig: { maxOutputTokens: 65000, temperature: 0.65 },
        });

        const parts = [systemPromptText, ...imageParts];

        console.log(`[InvestigacionATEL] Generando informe. Modelo: ${selectedModelName}`);

        const generateWithTimeout = async (mod, prmpt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación superó el tiempo límite.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await generateWithKeyRotation(mod, req.user?.id || req.user, prmpt);
                return genResult.response.text();
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

        // ── Incorporate images in the final report HTML ───────────────────────
        let imagesHtml = '';
        if (images && (images.foto1 || images.foto2 || images.foto3 || images.foto4)) {
            imagesHtml = `
                <div style="margin-top: 30px; margin-bottom: 30px;">
                    <h3 style="color: #0c4a6e; border-bottom: 2px solid #0c4a6e; padding-bottom: 5px; text-transform: uppercase; font-size: 16px;">ANEXO: REGISTRO FOTOGRÁFICO DE EVIDENCIAS</h3>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">
            `;

            const labels = ['Lugar del Evento', 'Agente Causal', 'Lesiones / Daños', 'Condiciones del Área'];
            ['foto1', 'foto2', 'foto3', 'foto4'].forEach((k, i) => {
                if (images[k]) {
                    imagesHtml += `
                        <div style="width: calc(50% - 10px); border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background-color: #ffffff; box-sizing: border-box; margin-bottom: 10px;">
                            <img src="${images[k]}" style="width: 100%; height: auto; max-height: 250px; border-radius: 6px; object-fit: contain; margin-bottom: 10px;" alt="Evidencia ${i + 1}" />
                            <strong style="color: #0c4a6e; font-size: 14px; display: block; margin-bottom: 4px;">${labels[i]}</strong>
                            <span style="font-size: 11px; color: #64748b; font-style: italic;">Evidencia técnica adjuntada al informe</span>
                        </div>
                    `;
                }
            });

            imagesHtml += `</div></div>`;
        }

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

            cleanedReport += imagesHtml + '<div style="margin-top:50px;page-break-inside:avoid;">' +
            '<div style="border-top:2px solid #e2e8f0;padding-top:12px;margin-bottom:12px;text-align:center;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Firmas de Conformidad &mdash; Investigaci&oacute;n de Accidente/Incidente (Res. 1401/2007)</div>' +
            '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Equipo investigador y empresa</div>' +
            buildHtmlSigs(equipoSigs) +
            '<div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;padding-left:4px;">Trabajador afectado y testigos</div>' +
            buildHtmlSigs(afectadoSigs) +
            '<div style="text-align:center;font-size:10px;color:#cbd5e1;margin-top:20px;font-style:italic;">Documento generado electr&oacute;nicamente por el Gestor Inteligente SGSST &mdash; WAPPY IA By WAPPY LTDA &copy; 2025</div>' +
            '</div>';
        }

        // ── Auto-Feed Bio-Individual (Hoja de Vida) ──
        if (formData?.afectadoCedula) {
            const shortDesc = `${tipoEvento || 'ATEL'} - ${naturalezaLesion || ''}`;
            // 0 points for getting hurt, but it registers the event
            await feedWorkerEvent(req.user.id || req.user, formData.afectadoCedula, 'atel', shortDesc, 0, 'generate');
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
        const reportTags = Array.isArray(tags) ? [...tags] : ['sgsst-investigacion-atel'];

        // Append company tag so report-history can filter by company
        try {
            let activeCompany = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean();
            if (!activeCompany) activeCompany = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (activeCompany?._id) {
                reportTags.push(`company-${activeCompany._id.toString()}`);
            }
        } catch (e) {
            logger.warn('[SGSST] Could not append company tag to ATEL report', e);
        }

        // 1. Save conversation WITH tags atomically
        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-investigacion-atel',
            model: 'sgsst-investigacion-atel',
            tags: reportTags,
        }, { context: 'SGSST Investigacion ATEL Save' });

        // 2. Save message with the report content
        await saveMessage(req, {
            messageId,
            conversationId,
            text: content,
            sender: 'SGSST Investigación ATEL',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST ATEL message' });

        // 3. Belt-and-suspenders: ensure tags via direct model update
        try {
            const { Conversation } = require('~/db/models');
            await Conversation.findOneAndUpdate(
                { conversationId, user: req.user.id },
                { $addToSet: { tags: { $each: reportTags } } },
                { new: true },
            );
        } catch (tagErr) {
            logger.warn('[InvestigacionATEL] Error applying tags (non-fatal):', tagErr.message);
        }

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
