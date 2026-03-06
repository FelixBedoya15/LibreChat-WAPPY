const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireJwtAuth } = require('../middleware');
const TenshiConfig = require('../../models/TenshiConfig');
const { BlogPost } = require('../../models/BlogPost');
const { Course } = require('../../models/Course');
const axios = require('axios');

router.get('/config', async (req, res) => {
    try {
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = await TenshiConfig.create({});
        }
        res.json(config);
    } catch (error) {
        console.error('Error fetching Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/config', requireJwtAuth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        let config = await TenshiConfig.findOne();
        if (!config) {
            config = new TenshiConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.json(config);
    } catch (error) {
        console.error('Error saving Tenshi config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A simple chat endpoint for Tenshi
router.post('/chat', requireJwtAuth, async (req, res) => {
    try {
        const { messages } = req.body;
        const config = await TenshiConfig.findOne();

        if (!config || !config.isActive) {
            return res.status(403).json({ error: 'Tenshi is not active.' });
        }

        // Fetch dynamic knowledge (latest blogs)
        let latestBlogs = [];
        try {
            latestBlogs = await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5);
        } catch (e) { }

        const blogStr = latestBlogs.map(b => `- BLOG: ${b.title}`).join('\n');

        // Fetch dynamic knowledge (latest courses)
        let latestCourses = [];
        try {
            latestCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).limit(3);
        } catch (e) {
            console.error('Error fetching courses for Tenshi:', e);
        }

        const courseStr = latestCourses.map(c => `- CURSO: ${c.title}`).join('\n');

        // Fetch the platform manual
        let manualContent = '';
        try {
            const fs = require('fs');
            const path = require('path');
            const manualPath = path.resolve(__dirname, '../manual_wappy.md');
            if (fs.existsSync(manualPath)) {
                manualContent = fs.readFileSync(manualPath, 'utf8');
            }
        } catch (e) { }

        const systemMessage = `${config.systemPrompt}

MANUAL DE FUNCIONAMIENTO DE WAPPY IA:
${manualContent || 'WAPPY IA gestiona SG-SST (Diagnóstico, Matriz Peligros GTC45, ATEL, Política, Objetivos, Auditoría, Perfil Sociodemográfico con QR).'}

ÚLTIMAS PUBLICACIONES DEL BLOG:
${blogStr || 'No hay blogs recientes.'}

CURSOS DE FORMACIÓN DISPONIBLES:
${courseStr || 'No hay cursos recientes.'}

CONOCIMIENTO EXTRA DEL ADMINISTRADOR:
${config.extraKnowledge}

Instrucciones: Eres Tenshi, la guía oficial. Si el usuario pregunta cómo realizar algo, responde basándote en el MANUAL DE FUNCIONAMIENTO. Sé amable, conciso y muy profesional.`;

        // format messages for the LLM
        const formattedMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ];

        // Route the request based on provider
        let responseText = '';

        if (config.provider === 'google') {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const apiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

            if (!apiKey) {
                throw new Error('No Google API Key found in environment variables (GOOGLE_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY)');
            }

            const genAI = new GoogleGenerativeAI(apiKey);

            // Format for gemini (systemInstruction)
            // Use config.model, but fallback to 1.5-flash which is most stable
            const modelName = config.model || 'gemini-1.5-flash';
            const geminiModel = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemMessage
            });

            // Gemini history MUST start with 'user' role. 
            // We filter messages to ensure it starts with user and alternates correctly.
            const rawHistory = messages.slice(0, -1);
            const history = [];

            let firstUserFound = false;
            for (const m of rawHistory) {
                if (!firstUserFound && m.role !== 'user') continue;
                firstUserFound = true;
                history.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                });
            }

            // Ensure we don't end with a 'model' role if it's the last in history (Gemini is picky)
            // though usually history is [user, model, user, model] and current message is user.

            const chat = geminiModel.startChat({ history });

            try {
                const result = await chat.sendMessage(messages[messages.length - 1].content);
                responseText = result.response.text();
            } catch (geminiError) {
                console.error('Gemini SDK Error:', geminiError);
                throw new Error(`Google AI Error: ${geminiError.message || 'Unknown Gemini Error'}`);
            }

        } else if (config.provider === 'groq') {
            const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: config.model || 'llama-3.3-70b-versatile',
                messages: formattedMessages
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
            });
            responseText = groqRes.data.choices[0].message.content;

        } else if (config.provider === 'openai' || config.provider === 'ollama') {
            // For generic OpenAI compatible endpoints (like Wappy local Ollama)
            const baseURL = config.provider === 'ollama' ? 'http://localhost:11434/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
            const apiKey = config.provider === 'ollama' ? 'ollama' : process.env.OPENAI_API_KEY;

            const options = {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
            };

            const oaiRes = await axios.post(baseURL, {
                model: config.model || 'gpt-4o',
                messages: formattedMessages
            }, options);
            responseText = oaiRes.data.choices[0].message.content;
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error('CRITICAL Error in Tenshi chat route:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ error: 'Error generating Tenshi response', details: error.message });
    }
});

module.exports = router;
