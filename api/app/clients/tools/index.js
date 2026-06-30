const manifest = require('./manifest');

// Structured Tools
const DALLE3 = require('./structured/DALLE3');
const FluxAPI = require('./structured/FluxAPI');
const OpenWeather = require('./structured/OpenWeather');
const StructuredWolfram = require('./structured/Wolfram');
const createYouTubeTools = require('./structured/YouTube');
const StructuredACS = require('./structured/AzureAISearch');
const StructuredSD = require('./structured/StableDiffusion');
const GoogleSearchAPI = require('./structured/GoogleSearch');
const TraversaalSearch = require('./structured/TraversaalSearch');
const createOpenAIImageTools = require('./structured/OpenAIImageTools');
const GoogleImageTools = require('./structured/GoogleImageTools');
const TavilySearchResults = require('./structured/TavilySearchResults');
const n8nWebhook = require('./structured/n8n');
const MatrizIPEVAR = require('./structured/MatrizIPEVAR');
const MatrizPESV = require('./structured/MatrizPESV');
const MatrizCompatibilidad = require('./structured/MatrizCompatibilidad');
const EditorLive = require('./structured/EditorLive');
const EditorRIT = require('./structured/EditorRIT');
const CanvasTool = require('./structured/CanvasTool');
const SomosSST = require('./structured/SomosSST');
const ConsultarAgenteEspecializado = require('./structured/ConsultarAgenteEspecializado');
const BlogEditor = require('./structured/BlogEditor');
const ConsultarAnaliticaPsicosocial = require('./structured/ConsultarAnaliticaPsicosocial');
const ConsultarAnaliticaActosCondiciones = require('./structured/ConsultarAnaliticaActosCondiciones');
const GoogleDrive = require('./structured/GoogleDrive');
const GoogleCalendar = require('./structured/GoogleCalendar');
const GoogleGmail = require('./structured/GoogleGmail');
const GoogleSheets = require('./structured/GoogleSheets');
const GoogleDocs = require('./structured/GoogleDocs');
const GoogleSlides = require('./structured/GoogleSlides');
const PuterImageGen = require('./structured/PuterImageGen');


module.exports = {
  ...manifest,
  // Structured Tools
  DALLE3,
  FluxAPI,
  OpenWeather,
  StructuredSD,
  StructuredACS,
  GoogleSearchAPI,
  TraversaalSearch,
  StructuredWolfram,
  createYouTubeTools,
  TavilySearchResults,
  createOpenAIImageTools,
  GoogleImageTools,
  n8nWebhook,
  MatrizIPEVAR,
  MatrizPESV,
  MatrizCompatibilidad,
  EditorLive,
  EditorRIT,
  CanvasTool,
  SomosSST,
  ConsultarAgenteEspecializado,
  BlogEditor,
  ConsultarAnaliticaPsicosocial,
  ConsultarAnaliticaActosCondiciones,
  GoogleDrive,
  GoogleCalendar,
  GoogleGmail,
  GoogleSheets,
  GoogleDocs,
  GoogleSlides,
  PuterImageGen,
};
