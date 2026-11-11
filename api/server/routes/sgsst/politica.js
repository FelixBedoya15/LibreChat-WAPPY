const mongoose = require('mongoose');
const { generateWithKeyRotation, resolveApiKeys, autoPersistGeneratedReport } = require('./sgsstGemini');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');


/**
 * POST /api/sgsst/politica/generate
 * Generates an SST Policy using AI based on company info and user-provided hazards/data.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            hazards,
            scope,
            commitments,
            objectives,
            additionalNorms,
            modelName,
            companyId: reqBodyCompanyId,
        } = req.body;

        // Load company info first (strictly respecting explicit companyId when provided)
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const explicitCid = reqBodyCompanyId || req.companyId || req.query?.companyId;
            let ci = null;
            if (explicitCid && mongoose.Types.ObjectId.isValid(String(explicitCid))) {
                ci = await CompanyInfo.findOne({ _id: explicitCid, user: req.user.id }).lean();
            }
            if (!ci) ci = await CompanyInfo.findOne({ user: req.user.id, isActive: true }).lean();
            if (!ci) ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (ciErr) {
            logger.warn('[SGSST Politica] Error loading company info:', ciErr.message);
        }

        let finalHazards = hazards;

        if (!finalHazards || !finalHazards.trim()) {
            try {
                // 1) Prioridad 1: Matriz Oficial GTC-45 (GTC45WorkspaceSession) de la empresa activa
                const GTC45WorkspaceSession =
                    mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
                let officialSession = null;
                if (loadedCompanyInfo?._id) {
                    officialSession =
                        (await GTC45WorkspaceSession.findOne({
                            companyId: loadedCompanyInfo._id,
                            isOfficial: true,
                        }).lean()) ||
                        (await GTC45WorkspaceSession.findOne({
                            conversationId: `official-${loadedCompanyInfo._id}`,
                        }).lean()) ||
                        (await GTC45WorkspaceSession.findOne({
                            companyId: loadedCompanyInfo._id,
                            'matrixRows.0': { $exists: true },
                        })
                            .sort({ updatedAt: -1 })
                            .lean());
                } else {
                    officialSession =
                        (await GTC45WorkspaceSession.findOne({
                            user: req.user.id,
                            isOfficial: true,
                        }).lean()) ||
                        (await GTC45WorkspaceSession.findOne({
                            conversationId: `official-${req.user.id}`,
                        }).lean());
                }

                if (officialSession && Array.isArray(officialSession.matrixRows) && officialSession.matrixRows.length > 0) {
                    const gtcLines = officialSession.matrixRows.slice(0, 80).map((r) => {
                        const proc = r.proceso || 'General';
                        const cargo = r.cargo ? ` | Cargo: ${r.cargo}` : '';
                        const act = r.actividad ? ` | Actividad: ${r.actividad}` : '';
                        const clas = r.peligro_clasificacion || 'Peligro';
                        const desc = r.peligro_descripcion || '';
                        const ef = r.efectos_posibles ? ` -> Efecto posible: ${r.efectos_posibles}` : '';
                        const niv = r.interpretacion_nr ? ` [Nivel Riesgo: ${r.interpretacion_nr}]` : '';
                        return `- **Proceso:** ${proc}${cargo}${act}: [${clas}] ${desc}${ef}${niv}`;
                    });
                    finalHazards = `Peligros identificados en la Matriz Oficial IPEVR GTC-45 (${officialSession.matrixRows.length} registros):\n${gtcLines.join('\n')}`;
                    logger.info('[SGSST Politica] Using hazards from official GTC45WorkspaceSession');
                }

                // 2) Fallback legado: MatrizPeligrosData
                if (!finalHazards || !finalHazards.trim()) {
                    const MatrizPeligrosData = mongoose.models.MatrizPeligrosData || mongoose.model('MatrizPeligrosData', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, companyId: mongoose.Schema.Types.ObjectId, procesos: Array }, { strict: false }));
                    const matrizData = await MatrizPeligrosData.findOne({ user: req.user.id, ...(loadedCompanyInfo?._id ? { companyId: loadedCompanyInfo._id } : {}) }).lean();

                    if (matrizData && matrizData.procesos && matrizData.procesos.length > 0) {
                        const fallbackHazards = [];
                        matrizData.procesos.forEach(p => {
                            if (p.peligros && p.peligros.length > 0) {
                                p.peligros.forEach(h => {
                                    fallbackHazards.push(`- **Proceso:** ${p.proceso} (Actividad: ${p.actividad}): ${h.descripcionPeligro || h.clasificacion}`);
                                });
                            }
                        });

                        if (fallbackHazards.length > 0) {
                            finalHazards = `Peligros identificados en la Matriz GTC 45:\n${fallbackHazards.join('\n')}`;
                            logger.info('[SGSST Politica] Using fallback hazards from legacy MatrizPeligrosData');
                        }
                    }
                }
            } catch (err) {
                logger.warn('[SGSST Politica] Error fetching Matriz de Peligros fallback:', err.message);
            }

            if (!finalHazards || !finalHazards.trim()) {
                return res.status(400).json({
                    error: 'Debe ingresar los peligros, o debe haber completado al menos un peligro en el módulo de Matriz de Peligros previamente.',
                });
            }
        }

        // 1. Retrieve Google API keys (user key + rotated server keys)
        const resolvedKeys = await resolveApiKeys(req.user.id);
        const resolvedApiKey = resolvedKeys[0];

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 3. Initialize the Gemini SDK
        const personalization = req.user?.personalization?.geminiModels;
        const preferredModel = personalization?.sstManagement || (process.env.GOOGLE_MODELS || 'gemini-3.6-flash').split(',')[0].trim();
        const finalModelName = modelName || preferredModel;
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: finalModelName });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const policyHeaderHTML = buildStandardHeader({
            title: 'POLÍTICA DE SEGURIDAD Y SALUD EN EL TRABAJO',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: 'Decreto 1072 de 2015 / Resolución 0312 de 2019',
            responsibleName: req.user?.name,
        });

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

**Fecha de Emisión:** ${currentDate}
**Elaborado por:** ${req.user?.name || 'Usuario del Sistema'}

## DATOS DE ENTRADA
${companyInfoBlock}

**Peligros y Riesgos Asociados a la Actividad:**
${finalHazards}

**Alcance de la Política:**
${scope || 'Aplica a todos los trabajadores, contratistas, subcontratistas y visitantes en todas las sedes y centros de trabajo de la organización.'}

**Compromisos de la Dirección:**
${commitments || 'No especificados por el usuario - utilizar compromisos estándar según normativa colombiana.'}

**Objetivos Principales:**
${objectives || 'No especificados por el usuario - generar objetivos alineados con los peligros identificados.'}

**Marco Normativo Adicional:**
${additionalNorms || 'Decreto 1072 de 2015, Resolución 0312 de 2019'}

## INSTRUCCIONES

Genera una POLÍTICA DE SEGURIDAD Y SALUD EN EL TRABAJO (SST) completa y profesional en formato HTML con las siguientes secciones:

1. **ENCABEZADO**: No generes ningún encabezado del documento ni logos. El sistema los insertará automáticamente.

2. **DECLARACIÓN DE LA DIRECCIÓN**: Compromiso formal de la alta dirección con la SST, incluyendo:
   - Compromiso con la protección de la seguridad y salud de los trabajadores
   - Compromiso con la prevención de lesiones y enfermedades laborales
   - Compromiso con el cumplimiento de la normatividad vigente
   - Compromiso con la mejora continua del SG-SST
   - Compromiso con la identificación de peligros, evaluación y valoración de riesgos
   - Compromiso con la asignación de recursos financieros, técnicos y humanos

3. **ALCANCE**: A quién aplica la política (trabajadores directos, contratistas, subcontratistas, visitantes, etc.)

4. **OBJETIVOS DE LA POLÍTICA**: Objetivos específicos alineados con los peligros identificados por el usuario.

5. **PELIGROS IDENTIFICADOS Y COMPROMISOS ESPECÍFICOS**: Para cada peligro identificado por el usuario, generar compromisos concretos de prevención y control.

6. **MARCO LEGAL**: Referenciar la normatividad colombiana aplicable:
   - Ley 1562 de 2012
   - Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6)
   - Resolución 0312 de 2019
   - Cualquier normativa adicional especificada

7. **RESPONSABILIDADES**: Del empleador, de los trabajadores, del COPASST/Vigía SST, del responsable del SG-SST.

8. **DIVULGACIÓN**: Cómo se comunicará la política a todos los niveles de la organización.

9. **REVISIÓN**: Periodicidad de revisión (mínimo anual según normativa).

10. **FIRMA**: El sistema añadirá la sección de firmas automáticamente. NO la generes tú.

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). NO incluyas <!DOCTYPE>, <html>, <head>, <body>, <style>, ni etiquetas de documento completo.
MUY IMPORTANTE: NO incluyas tablas de firmas, espacios de aceptación, ni nombres de representantes o responsables al final del documento, ya que el sistema los añadirá automáticamente de forma estandarizada.
Usa directamente etiquetas HTML semánticas (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>, etc).
Para estilos, usa atributos style inline en los elementos (PRECAUCIÓN MODO OSCURO: Cuando uses \`background-color\`, OBLIGATORIAMENTE declara \`color: #000;\` si el fondo es claro, o \`color: #fff;\` si es oscuro. NO uses filas de tablas intercaladas claras/oscuras).
La política debe ser formal, profesional y cumplir con los requisitos del Decreto 1072 de 2015, Art. 2.2.4.6.5 y 2.2.4.6.6.
El diseño debe ser elegante con colores institucionales (azul #0f766e para encabezados con \`color: #0f766e;\` explícito, bordes sutiles, tipografía profesional).`;

        // 4. Generate the policy
        const result = await generateWithKeyRotation(model, req.user?.id || req.user, promptText);
        const response = await result.response;
        const policy = response.text();

        // Clean up: remove code blocks, full HTML document wrappers
        let cleanedPolicy = policy
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        // Strip full HTML document structure if AI still generates it
        const bodyMatch = cleanedPolicy.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedPolicy = bodyMatch[1].trim();
        }
        cleanedPolicy = cleanedPolicy
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        // Prepend the standard header automatically to avoid recitation block issues on Gemini
        cleanedPolicy = policyHeaderHTML + '\n' + cleanedPolicy;

        if (loadedCompanyInfo) {
            cleanedPolicy += buildSignatureSection(loadedCompanyInfo);
        }

        const persisted = await autoPersistGeneratedReport(req, {
            htmlContent: cleanedPolicy,
            title: `Política SST - ${new Date().toLocaleDateString('es-CO')}`,
            tags: ['sgsst-politica'],
            model: finalModelName,
            companyId: loadedCompanyInfo?._id,
        });

        res.json({
            policy: cleanedPolicy,
            conversationId: persisted.conversationId,
            messageId: persisted.messageId,
        });

    } catch (error) {
        logger.error('[SGSST Politica] Generation error:', error);
        res.status(500).json({ error: 'Error al generar la política SST' });
    }
});

module.exports = router;
