const express = require('express');
const router = express.Router();
const Ticket = require('../../models/Ticket');
const { requireJwtAuth } = require('../middleware');
const { logger } = require('~/config');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { syncToRag } = require('../services/RagService');

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

        // AI Logic (similar to Tenshi/SGSST)
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
            resolvedApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }

        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No Google API Key configured' });
        }

        // Web Search Integration using SearXNG
        let webContext = '';
        try {
            const searxngUrl = process.env.SEARXNG_INSTANCE_URL || 'https://searxng.wappy-ia.com/search';
            // We search using the ticket description to find relevant regulations or solutions
            const searchQuery = `"${ticket.type}" ${ticket.description.substring(0, 100)} normatividad SST Colombia`;

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
                logger.debug(`[Tickets AI] Added ${topResults.length} web search results via SearXNG`);
            }
        } catch (searchError) {
            logger.warn(`[Tickets AI] SearXNG Web Search failed: ${searchError.message}`);
            // We don't throw an error here to allow the AI to still suggest a response without the internet context
        }

        const prompt = `Actúa como un experto en soporte al cliente y especialista en Seguridad y Salud en el Trabajo para la plataforma WAPPY IA.
Se ha recibido un ticket de tipo "${ticket.type}" con la siguiente descripción:
"${ticket.description}"

CONTEXTO ENCONTRADO EN INTERNET (SearXNG):
${webContext || 'No se encontró contexto adicional en internet.'}

Utilizando el contexto de internet (si aplica) y tu conocimiento de la plataforma, sugiere una respuesta profesional, amable y resolutiva para el usuario.
La respuesta debe estar en formato texto plano, sin el exceso de markdown.`;

        const result = await model.generateContent(prompt);
        const suggestion = result.response.text();

        res.json({ suggestion });
    } catch (error) {
        logger.error('[Tickets AI] Error suggesting response:', error);
        res.status(500).json({ error: 'Failed to suggest response' });
    }
});

module.exports = router;
