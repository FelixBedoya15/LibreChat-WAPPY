const { BlogPost } = require('../../models/BlogPost');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');

const getBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ createdAt: -1 }).populate('author', 'name username').lean();
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error in getBlogPosts:', error);
        res.status(500).json({ message: 'Error retrieving blog posts' });
    }
};

const getBlogPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findById(id).populate('author', 'name username').lean();
        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }
        res.status(200).json(post);
    } catch (error) {
        console.error('Error in getBlogPostById:', error);
        res.status(500).json({ message: 'Error retrieving blog post' });
    }
};

const createBlogPost = async (req, res) => {
    try {
        const { title, content, thumbnail, tags, isPublished } = req.body;
        const userId = req.user._id || req.user.id;

        const newPost = new BlogPost({
            title,
            content: content || '',
            thumbnail,
            tags: tags || [],
            isPublished: isPublished || false,
            author: userId
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Error creating blog post' });
    }
};

const updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, thumbnail, tags, isPublished } = req.body;

        const post = await BlogPost.findByIdAndUpdate(
            id,
            { title, content, thumbnail, tags, isPublished },
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Error updating blog post:', error);
        res.status(500).json({ message: 'Error updating blog post' });
    }
};

const deleteBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        res.status(200).json({ message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog post:', error);
        res.status(500).json({ message: 'Error deleting blog post' });
    }
};

const generateBlogPost = async (req, res) => {
    try {
        const { prompt, modelName, type, sources } = req.body;

        let resolvedApiKey;
        try {
            const storedKey = await getUserKey({ userId: req.user.id, name: 'google' });
            try {
                const parsed = JSON.parse(storedKey);
                resolvedApiKey = parsed[AuthKeys.GOOGLE_API_KEY] || parsed.GOOGLE_API_KEY;
            } catch (pErr) {
                resolvedApiKey = storedKey;
            }
        } catch (e) {
            console.log('No user google key', e.message);
        }
        if (!resolvedApiKey) {
            resolvedApiKey = process.env.GOOGLE_KEY || process.env.GEMINI_API_KEY;
        }
        if (resolvedApiKey && typeof resolvedApiKey === 'string') {
            resolvedApiKey = resolvedApiKey.split(',')[0].trim();
        }
        if (!resolvedApiKey) {
            return res.status(400).json({ error: 'No se configuró API Key de Google.' });
        }

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3-flash-preview' });

        let systemPrompt = "";
        if (type === 'blog') {
            systemPrompt = `Actúa como un experto creador de contenido y blogger en temas de seguridad y salud en el trabajo.
Tu tarea es escribir un artículo de blog altamente atractivo y estructurado basado en la solicitud del usuario.
REGLA CRÍTICA Y ABSOLUTA: 
Tu respuesta DEBE SER ÚNICA Y EXCLUSIVAMENTE código HTML válido y puro. 
- NO uses formato Markdown (nada de asteriscos ni numerales). 
- Los títulos deben ser con etiquetas <h1>, <h2>. 
- Los párrafos con <p>. 
- Las listas con <ul> y <li>. 
- Las negritas con <strong>.
- NO envuelvas la respuesta en bloques de código (\`\`\`html).
Empieza directamente con <div> o <h1> y termina con el cierre correspondiente.`;
        }

        let fullPrompt = `${systemPrompt}\n\nTema / Solicitud del usuario: ${prompt}`;
        if (sources && sources.length > 0) {
            fullPrompt += `\n\nPor favor, ten en cuenta las siguientes referencias proporcionadas por el usuario:\n${sources.join('\n')}`;
        }

        const result = await model.generateContent(fullPrompt);
        let responseText = result.response.text();

        // Remove markdown wrappers if the model still adds them
        responseText = responseText.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim();

        // Convert common markdown elements to basic HTML manually if the model disobeyed
        if (responseText.includes('#') || responseText.includes('**') || /^[-*]\s/m.test(responseText)) {
            console.log("Markdown detectado en BlogController, forzando a HTML.");
            let htmlText = responseText;

            // Reemplazar headers
            htmlText = htmlText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            htmlText = htmlText.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            htmlText = htmlText.replace(/^# (.*$)/gim, '<h1>$1</h1>');

            // Reemplazar negritas y cursivas
            htmlText = htmlText.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
            htmlText = htmlText.replace(/\*(.*?)\*/gim, '<em>$1</em>');

            // Reemplazar saltos de línea dobles
            htmlText = htmlText.replace(/\n\n/g, '</p><p>');

            // Envolver todo en <p> de forma sencilla si no empezó con tag (muy rudimentario, pero evita que sea un bloque único)
            if (!htmlText.startsWith('<')) {
                htmlText = `<p>${htmlText}</p>`;
            }

            responseText = htmlText;
        }

        // Final sanity check, ensure newlines translate to <br> if it's still missing tags
        if (!responseText.includes('<p>') && !responseText.includes('<br>')) {
            responseText = responseText.replace(/\n/g, '<br>');
        }

        res.json({ data: responseText });

    } catch (error) {
        console.error('Error generating blog content:', error);
        res.status(500).json({ error: `Error al generar contenido: ${error.message || 'Asegúrese de detallar mejor su solicitud'}` });
    }
};

module.exports = {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateBlogPost
};
