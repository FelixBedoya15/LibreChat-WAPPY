const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('~/config');

/**
 * POST /api/sgsst/diagnostico/analyze
 * Analyzes the SGSST checklist and generates a management report
 */
router.post('/analyze', async (req, res) => {
    try {
        const {
            companySize,
            riskLevel,
            applicableArticle,
            checklist,
            score,
            totalPoints,
            complianceLevel,
        } = req.body;

        // Get API key from environment
        const apiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Initialize Gemini client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

        // Build the prompt for analysis
        const completedItems = checklist.filter(item => item.status === 'cumple');
        const partialItems = checklist.filter(item => item.status === 'parcial');
        const nonCompliantItems = checklist.filter(item => item.status === 'no_cumple');
        const notApplicable = checklist.filter(item => item.status === 'no_aplica');
        const pending = checklist.filter(item => item.status === 'pendiente');

        const percentage = ((score / totalPoints) * 100).toFixed(1);

        const prompt = `Eres un experto consultor en Sistemas de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.
    
Analiza los resultados de la evaluación según la Resolución 0312 de 2019 y genera un INFORME GERENCIAL completo.

## DATOS DE LA EVALUACIÓN

**Información de la Empresa:**
- Tamaño: ${companySize === 'small' ? '≤10 trabajadores' : companySize === 'medium' ? '11-50 trabajadores' : '>50 trabajadores'}
- Nivel de Riesgo: ${riskLevel}
- Artículo Aplicable: Artículo ${applicableArticle}

**Resultados:**
- Puntuación Total: ${score}/${totalPoints} (${percentage}%)
- Nivel de Cumplimiento: ${complianceLevel.level.toUpperCase()}
- Total Estándares Evaluados: ${checklist.length}
- Cumplen: ${completedItems.length}
- Cumplen Parcialmente: ${partialItems.length}
- No Cumplen: ${nonCompliantItems.length}
- No Aplican: ${notApplicable.length}
- Pendientes: ${pending.length}

**Estándares que NO CUMPLEN (Críticos):**
${nonCompliantItems.map(item => `- ${item.code} - ${item.name}: ${item.description}`).join('\n') || 'Ninguno'}

**Estándares que CUMPLEN PARCIALMENTE:**
${partialItems.map(item => `- ${item.code} - ${item.name}: ${item.description}`).join('\n') || 'Ninguno'}

## INSTRUCCIONES

Genera un informe gerencial en formato HTML con las siguientes secciones:

1. **RESUMEN EJECUTIVO**: Breve descripción del estado actual del SG-SST

2. **ANÁLISIS DE RESULTADOS**: 
   - Interpretación del nivel de cumplimiento
   - Distribución por ejes PHVA (Planear, Hacer, Verificar, Actuar)
   - Principales fortalezas identificadas
   - Áreas críticas de incumplimiento

3. **PLAN DE ACCIÓN PRIORITARIO**:
   - Para cada estándar crítico que no cumple, proporciona:
     - Acción correctiva específica
     - Responsable sugerido
     - Plazo recomendado
     - Recursos necesarios
   - Ordena por prioridad (mayor puntaje = mayor prioridad)

4. **RIESGOS Y CONSECUENCIAS**:
   - Consecuencias legales del incumplimiento
   - Riesgos operacionales
   - Posibles sanciones según la normatividad colombiana

5. **RECOMENDACIONES FINALES**:
   - Próximos pasos inmediatos
   - Cronograma sugerido de implementación
   - Métricas de seguimiento

Usa etiquetas HTML semánticas (<h2>, <h3>, <p>, <ul>, <li>, <table>, <strong>, etc).
El informe debe ser profesional, específico y accionable.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const report = response.text();

        // Clean up markdown code blocks if present
        let cleanedReport = report
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        res.json({
            report: cleanedReport,
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
        logger.error('[SGSST Diagnostico] Analysis error:', error);
        res.status(500).json({ error: 'Error generating analysis' });
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
