const express = require('express');
const mongoose = require('mongoose');
const { Course } = require('../../models/Course');
const { UserProgress } = require('../../models/UserProgress');
const CompanyInfo = require('../../models/CompanyInfo');
const { requireJwtAuth } = require('../middleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AuthKeys } = require('librechat-data-provider');
const { getUserKey } = require('~/server/services/UserService');
const { logger } = require('~/config');

const router = express.Router();


// Helper: Get active company of a user
async function getActiveCompanyId(userId) {
    let active = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!active) active = await CompanyInfo.findOne({ user: userId });
    return active ? active._id : null;
}

// -------------------------------------------------------------
// --- Admin Endpoints (Require JWT Authentication & ADMIN role) ---
// -------------------------------------------------------------

const checkAdminRole = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
};

// Get all courses for the active company
router.get('/admin/courses', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        if (!companyId) {
            return res.status(400).json({ message: 'No active company found for this user' });
        }

        const courses = await Course.find({ isLearningPath: true, companyId }).sort({ createdAt: -1 }).lean();
        res.status(200).json(courses);
    } catch (error) {
    }
});

// Get list of workers and unique cargos for the active company
router.get('/admin/company-workers-info', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        if (!companyId) {
            return res.status(400).json({ message: 'No active company found for this user' });
        }

        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (!PerfilSociodemograficoData) {
            return res.status(200).json({ workers: [], cargos: [] });
        }

        const perfil = await PerfilSociodemograficoData.findOne({
            companyId: companyId
        }).lean();

        if (!perfil || !perfil.trabajadores) {
            return res.status(200).json({ workers: [], cargos: [] });
        }

        const workers = perfil.trabajadores.map(t => ({
            nombre: t.nombre || '',
            identificacion: t.identificacion || '',
            cargo: t.cargo || ''
        }));

        const cargos = Array.from(new Set(
            perfil.trabajadores
                .map(t => String(t.cargo || '').trim())
                .filter(Boolean)
        )).sort();

        res.status(200).json({ workers, cargos });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Get company workers info error:', error);
        res.status(500).json({ message: 'Error retrieving workers info' });
    }
});

// Get course by ID
router.get('/admin/courses/:id', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        if (!companyId) {
            return res.status(400).json({ message: 'No active company found for this user' });
        }

        const course = await Course.findOne({ _id: req.params.id, isLearningPath: true, companyId }).lean();
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json(course);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Get course by ID error:', error);
        res.status(500).json({ message: 'Error retrieving course' });
    }
});

// Create course
router.post('/admin/courses', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        if (!companyId) {
            return res.status(400).json({ message: 'No active company found for this user' });
        }

        const { title, description, thumbnail, tags, isPublished, assignmentType, assignedCargos, assignedWorkers } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const newCourse = new Course({
            title,
            description,
            thumbnail,
            tags: tags || [],
            isPublished: isPublished || false,
            isLearningPath: true,
            companyId,
            assignmentType: assignmentType || 'all',
            assignedCargos: assignedCargos || [],
            assignedWorkers: assignedWorkers || [],
            lessons: []
        });

        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Create course error:', error);
        res.status(500).json({ message: 'Error creating course' });
    }
});

// Update course
router.put('/admin/courses/:id', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        const updatedCourse = await Course.findOneAndUpdate(
            { _id: req.params.id, isLearningPath: true, companyId },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        res.status(200).json(updatedCourse);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Update course error:', error);
        res.status(500).json({ message: 'Error updating course' });
    }
});

// Delete course
router.delete('/admin/courses/:id', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        
        const result = await Course.findOneAndDelete({ _id: req.params.id, isLearningPath: true, companyId });
        if (!result) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        await UserProgress.deleteMany({ course: req.params.id, companyId });
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Delete course error:', error);
        res.status(500).json({ message: 'Error deleting course' });
    }
});

// Add lesson
router.post('/admin/courses/:courseId/lessons', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        const { courseId } = req.params;
        const { title, content, videoUrl, order, exam } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Lesson title is required' });
        }

        const course = await Course.findOne({ _id: courseId, isLearningPath: true, companyId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const newLesson = { title, content, videoUrl, order: order || course.lessons.length + 1, exam };
        course.lessons.push(newLesson);
        await course.save();

        const addedLesson = course.lessons[course.lessons.length - 1];
        res.status(201).json(addedLesson);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Add lesson error:', error);
        res.status(500).json({ message: 'Error adding lesson' });
    }
});

// Update lesson
router.put('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        const { courseId, lessonId } = req.params;
        const updates = req.body;

        const course = await Course.findOne({ _id: courseId, isLearningPath: true, companyId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const lesson = course.lessons.id(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                lesson[key] = updates[key];
            }
        });

        await course.save();
        res.status(200).json(lesson);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Update lesson error:', error);
        res.status(500).json({ message: 'Error updating lesson' });
    }
});

// Delete lesson
router.delete('/admin/courses/:courseId/lessons/:lessonId', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const companyId = await getActiveCompanyId(userId);
        const { courseId, lessonId } = req.params;

        const course = await Course.findOne({ _id: courseId, isLearningPath: true, companyId });
        if (!course) {
            return res.status(404).json({ message: 'Course not found or unauthorized' });
        }

        const lesson = course.lessons.id(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        course.lessons.pull(lessonId);
        await course.save();

        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] Delete lesson error:', error);
        res.status(500).json({ message: 'Error deleting lesson' });
    }
});

// AI Generate Content
router.post('/admin/generate', requireJwtAuth, checkAdminRole, async (req, res) => {
    try {
        const { type, prompt, modelName } = req.body;

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
            logger.debug('No user google key found', e.message);
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
        const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.5-flash' });

        let systemPrompt = "";
        if (type === 'course') {
            systemPrompt = "Actúa como un diseñador de cursos profesionales de SST en español. Recibe un tema y genera un excelente título atractivo, una descripción de qué aprenderán los usuarios, y unas etiquetas separadas por comas. Devuélvelo estrictamente en JSON sin ningún bloque extra: { \"title\": \"...\", \"description\": \"...\", \"tags\": \"uno, dos\" }.";
        } else if (type === 'lesson') {
            systemPrompt = "Actúa como un creador de contenido de aprendizaje de SST. Escribe una lección completa y detallada usando formato Markdown en español con títulos, listas, y énfasis, sobre el tema indicado. Devuelve únicamente el Markdown formateado.";
        } else if (type === 'exam') {
            systemPrompt = "Actúa como un diseñador instruccional. Diseña un examen de selección múltiple (de 2 a 5 preguntas) en español sobre el tema indicado. Devuélvelo ESTRICTAMENTE en JSON (sin usar markdown wrapping, sin texto suelto) con la siguiente estructura: { \"title\": \"Evaluación del tema\", \"description\": \"Breve descripción\", \"passingScore\": 80, \"questions\": [ { \"questionText\": \"Pregunta 1\", \"options\": [ \"Opcion A\", \"Opcion B\", \"Opcion C\" ], \"correctOptionIndex\": 1, \"explanation\": \"Por qué es la opción de índice 1\" } ] }.";
        }

        const fullPrompt = `${systemPrompt}\n\nTema / Solicitud del usuario: ${prompt}`;
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        let data = responseText;
        if (type === 'course' || type === 'exam') {
            try {
                const clean = data.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                data = JSON.parse(clean);
            } catch (e) {
                return res.status(500).json({ error: 'La IA no devolvió un formato válido de JSON.' });
            }
        }

        res.json({ data });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Admin] AI Generate error:', error);
        res.status(500).json({ error: 'Error al generar contenido con la IA' });
    }
});

// -------------------------------------------------------------
// --- Public Endpoints (Worker Portal - No JWT Required) ---
// -------------------------------------------------------------

// Validate worker identity
// Validate worker identity
router.post('/public/login', async (req, res) => {
    try {
        const { nitOrName, nombre, cedula, companyId } = req.body;
        if (!nitOrName || !nombre || !cedula) {
            return res.status(400).json({ error: 'El NIT/Nombre Empresa, Nombre Trabajador y Cédula son obligatorios' });
        }

        const formatStr = (s) => String(s).trim().toLowerCase();
        const inputNameFormat = formatStr(nombre);

        let company;

        // 1. If companyId is explicitly passed, try that first
        if (companyId) {
            company = await CompanyInfo.findById(companyId);
        }

        // 2. If not found or not passed, find all matching companies by NIT or Name
        if (!company) {
            let matchedCompanies = await CompanyInfo.find({ nit: nitOrName.trim() });
            if (matchedCompanies.length === 0) {
                matchedCompanies = await CompanyInfo.find({ companyName: { $regex: new RegExp(nitOrName.trim(), 'i') } });
            }

            if (matchedCompanies.length === 0) {
                return res.status(404).json({ error: 'Empresa no encontrada por el NIT o Razón Social ingresado.' });
            }

            // Find the database model
            const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
            if (!PerfilSociodemograficoData) {
                return res.status(500).json({ error: 'Mapeador sociodemográfico no cargado.' });
            }

            // 3. Search through the matched companies to find where the worker is registered
            let foundCompany = null;
            let bestCompany = null;

            for (const comp of matchedCompanies) {
                const perfil = await PerfilSociodemograficoData.findOne({
                    user: new mongoose.Types.ObjectId(comp.user),
                    companyId: comp._id
                }).lean();

                if (perfil && perfil.trabajadores) {
                    const match = perfil.trabajadores.find(t => formatStr(t.identificacion) === formatStr(cedula));
                    if (match) {
                        // Check if the name matches (partial match)
                        const workerNameParts = formatStr(match.nombre).split(' ').filter(p => p.length > 2);
                        const nameMatches = workerNameParts.some(part => inputNameFormat.includes(part));
                        if (nameMatches) {
                            if (!foundCompany) {
                                foundCompany = comp;
                            }
                            // Check if this company has learning path courses
                            const Course = mongoose.models.Course;
                            if (Course) {
                                const hasCourses = await Course.exists({ companyId: comp._id, isLearningPath: true });
                                if (hasCourses) {
                                    bestCompany = comp;
                                }
                            }
                        }
                    }
                }
            }

            company = bestCompany || foundCompany || matchedCompanies[0];
        }

        if (!company) {
            return res.status(404).json({ error: 'Empresa no encontrada por el NIT o Razón Social ingresado.' });
        }

        // Validate worker exists in PerfilSociodemografico workers list
        const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData;
        if (!PerfilSociodemograficoData) {
            return res.status(500).json({ error: 'Mapeador sociodemográfico no cargado.' });
        }

        const perfil = await PerfilSociodemograficoData.findOne({
            user: new mongoose.Types.ObjectId(company.user),
            companyId: company._id
        }).lean();

        if (!perfil || !perfil.trabajadores || perfil.trabajadores.length === 0) {
            return res.status(404).json({ error: 'La empresa no cuenta con un listado de trabajadores activo.' });
        }

        const workerFound = perfil.trabajadores.find(t => formatStr(t.identificacion) === formatStr(cedula));

        if (!workerFound) {
            return res.status(403).json({ error: 'Identificación (cédula) no registrada en el listado de personal de la empresa.' });
        }

        // Validate name matches (partial match)
        const workerNameParts = formatStr(workerFound.nombre).split(' ').filter(p => p.length > 2);
        const nameMatches = workerNameParts.some(part => inputNameFormat.includes(part));

        if (!nameMatches && workerFound.nombre) {
            return res.status(403).json({ error: 'El nombre no coincide con el registro oficial para la cédula dada.' });
        }

        return res.json({
            success: true,
            companyId: company._id,
            companyName: company.companyName,
            worker: {
                nombre: workerFound.nombre,
                cargo: workerFound.cargo || 'Trabajador',
                cedula: workerFound.identificacion
            }
        });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Worker validation error:', error);
        res.status(500).json({ error: 'Error al procesar la validación' });
    }
});

// Get public company metadata
router.get('/public/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const company = await CompanyInfo.findById(companyId).lean();
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({
            companyName: company.companyName || 'Empresa Activa',
            nit: company.nit || '',
            logo: company.logoBase64 || null,
            legalRepresentative: company.legalRepresentative || ''
        });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Get company details error:', error);
        res.status(500).json({ error: 'Error retrieving company details' });
    }
});

// Get published courses for a company
router.get('/public/courses/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { cedula, cargo } = req.query;

        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const queryCompanyId = mongoose.Types.ObjectId.isValid(companyId) 
            ? new mongoose.Types.ObjectId(companyId) 
            : companyId;

        const courses = await Course.find({ 
            isPublished: true, 
            isLearningPath: true, 
            companyId: { $in: [companyId, queryCompanyId] }
        })
            .select('-lessons.content')
            .lean();

        // Filter courses by segment targeting if worker info is provided
        let filteredCourses = courses;
        if (cedula && cargo) {
            const formatStr = (s) => String(s || '').trim().toLowerCase();
            const wCedula = formatStr(cedula);
            const wCargo = formatStr(cargo);

            filteredCourses = courses.filter(course => {
                const type = course.assignmentType || 'all';
                if (type === 'all') {
                    return true;
                }
                if (type === 'cargo') {
                    const cargos = (course.assignedCargos || []).map(formatStr);
                    return cargos.includes(wCargo);
                }
                if (type === 'worker') {
                    const workers = (course.assignedWorkers || []).map(formatStr);
                    return workers.includes(wCedula);
                }
                return true;
            });
        }

        res.status(200).json(filteredCourses);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Get courses error:', error);
        res.status(500).json({ error: 'Error retrieving learning path courses' });
    }
});

// Get specific course and worker progress
router.get('/public/courses/:companyId/:courseId', async (req, res) => {
    try {
        const { companyId, courseId } = req.params;
        const { cedula, cargo } = req.query;

        if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }

        const queryCompanyId = mongoose.Types.ObjectId.isValid(companyId) 
            ? new mongoose.Types.ObjectId(companyId) 
            : companyId;

        const course = await Course.findOne({ 
            _id: courseId, 
            isLearningPath: true, 
            companyId: { $in: [companyId, queryCompanyId] }
        }).lean();

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Validate course assignment targeting
        if (cedula && cargo) {
            const formatStr = (s) => String(s || '').trim().toLowerCase();
            const wCedula = formatStr(cedula);
            const wCargo = formatStr(cargo);
            const type = course.assignmentType || 'all';

            let isAssigned = true;
            if (type === 'cargo') {
                const cargos = (course.assignedCargos || []).map(formatStr);
                isAssigned = cargos.includes(wCargo);
            } else if (type === 'worker') {
                const workers = (course.assignedWorkers || []).map(formatStr);
                isAssigned = workers.includes(wCedula);
            }

            if (!isAssigned) {
                return res.status(403).json({ error: 'Este curso no está asignado a tu perfil o cargo.' });
            }
        }

        let progress = null;
        if (cedula) {
            progress = await UserProgress.findOne({ 
                workerCedula: String(cedula).trim(), 
                course: courseId, 
                companyId: { $in: [companyId, queryCompanyId] }
            }).lean();
        }

        const responseData = {
            ...course,
            progress: progress ? {
                completedLessons: progress.completedLessons || [],
                isCompleted: progress.isCourseCompleted
            } : { completedLessons: [], isCompleted: false }
        };

        res.status(200).json(responseData);
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Get course by ID error:', error);
        res.status(500).json({ error: 'Error retrieving course details' });
    }
});

// Update/Save worker progress (mark lesson complete / finish exam)
router.post('/public/progress', async (req, res) => {
    try {
        const { companyId, courseId, lessonId, workerCedula, workerName } = req.body;

        if (!companyId || !courseId || !lessonId || !workerCedula || !workerName) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const queryCompanyId = mongoose.Types.ObjectId.isValid(companyId) 
            ? new mongoose.Types.ObjectId(companyId) 
            : companyId;

        const course = await Course.findOne({ 
            _id: courseId, 
            isLearningPath: true, 
            companyId: { $in: [companyId, queryCompanyId] }
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const lessonExists = course.lessons.some(l => l._id.toString() === lessonId);
        if (!lessonExists) {
            return res.status(404).json({ error: 'Lesson not found in this course' });
        }

        let progress = await UserProgress.findOne({ 
            workerCedula: String(workerCedula).trim(), 
            course: courseId, 
            companyId: { $in: [companyId, queryCompanyId] }
        });

        if (!progress) {
            progress = new UserProgress({
                workerCedula: String(workerCedula).trim(),
                workerName,
                companyId: queryCompanyId,
                course: courseId,
                completedLessons: [lessonId]
            });
        } else {
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }
        }

        progress.lastAccessed = new Date();

        const totalLessons = course.lessons.length;
        if (progress.completedLessons.length >= totalLessons) {
            progress.isCourseCompleted = true;
        }

        await progress.save();

        res.status(200).json({
            message: 'Lesson marked as complete',
            progress: {
                completedLessons: progress.completedLessons,
                isCompleted: progress.isCourseCompleted
            }
        });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Save progress error:', error);
        res.status(500).json({ error: 'Error saving worker course progress' });
    }
});

// Fetch progress for list of courses for a worker
router.get('/public/progress/:companyId/:courseId/:cedula', async (req, res) => {
    try {
        const { companyId, courseId, cedula } = req.params;
        const queryCompanyId = mongoose.Types.ObjectId.isValid(companyId) 
            ? new mongoose.Types.ObjectId(companyId) 
            : companyId;

        const progress = await UserProgress.findOne({ 
            workerCedula: String(cedula).trim(), 
            course: courseId, 
            companyId: { $in: [companyId, queryCompanyId] }
        }).lean();

        res.json({
            completedCount: progress?.completedLessons?.length || 0,
            isCompleted: progress?.isCourseCompleted || false,
            completedLessons: progress?.completedLessons || []
        });
    } catch (error) {
        logger.error('[Ruta Aprendizaje Public] Fetch progress error:', error);
        res.status(500).json({ error: 'Error fetching progress' });
    }
});

module.exports = router;
