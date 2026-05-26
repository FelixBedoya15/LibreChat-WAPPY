require('dotenv').config();
const fs = require('fs');
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });
const cors = require('cors');
const axios = require('axios');
const express = require('express');
const passport = require('passport');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { logger } = require('@librechat/data-schemas');
const mongoSanitize = require('express-mongo-sanitize');
const {
  isEnabled,
  ErrorController,
  performStartupChecks,
  initializeFileStorage,
} = require('@librechat/api');
const { connectDb, indexSync } = require('~/db');
const initializeOAuthReconnectManager = require('./services/initializeOAuthReconnectManager');
const createValidateImageRequest = require('./middleware/validateImageRequest');
const { jwtLogin, ldapLogin, passportLogin } = require('~/strategies');
const { updateInterfacePermissions } = require('~/models/interface');
const { checkMigrations } = require('./services/start/migration');
const initializeMCPs = require('./services/initializeMCPs');
const configureSocialLogins = require('./socialLogins');
const { getAppConfig } = require('./services/Config');
const staticCache = require('./utils/staticCache');
const noIndex = require('./middleware/noIndex');
const { seedDatabase } = require('~/models');
const routes = require('./routes');
const { checkConvoLimits } = require('./middleware');

const { PORT, HOST, ALLOW_SOCIAL_LOGIN, DISABLE_COMPRESSION, TRUST_PROXY } = process.env ?? {};

logger.info('Environment variables loaded:', {
  PORT,
  HOST,
  ALLOW_SOCIAL_LOGIN,
  DISABLE_COMPRESSION,
  TRUST_PROXY,
  NODE_ENV: process.env.NODE_ENV,
  DOMAIN_CLIENT: process.env.DOMAIN_CLIENT,
  DOMAIN_SERVER: process.env.DOMAIN_SERVER,
});

// Allow PORT=0 to be used for automatic free port assignment
const port = isNaN(Number(PORT)) ? 3080 : Number(PORT);
const host = HOST || 'localhost';
const trusted_proxy = Number(TRUST_PROXY) || 1; /* trust first proxy by default */

const app = express();

const startServer = async () => {
  if (typeof Bun !== 'undefined') {
    axios.defaults.headers.common['Accept-Encoding'] = 'gzip';
  }
  await connectDb();

  logger.info('Connected to MongoDB');
  indexSync().catch((err) => {
    logger.error('[indexSync] Background sync failed:', err);
  });

  app.disable('x-powered-by');
  app.set('trust proxy', trusted_proxy);

  await seedDatabase();
  const appConfig = await getAppConfig();
  initializeFileStorage(appConfig);
  await performStartupChecks(appConfig);
  await updateInterfacePermissions(appConfig);

  const indexPath = path.join(appConfig.paths.dist, 'index.html');
  let indexHTML = fs.readFileSync(indexPath, 'utf8');

  // In order to provide support to serving the application in a sub-directory
  // We need to update the base href if the DOMAIN_CLIENT is specified and not the root path
  if (process.env.DOMAIN_CLIENT) {
    const clientUrl = new URL(process.env.DOMAIN_CLIENT);
    const baseHref = clientUrl.pathname.endsWith('/')
      ? clientUrl.pathname
      : `${clientUrl.pathname}/`;
    if (baseHref !== '/') {
      logger.info(`Setting base href to ${baseHref}`);
      indexHTML = indexHTML.replace(/base href="\/"/, `base href="${baseHref}"`);
    }
  }

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  /* Middleware */
  app.use(noIndex);


  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  app.use(mongoSanitize());
  app.use(cors());
  app.use(cookieParser());

  if (!isEnabled(DISABLE_COMPRESSION)) {
    app.use(compression());
  } else {
    console.warn('Response compression has been disabled via DISABLE_COMPRESSION.');
  }

  app.use(staticCache(appConfig.paths.dist));
  app.use(staticCache(appConfig.paths.fonts));
  app.use(staticCache(appConfig.paths.assets));

  if (!ALLOW_SOCIAL_LOGIN) {
    console.warn('Social logins are disabled. Set ALLOW_SOCIAL_LOGIN=true to enable them.');
  }

  /* OAUTH */
  app.use(passport.initialize());
  passport.use(jwtLogin());
  passport.use(passportLogin());

  /* LDAP Auth */
  if (process.env.LDAP_URL && process.env.LDAP_USER_SEARCH_BASE) {
    passport.use(ldapLogin);
  }

  if (isEnabled(ALLOW_SOCIAL_LOGIN)) {
    await configureSocialLogins(app);
  }

  // Debug: Check which routes are undefined
  const routeChecks = [
    ['oauth', routes.oauth],
    ['auth', routes.auth],
    ['actions', routes.actions],
    ['keys', routes.keys],
    ['user', routes.user],
    ['search', routes.search],
    ['edit', routes.edit],
    ['messages', routes.messages],
    ['convos', routes.convos],
    ['presets', routes.presets],
    ['prompts', routes.prompts],
    ['categories', routes.categories],
    ['tokenizer', routes.tokenizer],
    ['endpoints', routes.endpoints],
    ['balance', routes.balance],
    ['models', routes.models],
    ['plugins', routes.plugins],
    ['config', routes.config],
    ['assistants', routes.assistants],
    ['staticRoute', routes.staticRoute],
    ['share', routes.share],
    ['roles', routes.roles],
    ['agents', routes.agents],
    ['banner', routes.banner],
    ['memories', routes.memories],
    ['accessPermissions', routes.accessPermissions],
    ['tags', routes.tags],
    ['mcp', routes.mcp],
    ['admin', routes.admin],
    ['voice', routes.voice],
    ['ads', routes.ads],
    ['sgsst', routes.sgsst],
    ['training', routes.training],
    ['wompi', routes.wompi],
    ['tenshi', routes.tenshi],
    ['tickets', routes.tickets],
    ['notifications', routes.notifications],
    ['contact', routes.contact],
    ['publicReports', routes.publicReports],
    ['liveDocuments', routes.liveDocuments],
    ['whatsapp', routes.whatsapp],
  ];

  for (const [name, route] of routeChecks) {
    if (!route) {
      logger.error(`ROUTE ERROR: routes.${name} is undefined!`);
      throw new Error(`Route ${name} is undefined`);
    }
  }

  app.use('/oauth', routes.oauth);
  /* API Endpoints */
  app.use('/api/auth', routes.auth);
  app.use('/api/actions', routes.actions);
  app.use('/api/keys', routes.keys);
  app.use('/api/user', routes.user);
  app.use('/api/search', routes.search);
  app.use('/api/edit', routes.edit);
  app.use('/api/messages', routes.messages);
  app.use('/api/convos', routes.convos);
  app.use('/api/presets', routes.presets);
  app.use('/api/prompts', routes.prompts);
  app.use('/api/categories', routes.categories);
  app.use('/api/tokenizer', routes.tokenizer);
  app.use('/api/endpoints', routes.endpoints);
  app.use('/api/balance', routes.balance);
  app.use('/api/models', routes.models);
  app.use('/api/plugins', routes.plugins);
  app.use('/api/config', routes.config);
  app.use('/api/assistants', routes.assistants);
  app.use('/api/files', await routes.files.initialize());
  app.use('/images/', createValidateImageRequest(appConfig.secureImageLinks), routes.staticRoute);
  app.use('/api/share', routes.share);
  app.use('/api/roles', routes.roles);
  app.use('/api/agents', routes.agents);
  app.use('/api/banner', routes.banner);
  app.use('/api/memories', routes.memories);
  app.use('/api/permissions', routes.accessPermissions);

  app.use('/api/tags', routes.tags);
  app.use('/api/mcp', routes.mcp);
  app.use('/api/admin', routes.admin);
  app.use('/api/voice', routes.voice);
  app.use('/api/ads', routes.ads);
  app.use('/api/sgsst/diagnostico', routes.sgsst.diagnostico);
  app.use('/api/sgsst/company-info', routes.sgsst.companyInfo);
  app.use('/api/sgsst/config', routes.sgsst.config);
  app.use('/api/sgsst/signatures', routes.sgsst.signatures);
  app.use('/api/sgsst/responsable', routes.sgsst.responsable);
  app.use('/api/sgsst/politica', routes.sgsst.politica);

  app.use('/api/sgsst/objetivos', routes.sgsst.objetivos);
  app.use('/api/sgsst/permiso-alturas', routes.sgsst.permisoAlturas);
  app.use('/api/sgsst/analisis-vulnerabilidad', routes.sgsst.analisisVulnerabilidad);
  app.use('/api/sgsst/reporte-actos', routes.sgsst.reporteActos);
  app.use('/api/sgsst/analisis-trabajo-seguro', routes.sgsst.analisisTrabajoSeguro);
  app.use('/api/sgsst/metodo-owas', routes.sgsst.metodoOwas);
  app.use('/api/sgsst/investigacion-atel', routes.sgsst.investigacionAtel);
  app.use('/api/sgsst/matriz', routes.sgsst.matriz);
  app.use('/api/sgsst/estadisticas', routes.sgsst.estadisticas);
  app.use('/api/sgsst/atel-data', routes.sgsst.atelData);
  app.use('/api/sgsst/matriz-peligros', routes.sgsst.matrizPeligros);
  app.use('/api/sgsst/perfiles-cargo', routes.sgsst.perfilesCargo);
  app.use('/api/sgsst/rhs', routes.sgsst.rhs);
  app.use('/api/sgsst/rit', routes.sgsst.rit);
  app.use('/api/sgsst/perfil-sociodemografico', routes.sgsst.perfilSociodemografico);
  app.use('/api/sgsst/predictivo', routes.sgsst.predictivo);
  app.use('/api/sgsst/participacion-ipevar', routes.sgsst.participacionIpevar);
  app.use('/api/sgsst/alta-direccion', routes.sgsst.altaDireccion);
  app.use('/api/sgsst/programa-capacitaciones', routes.sgsst.programaCapacitaciones);
  app.use('/api/sgsst/patch-agent-prompt', routes.sgsst.patchAgentPrompt);
  app.use('/api/sgsst/sync-agents', routes.sgsst.syncAgents);
  app.use('/api/sgsst/gtc45-workspace', routes.sgsst.gtc45Workspace);
  app.use('/api/sgsst/workers', routes.sgsst.workers);
  app.use('/api/sgsst/canvas', routes.sgsst.canvas);
  app.use('/api/live-editor', routes.sgsst.liveEditor);
  app.use('/api/live-analysis', routes.sgsst.liveEditor);
  app.use('/api/training', routes.training);
  app.use('/api/blog', routes.blog);
  app.use('/api/wompi', routes.wompi);
  app.use('/api/tenshi', routes.tenshi);
  app.use('/api/tickets', routes.tickets);
  app.use('/api/notifications', routes.notifications);
  app.use('/api/contact', routes.contact);
  app.use('/api/public-report', routes.publicReports);
  app.use('/api/public-sgsst', routes.publicSgsst);
  app.use('/api/live/documents', routes.liveDocuments);
  app.use('/api/live', routes.liveAiEdit);
  app.use('/api/roadmap', routes.roadmap);
  app.use('/api/whatsapp', routes.whatsapp);

  // TEMP MIGRATION ROUTE - REMOVE AFTER USE
  app.get('/api/temp-bulk-update-dates', async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const User = mongoose.model('User');
      const activeDate = new Date('2026-01-27T00:00:00.000Z');
      const inactiveDate = new Date();
      inactiveDate.setMonth(inactiveDate.getMonth() + 2);

      const result = await User.updateMany(
        { role: { $ne: 'ADMIN' } },
        {
          $set: {
            activeAt: activeDate,
            inactiveAt: inactiveDate
          }
        }
      );
      res.json({ message: 'Migration success', modifiedCount: result.modifiedCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Ruta de redirección limpia para Meta Ads y comunidad de WhatsApp
  app.get(['/comunidad', '/comunidad/'], (req, res) => {
    res.type('html');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAPPY IA - Comunidad</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #10B981;
            --primary-glow: rgba(16, 185, 129, 0.4);
            --accent: #8B5CF6;
            --background: #0B0F19;
            --card-bg: rgba(17, 24, 39, 0.7);
            --text-main: #F3F4F6;
            --text-muted: #9CA3AF;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--background);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
            position: relative;
        }

        /* Radial glow background */
        body::before {
            content: '';
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(0,0,0,0) 100%);
            top: -200px;
            right: -100px;
            z-index: 0;
            pointer-events: none;
        }

        body::after {
            content: '';
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(0,0,0,0) 100%);
            bottom: -200px;
            left: -100px;
            z-index: 0;
            pointer-events: none;
        }

        .container {
            z-index: 10;
            width: 100%;
            max-width: 480px;
            padding: 20px;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: translateY(0);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card:hover {
            transform: translateY(-5px);
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.1);
        }

        .logo-container {
            margin-bottom: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .logo-glow {
            position: absolute;
            width: 80px;
            height: 80px;
            background: var(--primary);
            filter: blur(25px);
            opacity: 0.3;
            border-radius: 50%;
            z-index: -1;
        }

        .logo-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 800;
            color: #FFF;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        h1 {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(to right, #FFF 30%, #E5E7EB 70%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }

        .tagline {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .features {
            text-align: left;
            margin-bottom: 35px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: #D1D5DB;
            margin-bottom: 12px;
        }

        .feature-item:last-child {
            margin-bottom: 0;
        }

        .feature-icon {
            color: var(--primary);
            font-size: 18px;
        }

        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, var(--primary) 0%, #059669 100%);
            color: #FFF;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            border-radius: 14px;
            box-shadow: 0 4px 12px var(--primary-glow);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            border: none;
            cursor: pointer;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.6);
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn::after {
            content: '';
            position: absolute;
            top: 0;
            left: -50%;
            width: 200%;
            height: 100%;
            background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.3) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-25deg);
            transition: 0.75s;
            opacity: 0;
        }

        .btn:hover::after {
            left: 125%;
            opacity: 1;
        }

        .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #4B5563;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo-container">
                <div class="logo-glow"></div>
                <div class="logo-icon">W</div>
            </div>
            <h1>Comunidad WAPPY</h1>
            <p class="tagline">Únete a nuestro espacio exclusivo para recibir soporte de IA de primer nivel, herramientas y recursos en primicia.</p>
            
            <div class="features">
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <span>Actualizaciones de IA en tiempo real</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">💬</span>
                    <span>Soporte prioritario y comunidad activa</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🚀</span>
                    <span>Acceso a plantillas y prompts VIP</span>
                </div>
            </div>

            <a href="https://chat.whatsapp.com/GBNl3SdtwcdLLjSeOtLnZy" target="_blank" class="btn">
                Unirme en WhatsApp
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
        <div class="footer">
            &copy; 2026 WAPPY IA. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>`);
  });

  app.use(ErrorController);

  app.use((req, res) => {
    res.set({
      'Cache-Control': process.env.INDEX_CACHE_CONTROL || 'no-cache, no-store, must-revalidate',
      Pragma: process.env.INDEX_PRAGMA || 'no-cache',
      Expires: process.env.INDEX_EXPIRES || '0',
    });

    const lang = req.cookies.lang || req.headers['accept-language']?.split(',')[0] || 'en-US';
    const saneLang = lang.replace(/"/g, '&quot;');
    let updatedIndexHtml = indexHTML.replace(/lang="en-US"/g, `lang="${saneLang}"`);

    res.type('html');
    res.send(updatedIndexHtml);
  });

  const server = app.listen(port, host, async () => {
    if (host === '0.0.0.0') {
      logger.info(
        `Server listening on all interfaces at port ${port}. Use http://localhost:${port} to access it`,
      );
    } else {
      logger.info(`Server listening at http://${host == '0.0.0.0' ? 'localhost' : host}:${port}`);
    }

    await initializeMCPs();
    await initializeOAuthReconnectManager();
    await checkMigrations();

    // Start background poller for async payment methods (e.g. Compra y Paga Después / Bancolombia BNPL)
    const { startWompiPoller } = require('./services/wompiPendingPoller');
    startWompiPoller();

    // Boot WhatsApp Sessions OpenClaw Architecture
    const whatsappManager = require('./whatsapp/WhatsAppManager');
    await whatsappManager.bootSavedSessions();
  });

  // Setup WebSocket server for voice conversations
  const setupVoiceWebSocket = require('./voiceWebSocket');
  const setupLiveAnalysisWebSocket = require('./liveAnalysisWebSocket');
  setupVoiceWebSocket(server);
  setupLiveAnalysisWebSocket(server);
};

startServer();

let messageCount = 0;
process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    logger.error('There was an uncaught error:', err);
  }

  if (err.message.includes('abort')) {
    logger.warn('There was an uncatchable AbortController error.');
    return;
  }

  if (err.message.includes('GoogleGenerativeAI')) {
    logger.warn(
      '\n\n`GoogleGenerativeAI` errors cannot be caught due to an upstream issue, see: https://github.com/google-gemini/generative-ai-js/issues/303',
    );
    return;
  }

  if (err.message.includes('fetch failed')) {
    if (messageCount === 0) {
      logger.warn('Meilisearch error, search will be disabled');
      messageCount++;
    }

    return;
  }

  if (err.message.includes('OpenAIError') || err.message.includes('ChatCompletionMessage')) {
    logger.error(
      '\n\nAn Uncaught `OpenAIError` error may be due to your reverse-proxy setup or stream configuration, or a bug in the `openai` node package.',
    );
    return;
  }

  process.exit(1);
});

/** Export app for easier testing purposes */
module.exports = app;
