const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '../../config/skills');

/**
 * Escanea el directorio de skills e inyecta las instrucciones de TODAS las skills
 * que coincidan con el texto de la conversación actual y el agente tenga habilitadas.
 *
 * Lógica especial:
 * - La skill maestra 'skill-guia-plataforma-wappy' se inyecta SIEMPRE si está habilitada,
 *   sin necesidad de que el mensaje del usuario contenga un trigger específico.
 * - El resto de skills se activan solo si el mensaje contiene al menos un trigger válido.
 * - Se usan límites de palabra (\b) para triggers cortos (<= 4 letras) para evitar falsos
 *   positivos masivos (ej: 'rit' coincidiendo dentro de 'escrita' o 'criterio').
 *
 * @param {string} lastUserMessageText
 * @param {string[]} agentSkills - Lista de nombres de skills habilitados para el agente.
 * @returns {string}
 */
function getActiveSkillInstructions(lastUserMessageText, agentSkills) {
  if (!Array.isArray(agentSkills) || agentSkills.length === 0 || !fs.existsSync(SKILLS_DIR)) {
    return '';
  }

  const MASTER_SKILL = 'skill-guia-plataforma-wappy';
  const activatedBlocks = [];
  const MAX_TRIGGER_SKILLS = 2; // Máximo 2 skills activadas por trigger para evitar desbordamiento de contexto
  let triggerCount = 0;

  try {
    const files = fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(SKILLS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Parsear Frontmatter YAML
      const match = content.match(/^---(\s*[\s\S]*?)---(\s*[\s\S]*)$/);
      if (!match) continue;

      let frontmatter;
      try {
        frontmatter = yaml.load(match[1]);
      } catch (e) {
        console.error(`[SkillRouter] Error parseando frontmatter en ${file}:`, e);
        continue;
      }

      const skillName = frontmatter.name || file.replace('.md', '');

      // 1. Verificar si el agente tiene esta skill habilitada
      if (!agentSkills.includes(skillName)) continue;

      const skillBody = match[2].trim();
      const triggers = frontmatter.triggers || [];

      // 2. La skill maestra siempre se inyecta (sin necesidad de trigger)
      if (skillName === MASTER_SKILL) {
        console.log(`[SkillRouter] Skill maestra '${skillName}' inyectada siempre.`);
        activatedBlocks.unshift(`\n\n# 🗺️ GUÍA COMPLETA DE PLATAFORMA WAPPY IA (SKILL MAESTRA)\n${skillBody}`);
        continue;
      }

      // Limitar la cantidad máxima de skills por trigger para prevenir sataturación de prompt
      if (triggerCount >= MAX_TRIGGER_SKILLS) continue;

      // 3. Verificar si el mensaje del usuario coincide con algún trigger
      if (!lastUserMessageText || typeof lastUserMessageText !== 'string') continue;
      const cleanText = lastUserMessageText.trim();
      if (!cleanText) continue;

      const matchesTrigger = triggers.some((trigger) => {
        if (!trigger || typeof trigger !== 'string') return false;
        const cleanTrigger = trigger.trim();
        if (!cleanTrigger) return false;

        const escaped = cleanTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Para triggers cortos (<= 4 caracteres) exigir coincidencia de palabra completa (\b)
        // para evitar falsos positivos como 'rit' dentro de 'escrita' o 'rag' dentro de 'estragos'.
        if (cleanTrigger.length <= 4) {
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          return regex.test(cleanText);
        }

        return cleanText.toLowerCase().includes(cleanTrigger.toLowerCase());
      });

      if (matchesTrigger) {
        triggerCount++;
        console.log(`[SkillRouter] Skill '${skillName}' activada por trigger en el mensaje.`);
        activatedBlocks.push(`\n\n# ⚡ SKILL ACTIVADA: ${skillName.toUpperCase()}\n${skillBody}`);
      }
    }
  } catch (error) {
    console.error('[SkillRouter] Error al leer directorio de skills:', error);
  }

  return activatedBlocks.join('\n');
}

module.exports = { getActiveSkillInstructions };
