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

// ─── HELPER: Google Gemini Retry ───────────────────────────────────────
async function generateWithRetry(model, promptText, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateWithRetry(model, promptText);
    } catch (err) {
      if (err.message && err.message.includes('503 Service Unavailable') && i < maxRetries - 1) {
        console.warn(`[Gemini SDK] 503 Error. Retrying ${i + 1}/${maxRetries} in 3 seconds...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      throw err;
    }
  }
}


/**
 * POST /api/sgsst/responsable/generate
 * Generates an SST Responsible Assignment using AI.
 */
router.post('/generate', requireJwtAuth, async (req, res) => {
    try {
        const {
            responsableName,
            formationLevel,
            licenseNumber,
            licenseExpiry,
            courseStatus,
            additionalNorms,
            modelName,
        } = req.body;

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
            logger.debug('[SGSST Responsable] No user Google key found, trying env vars:', err.message);
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
            logger.warn('[SGSST Responsable] Error loading company info:', ciErr.message);
        }

        // Fallbacks from CompanyInfo if not provided in req.body
        const finalResponsableName = responsableName || loadedCompanyInfo?.responsibleSST || req.user?.name;
        const finalFormationLevel = formationLevel || loadedCompanyInfo?.formationLevel || 'A definir';
        const finalLicenseNumber = licenseNumber || loadedCompanyInfo?.licenseNumber || 'A definir';
        const finalLicenseExpiry = licenseExpiry || loadedCompanyInfo?.licenseExpiry || 'A definir';
        const finalCourseStatus = courseStatus || loadedCompanyInfo?.courseStatus || 'A definir';
        const finalNorms = additionalNorms || 'Resolución 908 de 2025, Resolución 0312 de 2019';

        // 3. Initialize the Gemini SDK
        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const currentDate = new Date().toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const reportHeaderHTML = buildStandardHeader({
            title: 'ASIGNACIÓN DEL RESPONSABLE DEL SG-SST',
            companyInfo: loadedCompanyInfo,
            date: currentDate,
            norm: finalNorms,
            responsibleName: finalResponsableName,
        });

        const promptText = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
        
**Fecha de Emisión:** ${currentDate}
**Empresa:** ${loadedCompanyInfo?.companyName || 'La Organización'}

## DATOS DEL RESPONSABLE
- **Nombre:** ${finalResponsableName}
- **Nivel de Formación:** ${finalFormationLevel}
- **Número de Licencia SST:** ${finalLicenseNumber}
- **Vigencia de Licencia:** ${finalLicenseExpiry}
- **Curso 50/20 Horas:** ${finalCourseStatus}

## DATOS DE LA EMPRESA
${companyInfoBlock}

## REGULACIÓN APLICABLE
${finalNorms}

## INSTRUCCIONES
Genera un documento oficial de ASIGNACIÓN DEL RESPONSABLE DEL SG-SST completo y profesional en formato HTML con las siguientes secciones:

1. **ENCABEZADO**: DEBES usar EXACTAMENTE el siguiente código HTML para el encabezado (INCLÚYELO TAL CUAL al inicio del documento):
${reportHeaderHTML}

2. **OBJETO DE LA ASIGNACIÓN**: Designación formal de la persona responsable para el diseño e implementación del SG-SST.

3. **PERFIL Y REQUISITOS NORMATIVOS**: Validar si el perfil (${finalFormationLevel}) es adecuado según el número de trabajadores (${loadedCompanyInfo?.workerCount || 'No especificado'}) y nivel de riesgo (${loadedCompanyInfo?.riskLevel || 'No especificado'}) de la empresa, citando la Resolución 0312 de 2019 y Resolución 908 de 2025.

4. **RESPONSABILIDADES ESPECÍFICAS**: Lista detallada de responsabilidades basadas en el Decreto 1072 de 2015, incluyendo:
   - Diseño del SG-SST
   - Ejecución y seguimiento
   - Identificación de peligros y valoración de riesgos
   - Cumplimiento del plan de trabajo anual
   - Rendición de cuentas
   - Coordinación con el COPASST/Vigía

5. **AUTORIDAD**: Definir la autoridad otorgada al responsable para tomar decisiones en materia de SST.

6. **RECURSOS ASIGNADOS**: Mencionar los recursos financieros, técnicos y humanos que la dirección pone a disposición.

7. **MARCO LEGAL**:
   - Decreto 1072 de 2015
   - Resolución 0312 de 2019
   - Resolución 4927 de 2016 (Curso 50 horas)
   - Resolución 908 de 2025 (Licencias)

IMPORTANTE: Genera SOLO fragmentos HTML del cuerpo (body). NO incluyas <!DOCTYPE>, <html>, <head>, <body>, <style>.
MUY IMPORTANTE: NO incluyas tablas de firmas, espacios de aceptación, ni nombres de representantes o responsables al final del documento, ya que el sistema los añadirá automáticamente de forma estandarizada.
Usa etiquetas HTML semánticas y estilos inline elegantes con colores institucionales (azul #004d99 para encabezados).
Asegúrate de que el documento se vea como una carta formal de asignación corporativa.`;


        // 4. Generate the document
        const result = await generateWithRetry(model, promptText);
        const response = await result.response;
        const document = response.text();

        // Clean up
        let cleanedDoc = document
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const bodyMatch = cleanedDoc.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            cleanedDoc = bodyMatch[1].trim();
        }
        cleanedDoc = cleanedDoc
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '')
            .replace(/<head>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .trim();

        if (loadedCompanyInfo) {
            cleanedDoc += buildSignatureSection(loadedCompanyInfo);
        }

        res.json({ document: cleanedDoc });

    } catch (error) {
        logger.error('[SGSST Responsable] Generation error:', error);
        res.status(500).json({ error: 'Error al generar la asignación del responsable' });
    }
});

module.exports = router;
