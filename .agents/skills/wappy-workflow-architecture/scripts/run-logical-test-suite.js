#!/usr/bin/env node
/**
 * Suite Oficial de Pruebas Lógicas Multi-Escenario — WAPPY Workflow Architecture (DAG estilo n8n)
 *
 * Verifica matemáticamente y contra MongoDB real (con aislamiento efímero y limpieza 100% garantizada):
 *   BLOQUE 1: Invariantes Estáticos, Topológicos y Paridad Frontend/Backend en los 55 Presets Oficiales.
 *   BLOQUE 2: Pruebas Unitarias Adversarias de Compuertas Condicionales (`pre_agent` vs `post_agent`,
 *             inmunidad a negaciones en español y matemática de ventana temprana `<= 30 días`).
 *   BLOQUE 3: Máquina de Estados E2E en MongoDB Real (Arquetipo 1: `preset_vencimientos_emo_epp`):
 *             - Escenario 3A: Empresa 100% al día (5 trabajadores vigentes) -> Rama NO, 0 llamadas LLM (`llmSpy === 0`),
 *                             0 KanbanTask, Sandbox `agent_root` = `skipped`.
 *             - Escenario 3B: 1ª Brecha Real (CC 99887766 EMO vencido) + Llamada Real a Gemini (`gemini-3.5-flash-lite`) ->
 *                             Extracción quirúrgica (`critical_only` omite los 4 sanos), Rama SÍ, guarda llave
 *                             `hito2_perfil_socio:99887766` en `AutomationLog.processedEntityKeys`, crea 1 KanbanTask.
 *             - Escenario 3C: Re-ejecución inmediata sin cambios (Anti-Duplicados con Estado) ->
 *                             Omite `hito2_perfil_socio:99887766`, Rama NO, 0 llamadas LLM (`llmSpy` sin incremento),
 *                             0 KanbanTask duplicadas (sigue exactamente en 1).
 *             - Escenario 3D: 2ª Brecha Incremental (CC 55443322 EMO vence en 12d <= 30d + EPP Casco vence en 10d) ->
 *                             Sigue omitiendo CC 99887766, detecta las 2 brechas nuevas de CC 55443322, Rama SÍ,
 *                             idempotencia de KanbanTask actualiza la tarjeta abierta en vez de duplicarla (`count === 1`).
 *   BLOQUE 4: Arquetipo 2 (`preset_drive_furat_investigacion_correo` — 0 archivos nuevos en Drive) ->
 *             Rama NO, `llmSpy === 0`, Hito destino (`hito7_investigacion_atel` · `target_write_report`) JAMÁS se invoca.
 *   BLOQUE 5: Arquetipo 3 (`preset_triage_qr_actos_condiciones` — `post_agent` Triage Menor `[VEREDICTO_IF: NO]` vs
 *             Peligro Grave `[VEREDICTO_IF: SI]`) y Arquetipo 4 (`logic_human_approval` -> `status: 'awaiting_approval'`).
 */

const buf = require('buffer');
if (!buf.SlowBuffer) {
  buf.SlowBuffer = buf.Buffer;
}
process.env.SEARCH = 'false';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(REPO_ROOT, '.env') });

require('module-alias')({ base: path.join(REPO_ROOT, 'api') });

const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');
const KanbanTask = require('~/models/KanbanTask');
const Notification = require('~/models/Notification');
const TenshiMessage = require('~/models/TenshiMessage');
const {
  SYSTEM_WORKFLOW_PRESETS_CATALOG: SYSTEM_WORKFLOW_PRESETS,
  SYSTEM_WORKFLOW_PRESETS_VERSION,
} = require('~/server/services/systemWorkflowPresetsCatalog');
const {
  inspectNodeLiveData,
  collectStructuredWorkflowSourceData,
  resolveWorkflowHitoRole,
  extractWorkflowEntityDedupKey,
} = require('~/server/services/workflowNodeInspectorService');
const {
  stopAutomationScheduler,
  runAutomation,
  runWorkflowSandboxSimulation,
  loadProcessedEntityKeysForAutomation,
  evaluatePreAgentDeterministicIf,
  evaluatePostAgentSemanticIf,
} = require('~/server/services/automationScheduler');
const { callSgsstGemini } = require('~/server/routes/sgsst/sgsstGemini');
const { validateSingleWorkflow } = require('./validate-workflow-logic');

// Asegurar registro de modelos SG-SST de Hitos usados en pruebas E2E
require('~/server/routes/sgsst/perfilSociodemografico');
require('~/server/routes/sgsst/epp');
require('~/server/routes/sgsst/permisoAlturas');

function formatOffsetDateYmd(offsetDays) {
  const dt = new Date(Date.now() + offsetDays * 86400000);
  return dt.toISOString().slice(0, 10);
}

/**
 * Réplica exacta de `resolveCanvasHitoRole` exportada en `WappyWorkflowCanvas.tsx`
 * para auditar paridad 100% entre el lienzo visual React y el motor backend Node.js.
 */
function simulateFrontendResolveCanvasHitoRole(nodeConfigs = {}, rawHitoId = '') {
  const cleanId = String(rawHitoId || '').trim();
  if (!cleanId) return 'source_read';
  const cfg =
    nodeConfigs[`tool_hitos_${cleanId}`] ||
    nodeConfigs[`hito_${cleanId}`] ||
    nodeConfigs[cleanId] ||
    {};
  if (cfg.hitoRole === 'source_read' || cfg.hitoRole === 'target_write_report') {
    return cfg.hitoRole;
  }
  if (
    cfg.generateAppReport === true ||
    cfg.appActionMode === 'generate_report' ||
    cfg.appActionMode === 'write_and_report' ||
    cfg.appActionMode === 'write_and_update' ||
    cfg.hitoOperationMode === 'write_register' ||
    cfg.hitoOperationMode === 'audit_and_update'
  ) {
    return 'target_write_report';
  }
  return 'source_read';
}

async function runFullLogicalTestSuite() {
  const results = [];
  const startSuiteMs = Date.now();

  const recordAssertion = (block, testId, description, details = '') => {
    results.push({ block, testId, description, status: 'PASS', details });
    console.log(`  ✅ [${testId}] ${description}${details ? ` — ${details}` : ''}`);
  };

  console.log('══════════════════════════════════════════════════════════════════════════════════');
  console.log('🧪 WAPPY WORKFLOW ARCHITECTURE — SUITE DE PRUEBAS LÓGICAS MULTI-ESCENARIO (DAG n8n)');
  console.log(`📦 Catálogo Auditado: ${SYSTEM_WORKFLOW_PRESETS.length} presets (${SYSTEM_WORKFLOW_PRESETS_VERSION})`);
  console.log('══════════════════════════════════════════════════════════════════════════════════\n');

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOQUE 1: INVARIANTES ESTÁTICOS, TOPOLÓGICOS Y PARIDAD FRONTEND/BACKEND
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('▶ BLOQUE 1: Validación Formal DAG, Modelos .env y Paridad Frontend/Backend (55 Presets)');

  assert.strictEqual(
    SYSTEM_WORKFLOW_PRESETS.length,
    55,
    `Se esperaban exactamente 55 presets oficiales y se encontraron ${SYSTEM_WORKFLOW_PRESETS.length}`,
  );

  let totalPresetErrors = 0;
  let totalPresetWarnings = 0;
  let totalHitoParityChecks = 0;
  const allowedEnvModels = new Set(['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash']);

  for (const preset of SYSTEM_WORKFLOW_PRESETS) {
    const val = validateSingleWorkflow(preset);
    if (val.errors.length > 0) {
      totalPresetErrors += val.errors.length;
      console.error(`  ❌ Fallo en ${preset.presetKey}:`, val.errors);
    }
    totalPresetWarnings += val.warnings.length;

    const wf = preset.workflowNodes || {};
    if (wf.aiModel) {
      assert.ok(
        allowedEnvModels.has(wf.aiModel),
        `Preset ${preset.presetKey} usa modelo no permitido: ${wf.aiModel}`,
      );
    }

    const nodeConfigs = wf?.canvasLayout?.nodeConfigs || {};
    for (const hId of wf.hitos || []) {
      const backendRole = resolveWorkflowHitoRole(nodeConfigs, hId);
      const frontendRole = simulateFrontendResolveCanvasHitoRole(nodeConfigs, hId);
      assert.strictEqual(
        backendRole,
        frontendRole,
        `Discrepancia de rol Hito (${hId}) en ${preset.presetKey}: backend=${backendRole} vs frontend=${frontendRole}`,
      );
      totalHitoParityChecks += 1;
    }
  }

  assert.strictEqual(totalPresetErrors, 0, `Existen ${totalPresetErrors} errores lógicos en el catálogo`);
  assert.strictEqual(totalPresetWarnings, 0, `Existen ${totalPresetWarnings} advertencias en el catálogo`);
  const preset1Check = SYSTEM_WORKFLOW_PRESETS.find((p) => p.presetKey === 'preset_vencimientos_emo_epp');
  assert.strictEqual(preset1Check?.agentTargetName, 'Consultor SG-SST');
  assert.ok(
    !preset1Check?.workflowNodes?.hitos?.includes('hito3_alturas'),
    'preset_vencimientos_emo_epp NO debe conectar hito3_alturas (Permiso Diario en Campo)',
  );
  recordAssertion(
    'BLOQUE_1',
    'B1.1',
    '55/55 Presets superan las 17 leyes formales (14 DAG + Reglas 15, 16 y 17 de Fidelidad de Dominio 8 Hitos) sin errores ni avisos',
    `errores=0, avisos=0`,
  );
  recordAssertion(
    'BLOQUE_1',
    'B1.2',
    'Paridad 100% exacta entre Frontend (resolveCanvasHitoRole) y Backend (resolveWorkflowHitoRole)',
    `${totalHitoParityChecks} nodos Hito verificados con 0 discrepancias`,
  );

  const canvasTsxSource = fs.readFileSync(
    path.join(REPO_ROOT, 'client/src/components/SGSST/WappyWorkflowCanvas.tsx'),
    'utf8',
  );
  assert.ok(
    canvasTsxSource.includes('export function resolveCanvasHitoRole') &&
      canvasTsxSource.includes('sourceHitosList') &&
      canvasTsxSource.includes('targetHitosList') &&
      canvasTsxSource.includes("ifPlacement === 'pre_agent'"),
    'WappyWorkflowCanvas.tsx debe contener separación sourceHitosList vs targetHitosList e ifPlacement === pre_agent',
  );
  recordAssertion(
    'BLOQUE_1',
    'B1.3',
    'Lienzo React (WappyWorkflowCanvas.tsx) implementa separación espacial Izquierda (source_read) vs Derecha (target_write_report) y pre_agent vs post_agent',
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // BLOQUE 2: PRUEBAS UNITARIAS ADVERSARIAS DE COMPUERTAS Y VENTANA <= 30 DÍAS
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n▶ BLOQUE 2: Pruebas Unitarias Adversarias de Compuertas IF y Ventana de 30 Días');

  // 2.1 Trampa de los 105 trabajadores sanos
  const healthy105Source = {
    allRecords: Array.from({ length: 105 }, (_, i) => ({
      id: `1000${i}`,
      isCritical: false,
    })),
    criticalRecords: [],
    freshCriticalRecords: [],
    deduplicatedSkippedRecords: [],
  };

  const preNumericHealthy = evaluatePreAgentDeterministicIf({
    ifCfg: { ifPlacement: 'pre_agent', ifConditionType: 'numeric_threshold', ifRuleExpression: '>= 1' },
    structuredSourceRes: healthy105Source,
    preRes: {},
    runCapturedEvidences: [],
    scraperBreachCount: 0,
    watchesExternal: false,
  });
  assert.strictEqual(
    preNumericHealthy.passed,
    false,
    '105 trabajadores sanos con 0 críticos DEBE evaluar FALSE en numeric_threshold >= 1',
  );

  const preCritHealthy = evaluatePreAgentDeterministicIf({
    ifCfg: { ifPlacement: 'pre_agent', ifConditionType: 'critical_findings' },
    structuredSourceRes: healthy105Source,
    preRes: {},
    runCapturedEvidences: [],
    scraperBreachCount: 0,
    watchesExternal: false,
  });
  assert.strictEqual(
    preCritHealthy.passed,
    false,
    '105 trabajadores sanos con 0 críticos DEBE evaluar FALSE en critical_findings',
  );
  recordAssertion(
    'BLOQUE_2',
    'B2.1',
    'Eliminada trampa de regresión: 105 registros sanos (0 brechas críticas) evalúa FALSE tanto en numeric_threshold (>= 1) como en critical_findings',
  );

  // 2.2 Trampa de negación en español ("0 exámenes vencidos, sin brechas críticas")
  const spanishNegationProse =
    '### Informe de Vigilancia Epidemiológica\n' +
    'Se auditaron los 105 colaboradores activos de la empresa: **0 exámenes vencidos**, **ninguna brecha crítica**, ' +
    'sin hallazgos críticos, sin incumplimientos y 0 accidentes pendientes por investigar. Todo el personal está al día.';
  const negEval = evaluatePostAgentSemanticIf({
    resultText: spanishNegationProse,
    ifCfg: { ifPlacement: 'post_agent', ifConditionType: 'critical_findings' },
    watchesDriveNewFiles: false,
  });
  assert.strictEqual(
    negEval.passed,
    false,
    ` Texto con negaciones explícitas ("0 exámenes vencidos, sin brechas críticas") evaluó erróneamente TRUE: ${negEval.reason}`,
  );
  recordAssertion(
    'BLOQUE_2',
    'B2.2',
    'Compuerta post_agent es inmune a falsos positivos por negaciones en español ("0 exámenes vencidos", "ninguna brecha crítica", "sin incumplimientos")',
    negEval.reason,
  );

  // 2.3 Contrato determinista [VEREDICTO_IF: SI|NO]
  const verdictNoWithKeywords =
    'Aunque un riesgo grave o accidente mortal exigiría escalamiento inmediato bajo Decreto 1072, ' +
    'este reporte QR corresponde únicamente a una luminaria decorativa parpadeando sin peligro.\n[VEREDICTO_IF: NO]';
  const evalExplicitNo = evaluatePostAgentSemanticIf({
    resultText: verdictNoWithKeywords,
    ifCfg: { ifPlacement: 'post_agent', ifConditionType: 'critical_findings' },
  });
  assert.strictEqual(evalExplicitNo.passed, false);

  const evalExplicitYes = evaluatePostAgentSemanticIf({
    resultText: 'Hallazgo crítico confirmado en andamio colgante piso 8.\n[VEREDICTO_IF: SI]',
    ifCfg: { ifPlacement: 'post_agent', ifConditionType: 'critical_findings' },
  });
  assert.strictEqual(evalExplicitYes.passed, true);
  recordAssertion(
    'BLOQUE_2',
    'B2.3',
    'Contrato explícito [VEREDICTO_IF: SI|NO] gobierna determinísticamente sobre cualquier vocabulario normativo del cuerpo del texto',
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // CONEXIÓN A MONGODB REAL PARA BLOQUES 3, 4 Y 5 (CON LIMPIEZA GARANTIZADA)
  // ═════════════════════════════════════════════════════════════════════════════
  const rawMongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  const localMongoUri = rawMongoUri.replace('://mongodb:', '://127.0.0.1:');
  await mongoose.connect(localMongoUri);

  const PerfilSociodemograficoData = mongoose.model('PerfilSociodemograficoData');
  const SgsstEppData = mongoose.model('SgsstEppData');
  const PermisoAlturasData = mongoose.model('PermisoAlturasData');

  // Usar un ObjectId de usuario real existente o efímero aislado
  const UserModel =
    mongoose.models.User ||
    mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const existingUser = await UserModel.findOne({ email: 'wappyinteractivo@gmail.com' }).lean();
  const testUserId = existingUser?._id || new mongoose.Types.ObjectId();

  let testCompanyDoc = null;
  const createdAutomationIds = [];

  try {
    // Crear empresa temporal 100% aislada
    testCompanyDoc = await CompanyInfo.create({
      user: testUserId,
      companyName: '__TEST_LOGICAL_SUITE_DAG_COMPANY__',
      nit: '900999888-7',
      economicActivity: 'Ingeniería y Pruebas Lógicas Automatizadas SG-SST',
      riskLevel: 'V',
      arl: 'SURA',
      city: 'Bogotá D.C.',
      workerCount: 5,
      responsibleSST: 'Ing. Auditor DAG',
    });
    const testCompanyIdStr = String(testCompanyDoc._id);

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOQUE 2.4: MATEMÁTICA DE VENTANA TEMPRANA (<= 30 DÍAS) Y RETIRADOS EN DB
    // ═══════════════════════════════════════════════════════════════════════════
    await PerfilSociodemograficoData.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      trabajadores: [
        {
          identificacion: '11100011',
          nombre: 'Ana Vigente Reciente',
          cargo: 'Ingeniera Residente',
          areaTrabajo: 'Obras',
          estadoLaboral: 'Activo',
          aptitudMedica: 'Apto sin restricciones',
          fechaUltimoExamen: formatOffsetDateYmd(-60), // hace 60d -> faltan 305d (NO crítico)
          biocentricScore: 92,
        },
        {
          identificacion: '11100022',
          nombre: 'Bruno Vence En 20 Días',
          cargo: 'Técnico Eléctrico',
          areaTrabajo: 'Mantenimiento',
          estadoLaboral: 'Activo',
          aptitudMedica: 'Apto sin restricciones',
          fechaUltimoExamen: formatOffsetDateYmd(-345), // hace 345d -> vence en 20d <= 30d (SÍ crítico)
          biocentricScore: 90,
        },
        {
          identificacion: '11100033',
          nombre: 'Carla Prox Examen 15 Días',
          cargo: 'Supervisora Alturas',
          areaTrabajo: 'Montajes',
          estadoLaboral: 'Activo',
          aptitudMedica: 'Apto sin restricciones',
          fechaProximoExamen: formatOffsetDateYmd(15), // en 15d <= 30d (SÍ crítico)
          biocentricScore: 91,
        },
        {
          identificacion: '11100044',
          nombre: 'Diego Retirado Histórico',
          cargo: 'Ex Operario',
          areaTrabajo: 'Planta',
          estadoLaboral: 'Retirado',
          fechaRetiro: formatOffsetDateYmd(-120),
          fechaUltimoExamen: '2022-01-15', // antiguo pero retirado -> NO debe alertar
          biocentricScore: 88,
        },
      ],
    });

    const dateBoundaryInspect = await inspectNodeLiveData({
      userId: testUserId,
      companyId: testCompanyIdStr,
      nodeId: 'hito2_perfil_socio',
    });
    const byId = new Map(dateBoundaryInspect.records.map((r) => [String(r.id), r]));
    assert.strictEqual(byId.get('11100011')?.isCritical, false, 'Trabajador con EMO a 305 días NO debe ser crítico');
    assert.strictEqual(byId.get('11100022')?.isCritical, true, 'Trabajador con EMO anual a 20 días (<=30d) DEBE ser crítico');
    assert.strictEqual(byId.get('11100033')?.isCritical, true, 'Trabajador con fechaProximoExamen en 15 días (<=30d) DEBE ser crítico');
    assert.strictEqual(byId.get('11100044')?.isCritical, false, 'Trabajador Retirado NO debe generar falsa alerta de EMO');
    recordAssertion(
      'BLOQUE_2',
      'B2.4',
      'Ventana preventiva <= 30 días detecta EMOs próximos a vencer (por fechaProximoExamen y por anualidad 365d) e ignora personal Retirado',
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOQUE 3: MÁQUINA DE ESTADOS E2E EN MONGODB REAL (`preset_vencimientos_emo_epp`)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n▶ BLOQUE 3: Máquina de Estados E2E en MongoDB Real — Arquetipo 1 (`preset_vencimientos_emo_epp`)');

    const emoPreset = SYSTEM_WORKFLOW_PRESETS.find((p) => p.presetKey === 'preset_vencimientos_emo_epp');
    assert.ok(emoPreset, 'Debe existir preset_vencimientos_emo_epp en el catálogo');

    // Sembrar 5 trabajadores activos 100% vigentes + EPP vigentes + Permiso Alturas vigente
    await PerfilSociodemograficoData.findOneAndUpdate(
      { companyId: testCompanyIdStr },
      {
        $set: {
          trabajadores: [
            {
              identificacion: '99887766',
              nombre: 'Carlos Prueba EMO',
              cargo: 'Liniero de Alta Tensión',
              areaTrabajo: 'Redes Eléctricas',
              eps: 'Sanitas',
              arl: 'SURA',
              estadoLaboral: 'Activo',
              aptitudMedica: 'Apto sin restricciones',
              fechaUltimoExamen: formatOffsetDateYmd(-40),
              fechaProximoExamen: formatOffsetDateYmd(325),
              fechaCursoAlturasAutorizado: formatOffsetDateYmd(-30),
              biocentricScore: 91,
            },
            {
              identificacion: '55443322',
              nombre: 'Laura Operativa Alturas',
              cargo: 'Montajista Estructural',
              areaTrabajo: 'Ingeniería Civil',
              eps: 'Sura EPS',
              arl: 'SURA',
              estadoLaboral: 'Activo',
              aptitudMedica: 'Apto sin restricciones',
              fechaUltimoExamen: formatOffsetDateYmd(-50),
              fechaProximoExamen: formatOffsetDateYmd(315),
              fechaCursoAlturasAutorizado: formatOffsetDateYmd(-45),
              biocentricScore: 93,
            },
            {
              identificacion: '44332211',
              nombre: 'Mateo Soldador Vigente',
              cargo: 'Soldador TIG',
              areaTrabajo: 'Taller Metalmecánico',
              eps: 'Compensar',
              arl: 'SURA',
              estadoLaboral: 'Activo',
              aptitudMedica: 'Apto sin restricciones',
              fechaUltimoExamen: formatOffsetDateYmd(-35),
              fechaProximoExamen: formatOffsetDateYmd(330),
              biocentricScore: 89,
            },
            {
              identificacion: '33221100',
              nombre: 'Valentina Inspectora HSE',
              cargo: 'Inspectora Operativa',
              areaTrabajo: 'HSE',
              eps: 'Sanitas',
              arl: 'SURA',
              estadoLaboral: 'Activo',
              aptitudMedica: 'Apto sin restricciones',
              fechaUltimoExamen: formatOffsetDateYmd(-25),
              fechaProximoExamen: formatOffsetDateYmd(340),
              biocentricScore: 95,
            },
            {
              identificacion: '22110099',
              nombre: 'Andrés Logística Almacén',
              cargo: 'Auxiliar de Almacén',
              areaTrabajo: 'Logística',
              eps: 'Famisanar',
              arl: 'SURA',
              estadoLaboral: 'Activo',
              aptitudMedica: 'Apto sin restricciones',
              fechaUltimoExamen: formatOffsetDateYmd(-20),
              fechaProximoExamen: formatOffsetDateYmd(345),
              biocentricScore: 90,
            },
          ],
        },
      },
    );

    await SgsstEppData.create({
      user: testUserId,
      companyId: testCompanyDoc._id,
      workerId: '55443322',
      documento: '55443322',
      nombreTrabajador: 'Laura Operativa Alturas',
      cargo: 'Montajista Estructural',
      entregas: [
        {
          id: 'epp_casco_laura_1',
          nombre: 'Casco Dieléctrico Tipo II',
          tipo: 'Alturas',
          marca: '3M',
          referencia: 'H-700 ANSI Z89.1',
          cantidad: 1,
          fechaEntrega: formatOffsetDateYmd(-60),
          fechaVencimiento: formatOffsetDateYmd(240), // Vigente (>30d)
          estado: 'Entregado',
          resultadoInspeccion: 'Aprobado',
          firmaTrabajador: 'data:image/png;base64,iVBORw0KGgo=',
        },
      ],
    });

    // Instanciar automatización real en MongoDB clonando `preset_vencimientos_emo_epp`
    // Quitamos salidas externas de red (email/calendar) o usamos destinatario vacío para evaluar exactamente Kanban vs Notificación WAPPY
    const emoWorkflowNodes = JSON.parse(JSON.stringify(emoPreset.workflowNodes));
    emoWorkflowNodes.outputs = ['acpm_task', 'wappy_notification'];
    emoWorkflowNodes.canvasLayout.nodeConfigs.out_acpm_task = {
      ...(emoWorkflowNodes.canvasLayout.nodeConfigs.out_acpm_task || {}),
      ifBranch: 'yes',
    };
    emoWorkflowNodes.canvasLayout.nodeConfigs.out_wappy_notification = {
      ...(emoWorkflowNodes.canvasLayout.nodeConfigs.out_wappy_notification || {}),
      ifBranch: 'no',
    };

    const emoAutomation = await Automation.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      name: '[TEST SUITE] Alerta Temprana Vencimientos EMO, Alturas y EPP',
      agentId: emoPreset.agentId || 'agent_consultor_sg_sst',
      agentName: emoPreset.agentName || emoPreset.agentTargetName || 'Consultor SG-SST',
      prompt: emoPreset.prompt,
      scheduleType: 'daily',
      scheduleConfig: { time: '07:00', timezone: 'America/Bogota' },
      status: 'inactive',
      workflowNodes: emoWorkflowNodes,
    });
    createdAutomationIds.push(emoAutomation._id);

    // ─────────────────────────────────────────────────────────────────────────
    // ESCENARIO 3A: EMPRESA 100% AL DÍA -> RAMA NO · 0 LLAMADAS LLM · 0 KANBAN
    // ─────────────────────────────────────────────────────────────────────────
    let llmSpyCount = 0;
    let lastCapturedPrompt = '';

    await runAutomation(emoAutomation.toObject(), {
      isManual: true,
      agentExecutorOverride: async ({ effectivePrompt }) => {
        llmSpyCount += 1;
        lastCapturedPrompt = effectivePrompt;
        return { text: 'No debería ejecutarse jamás en Rama NO pre_agent' };
      },
    });

    const log3A = await AutomationLog.findOne({ automation: emoAutomation._id }).sort({ runAt: -1 }).lean();
    const kanbanCount3A = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });
    const notifCount3A = await Notification.countDocuments({ companyId: testCompanyIdStr });

    assert.strictEqual(llmSpyCount, 0, 'Escenario 3A (empresa limpia): el LLM NO debe invocarse ni 1 sola vez');
    assert.strictEqual(log3A?.status, 'success');
    assert.strictEqual(log3A?.executionTrace?.activeBranch, 'no');
    assert.strictEqual(log3A?.executionTrace?.llmSkippedByPreIf, true);
    assert.strictEqual(log3A?.executionTrace?.freshCriticalCount, 0);
    assert.ok(log3A?.executionTrace?.totalAuditedRecords >= 5, 'Debió verificar al menos los 5 trabajadores y registros de terreno');
    assert.deepStrictEqual(log3A?.executionTrace?.executedOutputs, ['wappy_notification']);
    assert.strictEqual(kanbanCount3A, 0, 'Escenario 3A: 0 tareas Kanban deben crearse cuando todo el personal está vigente');
    assert.strictEqual(notifCount3A, 1, 'Escenario 3A: debe emitirse únicamente la constancia silenciosa en WAPPY (Rama NO)');

    // Validar también paridad en el Simulador Sandbox (`runWorkflowSandboxSimulation`)
    const sandbox3A = await runWorkflowSandboxSimulation({
      userId: String(testUserId),
      companyId: testCompanyIdStr,
      automationId: String(emoAutomation._id),
      flowName: emoAutomation.name,
      agentId: emoAutomation.agentId,
      agentName: emoAutomation.agentName,
      prompt: emoAutomation.prompt,
      workflowNodes: emoWorkflowNodes,
    });
    assert.strictEqual(sandbox3A?.ifEvaluation?.branchTaken, 'NO');
    const sandboxAgentStep3A = (sandbox3A?.nodeTrace || []).find((s) => s.nodeKey === 'agent_root');
    assert.strictEqual(
      sandboxAgentStep3A?.status,
      'skipped',
      'En Sandbox, agent_root debe quedar en estado skipped cuando pre_agent IF toma Rama NO',
    );
    assert.strictEqual(sandbox3A?.stats?.agentsExecuted, 0);

    recordAssertion(
      'BLOQUE_3',
      'B3.A',
      'Escenario 3A (Empresa 100% Vigente): Compuerta pre_agent toma Rama NO con 0 llamadas LLM (llmSpy=0), 0 KanbanTask y Sandbox agent_root=skipped',
      `auditados=${log3A.executionTrace.totalAuditedRecords}, brechas=0, outputs=[wappy_notification]`,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ESCENARIO 3B: 1ª BRECHA REAL (CC 99887766 EMO VENCIDO) + GEMINI EN VIVO
    // ─────────────────────────────────────────────────────────────────────────
    await PerfilSociodemograficoData.updateOne(
      { companyId: testCompanyIdStr, 'trabajadores.identificacion': '99887766' },
      {
        $set: {
          'trabajadores.$.fechaUltimoExamen': '2024-02-10',
          'trabajadores.$.fechaProximoExamen': '2025-02-10', // Vencido!
        },
      },
    );

    let realGeminiUsedIn3B = false;
    await runAutomation(emoAutomation.toObject(), {
      isManual: true,
      agentExecutorOverride: async ({ effectivePrompt, agent }) => {
        llmSpyCount += 1;
        lastCapturedPrompt = effectivePrompt;
        try {
          let liveReply = '';
          if (process.env.GOOGLE_KEY && process.env.GOOGLE_KEY !== 'user_provided') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const firstEnvKey = String(process.env.GOOGLE_KEY).split(',')[0].trim();
            const genAI = new GoogleGenerativeAI(firstEnvKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
            const genRes = await model.generateContent(effectivePrompt);
            liveReply = genRes?.response?.text?.() || '';
          } else {
            liveReply = await callSgsstGemini({
              userId: String(testUserId),
              modelName: 'gemini-3.5-flash-lite',
              prompt: effectivePrompt,
              timeoutMs: 35000,
            });
          }
          if (liveReply && String(liveReply).trim().length > 40) {
            realGeminiUsedIn3B = true;
            return { text: String(liveReply).trim() };
          }
        } catch (geminiErr) {
          console.warn('  ⚠️ Aviso Gemini en vivo (usando síntesis determinista de respaldo):', geminiErr.message);
        }
        return {
          text:
            `### Dictamen Médico-Ocupacional de Alerta Temprana\n` +
            `- **Trabajador en Brecha:** Carlos Prueba EMO (CC 99887766) — Cargo: Liniero de Alta Tensión.\n` +
            `- **Hallazgo:** Examen Médico Ocupacional periódico vencido (2025-02-10). Suspender tarea en alturas hasta renovación.`,
        };
      },
    });

    const log3B = await AutomationLog.findOne({ automation: emoAutomation._id }).sort({ runAt: -1 }).lean();
    const kanbanTasks3B = await KanbanTask.find({ companyId: testCompanyDoc._id }).lean();
    const notifCount3B = await Notification.countDocuments({ companyId: testCompanyIdStr });

    assert.strictEqual(llmSpyCount, 1, 'Escenario 3B: el LLM debió invocarse exactamente 1 vez');
    assert.ok(
      lastCapturedPrompt.includes('99887766') && lastCapturedPrompt.includes('Carlos Prueba EMO'),
      'El prompt quirúrgico entregado al Agente IA DEBE incluir a Carlos Prueba EMO (CC 99887766)',
    );
    assert.ok(
      !lastCapturedPrompt.includes('Mateo Soldador Vigente') &&
        !lastCapturedPrompt.includes('Valentina Inspectora HSE') &&
        !lastCapturedPrompt.includes('Andrés Logística Almacén'),
      'Filtro quirúrgico critical_only: los trabajadores 100% vigentes NO deben contaminar el prompt del Agente IA',
    );
    assert.strictEqual(log3B?.status, 'success');
    assert.strictEqual(log3B?.executionTrace?.activeBranch, 'yes');
    assert.strictEqual(log3B?.executionTrace?.llmSkippedByPreIf, false);
    assert.strictEqual(log3B?.executionTrace?.freshCriticalCount, 1);
    assert.ok(
      Array.isArray(log3B?.processedEntityKeys) &&
        log3B.processedEntityKeys.includes('hito2_perfil_socio:99887766'),
      `AutomationLog.processedEntityKeys debe registrar 'hito2_perfil_socio:99887766', obtenido: ${JSON.stringify(log3B?.processedEntityKeys)}`,
    );
    assert.deepStrictEqual(log3B?.executionTrace?.executedOutputs, ['acpm_task']);
    assert.strictEqual(kanbanTasks3B.length, 1, 'Escenario 3B: debe haberse creado exactamente 1 tarea en Kanban ACPM');
    assert.strictEqual(notifCount3B, 1, 'Escenario 3B: la notificación de Rama NO no debió dispararse en Rama SÍ');
    if (realGeminiUsedIn3B) {
      assert.ok(
        /99887766|Carlos Prueba EMO/i.test(log3B.result),
        'La respuesta real de Gemini debe citar explícitamente al trabajador en brecha CC 99887766',
      );
    }

    recordAssertion(
      'BLOQUE_3',
      'B3.B',
      'Escenario 3B (1ª Brecha Real CC 99887766): Filtro critical_only aísla solo al trabajador vencido, activa Rama SÍ, persiste llave en processedEntityKeys y crea 1 KanbanTask',
      `geminiEnVivo=${realGeminiUsedIn3B}, keys=${JSON.stringify(log3B.processedEntityKeys)}`,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ESCENARIO 3C: RE-EJECUCIÓN INMEDIATA (ANTI-DUPLICADOS CON ESTADO)
    // ─────────────────────────────────────────────────────────────────────────
    // CC 99887766 SIGUE vencido en MongoDB, pero ya fue alertado hace segundos dentro de la ventana de 7d
    await runAutomation(emoAutomation.toObject(), {
      isManual: true,
      agentExecutorOverride: async () => {
        llmSpyCount += 1;
        return { text: 'ERROR: No debió llamarse al LLM porque la única brecha ya fue gestionada' };
      },
    });

    const log3C = await AutomationLog.findOne({ automation: emoAutomation._id }).sort({ runAt: -1 }).lean();
    const kanbanCount3C = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });

    assert.strictEqual(
      llmSpyCount,
      1,
      'Escenario 3C (Re-run Anti-Duplicados): llmSpy NO debe subir (0 tokens gastados al repetir corrida sin brechas nuevas)',
    );
    assert.strictEqual(log3C?.executionTrace?.activeBranch, 'no');
    assert.strictEqual(log3C?.executionTrace?.llmSkippedByPreIf, true);
    assert.strictEqual(log3C?.executionTrace?.freshCriticalCount, 0);
    assert.strictEqual(
      log3C?.executionTrace?.deduplicatedCount,
      1,
      'Escenario 3C: debe reportar exactamente 1 registro crítico omitido por ventana anti-duplicados',
    );
    assert.strictEqual(
      kanbanCount3C,
      1,
      'Escenario 3C: 0 tarjetas Kanban duplicadas (el conteo permanece exactamente en 1)',
    );

    recordAssertion(
      'BLOQUE_3',
      'B3.C',
      'Escenario 3C (Re-ejecución Inmediata sin Cambios): Memoria Anti-Duplicados filtra hito2_perfil_socio:99887766, cortocircuita a Rama NO con 0 llamadas LLM y 0 duplicados en Kanban',
      `deduplicatedCount=${log3C.executionTrace.deduplicatedCount}, kanbanCount=${kanbanCount3C}`,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // ESCENARIO 3D: 2ª BRECHA INCREMENTAL (CC 55443322 EMO <=30d + EPP <=30d)
    // ─────────────────────────────────────────────────────────────────────────
    await PerfilSociodemograficoData.updateOne(
      { companyId: testCompanyIdStr, 'trabajadores.identificacion': '55443322' },
      {
        $set: {
          'trabajadores.$.fechaProximoExamen': formatOffsetDateYmd(12), // Vence en 12 días (<= 30d)
        },
      },
    );
    await SgsstEppData.updateOne(
      { companyId: testCompanyDoc._id, documento: '55443322' },
      {
        $set: {
          'entregas.0.fechaVencimiento': formatOffsetDateYmd(10), // Casco vence en 10 días (<= 30d)
        },
      },
    );

    let prompt3D = '';
    await runAutomation(emoAutomation.toObject(), {
      isManual: true,
      agentExecutorOverride: async ({ effectivePrompt }) => {
        llmSpyCount += 1;
        prompt3D = effectivePrompt;
        return {
          text:
            `### Nueva Alerta Preventiva Incremental (Ventana <= 30 Días)\n` +
            `- **Trabajadora:** Laura Operativa Alturas (CC 55443322) — EMO vence en 12 días y Casco Dieléctrico Tipo II vence en 10 días.\n` +
            `- **Acción:** Programar renovación de EMO y reposición inmediata de casco antes del vencimiento.`,
        };
      },
    });

    const log3D = await AutomationLog.findOne({ automation: emoAutomation._id }).sort({ runAt: -1 }).lean();
    const kanbanTasks3D = await KanbanTask.find({ companyId: testCompanyDoc._id }).lean();

    assert.strictEqual(llmSpyCount, 2, 'Escenario 3D: el LLM debió invocarse para la nueva brecha incremental');
    assert.ok(
      prompt3D.includes('55443322') && prompt3D.includes('Laura Operativa Alturas'),
      'Escenario 3D: el prompt debe incluir la nueva brecha de Laura (CC 55443322)',
    );
    // Verificar que Carlos (CC 99887766) NO fue re-inyectado en la lista quirúrgica de registros de hito2_perfil_socio
    const surgicalSection3D = prompt3D.split('═══ DATOS QUIRÚRGICOS REALES')[1] || '';
    assert.ok(
      !surgicalSection3D.includes('Carlos Prueba EMO'),
      'Escenario 3D: Carlos Prueba EMO (ya alertado en 3B) NO debe re-inyectarse en los datos quirúrgicos de 3D',
    );
    assert.strictEqual(log3D?.executionTrace?.activeBranch, 'yes');
    assert.strictEqual(log3D?.executionTrace?.deduplicatedCount, 1, 'Carlos sigue contabilizado como omitido por anti-duplicados');
    assert.strictEqual(log3D?.executionTrace?.freshCriticalCount, 2, 'Laura aporta 2 brechas nuevas (EMO <=30d + Casco EPP <=30d)');
    assert.ok(
      log3D?.processedEntityKeys.includes('hito2_perfil_socio:55443322') &&
        log3D?.processedEntityKeys.some((k) => k.startsWith('hito3_epp:55443322:')),
      `Debe persistir las llaves de EMO y EPP de 55443322, obtenido: ${JSON.stringify(log3D?.processedEntityKeys)}`,
    );
    assert.strictEqual(
      kanbanTasks3D.length,
      1,
      'Idempotencia Kanban ACPM: al existir una tarea abierta del mismo flujo, debe actualizarla con trazabilidad en vez de crear una segunda tarjeta duplicada',
    );
    assert.ok(
      String(kanbanTasks3D[0].description || '').includes('[Actualización Automática'),
      'La tarjeta Kanban existente debe contener el bloque incremental [Actualización Automática ...]',
    );

    recordAssertion(
      'BLOQUE_3',
      'B3.D',
      'Escenario 3D (Brecha Incremental CC 55443322 EMO+EPP <=30d): Omite a CC 99887766, procesa solo a CC 55443322, y actualiza idempotentemente la misma KanbanTask abierta (count=1)',
      `freshCritical=2, deduplicated=1, keys=${JSON.stringify(log3D.processedEntityKeys)}`,
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOQUE 4: ARQUETIPO 2 (`preset_drive_furat_investigacion_correo` — 0 ARCHIVOS NUEVOS)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n▶ BLOQUE 4: Arquetipo 2 — Ingesta Documental Drive FURAT (`0` Archivos Nuevos -> Rama NO)');

    const drivePreset = SYSTEM_WORKFLOW_PRESETS.find(
      (p) => p.presetKey === 'preset_drive_furat_investigacion_correo',
    );
    assert.ok(drivePreset, 'Debe existir preset_drive_furat_investigacion_correo');

    // Verificar estáticamente que hito7_investigacion_atel es target_write_report (derecha del Agente)
    const driveNodeConfigs = drivePreset.workflowNodes?.canvasLayout?.nodeConfigs || {};
    assert.strictEqual(
      resolveWorkflowHitoRole(driveNodeConfigs, 'hito7_investigacion_atel'),
      'target_write_report',
      'En preset_drive_furat_investigacion_correo, hito7_investigacion_atel DEBE tener hitoRole=target_write_report',
    );

    const driveAuto = await Automation.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      name: '[TEST SUITE] FURAT en Drive -> Investigación ATEL -> Correo',
      agentId: drivePreset.agentId || 'investigador_atel',
      agentName: drivePreset.agentName || drivePreset.agentTargetName || 'Investigador ATEL',
      prompt: drivePreset.prompt,
      scheduleType: 'daily',
      scheduleConfig: { time: '08:00', timezone: 'America/Bogota' },
      status: 'inactive',
      workflowNodes: JSON.parse(JSON.stringify(drivePreset.workflowNodes)),
    });
    createdAutomationIds.push(driveAuto._id);

    let driveLlmSpy = 0;
    await runAutomation(driveAuto.toObject(), {
      isManual: true,
      agentExecutorOverride: async () => {
        driveLlmSpy += 1;
        return { text: 'No debe ejecutarse sin archivos FURAT nuevos en Drive' };
      },
    });

    const log4A = await AutomationLog.findOne({ automation: driveAuto._id }).sort({ runAt: -1 }).lean();
    assert.strictEqual(driveLlmSpy, 0, 'Con 0 archivos nuevos en Drive, llmSpy DEBE ser 0');
    assert.strictEqual(log4A?.executionTrace?.activeBranch, 'no');
    assert.strictEqual(log4A?.executionTrace?.llmSkippedByPreIf, true);
    assert.strictEqual(
      log4A?.executionTrace?.officialReportsAttached || 0,
      0,
      'hito7_investigacion_atel (target_write_report) JAMÁS debe invocarse cuando Rama NO está activa',
    );
    assert.deepStrictEqual(log4A?.executionTrace?.executedOutputs, ['wappy_notification']);

    recordAssertion(
      'BLOQUE_4',
      'B4.A',
      'Arquetipo 2 (FURAT Drive con 0 archivos nuevos): Cortocircuita en pre_agent -> Rama NO (0 tokens IA) y omite hito7_investigacion_atel (target_write_report)',
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOQUE 5: ARQUETIPO 3 (`post_agent` TRIAGE QR) Y ARQUETIPO 4 (`human_approval`)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n▶ BLOQUE 5: Arquetipo 3 (`post_agent` Triage Semántico QR) y Arquetipo 4 (`logic_human_approval`)');

    const qrPreset = SYSTEM_WORKFLOW_PRESETS.find(
      (p) => p.presetKey === 'preset_qr_actos_condiciones_cierre_acpm',
    );
    assert.ok(qrPreset, 'Debe existir preset_qr_actos_condiciones_cierre_acpm');

    const qrWfNodes = JSON.parse(JSON.stringify(qrPreset.workflowNodes));
    qrWfNodes.outputs = ['acpm_task', 'wappy_notification'];
    qrWfNodes.canvasLayout.nodeConfigs.out_acpm_task = {
      ...(qrWfNodes.canvasLayout.nodeConfigs.out_acpm_task || {}),
      ifBranch: 'yes',
    };
    qrWfNodes.canvasLayout.nodeConfigs.out_wappy_notification = {
      ...(qrWfNodes.canvasLayout.nodeConfigs.out_wappy_notification || {}),
      ifBranch: 'no',
    };

    const qrAuto = await Automation.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      name: '[TEST SUITE] Triage Inteligente QR Actos y Condiciones',
      agentId: qrPreset.agentId || 'inspector_sst',
      agentName: qrPreset.agentName || qrPreset.agentTargetName || 'Inspector Operativo SST',
      prompt: qrPreset.prompt,
      scheduleType: 'daily',
      scheduleConfig: { time: '09:00', timezone: 'America/Bogota' },
      status: 'inactive',
      workflowNodes: qrWfNodes,
    });
    createdAutomationIds.push(qrAuto._id);

    const kanbanBefore5 = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });

    // 5A: Reporte QR menor -> Agente clasifica como observación menor y emite [VEREDICTO_IF: NO]
    let capturedQrPrompt = '';
    await runAutomation(qrAuto.toObject(), {
      triggerSource: 'qr_worker',
      eventPayload: {
        portalType: 'actos_condiciones',
        descripcion: 'Pintura levemente desgastada en cartel informativo de cafetería, sin peligro locativo.',
      },
      agentExecutorOverride: async ({ effectivePrompt }) => {
        capturedQrPrompt = effectivePrompt;
        return {
          text:
            '### Triage de Reporte QR en Campo\n' +
            '- **Clasificación:** Observación estética menor sin peligro grave ni inminente.\n' +
            '- **Acción:** Se registra para mantenimiento general ordinario sin escalamiento crítico.\n' +
            '[VEREDICTO_IF: NO]',
        };
      },
    });

    const log5A = await AutomationLog.findOne({ automation: qrAuto._id }).sort({ runAt: -1 }).lean();
    const kanbanAfter5A = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });
    assert.ok(
      capturedQrPrompt.includes('[CONTRATO OBLIGATORIO DE COMPUERTA CONDICIONAL POST-AGENTE]'),
      'Los flujos post_agent deben inyectar automáticamente el contrato [VEREDICTO_IF: SI|NO] al Agente IA',
    );
    assert.strictEqual(log5A?.executionTrace?.ifPlacement, 'post_agent');
    assert.strictEqual(log5A?.executionTrace?.activeBranch, 'no');
    assert.strictEqual(log5A?.executionTrace?.ifConditionPassed, false);
    assert.strictEqual(kanbanAfter5A, kanbanBefore5, 'Observación QR menor (Rama NO) NO debe crear tarea crítica en Kanban ACPM');
    assert.deepStrictEqual(log5A?.executionTrace?.executedOutputs, ['wappy_notification']);

    recordAssertion(
      'BLOQUE_5',
      'B5.A',
      'Escenario 5A (Triage QR Menor -> [VEREDICTO_IF: NO]): Enruta limpiamente a Rama NO sin abrir ACPM ni invocar Hitos de escritura',
    );

    // 5B: Reporte QR de peligro grave inminente -> Agente emite [VEREDICTO_IF: SI]
    await runAutomation(qrAuto.toObject(), {
      triggerSource: 'qr_worker',
      eventPayload: {
        portalType: 'actos_condiciones',
        descripcion: 'Excavación de 3.2m sin entibado con desprendimiento de talud activo y personal en fondo.',
      },
      agentExecutorOverride: async () => ({
        text:
          '### 🚨 ALERTA ROJA — PELIGRO GRAVE E INMINENTE EN CAMPO\n' +
          '- **Clasificación:** Riesgo crítico de atrapamiento por derrumbe en excavación sin entibado.\n' +
          '- **Acción Inmediata:** Suspensión inmediata de actividad y apertura de ACPM correctiva urgente.\n' +
          '[VEREDICTO_IF: SI]',
      }),
    });

    const log5B = await AutomationLog.findOne({ automation: qrAuto._id }).sort({ runAt: -1 }).lean();
    const kanbanAfter5B = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });
    assert.strictEqual(log5B?.executionTrace?.activeBranch, 'yes');
    assert.strictEqual(log5B?.executionTrace?.ifConditionPassed, true);
    assert.strictEqual(kanbanAfter5B, kanbanBefore5 + 1, 'Peligro grave QR (Rama SÍ) DEBE crear tarea correctiva en Kanban ACPM');
    assert.deepStrictEqual(log5B?.executionTrace?.executedOutputs, ['acpm_task']);

    recordAssertion(
      'BLOQUE_5',
      'B5.B',
      'Escenario 5B (Triage QR Peligro Grave -> [VEREDICTO_IF: SI]): Activa Rama SÍ y crea tarea correctiva en Centro de Control ACPM',
    );

    // 5C: Compuerta de Aprobación Humana (`logic_human_approval`) detiene las salidas en estado `awaiting_approval`
    const approvalWfNodes = JSON.parse(JSON.stringify(qrWfNodes));
    approvalWfNodes.canvasLayout.logicNodes = [
      {
        key: 'logic_human_approval_1',
        logicType: 'human_approval',
        title: 'Visto Bueno Gerente SST',
        subtitle: 'Retiene salidas hasta autorización humana',
      },
    ];
    approvalWfNodes.canvasLayout.nodeConfigs.logic_human_approval_1 = {
      approverRole: 'Gerente SG-SST',
      approverEmail: '', // vacío para no disparar SMTP externo durante el test
    };

    const approvalAuto = await Automation.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      name: '[TEST SUITE] Compuerta de Visto Bueno Humano',
      agentId: qrPreset.agentId || 'inspector_sst',
      agentName: qrPreset.agentName || qrPreset.agentTargetName || 'Inspector Operativo SST',
      prompt: qrPreset.prompt,
      scheduleType: 'daily',
      scheduleConfig: { time: '10:00', timezone: 'America/Bogota' },
      status: 'inactive',
      workflowNodes: approvalWfNodes,
    });
    createdAutomationIds.push(approvalAuto._id);

    const kanbanBefore5C = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });
    await runAutomation(approvalAuto.toObject(), {
      isManual: true,
      agentExecutorOverride: async () => ({
        text: '### Borrador de Plan Correctivo Mayor\nRequiere autorización presupuestal de Gerencia.\n[VEREDICTO_IF: SI]',
      }),
    });
    // Dar 50ms al setImmediate de notificación interna de visto bueno
    await new Promise((r) => setTimeout(r, 80));

    const log5C = await AutomationLog.findOne({ automation: approvalAuto._id }).sort({ runAt: -1 }).lean();
    const kanbanAfter5C = await KanbanTask.countDocuments({ companyId: testCompanyDoc._id });
    assert.strictEqual(
      log5C?.status,
      'awaiting_approval',
      'Con logic_human_approval en Rama SÍ, el AutomationLog DEBE quedar retenido en status=awaiting_approval',
    );
    assert.deepStrictEqual(log5C?.pendingApprovalPayload?.outputsToExecute, ['acpm_task']);
    assert.strictEqual(
      kanbanAfter5C,
      kanbanBefore5C,
      'Mientras awaiting_approval está pendiente, NO debe haberse ejecutado todavía la salida acpm_task',
    );

    recordAssertion(
      'BLOQUE_5',
      'B5.C',
      'Arquetipo 4 (logic_human_approval): Retiene las salidas de Rama SÍ en AutomationLog.status="awaiting_approval" sin despacharlas prematuramente',
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // BLOQUE 7: FIDELIDAD MULTI-DOMINIO EMO + CURSO ALTURAS (SÍ APLICA VS NO APLICA) + EPP + MERGE SIN PÉRDIDA
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(
      '\n▶ BLOQUE 7: Fidelidad Multi-Dominio EMO + Curso Alturas [Sí aplica vs No aplica] + EPP + Merge sin Pérdida',
    );

    const SgsstWorker =
      mongoose.models.SgsstWorker || require('~/models/SgsstWorker');

    // Limpiar colecciones de trabajadores y EPP de la empresa temporal antes de sembrar los 5 casos exactos
    await Promise.all([
      PerfilSociodemograficoData.deleteMany({ companyId: { $in: [testCompanyDoc._id, testCompanyIdStr] } }),
      SgsstEppData.deleteMany({ companyId: { $in: [testCompanyDoc._id, testCompanyIdStr] } }),
      SgsstWorker.deleteMany({ companyId: { $in: [testCompanyDoc._id, testCompanyIdStr] } }),
    ]);

    // Sembrar exactamente los 5 trabajadores especificados en MongoDB real:
    // 1) Solo EMO por vencer en 10d (fechaCursoAlturasAutorizado: "" -> aplicaCursoAlturas: No aplica, 0 falsa alerta de alturas)
    // 2) EMO vigente (+200d), pero fechaCursoAlturasAutorizado hace 380d -> Entra con Curso Alturas Autorizado VENCIDO
    // 3) EMO vigente (+200d), Alturas "", pero en SgsstEppData tiene Botas Dieléctricas con estado: 'Vencido' -> Entra desde Hito 5 EPP
    // 4) Misma cédula con AMBAS brechas (EMO vencido en Hito 2 Y Casco Dieléctrico 'Fuera de Servicio' en Hito 5 EPP) -> Merge sin pérdida
    // 5) EMO vigente (+200d), Alturas "" (No aplica), EPP 'Entregado' vigente, pero fitScore: 65 y enfermedades: "Miopía" -> 0 contaminación clínica
    await PerfilSociodemograficoData.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      trabajadores: [
        {
          identificacion: '70000001',
          nombre: 'Camilo Solo EMO 10d',
          cargo: 'Analista Contable',
          areaTrabajo: 'Administración',
          eps: 'Sanitas',
          arl: 'SURA',
          estadoLaboral: 'Activo',
          fechaExamenMedico: formatOffsetDateYmd(-355), // +365d -> vence en 10 días (<= 30d)
          fechaCursoAlturasAutorizado: '', // NO APLICA -> 0 falsa alerta de alturas
          fechaCursoAlturasCoordinador: '',
          biocentricScore: 92,
        },
        {
          identificacion: '70000002',
          nombre: 'Diana Alturas Vencida',
          cargo: 'Técnica de Telecomunicaciones',
          areaTrabajo: 'Torres y Antenas',
          eps: 'Sura EPS',
          arl: 'SURA',
          estadoLaboral: 'Activo',
          fechaExamenMedico: formatOffsetDateYmd(-165), // +365d -> faltan 200 días (VIGENTE)
          fechaCursoAlturasAutorizado: formatOffsetDateYmd(-380), // hace 380d -> venció hace 15 días (VENCIDO)
          fechaCursoAlturasCoordinador: '',
          biocentricScore: 90,
        },
        {
          identificacion: '70000003',
          nombre: 'Esteban Solo EPP Botas',
          cargo: 'Electricista Industrial',
          areaTrabajo: 'Subestaciones',
          eps: 'Compensar',
          arl: 'SURA',
          estadoLaboral: 'Activo',
          fechaExamenMedico: formatOffsetDateYmd(-165), // +200d (VIGENTE)
          fechaCursoAlturasAutorizado: '', // NO APLICA
          fechaCursoAlturasCoordinador: '',
          biocentricScore: 91,
        },
        {
          identificacion: '70000004',
          nombre: 'Fernanda Doble Brecha Merge',
          cargo: 'Supervisora Electromecánica',
          areaTrabajo: 'Montajes',
          eps: 'Nueva EPS',
          arl: 'SURA',
          estadoLaboral: 'Activo',
          fechaExamenMedico: formatOffsetDateYmd(-400), // venció hace 35 días (VENCIDO)
          fechaCursoAlturasAutorizado: '', // NO APLICA
          fechaCursoAlturasCoordinador: '',
          biocentricScore: 89,
        },
        {
          identificacion: '70000005',
          nombre: 'Gabriel Sano Vencimientos Con Miopia',
          cargo: 'Diseñador CAD',
          areaTrabajo: 'Ingeniería',
          eps: 'Famisanar',
          arl: 'SURA',
          estadoLaboral: 'Activo',
          fechaExamenMedico: formatOffsetDateYmd(-165), // +200d (VIGENTE)
          fechaCursoAlturasAutorizado: '', // NO APLICA
          fechaCursoAlturasCoordinador: '',
          enfermedades: 'Miopía',
          diagnosticoMedico: 'Miopía leve bilateral corregida con lentes',
          biocentricScore: 65,
        },
      ],
    });

    await SgsstWorker.create({
      user: testUserId,
      companyId: testCompanyDoc._id,
      perfilId: 'perfil_70000005',
      documento: '70000005',
      nombre: 'Gabriel Sano Vencimientos Con Miopia',
      cargo: 'Diseñador CAD',
      estadoLaboral: 'Activo',
      fitScore: 65,
      condicionesSalud: 'Miopía',
      fitAlerts: ['Control optométrico anual'],
    });

    await SgsstEppData.insertMany([
      {
        user: testUserId,
        companyId: testCompanyDoc._id,
        workerId: '70000003',
        documento: '70000003',
        nombreTrabajador: 'Esteban Solo EPP Botas',
        cargo: 'Electricista Industrial',
        entregas: [
          {
            id: 'epp_botas_esteban',
            nombre: 'Botas Dieléctricas',
            normaTecnica: 'ASTM F2413',
            talla: '41',
            cantidad: 1,
            fechaEntrega: formatOffsetDateYmd(-370),
            fechaVencimiento: formatOffsetDateYmd(-5),
            estado: 'Vencido',
            firmaTrabajador: 'data:image/png;base64,iVBORw0KGgo=',
          },
        ],
      },
      {
        user: testUserId,
        companyId: testCompanyDoc._id,
        workerId: '70000004',
        documento: '70000004',
        nombreTrabajador: 'Fernanda Doble Brecha Merge',
        cargo: 'Supervisora Electromecánica',
        entregas: [
          {
            id: 'epp_casco_fernanda',
            nombre: 'Casco Dieléctrico',
            normaTecnica: 'ANSI Z89.1',
            talla: 'Única',
            cantidad: 1,
            fechaEntrega: formatOffsetDateYmd(-180),
            fechaVencimiento: formatOffsetDateYmd(180),
            estado: 'Fuera de Servicio',
            observaciones: 'Fisura lateral detectada en inspección',
            firmaTrabajador: 'data:image/png;base64,iVBORw0KGgo=',
          },
        ],
      },
      {
        user: testUserId,
        companyId: testCompanyDoc._id,
        workerId: '70000005',
        documento: '70000005',
        nombreTrabajador: 'Gabriel Sano Vencimientos Con Miopia',
        cargo: 'Diseñador CAD',
        entregas: [
          {
            id: 'epp_gafas_gabriel',
            nombre: 'Gafas de Seguridad Antirreflejo',
            normaTecnica: 'ANSI Z87.1',
            talla: 'Única',
            cantidad: 1,
            fechaEntrega: formatOffsetDateYmd(-30),
            fechaVencimiento: formatOffsetDateYmd(335),
            estado: 'Entregado',
            firmaTrabajador: 'data:image/png;base64,iVBORw0KGgo=',
          },
        ],
      },
    ]);

    // Verificar directamente el inspector de Hito 2 en modo expiry_only (alcance ['emo', 'alturas'])
    const hito2ExpiryInspect = await inspectNodeLiveData({
      userId: testUserId,
      companyId: testCompanyIdStr,
      nodeId: 'hito2_perfil_socio',
      nodeConfig: emoPreset.workflowNodes.canvasLayout.nodeConfigs.tool_hitos_hito2_perfil_socio,
    });
    const recMap7 = new Map(hito2ExpiryInspect.records.map((r) => [String(r.id), r]));

    // Caso 1: Camilo (EMO <= 30d, Alturas vacío -> No aplica)
    const rCamilo = recMap7.get('70000001');
    assert.strictEqual(rCamilo?.isCritical, true);
    assert.strictEqual(rCamilo?.fields?.aplicaCursoAlturas, 'No aplica');
    assert.strictEqual(rCamilo?.fields?.estadoCursoAlturasAutorizado, 'NO APLICA');
    assert.ok(
      String(rCamilo?.fields?.estadoExamenMedicoEMO || '').startsWith('PRÓXIMO A VENCER'),
      `Camilo debe tener EMO PRÓXIMO A VENCER, obtenido: ${rCamilo?.fields?.estadoExamenMedicoEMO}`,
    );
    assert.ok(
      !String(rCamilo?.fields?.motivosVencimientoDetectados || '').includes('Alturas'),
      'Camilo con casilla de alturas vacía JAMÁS debe tener motivo de vencimiento en Alturas',
    );
    recordAssertion(
      'BLOQUE_7',
      'B7.1',
      'Caso 1 (CC 70000001): EMO a 10d entra en alerta temprana y casilla vacía de Alturas resuelve aplicaCursoAlturas="No aplica" con 0 falsa alerta',
    );

    // Caso 2: Diana (EMO vigente +200d, Curso Alturas Autorizado hace 380d -> VENCIDO)
    const rDiana = recMap7.get('70000002');
    assert.strictEqual(rDiana?.isCritical, true);
    assert.strictEqual(rDiana?.fields?.aplicaCursoAlturas, 'Sí aplica');
    assert.ok(
      String(rDiana?.fields?.estadoExamenMedicoEMO || '').startsWith('VIGENTE'),
      `Diana debe tener EMO VIGENTE, obtenido: ${rDiana?.fields?.estadoExamenMedicoEMO}`,
    );
    assert.ok(
      String(rDiana?.fields?.estadoCursoAlturasAutorizado || '').startsWith('VENCIDO'),
      `Diana debe tener Curso Alturas Autorizado VENCIDO, obtenido: ${rDiana?.fields?.estadoCursoAlturasAutorizado}`,
    );
    assert.ok(
      String(rDiana?.fields?.motivosVencimientoDetectados || '').includes('Curso Alturas Autorizado: VENCIDO'),
    );
    recordAssertion(
      'BLOQUE_7',
      'B7.2',
      'Caso 2 (CC 70000002): EMO vigente (+200d) + fechaCursoAlturasAutorizado hace 380d entra con aplicaCursoAlturas="Sí aplica" y Curso Alturas Autorizado VENCIDO',
    );

    // Ejecutar la automatización completa clonada de `preset_vencimientos_emo_epp` para verificar Casos 3, 4 y 5 extremo a extremo
    const block7WfNodes = JSON.parse(JSON.stringify(emoPreset.workflowNodes));
    block7WfNodes.outputs = ['acpm_task', 'wappy_notification'];
    block7WfNodes.canvasLayout.nodeConfigs.out_acpm_task = { ifBranch: 'yes' };
    block7WfNodes.canvasLayout.nodeConfigs.out_wappy_notification = { ifBranch: 'no' };

    const block7Auto = await Automation.create({
      user: testUserId,
      companyId: testCompanyIdStr,
      name: '[TEST SUITE B7] Auditoría Multi-Dominio EMO + Alturas + EPP',
      agentId: 'agent_consultor_sg_sst',
      agentName: 'Consultor SG-SST',
      prompt: emoPreset.prompt,
      scheduleType: 'daily',
      scheduleConfig: { time: '07:00', timezone: 'America/Bogota' },
      status: 'inactive',
      workflowNodes: block7WfNodes,
    });
    createdAutomationIds.push(block7Auto._id);

    let block7Prompt = '';
    await runAutomation(block7Auto.toObject(), {
      isManual: true,
      agentExecutorOverride: async ({ effectivePrompt }) => {
        block7Prompt = effectivePrompt;
        return {
          text:
            '### Informe Consolidado Consultor SG-SST\n' +
            '1. **EMO (Hito 2):** Camilo (70000001) próximo a vencer; Fernanda (70000004) vencido.\n' +
            '2. **Alturas Res. 4272/2021 (Hito 2):** Diana (70000002) vencido.\n' +
            '3. **EPP (Hito 5):** Esteban (70000003) Botas Dieléctricas vencidas; Fernanda (70000004) Casco Dieléctrico fuera de servicio.',
        };
      },
    });

    // Caso 3: Esteban (EMO vigente, Alturas "", Botas Dieléctricas Vencido en Hito 5 EPP)
    assert.strictEqual(recMap7.get('70000003')?.isCritical, false, 'Esteban NO debe ser crítico en Hito 2');
    assert.ok(
      block7Prompt.includes('70000003') &&
        block7Prompt.includes('Esteban Solo EPP Botas') &&
        block7Prompt.includes('Botas Dieléctricas'),
      'Esteban DEBE entrar al prompt por Botas Dieléctricas vencidas desde Hito 5 · Entrega y Seguimiento de EPP',
    );
    recordAssertion(
      'BLOQUE_7',
      'B7.3',
      'Caso 3 (CC 70000003): Sin brechas en Hito 2, entra limpiamente desde Hito 5 EPP por Botas Dieléctricas con estado="Vencido"',
    );

    // Caso 4: Fernanda (Misma cédula 70000004 con EMO vencido en Hito 2 Y Casco Dieléctrico Fuera de Servicio en Hito 5 EPP)
    const mergeSectionB7 =
      block7Prompt.split('🔀 [REGISTROS CONSOLIDADOS Y DEDUPLICADOS POR NODO MERGE')[1] || '';
    const fernandaMergeIdx = mergeSectionB7.indexOf('70000004');
    assert.ok(fernandaMergeIdx >= 0, 'Fernanda (70000004) debe figurar en la sección consolidada de logic_merge');
    const fernandaMergeSlice = mergeSectionB7.slice(fernandaMergeIdx, fernandaMergeIdx + 900);
    assert.ok(
      /EMO:\s*VENCIDO/i.test(fernandaMergeSlice) &&
        /Casco Dieléctrico/i.test(fernandaMergeSlice) &&
        /Fuera de Servicio/i.test(fernandaMergeSlice),
      `logic_merge DEBE conservar TANTO el EMO vencido (Hito 2) COMO el Casco Dieléctrico Fuera de Servicio (Hito 5 EPP) para CC 70000004 sin pisar ninguno. Obtenido:\n${fernandaMergeSlice}`,
    );
    recordAssertion(
      'BLOQUE_7',
      'B7.4',
      'Caso 4 (CC 70000004 — Merge sin Pérdida): logic_merge preserva simultáneamente el EMO vencido de Hito 2 y el Casco Dieléctrico Fuera de Servicio de Hito 5 EPP bajo la misma cédula',
    );

    // Caso 5: Gabriel (EMO vigente +200d, Alturas "", EPP Entregado vigente, fitScore: 65 y enfermedades: "Miopía")
    assert.strictEqual(
      recMap7.get('70000005')?.isCritical,
      false,
      'Gabriel con EMO vigente y Alturas No aplica NO debe ser crítico en modo expiry_only aunque tenga fitScore=65 y Miopía',
    );
    assert.ok(
      !block7Prompt.includes('70000005') &&
        !block7Prompt.includes('Gabriel Sano Vencimientos') &&
        !block7Prompt.includes('Miopía'),
      'Cero contaminación clínica: Gabriel (fitScore=65, Miopía, EMO y EPP vigentes) JAMÁS debe entrar al prompt de vencimientos',
    );
    recordAssertion(
      'BLOQUE_7',
      'B7.5',
      'Caso 5 (CC 70000005 — Cero Contaminación Clínica): Trabajador con EMO/EPP vigentes, Alturas="", fitScore=65 y enfermedades="Miopía" queda 100% excluido del prompt de vencimientos',
    );
  } finally {
    try {
      stopAutomationScheduler();
    } catch (_) {}
    // ═════════════════════════════════════════════════════════════════════════
    // LIMPIEZA ATÓMICA 100% GARANTIZADA DE DATOS EFÍMEROS DE PRUEBA
    // ═════════════════════════════════════════════════════════════════════════
    if (testCompanyDoc?._id) {
      const cidObj = testCompanyDoc._id;
      const cidStr = String(testCompanyDoc._id);
      await Promise.all([
        AutomationLog.deleteMany({
          $or: [{ companyId: cidStr }, { automation: { $in: createdAutomationIds } }],
        }),
        Automation.deleteMany({
          $or: [{ companyId: cidStr }, { _id: { $in: createdAutomationIds } }],
        }),
        KanbanTask.deleteMany({ companyId: cidObj }),
        Notification.deleteMany({ companyId: cidStr }),
        TenshiMessage.deleteMany({ companyId: cidStr }).catch(() => {}),
        PerfilSociodemograficoData.deleteMany({ companyId: { $in: [cidObj, cidStr] } }),
        SgsstEppData.deleteMany({ companyId: { $in: [cidObj, cidStr] } }),
        PermisoAlturasData.deleteMany({ companyId: { $in: [cidObj, cidStr] } }),
        (mongoose.models.SgsstWorker
          ? mongoose.models.SgsstWorker.deleteMany({ companyId: { $in: [cidObj, cidStr] } })
          : Promise.resolve()),
        CompanyInfo.deleteOne({ _id: cidObj }),
      ]);

      // Verificación forense de residuos = 0
      const [remComp, remAuto, remLogs, remKanban] = await Promise.all([
        CompanyInfo.countDocuments({ _id: cidObj }),
        Automation.countDocuments({ companyId: cidStr }),
        AutomationLog.countDocuments({ companyId: cidStr }),
        KanbanTask.countDocuments({ companyId: cidObj }),
      ]);
      assert.strictEqual(
        remComp + remAuto + remLogs + remKanban,
        0,
        'La limpieza atómica de MongoDB dejó residuos temporales',
      );
      recordAssertion(
        'CLEANUP',
        'CLEAN.1',
        'Limpieza atómica verificada en MongoDB: 0 documentos temporales residuales tras finalizar la suite',
      );
    }
    await mongoose.disconnect();
  }

  const totalDurationMs = Date.now() - startSuiteMs;
  console.log('\n══════════════════════════════════════════════════════════════════════════════════');
  console.log(
    `🏆 RESULTADO FINAL: ${results.length}/${results.length} PRUEBAS LÓGICAS SUPERADAS AL 100% (${(totalDurationMs / 1000).toFixed(2)}s)`,
  );
  console.log('══════════════════════════════════════════════════════════════════════════════════');

  return {
    passed: true,
    totalAssertions: results.length,
    durationMs: totalDurationMs,
    presetVersion: SYSTEM_WORKFLOW_PRESETS_VERSION,
    results,
  };
}

if (require.main === module) {
  runFullLogicalTestSuite()
    .then((summary) => {
      if (process.argv.includes('--json')) {
        console.log(JSON.stringify(summary, null, 2));
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ FALLO CRÍTICO EN LA SUITE DE PRUEBAS LÓGICAS:', err);
      mongoose.disconnect().finally(() => process.exit(1));
    });
}

module.exports = { runFullLogicalTestSuite };
