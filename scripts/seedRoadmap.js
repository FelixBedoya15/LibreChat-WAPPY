const mongoose = require('mongoose');
const Roadmap = require('../api/models/Roadmap');
// Using the local DB URI for LibreChat-WAPPY
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/LibreChat"; 

const defaultSeedItems = [
  {
    title: 'Editor de Archivos e IA Web',
    description: 'Se introdujo el nuevo "Editor de Archivos" con soporte para importaci\u00F3n y conversi\u00F3n visual enriquecida de PDFs y Words. Adem\u00E1s, la burbuja de "Edici\u00F3n con IA" ahora cuenta con acceso a la web en vivo mediante Google Search Grounding permiti\u00E9ndole verificar fuentes.',
    version: 'V2.5.0',
    date: new Date(),
    type: 'Nuevo',
  },
  {
    title: 'An\u00E1lisis en Vivo (SGSST Visi\u00F3n)',
    description: 'Uso de las c\u00E1maras de celulares y computadores para Visi\u00F3n Artificial integrada al sistema corporativo (incorporaci\u00F3n de c\u00E1maras de seguridad como mejora futura). Ahora Tenshi puede observar a trav\u00E9s del lente, detectar actos o condiciones inseguras y autoredactarte inspecciones o reportes estructurados.',
    version: 'V2.2.0',
    date: new Date(Date.now() - 86400000 * 5),
    type: 'Nuevo',
  },
  {
    title: 'Gestor SG-SST: Participaci\u00F3n e Informes',
    description: 'El n\u00FAcleo de operaciones preventivas de WAPPY IA cobr\u00F3 vida permitiendo completar el ciclo PHVA total con generadores automatizados como Pol\u00EDtica, Matriz Legal, Dashboard Predictivo e integraci\u00F3n de Buz\u00F3n de Empleados IPEVAR.',
    version: 'V2.0.0',
    date: new Date(Date.now() - 86400000 * 15),
    type: 'Nuevo',
  },
  {
    title: 'Aula M\u00E1gica Estudiantil',
    description: 'Lanzamiento de las herramientas de formaci\u00F3n cont\u00EDnua, permiti\u00E9ndo centralizar material SST y adoctrinamiento para coordinadores en vivo.',
    version: 'V1.5.0',
    date: new Date(Date.now() - 86400000 * 30),
    type: 'Mejora',
  },
  {
    title: 'Blog Normativo Integrado',
    description: 'Incorporaci\u00F3n de Blog de noticias institucionales le\u00EDdas transversalmente por nuestro Agente IA central.',
    version: 'V1.1.0',
    date: new Date(Date.now() - 86400000 * 60),
    type: 'Nuevo',
  },
  {
    title: 'Sistema Fundacional: Chat Inteligente',
    description: 'Lanzamiento original de WAPPY IA (Tenshi). Motores conversacionales LLM adaptados al contexto corporativo como n\u00FAcleo base de operaciones.',
    version: 'V1.0.0',
    date: new Date(Date.now() - 86400000 * 100),
    type: 'Anuncio',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    // Check if roadmap is empty
    const count = await Roadmap.countDocuments();
    if (count === 0) {
      console.log('Inserting seeds...');
      await Roadmap.insertMany(defaultSeedItems);
      console.log('Done!');
    } else {
      console.log('Roadmap collection already has data. Skipping.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

seed();
