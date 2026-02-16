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

/**
 * POST /api/sgsst/diagnostico/analyze
 * Analyzes the SGSST checklist and generates a management report.
 * Uses the same Google API key the user configures in chat settings.
 */
router.post('/analyze', requireJwtAuth, async (req, res) => {
    try {
        const {
            companySize,
            riskLevel,
            applicableArticle,
            checklist,
            score,
            totalPoints,
            complianceLevel,
            userName,
            currentDate,
            observations,
            type = 'diagnostico', // Default to diagnostico for backward compatibility
        } = req.body;

        // Validate checklist
        if (!checklist || !Array.isArray(checklist) || checklist.length === 0) {
            return res.status(400).json({ error: 'La lista de verificación es inválida o está vacía.' });
        }

        // 1. Retrieve the user's Google API key
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (parseErr) {
                resolvedApiKey = storedKey;
            }
        } catch (err) {
            logger.debug('[SGSST Diagnostico] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 2. Load company info from DB
        let companyInfoBlock = '';
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci && ci.companyName) {
                companyInfoBlock = `
- Razón Social: ${ci.companyName || 'No registrado'}
- NIT: ${ci.nit || 'No registrado'}
- Representante Legal: ${ci.legalRepresentative || 'No registrado'}
- Número de Trabajadores: ${ci.workerCount || 'No registrado'}
- ARL: ${ci.arl || 'No registrada'}
- Actividad Económica: ${ci.economicActivity || 'No registrada'}
- Código CIIU: ${ci.ciiu || 'No registrado'}
- Nivel de Riesgo: ${ci.riskLevel || 'No registrado'}
- Sector: ${ci.sector || 'No registrado'}
- Dirección: ${ci.address || 'No registrada'}, ${ci.city || ''}
`;
            }
        } catch (ciErr) {
            logger.warn('[SGSST Diagnostico] Error loading company info:', ciErr.message);
        }

        // 3. Initialize the Gemini SDK directly
        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        // Convert numeric riskLevel to readable label
        const riskLabels = { 1: 'I (Mínimo)', 2: 'II (Bajo)', 3: 'III (Medio)', 4: 'IV (Alto)', 5: 'V (Máximo)' };
        const riskLevelLabel = riskLabels[riskLevel] || riskLevel;

        // Build checklist stats
        const completedItems = checklist.filter(item => item.status === 'cumple');
        const partialItems = checklist.filter(item => item.status === 'parcial');
        const nonCompliantItems = checklist.filter(item => item.status === 'no_cumple');
        const notApplicable = checklist.filter(item => item.status === 'no_aplica');
        const pending = checklist.filter(item => item.status === 'pendiente');

        const safeTotal = totalPoints > 0 ? totalPoints : 1; // Prevent division by zero
        const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : "0.0";

        let promptText = '';

        if (type === 'auditoria') {
            const { weightedScore = 0, weightedPercentage = 0, phvaStats: clientPhvaStats } = req.body;
            console.log('[SGSST Audit Analysis] Payload:', {
                score,
                totalPoints,
                weightedScore,
                weightedPercentage,
                checklistLength: checklist?.length
            });

            // Calculate PHVA percentages from actual checklist data
            const phvaCycles = ['planear', 'hacer', 'verificar', 'actuar'];
            const phvaData = {};
            phvaCycles.forEach(cycle => {
                const cycleItems = checklist.filter(item => item.category === cycle);
                const cycleTotal = cycleItems.length;
                const cycleCumple = cycleItems.filter(i => i.status === 'cumple').length;
                const cycleNoCumple = cycleItems.filter(i => i.status === 'no_cumple').length;
                const cycleParcial = cycleItems.filter(i => i.status === 'parcial').length;
                const cycleNoAplica = cycleItems.filter(i => i.status === 'no_aplica').length;
                const applicableCount = cycleTotal - cycleNoAplica;
                const pct = applicableCount > 0 ? ((cycleCumple / applicableCount) * 100).toFixed(1) : '100.0';
                phvaData[cycle] = { total: cycleTotal, cumple: cycleCumple, noCumple: cycleNoCumple, parcial: cycleParcial, noAplica: cycleNoAplica, percentage: pct };
            });

            const phvaLabels = { planear: 'PLANEAR', hacer: 'HACER', verificar: 'VERIFICAR', actuar: 'ACTUAR' };
            const phvaSummary = phvaCycles.map(cycle => {
                const d = phvaData[cycle];
                return `- **${phvaLabels[cycle]}:** ${d.percentage}% (${d.cumple} cumplen / ${d.total} total | No cumplen: ${d.noCumple} | Parcial: ${d.parcial} | No aplica: ${d.noAplica})`;
            }).join('\n');

            promptText = `Eres un Auditor Líder experto en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia, certificado en ISO 45001 y Decreto 1072 de 2015.

**Fecha de Auditoría:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Auditor Líder:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Criterios de Auditoría:** Decreto 1072 de 2015 (Capítulo 6), Resolución 0312 de 2019.

**REGLAS CRÍTICAS:**
1. Debes basar tu informe EXCLUSIVAMENTE en los datos proporcionados a continuación. NO inventes, supongas ni alucines hallazgos.
2. Si un estándar aparece como "cumple", NO lo reportes como No Conformidad. Si aparece como "no_cumple", SÍ repórtalo.
3. USA EXCLUSIVAMENTE los porcentajes PHVA pre-calculados proporcionados abajo. NO los recalcules ni modifiques.
4. Cuando un estándar tenga una OBSERVACIÓN/EVIDENCIA DEL AUDITOR, DEBES usar ese texto como base principal del hallazgo. NO inventes detalles diferentes.
5. En la columna "Requisito/Norma" de cada hallazgo, usa el campo CRITERIO NORMATIVO proporcionado para cada ítem (incluye Decreto 1072 Y Resolución 0312 con artículos específicos).

Analiza los hallazgos de la auditoría interna y genera un INFORME DE AUDITORÍA INTERNA EXTENSO Y PROFESIONAL en formato HTML.

## DATOS DE LA AUDITORÍA

**Información de la Empresa:**
${companyInfoBlock}

**Resumen de Resultados (Doble Calificación):**
1. **Auditoría de Cumplimiento (Dec 1072):**
   - Porcentaje de Conformidad: ${percentage}%
   - Conformidades (Cumple): ${completedItems.length}
   - No Conformidades (No Cumple): ${nonCompliantItems.length}
   - Observaciones (Parcial/No Aplica): ${partialItems.length + notApplicable.length}

2. **Estándares Mínimos (Res 0312):**
   - Puntaje Obtenido: ${weightedScore || 'N/A'}
   - Porcentaje Ponderado: ${weightedPercentage ? parseFloat(weightedPercentage).toFixed(1) : 'N/A'}%

**PORCENTAJES POR CICLO PHVA (PRE-CALCULADOS — USAR EXACTAMENTE ESTOS VALORES):**
${phvaSummary}

**Detalle de No Conformidades y Hallazgos (TOTAL: ${nonCompliantItems.length} No Conformidades + ${partialItems.length} Observaciones = ${nonCompliantItems.length + partialItems.length} hallazgos que DEBEN aparecer en la tabla):**
**NO CONFORMIDADES (${nonCompliantItems.length} ítems — TODOS deben aparecer individualmente en la tabla):**
${nonCompliantItems.map((item, idx) => {
                const obs = observations && observations[item.id] ? `\n  → EVIDENCIA: "${observations[item.id]}"` : '';
                const criteria = item.criteria ? `\n  → CRITERIO NORMATIVO: ${item.criteria}` : '';
                return `${idx + 1}. [NC-${idx + 1}] ${item.code} - ${item.name}: ${item.description}${criteria}${obs}`;
            }).join('\n') || 'Ninguna'}

**CUMPLIMIENTO PARCIAL (${partialItems.length} ítems — TODOS deben aparecer individualmente en la tabla):**
${partialItems.map((item, idx) => {
                const obs = observations && observations[item.id] ? `\n  → EVIDENCIA: "${observations[item.id]}"` : '';
                const criteria = item.criteria ? `\n  → CRITERIO NORMATIVO: ${item.criteria}` : '';
                return `${idx + 1}. [OBS-${idx + 1}] ${item.code} - ${item.name}: ${item.description}${criteria}${obs}`;
            }).join('\n') || 'Ninguna'}

## INSTRUCCIONES - GENERACIÓN DE INFORME AUDITORÍA DETALLADO

Genera un INFORME DE AUDITORÍA INTERNA MUY DETALLADO Y EXTENSO en formato HTML RICO Y ESTILIZADO.
**IMPORTANTE:** Usa tablas, colores y "tarjetas" visuales. El diseño debe ser profesional y de alto nivel.

1. **ENCABEZADO Y CONTEXTO**:
   - **PRIMERO** genera un título grande y centrado como encabezado principal del informe:
     <h1 style="text-align: center; color: #004d99; margin-bottom: 5px;">INFORME DE AUDITORÍA INTERNA</h1>
     <h2 style="text-align: center; color: #666; margin-top: 0;">Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)</h2>
   - **DESPUÉS** del título, crea una tabla elegante con la información de la empresa y del auditor.
   - Incluir en la tabla: Empresa, NIT, Fecha, Auditor Líder, Alcance, Criterios de auditoría (Dec 1072 Cap 6, Res 0312).
   - El título NO debe estar dentro de la tabla.

2. **RESUMEN EJECUTIVO (EXTENSO)**:
   - <div style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #004d99; margin-bottom: 20px;">
     Redacta un resumen ejecutivo profundo sobre el estado del SG-SST, mencionando explícitamente el cumplimiento del Decreto 1072 y la Resolución 0312. Incluye los puntajes generales y una síntesis de las principales fortalezas y debilidades.
     </div>

3. **ANÁLISIS DE RESULTADOS (VISUAL Y GRÁFICO)**:
   - **TARJETAS DE PUNTUACIÓN:** Genera dos recuadros (divs) visuales lado a lado para los dos puntajes (Dec 1072 y Res 0312).
   - **GRÁFICOS DE BARRAS (PHVA):** Para cada ciclo PHVA, genera una **BARRA DE PROGRESO** visual (HTML/CSS). **USA EXACTAMENTE los porcentajes pre-calculados:**
     * PLANEAR: ${phvaData['planear'].percentage}%
     * HACER: ${phvaData['hacer'].percentage}%
     * VERIFICAR: ${phvaData['verificar'].percentage}%
     * ACTUAR: ${phvaData['actuar'].percentage}%
   - **FORTALEZAS:** Lista las fortalezas encontradas basándote en los ítems que cumplen.

4. **HALLAZGOS DETALLADOS (TABLA DE NO CONFORMIDADES Y OBSERVACIONES)**:
   - **OBLIGATORIO — CONTEO EXACTO:** La tabla DEBE tener exactamente **${nonCompliantItems.length + partialItems.length} filas** (${nonCompliantItems.length} No Conformidades + ${partialItems.length} Observaciones). Cada ítem listado arriba con su código [NC-X] o [OBS-X] DEBE tener su propia fila individual. NO agrupes, resumas ni omitas ninguno.
   - **FORMATO DE REDACCIÓN DE CADA HALLAZGO (ISO 19011):**
     Cada hallazgo debe seguir esta estructura:
     "Se identificó que [DESCRIBIR LO ENCONTRADO / EVIDENCIA DEL AUDITOR], lo cual incumple lo establecido en [NORMA + ARTÍCULO ESPECÍFICO del CRITERIO NORMATIVO]."
     Ejemplo: "Se identificó que la empresa no cuenta con auditoría anual del SG-SST (evidencia: No cuenta con auditoría), incumpliendo lo establecido en el Decreto 1072 de 2015, Art. 2.2.4.6.29 y Resolución 0312 de 2019, Estándar E6.1.2."
    - **TABLA HTML con las siguientes columnas (SIN columna de Acción Correctiva ni Plazo — esas van en la sección del Plan de Acción):**
      | # (NC-X / OBS-X) | Requisito/Norma (usar CRITERIO NORMATIVO completo) | Hallazgo (redacción ISO 19011 con evidencia) | Tipo (No Conformidad Mayor / No Conformidad Menor / Observación) | Responsable |
    - **VERIFICACIÓN:** Antes de cerrar la tabla, cuenta las filas. Si tienes menos de ${nonCompliantItems.length + partialItems.length} filas, FALTA información. Incluye los que falten.
    - Clasifica como NC Mayor si afecta la eficacia del sistema, NC Menor si es puntual, Observación si cumple parcialmente.
    - **NO incluyas columnas de Acción Correctiva ni Plazo en esta tabla.** Esas columnas van SOLO en la tabla del Plan de Acción (sección 5).

5. **PLAN DE ACCIÓN Y MEJORA RECOMENDADO (TABLA SEPARADA — UNA FILA POR CADA HALLAZGO)**:
   - **IMPORTANTE: Esta es una tabla COMPLETAMENTE SEPARADA de los Hallazgos. NO la fusiones con la tabla anterior.**
   - **REGLA CRÍTICA: Cada hallazgo (NC-X u OBS-X) DEBE tener su PROPIA fila individual. Si hay ${nonCompliantItems.length + partialItems.length} hallazgos, la tabla DEBE tener exactamente ${nonCompliantItems.length + partialItems.length} filas.**
   - **TABLA HTML con las siguientes columnas:**
     | # (NC-X / OBS-X) | Acción Correctiva Detallada (específica y ejecutable) | Recurso Necesario | Evidencia de Cumplimiento | Plazo (Inmediato 0-30d / Corto 1-3m / Mediano 3-6m / Largo 6-12m) |
   - Ordena las filas por prioridad (NC Mayores primero) pero SIN agrupar. Cada fila es independiente.

6. **CONCLUSIONES DE AUDITORÍA (MUY EXTENSAS Y DETALLADAS)**:
   - Concepto final sobre la conformidad y eficacia del SG-SST (mínimo 3 párrafos extensos).
   - **Análisis de cada NC Mayor:** Para CADA No Conformidad Mayor identificada, escribe un párrafo dedicado describiendo: qué se encontró, por qué es crítico para el sistema, cuál es la norma incumplida, y cuál es el riesgo legal específico (multas según Dec 472/15 de 1 a 500 SMLMV, sanciones del Ministerio de Trabajo, cierre temporal/definitivo, responsabilidad solidaria, etc.).
   - Fortalezas encontradas en el sistema (al menos 1 párrafo).
   - Comparación con los requisitos del Decreto 1072 y la Resolución 0312.
   - Recomendación sobre si el sistema es CONFORME, CONFORME CON OBSERVACIONES o NO CONFORME, con justificación detallada.
   - Las conclusiones deben ser extensas, descriptivas y autoexplicativas. NO sean breves ni genéricas.

**ESTILOS OBLIGATORIOS (CSS INLINE):**
- Títulos (h1, h2): Color azul oscuro (#004d99).
- Tablas: width="100%", border-collapse="collapse", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd".
- NC Mayor: fondo rosa claro (#ffe0e0). NC Menor: fondo amarillo claro (#fff8e0). Observación: fondo azul claro (#e0f0ff).

**FIRMA OBLIGATORIA:**
Al final del informe, firma estrictamente así (SIN IMÁGENES):
<div style="margin-top: 50px; text-align: center;">
    <hr style="width: 200px; margin: 0 auto 10px auto; border: none; border-top: 1px solid #333;" />
    <strong>${userName || req.user?.name || 'Auditor Líder'}</strong><br>
    Auditor Líder SG-SST (Dec. 1072/2015)<br>
    Licencia en Seguridad y Salud en el Trabajo Vigente
</div>
IMPORTANTE: NO incluyas ninguna etiqueta &lt;img&gt; ni placeholders de imagen para la firma. Solo texto.

Genera SOLO el contenido del cuerpo (HTML body tags).`;

        } else {
            // Default Diagnostic Prompt (Resolución 0312)
            promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate || new Date().toLocaleDateString('es-CO')}
**Consultor Experto:** ${userName || req.user?.name || 'Usuario del Sistema'}
**Referencia Normativa:** Resolución 0312 de 2019 (Estándares Mínimos, Art. ${applicableArticle})
    
Analiza los resultados de la evaluación según la Resolución 0312 de 2019 y genera un INFORME GERENCIAL completo.

**REGLA CRÍTICA: Debes basar tu informe EXCLUSIVAMENTE en los datos proporcionados a continuación. NO inventes, supongas ni alucines hallazgos. Si un estándar aparece como "CUMPLE", NO lo reportes como incumplido. Respeta estrictamente las listas de cumplimiento/incumplimiento dadas.**

## DATOS DE LA EVALUACIÓN

**Información de la Empresa (Filtros de Evaluación Seleccionados):**
- Tamaño de Empresa: ${companySize === 'small' ? '≤10 trabajadores' : companySize === 'medium' ? '11-50 trabajadores' : '>50 trabajadores'}
- Nivel de Riesgo Seleccionado para Evaluación: ${riskLevelLabel}
- Artículo Aplicable: Artículo ${applicableArticle}
${companyInfoBlock ? `\n**Datos Registrados de la Empresa (referencia, NO usar si contradice los filtros anteriores):**\n${companyInfoBlock}` : ''}

**Resultados:**
- Puntuación Total: ${score}/${totalPoints} (${percentage}%)
- Nivel de Cumplimiento: ${complianceLevel?.level?.toUpperCase() || 'N/A'}
- Total Estándares Evaluados: ${checklist.length}
- Cumplen: ${completedItems.length}
- Cumplen Parcialmente: ${partialItems.length}
- No Cumplen: ${nonCompliantItems.length}
- No Aplican: ${notApplicable.length}
- Pendientes: ${pending.length}

**Estándares que CUMPLEN (Exitosos):**
${completedItems.map(item => {
                return `- ${item.code} - ${item.name} (${item.category.toUpperCase()})`;
            }).join('\n') || 'Ninguno'}

**Estándares que NO CUMPLEN (Críticos — ${nonCompliantItems.length} ítems, TODOS deben aparecer en el plan de acción):**
${nonCompliantItems.map((item, idx) => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `${idx + 1}. [NC-${idx + 1}] ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguno'}

**Estándares que CUMPLEN PARCIALMENTE (${partialItems.length} ítems):**
${partialItems.map((item, idx) => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `${idx + 1}. [OBS-${idx + 1}] ${item.code} - ${item.name}: ${item.description}${obs}`;
            }).join('\n') || 'Ninguno'}

**Estándares que NO APLICAN:**
${notApplicable.map(item => {
                const obs = observations && observations[item.id] ? `\n  → OBSERVACIÓN DEL EVALUADOR: "${observations[item.id]}"` : '';
                return `- ${item.code} - ${item.name}${obs}`;
            }).join('\n') || 'Ninguno'}

## INSTRUCCIONES - GENERACIÓN DE INFORME EXTENSO Y VISUALMENTE PREMIUM

Genera un INFORME GERENCIAL MUY DETALLADO, EXTENSO Y PROFUNDO en formato HTML RICO Y ESTILIZADO.
**IMPORTANTE:** El informe debe verse profesional y hermoso. Usa tablas, colores y "tarjetas" visuales.

**REGLA SOBRE OBSERVACIONES:** Cuando un estándar tenga una OBSERVACIÓN DEL EVALUADOR, DEBES usar ese texto como base principal del hallazgo en el informe. NO inventes detalles diferentes. La observación del evaluador refleja la realidad encontrada en campo y debe ser citada o parafraseada con fidelidad.

1. **ENCABEZADO Y CONTEXTO**:
   - Crea una tabla elegante para la información de la empresa.
   - Usa un diseño limpio con bordes sutiles.

2. **RESUMEN EJECUTIVO (EXTENSO)**:
   - <div style="background-color: #f8f9fa; padding: 15px; border-left: 5px solid #004d99; margin-bottom: 20px;">
     Realiza una descripción detallada, profunda y explicativa del estado actual del SG-SST. Contextualiza el nivel de cumplimiento. NO seas breve.
     </div>

3. **ANÁLISIS DE RESULTADOS (VISUAL Y GRÁFICO)**: 
   - **TARJETAS DE PUNTUACIÓN:** Genera dos recuadros (divs) visuales lado a lado:
     - Uno rojo/verde para el PUNTAJE NUMÉRICO.
     - Uno naranja/amarillo para el NIVEL DE RIESGO.
   - **GRÁFICOS DE BARRAS (PHVA):** Para cada ciclo (Planear, Hacer, Verificar, Actuar), genera una **BARRA DE PROGRESO** visual usando HTML/CSS.
     - Estilo sugerido: Un contenedor gris claro con una barra interna de color (verde/naranja/rojo según cumplimiento) que tenga un ancho % proporcional.
   - **TABLA PHVA:** Crea una tabla HTML con encabezados azules (#004d99) y filas alternadas.
   - Texto explicativo extenso sobre fortalezas y debilidades.

4. **PLAN DE ACCIÓN COMPLETO (TODOS LOS HALLAZGOS)**:
   - **CONTEO EXACTO:** La tabla DEBE tener exactamente **${nonCompliantItems.length}** filas de No Conformidades + **${partialItems.length}** filas de Parciales = **${nonCompliantItems.length + partialItems.length}** filas totales. Cada ítem [NC-X] y [OBS-X] DEBE tener su propia fila. NO agrupes, resumas ni omitas.
   - Usa una **TABLA HTML** extensa.
   - Columnas: # (NC-X / OBS-X) | Estándar | Hallazgo (basado en observación del evaluador) | Acción Correctiva (Detallada) | Responsable | Plazo.
   - **VERIFICACIÓN:** Si la tabla tiene menos de ${nonCompliantItems.length + partialItems.length} filas, FALTA información. Incluye los que falten.

5. **RIESGOS Y CONSECUENCIAS**:
   - Usa listas con iconos (puedes usar emojis como ⚠️ o ⚖️ sutilmente si encajan, o bullets estilizados) para enumerar consecuencias legales y operativas.
   - Explicación profunda de cada riesgo.

6. **RECOMENDACIONES FINALES**:
   - Hoja de ruta en formato de lista estilizada o tabla de cronograma.

**ESTILOS OBLIGATORIOS (CSS INLINE):**
- Títulos (h1, h2): Color azul oscuro (#004d99).
- Tablas: width="100%", border-collapse="collapse", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd".
- Texto: Párrafos bien estructurados, no bloques de texto infinito.

**FIRMA OBLIGATORIA:**
Al final del informe, firma estrictamente así (SIN IMÁGENES):
<div style="margin-top: 50px; text-align: center;">
    <strong>${userName || req.user?.name || 'Usuario del Sistema'}</strong><br>
    Consultor Experto en SG-SST<br>
    Licencia en Seguridad y Salud en el Trabajo Vigente
</div>
IMPORTANTE: NO incluyas ninguna etiqueta &lt;img&gt; ni placeholders de imagen para la firma. Solo texto.

Genera SOLO el contenido del cuerpo (HTML body tags).`;
        }

        // Initialize the model
        // 4. Generate the report with Fallback Strategy
        let result;
        let text;

        // Console logs removed as per user request

        const generationConfig = {
            maxOutputTokens: 65536, // Maximum allowed by model
            temperature: 0.7,
        };

        const selectedModel = req.body.modelName || 'gemini-3-flash-preview';

        // Helper: generate with timeout (90 seconds)
        const generateWithTimeout = async (model, prompt, timeoutMs = 180000) => {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT: La generación del informe excedió el tiempo límite. Intente de nuevo.')), timeoutMs)
            );
            const genPromise = (async () => {
                const genResult = await model.generateContent(prompt);
                const genResponse = await genResult.response;
                return genResponse.text();
            })();
            return Promise.race([genPromise, timeoutPromise]);
        };

        try {
            console.log(`[SGSST Diagnostico] Attempting Generation with ${selectedModel}`);
            const modelPrimary = genAI.getGenerativeModel({ model: selectedModel, generationConfig });
            text = await generateWithTimeout(modelPrimary, promptText);
        } catch (primaryError) {
            console.warn(`[SGSST Diagnostico] Primary model (${selectedModel}) failed, attempting fallback to gemini-2.0-flash-exp. Error:`, primaryError.message);
            // If it was a timeout, don't retry — inform user immediately
            if (primaryError.message.includes('TIMEOUT')) {
                throw primaryError;
            }
            try {
                // Fallback to previous stable/experimental version
                const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp', generationConfig });
                text = await generateWithTimeout(modelFallback, promptText);
            } catch (fallbackError) {
                console.error('[SGSST Diagnostico] All models failed.');
                throw fallbackError; // Re-throw to main catch
            }
        }

        // Clean up: remove code blocks, full HTML document wrappers
        let cleanedReport = text
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Strip full HTML document structure if AI still generates it
        const bodyMatch = cleanedReport.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedReport = bodyMatch[1].trim();
        }
        // Remove DOCTYPE, html, head, style tags
        cleanedReport = cleanedReport
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        res.json({
            report: cleanedReport,
            conversationId: crypto.randomUUID(), // Return new ID for UI
            summary: {
                score,
                totalPoints,
                percentage: parseFloat(percentage),
                level: complianceLevel.level,
                compliant: completedItems.length,
                partial: partialItems.length,
                nonCompliant: nonCompliantItems.length,
            }
        });

    } catch (error) {
        console.error('[SGSST CRITICAL ERROR] Diagnostic Analysis Failed:', {
            message: error.message,
            stack: error.stack,
            payloadSummary: {
                checklistLength: checklist?.length,
                score,
                totalPoints,
                modelName: 'gemini-2.5-flash-preview-09-2025 (+fallback)'
            }
        });
        logger.error('[SGSST Diagnostico] Analysis error:', error);
        res.status(500).json({ error: `Error generando análisis: ${error.message}` });
    }
});

/**
 * POST /api/sgsst/diagnostico/save-report
 * Saves a new SGSST diagnostic report as a conversation+message and tags it.
 */
router.post('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { content, title, tags } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const dateStr = new Date().toLocaleString('es-CO');
        const reportTitle = title || `Diagnóstico SGSST - ${dateStr}`;
        const reportTags = tags || ['sgsst-diagnostico'];

        // 1. Save conversation
        await saveConvo(req, {
            conversationId,
            title: reportTitle,
            endpoint: 'sgsst-diagnostico',
            model: 'sgsst-diagnostico',
        }, { context: 'SGSST save-report' });

        // 2. Save message with the report content
        await saveMessage(req, {
            messageId,
            conversationId,
            text: content,
            sender: 'SGSST Diagnóstico',
            isCreatedByUser: false,
            parentMessageId: '00000000-0000-0000-0000-000000000000',
        }, { context: 'SGSST save-report message' });

        // 3. Tag the conversation
        try {
            await updateTagsForConversation(
                req.user.id,
                conversationId,
                reportTags,
            );
        } catch (tagErr) {
            logger.warn('[SGSST] Error tagging conversation:', tagErr);
        }

        res.status(201).json({
            conversationId,
            messageId,
            title: reportTitle,
        });
    } catch (error) {
        logger.error('[SGSST save-report] Error:', error);
        res.status(500).json({ error: 'Error saving report' });
    }
});

/**
 * PUT /api/sgsst/diagnostico/save-report
 * Updates an existing SGSST diagnostic report message.
 */
router.put('/save-report', requireJwtAuth, async (req, res) => {
    try {
        const { conversationId, messageId, content } = req.body;
        if (!conversationId || !messageId || !content) {
            return res.status(400).json({ error: 'conversationId, messageId, and content are required' });
        }

        await updateMessageText(req, { messageId, text: content });

        res.json({ success: true, conversationId, messageId });
    } catch (error) {
        logger.error('[SGSST save-report update] Error:', error);
        res.status(500).json({ error: 'Error updating report' });
    }
});

/**
 * GET /api/sgsst/diagnostico/checklist
 * Returns the applicable checklist items based on filters
 */
router.get('/checklist', (req, res) => {
    const { size = 'medium', risk = '3' } = req.query;

    // The checklist data is handled on the frontend
    // This endpoint can be used for future server-side filtering
    res.json({
        message: 'Checklist data is managed on the frontend',
        filters: { size, risk }
    });
});

module.exports = router;
