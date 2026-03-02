require('dotenv').config();
const mongoose = require('mongoose');
const { Course } = require('./api/models/Course');
const { UserProgress } = require('./api/models/UserProgress');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing
        await Course.deleteMany({});
        await UserProgress.deleteMany({});

        // Create sample course
        const sampleCourse = new Course({
            title: 'Inducción de Seguridad y Salud en el Trabajo (SST)',
            description: 'Curso obligatorio para todos los colaboradores nuevos. Aprende sobre los riesgos en el lugar de trabajo, medidas de prevención y cómo reportar incidentes.',
            thumbnail: 'https://images.unsplash.com/photo-1579389083046-df6743c3f91f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Inducción', 'SST', 'Formativo'],
            isPublished: true,
            lessons: [
                {
                    title: '1. Introducción al SG-SST',
                    content: '### ¿Qué es el SG-SST?\n\nEs el Sistema de Gestión de Seguridad y Salud en el Trabajo. Consiste en el desarrollo de un proceso lógico y por etapas, basado en la mejora continua.\n\n**Objetivos principales:**\n- Anticipar, reconocer, evaluar y controlar los riesgos.\n- Proteger la seguridad y salud de todos los trabajadores.\n- Cumplir con la normatividad legal vigente.',
                    order: 1
                },
                {
                    title: '2. Políticas de Seguridad',
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Dummy video
                    content: 'Por favor, mira el video adjunto donde explicamos la política de nuestra empresa respecto a la Seguridad y Salud en el Trabajo. Recuerda que no se permite el uso de sustancias psicoactivas durante la jornada laboral.',
                    order: 2
                },
                {
                    title: '3. Reporte de Actos y Condiciones Inseguras',
                    content: '### Actos Inseguros\nSon los comportamientos de los trabajadores que pueden causar un accidente.\nEjemplo: Usar una herramienta para algo que no fue diseñada.\n\n### Condiciones Inseguras\nSon los elementos del entorno de trabajo que pueden causar un accidente.\nEjemplo: Cables pelados en el suelo.\n\n**¿Cómo reportar?**\nComunícate inmediatamente con el área de SST o utiliza la plataforma para generar el reporte.',
                    order: 3
                }
            ]
        });

        await sampleCourse.save();
        console.log('Mock course seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();
