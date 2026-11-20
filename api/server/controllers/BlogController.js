const { BlogPost } = require('../../models/BlogPost');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { syncToRag } = require('../services/RagService');
const { ADMIN_EMAILS } = require('../middleware/roles/admin');
const {
    WAPPY_BLOG_EDITORIAL_PROMPT,
    formatBlogEditorialHtml,
    extractBlogSummary,
    getWappyEditorialStarterTemplate,
} = require('../utils/blogEditorialFormatter');

const DEFAULT_BLOG_AI_MODEL = 'gemini-3.8-flash';
const BLOG_AI_TIMEOUT_MS = 90000;

const isUserAdmin = (user) => {
    if (!user) return false;
    return user.role === 'ADMIN';
};


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
        const { title, description, content, thumbnail, tags, attachments, isPublished, isFeatured } = req.body;
        const userId = req.user._id || req.user.id;
        const safeTags = Array.isArray(tags) ? tags : [];
        const formattedContent = content
            ? formatBlogEditorialHtml(content, { title: title || '', tags: safeTags })
            : '';
        const resolvedDescription =
            typeof description === 'string' && description.trim()
                ? description.trim()
                : extractBlogSummary(formattedContent);

        const postData = {
            title,
            description: resolvedDescription,
            content: formattedContent,
            thumbnail,
            tags: safeTags,
            attachments: attachments || [],
            isPublished: isPublished || false,
            author: userId
        };

        if (isFeatured !== undefined) {
            postData.isFeatured = Boolean(isFeatured);
        }

        const newPost = new BlogPost(postData);

        await newPost.save();

        // Dynamic Knowledge: Sync with RAG if published
        if (newPost.isPublished && newPost.content) {
            syncToRag({
                req,
                type: 'blog',
                id: newPost._id,
                content: newPost.content,
                title: newPost.title
            });
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating blog post:', error);
        res.status(500).json({ message: 'Error creating blog post' });
    }
};

const updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content, thumbnail, tags, attachments, isPublished, isFeatured } = req.body;

        const existingPost = await BlogPost.findById(id).select('title description content tags').lean();
        if (!existingPost) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        const effectiveTitle = title !== undefined ? title : existingPost.title;
        const effectiveTags = Array.isArray(tags) ? tags : (existingPost.tags || []);

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (content !== undefined) {
            updateFields.content = formatBlogEditorialHtml(content, {
                title: effectiveTitle || '',
                tags: effectiveTags,
            });
        }
        if (description !== undefined) {
            updateFields.description =
                typeof description === 'string' && description.trim()
                    ? description.trim()
                    : extractBlogSummary(updateFields.content !== undefined ? updateFields.content : existingPost.content);
        } else if (
            updateFields.content !== undefined &&
            (!existingPost.description || !String(existingPost.description).trim())
        ) {
            updateFields.description = extractBlogSummary(updateFields.content);
        }
        if (thumbnail !== undefined) updateFields.thumbnail = thumbnail;
        if (tags !== undefined) updateFields.tags = tags;
        if (attachments !== undefined) updateFields.attachments = attachments;
        if (isPublished !== undefined) updateFields.isPublished = isPublished;
        if (isFeatured !== undefined) updateFields.isFeatured = Boolean(isFeatured);

        const post = await BlogPost.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        // Dynamic Knowledge: Sync with RAG if published
        if (post.isPublished && post.content) {
            syncToRag({
                req,
                type: 'blog',
                id: post._id,
                content: post.content,
                title: post.title
            });
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
        const { prompt, modelName, type, sources, tags } = req.body;
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ error: 'Debe indicar un tema o prompt para generar el artículo.' });
        }

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
            console.log('[BlogController] No user google key, falling back to server key:', e.message);
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

        const requestedModel = typeof modelName === 'string' ? modelName.trim() : '';
        const resolvedModel =
            !requestedModel || /^gemini-3-flash-preview$/i.test(requestedModel)
                ? DEFAULT_BLOG_AI_MODEL
                : requestedModel;

        const genAI = new GoogleGenerativeAI(resolvedApiKey);
        const model = genAI.getGenerativeModel({ model: resolvedModel });

        let systemPrompt = '';
        if (!type || type === 'blog') {
            systemPrompt = WAPPY_BLOG_EDITORIAL_PROMPT;
        }

        let fullPrompt = `${systemPrompt}\n\nTema / Solicitud del usuario: ${prompt.trim()}`;
        if (Array.isArray(sources) && sources.length > 0) {
            fullPrompt += `\n\nPor favor, ten en cuenta las siguientes referencias proporcionadas por el usuario:\n${sources.join('\n')}`;
        }

        const abortController = new AbortController();
        let timeoutHandle;
        let result;
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    abortController.abort();
                    reject(new Error('Tiempo de espera agotado al generar el artículo con Gemini.'));
                }, BLOG_AI_TIMEOUT_MS);
            });
            result = await Promise.race([
                model.generateContent(fullPrompt, { signal: abortController.signal }),
                timeoutPromise,
            ]);
        } finally {
            if (timeoutHandle) clearTimeout(timeoutHandle);
        }

        const responseText = result.response.text();
        const formattedHtml = formatBlogEditorialHtml(responseText, {
            title: prompt.trim(),
            tags: Array.isArray(tags) ? tags : [],
            forceRestyle: true,
        });

        res.json({
            data: formattedHtml,
            description: extractBlogSummary(formattedHtml),
            modelUsed: resolvedModel,
        });
    } catch (error) {
        console.error('[BlogController] Error generating blog content:', error);
        res.status(500).json({ error: `Error al generar contenido: ${error.message || 'Asegúrese de detallar mejor su solicitud'}` });
    }
};

const beautifyBlogContent = async (req, res) => {
    try {
        const { content, title = '', tags = [], forceRestyle } = req.body || {};
        const safeTitle = typeof title === 'string' ? title.trim() : '';
        const safeTags = Array.isArray(tags) ? tags : [];
        const shouldForceRestyle = forceRestyle !== undefined ? Boolean(forceRestyle) : true;

        if (!content || typeof content !== 'string' || !content.trim()) {
            const starterHtml = getWappyEditorialStarterTemplate(safeTitle);
            return res.status(200).json({
                success: true,
                data: starterHtml,
                description: extractBlogSummary(starterHtml),
            });
        }

        const formattedHtml = formatBlogEditorialHtml(content, {
            title: safeTitle,
            tags: safeTags,
            forceRestyle: shouldForceRestyle,
        });

        return res.status(200).json({
            success: true,
            data: formattedHtml,
            description: extractBlogSummary(formattedHtml),
        });
    } catch (error) {
        console.error('[BlogController] Error in beautifyBlogContent:', error);
        return res.status(500).json({
            success: false,
            error: `Error al aplicar formato editorial: ${error.message || 'Error interno'}`,
        });
    }
};

const setFeaturedPost = async (req, res) => {
    try {
        if (!isUserAdmin(req.user)) return res.status(403).json({ message: 'Forbidden' });


        const { id } = req.params;

        // Unset all featured posts first
        await BlogPost.updateMany({}, { $set: { isFeatured: false } });

        // Set the selected post as featured
        const updated = await BlogPost.findByIdAndUpdate(
            id,
            { $set: { isFeatured: true } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Blog post not found' });
        }

        res.status(200).json({ message: 'Post set as featured', post: updated });
    } catch (error) {
        console.error('Error in setFeaturedPost:', error);
        res.status(500).json({ message: 'Error setting featured post' });
    }
};

module.exports = {
    getBlogPosts,
    getBlogPostById,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    generateBlogPost,
    beautifyBlogContent,
    setFeaturedPost
};
