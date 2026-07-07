const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '../../config/skills');

/**
 * Escanea el directorio de skills e inyecta la instrucción correspondiente
 * si coincide con el texto de la conversación actual.
 * @param {string} lastUserMessageText
 * @returns {string}
 */
function getActiveSkillInstructions(lastUserMessageText) {
  if (!lastUserMessageText || !fs.existsSync(SKILLS_DIR)) {
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
        const skillInstructions = match[2].trim();
        const triggers = frontmatter.triggers || [];
        
        // Verificar si el mensaje del usuario contiene algún trigger
        const matchesTrigger = triggers.some(trigger => 
          lastUserMessageText.toLowerCase().includes(trigger.toLowerCase())
        );
        
        if (matchesTrigger) {
          console.log(`[SkillRouter] Skill detectado y activado: ${frontmatter.name}`);
          return `\n\n# SKILL ACTIVADO AD-HOC: ${frontmatter.name.toUpperCase()}\n${skillInstructions}`;
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
