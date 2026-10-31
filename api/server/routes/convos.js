const multer = require('multer');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sleep } = require('@librechat/agents');
const { isEnabled } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { CacheKeys, EModelEndpoint, Constants } = require('librechat-data-provider');
const { Conversation, Message } = require('~/db/models');
const {
  createImportLimiters,
  createForkLimiters,
  configMiddleware,
} = require('~/server/middleware');
const { getConvosByCursor, deleteConvos, getConvo, saveConvo } = require('~/models/Conversation');
const { forkConversation, duplicateConversation } = require('~/server/utils/import/fork');
const { storage, importFileFilter } = require('~/server/routes/files/multer');
const { deleteAllSharedLinks, deleteConvoSharedLink } = require('~/models');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { importConversations } = require('~/server/utils/import');
const { deleteToolCalls } = require('~/models/ToolCall');
const getLogStores = require('~/cache/getLogStores');

const assistantClients = {
  [EModelEndpoint.azureAssistants]: require('~/server/services/Endpoints/azureAssistants'),
  [EModelEndpoint.assistants]: require('~/server/services/Endpoints/assistants'),
};

const router = express.Router();
router.use(requireJwtAuth);

router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 25;
  const cursor = req.query.cursor;
  const isArchived = isEnabled(req.query.isArchived);
  const search = req.query.search ? decodeURIComponent(req.query.search) : undefined;
  const order = req.query.order || 'desc';

  let tags;
  if (req.query.tags) {
    tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
  }

  try {
    const result = await getConvosByCursor(req.user.id, {
      cursor,
      limit,
      isArchived,
      tags,
      search,
      order,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching conversations', error);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

router.get('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const convo = await getConvo(req.user.id, conversationId);

  if (convo) {
    res.status(200).json(convo);
  } else {
    res.status(404).end();
  }
});

router.post('/gen_title', async (req, res) => {
  const { conversationId } = req.body;
  const titleCache = getLogStores(CacheKeys.GEN_TITLE);
  const key = `${req.user.id}-${conversationId}`;
  let title = await titleCache.get(key);

  if (!title) {
    // Retry every 1s for up to 20s
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      title = await titleCache.get(key);
      if (title) {
        break;
      }
    }
  }

  if (title) {
    await titleCache.delete(key);
    res.status(200).json({ title });
  } else {
    res.status(404).json({
      message: "Title not found or method not implemented for the conversation's endpoint",
    });
  }
});

router.delete('/', async (req, res) => {
  let filter = {};
  const { conversationId, source, thread_id, endpoint } = req.body.arg;

  // Prevent deletion of all conversations
  if (!conversationId && !source && !thread_id && !endpoint) {
    return res.status(400).json({
      error: 'no parameters provided',
    });
  }

  if (conversationId) {
    filter = { conversationId };
  } else if (source === 'button') {
    return res.status(200).send('No conversationId provided');
  }

  if (
    typeof endpoint !== 'undefined' &&
    Object.prototype.propertyIsEnumerable.call(assistantClients, endpoint)
  ) {
    /** @type {{ openai: OpenAI }} */
    const { openai } = await assistantClients[endpoint].initializeClient({ req, res });
    try {
      const response = await openai.beta.threads.delete(thread_id);
      logger.debug('Deleted OpenAI thread:', response);
    } catch (error) {
      logger.error('Error deleting OpenAI thread:', error);
    }
  }

  try {
    const dbResponse = await deleteConvos(req.user.id, filter);
    if (filter.conversationId) {
      await deleteToolCalls(req.user.id, filter.conversationId);
      await deleteConvoSharedLink(req.user.id, filter.conversationId);
    }
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error clearing conversations', error);
    res.status(500).send('Error clearing conversations');
  }
});

router.delete('/all', async (req, res) => {
  try {
    const dbResponse = await deleteConvos(req.user.id, {});
    await deleteToolCalls(req.user.id);
    await deleteAllSharedLinks(req.user.id);
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error clearing conversations', error);
    res.status(500).send('Error clearing conversations');
  }
});

router.post('/update', async (req, res) => {
  const update = req.body.arg;

  if (!update.conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  try {
    const dbResponse = await saveConvo(req, update, {
      context: `POST /api/convos/update ${update.conversationId}`,
    });
    res.status(201).json(dbResponse);
  } catch (error) {
    logger.error('Error updating conversation', error);
    res.status(500).send('Error updating conversation');
  }
});

const { importIpLimiter, importUserLimiter } = createImportLimiters();
const { forkIpLimiter, forkUserLimiter } = createForkLimiters();
const upload = multer({ storage: storage, fileFilter: importFileFilter });

/**
 * Imports a conversation from a JSON file and saves it to the database.
 * @route POST /import
 * @param {Express.Multer.File} req.file - The JSON file to import.
 * @returns {object} 201 - success response - application/json
 */
router.post(
  '/import',
  importIpLimiter,
  importUserLimiter,
  configMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      /* TODO: optimize to return imported conversations and add manually */
      await importConversations({ filepath: req.file.path, requestUserId: req.user.id });
      res.status(201).json({ message: 'Conversation(s) imported successfully' });
    } catch (error) {
      logger.error('Error processing file', error);
      res.status(500).send('Error processing file');
    }
  },
);

/**
 * POST /fork
 * This route handles forking a conversation based on the TForkConvoRequest and responds with TForkConvoResponse.
 * @route POST /fork
 * @param {express.Request<{}, TForkConvoResponse, TForkConvoRequest>} req - Express request object.
 * @param {express.Response<TForkConvoResponse>} res - Express response object.
 * @returns {Promise<void>} - The response after forking the conversation.
 */
router.post('/fork', forkIpLimiter, forkUserLimiter, async (req, res) => {
  try {
    /** @type {TForkConvoRequest} */
    const { conversationId, messageId, option, splitAtTarget, latestMessageId } = req.body;
    const result = await forkConversation({
      requestUserId: req.user.id,
      originalConvoId: conversationId,
      targetMessageId: messageId,
      latestMessageId,
      records: true,
      splitAtTarget,
      option,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error forking conversation:', error);
    res.status(500).send('Error forking conversation');
  }
});

router.post('/duplicate', async (req, res) => {
  const { conversationId, title } = req.body;

  try {
    const result = await duplicateConversation({
      userId: req.user.id,
      conversationId,
      title,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error duplicating conversation:', error);
    res.status(500).send('Error duplicating conversation');
  }
});

/**
 * POST /pin
 * Pins or unpins a conversation for the authenticated user without mutating updatedAt.
 */
router.post('/pin', async (req, res) => {
  const { conversationId, isPinned } = req.body || {};

  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  try {
    const updateOp = isPinned
      ? { $addToSet: { tags: 'pinned' } }
      : { $pull: { tags: 'pinned' } };

    const updated = await Conversation.findOneAndUpdate(
      { conversationId, user: req.user.id },
      updateOp,
      { new: true, timestamps: false },
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    return res.status(200).json({
      conversationId,
      isPinned: Boolean(isPinned),
      tags: Array.isArray(updated.tags) ? updated.tags : [],
    });
  } catch (error) {
    logger.error('[POST /api/convos/pin] Error pinning conversation:', error);
    return res.status(500).json({ error: 'Error updating pin status' });
  }
});

/**
 * Helper to extract a clean text snippet from a LibreChat Message document.
 */
function extractMessageSnippet(msg, maxLen = 400) {
  if (!msg) {
    return '';
  }
  let raw = typeof msg.text === 'string' ? msg.text : '';
  if (!raw.trim() && Array.isArray(msg.content)) {
    raw = msg.content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join(' ');
  }
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLen)}…`;
}

/**
 * Builds a deterministic Markdown compendium of inactive conversations.
 */
function buildDeterministicCompendiumMarkdown(convoSummaries, days, aiSynthesisText = '') {
  const dateStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines = [
    `# 📚 Compendio Ejecutivo de Conversaciones (+${days} días)`,
    `> **Fecha de consolidación:** ${dateStr} · **Conversaciones unificadas:** ${convoSummaries.length}`,
    '',
  ];

  if (aiSynthesisText && aiSynthesisText.trim()) {
    lines.push('## 🧠 Síntesis Ejecutiva y Decisiones Clave', '', aiSynthesisText.trim(), '');
  } else {
    lines.push(
      '## 🧠 Resumen Ejecutivo por Conversación',
      '',
      'A continuación se presenta la síntesis estructurada de los hilos inactivos consolidados, agrupando las consultas principales y las respuestas o acuerdos registrados en cada sesión:',
      '',
    );

    convoSummaries.forEach((item, idx) => {
      lines.push(
        `### ${idx + 1}. ${item.title}`,
        `- **Última actividad:** ${item.updatedDate} · **Canal/Modelo:** \`${item.model || item.endpoint || 'WAPPY IA'}\` · **Mensajes:** ${item.messageCount}`,
      );
      if (item.firstUserText) {
        lines.push(`- **Consulta inicial / Tema:** ${item.firstUserText}`);
      }
      if (item.lastAssistantText) {
        lines.push(`- **Síntesis / Última respuesta:** ${item.lastAssistantText}`);
      } else if (item.lastUserText && item.lastUserText !== item.firstUserText) {
        lines.push(`- **Última intervención:** ${item.lastUserText}`);
      }
      lines.push('');
    });
  }

  lines.push(
    '---',
    '## 🗂️ Índice Histórico de Hilos Consolidados (Archivados)',
    '',
    '| # | Título de la Conversación | Última Actividad | Mensajes | ID de Referencia |',
    '| :--- | :--- | :--- | :---: | :--- |',
  );

  convoSummaries.forEach((item, idx) => {
    const safeTitle = (item.title || 'Sin título').replace(/\|/g, '·');
    lines.push(
      `| ${idx + 1} | **${safeTitle}** | ${item.updatedDate} | ${item.messageCount} | \`${item.conversationId.slice(0, 8)}…\` |`,
    );
  });

  lines.push(
    '',
    '> 💡 *Las conversaciones originales han sido archivadas automáticamente para mantener limpio tu panel principal. Puedes continuar trabajando sobre cualquiera de estos temas directamente en este hilo maestro (anclado en tu barra lateral).*',
  );

  return lines.join('\n');
}

/**
 * POST /consolidate-inactive
 * Consolidates and/or archives inactive conversations (+N days) excluding pinned and internal SGSST tools.
 */
router.post('/consolidate-inactive', async (req, res) => {
  const { days = 3, mode = 'merge_and_archive', conversationIds } = req.body || {};
  const numericDays = Math.max(1, Number(days) || 3);

  const excludedTags = [
    'pinned',
    'sgsst-diagnostico',
    'sgsst-politica',
    'sgsst-auditoria',
    'sgsst-matriz-legal',
    'report',
    'sgsst-estadisticas-atel',
    'sgsst-live-analysis',
    'sgsst-matriz-ipevar',
    'sgsst-matriz-peligros',
    'sgsst-owas',
    'sgsst-reglamento-interno',
    'sgsst-reglamento-higiene',
    'sgsst-permiso-alturas',
    'sgsst-condiciones-salud',
    'sgsst-investigacion-atel',
    'sgsst-perfiles-cargo',
    'sgsst-perfil-sociodemografico',
    'sgsst-alta-direccion',
    'sgsst-responsable',
    'sgsst-objetivos',
    'sgsst-reporte-actos',
    'sgsst-ats',
    'sgsst-automation',
    'sgsst-mood',
    'sgsst-psicosocial',
    'sgsst-termometro',
  ];

  const filter = {
    user: req.user.id,
    $and: [
      { $or: [{ isArchived: false }, { isArchived: { $exists: false } }] },
      { $or: [{ expiredAt: null }, { expiredAt: { $exists: false } }] },
      {
        $or: [
          { tags: { $exists: false } },
          {
            $and: [
              { tags: { $nin: excludedTags } },
              { tags: { $not: /^sgsst-/ } },
            ],
          },
        ],
      },
      { endpoint: { $not: /^sgsst-/ } },
    ],
  };

  if (Array.isArray(conversationIds) && conversationIds.length > 0) {
    filter.conversationId = { $in: conversationIds.filter(Boolean) };
  } else {
    const cutoffDate = new Date(Date.now() - numericDays * 24 * 60 * 60 * 1000);
    filter.updatedAt = { $lt: cutoffDate };
  }

  try {
    const convos = await Conversation.find(filter)
      .select('conversationId endpoint title createdAt updatedAt user model agent_id assistant_id spec iconURL tags')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    if (!convos.length) {
      return res.status(200).json({
        count: 0,
        archivedIds: [],
        masterConversation: null,
      });
    }

    const ids = convos.map((c) => c.conversationId);

    if (mode === 'archive_only') {
      await Conversation.updateMany(
        { user: req.user.id, conversationId: { $in: ids } },
        { $set: { isArchived: true } },
        { timestamps: false },
      );

      return res.status(200).json({
        count: convos.length,
        archivedIds: ids,
        masterConversation: null,
      });
    }

    // Fetch messages for all target conversations in a single query
    const allMessages = await Message.find({
      user: req.user.id,
      conversationId: { $in: ids },
    })
      .select('conversationId messageId sender text content isCreatedByUser createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const messagesByConvo = new Map();
    for (const msg of allMessages) {
      if (!messagesByConvo.has(msg.conversationId)) {
        messagesByConvo.set(msg.conversationId, []);
      }
      messagesByConvo.get(msg.conversationId).push(msg);
    }

    const convoSummaries = convos.map((c) => {
      const msgs = messagesByConvo.get(c.conversationId) || [];
      const userMsgs = msgs.filter((m) => m.isCreatedByUser);
      const assistantMsgs = msgs.filter((m) => !m.isCreatedByUser);

      const firstUserText = extractMessageSnippet(userMsgs[0], 400);
      const lastUserText = extractMessageSnippet(userMsgs[userMsgs.length - 1], 400);
      const lastAssistantText = extractMessageSnippet(assistantMsgs[assistantMsgs.length - 1], 400);
      const updatedDate = c.updatedAt
        ? new Date(c.updatedAt).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Sin fecha';

      return {
        conversationId: c.conversationId,
        title: c.title?.trim() || 'Conversación sin título',
        endpoint: c.endpoint,
        model: c.model,
        updatedDate,
        messageCount: msgs.length,
        firstUserText,
        lastUserText,
        lastAssistantText,
      };
    });

    // Optional AI synthesis using GOOGLE_TITLE_MODEL || 'gemini-3.5-flash-lite'
    let aiSynthesisText = '';
    const synthesisModel = process.env.GOOGLE_TITLE_MODEL || 'gemini-3.5-flash-lite';
    const apiKey = [process.env.GEMINI_API_KEY, process.env.GOOGLE_KEY].find(
      (k) => typeof k === 'string' && k.trim() && k.trim() !== 'user_provided' && !k.startsWith('your_'),
    );

    if (apiKey) {
      try {
        const digestInput = convoSummaries
          .slice(0, 40)
          .map(
            (s, i) =>
              `[${i + 1}] Título: ${s.title} (${s.updatedDate})\n- Consulta: ${s.firstUserText || 'N/A'}\n- Conclusión/Respuesta: ${s.lastAssistantText || s.lastUserText || 'N/A'}`,
          )
          .join('\n\n');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(synthesisModel)}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Eres el asistente ejecutivo de WAPPY IA. Sintetiza en español y en formato Markdown limpio las siguientes ${convoSummaries.length} conversaciones inactivas del usuario.\n\nEstructura tu respuesta en:\n1. **Temáticas Principales Agrupadas** (con viñetas claras)\n2. **Hallazgos, Acuerdos y Decisiones Clave**\n3. **Pendientes o Próximos Pasos Sugeridos**\n\nConversaciones:\n${digestInput}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
              },
            }),
          },
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts
            ?.map((p) => p?.text || '')
            .join('\n')
            .trim();
          if (candidateText) {
            aiSynthesisText = candidateText;
          }
        }
      } catch (aiErr) {
        logger.debug('[POST /api/convos/consolidate-inactive] Fallback to deterministic summary:', aiErr?.message);
      }
    }

    const compendiumMarkdown = buildDeterministicCompendiumMarkdown(
      convoSummaries,
      numericDays,
      aiSynthesisText,
    );

    const masterConvoId = uuidv4();
    const userMsgId = uuidv4();
    const assistantMsgId = uuidv4();
    const primaryEndpoint = convos[0]?.endpoint || EModelEndpoint.google || 'google';
    const primaryModel = convos[0]?.model || synthesisModel;
    const masterTitle = `📚 Compendio (${convos.length} chats +${numericDays}d · ${new Date().toLocaleDateString('es-CO')})`;

    const userMsgDoc = await Message.create({
      user: req.user.id,
      conversationId: masterConvoId,
      messageId: userMsgId,
      parentMessageId: Constants.NO_PARENT,
      isCreatedByUser: true,
      sender: 'User',
      endpoint: primaryEndpoint,
      model: primaryModel,
      text: `Unir y organizar mis ${convos.length} conversaciones inactivas de más de ${numericDays} días en un solo compendio estructurado.`,
      unfinished: false,
      error: false,
    });

    const assistantMsgDoc = await Message.create({
      user: req.user.id,
      conversationId: masterConvoId,
      messageId: assistantMsgId,
      parentMessageId: userMsgId,
      isCreatedByUser: false,
      sender: 'WAPPY IA',
      endpoint: primaryEndpoint,
      model: primaryModel,
      text: compendiumMarkdown,
      unfinished: false,
      error: false,
    });

    const newConvoDoc = await Conversation.create({
      user: req.user.id,
      conversationId: masterConvoId,
      endpoint: primaryEndpoint,
      model: primaryModel,
      title: masterTitle,
      tags: ['pinned', 'compendio'],
      isArchived: false,
      messages: [userMsgDoc._id, assistantMsgDoc._id],
    });

    await Conversation.updateMany(
      { user: req.user.id, conversationId: { $in: ids } },
      { $set: { isArchived: true } },
      { timestamps: false },
    );

    return res.status(200).json({
      count: convos.length,
      archivedIds: ids,
      masterConversation: newConvoDoc.toObject(),
    });
  } catch (error) {
    logger.error('[POST /api/convos/consolidate-inactive] Error consolidating conversations:', error);
    return res.status(500).json({ error: 'Error consolidating inactive conversations' });
  }
});

module.exports = router;
