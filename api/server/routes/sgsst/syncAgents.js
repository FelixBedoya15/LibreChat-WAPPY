'use strict';

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireJwtAuth } = require('~/server/middleware');
const { Agent } = require('~/db/models');
const { logger } = require('~/config');

// Exact mapping between local markdown filenames (without .md) and database Agent names.
const AGENT_FILE_MAP = {
  'abogado_laboral': 'Abogad@ Laboral',
  'abogado_rit': 'Abogad@ RIT',
  'agente_sst': 'Agente SST',
  'asistente_ats': 'Asistente ATS',
  'asistente_de_aci': 'Asistente de ACI',
  'asistente_de_salud_mental': 'Asistente de Salud Mental',
  'asistente_en_capacitaciones': 'Asistente en Capacitaciones ',
  'asistente_en_nutricion': 'Asistente en Nutrición',
  'asistente_en_primeros_auxilios': 'Asistente en Primeros Auxilios',
  'asistente_inv_at': 'Asistente Inv AT',
  'asistente_inv_el': 'Asistente Inv EL',
  'asistente_metodo_rosa': 'Asistente Metodo ROSA',
  'asistente_permiso_tsa': 'Asistente Permiso TSA',
  'auditor_sg_sst': 'Auditor SG-SST',
  'coordinador_ipevar': 'Expert@ IPEVAR GTC-45',
  'experto_en_emergencias': 'Expert@ en Emergencias ',
  'experto_en_riesgo_biologico': 'Expert@ en Riesgo Biologico',
  'experto_en_riesgo_electrico': 'Expert@ en Riesgo Electrico',
  'experto_en_riesgo_quimico': 'Expert@ en Riesgo Quimico',
  'experto_en_riesgo_vial': 'Expert@ en Riesgo Vial ',
  'experto_en_tareas_de_alto_riesgo': 'Expert@ en Tareas de Alto Riesgo',
  'fisioterapeuta_laboral': 'Fisioterapeuta Laboral',
  'medico_laboral': 'Medic@ Laboral',
  'profesional_sst': 'Profesional SST',
  'psicologo_especialista_sst': 'Psicólog@ Especialista SST'
};

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
        
        // Find corresponding agent in MongoDB
        const agent = await Agent.findOne({ name: dbName });
        if (!agent) {
          logger.warn(`[SyncAgents] Agent "${dbName}" not found in database.`);
          results.push({
            file: `${fileBasename}.md`,
            agentName: dbName,
            status: 'WARNING',
            message: 'El agente no existe en la base de datos (MongoDB).'
          });
          failCount++;
          continue;
        }

        // Check if there is actual difference in instructions to avoid unnecessary saves
        if (agent.instructions === mdContent) {
          results.push({
            file: `${fileBasename}.md`,
            agentName: dbName,
            status: 'NO_CHANGE',
            message: 'Las instrucciones ya coinciden exactamente.'
          });
          continue;
        }

        // Update the instructions of the agent
        await Agent.findOneAndUpdate(
          { id: agent.id },
          { $set: { instructions: mdContent } }
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

        // ── Step 2: Sync cleaned content to MongoDB ───────────────────────────
        const agent = await Agent.findOne({ name: dbName });
        if (!agent) {
          logger.warn(`[CleanupSync] Agent "${dbName}" not found in MongoDB.`);
          failCount++;
          results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'WARNING', message: 'Agente no encontrado en MongoDB.' });
          continue;
        }

        if (agent.instructions === mdContent) {
          results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'NO_CHANGE', message: 'Las instrucciones ya coinciden.' });
          continue;
        }

        await Agent.findOneAndUpdate({ _id: agent._id }, { $set: { instructions: mdContent } });
        syncedCount++;
        logger.info(`[CleanupSync] Synced "${dbName}" to MongoDB.`);
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'SUCCESS', message: 'Limpiado y sincronizado exitosamente.' });

      } catch (innerErr) {
        logger.error(`[CleanupSync] Error processing "${fileBasename}":`, innerErr);
        failCount++;
        results.push({ file: `${fileBasename}.md`, agentName: dbName, status: 'ERROR', message: `Error: ${innerErr.message}` });
      }
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

module.exports = router;


