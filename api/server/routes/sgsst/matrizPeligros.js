const express = require('express');
const { generateWithKeyRotation, resolveApiKeys } = require('./sgsstGemini');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');


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
    images: {
        foto1: String,
        foto2: String,
        foto3: String,
        foto1Desc: String,
        foto2Desc: String,
        foto3Desc: String
    },
    video: String,
    peligros: [PeligroItemSchema],
}, { _id: false });

const MatrizPeligrosDataSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    procesos: [ProcesoEntrySchema],
    updatedAt: { type: Date, default: Date.now },
});

MatrizPeligrosDataSchema.index({ user: 1 }, { unique: true });

const MatrizPeligrosData = mongoose.models.MatrizPeligrosData || mongoose.model('MatrizPeligrosData', MatrizPeligrosDataSchema);

/**
 * HELPER: Build integrated SST context from all modules
 * This fulfills the request to have context from the entire company database
 */
async function getIntegratedSSTContext(userId) {
    let context = '\n\n**ECOSISTEMA SST INTEGRADO (CONTEXTO MULTI-APLICATIVO):**\n';
    try {
        // 1. Perfil Sociodemográfico (Hallazgos médicos)
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (PerfilSociodemograficoData) {
            const psd = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
            if (psd && psd.trabajadores?.length) {
                const withFindings = psd.trabajadores.filter(t => t.diagnosticoMedico && t.diagnosticoMedico !== 'Apto / Sin Hallazgos');
                context += `- **Salud (Perfil Sociodemográfico)**: ${psd.trabajadores.length} trabajadores. CASOS CRÍTICOS: ${withFindings.slice(0, 5).map(t => `${t.cargo}: ${t.diagnosticoMedico}`).join('; ')}.\n`;
            }
        }

        // 2. Perfiles de Cargo
        const PerfilCargoData = mongoose.models.PerfilCargoData;
        if (PerfilCargoData) {
            const pcd = await PerfilCargoData.findOne({ user: userId }).lean();
            if (pcd && pcd.perfilesList?.length) {
                context += `- **Perfiles de Cargo**: ${pcd.perfilesList.length} cargos documentados (Ej: ${pcd.perfilesList.slice(0, 5).map(p => p.nombreCargo).join(', ')}).\n`;
            }
        }

        // 3. Siniestralidad ATEL (Estadísticas anuales)
        const ATELAnnualData = mongoose.models.ATELAnnualData;
        if (ATELAnnualData) {
            const ad = await ATELAnnualData.findOne({ user: userId }).lean();
            if (ad && ad.years) {
                const years = Object.keys(ad.years).sort().reverse();
                if (years.length > 0) {
                    let totalEvents = 0;
                    let commonHazards = new Set();
                    Object.values(ad.years[years[0]]).forEach(m => {
                        if (m?.events) {
                            totalEvents += m.events.length;
                            m.events.forEach(e => { if (e.peligro) commonHazards.add(e.peligro); });
                        }
                    });
                    if (totalEvents > 0) {
                        context += `- **Estadísticas ATEL**: ${totalEvents} accidentes este año. Causas comunes: ${Array.from(commonHazards).slice(0, 4).join(', ')}.\n`;
                    }
                }
            }
        }

        // 4. Vulnerabilidad / Emergencias
        const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData;
        if (AnalisisVulnerabilidadData) {
            const avd = await AnalisisVulnerabilidadData.findOne({ user: userId }).lean();
            if (avd && avd.formData?.amenazasList?.length) {
                const critical = avd.formData.amenazasList.filter(a => a.nivelAmenaza === 'Inminente' || a.nivelAmenaza === 'Probable');
                if (critical.length > 0) {
                    context += `- **Emergencias**: Amenazas críticas detectadas: ${critical.map(a => a.amenaza).join(', ')}.\n`;
                }
            }
        }

        // 5. Investigación ATEL (Detalles de accidentes reales)
        const InvestigacionAtelData = mongoose.models.InvestigacionAtelData;
        if (InvestigacionAtelData) {
            const iad = await InvestigacionAtelData.findOne({ user: userId }).lean();
            if (iad && iad.formData?.descripcionHechos) {
                context += `- **Historial Accidentes (Investigación)**: Último evento relevante: "${iad.formData.descripcionHechos.substring(0, 150)}...". Causa raíz identificada: ${iad.formData.consecuencias || 'Sin especificar'}.\n`;
            }
        }

        // 6. Reporte de Actos y Condiciones Inseguras (Alertas tempranas)
        const ReporteActosData = mongoose.models.ReporteActosData;
        if (ReporteActosData) {
            const rad = await ReporteActosData.findOne({ user: userId }).lean();
            if (rad && rad.reportesList?.length) {
                const recent = rad.reportesList.slice(-5);
                context += `- **Reportes de Actos/Condiciones**: ${rad.reportesList.length} reportes. Hallazgos recientes: ${recent.map(r => r.hallazgo).join(' / ')}.\n`;
            }
        }

        // 7. Análisis de Trabajo Seguro (ATS - Pasos críticos)
        const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData;
        if (AnalisisTrabajoSeguroData) {
            const atsd = await AnalisisTrabajoSeguroData.findOne({ user: userId }).lean();
            if (atsd && atsd.pasos?.length) {
                context += `- **ATS (Tareas Críticas)**: Actividad analizada en ATS: ${atsd.actividad || 'General'}. Pasos de riesgo: ${atsd.pasos.slice(0, 4).map(p => p.descripcion).join(', ')}.\n`;
            }
        }

        // 8. Método OWAS (Ergonomía/Posturas)
        const MetodoOwasData = mongoose.models.MetodoOwasData;
        if (MetodoOwasData) {
            const owasd = await MetodoOwasData.findOne({ user: userId }).lean();
            if (owasd && owasd.resultados?.length) {
                const critical = owasd.resultados.filter(r => r.categoriaRiesgo >= 3);
                if (critical.length > 0) {
                    context += `- **Ergonomía (OWAS)**: Se detectaron ${critical.length} posturas con NIVEL DE RIESGO CRÍTICO (Categoría 3 o 4) que requieren intervención biomecánica inmediata.\n`;
                }
            }
        }
        
        // 9. Participación IPEVAR Trabajadores (Insumo primordial)
        const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData;
        if (ParticipacionIpevarData) {
            const pid = await ParticipacionIpevarData.findOne({ user: userId }).lean();
            if (pid && pid.formData) {
                const f = pid.formData;
                context += `- **Participación IPEVAR (Trabajadores)**: El personal identificó peligros en la tarea "${f.tarea || 'N/A'}". Reportaron: "${f.peligros || 'Sin especificar'}". Controles existentes observados: "${f.controlesExistentes || 'N/A'}". Percepción de suficiencia: ${f.suficientes ? 'Suficientes' : 'Insuficientes'}.\n`;
                if (f.sugeridoIngenieria || f.sugeridoAdministrativo || f.sugeridoEPP) {
                     context += `  * Mejoras sugeridas por el trabajador: ${[f.sugeridoIngenieria, f.sugeridoAdministrativo, f.sugeridoEPP].filter(Boolean).join('; ')}.\n`;
                }
            }
        }

    } catch (err) {
        logger.debug('[MatrizPeligros] Integrated context failed:', err.message);
    }
    return context;
}


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
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
        const selectedModel = modelName || preferredModel;
        const model = genAI.getGenerativeModel({ model: selectedModel });

        // Build expanded SST context
        const integratedSSTContext = await getIntegratedSSTContext(req.user.id);

        const prompt = `
Eres un experto en Seguridad y Salud en el Trabajo (SST) en Colombia, especializado en la metodología GTC 45 para la identificación de peligros y valoración de riesgos.

${companyContext ? `**Contexto de la empresa:** ${companyContext}` : ''}
${integratedSSTContext}

**DATOS DEL PELIGRO A ANALIZAR (Contexto Bio-Individual del Trabajador y su Cargo):**
- Perfil de Cargo Evaluado: ${proceso.proceso}
- Zona / Lugar de Exposición: ${proceso.zona || 'No especificada'}
- Actividad: ${proceso.actividad}
- Tarea: ${proceso.tarea || 'No especificada'}
- Rutinario: ${proceso.rutinario ? 'Sí' : 'No'}
- Controles Existentes reportados: ${proceso.controlesExistentes || 'No reportados'}
${peligro?.descripcionPeligro ? `- Peligro específico ya identificado: ${peligro.descripcionPeligro}` : ''}

${GTC45_TABLES}

**EVIDENCIA MULTIMEDIA DISPONIBLE:**
Analice cuidadosamente las imágenes y el video adjuntos (si existen) para identificar peligros no reportados textualmente o para validar la severidad de los mismos.
- Foto 1 (Actividad): ${proceso.images?.foto1Desc || 'Sin descripción'}
- Foto 2 (Ambiente): ${proceso.images?.foto2Desc || 'Sin descripción'}
- Foto 3 (Controles): ${proceso.images?.foto3Desc || 'Sin descripción'}

**INSTRUCCIONES BIOCÉNTRICAS:**
Actúa como médico laboral e higienista biocéntrico. Genera un análisis de vulnerabilidad cruzada y matriz GTC-45 para el **Perfil de Cargo** especificado arriba. 
Al emitir medidas de intervención, ASUME que quien ejecuta el rol tiene limitaciones biológicas (ej. sobrepeso, hernias, susceptibilidad a químicos).
- SI la clasificación sugerida es Físico, Químico o Biológico (Higiénico), OBLIGATORIAMENTE evalúa "deficienciaHigienica" usando la escala cualitativa (Muy Alto (MA), Alto (A), Medio (M), Bajo (B)) y asigna el "nivelDeficiencia" numérico correspondiente (MA=10, A=6, M=2, B=0).
- Para CADA medida de intervención propuesta (eliminacion, sustitucion, ingenieria, administrativo, epp), DEBES asignar obligatoriamente un FR (>0) y FC (>0). Propone controles en la persona y organizacionales.
- Evalúa mentalmente J = (NR * FR) / FC para cada medida y elige la más costo-efectiva. Llena "medidaSeleccionada" con esa medida.
- Añade "justificacion" (Anexo E) argumentando tu elección de controles bio-individuales frente al rol analizado.
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

        const parts = [{ text: prompt }];

        if (proceso.images || proceso.video) {
            if (proceso.images) {
                ['foto1', 'foto2', 'foto3'].forEach(k => {
                    const b64 = proceso.images[k];
                    if (b64) {
                        const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
                        if (match) {
                            parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                        }
                    }
                });
            }
            if (proceso.video) {
                const match = proceso.video.match(/^data:(video\/\w+);base64,(.+)$/);
                if (match) {
                    parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                }
            }
        }

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, parts);
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
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
        const model = genAI.getGenerativeModel({ model: modelName || preferredModel });

        // Build expanded SST context
        const integratedSSTContext = await getIntegratedSSTContext(req.user.id);

        const systemPrompt = `Eres un experto en SST de Colombia (GTC 45 y Decreto 1072/2015).
Tu tarea es generar la estructura inicial de una Matriz de Peligros para la siguiente empresa:
Nombre: ${ci.companyName || 'Empresa'}
Sector/Actividad: ${ci.economicActivity || 'General'}
Nivel de Riesgo: ${ci.riskLevel || 'N/A'}

${integratedSSTContext}

El objetivo principal de tu consultoría es pasar del enfoque tradicional a un ENFOQUE BIO-INDIVIDUAL, donde la matriz se tabula enfocada en LA POSICIÓN/ROLES (Cargos) en lugar de procesos vacíos.

Genera exactamente 5 a 7 Perfiles de Cargo (Roles) principales que sean lógicos para este tipo de empresa.
Los "Cargos" deben usarse como el equivalente a los "Procesos" en tu JSON de respuesta (en la llave 'proceso' pon el nombre del cargo).
¡ESTRICTAMENTE PROHIBIDO GENERAR UN PROCESO CON 1 O 2 PELIGROS!
Para CADA proceso, *DEBES INCLUIR MÍNIMO entre 5 y 8 peligros diferentes*. Es obligatorio listar TODAS las dimensiones aplicables (biomecánico por cargas/postura, físico por ruido/iluminación, seguridad por caídas/maquinaria, psicosocial, biológico, etc.). Si es Logística, debes incluir todos estos.
No acortes la lista para ahorrar texto. Escribe el JSON completo con TODOS los peligros para cada proceso.
Para CADA peligro, realiza la valoración de riesgo GTC 45 completa:
- Proporciona ND, NE. NC será calculado por la IA basándose en posibles efectos. NR = (ND x NE) x NC.
- Proporciona la aceptabilidad, controles sugeridos, y completa *todos* los campos numéricos y de texto del esquema.
- Para CADA medida de intervención propuesta, asigna un FR y FC mayor a 0, asumiendo que se implementará.
- Define "medidaSeleccionada" indicando la de mayor costo-beneficio (mayor J).

Esquema JSON Requerido (DEBE responder solo con JSON puro, sin markdown):
{
  "procesos": [
    {
      "proceso": "Nombre del Cargo Ocupacional (Ej. Auxiliar Logístico)",
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

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, systemPrompt);
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
        const { procesos, currentDate, userName, modelName } = req.body;
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-2.5-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;

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

        const headerHTML = buildStandardHeader({
            title: 'INFORME EJECUTIVO IPEVAR BIO-INDIVIDUAL (GTC-45)',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'GTC 45 / Decreto 1072',
            responsibleName: userName || req.user?.name
        });

        // ─── Build FULL technical data for the AI prompt ───
        let totalPeligros = 0;
        let riskLevels = { I: 0, II: 0, III: 0, IV: 0 };
        let fichasTecnicas = [];

        procesos.forEach(p => {
            (p.peligros || []).forEach(h => {
                totalPeligros++;
                const nivelTexto = h.nivelRiesgo >= 600 ? 'I (No Aceptable)' :
                                   h.nivelRiesgo >= 150 ? 'II (Aceptable con Control Específico)' :
                                   h.nivelRiesgo >= 40  ? 'III (Mejorable)' : 'IV (Aceptable)';
                if (h.nivelRiesgo >= 600) riskLevels.I++;
                else if (h.nivelRiesgo >= 150) riskLevels.II++;
                else if (h.nivelRiesgo >= 40) riskLevels.III++;
                else riskLevels.IV++;

                let ficha = `▪ CARGO / PERFIL: ${p.proceso} | ACTIVIDAD: ${p.actividad || '-'} | TAREA: ${p.tarea || '-'} | ZONA: ${p.zona || '-'} | ${p.rutinario ? 'RUTINARIA' : 'NO RUTINARIA'}`;
                ficha += `\n  Peligro: "${h.descripcionPeligro || 'Sin descripción'}" | Clasificación: ${h.clasificacion || '-'}`;
                ficha += `\n  Efectos Posibles: ${h.efectosPosibles || '-'}`;
                ficha += `\n  Controles Existentes → Fuente: ${p.fuenteGeneradora || h.fuenteGeneradora || 'Ninguno'} | Medio: ${p.medioExistente || h.medioExistente || 'Ninguno'} | Individuo: ${p.individuoControl || h.individuoControl || 'Ninguno'}`;
                ficha += `\n  Valoración: ND=${h.nivelDeficiencia || 0}, NE=${h.nivelExposicion || 0}, NP=${h.nivelProbabilidad || 0} (${h.interpretacionNP || '-'}), NC=${h.nivelConsecuencia || 0}, NR=${h.nivelRiesgo || 0} (${h.interpretacionNR || '-'})`;
                ficha += `\n  Nivel de Riesgo: ${nivelTexto} | Aceptabilidad: ${h.aceptabilidad || '-'} | Expuestos: ${h.numExpuestos || 'N/A'}`;

                if (h.deficienciaHigienica && h.deficienciaHigienica.trim() && h.deficienciaHigienica.toUpperCase() !== 'N/A' && h.deficienciaHigienica.toUpperCase() !== 'NA') {
                    ficha += `\n  [Anexo C - Higiene]: Deficiencia Higiénica = ${h.deficienciaHigienica}${h.valoracionCuantitativa ? ` | Detalle: ${h.valoracionCuantitativa}` : ''}`;
                }
                if (h.justificacion) {
                    ficha += `\n  [Anexo E - Justificación]: ${h.justificacion}${h.factorJustificacion ? ` | Factor J=${h.factorJustificacion}` : ''}${h.costoIntervencion ? ` | Costo: ${h.costoIntervencion}` : ''}`;
                }

                ficha += `\n  Jerarquía de Controles Recomendados:`;
                ficha += `\n    - Eliminación: ${h.eliminacion || 'N/A'}`;
                ficha += `\n    - Sustitución: ${h.sustitucion || 'N/A'}`;
                ficha += `\n    - Ingeniería: ${h.controlIngenieria || 'N/A'}`;
                ficha += `\n    - Administrativos: ${h.controlAdministrativo || 'N/A'}`;
                ficha += `\n    - EPP: ${h.epp || 'N/A'}`;

                fichasTecnicas.push(ficha);
            });
        });

        const pctCritico = totalPeligros > 0 ? Math.round(((riskLevels.I + riskLevels.II) / totalPeligros) * 100) : 0;

        const promptText = `Eres un Experto Técnico Senior en Seguridad y Salud en el Trabajo (SGSST) en Colombia, consultor estratégico de alto nivel. Dominas la Guía Técnica Colombiana GTC 45, el Decreto 1072 de 2015, la Resolución 0312 de 2019, y toda la normativa colombiana aplicable.

**EVIDENCIA MULTIMEDIA DISPONIBLE:**
Para cada proceso analizado, se han adjuntado imágenes y videos que muestran las condiciones reales de trabajo. Úselas para validar los peligros reportados y proponer medidas de control coherentes con la realidad observada.

Has sido contratado para analizar la Matriz de Peligros y Riesgos completa de la organización y producir el INFORME EJECUTIVO DEFINITIVO más completo que se haya generado jamás.

═══════════════════════════════════════
      DATOS TÉCNICOS COMPLETOS
═══════════════════════════════════════

**ESTADÍSTICAS GENERALES:**
• Total de Procesos Evaluados: ${procesos.length}
• Total de Peligros Identificados: ${totalPeligros}
• Nivel I (No Aceptable: NR ≥ 600): ${riskLevels.I} peligros
• Nivel II (Aceptable con Control Específico: NR 150-599): ${riskLevels.II} peligros
• Nivel III (Mejorable: NR 40-149): ${riskLevels.III} peligros
• Nivel IV (Aceptable: NR < 40): ${riskLevels.IV} peligros
• Porcentaje de peligros Críticos+Altos (I+II): ${pctCritico}%

**FICHAS TÉCNICAS DE TODOS LOS PELIGROS (${totalPeligros} en total):**
${fichasTecnicas.join('\n\n')}

═══════════════════════════════════════
      TU TAREA (INFORME EJECUTIVO)
═══════════════════════════════════════

Redacta un INFORME EJECUTIVO TÉCNICO EXTREMADAMENTE EXTENSO, PROFUNDO, DETALLADO Y ESPECÍFICO. NO seas genérico. Tienes arriba las fichas técnicas completas de CADA peligro — ÚSALAS. Menciona datos reales (procesos, descripciones, NR, ND, NE, NP, NC, clasificaciones, efectos, controles). Cada sección DEBE ser larga, con múltiples párrafos, terminología técnica colombiana y análisis de causa raíz.

**ESTRUCTURA OBLIGATORIA (4 secciones, cada una EXTENSA):**

──── SECCIÓN 1: RESUMEN ANALÍTICO DEL ESTADO DE RIESGOS ────
- Múltiples párrafos extensos (mínimo 4-5 párrafos).
- Analiza cuantitativamente: qué significa que el ${pctCritico}% de los peligros sean I o II. Interpreta la distribución por niveles.
- Impacto en continuidad del negocio, seguridad jurídica de la empresa (sanciones del Ministerio del Trabajo, responsabilidades civiles), e integridad biopsicosocial de los trabajadores.
- Analiza la distribución de riesgos por procesos: cuáles procesos concentran mayor riesgo (operativos vs administrativos) y qué implica.
- Menciona el incumplimiento potencial del ciclo PHVA (Decreto 1072) y la Resolución 0312.

──── SECCIÓN 2: ANÁLISIS CUALITATIVO DE PELIGROS ────
**CRÍTICO: NO selecciones solo 4 peligros. DEBES analizar TODOS y CADA UNO de los ${totalPeligros} peligros.**
Para CADA peligro de las fichas técnicas anteriores, genera una entrada tipo viñeta que incluya:
  • Nombre del Peligro y su Clasificación (ej. "Caída a distinto nivel — Condiciones de Seguridad")
  • Proceso y Actividad donde se identificó
  • Nivel de Riesgo (NR) y su Aceptabilidad
  • Descripción técnica de la naturaleza del peligro, sus causas raíz y el potencial de daño (lesión, enfermedad laboral, fatalidad)
  • Si tiene evaluación higiénica (Anexo C), mencionarla
  • Si tiene justificación de intervención (Anexo E), mencionarla con su factor J
  • Análisis del potencial de los efectos posibles sobre los trabajadores expuestos

──── SECCIÓN 3: EVALUACIÓN Y JUSTIFICACIÓN DE INTERVENCIÓN (GTC 45) ────
Múltiples párrafos extensos donde:
- Para CADA peligro de Nivel I y II, explica específicamente por qué la intervención es innegociable usando la lógica del Anexo E ("Peor Consecuencia").
- Para CADA peligro con evaluación higiénica (Anexo C), analiza cómo la exposición constante agrava patologías laborales.
- Menciona explícitamente los nombres de los peligros y sus NR reales al argumentar.
- Señala las implicaciones legales bajo la Resolución 0312 y el Decreto 1072 si no se interviene.
- Puedes agrupar por tipo de riesgo pero DEBES mencionar cada peligro por nombre.

──── SECCIÓN 4: PLAN MAESTRO DE RECOMENDACIONES Y JERARQUÍA DE CONTROLES ────
Genera UNA TABLA COMPLETA con una fila para CADA UNO de los ${totalPeligros} peligros.
**Columnas obligatorias de la tabla:**
| # | Peligro | Proceso / Actividad | NR | Nivel | Jerarquía de Control Seleccionada | Acción Inmediata Sugerida |
- En "Jerarquía de Control Seleccionada", indica cuál control de la jerarquía (Eliminación, Sustitución, Ingeniería, Administrativo, EPP) se prioriza para ESE peligro específico, basándote en los datos de su ficha técnica.
- En "Acción Inmediata", sé específico y ambicioso: certificaciones, rediseños, PESV, programas de vigilancia epidemiológica, ingeniería de protección, etc.
- TODOS los peligros deben aparecer en la tabla, no solo los críticos.

Finalmente, incluye una NOTA FINAL DEL CONSULTOR (1-2 párrafos) con una reflexión estratégica sobre la inversión en SST vs. el riesgo de sanciones y accidentalidad.

═══════════════════════════════════════
      NORMAS DE FORMATO (CRÍTICO)
═══════════════════════════════════════
- **SOLO CÓDIGO HTML VÁLIDO.** Sin etiquetas <html>, <body> ni markdown. Sin \`\`\`html.
- **PROHIBIDO INCLUIR FIRMAS.** NO incluyas bajo ninguna circunstancia tablas de firmas, espacios para firmar, nombres de representantes o responsables SST al final del documento. El sistema WAPPY añadirá las firmas oficiales automáticamente. Si incluyes firmas, arruinarás el documento.
- **CSS INLINE OBLIGATORIO.** Usa exclusivamente atributos \`style\`. NO uses clases de Tailwind ni clases CSS.
- **PRECAUCIÓN MODO OSCURO:** Todo texto debe tener \`color\` explícito. Texto normal: \`color: #1e293b;\`. Títulos (h2, h3): \`color: #0f766e;\`.
- **Contenedores:** \`width: 100%; box-sizing: border-box;\`.
- **Cada vez** que apliques \`background-color\` a un tr, td o div, DEBES también especificar \`color\` explícito.
- **TABLAS:** Envuélvelas en \`<div style="overflow-x: auto; width: 100%; margin-bottom: 20px;">\`. Estilos de tabla: \`width: 100%; min-width: 800px; border-collapse: separate; border-spacing: 0; border-radius: 12px; border: 1px solid #ddd;\`. \`th\` con \`background-color: #0f766e; color: white; padding: 12px; text-align: left;\`. \`td\` con \`padding: 10px; border-bottom: 1px solid #e2e8f0;\` (sin background-color por defecto).
- **SECCIONES:** Usa cajas con \`border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.04);\`.
- No incluyas título h1 (ya está en el encabezado).`;

        const model = genAI.getGenerativeModel({ model: finalModelName });
        const parts = [{ text: promptText }];

        // Collect all media from all processes for the AI context
        procesos.forEach((p, pIdx) => {
            if (p.images) {
                ['foto1', 'foto2', 'foto3'].forEach(k => {
                    const b64 = p.images[k];
                    if (b64) {
                        const match = b64.match(/^data:(image\/\w+);base64,(.+)$/);
                        if (match) {
                            parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                            parts.push({ text: `(Evidencia de Proceso ${pIdx + 1}: ${p.proceso} - ${k === 'foto1' ? 'Actividad' : k === 'foto2' ? 'Ambiente' : 'Controles'})` });
                        }
                    }
                });
            }
            if (p.video) {
                const match = p.video.match(/^data:(video\/\w+);base64,(.+)$/);
                if (match) {
                    parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
                    parts.push({ text: `(Video de Proceso ${pIdx + 1}: ${p.proceso})` });
                }
            }
        });

        const result = await generateWithKeyRotation(model, req.user?.id || req.user, parts);
        let aiHtml = result.response.text().trim();
        aiHtml = aiHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        // ─── Build Anexo HTML (moved from frontend to ensure signatures go last) ───
        let rowsHTML = '';
        procesos.forEach((p, pIdx) => {
            (p.peligros || []).forEach((h, hIdx) => {
                const riskColor = h.nivelRiesgo >= 600 ? '#ef4444' : h.nivelRiesgo >= 150 ? '#f97316' : h.nivelRiesgo >= 40 ? '#eab308' : '#22c55e';
                const riskBg = h.nivelRiesgo >= 600 ? '#fef2f2' : h.nivelRiesgo >= 150 ? '#fff7ed' : h.nivelRiesgo >= 40 ? '#fefce8' : '#f0fdf4';

                rowsHTML += `
<div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; page-break-inside: avoid; text-align: left;">
  <div style="background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-weight: 700; color: #0f172a; font-size: 15px;">
      <span style="color: #3b82f6;">${pIdx + 1}.${hIdx + 1}</span> PROCESO: ${p.proceso}
    </div>
    <div style="background-color: ${riskColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700;">
      NR: ${h.nivelRiesgo}
    </div>
  </div>

  <div style="padding: 20px;">
    <div style="margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div style="width: 50%; float: left;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Actividad / Tarea</span>
        <span style="color: #1e293b; font-size: 14px;">${p.actividad || '-'} / ${p.tarea || '-'} (${p.rutinario ? 'Rutinario' : 'No Rutinario'})</span>
      </div>
      <div style="width: 50%; float: left;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Zona / Lugar</span>
        <span style="color: #1e293b; font-size: 14px;">${p.zona || '-'}</span>
      </div>
      <div style="clear: both;"></div>
    </div>

    ${p.images?.foto1 || p.images?.foto2 || p.images?.foto3 || p.video ? `
    <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #fbfcfe;">
      <span style="display: block; font-size: 13px; font-weight: 700; color: #0f766e; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Evidencia Multimedia del Proceso</span>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${p.images?.foto1 ? `
        <div style="flex: 1; min-width: 150px; text-align: center;">
          <img src="${p.images.foto1}" style="width: 100%; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 4px;" />
          <div style="font-size: 10px; font-weight: 700;">Actividad</div>
          ${p.images.foto1Desc ? `<div style="font-size: 9px; line-height: 1.2;">${p.images.foto1Desc}</div>` : ''}
        </div>` : ''}
        ${p.images?.foto2 ? `
        <div style="flex: 1; min-width: 150px; text-align: center;">
          <img src="${p.images.foto2}" style="width: 100%; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 4px;" />
          <div style="font-size: 10px; font-weight: 700;">Ambiente</div>
          ${p.images.foto2Desc ? `<div style="font-size: 9px; line-height: 1.2;">${p.images.foto2Desc}</div>` : ''}
        </div>` : ''}
        ${p.images?.foto3 ? `
        <div style="flex: 1; min-width: 150px; text-align: center;">
          <img src="${p.images.foto3}" style="width: 100%; border-radius: 4px; border: 1px solid #ddd; margin-bottom: 4px;" />
          <div style="font-size: 10px; font-weight: 700;">Controles</div>
          ${p.images.foto3Desc ? `<div style="font-size: 9px; line-height: 1.2;">${p.images.foto3Desc}</div>` : ''}
        </div>` : ''}
        ${p.video ? `
        <div style="flex: 1; min-width: 150px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 4px;">
          <div style="font-size: 24px;">📹</div>
          <div style="font-size: 10px; font-weight: 700;">Video de Evidencia</div>
          <div style="font-size: 9px;">Registrado</div>
        </div>` : ''}
      </div>
    </div>` : ''}

    <div style="margin-bottom: 24px;">
      <span style="display: block; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">Controles Existentes del Proceso</span>
      <div style="overflow-x: auto; width: 100%; margin-bottom: 16px;">
      <table style="width: 100%; min-width: 600px; word-wrap: break-word; border-collapse: collapse; text-align: left; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700;">
          <tr>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">En la Fuente</th>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">En el Medio</th>
            <th style="padding: 10px;">En el Individuo</th>
          </tr>
        </thead>
        <tbody style="color: #334155; font-size: 13px;">
          <tr>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${p.fuenteGeneradora || 'Ninguno'}</td>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${p.medioExistente || 'Ninguno'}</td>
            <td style="padding: 10px;">${p.individuoControl || 'Ninguno'}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <div style="background-color: ${riskBg}; border: 1px solid ${riskColor}40; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="margin-bottom: 12px;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: ${riskColor}; text-transform: uppercase; margin-bottom: 4px;">Peligro Identificado (${h.clasificacion || '-'})</span>
        <strong style="color: #0f172a; font-size: 15px;">${h.descripcionPeligro || 'Sin descripción'}</strong>
      </div>
      <div>
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Efectos Posibles</span>
        <span style="color: #334155; font-size: 14px;">${h.efectosPosibles || '-'}</span>
      </div>
    </div>

    <div style="margin-bottom: 16px;">
      <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Valoración del Riesgo</span>
      <div style="overflow-x: auto; width: 100%; margin-bottom: 16px;">
      <table style="width: 100%; min-width: 700px; word-wrap: break-word; border-collapse: collapse; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead style="background-color: #f1f5f9; color: #475569; font-size: 12px; font-weight: 700;">
          <tr>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Deficiencia (ND)</th>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Exposición (NE)</th>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Probabilidad (NP)</th>
            <th style="padding: 10px; border-right: 1px solid #e2e8f0;">Nivel Consecuencia (NC)</th>
            <th style="padding: 10px;">Aceptabilidad</th>
          </tr>
        </thead>
        <tbody style="color: #0f172a; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelDeficiencia || 0}</td>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelExposicion || 0}</td>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelProbabilidad || 0}</td>
            <td style="padding: 10px; border-right: 1px solid #e2e8f0;">${h.nivelConsecuencia || 0}</td>
            <td style="padding: 10px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${h.aceptabilidad || '-'}</div>
              ${h.interpretacionNR ? `<div style="font-size: 10.5px; font-weight: normal; font-style: italic; color: #64748b; line-height: 1.3;">${h.interpretacionNR}</div>` : ''}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    ${h.deficienciaHigienica && h.deficienciaHigienica.trim() !== '' && h.deficienciaHigienica.toUpperCase() !== 'N/A' && h.deficienciaHigienica.toUpperCase() !== 'NA' ? `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin-bottom: 4px;">Anexo C: Deficiencia Higiénica / Cuantitativa</span>
      <span style="color: #0f172a; font-size: 13px;"><strong>Valoración:</strong> ${h.deficienciaHigienica}</span>
      ${h.valoracionCuantitativa ? `<br/><span style="color: #334155; font-size: 13px;"><strong>Detalle:</strong> ${h.valoracionCuantitativa}</span>` : ''}
    </div>` : ''}

    ${h.justificacion ? `
    <div style="background-color: #fdf4ff; border: 1px solid #f5d0fe; border-left: 4px solid #d946ef; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <span style="display: block; font-size: 11px; font-weight: 700; color: #a21caf; text-transform: uppercase; margin-bottom: 4px;">Anexo E: Justificación de Intervención (J)</span>
      <span style="color: #334155; font-size: 13px;">${h.justificacion}</span>
    </div>` : ''}

    <div>
      <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Jerarquía de Controles Recomendada</span>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px;">
        <div style="margin-bottom: 6px;"><strong style="color: #475569;">Eliminación:</strong> <span style="color: #334155;">${h.eliminacion || 'N/A'}</span> ${h.j_eliminacion ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_eliminacion})</span>` : ''}</div>
        <div style="margin-bottom: 6px;"><strong style="color: #475569;">Sustitución:</strong> <span style="color: #334155;">${h.sustitucion || 'N/A'}</span> ${h.j_sustitucion ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_sustitucion})</span>` : ''}</div>
        <div style="margin-bottom: 6px;"><strong style="color: #475569;">Controles de Ingeniería:</strong> <span style="color: #334155;">${h.controlIngenieria || 'N/A'}</span> ${h.j_ingenieria ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_ingenieria})</span>` : ''}</div>
        <div style="margin-bottom: 6px;"><strong style="color: #475569;">Controles Administrativos:</strong> <span style="color: #334155;">${h.controlAdministrativo || 'N/A'}</span> ${h.j_administrativo ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_administrativo})</span>` : ''}</div>
        <div><strong style="color: #475569;">Equipos de Protección (EPP):</strong> <span style="color: #334155;">${h.epp || 'N/A'}</span> ${h.j_epp ? `<span style="color:#a21caf;font-weight:bold;font-size:11px;margin-left:6px;">(J=${h.j_epp})</span>` : ''}</div>
        ${h.medidaSeleccionada ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1;"><strong style="color: #10b981;">✔ Medida Seleccionada (Costo-Beneficio):</strong> <span style="color: #0f172a; font-weight: 600;">${h.medidaSeleccionada}</span></div>` : ''}
      </div>
    </div>
  </div>
</div>`;
            });
        });

        let fullReport = `${headerHTML}
<div style="margin-top: 32px; font-family: sans-serif;">
  ${aiHtml}
</div>
<div style="margin-top: 48px; page-break-before: always;">
  <h3 style="color: #0f172a; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Anexo: Detalle de Matriz de Peligros y Riesgos</h3>
  ${rowsHTML}
</div>`;

        if (loadedCompanyInfo) {
            fullReport += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ report: fullReport });
    } catch (error) {
        logger.error('[SGSST MatrizPeligros] Analyze error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
