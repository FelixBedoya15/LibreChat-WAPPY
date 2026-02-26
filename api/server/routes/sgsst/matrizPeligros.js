const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString } = require('./reportHeader');

// ─── Mongoose Schema ─────────────────────────────────────────────────
const PeligroItemSchema = new mongoose.Schema({
    id: String,
    // AI-completed fields / Valuation fields
    descripcionPeligro: String,
    clasificacion: String,
    efectosPosibles: String,
    fuenteGeneradora: String,
    medioExistente: String,
    individuoControl: String,
    // Risk valuation
    nivelDeficiencia: Number,
    nivelExposicion: Number,
    nivelProbabilidad: Number,
    interpretacionNP: String,
    nivelConsecuencia: Number,
    nivelRiesgo: Number,
    interpretacionNR: String,
    aceptabilidad: String,
    numExpuestos: Number,
    // Hygiene
    deficienciaHigienica: String,
    valoracionCuantitativa: String,
    // Anexo E: Factores de Reducción y Justificación
    nrFinal: Number,
    factorReduccion: Number,
    costoIntervencion: String,
    factorCosto: Number,
    factorJustificacion: Number,
    justificacion: String,
    // Intervention
    eliminacion: String,
    sustitucion: String,
    controlIngenieria: String,
    controlAdministrativo: String,
    epp: String,
    // State
    completedByAI: { type: Boolean, default: false },
}, { _id: false });

const ProcesoEntrySchema = new mongoose.Schema({
    id: String,
    proceso: String,
    zona: String,
    actividad: String,
    tarea: String,
    rutinario: { type: Boolean, default: true },
    controlesExistentes: String,
    peligros: [PeligroItemSchema],
}, { _id: false });

const MatrizPeligrosDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    procesos: [ProcesoEntrySchema],
    updatedAt: { type: Date, default: Date.now },
});

MatrizPeligrosDataSchema.index({ user: 1 }, { unique: true });

const MatrizPeligrosData = mongoose.models.MatrizPeligrosData || mongoose.model('MatrizPeligrosData', MatrizPeligrosDataSchema);

// ─── Helper: Get API Key ─────────────────────────────────────────────
async function getApiKey(userId) {
    let resolvedApiKey;
    try {
        const storedKey = await getUserKey({ userId, name: 'google' });
        try {
            const parsed = JSON.parse(storedKey);
            resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
        } catch {
            resolvedApiKey = storedKey;
        }
    } catch {
        logger.debug('[SGSST MatrizPeligros] No user Google key, trying env');
    }
    if (!resolvedApiKey) {
        resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
    }
    if (resolvedApiKey && typeof resolvedApiKey === 'string') {
        resolvedApiKey = resolvedApiKey.split(',')[0].trim();
    }
    return resolvedApiKey;
}

// ─── GTC 45 Reference Tables (for AI prompt) ─────────────────────────
const GTC45_TABLES = `
## TABLAS DE REFERENCIA GTC 45

### Nivel de Deficiencia (ND)
| Nivel | ND | Significado |
|---|---|---|
| Muy Alto (MA) | 10 | Se ha(n) detectado peligro(s) que determina(n) como posible la generación de incidentes, o la eficacia del conjunto de medidas preventivas existentes respecto al riesgo es nula o no existe, o ambos. |
| Alto (A) | 6 | Se ha(n) detectado algún(os) peligro(s) que pueden dar lugar a incidentes significativo(s), o la eficacia del conjunto de medidas preventivas existentes es baja, o ambos. |
| Medio (M) | 2 | Se han detectado peligros que pueden dar lugar a incidentes poco significativos o de menor importancia, o la eficacia del conjunto de medidas preventivas existentes es moderada, o ambos. |
| Bajo (B) | 0 | No se ha detectado consecuencia alguna, o la eficacia del conjunto de medidas preventivas existentes es alta, o ambos. El riesgo está controlado. |

### Nivel de Exposición (NE)
| Nivel | NE | Significado |
|---|---|---|
| Continua (EC) | 4 | La situación de exposición se presenta sin interrupción o varias veces con tiempo prolongado durante la jornada laboral. |
| Frecuente (EF) | 3 | La situación de exposición se presenta varias veces durante la jornada laboral por tiempos cortos. |
| Ocasional (EO) | 2 | La situación de exposición se presenta alguna vez durante la jornada laboral y por un período de tiempo corto. |
| Esporádica (EE) | 1 | La situación de exposición se presenta de manera eventual. |

### Nivel de Probabilidad (NP = ND × NE)
| NP | Interpretación |
|---|---|
| 40-24 | Muy Alto (MA): Situación deficiente con exposición continua, o muy deficiente con exposición frecuente. |
| 20-10 | Alto (A): Situación deficiente con exposición frecuente u ocasional, o bien situación muy deficiente con exposición ocasional o esporádica. |
| 8-6 | Medio (M): Situación deficiente con exposición esporádica, o bien situación mejorable con exposición continuada o frecuente. |
| 4-2 | Bajo (B): Situación mejorable con exposición ocasional o esporádica. No es esperable que se materialice el riesgo. |

### Nivel de Consecuencia (NC)
| Nivel | NC | Significado |
|---|---|---|
| Mortal o Catastrófico (M) | 100 | Muerte(s). |
| Muy Grave (MG) | 60 | Lesiones o enfermedades graves irreparables (incapacidad permanente parcial o invalidez). |
| Grave (G) | 25 | Lesiones o enfermedades con incapacidad laboral temporal (ILT). |
| Leve (L) | 10 | Lesiones o enfermedades que no requieren incapacidad laboral. |

### Nivel de Riesgo (NR = NP × NC) y Aceptabilidad
| NR | Nivel de Riesgo | Aceptabilidad |
|---|---|---|
| 4000-600 | I - Muy Alto | No Aceptable |
| 500-150 | II - Alto | No Aceptable o Aceptable con control específico |
| 120-40 | III - Medio | Aceptable |
| 20 | IV - Bajo | Aceptable |

### Clasificación de Peligros
- **Biológico**: Virus, bacterias, hongos, ricketsias, parásitos, picaduras, mordeduras, fluidos.
- **Físico**: Ruido, iluminación, vibración, temperaturas extremas, presión atmosférica, radiaciones ionizantes/no ionizantes.
- **Químico**: Polvos, fibras, líquidos (nieblas/rocíos), gases y vapores, humos metálicos/no metálicos, material particulado.
- **Psicosocial**: Gestión organizacional, características de la organización del trabajo, del grupo social, condiciones de la tarea, interfaz persona-tarea, jornada de trabajo.
- **Biomecánico**: Postura (prolongada, mantenida, forzada, antigravitacional), esfuerzo, movimiento repetitivo, manipulación manual de cargas.
- **Condiciones de seguridad**: Mecánico, eléctrico, locativo, tecnológico, accidentes de tránsito, públicos, trabajo en alturas, espacios confinados.
- **Fenómenos naturales**: Sismo, terremoto, vendaval, inundación, derrumbe, precipitaciones.

### Determinación Cualitativa del Nivel de Deficiencia de los Peligros Higiénicos
Para peligros higiénicos (Físico, Químico, Biológico), cuando no se tiene medición ambiental, se usa la valoración cualitativa:
- **Muy Alto (MA)**: Exposición por encima de los límites permisibles (TLV, LEP), sin protección.
- **Alto (A)**: Exposición entre 50%-100% del límite permisible con protección parcial.
- **Medio (M)**: Exposición entre 10%-50% del límite permisible o controles aceptables.
- **Bajo (B)**: Exposición por debajo del 10% del límite permisible o riesgo controlado.

### Valoración Cuantitativa de los Peligros Higiénicos
Se debe indicar si existen mediciones ambientales y comparar con los TLV/LEP vigentes:
- Resultado medición vs. Valor Límite Permisible
- Grado de riesgo: Bajo (<25%), Medio (25-50%), Alto (50-100%), Muy Alto (>100%)

### Factores de Reducción y Justificación
Considerar: controles de ingeniería implementados, capacitación, rotación, EPP certificado, vigilancia médica, mantenimiento preventivo. Justificar si se reduce el nivel por estos factores.
`;

// ─── POST /complete — AI completion for a single hazard ──────────────
router.post('/complete', requireJwtAuth, async (req, res) => {
    try {
        const { proceso, peligro, modelName } = req.body;

        if (!proceso || !proceso.proceso || !proceso.actividad) {
            return res.status(400).json({ error: 'Contexto de Proceso y Actividad son obligatorios.' });
        }

        const apiKey = await getApiKey(req.user.id);
        if (!apiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        // Get company info for context
        let companyContext = '';
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            if (ci && ci.companyName) {
                companyContext = buildCompanyContextString(ci);
            }
        } catch (err) {
            logger.debug('[SGSST MatrizPeligros] No company info');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const selectedModel = modelName || 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({ model: selectedModel });

        const prompt = `
Eres un experto en Seguridad y Salud en el Trabajo (SST) en Colombia, especializado en la metodología GTC 45 para la identificación de peligros y valoración de riesgos.

${companyContext ? `**Contexto de la empresa:** ${companyContext}` : ''}

**DATOS DEL PELIGRO A ANALIZAR (Contexto de Proceso):**
- Proceso: ${proceso.proceso}
- Zona / Lugar: ${proceso.zona || 'No especificada'}
- Actividad: ${proceso.actividad}
- Tarea: ${proceso.tarea || 'No especificada'}
- Rutinario: ${proceso.rutinario ? 'Sí' : 'No'}
- Controles Existentes reportados: ${proceso.controlesExistentes || 'No reportados'}
${peligro?.descripcionPeligro ? `- Peligro específico ya identificado: ${peligro.descripcionPeligro}` : ''}

${GTC45_TABLES}

**INSTRUCCIONES:**
Analiza la actividad/tarea descrita y genera la valoración completa según GTC 45.
- SI la clasificación sugerida es Físico, Químico o Biológico (Higiénico), OBLIGATORIAMENTE evalúa "deficienciaHigienica" usando la escala cualitativa (Muy Alto (MA), Alto (A), Medio (M), Bajo (B)) y asigna el "nivelDeficiencia" numérico correspondiente (MA=10, A=6, M=2, B=0).
- Para CADA medida de intervención propuesta (eliminacion, sustitucion, ingenieria, administrativo, epp), DEBES asignar obligatoriamente un FR (>0) y FC (>0) asumiendo que el control SÍ se implementará. NUNCA los dejes en 0 si propones una medida.
- Evalúa mentalmente J = (NR * FR) / FC para cada medida y elige la más costo-efectiva. Llena "medidaSeleccionada" con esa medida.
- Añade "justificacion" (Anexo E) argumentando tu elección de la medida seleccionada.
Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, solo el objeto JSON puro).

**ESTRUCTURA JSON REQUERIDA (OBLIGATORIO RESPETAR ESTAS LLAVES):**
{
  "fuenteGeneradora": "Controles existentes en la fuente aplicables a la tarea (mención si no existen)",
  "medioExistente": "Controles existentes en el medio aplicables a la tarea (mención si no existen)",
  "individuoControl": "Controles existentes en el individuo aplicables a la tarea",
  "descripcionPeligro": "Descripción detallada del peligro identificado",
  "clasificacion": "Categoría del peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de seguridad, Fenómenos naturales)",
  "efectosPosibles": "Efectos posibles sobre la salud del trabajador",
  "nivelDeficiencia": <número: 0, 2, 6 o 10>,
  "nivelExposicion": <número: 1, 2, 3 o 4>,
  "nivelProbabilidad": <número: ND × NE>,
  "interpretacionNP": "Bajo/Medio/Alto/Muy Alto con justificación corta",
  "nivelConsecuencia": <número: 10, 25, 60 o 100>,
  "nivelRiesgo": <número: NP × NC>,
  "interpretacionNR": "I/II/III/IV - Descripción",
  "aceptabilidad": "Aceptable / No Aceptable / No Aceptable con control específico",
  "numExpuestos": <número estimado>,
  "deficienciaHigienica": "Valoración cualitativa: MA/A/M/B con justificación (solo para peligros higiénicos, o N/A)",
  "valoracionCuantitativa": "Indicar si existen mediciones, valor vs TLV, grado (o N/A si no aplica)",
  "justificacion": "Justificación técnica de la valoración (Anexo E)",
  "medidaSeleccionada": "Escribe aquí la medida sugerida (de las 5 de abajo) que tenga el mayor Costo-Beneficio",
  
  "eliminacion": "Medida de eliminación recomendada (o 'No aplica')",
  "fr_eliminacion": <número: porcentaje reducción estimado (100, 75, 50, 25, 0)>,
  "fc_eliminacion": <número: factor 'd' asociado al costo. Usa 10, 8, 6, 4, 2, 1, o 0.5 (o 0 si no aplica)>,

  "sustitucion": "Medida de sustitución recomendada (o 'No aplica')",
  "fr_sustitucion": <número: porcentaje reducción (100, 75, 50, 25, 0)>,
  "fc_sustitucion": <número: factor 'd' (10, 8, 6, 4, 2, 1, 0.5 o 0)>,

  "controlIngenieria": "Medida de ingeniería recomendada",
  "fr_ingenieria": <número: porcentaje reducción (100, 75, 50, 25, 0)>,
  "fc_ingenieria": <número: factor 'd' (10, 8, 6, 4, 2, 1, 0.5 o 0)>,

  "controlAdministrativo": "Medidas administrativas recomendadas",
  "fr_administrativo": <número: porcentaje reducción (100, 75, 50, 25, 0)>,
  "fc_administrativo": <número: factor 'd' (10, 8, 6, 4, 2, 1, 0.5 o 0)>,

  "epp": "EPP requerido específico",
  "fr_epp": <número: porcentaje reducción (100, 75, 50, 25, 0)>,
  "fc_epp": <número: factor 'd' (10, 8, 6, 4, 2, 1, 0.5 o 0)>,
  "nrFinal": <número: NR estimado después de implementar todas las medidas de intervención propuestas>
}

Sé técnico, preciso y realista. Basa tu análisis en la actividad descrita.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Clean JSON from possible markdown formatting
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (parseErr) {
            logger.error('[SGSST MatrizPeligros] Failed to parse AI response:', text.substring(0, 200));
            return res.status(500).json({ error: 'Error al procesar la respuesta de IA. Intente de nuevo.' });
        }

        // Map qualitative to quantitative if not done correctly by AI
        if (['Muy Alto (MA)', 'Alto (A)', 'Medio (M)', 'Bajo (B)'].includes(parsed.deficienciaHigienica)) {
            if (parsed.deficienciaHigienica === 'Muy Alto (MA)') parsed.nivelDeficiencia = 10;
            else if (parsed.deficienciaHigienica === 'Alto (A)') parsed.nivelDeficiencia = 6;
            else if (parsed.deficienciaHigienica === 'Medio (M)') parsed.nivelDeficiencia = 2;
            else if (parsed.deficienciaHigienica === 'Bajo (B)') parsed.nivelDeficiencia = 0;
        }

        // Validate calculated fields
        parsed.nivelProbabilidad = (Number(parsed.nivelDeficiencia) || 0) * (Number(parsed.nivelExposicion) || 0);
        parsed.nivelRiesgo = parsed.nivelProbabilidad * (Number(parsed.nivelConsecuencia) || 0);

        // Calibrate J individually
        const nr = parsed.nivelRiesgo;

        const calcJ = (fr, fc) => {
            const frNum = (Number(fr) || 0) / 100; // Treat FR as a percentage decimal
            const fcNum = Number(fc) || 1;
            return fcNum > 0 ? Number(((nr * frNum) / fcNum).toFixed(2)) : 0;
        };

        // Normalization functions for UI dropdown alignment
        const snapFR = (val, measureText) => {
            const valid = [0, 25, 50, 75, 100];
            const cleanVal = String(val).replace(/[^\d.-]/g, '');
            let num = Number(cleanVal);
            if (num > 0 && num <= 1) num *= 100; // Hand fractional AI responses like 0.75 -> 75%

            const hasText = measureText && typeof measureText === 'string' && measureText.trim() !== '' && measureText.toLowerCase() !== 'no aplica' && measureText.toLowerCase() !== 'ninguno';

            if ((isNaN(num) || num === 0) && hasText) {
                num = 25; // Force minimum FR if a measure is proposed
            } else if (isNaN(num)) {
                return 0;
            }
            return valid.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
        };

        const snapFC = (val, measureText) => {
            const valid = [0.5, 1, 2, 4, 6, 8, 10];
            const cleanVal = String(val).replace(/[^\d.-]/g, '');
            let num = Number(cleanVal);

            const hasText = measureText && typeof measureText === 'string' && measureText.trim() !== '' && measureText.toLowerCase() !== 'no aplica' && measureText.toLowerCase() !== 'ninguno';

            if ((isNaN(num) || num === 0) && hasText) {
                num = 1; // Force minimum FC if a measure is proposed
            } else if (isNaN(num) || num === 0) {
                return 1;
            }
            return valid.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
        };

        parsed.fr_eliminacion = snapFR(parsed.fr_eliminacion, parsed.eliminacion);
        parsed.fc_eliminacion = snapFC(parsed.fc_eliminacion, parsed.eliminacion);
        parsed.fr_sustitucion = snapFR(parsed.fr_sustitucion, parsed.sustitucion);
        parsed.fc_sustitucion = snapFC(parsed.fc_sustitucion, parsed.sustitucion);
        parsed.fr_ingenieria = snapFR(parsed.fr_ingenieria, parsed.controlIngenieria);
        parsed.fc_ingenieria = snapFC(parsed.fc_ingenieria, parsed.controlIngenieria);
        parsed.fr_administrativo = snapFR(parsed.fr_administrativo, parsed.controlAdministrativo);
        parsed.fc_administrativo = snapFC(parsed.fc_administrativo, parsed.controlAdministrativo);
        parsed.fr_epp = snapFR(parsed.fr_epp, parsed.epp);
        parsed.fc_epp = snapFC(parsed.fc_epp, parsed.epp);

        parsed.j_eliminacion = calcJ(parsed.fr_eliminacion, parsed.fc_eliminacion);
        parsed.j_sustitucion = calcJ(parsed.fr_sustitucion, parsed.fc_sustitucion);
        parsed.j_ingenieria = calcJ(parsed.fr_ingenieria, parsed.fc_ingenieria);
        parsed.j_administrativo = calcJ(parsed.fr_administrativo, parsed.fc_administrativo);
        parsed.j_epp = calcJ(parsed.fr_epp, parsed.fc_epp);
        parsed.completedByAI = true;

        res.json({ completed: parsed });

    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Completion error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

// ─── POST /generate-full — Generate 5 processes with hazards and valuation ─
router.post('/generate-full', requireJwtAuth, async (req, res) => {
    try {
        const { modelName } = req.body;
        const apiKey = await getApiKey(req.user.id);
        if (!apiKey) return res.status(400).json({ error: 'No API Key' });

        let companyContext = '';
        const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
        if (ci) companyContext = buildCompanyContextString(ci);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const systemPrompt = `Eres un experto en SST de Colombia (GTC 45 y Decreto 1072/2015).
Tu tarea es generar la estructura inicial de una Matriz de Peligros para la siguiente empresa:
Nombre: ${ci.companyName || 'Empresa'}
Sector/Actividad: ${ci.economicActivity || 'General'}
Nivel de Riesgo: ${ci.riskLevel || 'N/A'}

Genera exactamente 7 procesos principales que sean lógicos para este tipo de empresa.
Para CADA proceso, identifica de 5 a 8 peligros críticos (GTC 45) aplicables para ese proceso. Sé exhaustivo e incluye los peligros más relevantes (biomecánicos, físicos, psicosociales, biológicos, de seguridad, etc.).
Para CADA peligro, realiza la valoración de riesgo GTC 45 completa:
- Proporciona ND, NE. NC será calculado por la IA basándose en posibles efectos. NR = (ND x NE) x NC.
- Proporciona la aceptabilidad, controles sugeridos, y completa *todos* los campos numéricos y de texto del esquema.
- Para CADA medida de intervención propuesta, asigna un FR y FC mayor a 0, asumiendo que se implementará.
- Define "medidaSeleccionada" indicando la de mayor costo-beneficio (mayor J).

Esquema JSON Requerido (DEBE responder solo con JSON puro, sin markdown):
{
  "procesos": [
    {
      "proceso": "Nombre del Proceso",
      "zona": "Lugar o área",
      "actividad": "Descripción de la actividad principal",
      "tarea": "Tarea específica",
      "rutinario": true,
      "fuenteGeneradora": "Controles existentes en la fuente aplicables a todo el proceso",
      "medioExistente": "Controles existentes en el medio aplicables a todo el proceso",
      "individuoControl": "Controles existentes en el individuo aplicables a todo el proceso",
      "peligros": [
        {
          "id": "hazard-uuid-1",
          "descripcionPeligro": "Descripción específica",
          "clasificacion": "Biomécanico",
          "efectosPosibles": "Lesiones osteomusculares",
          "nivelDeficiencia": 6,
          "nivelExposicion": 3,
          "nivelConsecuencia": 25,
          "interpretacionNP": "Alto",
          "interpretacionNR": "II",
          "aceptabilidad": "No Aceptable",
          "numExpuestos": 5,
          "eliminacion": "...", "fr_eliminacion": 0, "fc_eliminacion": 0, "j_eliminacion": 0,
          "sustitucion": "...", "fr_sustitucion": 0, "fc_sustitucion": 0, "j_sustitucion": 0,
          "controlIngenieria": "...", "fr_ingenieria": 0, "fc_ingenieria": 0, "j_ingenieria": 0,
          "controlAdministrativo": "...", "fr_administrativo": 0, "fc_administrativo": 0, "j_administrativo": 0,
          "epp": "...", "fr_epp": 0, "fc_epp": 0, "j_epp": 0,
          "nrFinal": 100,
          "medidaSeleccionada": "...",
          "justificacion": "..."
        }
      ]
    }
  ]
}`;

        const result = await model.generateContent(systemPrompt);
        let text = result.response.text().trim();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);

        const calcJ = (nr, fr, fc) => {
            const frNum = (Number(fr) || 0) / 100; // Treat FR as a percentage decimal
            const fcNum = Number(fc) || 1;
            return fcNum > 0 ? Number(((nr * frNum) / fcNum).toFixed(2)) : 0;
        };

        const finalProcesos = (parsed.procesos || []).map(proc => ({
            ...proc,
            id: proc.id || crypto.randomUUID(),
            peligros: (proc.peligros || []).map(h => {
                const nd = Number(h.nivelDeficiencia) || 0;
                const ne = Number(h.nivelExposicion) || 0;
                const nc = Number(h.nivelConsecuencia) || 0;
                const np = nd * ne;
                const nr = np * nc;

                // Normalization functions for UI dropdown alignment
                const snapFR = (val, measureText) => {
                    const valid = [0, 25, 50, 75, 100];
                    const cleanVal = String(val).replace(/[^\d.-]/g, '');
                    let num = Number(cleanVal);
                    if (num > 0 && num <= 1) num *= 100;

                    const hasText = measureText && typeof measureText === 'string' && measureText.trim() !== '' && measureText.toLowerCase() !== 'no aplica' && measureText.toLowerCase() !== 'ninguno';

                    if ((isNaN(num) || num === 0) && hasText) {
                        num = 25;
                    } else if (isNaN(num)) {
                        return 0;
                    }
                    return valid.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
                };

                const snapFC = (val, measureText) => {
                    const valid = [0.5, 1, 2, 4, 6, 8, 10];
                    const cleanVal = String(val).replace(/[^\d.-]/g, '');
                    let num = Number(cleanVal);

                    const hasText = measureText && typeof measureText === 'string' && measureText.trim() !== '' && measureText.toLowerCase() !== 'no aplica' && measureText.toLowerCase() !== 'ninguno';

                    if ((isNaN(num) || num === 0) && hasText) {
                        num = 1;
                    } else if (isNaN(num) || num === 0) {
                        return 1;
                    }
                    return valid.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
                };

                const snapped_fr_eliminacion = snapFR(h.fr_eliminacion, h.eliminacion);
                const snapped_fc_eliminacion = snapFC(h.fc_eliminacion, h.eliminacion);
                const snapped_fr_sustitucion = snapFR(h.fr_sustitucion, h.sustitucion);
                const snapped_fc_sustitucion = snapFC(h.fc_sustitucion, h.sustitucion);
                const snapped_fr_ingenieria = snapFR(h.fr_ingenieria, h.controlIngenieria);
                const snapped_fc_ingenieria = snapFC(h.fc_ingenieria, h.controlIngenieria);
                const snapped_fr_administrativo = snapFR(h.fr_administrativo, h.controlAdministrativo);
                const snapped_fc_administrativo = snapFC(h.fc_administrativo, h.controlAdministrativo);
                const snapped_fr_epp = snapFR(h.fr_epp, h.epp);
                const snapped_fc_epp = snapFC(h.fc_epp, h.epp);

                return {
                    ...h,
                    id: h.id || crypto.randomUUID(),
                    nivelProbabilidad: np,
                    nivelRiesgo: nr,
                    fr_eliminacion: snapped_fr_eliminacion,
                    fc_eliminacion: snapped_fc_eliminacion,
                    fr_sustitucion: snapped_fr_sustitucion,
                    fc_sustitucion: snapped_fc_sustitucion,
                    fr_ingenieria: snapped_fr_ingenieria,
                    fc_ingenieria: snapped_fc_ingenieria,
                    fr_administrativo: snapped_fr_administrativo,
                    fc_administrativo: snapped_fc_administrativo,
                    fr_epp: snapped_fr_epp,
                    fc_epp: snapped_fc_epp,
                    j_eliminacion: calcJ(nr, snapped_fr_eliminacion, snapped_fc_eliminacion),
                    j_sustitucion: calcJ(nr, snapped_fr_sustitucion, snapped_fc_sustitucion),
                    j_ingenieria: calcJ(nr, snapped_fr_ingenieria, snapped_fc_ingenieria),
                    j_administrativo: calcJ(nr, snapped_fr_administrativo, snapped_fc_administrativo),
                    j_epp: calcJ(nr, snapped_fr_epp, snapped_fc_epp),
                    completedByAI: true
                };
            })
        }));

        res.json({ procesos: finalProcesos });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Generate-full error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─── GET /data — Load saved hazard matrix ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await MatrizPeligrosData.findOne({ user: req.user.id });
        if (data && data.procesos?.length) {
            return res.json({ procesos: data.procesos });
        }
        // Migration: If legacy entries exist, we could return them, but for simplicity we start fresh
        // or the client can handle the transition.
        res.json({ procesos: [] });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save hazard matrix data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { procesos } = req.body;
        if (!procesos) {
            return res.status(400).json({ error: 'Datos requeridos' });
        }

        await MatrizPeligrosData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { procesos, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

// ─── POST /analyze — Generate AI Exec Report for Matrix ─────────────────────────────
router.post('/analyze', requireJwtAuth, async (req, res) => {
    try {
        const { procesos, currentDate, userName, modelName = 'gemini-3-flash-preview' } = req.body;

        if (!procesos || !Array.isArray(procesos) || procesos.length === 0) {
            return res.status(400).json({ error: 'No hay procesos para analizar.' });
        }

        const resolvedApiKey = await getApiKey(req.user.id);
        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        let loadedCompanyInfo = null;
        try {
            loadedCompanyInfo = await CompanyInfo.findOne({ user: req.user.id }).lean();
        } catch (ciErr) {
            logger.warn('[SGSST MatrizPeligros] Error loading company info:', ciErr.message);
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);

        const empresa = loadedCompanyInfo?.companyName || 'EMPRESA';
        const nit = loadedCompanyInfo?.nit || 'NIT';
        const representante = loadedCompanyInfo?.legalRepresentative || userName || 'No registrado';
        const trabajadores = loadedCompanyInfo?.workerCount || 'N/A';
        const riesgo = loadedCompanyInfo?.riskLevel || 'N/A';
        const arl = loadedCompanyInfo?.arl || 'N/A';
        const fechaEmision = currentDate || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

        const headerHTML = `
<div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #004d99; font-size: 26px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
        INFORME EJECUTIVO DE MATRIZ DE PELIGROS
    </h1>
    <h2 style="color: #475569; font-size: 18px; font-weight: 600; border-bottom: 3px solid #004d99; padding-bottom: 12px; margin-top: 0; display: inline-block;">
        Guía Técnica Colombiana GTC 45
    </h2>
</div>

<table style="width: 100%; table-layout: fixed; word-wrap: break-word; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; margin-bottom: 24px; font-family: inherit;">
  <thead>
    <tr>
      <th colspan="4" style="background-color: #004d99; color: white; text-align: left; padding: 12px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        INFORMACIÓN RESUMIDA DE LA ENTIDAD
      </th>
    </tr>
  </thead>
  <tbody style="font-size: 14px; color: #1e293b;">
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Empresa:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${empresa}</td>
      <td style="padding: 10px 14px; font-weight: 700; width: 20%; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">NIT:</td>
      <td style="padding: 10px 14px; width: 30%; border-bottom: 1px solid #ddd;">${nit}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Representante:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${representante}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">N° Trabajadores:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${trabajadores}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Nivel de Riesgo:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">${riesgo}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #ddd; border-right: 1px solid #eee;">Fecha de Emisión:</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #ddd;">${fechaEmision}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;">ARL:</td>
      <td style="padding: 10px 14px; border-right: 1px solid #eee;">${arl}</td>
      <td style="padding: 10px 14px; font-weight: 700; border-right: 1px solid #eee;">Norma:</td>
      <td style="padding: 10px 14px;">GTC 45 / Decreto 1072</td>
    </tr>
  </tbody>
</table>`;

        // Summary of risks for the prompt
        let totalPeligros = 0;
        let riskLevels = { I: 0, II: 0, III: 0, IV: 0 };
        let criticalPeligros = [];

        procesos.forEach(p => {
            p.peligros.forEach(h => {
                totalPeligros++;
                if (h.nivelRiesgo >= 600) { riskLevels.I++; criticalPeligros.push(`${p.proceso}: ${h.descripcionPeligro}`); }
                else if (h.nivelRiesgo >= 150) { riskLevels.II++; criticalPeligros.push(`${p.proceso}: ${h.descripcionPeligro}`); }
                else if (h.nivelRiesgo >= 40) riskLevels.III++;
                else riskLevels.IV++;
            });
        });

        const promptText = `Eres un Experto en Seguridad y Salud en el Trabajo (SGSST) en Colombia, especializado en la Guía Técnica Colombiana GTC 45.
Se ha evaluado la Matriz de Peligros de la empresa.

**Resumen de Hallazgos:**
- Total de Procesos Evaluados: ${procesos.length}
- Total de Peligros Identificados: ${totalPeligros}
- Peligros Críticos (I - No Aceptable): ${riskLevels.I}
- Peligros Altos (II - No Aceptable o Aceptable con Control Specifico): ${riskLevels.II}
- Peligros Medios (III - Mejorable): ${riskLevels.III}
- Peligros Bajos (IV - Aceptable): ${riskLevels.IV}

${criticalPeligros.length > 0 ? `**Principales Peligros (Nivel I y II):**\n${criticalPeligros.slice(0, 10).map(c => `- ${c}`).join('\n')}` : ''}

**Tu tarea:**
Escribe un INFORME EJECUTIVO profesional (en formato HTML) que documente los hallazgos de esta Matriz de Peligros.
ESTRUCTURA EXACTA REQUERIDA (en div y HTML limpio sin markdown):
1. Un resumen analítico del estado actual de los riesgos en la empresa según los datos reportados.
2. Un análisis cualitativo o conclusiones de los principales peligros evaluados (menciona los procesos afectados).
3. Asegúrate de incluir en tu análisis reflexiones sobre la evaluación cualitativa de riesgos higiénicos (Anexo C) y/o los factores de justificación de intervención (Anexo E), si están presentes en los peligros críticos.
4. Recomendaciones prioritarias urgentes (Jerarquía de Controles) enfocadas a la mitigación.

Usa un tono corporativo. Retorna SOLAMENTE CÓDIGO HTML VÁLIDO SIN etiquetas \`\`\`html. No incluyas un título principal (<code>h1</code>) porque ya está en el encabezado.

**ESTILOS OBLIGATORIOS (CSS INLINE) - PRECAUCIÓN MODO OSCURO:**
- **Regla Crítica:** NO uses clases de Tailwind, usa exclusivamente CSS inline.
- Los contenedores principales (divs, cajas, tarjetas) deben tener \`style="width: 100%; box-sizing: border-box;"\` para no quedar angostos respecto a la tabla superior.
- Cada vez que apliques un \`background-color\` a un elemento (tr, td, div), **DEBES OBLIGATORIAMENTE** especificar \`color: #000;\` (si el fondo es claro) o \`color: #fff;\` (si el fondo es oscuro).
- Títulos (h2, h3): Color azul oscuro (#004d99) con \`color: #004d99;\` explícito.
- Tablas generadas por la IA: width="100%", table-layout="fixed", word-wrap="break-word", border-collapse="separate", border-spacing="0", border-radius="12px", overflow="hidden", border="1px solid #ddd", th con background-color="#004d99" y color="white".
- Celdas (td): padding="10px", border-bottom="1px solid #ddd" (sin background-color predeterminado para que hereden el modo oscuro).`;

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        let aiHtml = result.response.text().trim();
        aiHtml = aiHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        const fullReport = `${headerHTML}
<div class="mt-8 space-y-6">
  ${aiHtml}
</div>`;

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Analyze error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
