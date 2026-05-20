/**
 * cleanup_local_only.js
 * 
 * Strips the obsolete "*** GESTIÓN DE ACTIVACIÓN MANUAL DE HERRAMIENTAS (CRÍTICO) ***"
 * block from the 18 customizable agent .md files locally.
 * 
 * NO DATABASE CONNECTION REQUIRED.
 * After running this, commit and push, then call POST /api/sgsst/sync-agents/cleanup-and-sync
 * from the deployed server to sync changes to MongoDB.
 */
const path = require('path');
const fs = require('fs');

const PROTECTED_AGENTS = new Set([
  'abogado_rit',
  'asistente_ats',
  'asistente_de_aci',
  'asistente_inv_at',
  'asistente_inv_el',
  'asistente_metodo_rosa',
  'coordinador_ipevar'
]);

const ALL_AGENTS = [
  'abogado_laboral',
  'abogado_rit',
  'agente_sst',
  'asistente_ats',
  'asistente_de_aci',
  'asistente_de_salud_mental',
  'asistente_en_capacitaciones',
  'asistente_en_nutricion',
  'asistente_en_primeros_auxilios',
  'asistente_inv_at',
  'asistente_inv_el',
  'asistente_metodo_rosa',
  'asistente_permiso_tsa',
  'auditor_sg_sst',
  'coordinador_ipevar',
  'experto_en_emergencias',
  'experto_en_riesgo_biologico',
  'experto_en_riesgo_electrico',
  'experto_en_riesgo_quimico',
  'experto_en_riesgo_vial',
  'experto_en_tareas_de_alto_riesgo',
  'fisioterapeuta_laboral',
  'medico_laboral',
  'profesional_sst',
  'psicologo_especialista_sst'
];

const TARGET_HEADER = '*** GESTIÓN DE ACTIVACIÓN MANUAL DE HERRAMIENTAS (CRÍTICO) ***';
const NEXT_HEADER   = '### ⚠️ INSTRUCCIÓN CRÍTICA DE VERIFICACIÓN ⚠️';

const agentsDir = path.resolve(__dirname, '../Agentes/Agentes Wappy');

let cleaned = 0;
let protected_ = 0;
let skipped = 0;
let notFound = 0;
let alreadyClean = 0;

console.log('=== Local Cleanup Script (NO DB) ===\n');

for (const basename of ALL_AGENTS) {
  if (PROTECTED_AGENTS.has(basename)) {
    console.log(`[PROTECTED] ${basename}.md — no modificado`);
    protected_++;
    continue;
  }

  const filePath = path.join(agentsDir, `${basename}.md`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[NOT FOUND] ${basename}.md`);
    notFound++;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const startIdx = content.indexOf(TARGET_HEADER);

  if (startIdx === -1) {
    console.log(`[CLEAN] ${basename}.md — ya no tiene la sección obsoleta`);
    alreadyClean++;
    continue;
  }

  const endIdx = content.indexOf(NEXT_HEADER, startIdx);
  if (endIdx === -1) {
    console.warn(`[SKIP] ${basename}.md — marcador inicio encontrado pero no el fin`);
    skipped++;
    continue;
  }

  const before = content.substring(0, startIdx);
  const after  = content.substring(endIdx);
  const cleaned_ = (before.trimEnd() + '\n\n' + after.trimStart()).trim() + '\n';

  fs.writeFileSync(filePath, cleaned_, 'utf8');
  console.log(`[CLEANED] ${basename}.md — sección eliminada exitosamente`);
  cleaned++;
}

console.log('\n=== Resumen ===');
console.log(`Limpiados:       ${cleaned}`);
console.log(`Ya limpios:      ${alreadyClean}`);
console.log(`Protegidos:      ${protected_}`);
console.log(`No encontrados:  ${notFound}`);
console.log(`Omitidos:        ${skipped}`);
console.log('\nDone. Ahora haz commit y push, luego llama:');
console.log('  POST /api/sgsst/sync-agents/cleanup-and-sync');
console.log('desde el servidor para sincronizar con MongoDB.');
