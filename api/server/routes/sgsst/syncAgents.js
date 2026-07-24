'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireJwtAuth } = require('~/server/middleware');
const { Agent, Project, AclEntry } = require('~/db/models');
const { logger } = require('~/config');
const mongoose = require('mongoose');

function preprocessInstructions(mdContent) {
  const searchWebRule = `\n\n⚠️ REGLA DE ORO DE BÚSQUEDA WEB: Al usar la búsqueda en la web, NUNCA busques con términos individuales o palabras sueltas (ej: "decreto", "incapacidad"). Debes redactar consultas específicas y compuestas en lenguaje natural que relacionen el contexto exacto (ej: "Decreto 780 de 2016 pago de incapacidades comunes colombia" o "estabilidad laboral reforzada Sentencia SU-111 de 2025"). No realices búsquedas en bucle de forma redundante; si tras 2 intentos no encuentras el dato específico, continúa con tu conocimiento y base interna.`;
  const wappyCardRule = `\n\n⚠️ REGLA DE ORO DE TARJETAS (wappy-card): Si decides presentar información estructurada (como listas de chequeo, planes de acción, resúmenes o métricas), DEBES utilizar estrictamente un bloque de código marcado exclusivamente con la etiqueta de lenguaje \`wappy-card\` (es decir, iniciando con \`\`\`wappy-card y cerrando con \`\`\`). El contenido de este bloque debe ser ÚNICAMENTE un objeto JSON válido y estructurado. Está estrictamente PROHIBIDO escribir la palabra "wappy-card" dentro del JSON o usar cualquier formato Markdown (como viñetas, guiones o negritas) dentro del bloque de código. Ejemplo de formato correcto:
\`\`\`wappy-card
{
  "title": "Plan de Acción",
  "layout": "checklist",
  "items": [
    { "label": "Revisar planta de personal", "checked": false }
  ]
}
\`\`\``;
  const formatVisualRule = `\n\n🔹 11. Reglas de Formato Visual (Tablas, Tarjetas y Documentos):
- **Tablas de Datos / Matrices:** Utiliza SIEMPRE tablas en formato Markdown estándar (ej: \`| Hito | Acción |\`). Está terminantemente PROHIBIDO escribir objetos JSON o bloques de código marcados con \`json\` para pintar tablas de filas y columnas, ya que no se renderizan y rompen la estética.
- **Tarjetas Interactivas (wappy-card):** Para checklists, cuadrículas, listas y métricas, utiliza exclusivamente el bloque de código \`wappy-card\` (con el JSON exacto en su interior como se indica en su regla de oro). NUNCA utilices el lenguaje de código \`json\` para englobar una tarjeta wappy-card.
- **Documentos y Cartas Formales:** Cuando la respuesta requiera redactar actas, reglamentos, contratos, citaciones a descargos o cartas extensas, está terminantemente PROHIBIDO escribir el documento extenso directamente en el chat de texto. En su lugar, DEBES llamar de manera autónoma a la herramienta \`canvas\` para crear o actualizar el documento en el editor lateral derecho. En el chat del usuario, limítate a resumir brevemente la acción realizada y los puntos clave.`;
  const conciseResponseRule = `\n\n⚠️ REGLA DE CONCISIÓN: Si la solicitud del usuario es un saludo, una pregunta corta o un cambio simple en algún editor o herramienta, responde directamente de forma concisa y sin extender tu proceso de razonamiento.`;
  
  return mdContent + searchWebRule + wappyCardRule + formatVisualRule + conciseResponseRule;
}

// Exact mapping between local markdown filenames (without .md) and database Agent names.
const AGENT_FILE_MAP = {
  'abogado_laboral': 'Abogado Laboral',
  'medico_laboral': 'Médico Laboral',
  'agente_sst': 'Consultor SG-SST',
  'profesional_sst': 'Profesional SST',
  'fisioterapeuta_laboral': 'Fisioterapeuta Laboral',
  'psicologo_sst': 'Psicólogo SST',
  'terapeuta_salud_mental': 'Terapeuta en Salud Mental',
  'nutricionista_laboral': 'Nutricionista Laboral',
  'primer_respondiente': 'Primer Respondiente',
  'coordinador_emergencias': 'Coordinador de Emergencias',
  'especialista_bioseguridad': 'Especialista en Bioseguridad',
  'ingeniero_electricista_sst': 'Ingeniero Electricista SST',
  'ingeniero_quimico_sst': 'Ingeniero Químico SST',
  'coordinador_seguridad_vial': 'Coordinador de Seguridad Vial',
  'coordinador_tareas_criticas': 'Coordinador de Tareas Críticas',
  'ingeniero_minas_sst': 'Ingeniero de Minas SST',
  'auditor_sg_sst': 'Auditor SG-SST',
  'ingeniero_ambiental': 'Ingeniero Ambiental',
  'especialista_riesgo_climatico': 'Especialista en Riesgo Climático',
  'redactor_creativo': 'Redactor Creativo',
  'simulador_accidentes': 'Simulador de Accidentes SST',
  'coordinador_capacitaciones': 'Coordinador de Capacitaciones'
};

const AGENT_CATEGORY_MAP = {
  'abogado_laboral': 'legal_cumplimiento',
  'medico_laboral': 'ergonomia_salud_bienestar',
  'agente_sst': 'gestion_consultoria_sg_sst',
  'profesional_sst': 'gestion_consultoria_sg_sst',
  'fisioterapeuta_laboral': 'ergonomia_salud_bienestar',
  'psicologo_sst': 'ergonomia_salud_bienestar',
  'terapeuta_salud_mental': 'ergonomia_salud_bienestar',
  'nutricionista_laboral': 'ergonomia_salud_bienestar',
  'primer_respondiente': 'ergonomia_salud_bienestar',
  'coordinador_emergencias': 'especialistas_riesgos_especificos',
  'especialista_bioseguridad': 'especialistas_riesgos_especificos',
  'ingeniero_electricista_sst': 'especialistas_riesgos_especificos',
  'ingeniero_quimico_sst': 'especialistas_riesgos_especificos',
  'coordinador_seguridad_vial': 'especialistas_riesgos_especificos',
  'coordinador_tareas_criticas': 'especialistas_riesgos_especificos',
  'ingeniero_minas_sst': 'especialistas_riesgos_especificos',
  'auditor_sg_sst': 'gestion_consultoria_sg_sst',
  'ingeniero_ambiental': 'gestion_ambiental',
  'especialista_riesgo_climatico': 'gestion_ambiental',
  'redactor_creativo': 'gestion_consultoria_sg_sst',
  'simulador_accidentes': 'investigacion_inspeccion',
  'coordinador_capacitaciones': 'gestion_consultoria_sg_sst'
};

async function ensureAgentExists(dbName, fileBasename, mdContent, authorId) {
  let agent = await Agent.findOne({ name: dbName });
  if (agent) {
    return agent;
  }

  logger.info(`[SyncAgents] Agent "${dbName}" not found. Creating programmatically.`);
  const crypto = require('crypto');
  const agentId = crypto.randomUUID();

  // Determine tools based on agent type
  const tools = [
    'google_slides', 'google_docs', 'google_sheets', 'google_gmail',
    'google_calendar', 'google_drive', 'somos_sst', 'canvas', 'web_search',
    'consultar_agente_especializado'
  ];

  const IPEVAR_AGENTS = [
    'abogado_laboral', 'medico_laboral', 'agente_sst', 'profesional_sst', 'auditor_sg_sst',
    'psicologo_sst', 'fisioterapeuta_laboral', 'ingeniero_quimico_sst', 'ingeniero_electricista_sst',
    'coordinador_tareas_criticas', 'coordinador_seguridad_vial', 'ingeniero_minas_sst',
    'especialista_bioseguridad', 'coordinador_emergencias', 'ingeniero_ambiental', 'especialista_riesgo_climatico'
  ];
  if (IPEVAR_AGENTS.includes(fileBasename)) {
    tools.push('matriz_ipevar');
  }

  if (fileBasename === 'abogado_laboral') {
    tools.push('editor_rit');
  }

  const PSICOSOCIAL_AGENTS = ['psicologo_sst', 'agente_sst', 'profesional_sst', 'auditor_sg_sst'];
  if (PSICOSOCIAL_AGENTS.includes(fileBasename)) {
    tools.push('consultar_analitica_psicosocial');
  }

  if (fileBasename === 'redactor_creativo') {
    tools.push('blog_editor');
  }

  const ACTOS_AGENTS = ['auditor_sg_sst', 'agente_sst', 'profesional_sst', 'ingeniero_ambiental', 'especialista_riesgo_climatico'];
  if (ACTOS_AGENTS.includes(fileBasename)) {
    tools.push('consultar_analitica_actos_condiciones');
  }

  const timestamp = new Date();
  const defaultModel = 'gemini-3.6-flash';
  const targetCategory = AGENT_CATEGORY_MAP[fileBasename] || 'general';
  const agentData = {
    id: agentId,
    name: dbName,
    description: `Agente SST: ${dbName}`,
    instructions: mdContent,
    provider: 'google',
    model: defaultModel,
    tools,
    is_whatsapp_enabled: false,
    author: new mongoose.Types.ObjectId(authorId),
    category: targetCategory,
    versions: [
      {
        name: dbName,
        description: `Agente SST: ${dbName}`,
        instructions: mdContent,
        provider: 'google',
        model: defaultModel,
        tools,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ]
  };

  agent = new Agent(agentData);
  
  // Link to Global project
  const globalProject = await Project.findOne({ name: 'Global' }) || await Project.findOne({});
  if (globalProject) {
    agent.projectIds = [globalProject._id.toString()];
  }

  await agent.save();

  // Add ACL entry
  if (AclEntry) {
    const aclDoc = new AclEntry({
      resourceType: 'agent',
      resourceId: agent._id,
      principalType: 'user',
      principalId: new mongoose.Types.ObjectId(authorId),
      principalModel: 'User',
      permBits: 15, // VIEW | EDIT | DELETE | SHARE
      grantedBy: new mongoose.Types.ObjectId(authorId)
    });
    await aclDoc.save();
  }

  // Add agentId to global project
  if (globalProject) {
    await Project.findByIdAndUpdate(globalProject._id, {
      $addToSet: { agentIds: agent.id }
    });
  }

  logger.info(`[SyncAgents] Programmatically created agent: "${dbName}" with ID: ${agent.id}`);
  return agent;
}


/**
 * GET /api/sgsst/sync-agents/export-agents
 * 
 * Secure endpoint to export all active agents from the MongoDB collection.
 * Restrained to ADMIN roles. Returns a clean, indented JSON file as an attachment download.
 */
router.get('/export-agents', requireJwtAuth, async (req, res) => {
  try {
    // Access validation: Only ADMIN users are authorized
    if (req.user?.role !== 'ADMIN') {
      logger.warn(`[ExportAgents] Unauthorized export attempt by user: ${req.user?.id} with role: ${req.user?.role}`);
      return res.status(403).json({ error: 'Solo los administradores están autorizados para exportar agentes.' });
    }

    logger.info(`[ExportAgents] Starting database export of all agents requested by ADMIN: ${req.user?.id}`);
    const agents = await Agent.find({}).lean();

    // Configure client browser attachment headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=wappy_agents_backup.json');

    return res.send(JSON.stringify(agents, null, 2));
  } catch (err) {
    logger.error('[ExportAgents] Critical export failure:', err);
    return res.status(500).json({ error: 'Falla interna al exportar agentes: ' + err.message });
  }
});

/**
 * POST /api/sgsst/sync-agents/sync
 * 
 * Secure endpoint to synchronize local .md prompts in Agentes/Agentes Wappy/ with MongoDB Agent records.
 * Restrained to ADMIN roles. Maps filename basenames via AGENT_FILE_MAP to Agent names.
 */
router.post('/sync', requireJwtAuth, async (req, res) => {
  try {
    // Access validation: Only ADMIN users are authorized
    if (req.user?.role !== 'ADMIN') {
      logger.warn(`[SyncAgents] Unauthorized sync attempt by user: ${req.user?.id} with role: ${req.user?.role}`);
      return res.status(403).json({ error: 'Solo los administradores están autorizados para sincronizar agentes.' });
    }

    logger.info(`[SyncAgents] Prompt synchronization started by ADMIN: ${req.user?.id}`);
    
    // Resolve absolute path to the Agentes Wappy folder
    // __dirname = /app/api/server/routes/sgsst  →  4 levels up = /app
    const agentsDir = path.resolve(__dirname, '../../../..', 'Agentes/Agentes Wappy');
    if (!fs.existsSync(agentsDir)) {
      logger.error(`[SyncAgents] Directory not found: ${agentsDir}`);
      return res.status(404).json({ error: `La carpeta de agentes no fue encontrada en: ${agentsDir}` });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Scan all keys in AGENT_FILE_MAP and process them
    for (const [fileBasename, dbName] of Object.entries(AGENT_FILE_MAP)) {
      const filePath = path.join(agentsDir, `${fileBasename}.md`);
      
      if (!fs.existsSync(filePath)) {
        logger.warn(`[SyncAgents] Expected file not found: ${filePath}`);
        results.push({
          file: `${fileBasename}.md`,
          agentName: dbName,
          status: 'WARNING',
          message: 'Archivo Markdown no encontrado en el servidor.'
        });
        failCount++;
        continue;
      }

      try {
        const mdContent = fs.readFileSync(filePath, 'utf8');
        const finalInstructions = preprocessInstructions(mdContent);
        
        // Find corresponding agent in MongoDB or create if missing
        const agent = await ensureAgentExists(dbName, fileBasename, finalInstructions, req.user.id);

        const targetCategory = AGENT_CATEGORY_MAP[fileBasename] || 'general';

        // Check if there is actual difference in instructions and category to avoid unnecessary saves
        if (agent.instructions === finalInstructions && agent.category === targetCategory) {
          results.push({
            file: `${fileBasename}.md`,
            agentName: dbName,
            status: 'NO_CHANGE',
            message: 'Las instrucciones y categoría ya coinciden exactamente.'
          });
          continue;
        }

        // Update the instructions, category, and versions of the agent to keep them aligned
        const timestamp = new Date();
        const updatedVersions = [
          {
            name: agent.name || dbName,
            description: agent.description || `Agente SST: ${dbName}`,
            instructions: finalInstructions,
            provider: agent.provider || 'google',
            model: agent.model || 'gemini-3.5-flash',
            tools: agent.tools || [],
            createdAt: agent.createdAt || timestamp,
            updatedAt: timestamp
          }
        ];
        await Agent.findOneAndUpdate(
          { id: agent.id },
          {
            $set: {
              instructions: finalInstructions,
              category: targetCategory,
              versions: updatedVersions
            }
          }
        );

        logger.info(`[SyncAgents] Successfully updated agent: "${dbName}" (${agent.id})`);
        results.push({
          file: `${fileBasename}.md`,
          agentName: dbName,
          status: 'SUCCESS',
          message: 'Instrucciones sincronizadas exitosamente.'
        });
        successCount++;
      } catch (err) {
        logger.error(`[SyncAgents] Failed to sync agent "${dbName}":`, err);
        results.push({
          file: `${fileBasename}.md`,
          agentName: dbName,
          status: 'ERROR',
          message: `Falla interna al sincronizar: ${err.message}`
        });
        failCount++;
      }
    }

    // Ensure the psychologist agent has the new psicosocial analytics tool
    try {
      await Agent.findOneAndUpdate(
        { name: 'Psicólogo SST' },
        { $addToSet: { tools: { $each: ['consultar_analitica_psicosocial', 'canvas'] } } }
      );
      logger.info('[SyncAgents] Added consultar_analitica_psicosocial and canvas tools to Psicólogo SST');
    } catch (err) {
      logger.error('[SyncAgents] Error adding psicosocial tool to agent:', err);
    }

    // Ensure the Road Safety agent has canvas and context tools
    try {
      await Agent.findOneAndUpdate(
        { name: 'Coordinador de Seguridad Vial' },
        { $addToSet: { tools: { $each: ['canvas', 'context'] } } }
      );
      logger.info('[SyncAgents] Added canvas and context tools to Coordinador de Seguridad Vial');
    } catch (err) {
      logger.error('[SyncAgents] Error adding road safety tools to agent:', err);
    }

    // Ensure the Chemical Risk agent has canvas
    try {
      await Agent.findOneAndUpdate(
        { name: 'Ingeniero Químico SST' },
        { $addToSet: { tools: 'canvas' } }
      );
      logger.info('[SyncAgents] Updated tools to include canvas for Ingeniero Químico SST');
    } catch (err) {
      logger.error('[SyncAgents] Error updating tools for Ingeniero Químico SST:', err);
    }

    // Pull deactivated tools from all agents
    try {
      await Agent.updateMany({}, {
        $pull: {
          tools: { $in: ['matriz_pesv', 'matriz_compatibilidad', 'editor_live'] }
        }
      });
      logger.info('[SyncAgents] Successfully removed deactivated tools (matriz_pesv, matriz_compatibilidad, editor_live) from all agents in database');
    } catch (err) {
      logger.error('[SyncAgents] Error pulling deactivated tools:', err);
    }

    return res.json({
      success: true,
      summary: `Sincronización finalizada. Se actualizaron ${successCount} agentes. Warnings/Errores: ${failCount}.`,
      successCount,
      failCount,
      results
    });


  } catch (err) {
    logger.error('[SyncAgents] Critical synchronization failure:', err);
    return res.status(500).json({ error: 'Falla interna del servidor durante la sincronización: ' + err.message });
  }
});

/**
 * POST /api/sgsst/sync-agents/cleanup-and-sync
 *
 * One-shot endpoint that:
 *  1. Reads each non-protected .md file from Agentes/Agentes Wappy/
 *  2. Removes the obsolete "GESTIÓN DE ACTIVACIÓN MANUAL DE HERRAMIENTAS" block
 *  3. Writes the cleaned version back to disk (in-place)
 *  4. Updates the corresponding Agent document in MongoDB
 *
 * Protected agents (7) are never touched.
 * Restrained to ADMIN roles only.
 */
const PROTECTED_AGENTS = new Set([
  'abogado_rit',
  'asistente_ats',
  'asistente_de_aci',
  'asistente_inv_at',
  'asistente_inv_el',
  'asistente_metodo_rosa',
  'analista_ipt_ergonomico',
  'coordinador_ipevar'
]);

router.post('/cleanup-and-sync', requireJwtAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      logger.warn(`[CleanupSync] Unauthorized attempt by user: ${req.user?.id}`);
      return res.status(403).json({ error: 'Solo los administradores están autorizados.' });
    }

    logger.info(`[CleanupSync] Started by ADMIN: ${req.user?.id}`);

    // __dirname = /app/api/server/routes/sgsst  →  4 levels up = /app
    const agentsDir = path.resolve(__dirname, '../../../..', 'Agentes/Agentes Wappy');
    if (!fs.existsSync(agentsDir)) {
      return res.status(404).json({ error: `Carpeta de agentes no encontrada: ${agentsDir}` });
    }

    const TARGET_HEADER = '*** GESTIÓN DE ACTIVACIÓN MANUAL DE HERRAMIENTAS (CRÍTICO) ***';
    const NEXT_HEADER   = '### ⚠️ INSTRUCCIÓN CRÍTICA DE VERIFICACIÓN ⚠️';

    const results = [];
    let cleanedCount  = 0;
    let syncedCount   = 0;
    let protectedCount = 0;
    let failCount     = 0;

    for (const [fileBasename, dbName] of Object.entries(AGENT_FILE_MAP)) {
      if (PROTECTED_AGENTS.has(fileBasename)) {
        logger.info(`[CleanupSync] PROTECTED — skipping: ${fileBasename}.md`);
        protectedCount++;
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'PROTECTED', message: 'Agente protegido, no se modifica.' });
        continue;
      }

      const filePath = path.join(agentsDir, `${fileBasename}.md`);
      if (!fs.existsSync(filePath)) {
        logger.warn(`[CleanupSync] File not found: ${filePath}`);
        failCount++;
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'WARNING', message: 'Archivo .md no encontrado.' });
        continue;
      }

      try {
        let mdContent = fs.readFileSync(filePath, 'utf8');

        // ── Step 1: Strip the obsolete manual-activation block ──────────────
        const startIdx = mdContent.indexOf(TARGET_HEADER);
        if (startIdx !== -1) {
          const endIdx = mdContent.indexOf(NEXT_HEADER, startIdx);
          if (endIdx !== -1) {
            const before = mdContent.substring(0, startIdx);
            const after  = mdContent.substring(endIdx);
            mdContent = (before.trimEnd() + '\n\n' + after.trimStart()).trim() + '\n';
            fs.writeFileSync(filePath, mdContent, 'utf8');
            cleanedCount++;
            logger.info(`[CleanupSync] Cleaned: ${fileBasename}.md`);
          } else {
            logger.warn(`[CleanupSync] Start marker found but end marker missing in: ${fileBasename}.md`);
          }
        }

        // ── Step 2: Sync cleaned content to MongoDB or create if missing ──────
        const finalInstructions = preprocessInstructions(mdContent);
        const agent = await ensureAgentExists(dbName, fileBasename, finalInstructions, req.user.id);

        const targetCategory = AGENT_CATEGORY_MAP[fileBasename] || 'general';

        if (agent.instructions === finalInstructions && agent.category === targetCategory) {
          results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'NO_CHANGE', message: 'Las instrucciones y categoría ya coinciden.' });
          continue;
        }

        const timestamp = new Date();
        const updatedVersions = [
          {
            name: agent.name || dbName,
            description: agent.description || `Agente SST: ${dbName}`,
            instructions: finalInstructions,
            provider: agent.provider || 'google',
            model: agent.model || 'gemini-3.5-flash',
            tools: agent.tools || [],
            createdAt: agent.createdAt || timestamp,
            updatedAt: timestamp
          }
        ];
        await Agent.findOneAndUpdate(
          { _id: agent._id },
          {
            $set: {
              instructions: finalInstructions,
              category: targetCategory,
              versions: updatedVersions
            }
          }
        );
        syncedCount++;
        logger.info(`[CleanupSync] Synced "${dbName}" to MongoDB.`);
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'SUCCESS', message: 'Limpiado y sincronizado exitosamente.' });

      } catch (innerErr) {
        logger.error(`[CleanupSync] Error processing "${fileBasename}":`, innerErr);
        failCount++;
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'ERROR', message: `Error: ${innerErr.message}` });
      }
    }

    // Ensure the psychologist agent has the new psicosocial analytics tool
    try {
      await Agent.findOneAndUpdate(
        { name: 'Especialista en Riesgo Psicosocial' },
        { $addToSet: { tools: { $each: ['consultar_analitica_psicosocial', 'canvas'] } } }
      );
      logger.info('[CleanupSync] Added consultar_analitica_psicosocial and canvas tools to Especialista en Riesgo Psicosocial');
    } catch (err) {
      logger.error('[CleanupSync] Error adding psicosocial tool to agent:', err);
    }

    // Ensure the ACI agent has the new actos/condiciones analytics tool and canvas
    try {
      await Agent.findOneAndUpdate(
        { name: 'Analista Predictivo ACI' },
        { $addToSet: { tools: { $each: ['consultar_analitica_actos_condiciones', 'canvas'] } } }
      );
      logger.info('[CleanupSync] Added consultar_analitica_actos_condiciones and canvas tools to Analista Predictivo ACI');
    } catch (err) {
      logger.error('[CleanupSync] Error adding actos_condiciones tool to agent:', err);
    }

    // Ensure the Road Safety agent has canvas and context tools
    try {
      await Agent.findOneAndUpdate(
        { name: 'Especialista en Riesgo Vial' },
        { $addToSet: { tools: { $each: ['canvas', 'context'] } } }
      );
      logger.info('[CleanupSync] Added canvas and context tools to Especialista en Riesgo Vial');
    } catch (err) {
      logger.error('[CleanupSync] Error adding road safety tools to agent:', err);
    }

    // Ensure the Chemical Risk agent has canvas
    try {
      await Agent.findOneAndUpdate(
        { name: 'Especialista en Riesgo Químico' },
        { $addToSet: { tools: 'canvas' } }
      );
      logger.info('[CleanupSync] Updated tools to include canvas for Especialista en Riesgo Químico');
    } catch (err) {
      logger.error('[CleanupSync] Error updating tools for Especialista en Riesgo Químico:', err);
    }

    // Pull deactivated tools from all agents
    try {
      await Agent.updateMany({}, {
        $pull: {
          tools: { $in: ['matriz_pesv', 'matriz_compatibilidad', 'editor_live'] }
        }
      });
      logger.info('[CleanupSync] Successfully removed deactivated tools (matriz_pesv, matriz_compatibilidad, editor_live) from all agents in database');
    } catch (err) {
      logger.error('[CleanupSync] Error pulling deactivated tools:', err);
    }

    return res.json({
      success: true,
      summary: `Limpieza y sincronización completada. Limpiados: ${cleanedCount}, Sincronizados: ${syncedCount}, Protegidos: ${protectedCount}, Advertencias/Errores: ${failCount}.`,
      cleanedCount,
      syncedCount,
      protectedCount,
      failCount,
      results
    });

  } catch (err) {
    logger.error('[CleanupSync] Critical failure:', err);
    return res.status(500).json({ error: 'Falla interna del servidor: ' + err.message });
  }
});

/**
 * ALL /api/sgsst/sync-agents/seed-prompts
 * 
 * Secure endpoint to seed all 40 premium SST prompts directly into MongoDB.
 * Restricted to ADMIN roles. Maps prompts to the current admin user as author.
 */
router.all('/seed-prompts', requireJwtAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      logger.warn(`[SeedPrompts] Unauthorized seeding attempt by user: ${req.user?.id}`);
      return res.status(403).json({ error: 'Solo los administradores están autorizados para sembrar prompts.' });
    }

    const { User, Project, PromptGroup, Prompt, AclEntry } = require('~/db/models');
    
    // Find the current admin user to set as author
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ error: 'Usuario administrador no encontrado en la base de datos.' });
    }

    // Find the Global project
    let project = await Project.findOne({ name: 'Global' });
    if (!project) {
      project = await Project.findOne({});
    }

    const promptsToSeed = [
      // ==================== 1. WORD (text) ====================
      {
        name: "📝 Política de Seguridad y Salud en el Trabajo (SST)",
        category: "Word",
        type: "text",
        prompt: "Redacta un documento en Word con la política de seguridad y salud en el trabajo para la empresa {{nombre_empresa}}, dedicada a {{actividad_economica}}, con {{numero_trabajadores}} trabajadores y clase de riesgo ARL {{clase_riesgo}}. Asegúrate de que incluya los compromisos legales del Decreto 1072 de 2015, los objetivos estratégicos de prevención de accidentes, y que esté firmado por el representante legal {{representante_legal}}."
      },
      {
        name: "📝 Manual del Sistema de Gestión de SST",
        category: "Word",
        type: "text",
        prompt: "Escribe un manual en Word para el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) de {{nombre_empresa}}. Estructura el documento con la introducción, justificación, alcance para {{alcance_sedes}}, responsabilidades del empleador, el COPASST y los trabajadores bajo el Decreto 1072 de 2015."
      },
      {
        name: "📝 Reglamento de Higiene y Seguridad Industrial",
        category: "Word",
        type: "text",
        prompt: "Genera un documento en Word redactando el Reglamento de Higiene y Seguridad Industrial de {{nombre_empresa}}, NIT {{nit}}, con centros de trabajo en {{ciudades}}. Incluye los riesgos identificados como {{riesgos_principales}}, las obligaciones de la empresa, los deberes de los trabajadores y el compromiso con la ARL {{nombre_arl}}."
      },
      {
        name: "📝 Plan de Prevención y Respuesta ante Emergencias",
        category: "Word",
        type: "text",
        prompt: "Crea un plan de emergencias en Word para la sede {{nombre_sede}} de la empresa {{nombre_empresa}}. Redacta el documento con los análisis de vulnerabilidad física y social, la estructura de la brigada de emergencias liderada por {{lider_brigada}}, los puntos de encuentro y los de evacuación ante {{amenazas_principales}}."
      },
      {
        name: "📝 Acta de Constitución del COPASST",
        category: "Word",
        type: "text",
        prompt: "Redacta una acta en Word de constitución del Comité Paritario de Seguridad y Salud en el Trabajo (COPASST) para la empresa {{nombre_empresa}} para el periodo {{periodo}}. Incluye los representantes del empleador designados por {{representante_legal}} y los representantes de los trabajadores elegidos por votación. Nombra como presidente a {{nombre_presidente}} y como secretario a {{nombre_secretaria}}."
      },
      {
        name: "📝 Procedimiento de Trabajo Seguro en Alturas (TSA)",
        category: "Word",
        type: "text",
        prompt: "Escribe una guía y procedimiento en Word para trabajo seguro en alturas en la empresa {{nombre_empresa}}. El documento debe alinearse con la Resolución 4272 de 2021, detallar los sistemas de protección contra caídas requeridos para la tarea de {{tarea_especifica}}, los roles de coordinador de alturas {{coordinador_alturas}} y el plan de rescate."
      },
      {
        name: "📝 Convocatoria a Elecciones COPASST / Vigía",
        category: "Word",
        type: "text",
        prompt: "Genera una circular en Word para convocar a todos los colaboradores de {{nombre_empresa}} a participar en la elección del {{comite_o_vigia}} para el periodo {{periodo}}. Indica las fechas límites de inscripción, los requisitos para postularse y el cronograma de votación que iniciará el {{fecha_inicio}}."
      },
      {
        name: "📝 Informe de Investigación de Accidente de Trabajo",
        category: "Word",
        type: "text",
        prompt: "Redacta un informe en Word sobre la investigación del accidente de trabajo ocurrido el {{fecha_accidente}} en la empresa {{nombre_empresa}}. Describe la tarea ejecutada por {{nombre_accidentado}}, las causas básicas e inmediatas analizadas con la metodología {{metodologia}} y el plan de acción con los responsables {{responsables}}."
      },
      {
        name: "📝 Llamado de Atención por Incumplimiento de SST",
        category: "Word",
        type: "text",
        prompt: "Crea una carta formal en Word de llamado de atención para el trabajador {{nombre_trabajador}} por no utilizar los elementos de protección personal (EPP) obligatorios, específicamente {{epp_faltante}}, durante la labor de {{labor_realizada}} en la fecha {{fecha_incumplimiento}}, violando el reglamento interno."
      },
      {
        name: "📝 Acta de Rendición de Cuentas Anual en SST",
        category: "Word",
        type: "text",
        prompt: "Redacta un documento en Word con el acta de rendición de cuentas anual en seguridad y salud en el trabajo del responsable de SST {{nombre_responsable}} ante la alta dirección de {{nombre_empresa}}. Detalla el cumplimiento de objetivos del periodo {{periodo}}, el presupuesto ejecutado de {{presupuesto}} y los indicadores clave del SG-SST."
      },

      // ==================== 2. EXCEL (excel) ====================
      {
        name: "📊 Matriz de Riesgos GTC-45 (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Crea una hoja de cálculo en Excel simulando la Matriz de Peligros y Valoración de Riesgos bajo la metodología GTC-45 para {{nombre_empresa}}. Diseña la grilla con columnas de Proceso, Zona, Actividad, Peligro (Descripción y Clasificación), Efectos Posibles, Controles Existentes, Evaluación del Riesgo (Deficiencia, Exposición, Probabilidad, Consecuencia, Nivel de Riesgo, Aceptabilidad) y Medidas de Intervención."
      },
      {
        name: "📊 Cronograma de Actividades SG-SST (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Genera un cronograma de actividades en Excel para el plan de trabajo anual de SST de {{nombre_empresa}} en el periodo {{año}}. Crea una tabla de filas con actividades de medicina preventiva, higiene y seguridad industrial, capacitaciones, simulacros y auditorías, cruzadas con columnas mensuales de planeado vs. ejecutado."
      },
      {
        name: "📊 Indicadores de Accidentalidad Res 0312 (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Diseña una hoja de cálculo en Excel para consolidar los indicadores mínimos de accidentalidad y enfermedad laboral bajo la Resolución 0312 de 2019 para {{nombre_empresa}}. Incluye fórmulas automáticas para calcular la Frecuencia de Accidentes, Severidad de Accidentes, Proporción de Accidentes Mortales, Prevalencia e Incidencia de Enfermedad Laboral y Tasa de Ausentismo de {{meses}}."
      },
      {
        name: "📊 Matriz de Control de Entrega de EPP (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Crea una matriz en Excel para el control y registro de entrega de Elementos de Protección Personal (EPP) en la empresa {{nombre_empresa}}. La tabla debe incluir columnas de Cargo, Área, Nombre del Trabajador, Tipo de EPP (Casco, Botas, etc.), Fecha de Entrega, Fecha de Cambio sugerida, Estado de Uso y firma de recibido."
      },
      {
        name: "📊 Historial de 10 Accidentes y Gráficos (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Genera una hoja de cálculo en Excel simulando un registro histórico de 10 accidentes de trabajo en {{nombre_empresa}}. La tabla debe detallar Fecha, Nombre, Cargo, Tipo de Lesión, Días de Incapacidad, Parte del Cuerpo Afectada y Costos Asociados, con una sección de resumen de indicadores clave automatizada mediante fórmulas."
      },
      {
        name: "📊 Presupuesto Anual del SG-SST (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Diseña un presupuesto en Excel para el SG-SST de {{nombre_empresa}} del periodo {{año}}. La hoja de cálculo debe desglosar los rubros de Recursos Humanos (asesorías, capacitadores), Recursos Técnicos (mediciones ambientales, mantenimiento de equipos, recarga de extintores), Elementos de Protección (EPP, botiquines) y Exámenes Médicos Ocupacionales."
      },
      {
        name: "📊 Matriz de Requisitos Legales en SST (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Crea una matriz legal en Excel de SST para la empresa {{nombre_empresa}}. Diseña columnas que incluyan Norma (Decreto, Ley, Resolución), Año de Emisión, Artículo Aplicable, Descripción del Requisito, Evidencia de Cumplimiento actual, Responsable del Control {{responsable}} y Estado de Cumplimiento (Cumple, No Cumple, En Proceso)."
      },
      {
        name: "📊 Plan de Capacitaciones y Cobertura (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Genera una hoja de cálculo en Excel para controlar el plan de capacitación en SST de {{nombre_empresa}}. Diseña la tabla de seguimiento con columnas de Nombre del Curso, Facilitador, Fecha Programada, Fecha Ejecutada, Número de Asistentes, Porcentaje de Cobertura y Promedio de Evaluación de los participantes."
      },
      {
        name: "📊 Inventario y Recarga de Extintores (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Crea una hoja de cálculo en Excel con el inventario de extintores de la sede {{sede}} de {{nombre_empresa}}. Configura la grilla con columnas de ID del Extintor, Ubicación Exacta, Tipo de Agente (PQS, CO2, Agua Sol), Capacidad (Lbs), Fecha de Recarga, Fecha de Vencimiento, Estado del Manómetro y Responsable de Inspección {{inspector}}."
      },
      {
        name: "📊 Control de Recomendaciones Médicas (Excel)",
        category: "Excel",
        type: "excel",
        prompt: "Diseña una matriz en Excel para el control de restricciones y recomendaciones médicas ocupacionales en la empresa {{nombre_empresa}}. La tabla debe incluir columnas con ID de Trabajador, Nombre, Cargo, Tipo de Examen (Ingreso, Periódico, Retiro), Fecha del Examen, Recomendaciones/Restricciones del médico, Fecha de Seguimiento, Estado (Vigente, Cerrado) y observaciones."
      },

      // ==================== 3. SLIDES (presentation) ====================
      {
        name: "📢 Inducción General de SST (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Genera una presentación de diapositivas en PowerPoint para la inducción general en SST de los nuevos trabajadores de {{nombre_empresa}}. Crea diapositivas sobre la Bienvenida, Política de SST, Objetivos del SG-SST, Derechos y Deberes de los trabajadores, Identificación de Peligros en la actividad de {{actividad_economica}}, Reporte de Accidentes y Plan de Emergencia."
      },
      {
        name: "📢 Investigación de Accidentes para COPASST (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Diseña una presentación de diapositivas sobre reporte e investigación de incidentes y accidentes de trabajo para el COPASST y supervisores de {{nombre_empresa}}. Estructura la presentación explicando la diferencia entre Incidente y Accidente, el tiempo límite de reporte, la metodología de las 5 M's / Árbol de causas y la importancia de las acciones correctivas."
      },
      {
        name: "📢 Resultados Estándares Mínimos Res 0312 (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Crea una presentación de diapositivas para socializar el cumplimiento de los Estándares Mínimos de la Resolución 0312 de 2019 ante la Junta Directiva de la empresa {{nombre_empresa}}. Incluye diapositivas que resuman el porcentaje de avance, fortalezas encontradas, oportunidades de mejora, planes de acción prioritarios y el presupuesto requerido."
      },
      {
        name: "📢 Charla de 5 Minutos sobre EPP (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Genera una presentación corta de diapositivas para la charla de 5 minutos sobre elementos de protección personal (EPP) orientada a operarios de {{nombre_empresa}}. Incluye diapositivas dinámicas explicando la importancia del uso diario, técnica de inspección previa, almacenamiento correcto, reporte de daños y el EPP específico para la labor de {{tarea_critica}}."
      },
      {
        name: "📢 Prevención de Incendios para Brigadistas (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Diseña una presentación de diapositivas de capacitación para la brigada de emergencias de {{nombre_empresa}}. Las láminas deben explicar la química del fuego (triángulo del fuego), clases de incendios (A, B, C, D, K), uso correcto de extintores portátiles según el agente y normas de seguridad de los brigadistas en evacuación."
      },
      {
        name: "📢 Riesgo Ergonómico y Pausas Activas (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Crea una presentación de diapositivas sobre ergonomía laboral y prevención de desórdenes musculoesqueléticos para el personal administrativo y operativo de {{nombre_empresa}}. Diseña diapositivas con posturas correctas (sentado/de pie), manipulación manual de cargas de máximo {{peso_limite}} kg, y una rutina gráfica de pausas activas."
      },
      {
        name: "📢 Socialización de Comité de Convivencia COCOLA (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Genera una presentación de diapositivas para socializar las funciones y alcance del Comité de Convivencia Laboral (COCOLA) en la empresa {{nombre_empresa}}. Explica la definición de Acoso Laboral bajo la Ley 1010 de 2006, las conductas que constituyen acoso, las funciones del comité, el canal de denuncias y el procedimiento confidencial."
      },
      {
        name: "📢 Riesgo Eléctrico y 5 Reglas de Oro (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Diseña una presentación de diapositivas de seguridad eléctrica para técnicos de mantenimiento de {{nombre_empresa}}. Estructura la presentación explicando los efectos de la corriente en el cuerpo humano, los arcos eléctricos, y detalla paso a paso las 5 Reglas de Oro de la electricidad (Corte visible, Bloqueo, Verificar ausencia de tensión, Puesta a tierra y Señalización)."
      },
      {
        name: "📢 Hábitos de Estilo de Vida Saludable (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Genera una presentación de diapositivas sobre estilos de vida y trabajo saludable para los colaboradores de {{nombre_empresa}}. Incluye láminas sobre alimentación balanceada, importancia del ejercicio diario, higiene del sueño, prevención del consumo de alcohol, tabaco y sustancias psychoactivas."
      },
      {
        name: "📢 Seguridad Vial y Manejo Defensivo PESV (Diapositivas)",
        category: "Presentacion",
        type: "presentation",
        prompt: "Crea una presentación de diapositivas sobre el Plan Estratégico de Seguridad Vial (PESV) y técnicas de manejo defensivo para conductores y motociclistas de {{nombre_empresa}}. Explica el factor humano (fatiga, velocidad, celular), la inspección preoperacional del vehículo y las normas de comportamiento vial."
      },

      // ==================== 4. HTML (html) ====================
      {
        name: "⚡ Permiso de Trabajo en Alturas (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa una aplicación y formulario interactivo en HTML para la solicitud y control de Permisos de Trabajo en Alturas (TSA) en la empresa {{nombre_empresa}}. El formulario debe tener un diseño premium con variables HSL, campos de fecha, ejecutor de la tarea, altura aproximada, un checklist interactivo táctil de condiciones de seguridad (puntos de anclaje, arnés, línea de vida), un canvas para firmas digitales del emisor y ejecutor, y un botón funcional de descarga de reporte."
      },
      {
        name: "⚡ Reporte de Actos y Condiciones Inseguras (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Diseña una página y aplicación web interactiva en HTML para reportar Actos y Condiciones Inseguras en {{nombre_empresa}}. Debe incluir campos interactivos de Fecha, Sede, Descripción detallada, fotos o carga de archivos, nivel de riesgo dinámico (Bajo, Medio, Alto) con colores cambiantes, campos interactivos para sugerir medidas correctivas, y un botón para exportar o enviar el reporte generado."
      },
      {
        name: "⚡ Inspección de EPP con Validación Visual (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa un formulario interactivo premium en HTML para realizar la inspección de EPP de los operarios en {{nombre_empresa}}. El diseño interactivo debe permitir seleccionar el nombre del trabajador, marcar con botones (Sí/No/Requiere Cambio) el estado de casco, goggles, botas y guantes, incluir lógica interactiva que resalte en rojo los campos marcados como 'Requiere Cambio', y permitir la firma del supervisor {{inspector}}."
      },
      {
        name: "⚡ Calculadora de Carga Límite GINSHT / NTC (App HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Desarrolla una aplicación interactiva en HTML con una calculadora de levantamiento manual de cargas basada en la ecuación de NTC / GINSHT para la empresa {{nombre_empresa}}. El usuario podrá ingresar interactivamente variables como peso de la carga (kg), distancia horizontal, distancia vertical, frecuencia y duración del levantamiento, y la aplicación calculará en tiempo real el Índice de Riesgo coloreando de verde (Aceptable) o rojo (Riesgo Crítico)."
      },
      {
        name: "⚡ Inspección Mensual de Botiquín (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa una aplicación e inspección interactiva en HTML para la revisión mensual de botiquines en la sede {{sede}} de {{nombre_empresa}}. El formulario debe listar los elementos mínimos obligatorios (gasa, vendas, alcohol, tijeras, etc.), permitir ingresar interactivamente las fechas de vencimiento de cada insumo, alertar automáticamente en rojo si un elemento está vencido o por vencerse, y exportar la lista de chequeo firmada por el inspector {{inspector}}."
      },
      {
        name: "⚡ Permiso de Trabajo en Espacios Confinados (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa un prototipo interactivo en HTML para un Permiso de Trabajo en Espacios Confinados en la empresa {{nombre_empresa}}. Debe contar con secciones dinámicas para registrar la atmósfera medida en tiempo real (Oxígeno %, LEL %, CO ppm, H2S ppm) con alarmas visuales si los niveles no son óptimos, checklist de bloqueo de energía (LOTO), ingreso de personal authorized, firma táctil interactiva y descarga."
      },
      {
        name: "⚡ Inspección Preoperacional Diaria de Vehículos (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Desarrolla una aplicación y formulario web interactivo en HTML para la inspección preoperacional diaria de vehículos de {{nombre_empresa}}. Debe permitir marcar con casillas interactivas el estado de luces, frenos, llantas, niveles de aceite, dirección, kit de carretera, ingresar el kilometraje actual, y mostrar un veredicto dinámico de 'Vehículo Apto' o 'Vehículo No Apto para Circular' basado en los hallazgos críticos."
      },
      {
        name: "⚡ Cuestionario confidencial de Estrés Laboral (Test HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa una aplicación web interactiva en HTML para realizar un test o cuestionario confidencial de autoevaluación de estrés laboral para colaboradores de {{nombre_empresa}}. Diseña 15 preguntas con opciones múltiples (Nunca, A veces, Frecuentemente, Siempre), calcula la puntuación final automáticamente al finalizar el test, y ofrece recomendaciones personalizadas e inmediatas basadas en el nivel de estrés obtenido."
      },
      {
        name: "⚡ Acta Digital de Entrega e Inducción SST (Formulario HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Programa una aplicación interactiva en HTML para registrar de forma digital el Acta de Inducción y Entrega del SG-SST a un nuevo colaborador de {{nombre_empresa}}. El formulario interactivo debe recolectar Nombre, Cédula, Cargo, marcar casillas de los temas de inducción impartidos, contar con un lienzo de firma interactiva táctil integrado, y permitir descargar el comprobante en formato limpio."
      },
      {
        name: "⚡ Dashboard de Indicadores de Accidentalidad (App HTML)",
        category: "Codigo",
        type: "html",
        prompt: "Desarrolla una aplicación interactiva de panel de control (Dashboard) en HTML para calcular indicadores de SST en {{nombre_empresa}}. Permite al usuario ingresar dinámicamente en cajas de texto el Número de trabajadores, Horas Hombre Trabajadas (HHT), número de accidentes en el mes, y días de incapacidad; y calculará en tiempo real y con gráficos interactivos CSS el Índice de Frecuencia (IF) y el Índice de Severidad (IS)."
      }
    ];

    let seededCount = 0;
    let skippedCount = 0;
    const seededList = [];

    for (const item of promptsToSeed) {
      // Avoid duplicate seeding
      const existingGroup = await PromptGroup.findOne({ name: item.name });
      if (existingGroup) {
        skippedCount++;
        continue;
      }

      // 1. Create PromptGroup
      const groupDoc = new PromptGroup({
        name: item.name,
        category: item.category,
        author: user._id,
        authorName: user.name,
        productionId: null,
        projectIds: project ? [project._id.toString()] : []
      });
      await groupDoc.save();

      // 2. Create Prompt
      const promptDoc = new Prompt({
        prompt: item.prompt,
        name: item.name,
        author: user._id,
        groupId: groupDoc._id,
        type: item.type
      });
      await promptDoc.save();

      // 3. Update PromptGroup productionId
      groupDoc.productionId = promptDoc._id;
      await groupDoc.save();

      // 4. Create AclEntry
      const aclDoc = new AclEntry({
        resourceType: 'promptGroup',
        resourceId: groupDoc._id,
        principalType: 'user',
        principalId: user._id,
        principalModel: 'User',
        permBits: 15, // VIEW | EDIT | DELETE | SHARE
        grantedBy: user._id
      });
      await aclDoc.save();

      // 5. Link in global project
      if (project) {
        await Project.findByIdAndUpdate(project._id, {
          $addToSet: { promptGroupIds: groupDoc._id }
        });
      }

      seededList.push(item.name);
      seededCount++;
    }

    return res.json({
      success: true,
      message: `¡Siembra de prompts completada con éxito!`,
      summary: `Se crearon ${seededCount} nuevos prompts. Se omitieron ${skippedCount} duplicados.`,
      seededCount,
      skippedCount,
      seededList
    });

  } catch (err) {
    logger.error('[SeedPrompts] Critical error:', err);
    return res.status(500).json({ error: 'Falla interna al sembrar prompts: ' + err.message });
  }
});

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
      'Consultor de Debido Proceso y Despidos',
      'Consultor de Protocolo de Acoso Sexual',
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
      'Estratega de Contenidos Corporativos',
      'Consultor de Gestión Ambiental',
      'Especialista en Minería Subterránea y Alto Riesgo'
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
      
      const isPsychologist = newName === 'Especialista en Riesgo Psicosocial' || newName === 'Psicólog@ Especialista SST' || agent.name === 'Especialista en Riesgo Psicosocial' || agent.name === 'Psicólog@ Especialista SST';
      const targetModel = isPsychologist ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';
      if (agent.model !== targetModel && agent.provider === 'google') {
        agent.model = targetModel;
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

module.exports = router;



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
      'Inspector de Puesto de Trabajo (IPT)',
      'Consultor Médico Ocupacional',
      'Especialista en Biomecánica Laboral',
      'Especialista en Riesgo Psicosocial',
      'Consultor de Bienestar y Salud Mental',
      'Consultor Nutricional Corporativo',
      'Gestor Clínico de Primeros Auxilios',
      'Gestor de Análisis de Trabajo Seguro (ATS)',
      'Gestor de Permisos de Trabajo (TSA)',
      'Gestor de Formación Continua',
      'Estratega de Contenidos Corporativos',
      'Consultor de Gestión Ambiental',
      'Especialista en Minería Subterránea y Alto Riesgo'
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
      
      const isPsychologist = newName === 'Especialista en Riesgo Psicosocial' || newName === 'Psicólog@ Especialista SST' || agent.name === 'Especialista en Riesgo Psicosocial' || agent.name === 'Psicólog@ Especialista SST';
      const targetModel = isPsychologist ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';
      if (agent.model !== targetModel && agent.provider === 'google') {
        agent.model = targetModel;
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
