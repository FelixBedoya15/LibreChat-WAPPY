const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { logger } = require('~/config');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { getUserKey } = require('~/server/services/UserService');
const CompanyInfo = require('~/models/CompanyInfo');
const { buildStandardHeader, buildCompanyContextString, buildSignatureSection } = require('./reportHeader');

// ─── HELPER: Google Gemini Fallback ───────────────────────────────────────
async function generateWithRetry(model, promptText, maxRetries = 3 /* fallback modes */) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(model.apiKey);
  const currentModelName = model.model.replace('models/', '');
  
  const fallbackOrder = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  
  let modelsToTry = [currentModelName];
  for (const m of fallbackOrder) {
    if (m !== currentModelName) modelsToTry.push(m);
  }
  
  let lastError;
  for (const modelName of modelsToTry) {
    if (!modelName) continue;
    try {
      if (modelName !== currentModelName) {
         console.warn(`[Gemini SDK] Cambiando a modelo de respaldo: ${modelName}...`);
      }
      const fallbackModel = genAI.getGenerativeModel({ 
          model: modelName, 
          generationConfig: model.generationConfig || {} 
      });
      return await fallbackModel.generateContent(promptText);
    } catch (err) {
      console.warn(`[Gemini SDK] Falló ${modelName}: ${err.message}`);
      lastError = err;
    }
  }
  
  throw new Error(`Todos los modelos generativos fallaron. Último error: ${lastError?.message || 'Desconocido'}`);
}


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
        } = req.body;

        let finalHazards = hazards;

        if (!finalHazards || !finalHazards.trim()) {
            try {
                // Try to fallback to Matriz de Peligros data
                const MatrizPeligrosData = mongoose.models.MatrizPeligrosData || mongoose.model('MatrizPeligrosData', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, procesos: Array }, { strict: false }));
                const matrizData = await MatrizPeligrosData.findOne({ user: req.user.id }).lean();

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
                        logger.info('[SGSST Politica] Using fallback hazards from Matriz de Peligros');
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
            logger.debug('[SGSST Politica] No user Google key found, trying env vars:', err.message);
        }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey) {
            return res.status(400).json({
                error: 'No se ha configurado la clave API de Google. Por favor, configúrala en la opción de Google del chat.',
            });
        }

        // 2. Load company info from DB
        let companyInfoBlock = '';
        let loadedCompanyInfo = null;
        try {
            const ci = await CompanyInfo.findOne({ user: req.user.id }).lean();
            loadedCompanyInfo = ci;
            if (ci && ci.companyName) {
                companyInfoBlock = buildCompanyContextString(ci);
            }
        } catch (ciErr) {
            logger.warn('[SGSST Politica] Error loading company info:', ciErr.message);
        }

        // 3. Initialize the Gemini SDK
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

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

1. **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del informe):
${policyHeaderHTML}

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
        const result = await generateWithRetry(model, promptText);
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

        if (loadedCompanyInfo) {
            cleanedPolicy += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ policy: cleanedPolicy });

    } catch (error) {
        logger.error('[SGSST Politica] Generation error:', error);
        res.status(500).json({ error: 'Error al generar la política SST' });
    }
});

module.exports = router;
