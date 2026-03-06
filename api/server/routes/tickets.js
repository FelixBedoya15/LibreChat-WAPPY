const express = require('express');
const router = express.Router();
const Ticket = require('../../models/Ticket');
const { requireJwtAuth } = require('../middleware');
const { logger } = require('~/config');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');

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

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Actúa como un experto en soporte al cliente para la plataforma WAPPY IA.
Se ha recibido un ticket de tipo "${ticket.type}" con la siguiente descripción:
"${ticket.description}"

Sugiere una respuesta profesional, amable y resolutiva para el usuario.
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
