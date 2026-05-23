/**
 * GET /api/sgsst/sync-agents/migrate-names-public
 * Temporary public endpoint for migration.
 */
router.get('/migrate-names-public', async (req, res) => {
  try {
    const { Agent } = require('~/db/models');

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

    const ORDERING = [
      'Consultor Senior SG-SST',
      'Consultor SG-SST',
      'Auditor Integral SG-SST',
      'Consultor Jurídico Laboral',
      'Consultor Jurídico RIT',
      'Especialista GTC-45 (Matriz IPEVAR)',
      'Especialista en Riesgo Químico',
      'Especialista en Riesgo Eléctrico',
      'Especialista en Riesgo Biológico',
      'Especialista en Riesgo Vial',
      'Especialista en Tareas Críticas',
      'Especialista en Prevención y Emergencias',
      'Analista Forense de Accidentalidad (AT)',
      'Analista Forense de Enfermedad Laboral (EL)',
      'Analista Predictivo ACI',
      'Analista Ergonómico ROSA',
      'Consultor Médico Ocupacional',
      'Especialista en Biomecánica Laboral',
      'Especialista en Riesgo Psicosocial',
      'Consultor de Bienestar y Salud Mental',
      'Consultor Nutricional Corporativo',
      'Gestor Clínico de Primeros Auxilios',
      'Gestor de Análisis de Trabajo Seguro (ATS)',
      'Gestor de Permisos de Trabajo (TSA)',
      'Gestor de Formación Continua',
      'Estratega de Contenidos Corporativos'
    ];

    const agents = await Agent.find({});
    let updatedCount = 0;
    let results = [];

    for (const agent of agents) {
      let modified = false;
      let newName = agent.name;
      
      if (AGENT_RENAME_MAP[agent.name]) {
        newName = AGENT_RENAME_MAP[agent.name].trim();
        
        if (agent.instructions) {
          const oldNameNoSpace = agent.name.trim();
          const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapeRegExp(oldNameNoSpace), 'gi');
          agent.instructions = agent.instructions.replace(regex, newName);
        }
        modified = true;
      }
      
      if (agent.model !== 'gemini-3.5-flash' && agent.provider === 'google') {
        agent.model = 'gemini-3.5-flash';
        modified = true;
      }
      
      const orderIndex = ORDERING.indexOf(newName);
      const newOrder = orderIndex !== -1 ? orderIndex : 99;
      if (agent.order !== newOrder) {
        agent.order = newOrder;
        modified = true;
      }
      
      if (modified) {
        agent.name = newName;
        await agent.save();
        updatedCount++;
        results.push(`Updated Agent: ${agent.name} (Order: ${agent.order})`);
      }
    }
    
    return res.json({ success: true, updatedCount, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
