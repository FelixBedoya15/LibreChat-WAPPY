const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SKILLS_DIR = path.join(__dirname, '../../config/skills');

const DEFAULT_SKILL_TOOLS_MAP = {
  'skill-gtc45-ipevar': ['matriz_ipevar'],
  'skill-gestion-ipevar': ['matriz_ipevar'],
  'skill-matriz-pesv': ['matriz_pesv'],
  'skill-matriz-compatibilidad': ['matriz_compatibilidad'],
  'skill-automatizaciones-agentes': ['gestor_automatizaciones'],
  'skill-google-drive': ['google_drive'],
  'skill-google-sheets-sync': ['google_sheets'],
  'skill-google-docs-slides': ['google_docs', 'google_slides'],
  'skill-google-gmail': ['google_gmail'],
  'skill-google-calendar': ['google_calendar'],
  'skill-onedrive': ['onedrive'],
  'canvas-editor': ['canvas_tool'],
  'skill-blog-editor': ['blog_editor'],
  'skill-editor-live': ['editor_live'],
  'skill-reglamento-interno-trabajo': ['editor_rit'],
  'abogado-rit': ['editor_rit'],
  'skill-riesgo-psicosocial': ['consultar_analitica_psicosocial'],
  'skill-analitica-actos-condiciones': ['consultar_analitica_actos_condiciones'],
  'skill-informes-estadisticas': ['consultar_analitica_actos_condiciones'],
};

/**
 * Escanea el directorio de skills e inyecta las instrucciones y herramientas
 * de las skills que coincidan con el texto de la conversación y el agente tenga habilitadas.
 *
 * @param {string} lastUserMessageText
 * @param {string[]} agentSkills - Lista de nombres de skills habilitados para el agente.
 * @returns {{ instructions: string, activeSkillNames: string[], activeTools: string[] }}
 */
function getActiveSkillsData(lastUserMessageText, agentSkills) {
  if (!Array.isArray(agentSkills) || agentSkills.length === 0 || !fs.existsSync(SKILLS_DIR)) {
    return { instructions: '', activeSkillNames: [], activeTools: [] };
  }

  const MASTER_SKILL = 'skill-guia-plataforma-wappy';
  const activatedBlocks = [];
  const activeSkillNames = [];
  const activeToolsSet = new Set();
  const MAX_TRIGGER_SKILLS = 4; // Permitir hasta 4 skills activadas por turno para orquestaciones ricas
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

      // 1. Verificar si el agente tiene esta skill habilitada (o si se pasa '*' para todas)
      const isEnabled = agentSkills.includes('*') || agentSkills.includes(skillName);
      if (!isEnabled) continue;

      const skillBody = match[2].trim();
      const triggers = frontmatter.triggers || [];

      // 2. La skill maestra siempre se inyecta (sin necesidad de trigger)
      if (skillName === MASTER_SKILL) {
        activatedBlocks.unshift(`\n\n# 🗺️ GUÍA COMPLETA DE PLATAFORMA WAPPY IA (SKILL MAESTRA)\n${skillBody}`);
        activeSkillNames.push(skillName);
        continue;
      }

      // Limitar la cantidad máxima de skills por trigger para prevenir saturación de prompt
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
        activeSkillNames.push(skillName);
        console.log(`[SkillRouter] Skill '${skillName}' activada por trigger en el mensaje.`);
        activatedBlocks.push(`\n\n# ⚡ SKILL ACTIVADA: ${skillName.toUpperCase()}\n${skillBody}`);

        // Asociar herramientas declaradas en frontmatter o en el mapa por defecto
        if (Array.isArray(frontmatter.tools)) {
          frontmatter.tools.forEach((t) => activeToolsSet.add(t));
        }
        if (DEFAULT_SKILL_TOOLS_MAP[skillName]) {
          DEFAULT_SKILL_TOOLS_MAP[skillName].forEach((t) => activeToolsSet.add(t));
        }
      }
    }
  } catch (error) {
    console.error('[SkillRouter] Error al leer directorio de skills:', error);
  }

  return {
    instructions: activatedBlocks.join('\n'),
    activeSkillNames,
    activeTools: Array.from(activeToolsSet),
  };
}

/**
 * Función legacy para mantener compatibilidad existente con agentes
 */
function getActiveSkillInstructions(lastUserMessageText, agentSkills) {
  return getActiveSkillsData(lastUserMessageText, agentSkills).instructions;
}

module.exports = {
  getActiveSkillsData,
  getActiveSkillInstructions,
  DEFAULT_SKILL_TOOLS_MAP,
};
