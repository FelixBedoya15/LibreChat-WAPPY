'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('~/server/middleware');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS } = require('./sgsstGemini');
const { logger } = require('~/config');

// Helper to get a session
async function getSession(req, res) {
  const session = await GTC45WorkspaceSession.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return null;
  }
  return session;
}

// GET all sessions
router.get('/sessions', requireJwtAuth, async (req, res) => {
  try {
    const sessions = await GTC45WorkspaceSession.find({ user: req.user.id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    logger.error('[GTC45Workspace] Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET single session
router.get('/session/:id', requireJwtAuth, async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;
    res.json(session);
  } catch (error) {
    logger.error('[GTC45Workspace] Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// CREATE session
router.post('/session', requireJwtAuth, async (req, res) => {
  try {
    const newSession = new GTC45WorkspaceSession({
      user: req.user.id,
      title: req.body.title || 'Nueva Matriz GTC-45',
      messages: [],
      matrixRows: [],
    });
    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    logger.error('[GTC45Workspace] Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// DELETE session
router.delete('/session/:id', requireJwtAuth, async (req, res) => {
  try {
    const session = await GTC45WorkspaceSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('[GTC45Workspace] Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// UPDATE matrix manually
router.put('/session/:id/matrix', requireJwtAuth, async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;
    
    session.matrixRows = req.body.matrixRows;
    await session.save();
    res.json(session);
  } catch (error) {
    logger.error('[GTC45Workspace] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update matrix' });
  }
});

// CHAT with AI
router.post('/chat/:id', requireJwtAuth, async (req, res) => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Append user message
    session.messages.push({ role: 'user', text: userMessage });

    // Build History Prompt
    const historyText = session.messages.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n');

    // Build Current Matrix Context
    const matrixContext = session.matrixRows.length > 0 
      ? JSON.stringify(session.matrixRows, null, 2) 
      : '[] (La matriz está vacía actualmente)';

    const systemPrompt = `Eres un Ingeniero Experto y Consultor en Seguridad y Salud en el Trabajo, especializado en aplicar la metodología GTC-45 (Guía Técnica Colombiana 45) para identificación de peligros y valoración de riesgos.

Estás interactuando con un usuario a través de una plataforma que tiene un Chat a la izquierda, y una Matriz Excel (Tabla GTC-45) a la derecha.

TU OBJETIVO PRINCIPAL:
1. Guiar al usuario paso a paso para identificar peligros asociados a los cargos, tareas y procesos que te mendione.
2. Hacerle preguntas lógicas (¿Cuánto tiempo expuesto?, ¿Hay ventilación?, etc).
3. Cuando consideres que tienes información suficiente sobre un peligro, DEBES actualizar la matriz.

ESTADO ACTUAL DE LA MATRIZ (JSON):
${matrixContext}

CÓMO ACTUALIZAR LA MATRIZ:
Si decides que se debe agregar un peligro nuevo o actualizar las filas de la matriz con base en la conversación, debes incluir AL FINAL DE TU RESPUESTA un bloque de código JSON oculto con el formato exacto:
\`\`\`json
{
  "action": "update_matrix",
  "rows": [
    {
      "proceso": "Producción",
      "zona": "Taller",
      "tareas": "Corte de madera",
      "rutinaria": "Si",
      "peligro_descripcion": "Ruido continuo por sierra circular",
      "peligro_clasificacion": "Físico",
      "efectos": "Hipoacusia neurosensorial",
      "control_fuente": "Ninguno",
      "control_medio": "Ninguno",
      "control_individuo": "Protectores auditivos de inserción",
      "nd": 2,
      "ne": 3,
      "np": 6,
      "nc": 25,
      "nrv": 150,
      "aceptabilidad": "Aceptable con Control Específico",
      "medidas_intervencion": "Mantenimiento preventivo a la sierra, Encapsulamiento acústico"
    }
  ]
}
\`\`\`
IMPORTANTE SOBRE MATEMÁTICAS GTC-45:
ND = Nivel de Deficiencia (0, 2, 6, 10).
NE = Nivel de Exposición (1, 2, 3, 4).
NP = Nivel de Probabilidad (Multiplicación ND * NE).
NC = Nivel de Consecuencia (10, 25, 60, 100).
NR = Nivel de Riesgo (Multiplicación NP * NC). (en la tabla se llama nrv)
Aceptabilidad se define según GTC-45:
- NR >= 4000 a 600: Riesgo I (No Aceptable)
- NR 500 a 150: Riesgo II (No Aceptable o Aceptable con control)
- NR 120 a 40: Riesgo III (Aceptable)
- NR 20: Riesgo IV (Aceptable)

REGLAS DE INTERACCIÓN:
- Responde siempre con tono formal pero empático.
- Dialoga con el usuario sobre lo que vas a insertar *antes* o *después* de insertar el JSON. El bloque JSON será parseado por el sistema y la tabla mágicamente se actualizará para el usuario.
- Siempre que el usuario diga "Añade este cargo: Secretaria", evalúa los riesgos comunes de oficina y genera el bloque JSON para inyectar filas de riesgos biomecánicos, visuales, etc.
- Puedes inyectar múltiples "rows" en el array en un solo mensaje.

-------------
HISTORIAL RECIENTE DE LA CONVERSACIÓN:
${historyText}

TU RESPUESTA AL USUARIO (Con JSON al final si requiere actualización):`;

    logger.info(`[GTC45Workspace] Chat request for user ${req.user.id}, Session: ${session._id}`);

    const result = await generateWithKeyRotation(SGSST_FALLBACK_MODELS[0], req.user.id, systemPrompt);
    let aiResponse = result.response.text().trim();

    // Check if AI included a JSON block for updating matrix
    const jsonMatch = aiResponse.match(/\`\`\`json\s*(\{[\s\S]*?\})\s*\`\`\`/);
    let parsedAction = null;
    let textForUser = aiResponse;

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.action === 'update_matrix' && Array.isArray(jsonData.rows)) {
          // Merge or append rows. For simplicity, we append them here or replace, 
          // but replacing everything is risky if history is large. 
          // Let's just append new rows for now if they are distinct, or if the agent just rewrites all, we replace.
          // Usually, it's better to instruct the Agent to supply the FULL array or just APPends. The agent prompt above says "actualizar las filas". We will just APPEND them for simplicity in this MVP, or replace them. Let's append them to existing rows.
          session.matrixRows = [...session.matrixRows, ...jsonData.rows];
          parsedAction = 'matrix_updated';
        }
      } catch (e) {
        logger.warn('[GTC45Workspace] Failed to parse JSON block from AI', e);
      }
      
      // OPTIONAL: Remove the JSON block from the text shown to user so it looks clean
      textForUser = aiResponse.replace(jsonMatch[0], '').trim();
    }

    // Append AI response to messages
    session.messages.push({ role: 'assistant', text: textForUser });
    await session.save();

    res.json({
      message: textForUser,
      matrixRows: session.matrixRows,
      action: parsedAction
    });

  } catch (error) {
    logger.error('[GTC45Workspace] Error generating chat response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

module.exports = router;
