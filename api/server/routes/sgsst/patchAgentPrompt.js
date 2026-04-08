'use strict';

/**
 * patchAgentPrompt.js
 * POST /api/sgsst/patch-agent-prompt
 * 
 * One-time admin utility to update the Coordinador IPEVAR agent's
 * system prompt with the new analytical Anexo E and controls rules.
 * Finds the agent by name containing "IPEVAR" or by instructions containing
 * "Seguimiento a pausas activas" (the old, problematic example).
 */

const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');
const { Agent } = require('~/db/models');
const { logger } = require('~/config');

const OLD_SNIPPET = 'Seguimiento a metas comerciales realistas y pausas activas. (Responsable: Felix Bedoya, Mensual).';

const NEW_FACTORES_SECTION = `**Factores de Reducción (Anexo E GTC-45):** 
TERMINANTEMENTE PROHIBIDO: No uses frases cortas ni el formato "(Responsable: X, Mensual)".
OBLIGATORIO — Redacta un párrafo analítico de MÍNIMO 3 oraciones completas que:
1. Explique TÉCNICA y ESPECÍFICAMENTE por qué el control propuesto reduce el riesgo (mecanismo biomecánico, epidemiológico, toxicológico o conductual según aplique al tipo de peligro).
2. Sustente la VIABILIDAD TÉCNICA y FINANCIERA de la implementación, comparando el costo de la medida vs. el costo de la enfermedad laboral, el ausentismo o las compensaciones futuras.
3. Justifique la RELACIÓN COSTO-BENEFICIO: demuestra cómo la combinación de controles mejora la productividad operativa, reduce la siniestralidad y garantiza el cumplimiento normativo colombiano (Decreto 1072/2015, GTC-45).
Redacta con lenguaje técnico SST profesional. Basa tu análisis en los controles existentes y propuestos del riesgo en cuestión.`;

const OLD_CONTROLS_SECTION = `- **medida_eliminacion:** ¿Se puede eliminar el peligro desde el diseño? (Ej: "No aplica a la naturaleza del proceso" o "Eliminar uso de asbesto").
- **medida_sustitucion:** ¿Se puede cambiar por algo menos peligroso? (Ej: "Cambiar solvente tóxico por base de agua", "Automatizar tarea").
- **medida_ingenieria:** Aislamiento o rediseño técnico. (Ej: "Instalar guardas de seguridad", "Extractores de aire locales", "Sillas ergonómicas certificadas").
- **medida_administrativa:** Políticas, capacitaciones, rotaciones y señalización. (Ej: "Capacitación en higiene postural", "Señalización de zona", "Rotación de turnos cada 2 horas").
- **medida_eppu:** Equipos de Protección Personal. NO recetes EPP para riesgo psicosocial. (Ej: "Guantes de carnaza, gafas de seguridad", "No aplica para psicosocial").`;

const NEW_CONTROLS_SECTION = `- **controles_fuente, controles_medio, controles_individuo (Existentes):** No solo los nombres. Detalla técnica y analíticamente su suficiencia, eficacia real frente al ND calificado, y qué tan robusto es el control para el tipo de peligro.
- **medida_eliminacion:** Sustenta técnicamente si aplica la eliminación desde el diseño del proceso. Si no aplica, argumenta por qué y qué alternativas son más efectivas.
- **medida_sustitucion:** Sustenta analíticamente la viabilidad de la sustitución, el NR residual esperado y la relación costo-beneficio frente al peligro actual.
- **medida_ingenieria:** Especifica el tipo EXACTO de control de ingeniería (rediseño ergonómico, guardas de seguridad, sistemas de extracción local, automatización, etc.) y explica el principio técnico por el cual reducirá el peligro desde la fuente o el medio.
- **medida_administrativa:** Detalla los procedimientos, programas de capacitación, sistemas de rotación y políticas concretas. Explica cómo impactarán en la reducción del NE o ND y por qué son necesarias como complemento a los controles de ingeniería.
- **medida_eppu:** Especifica la referencia técnica exacta (norma NTC/ANSI/EN, clase, material, nivel de protección). Si el peligro es Psicosocial: "No aplica — el riesgo psicosocial no se mitiga con EPP. La intervención debe ser organizacional.".`;

router.post('/patch-agent-prompt', requireJwtAuth, async (req, res) => {
  try {
    // Search for agents whose instructions contain the old problematic example
    const agents = await Agent.find({
      instructions: { $regex: 'Seguimiento a pausas activas', $options: 'i' }
    }).lean();

    if (!agents || agents.length === 0) {
      return res.json({ 
        message: 'No se encontraron agentes con el prompt antiguo. Puede que ya estén actualizados o usen un texto diferente.',
        found: 0
      });
    }

    let updatedCount = 0;
    const updatedAgents = [];

    for (const agent of agents) {
      let newInstructions = agent.instructions;

      // Replace the old controls section
      if (newInstructions.includes('medida_eliminacion') && newInstructions.includes('¿Se puede eliminar')) {
        newInstructions = newInstructions.replace(OLD_CONTROLS_SECTION, NEW_CONTROLS_SECTION);
      }

      // Replace the old Anexo E section (including the example line)
      newInstructions = newInstructions.replace(
        /\*\*Factores de Reducción \(Anexo E GTC-45\):\*\*[\s\S]*?(?=\n\n##|\n## |$)/m,
        NEW_FACTORES_SECTION
      );

      await Agent.findOneAndUpdate(
        { id: agent.id },
        { $set: { instructions: newInstructions } }
      );

      updatedCount++;
      updatedAgents.push({ id: agent.id, name: agent.name });
      logger.info(`[PatchAgentPrompt] Updated agent: ${agent.name} (${agent.id})`);
    }

    return res.json({
      success: true,
      message: `Se actualizaron ${updatedCount} agente(s) exitosamente.`,
      updatedAgents
    });

  } catch (err) {
    logger.error('[PatchAgentPrompt] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
