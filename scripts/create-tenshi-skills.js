/**
 * Script de generación de Skills completas para Tenshi a partir de los prompts maestros
 * en 'Agentes/Agentes Wappy' y unificación de sub-skills en 'api/config/skills'.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const AGENTES_DIR = path.resolve(__dirname, '../Agentes/Agentes Wappy');
const SKILLS_DIR = path.resolve(__dirname, '../api/config/skills');
const LEGACY_DIR = path.join(SKILLS_DIR, 'legacy_delegacion');

const AGENT_SKILL_DEFINITIONS = [
  {
    agentFile: 'abogado_laboral.md',
    skillFile: 'skill-abogado-laboral.md',
    name: 'skill-abogado-laboral',
    description: 'Especialista en Derecho Laboral Colombiano, cumplimiento legal en SST, descargos, estabilidad laboral reforzada, RIT y Ley 2365.',
    triggers: [
      'abogado', 'abogado laboral', 'contrato', 'despido', 'descargos', 'acoso laboral',
      'ley 1010', 'ley 2365', 'reglamento interno', 'rit', 'debido proceso',
      'estabilidad reforzada', 'justa causa', 'indemnizacion', 'fuero', 'reforma laboral'
    ],
    tools: ['editor_rit', 'matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'medico_laboral.md',
    skillFile: 'skill-medico-laboral.md',
    name: 'skill-medico-laboral',
    description: 'Especialista en medicina del trabajo, epidemiología ocupacional, profesiogramas, exámenes médicos, calificación de origen y reintegros.',
    triggers: [
      'medico', 'medico laboral', 'examen medico', 'examenes medicos', 'profesiograma',
      'calificacion de origen', 'furel', 'restricciones medicas', 'reintegro laboral',
      'pve', 'enfermedad laboral', 'incapacidad', 'aptitud medica', 'concepto medico'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'profesional_sst.md',
    skillFile: 'skill-profesional-sst.md',
    name: 'skill-profesional-sst',
    description: 'Consultor y Profesional en Seguridad y Salud en el Trabajo, identificación de peligros GTC-45, jerarquía de controles e inspecciones.',
    triggers: [
      'sst', 'profesional sst', 'consultor sst', 'gtc 45', 'ipevar', 'peligros',
      'inspeccion de seguridad', 'jerarquia de controles', 'decreto 1072', 'actos inseguros',
      'condiciones inseguras', 'seguridad en el trabajo'
    ],
    tools: ['matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'fisioterapeuta_laboral.md',
    skillFile: 'skill-fisioterapeuta-laboral.md',
    name: 'skill-fisioterapeuta-laboral',
    description: 'Especialista en ergonomía, biomecánica postural, prevención de desórdenes musculoesqueléticos, métodos ROSA y OWAS.',
    triggers: [
      'fisioterapeuta', 'ergonomia', 'metodo rosa', 'owas', 'postura', 'pausa activa',
      'tunel carpiano', 'lumbalgia', 'puesto de trabajo', 'silla ergonomica',
      'biomecanica', 'carga fisica', 'levantamiento de cargas'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'psicologo_sst.md',
    skillFile: 'skill-psicologo-sst.md',
    name: 'skill-psicologo-sst',
    description: 'Especialista en riesgo psicosocial, aplicación de batería MinTrabajo, clima laboral, prevención de burnout y convivencia laboral.',
    triggers: [
      'psicologo', 'psicosocial', 'bateria psicosocial', 'estres laboral', 'burnout',
      'carga mental', 'comite de convivencia', 'resolucion 2764', 'resolucion 2646',
      'desconexion laboral'
    ],
    tools: ['consultar_analitica_psicosocial', 'matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'terapeuta_salud_mental.md',
    skillFile: 'skill-terapeuta-salud-mental.md',
    name: 'skill-terapeuta-salud-mental',
    description: 'Terapeuta en salud mental ocupacional, primeros auxilios psicológicos (PAP), descompresión emocional y manejo del estrés laboral.',
    triggers: [
      'terapeuta', 'salud mental', 'crisis de panico', 'ansiedad', 'agotamiento emocional',
      'primeros auxilios psicologicos', 'apoyo emocional', 'mindfulness laboral', 'desespero', 'pap'
    ],
    tools: ['somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'nutricionista_laboral.md',
    skillFile: 'skill-nutricionista-laboral.md',
    name: 'skill-nutricionista-laboral',
    description: 'Nutricionista ocupacional, promoción de estilos de vida saludable, menús corporativos y alimentación en turnos rotativos.',
    triggers: [
      'nutricionista', 'nutricion', 'dieta saludable', 'alimentacion en turnos',
      'riesgo cardiovascular', 'obesidad laboral', 'estilos de vida saludable', 'hidratacion laboral'
    ],
    tools: ['somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'primer_respondiente.md',
    skillFile: 'skill-primer-respondiente.md',
    name: 'skill-primer-respondiente',
    description: 'Especialista en primeros auxilios, soporte vital básico, protocolo PAS, RCP y dotación reglamentaria de botiquines.',
    triggers: [
      'primer respondiente', 'primeros auxilios', 'rcp', 'atragantamiento', 'heimlich',
      'hemorragia', 'quemadura', 'botiquin', 'fractura', 'emergencia medica'
    ],
    tools: ['somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'auditor_sg_sst.md',
    skillFile: 'skill-auditor-sg-sst.md',
    name: 'skill-auditor-sg-sst',
    description: 'Auditor líder en SG-SST, autoevaluación de estándares mínimos Resolución 0312, auditorías internas y Centro de Control ACPM.',
    triggers: [
      'auditor', 'auditoria sst', 'resolucion 0312', 'estandares minimos', 'auditoria interna',
      'no conformidad', 'acpm', 'plan de mejora', 'revision gerencial', 'ciclo phva'
    ],
    tools: ['matriz_ipevar', 'matriz_pesv', 'matriz_compatibilidad', 'consultar_analitica_psicosocial', 'consultar_analitica_actos_condiciones', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'simulador_accidentes.md',
    skillFile: 'skill-simulador-accidentes.md',
    name: 'skill-simulador-accidentes',
    description: 'Especialista en investigación de accidentes laborales, metodologías de causa raíz (árbol de causas, Ishikawa, 5 Porqués) y simulador predictivo.',
    triggers: [
      'simulador accidentes', 'accidente de trabajo', 'furat', 'investigar accidente',
      'causa raiz', 'arbol de causas', 'ishikawa', 'leccion aprendida', 'siniestro laboral', 'incidente de trabajo'
    ],
    tools: ['somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'coordinador_capacitaciones.md',
    skillFile: 'skill-coordinador-capacitaciones.md',
    name: 'skill-coordinador-capacitaciones',
    description: 'Coordinador de formación y entrenamiento en SST, Plan Anual de Capacitaciones (PAC), inducciones y charlas de 5 minutos.',
    triggers: [
      'coordinador capacitaciones', 'plan de capacitaciones', 'pac', 'induccion sst',
      'reinduccion', 'charla de 5 minutos', 'entrenamiento sst', 'evaluacion de capacitacion'
    ],
    tools: ['somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'redactor_creativo.md',
    skillFile: 'skill-redactor-creativo.md',
    name: 'skill-redactor-creativo',
    description: 'Redactor creativo en SST, contenidos digitales, SEO, campañas de sensibilización, boletines y comunicación preventiva.',
    triggers: [
      'redactor creativo', 'blog sst', 'redactar articulo', 'campana de comunicacion',
      'boletin sst', 'comunicado trabajadores', 'infografia sst', 'pedagogia sst'
    ],
    tools: ['blog_editor', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'coordinador_tareas_criticas.md',
    skillFile: 'skill-coordinador-tareas-criticas.md',
    name: 'skill-coordinador-tareas-criticas',
    description: 'Especialista en tareas de alto riesgo: alturas (Res. 4272), espacios confinados (Res. 0491), caliente, excavaciones y bloqueo LOTO.',
    triggers: [
      'tareas criticas', 'alto riesgo', 'trabajo en alturas', 'permiso de alturas',
      'arnes', 'espacios confinados', 'loto', 'bloqueo y tarjeteo', 'trabajo en caliente', 'excavaciones'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'coordinador_seguridad_vial.md',
    skillFile: 'skill-coordinador-seguridad-vial.md',
    name: 'skill-coordinador-seguridad-vial',
    description: 'Especialista en el Plan Estratégico de Seguridad Vial (PESV - Res. 20223040040595), gestión de conductores, vehículos y rutas seguras.',
    triggers: [
      'seguridad vial', 'pesv', 'plan estrategico de seguridad vial', 'conductor',
      'vehiculo', 'flota', 'mantenimiento vehicular', 'ruta segura', 'ansv', 'siniestro vial'
    ],
    tools: ['matriz_pesv', 'matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'ingeniero_quimico_sst.md',
    skillFile: 'skill-ingeniero-quimico-sst.md',
    name: 'skill-ingeniero-quimico-sst',
    description: 'Especialista en seguridad química, Sistema Globalmente Armonizado (SGA), Fichas de Datos de Seguridad (FDS) y matriz de compatibilidad.',
    triggers: [
      'ingeniero quimico', 'riesgo quimico', 'sga', 'sustancias peligrosas',
      'ficha de datos de seguridad', 'fds', 'hds', 'matriz de compatibilidad', 'almacenamiento quimico', 'derrame quimico'
    ],
    tools: ['matriz_compatibilidad', 'matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'coordinador_emergencias.md',
    skillFile: 'skill-coordinador-emergencias.md',
    name: 'skill-coordinador-emergencias',
    description: 'Especialista en Plan de Emergencias (PAE), análisis de vulnerabilidad, conformación de brigadas y planeación de simulacros.',
    triggers: [
      'coordinador emergencias', 'plan de emergencias', 'pae', 'evacuacion',
      'simulacro de evacuacion', 'brigada de emergencias', 'analisis de vulnerabilidad', 'pon emergencias', 'extintores'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'ingeniero_electricista_sst.md',
    skillFile: 'skill-ingeniero-electricista-sst.md',
    name: 'skill-ingeniero-electricista-sst',
    description: 'Especialista en riesgo eléctrico, cumplimiento RETIE, aplicación de las 5 Reglas de Oro, prevención de arco eléctrico y EPP dieléctrico.',
    triggers: [
      'ingeniero electricista', 'riesgo electrico', 'retie', 'arco electrico',
      '5 reglas de oro', 'subestacion', 'baja tension', 'alta tension', 'epp dielectrico', 'desenergizado'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'especialista_bioseguridad.md',
    skillFile: 'skill-especialista-bioseguridad.md',
    name: 'skill-especialista-bioseguridad',
    description: 'Especialista en riesgo biológico, protocolos de desinfección, gestión de residuos hospitalarios PGIRH y esquemas de vacunación.',
    triggers: [
      'bioseguridad', 'riesgo biologico', 'pgirh', 'residuos hospitalarios',
      'cortopunzante', 'guardian de agujas', 'vacunacion laboral', 'infeccion ocupacional'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'ingeniero_minas_sst.md',
    skillFile: 'skill-ingeniero-minas-sst.md',
    name: 'skill-ingeniero-minas-sst',
    description: 'Especialista en seguridad para minería subterránea, monitoreo de atmósferas y gases, ventilación y sostenimiento (Dec. 1886).',
    triggers: [
      'ingeniero de minas', 'mineria', 'mina subterranea', 'metano',
      'grisu', 'ventilacion minera', 'sostenimiento minero', 'derrumbes mina', 'decreto 1886'
    ],
    tools: ['matriz_ipevar', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'ingeniero_ambiental.md',
    skillFile: 'skill-ingeniero-ambiental.md',
    name: 'skill-ingeniero-ambiental',
    description: 'Especialista en gestión ambiental corporativa, código de colores (Res. 2184), manejo de residuos peligrosos (RESPEL) y vertimientos.',
    triggers: [
      'ingeniero ambiental', 'medio ambiente', 'gestion ambiental', 'residuos solidos',
      'codigo de colores', 'reciclaje', 'vertimientos', 'respel', 'resolucion 2184'
    ],
    tools: ['matriz_ipevar', 'matriz_compatibilidad', 'consultar_analitica_actos_condiciones', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  },
  {
    agentFile: 'especialista_riesgo_climatico.md',
    skillFile: 'skill-especialista-riesgo-climatico.md',
    name: 'skill-especialista-riesgo-climatico',
    description: 'Especialista en riesgos por cambio climático, estrés térmico por calor (índice WBGT), radiación solar UV y fenómenos meteorológicos extremos.',
    triggers: [
      'riesgo climatico', 'estres termico', 'golpe de calor', 'wbgt',
      'radiacion uv', 'cambio climatico', 'trabajo al aire libre', 'tormenta electrica', 'temperatura extrema'
    ],
    tools: ['matriz_ipevar', 'consultar_analitica_actos_condiciones', 'somos_sst', 'canvas', 'web_search', 'google_drive', 'google_docs', 'google_sheets', 'google_slides', 'google_calendar', 'google_gmail', 'gestor_automatizaciones']
  }
];

const LEGACY_DELEGATION_FILES = [
  'skill-accidentes-investigacion.md',
  'skill-analisis-trabajo-seguro.md',
  'skill-capacitaciones.md',
  'skill-consultas-juridicas.md',
  'skill-consultas-medicas.md',
  'skill-diagnostico-sgsst.md',
  'skill-ergonomia-biomecanica.md',
  'skill-planes-de-emergencia.md',
  'skill-riesgo-psicosocial.md',
  'skill-riesgos-especificos.md',
  'skill-gestion-ipevar.md'
];

function main() {
  console.log('🚀 Iniciando creación de Skills completas para Tenshi a partir de los prompts maestros...');

  // 1. Crear carpeta de respaldo para los stubs de delegación legados
  if (!fs.existsSync(LEGACY_DIR)) {
    fs.mkdirSync(LEGACY_DIR, { recursive: true });
    console.log(`📁 Carpeta de respaldo creada: ${LEGACY_DIR}`);
  }

  // 2. Mover stubs de delegación para evitar que instruyan a Tenshi a "delegar"
  for (const legacyFile of LEGACY_DELEGATION_FILES) {
    const srcPath = path.join(SKILLS_DIR, legacyFile);
    const destPath = path.join(LEGACY_DIR, legacyFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      fs.unlinkSync(srcPath);
      console.log(`📦 Stub de delegación archivado: ${legacyFile} -> legacy_delegacion/`);
    }
  }

  // 3. Crear las 21 Skills a partir de los prompts reales de Agentes Wappy
  let createdCount = 0;
  for (const def of AGENT_SKILL_DEFINITIONS) {
    const agentPath = path.join(AGENTES_DIR, def.agentFile);
    if (!fs.existsSync(agentPath)) {
      console.warn(`⚠️ Archivo de agente no encontrado: ${def.agentFile}`);
      continue;
    }

    const rawPrompt = fs.readFileSync(agentPath, 'utf8').trim();

    const frontmatterObj = {
      name: def.name,
      description: def.description,
      scope: 'all',
      triggers: def.triggers,
      tools: def.tools
    };

    const frontmatterYaml = yaml.dump(frontmatterObj, { lineWidth: -1 });
    const fullSkillContent = `---\n${frontmatterYaml}---\n\n${rawPrompt}\n`;

    const skillPath = path.join(SKILLS_DIR, def.skillFile);
    fs.writeFileSync(skillPath, fullSkillContent, 'utf8');
    createdCount++;
    console.log(`✅ Skill creada con éxito: ${def.skillFile} (${def.tools.length} herramientas, ${def.triggers.length} triggers)`);
  }

  // 4. Actualizar las sub-skills existentes para que tengan scope: 'all'
  const existingFiles = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.md'));
  let updatedSubskills = 0;
  for (const file of existingFiles) {
    const filePath = path.join(SKILLS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---(\s*[\s\S]*?)---(\s*[\s\S]*)$/);
    if (match) {
      try {
        const fm = yaml.load(match[1]);
        if (fm && fm.scope === 'agents') {
          fm.scope = 'all';
          const newFm = yaml.dump(fm, { lineWidth: -1 });
          const newContent = `---\n${newFm}---\n${match[2]}`;
          fs.writeFileSync(filePath, newContent, 'utf8');
          updatedSubskills++;
          console.log(`🔄 Sub-skill actualizada a scope 'all': ${file}`);
        }
      } catch (e) {
        console.error(`Error procesando ${file}:`, e.message);
      }
    }
  }

  console.log(`\n🎉 Finalizado con éxito:`);
  console.log(`   - ${createdCount} skills maestras creadas con los prompts reales.`);
  console.log(`   - ${updatedSubskills} sub-skills actualizadas a scope 'all'.`);
  console.log(`   - ${LEGACY_DELEGATION_FILES.length} stubs de delegación archivados en legacy_delegacion/.`);
}

main();
