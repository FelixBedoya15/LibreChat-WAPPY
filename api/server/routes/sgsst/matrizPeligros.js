const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');

// ─── Mongoose Schema ─────────────────────────────────────────────────
const PeligroEntrySchema = new mongoose.Schema({
    id: String,
    proceso: String,
    zona: String,
    actividad: String,
    tarea: String,
    rutinario: { type: Boolean, default: true },
    // AI-completed fields
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
    factorReduccion: String,
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

const MatrizPeligrosDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entries: [PeligroEntrySchema],
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
        const { entry, modelName } = req.body;

        if (!entry || !entry.proceso || !entry.actividad) {
            return res.status(400).json({ error: 'Proceso y Actividad son obligatorios.' });
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
                companyContext = `Empresa: ${ci.companyName}, Sector: ${ci.economicActivity || 'General'}, Riesgo: ${ci.riskLevel || 'No especificado'}`;
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

**DATOS DEL PELIGRO A ANALIZAR (ingresados por el usuario):**
- Proceso: ${entry.proceso}
- Zona / Lugar: ${entry.zona || 'No especificada'}
- Actividad: ${entry.actividad}
- Tarea: ${entry.tarea || 'No especificada'}
- Rutinario: ${entry.rutinario ? 'Sí' : 'No'}

${GTC45_TABLES}

**INSTRUCCIONES:**
Analiza la actividad/tarea descrita y genera la valoración completa según GTC 45.
Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, solo el objeto JSON puro).

**ESTRUCTURA JSON REQUERIDA:**
{
  "descripcionPeligro": "Descripción detallada del peligro identificado",
  "clasificacion": "Categoría del peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de seguridad, Fenómenos naturales)",
  "efectosPosibles": "Efectos posibles sobre la salud del trabajador",
  "fuenteGeneradora": "Fuente que genera el peligro",
  "medioExistente": "Controles existentes en el medio (mención si no existen)",
  "individuoControl": "Controles existentes en el individuo/EPP",
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
  "factorReduccion": "Factores que reducen el riesgo (o 'Ninguno identificado')",
  "justificacion": "Justificación técnica de la valoración",
  "eliminacion": "Medida de eliminación recomendada (o 'No aplica')",
  "sustitucion": "Medida de sustitución recomendada (o 'No aplica')",
  "controlIngenieria": "Medida de ingeniería recomendada",
  "controlAdministrativo": "Medidas administrativas recomendadas",
  "epp": "EPP requerido específico"
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

        // Validate calculated fields
        parsed.nivelProbabilidad = (parsed.nivelDeficiencia || 0) * (parsed.nivelExposicion || 0);
        parsed.nivelRiesgo = parsed.nivelProbabilidad * (parsed.nivelConsecuencia || 0);
        parsed.completedByAI = true;

        res.json({ completed: parsed });

    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Completion error:', error);
        res.status(500).json({ error: `Error: ${error.message}` });
    }
});

// ─── GET /data — Load saved hazard matrix ─────────────────────────────
router.get('/data', requireJwtAuth, async (req, res) => {
    try {
        const data = await MatrizPeligrosData.findOne({ user: req.user.id });
        res.json({ entries: data?.entries || [] });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Load error:', error);
        res.status(500).json({ error: 'Error al cargar datos' });
    }
});

// ─── POST /save — Save hazard matrix data ─────────────────────────────
router.post('/save', requireJwtAuth, async (req, res) => {
    try {
        const { entries } = req.body;
        if (!entries) {
            return res.status(400).json({ error: 'Datos requeridos' });
        }

        await MatrizPeligrosData.findOneAndUpdate(
            { user: req.user.id },
            { $set: { entries, updatedAt: new Date() } },
            { upsert: true, new: true }
        );

        res.json({ success: true });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Save error:', error);
        res.status(500).json({ error: 'Error al guardar datos' });
    }
});

module.exports = router;
