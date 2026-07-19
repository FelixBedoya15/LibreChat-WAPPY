const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Cargar variables de entorno
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LibreChat';

const CourseSchema = new mongoose.Schema({
  title: String,
  thumbnail: String
}, { strict: false, collection: 'courses' });

const BlogPostSchema = new mongoose.Schema({
  title: String,
  thumbnail: String
}, { strict: false, collection: 'blogposts' });

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);

const SRC_COURSES_DIR = path.resolve(__dirname, '../../Agentes/Miniaturas/Cursos');
const SRC_BLOG_DIR = path.resolve(__dirname, '../../Agentes/Miniaturas/Blog');

const DEST_COURSES_DIR = path.resolve(__dirname, '../../client/public/images/cursos');
const DEST_BLOG_DIR = path.resolve(__dirname, '../../client/public/images/blog');

const USER_IMAGES_DIR = path.resolve(__dirname, '../../client/public/images/6921e15be5ed2f3ebc3cde7a');

async function main() {
  console.log('🏁 Iniciando proceso de restauración de miniaturas (Cursos y Blog)...');

  // 1. Asegurar directorios de destino
  if (!fs.existsSync(DEST_COURSES_DIR)) {
    fs.mkdirSync(DEST_COURSES_DIR, { recursive: true });
    console.log('📁 Creado directorio de destino para cursos.');
  }
  if (!fs.existsSync(DEST_BLOG_DIR)) {
    fs.mkdirSync(DEST_BLOG_DIR, { recursive: true });
    console.log('📁 Creado directorio de destino para blog.');
  }

  // 2. Copiar imágenes desde el repositorio a la carpeta pública del cliente
  if (fs.existsSync(SRC_COURSES_DIR)) {
    const courseFiles = fs.readdirSync(SRC_COURSES_DIR);
    courseFiles.forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp')) {
        fs.copyFileSync(path.join(SRC_COURSES_DIR, file), path.join(DEST_COURSES_DIR, file));
        console.log(`   ✅ Copiado curso miniatura: ${file}`);
      }
    });
  }

  if (fs.existsSync(SRC_BLOG_DIR)) {
    const blogFiles = fs.readdirSync(SRC_BLOG_DIR);
    blogFiles.forEach(file => {
      if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp')) {
        fs.copyFileSync(path.join(SRC_BLOG_DIR, file), path.join(DEST_BLOG_DIR, file));
        console.log(`   ✅ Copiado blog miniatura: ${file}`);
      }
    });
  }

  // 3. Buscar y copiar imágenes existentes del usuario para los posts de blog que sí estaban guardados
  if (fs.existsSync(USER_IMAGES_DIR)) {
    console.log('🔍 Buscando imágenes existentes en el directorio del administrador...');
    const userFiles = fs.readdirSync(USER_IMAGES_DIR);

    const fileMappings = {
      '7296122f-51cb-46a7-8e31-1de1697bdc40__Gemini_Generated_Image_kkehpekkehpekkeh.png': 'blog_circular_0027.png',
      'c9e9d269-9e77-4183-aea6-b5ddbfa5eae8__Gemini_Generated_Image_c6rtt0c6rtt0c6rt.png': 'blog_circular_0048.png',
      '56645822-2b79-47a4-b8df-f1771b4d7862__Gemini_Generated_Image_nvd6afnvd6afnvd6.png': 'blog_circular_0049.png',
      '2ee001e4-c9d2-4c74-bfe7-1265d5cc3a8e__IMG_4549.PNG': 'blog_adaptacion.png'
    };

    userFiles.forEach(file => {
      if (fileMappings[file]) {
        fs.copyFileSync(path.join(USER_IMAGES_DIR, file), path.join(DEST_BLOG_DIR, fileMappings[file]));
        console.log(`   💾 Copiado y renombrado archivo del usuario: ${file} ➡️ ${fileMappings[file]}`);
      }
    });
  }

  // 4. Conectar a MongoDB y actualizar rutas de imágenes
  console.log('🔌 Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado a MongoDB.');

  // Mapeos de Cursos a sus nuevas rutas públicas
  const courseMappings = [
    { title: '¡API KEY FÁCIL! Conecta Google Gemini a WAPPY IA', path: '/images/cursos/curso_gemini_api.jpg' },
    { title: 'EL SECRETO DE WAPPY IA: Datos Organizacionales', path: '/images/cursos/curso_datos_org.jpg' },
    { title: '¿CANSADO DE EXCEL? Deja que la Inteligencia Artificial de WAPPY cree tu Matriz IPEVAR', path: '/images/cursos/curso_matriz_ipevar.jpg' },
    { title: '¡RIT Actualizado con IA! ✅ Diseño Rápido y Legal 2026', path: '/images/cursos/curso_rit.jpg' }
  ];

  for (const mapping of courseMappings) {
    const res = await Course.updateOne({ title: mapping.title }, { $set: { thumbnail: mapping.path } });
    if (res.modifiedCount > 0) {
      console.log(`   ✏️ Actualizada BD Curso: "${mapping.title}" ➡️ ${mapping.path}`);
    } else {
      console.log(`   ℹ️ Curso sin cambios o no encontrado: "${mapping.title}"`);
    }
  }

  // Mapeos de Blog Posts a sus nuevas rutas públicas
  const blogMappings = [
    { title: 'Circular Externa 20261300000087 de 2026 Ministerio de Transporte', path: '/images/blog/blog_circular_transporte.jpg' },
    { title: 'Circular 0027 de 2026 - Autoevaluación de Estándares Mínimos del SG-SST', path: '/images/blog/blog_circular_0027.png' },
    { title: 'Circular 0048 de 2026 - Debido Proceso Disciplinario en Empresas Privadas', path: '/images/blog/blog_circular_0048.png' },
    { title: 'Circular 0049 de 2026 - Terminación de Contrato con Estabilidad Reforzada ', path: '/images/blog/blog_circular_0049.png' },
    { title: '¿Adaptación o Desplazamiento? El ultimátum de la IA que los profesionales de SST no pueden ignorar.', path: '/images/blog/blog_adaptacion.png' },
    
    // Fallbacks para los posts que no tienen imagen cargada físicamente (mientras la cuota de la IA se resetea)
    { title: 'Decreto No. 0223  de 2026', path: '/images/blog/blog_estabilidad_laboral.png' },
    { title: 'Circular 087 de 2026', path: '/images/blog/blog_circular_0049.png' },
    { title: 'Discapacidad en el Entorno Laboral ', path: '/images/blog/blog_estabilidad_laboral.png' }
  ];

  for (const mapping of blogMappings) {
    const res = await BlogPost.updateOne({ title: mapping.title }, { $set: { thumbnail: mapping.path } });
    if (res.modifiedCount > 0) {
      console.log(`   ✏️ Actualizada BD Blog: "${mapping.title}" ➡️ ${mapping.path}`);
    } else {
      console.log(`   ℹ️ Artículo sin cambios o no encontrado: "${mapping.title}"`);
    }
  }

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');
  console.log('🎉 PROCESO DE RESTAURACIÓN COMPLETADO CON ÉXITO.');
}

main().catch(err => {
  console.error('❌ Error en el script de restauración:', err);
  process.exit(1);
});
