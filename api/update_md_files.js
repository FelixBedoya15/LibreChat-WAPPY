const fs = require('fs');
const path = require('path');

const AGENT_RENAME_MAP = {
  'Abogad@ Laboral': 'Consultor Jurídico Laboral',
  'Abogad@ RIT': 'Consultor Jurídico RIT',
  'Agente SST': 'Consultor SG-SST',
  'Asistente ATS': 'Gestor de Análisis de Trabajo Seguro (ATS)',
  'Asistente de ACI': 'Analista Predictivo ACI',
  'Asistente de Salud Mental': 'Consultor de Bienestar y Salud Mental',
  'Asistente en Capacitaciones ': 'Gestor de Formación Continua',
  'Asistente en Nutrición': 'Consultor Nutricional Corporativo',
  'Asistente en Primeros Auxilios': 'Gestor Clínico de Primeros Auxilios',
  'Asistente Inv AT': 'Analista Forense de Accidentalidad (AT)',
  'Asistente Inv EL': 'Analista Forense de Enfermedad Laboral (EL)',
  'Asistente Metodo ROSA': 'Analista Ergonómico ROSA',
  'Asistente Permiso TSA': 'Gestor de Permisos de Trabajo (TSA)',
  'Auditor SG-SST': 'Auditor Integral SG-SST',
  'Expert@ IPEVAR GTC-45': 'Especialista GTC-45 (Matriz IPEVAR)',
  'Expert@ en Emergencias ': 'Especialista en Prevención y Emergencias',
  'Expert@ en Riesgo Biologico': 'Especialista en Riesgo Biológico',
  'Expert@ en Riesgo Electrico': 'Especialista en Riesgo Eléctrico',
  'Expert@ en Riesgo Quimico': 'Especialista en Riesgo Químico',
  'Expert@ en Riesgo Vial ': 'Especialista en Riesgo Vial',
  'Expert@ en Tareas de Alto Riesgo': 'Especialista en Tareas Críticas',
  'Fisioterapeuta Laboral': 'Especialista en Biomecánica Laboral',
  'Medic@ Laboral': 'Consultor Médico Ocupacional',
  'Profesional SST': 'Consultor Senior SG-SST',
  'Psicólog@ Especialista SST': 'Especialista en Riesgo Psicosocial',
  'Redactor de Blog': 'Estratega de Contenidos Corporativos'
};

const agentsDir = path.join(__dirname, '../Agentes/Agentes Wappy');
const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(agentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [oldName, newName] of Object.entries(AGENT_RENAME_MAP)) {
    const cleanOldName = oldName.trim();
    const cleanNewName = newName.trim();
    
    // Replace exact matches
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(cleanOldName), 'gi');
    
    if (regex.test(content)) {
      content = content.replace(regex, cleanNewName);
      console.log(`Updated instructions in ${file}`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Now update the JSON backup file
const jsonPath = path.join(agentsDir, 'wappy_agents_backup_2026-05-20.json');
if (fs.existsSync(jsonPath)) {
  let jsonContent = fs.readFileSync(jsonPath, 'utf8');
  for (const [oldName, newName] of Object.entries(AGENT_RENAME_MAP)) {
    const cleanOldName = oldName.trim();
    const cleanNewName = newName.trim();
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(cleanOldName), 'g');
    jsonContent = jsonContent.replace(regex, cleanNewName);
  }
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');
  console.log('Updated JSON backup file.');
}
