const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '../../config/skills');

/**
 * Escanea el directorio de skills e inyecta la instrucción correspondiente
 * si coincide con el texto de la conversación actual y el agente lo tiene habilitado.
 * @param {string} lastUserMessageText
 * @param {string[]} agentSkills - Lista de nombres de skills habilitados para el agente.
 * @returns {string}
 */
function getActiveSkillInstructions(lastUserMessageText, agentSkills) {
  if (!lastUserMessageText || !Array.isArray(agentSkills) || agentSkills.length === 0 || !fs.existsSync(SKILLS_DIR)) {
    return '';
  }

  try {
    const files = fs.readdirSync(SKILLS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.md')) {
        continue;
      }
      
      const filePath = path.join(SKILLS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parsear el Frontmatter
      const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
      if (!match) {
        continue;
      }
      
      try {
        const frontmatter = yaml.load(match[1]);
        const skillName = frontmatter.name || file.replace('.md', '');

        // 1. Validar si el agente actual tiene este skill explícitamente habilitado
        if (!agentSkills.includes(skillName)) {
          continue;
        }

        const skillInstructions = match[2].trim();
        const triggers = frontmatter.triggers || [];
        
        // 2. Verificar si el mensaje del usuario contiene algún trigger
        const matchesTrigger = triggers.some(trigger => 
          lastUserMessageText.toLowerCase().includes(trigger.toLowerCase())
        );
        
        if (matchesTrigger) {
          console.log(`[SkillRouter] Skill '${skillName}' activado dinámicamente para el agente.`);
          return `\n\n# SKILL ACTIVADO AD-HOC: ${skillName.toUpperCase()}\n${skillInstructions}`;
        }
      } catch (e) {
        console.error(`[SkillRouter] Error parseando frontmatter en ${file}:`, e);
      }
    }
  } catch (error) {
    console.error('[SkillRouter] Error al leer directorio de skills:', error);
  }
  
  return '';
}

module.exports = { getActiveSkillInstructions };
