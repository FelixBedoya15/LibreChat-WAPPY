const express = require('express');
const router = express.Router();
const Ticket = require('../../models/Ticket');
const { AuthKeys } = require('librechat-data-provider');
const { requireJwtAuth } = require('../middleware');
const { logger } = require('~/config');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { syncToRag } = require('../services/RagService');
const { getUserKey } = require('~/server/services/UserService');
const TenshiConfig = require('../../models/TenshiConfig');
const { generateShortLivedToken } = require('@librechat/api');

// User: Create a ticket
router.post('/', requireJwtAuth, async (req, res) => {
    try {
        const { name, email, phone, type, description } = req.body;
        const ticket = new Ticket({
            user: req.user.id,
            name,
            email,
            phone,
            type,
            description,
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        logger.error('[Tickets] Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// User: Get their tickets
router.get('/my', requireJwtAuth, async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        logger.error('[Tickets] Error fetching user tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Admin: Get all tickets
router.get('/all', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const tickets = await Ticket.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        logger.error('[Tickets] Error fetching all tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Admin: Respond to a ticket
router.post('/:id/respond', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { response, status } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        ticket.response = response;
        ticket.status = status || 'resolved';
        ticket.adminResponseBy = req.user.id;
        await ticket.save();

        // Dynamic Knowledge: Sync with RAG system if resolved
        if (ticket.status === 'resolved') {
            syncToRag({
                req,
                type: 'ticket',
                id: ticket._id,
                content: `PQRS [${ticket.type}]\nUSUARIO: ${ticket.name}\nDESCRIPCIÓN: ${ticket.description}\nSOLUCIÓN: ${ticket.response}`,
                title: `PQRS Resuelto: ${ticket.author?.name || ticket.name}`
            });
        }

        res.json(ticket);
    } catch (error) {
        logger.error('[Tickets] Error responding to ticket:', error);
        res.status(500).json({ error: 'Failed to respond to ticket' });
    }
});

// Admin: Delete a ticket (Optional but good for cleanup)
router.delete('/:id', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await Ticket.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ticket deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting ticket' });
    }
});

// Admin: AI Suggest Response
router.post('/:id/ai-suggest', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const { modelName } = req.body;

        // AI Logic (Retrieving API Key)
        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (e) {
                resolvedApiKey = storedKey;
            }
        } catch (e) { }

        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        }

        // Cleanup key if it has commas
        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }

        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se ha configurado la clave API de Google.' });
        }

        // 1. DYNAMIC KNOWLEDGE - Last 5 resolved tickets
        let recentTicketsContext = '';
        try {
            const lastResolved = await Ticket.find({ status: 'resolved' })
                .sort({ updatedAt: -1 })
                .limit(5);

            if (lastResolved.length > 0) {
                recentTicketsContext = lastResolved.map(t => `- PQRS RESUELTO [${t.type}]: ${t.description.substring(0, 100)}... -> RESPUESTA: ${t.response.substring(0, 150)}...`).join('\n');
            }
        } catch (e) {
            logger.warn('[Tickets AI] Error fetching recent tickets:', e.message);
        }

        // 2. WEB SEARCH - SearXNG Integration
        let webContext = '';
        try {
            const searxngUrl = process.env.SEARXNG_INSTANCE_URL || 'https://searxng.wappy-ia.com/search';
            const searchQuery = `"${ticket.type}" ${ticket.description.substring(0, 80)} normatividad SST Colombia`;

            const searchResponse = await axios.get(searxngUrl, {
                params: {
                    q: searchQuery,
                    format: 'json',
                    language: 'es'
                },
                timeout: 5000
            });

            if (searchResponse.data && searchResponse.data.results && searchResponse.data.results.length > 0) {
                const topResults = searchResponse.data.results.slice(0, 3);
                webContext = topResults.map(r => `- ${r.title}: ${r.content}`).join('\n');
                logger.debug(`[Tickets AI] Added web search results`);
            }
        } catch (searchError) {
            logger.warn(`[Tickets AI] SearXNG Web Search failed: ${searchError.message}`);
        }

        // 3. RAG KNOWLEDGE - App Knowledge Base
        let ragContext = '';
        if (process.env.RAG_API_URL) {
            try {
                const jwtToken = generateShortLivedToken(req.user.id);
                const ragRes = await axios.post(`${process.env.RAG_API_URL}/query`, {
                    query: ticket.description,
                    entity_id: 'tenshi_knowledge_base',
                    k: 3
                }, {
                    headers: { Authorization: `Bearer ${jwtToken}`, 'Content-Type': 'application/json' },
                    timeout: 5000
                });

                if (ragRes.data && ragRes.data.length > 0) {
                    ragContext = ragRes.data.map(m => `[CONOCIMIENTO RAG] ${(m[0]?.page_content || m.text || '').substring(0, 300)}`).join('\n');
                }
            } catch (e) {
                logger.debug('[Tickets AI] RAG query failed or empty');
            }
        }

        const tenshiConfig = await TenshiConfig.findOne();
        const systemPrompt = tenshiConfig ? tenshiConfig.systemPrompt : 'Actúa como Tenshi, el asistente IA experto de WAPPY IA.';

        const prompt = `${systemPrompt}

Eres un experto en soporte al cliente para la plataforma WAPPY IA (gestión de SG-SST).
Se ha recibido un ticket de tipo "${ticket.type}" de el usuario "${ticket.name}".

DESCRIPCIÓN DE LA SOLICITUD:
"${ticket.description}"

CONOCIMIENTO DINÁMICO (ÚLTIMOS TICKETS RESUELTOS):
${recentTicketsContext || 'No hay tickets resueltos similares recientemente.'}

CONOCIMIENTO BASE (RAG):
${ragContext || 'No se encontró información específica en los documentos.'}

CONTEXTO ENCONTRADO EN INTERNET (SearXNG):
${webContext || 'No se encontró contexto adicional en internet.'}

INSTRUCCIONES:
1. Basándote en el contexto anterior (tickets previos, RAG e internet), sugiere una respuesta profesional, amable y resolutiva.
2. Si el caso es normativo (SST), cita la normativa correspondiente si aparece en el contexto.
3. Responde directamente con el cuerpo del mensaje.
4. Mantén un tono empático.
5. NO uses exceso de markdown, mantén el texto limpio.`;

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        const result = await model.generateContent(prompt);
        const suggestion = result.response.text();

        res.json({ suggestion });
    } catch (error) {
        logger.error('[Tickets AI] Error suggesting response:', error);
        res.status(500).json({ error: 'Failed to suggest response' });
    }
});

module.exports = router;
