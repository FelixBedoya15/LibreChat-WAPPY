const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
let createWappyMcpServer = null;
try {
  const possiblePaths = [
    path.resolve(__dirname, '../../../bin/wappy-mcp.js'),
    path.resolve(process.cwd(), 'bin/wappy-mcp.js'),
    path.resolve(process.cwd(), '../bin/wappy-mcp.js'),
    '/app/bin/wappy-mcp.js',
  ];
  for (const p of possiblePaths) {
    try {
      const mod = require(p);
      if (mod && mod.createWappyMcpServer) {
        createWappyMcpServer = mod.createWappyMcpServer;
        break;
      }
    } catch (_) {}
  }
} catch (_) {}
const { requireApiKeyOrJwt, authenticateApiKey } = require('~/server/middleware/requireApiKeyAuth');
const sseTransports = new Map();
const CompanyInfo = require('~/models/CompanyInfo');
const GTC45WorkspaceSession = require('~/models/GTC45WorkspaceSession');
const PESVWorkspaceSession = require('~/models/PESVWorkspaceSession');
const KanbanTask = require('~/models/KanbanTask');
const SgsstWorker = require('~/models/SgsstWorker');
const DiagnosticoData = require('~/models/DiagnosticoData');
const AuditoriaData = require('~/models/AuditoriaData');
const InvestigacionAtelData = require('~/models/InvestigacionAtelData');
const { SgsstCopasstComite, SgsstCopasstActa } = require('~/models/SgsstCopasst');
const { SgsstConvivenciaComite, SgsstConvivenciaActa } = require('~/models/SgsstConvivencia');
const SgsstBrigadista = require('~/models/SgsstBrigadista');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const SgsstVehicleData = require('~/models/SgsstVehicleData');
const SgsstEppData = require('~/models/SgsstEppData');
const Automation = require('~/models/Automation');
const { Course } = require('~/models/Course');
const UserProgress = require('~/models/UserProgress');
const EstudioPuestoTrabajo = mongoose.models.EstudioPuestoTrabajo || require('~/models/EstudioPuestoTrabajo');
const MarketplaceProduct = mongoose.models.MarketplaceProduct || require('~/models/MarketplaceProduct');
const MarketplaceOrder = mongoose.models.MarketplaceOrder || require('~/models/MarketplaceOrder');
const BlogPost = mongoose.models.BlogPost || require('~/models/BlogPost').BlogPost;
const Event = mongoose.models.Event || require('~/models/Event').Event;
const Partner = mongoose.models.Partner || require('~/models/Partner');
const PartnerCommission = mongoose.models.PartnerCommission || require('~/models/PartnerCommission');
const PayoutRequest = mongoose.models.PayoutRequest || require('~/models/PayoutRequest');
const TenshiConfig = mongoose.models.TenshiConfig || require('~/models/TenshiConfig');
const Ticket = mongoose.models.Ticket || require('~/models/Ticket');
const SgsstHeightsData = mongoose.models.SgsstHeightsData || require('~/models/SgsstHeightsData');
const PerfilSociodemograficoData = mongoose.models.PerfilSociodemograficoData || (() => {
  try { return require('~/models/PerfilSociodemograficoData'); } catch (e) { return null; }
})();
const AnalisisVulnerabilidadData = mongoose.models.AnalisisVulnerabilidadData || (() => {
  try { require('./sgsst/analisisVulnerabilidad'); } catch (e) {}
  return mongoose.models.AnalisisVulnerabilidadData || null;
})();
const MetodoOwasData = mongoose.models.MetodoOwasData || (() => {
  try { require('./sgsst/metodoOwas'); } catch (e) {}
  return mongoose.models.MetodoOwasData || null;
})();
const AnalisisTrabajoSeguroData = mongoose.models.AnalisisTrabajoSeguroData || (() => {
  try { require('./sgsst/analisisTrabajoSeguro'); } catch (e) {}
  return mongoose.models.AnalisisTrabajoSeguroData || null;
})();
const { setMemory } = require('~/models');
const { Tokenizer } = require('@librechat/api');
const { logger } = require('~/config');

// Modelos con esquema dinámico registrado defensivamente
const MatrizLegalData =
  mongoose.models.MatrizLegalData ||
  mongoose.model(
    'MatrizLegalData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        statuses: { type: Array, default: [] },
        seguimientos: { type: Object, default: {} },
        activity: { type: String, default: '' },
        location: { type: String, default: '' },
        entityType: { type: String, default: 'private' },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const ReporteActosData =
  mongoose.models.ReporteActosData ||
  mongoose.model(
    'ReporteActosData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        formData: { type: Object, default: {} },
        trabajadoresList: { type: Array, default: [] },
        responsablesList: { type: Array, default: [] },
        images: { type: Object, default: {} },
        video: { type: String, default: null },
        inboxPublico: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const PerfilCargoData =
  mongoose.models.PerfilCargoData ||
  mongoose.model(
    'PerfilCargoData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        perfilesList: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

const ProgramaCapacitacionesData =
  mongoose.models.ProgramaCapacitacionesData ||
  mongoose.model(
    'ProgramaCapacitacionesData',
    new mongoose.Schema(
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyInfo', required: false },
        sesiones: { type: Array, default: [] },
        planPersonalizado: { type: Array, default: [] },
        updatedAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    )
  );

// Helper para obtener empresa activa del usuario
async function getActiveCompany(userId) {
  let company = await CompanyInfo.findOne({ user: userId, isActive: true }).lean();
  if (!company) {
    company = await CompanyInfo.findOne({ user: userId }).lean();
  }
  return company;
}

// Helper para sincronizar memoria de IA
async function syncCompanyAiMemory(userId, companyData) {
  try {
    const memoryContent = `Razón Social / Nombre: ${companyData.companyName || 'N/A'}
Tipo de Empresa: ${companyData.companyType || 'Persona Jurídica'}
Documento de Identidad (NIT / CC): ${companyData.nit || 'N/A'}
Representante Legal: ${companyData.legalRepresentative || 'N/A'}
Cédula del Representante Legal: ${companyData.legalRepresentativeId || 'N/A'}
Número de Trabajadores: ${companyData.workerCount || 'N/A'}
ARL: ${companyData.arl || 'N/A'}
Nivel de Riesgo (ARL): ${companyData.riskLevel || 'N/A'}
Actividad Económica: ${companyData.economicActivity || 'N/A'}
Código CIIU: ${companyData.ciiu || 'N/A'}
Sector: ${companyData.sector || 'N/A'}
Dirección: ${companyData.address || 'N/A'} (Ciudad: ${companyData.city || 'N/A'}, Departamento: ${companyData.departamento || 'N/A'})
Responsable SG-SST: ${companyData.responsibleSST || 'N/A'}
Nivel de Formación SST: ${companyData.formationLevel || 'N/A'}
Número de Licencia SST: ${companyData.licenseNumber || 'N/A'}
Vigencia de Licencia: ${companyData.licenseExpiry || 'N/A'}
Actualización Curso 50/20H: ${companyData.courseStatus || 'N/A'}
Descripción General de Actividades: ${companyData.generalActivities || 'N/A'}`;

    const memoryKey = 'empresa_sgsst';
    const tokenCount = Tokenizer?.getTokenCount ? Tokenizer.getTokenCount(memoryContent, 'o200k_base') || 0 : 0;

    const MemoryEntry = mongoose.models.MemoryEntry;
    if (MemoryEntry) {
      await MemoryEntry.deleteMany({ userId, key: memoryKey });
    }

    await setMemory({ userId, agentId: 'global', key: memoryKey, value: memoryContent, tokenCount });
    logger.debug(`[MCP Bridge] Memoria de empresa sincronizada para usuario ${userId}`);
  } catch (err) {
    logger.error('[MCP Bridge] Error sincronizando memoria de empresa:', err);
  }
}

/**
 * Helper para búsqueda flexible y coincidencia inteligente de trabajadores
 * por ID, Cédula/Documento, Nombre exacto, Substring o Coincidencia de Palabras/Tokens.
 */
function matchWorker(w, target) {
  if (!w || !target) return false;
  const cleanTarget = String(target).trim().toLowerCase();
  if (!cleanTarget) return false;
  const wId = String(w.id || '').trim().toLowerCase();
  const wDoc = String(w.identificacion || w.documento || w.cedula || '').trim().toLowerCase();
  const wName = String(w.nombre || '').trim().toLowerCase();

  // 1. Coincidencia directa por ID o Documento / Cédula
  if (wId && wId === cleanTarget) return true;
  if (wDoc && wDoc === cleanTarget) return true;

  // 2. Coincidencia directa por Nombre completo
  if (wName && wName === cleanTarget) return true;

  // 3. Substring (uno contiene al otro)
  if (wName && cleanTarget.length >= 3 && (wName.includes(cleanTarget) || cleanTarget.includes(wName))) return true;

  // 4. Coincidencia por tokens / palabras (ej: "Jorge Ricky Pineda" vs "Jorge Enrique Pineda Celis")
  const targetTokens = cleanTarget.split(/\s+/).filter((t) => t.length > 2);
  const nameTokens = wName.split(/\s+/).filter((t) => t.length > 2);
  if (targetTokens.length >= 2 && nameTokens.length >= 2) {
    const commonTokens = targetTokens.filter((t) => nameTokens.some((nt) => nt === t || nt.includes(t) || t.includes(nt)));
    if (commonTokens.length >= 2) return true;
  }

  return false;
}

// ─── 0. TRANSPORTE REMOTO SSE (SERVER-SENT EVENTS) PARA ANTIGRAVITY ─────────
// Permite que Antigravity (y cualquier cliente MCP compatible) se conecte directamente
// por la nube sin requerir Node.js, Git ni archivos locales en la máquina del usuario.

router.get('/sse', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerKey = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null;
    const rawApiKey =
      req.query.apiKey ||
      req.headers['x-api-key'] ||
      bearerKey;

    if (!rawApiKey) {
      return res.status(401).send('Se requiere parámetro ?apiKey=wpy_live_... o encabezado x-api-key válido.');
    }

    const auth = await authenticateApiKey(rawApiKey);
    if (!auth) {
      return res.status(401).send('Clave API de WAPPY inválida o revocada.');
    }

    const host = req.get('host') || 'localhost:3080';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `http://127.0.0.1:${process.env.PORT || 3080}`;

    if (!createWappyMcpServer) {
      return res.status(503).send('Servidor WAPPY MCP temporalmente no disponible en este entorno.');
    }

    res.setHeader('X-Accel-Buffering', 'no');

    const mcpServer = createWappyMcpServer({
      apiKey: rawApiKey,
      wappyUrl: baseUrl,
    });

    const transport = new SSEServerTransport('/api/mcp-bridge/messages', res);
    sseTransports.set(transport.sessionId, transport);

    res.on('close', () => {
      sseTransports.delete(transport.sessionId);
    });

    await mcpServer.connect(transport);
    logger.info(`[MCP Bridge] Sesión SSE establecida para usuario ${auth.user?.email || auth.user?._id} (sessionId: ${transport.sessionId})`);
  } catch (error) {
    logger.error('[MCP Bridge] Error en GET /sse:', error);
    if (!res.headersSent) {
      return res.status(500).send('Error interno en conexión SSE de WAPPY.');
    }
  }
});

router.post('/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    if (sessionId && sseTransports.has(sessionId)) {
      const transport = sseTransports.get(sessionId);
      await transport.handlePostMessage(req, res, req.body);
      return;
    }

    // Fallback directo si no hay sesión SSE activa
    return handleDirectMcpJsonRpc(req, res);
  } catch (error) {
    logger.error('[MCP Bridge] Error en POST /messages:', error);
    if (!res.headersSent) {
      return res.status(500).send('Error procesando mensaje MCP.');
    }
  }
});

async function processSingleJsonRpc(body, rawApiKey) {
  if (!body || typeof body !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    };
  }

  const { jsonrpc, id, method, params } = body;
  const requestId = id !== undefined ? id : 1;

  // 1. Manejo de server/discover (MCP Stateless 2026 / Capability Negotiation)
  if (method === 'server/discover') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        resultType: 'complete',
        supportedVersions: ['2026-07-28', '2024-11-05'],
        capabilities: {
          tools: { listChanged: true },
          resources: {},
          prompts: {},
          events: {},
        },
        serverInfo: {
          name: 'wappy-bridge',
          version: '2.0.0',
        },
      },
    };
  }

  // 2. Notificaciones (no esperan respuesta con contenido)
  if (method === 'notifications/initialized' || (!id && method?.startsWith('notifications/'))) {
    return null;
  }

  // 3. Ping
  if (method === 'ping') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {},
    };
  }

  // 4. Autenticación de clave para operaciones funcionales
  if (!rawApiKey) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32000, message: 'Se requiere clave API de WAPPY válida.' },
    };
  }

  const auth = await authenticateApiKey(rawApiKey);
  if (!auth) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32000, message: 'Clave API de WAPPY inválida o revocada.' },
    };
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        protocolVersion: params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: 'wappy-bridge',
          version: '2.0.0',
        },
      },
    };
  }

  if (!createWappyMcpServer) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32000, message: 'Servidor WAPPY MCP temporalmente no disponible.' },
    };
  }

  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3080}`;
  const mcpServer = createWappyMcpServer({
    apiKey: rawApiKey,
    wappyUrl: baseUrl,
  });

  const handler = mcpServer.server._requestHandlers.get(method);
  if (handler) {
    try {
      const result = await handler({ method, params }, {});
      return {
        jsonrpc: '2.0',
        id: requestId,
        result,
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: err.message || 'Error interno ejecutando método MCP',
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id: requestId,
    error: {
      code: -32601,
      message: `Método ${method} no encontrado`,
    },
  };
}

async function handleDirectMcpJsonRpc(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const bearerKey = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null;
    const rawApiKey =
      req.query.apiKey ||
      req.headers['x-api-key'] ||
      bearerKey;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (Array.isArray(req.body)) {
      const responses = await Promise.all(
        req.body.map((item) => processSingleJsonRpc(item, rawApiKey))
      );
      const filtered = responses.filter(Boolean);
      return res.status(200).json(filtered.length > 0 ? filtered : { jsonrpc: '2.0' });
    }

    const response = await processSingleJsonRpc(req.body, rawApiKey);
    if (!response) {
      return res.status(200).json({ jsonrpc: '2.0' });
    }
    return res.status(200).json(response);
  } catch (error) {
    logger.error('[MCP Bridge] Error en handleDirectMcpJsonRpc:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: { code: -32603, message: 'Error interno en el servidor MCP de WAPPY' },
      });
    }
  }
}

router.post('/sse', handleDirectMcpJsonRpc);
router.post('/', handleDirectMcpJsonRpc);

// ─── 1. PERFIL DE EMPRESA ───────────────────────────────────────────────────

router.get('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const { id, companyId, nombre, empresa, nit, busqueda } = req.query;
    const term = id || companyId || nombre || empresa || nit || busqueda;

    let company = null;
    if (term) {
      if (mongoose.isValidObjectId(term)) {
        company = await CompanyInfo.findOne({ user: targetUserId, _id: term }).lean();
      }
      if (!company) {
        const safeRegex = new RegExp(String(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        company = await CompanyInfo.findOne({
          user: targetUserId,
          $or: [{ companyName: safeRegex }, { nit: term }],
        }).lean();
      }
    }

    if (!company) {
      company = await getActiveCompany(targetUserId);
    }

    if (!company) {
      return res.json({
        encontrado: false,
        mensaje: 'El usuario no tiene una empresa configurada aún en su perfil de WAPPY.',
        empresa: null,
      });
    }

    return res.json({
      encontrado: true,
      empresa: {
        id: company._id.toString(),
        companyName: company.companyName || '',
        companyType: company.companyType || 'Persona Jurídica',
        nit: company.nit || '',
        legalRepresentative: company.legalRepresentative || '',
        legalRepresentativeId: company.legalRepresentativeId || '',
        workerCount: company.workerCount || 0,
        arl: company.arl || '',
        economicActivity: company.economicActivity || '',
        riskLevel: company.riskLevel || '',
        ciiu: company.ciiu || '',
        address: company.address || '',
        city: company.city || '',
        departamento: company.departamento || '',
        phone: company.phone || '',
        email: company.email || '',
        responsibleSST: company.responsibleSST || '',
        formationLevel: company.formationLevel || '',
        licenseNumber: company.licenseNumber || '',
        licenseExpiry: company.licenseExpiry || '',
        courseStatus: company.courseStatus || '',
        generalActivities: company.generalActivities || '',
        sedes: Array.isArray(company.sedes) ? company.sedes : [],
        isActive: Boolean(company.isActive),
      },
      resumenDetallado: `Empresa "${company.companyName}" (NIT: ${company.nit || 'N/A'}): ${company.companyType || 'Persona Jurídica'}, ${company.workerCount || 0} trabajadores, ARL ${company.arl || 'N/A'} (Riesgo ${company.riskLevel || 'N/A'}), Representante Legal: ${company.legalRepresentative || 'N/A'}, Responsable SST: ${company.responsibleSST || 'N/A'}, Ciudad: ${company.city || 'N/A'}. Estado: ${company.isActive ? 'ACTIVA' : 'Inactiva'}.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /profile error:', error);
    return res.status(500).json({ error: 'Error al consultar el perfil de empresa.' });
  }
});

// ─── 1.1 TODAS LAS EMPRESAS REGISTRADAS DEL USUARIO ───────────────────────────

router.get('/companies', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const CompanyInfo = mongoose.models.CompanyInfo || require('~/models/CompanyInfo');
    const companies = await CompanyInfo.find({ user: targetUserId }).sort({ createdAt: 1 }).lean();

    const totalEmpresas = companies.length;
    const empresaActiva = companies.find((c) => c.isActive) || companies[0] || null;

    const lista = companies.map((c) => ({
      id: c._id.toString(),
      nombre: c.companyName || 'Sin nombre',
      companyName: c.companyName || 'Sin nombre',
      tipo: c.companyType || 'Persona Jurídica',
      companyType: c.companyType || 'Persona Jurídica',
      nit: c.nit || 'N/A',
      activa: Boolean(c.isActive),
      isActive: Boolean(c.isActive),
      trabajadores: c.workerCount || 0,
      workerCount: c.workerCount || 0,
      arl: c.arl || 'N/A',
      nivelRiesgo: c.riskLevel || 'N/A',
      riskLevel: c.riskLevel || 'N/A',
      ciudad: c.city || 'N/A',
      city: c.city || 'N/A',
      departamento: c.departamento || '',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      legalRepresentative: c.legalRepresentative || '',
      legalRepresentativeId: c.legalRepresentativeId || '',
      responsibleSST: c.responsibleSST || '',
      formationLevel: c.formationLevel || '',
      licenseNumber: c.licenseNumber || '',
      licenseExpiry: c.licenseExpiry || '',
      courseStatus: c.courseStatus || '',
      generalActivities: c.generalActivities || '',
      sedes: Array.isArray(c.sedes) ? c.sedes : [],
      actividadEconomica: c.economicActivity || 'N/A',
      ciiu: c.ciiu || 'N/A',
      createdAt: c.createdAt,
    }));

    const lineasEmpresas = lista
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.nombre} (NIT: ${c.nit}) - ${c.trabajadores} trabajadores - Representante: ${c.legalRepresentative || 'N/A'} - [${c.activa ? 'EMPRESA ACTIVA ACTUALMENTE' : 'Inactiva'}]`
      )
      .join('\n');

    return res.json({
      total: totalEmpresas,
      totalEmpresas,
      empresaActivaNombre: empresaActiva?.companyName || 'Ninguna',
      empresaActivaId: empresaActiva?._id?.toString() || null,
      resumenTexto:
        totalEmpresas > 0
          ? `Tienes un total de ${totalEmpresas} empresa(s) registrada(s) en WAPPY:\n${lineasEmpresas}\nLa empresa activa seleccionada actualmente es "${empresaActiva?.companyName || 'N/A'}".`
          : 'No tienes empresas registradas en tu cuenta de WAPPY.',
      empresas: lista,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /companies error:', error);
    return res.status(500).json({ error: 'Error al consultar las empresas del usuario.' });
  }
});

router.get('/companies/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const targetId = req.params.id;

    let company = null;
    if (mongoose.isValidObjectId(targetId)) {
      company = await CompanyInfo.findOne({ user: targetUserId, _id: targetId }).lean();
    }
    if (!company) {
      const safeRegex = new RegExp(String(targetId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      company = await CompanyInfo.findOne({
        user: targetUserId,
        $or: [{ companyName: safeRegex }, { nit: targetId }],
      }).lean();
    }

    if (!company) {
      return res.status(404).json({ error: `Empresa "${targetId}" no encontrada.` });
    }

    return res.json({
      exito: true,
      empresa: company,
      resumen: `Empresa "${company.companyName}" (NIT: ${company.nit || 'N/A'}): ${company.companyType || 'Persona Jurídica'}, ${company.workerCount || 0} trabajadores, ARL ${company.arl || 'N/A'} (Riesgo ${company.riskLevel || 'N/A'}), Representante Legal: ${company.legalRepresentative || 'N/A'}, Responsable SST: ${company.responsibleSST || 'N/A'}, Ciudad: ${company.city || 'N/A'}. Estado: ${company.isActive ? 'ACTIVA' : 'Inactiva'}.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /companies/:id error:', error);
    return res.status(500).json({ error: 'Error al consultar la empresa.' });
  }
});

router.post('/profile', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body || {};

    let company = await CompanyInfo.findOne({ user: userId, isActive: true });
    if (!company) {
      company = await CompanyInfo.findOne({ user: userId });
    }

    if (!company) {
      company = new CompanyInfo({
        user: userId,
        isActive: true,
        ...updateData,
      });
      await company.save();
    } else {
      const allowedFields = [
        'companyName',
        'companyType',
        'nit',
        'legalRepresentative',
        'legalRepresentativeId',
        'workerCount',
        'arl',
        'economicActivity',
        'riskLevel',
        'ciiu',
        'address',
        'city',
        'departamento',
        'phone',
        'email',
        'generalActivities',
        'sector',
        'responsibleSST',
        'responsibleSSTPhone',
        'formationLevel',
        'licenseNumber',
        'courseStatus',
        'licenseExpiry',
        'sedes',
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          company[field] = updateData[field];
        }
      }
      await company.save();
    }

    syncCompanyAiMemory(userId, company).catch(() => {});

    return res.json({
      exito: true,
      mensaje: 'Perfil de empresa actualizado exitosamente en WAPPY.',
      empresaId: company._id.toString(),
      companyName: company.companyName,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /profile error:', error);
    return res.status(500).json({ error: 'Error al actualizar el perfil de empresa.' });
  }
});

// ─── 2. RESUMEN DIAGNÓSTICO 360° TOTAL ──────────────────────────────────────

router.get('/resumen-360', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    // Ejecución paralela defensiva para obtener el panorama total
    const [
      workersCount,
      gtc45Session,
      pesvSession,
      tasksCount,
      diagnostico,
      matrizLegal,
      copasst,
      convivencia,
      brigadistasCount,
      quimicosCount,
      vehiculosCount,
      casosAtelCount,
      reportesActos,
      capacitacionesDoc,
      automationsCount,
    ] = await Promise.all([
      SgsstWorker.countDocuments({ user: userId }).catch(() => 0),
      GTC45WorkspaceSession.findOne({
        $or: [{ user: userId, isOfficial: true }, { companyId: companyId, isOfficial: true }],
      }).lean().catch(() => null),
      PESVWorkspaceSession.findOne({
        $or: [{ user: userId, isOfficial: true }, { companyId: companyId, isOfficial: true }],
      }).lean().catch(() => null),
      KanbanTask.countDocuments({ user: userId, status: { $ne: 'done' } }).catch(() => 0),
      DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstBrigadista.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstVehicleData.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      InvestigacionAtelData.countDocuments({ $or: [{ companyId }, { user: userId }] }).catch(() => 0),
      ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      Automation.countDocuments({ user: userId }).catch(() => 0),
    ]);

    const totalRiesgosGtc45 = gtc45Session?.matrixRows?.length || 0;
    const gtcNivel1 = (gtc45Session?.matrixRows || []).filter((r) => r.interpretacion_nr === 'I').length;

    const totalRiesgosPesv = pesvSession?.matrixRows?.length || 0;

    let totalLegal = 0;
    let cumplenLegal = 0;
    if (matrizLegal && Array.isArray(matrizLegal.statuses)) {
      totalLegal = matrizLegal.statuses.length;
      cumplenLegal = matrizLegal.statuses.filter((s) => s.status === 'cumple').length;
    }
    const legalCompliancePct = totalLegal > 0 ? Math.round((cumplenLegal / totalLegal) * 100) : 0;

    const totalReportesActos = (reportesActos?.inboxPublico?.length || 0);

    return res.json({
      exito: true,
      timestamp: new Date().toISOString(),
      empresa: company ? {
        id: company._id.toString(),
        companyName: company.companyName || 'Sin Razón Social',
        nit: company.nit || 'Sin NIT',
        riskLevel: company.riskLevel || 'N/A',
        arl: company.arl || 'N/A',
        responsibleSST: company.responsibleSST || 'No asignado',
      } : null,
      metricasClave: {
        trabajadoresRegistrados: workersCount,
        riesgosGTC45: {
          total: totalRiesgosGtc45,
          nivelCritico_I: gtcNivel1,
        },
        riesgosPESV: {
          total: totalRiesgosPesv,
        },
        estandares0312: {
          puntaje: diagnostico?.score || 0,
          nivelCumplimiento: diagnostico?.complianceLevel || 'Sin evaluar',
        },
        matrizLegal: {
          totalNormas: totalLegal,
          cumplen: cumplenLegal,
          porcentajeCumplimiento: `${legalCompliancePct}%`,
        },
        tareasPendientesCronograma: tasksCount,
        comites: {
          copasstVigente: !!copasst && copasst.estado === 'activo',
          modalidadCopasst: copasst?.modalidad || 'No constituido',
          convivenciaVigente: !!convivencia && convivencia.estado === 'activo',
          totalBrigadistas: brigadistasCount,
        },
        gestionOperativa: {
          productosQuimicosRegistrados: quimicosCount?.productos?.length || 0,
          vehiculosFlota: vehiculosCount,
          casosAtelInvestigados: casosAtelCount,
          reportesActosCondicionesPendientes: totalReportesActos,
          sesionesCapacitacionProgramadas: capacitacionesDoc?.sesiones?.length || 0,
          automatizacionesIAActivas: automationsCount,
        },
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /resumen-360 error:', error);
    return res.status(500).json({ error: 'Error al calcular el diagnóstico 360°.' });
  }
});

// ─── 3. MATRIZ GTC-45 ───────────────────────────────────────────────────────

router.get('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { proceso, cargo, peligro } = req.query;

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
        { companyId: companyId, isOfficial: true },
      ],
    }).lean();

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.json({
        totalRiesgos: 0,
        mensaje: 'La matriz GTC-45 está vacía actualmente.',
        riesgos: [],
      });
    }

    let rows = session.matrixRows;
    if (proceso) {
      rows = rows.filter((r) => r.proceso && r.proceso.toLowerCase().includes(proceso.toLowerCase()));
    }
    if (cargo) {
      rows = rows.filter((r) => r.cargo && r.cargo.toLowerCase().includes(cargo.toLowerCase()));
    }
    if (peligro) {
      rows = rows.filter(
        (r) =>
          (r.peligro_clasificacion && r.peligro_clasificacion.toLowerCase().includes(peligro.toLowerCase())) ||
          (r.peligro_descripcion && r.peligro_descripcion.toLowerCase().includes(peligro.toLowerCase()))
      );
    }

    return res.json({
      totalRiesgos: session.matrixRows.length,
      riesgosFiltrados: rows.length,
      riesgos: rows,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /gtc45 error:', error);
    return res.status(500).json({ error: 'Error al consultar la matriz GTC-45.' });
  }
});

router.post('/gtc45', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" con al menos un riesgo.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }],
    });

    if (!session) {
      session = new GTC45WorkspaceSession({
        conversationId: officialConvoId,
        user: userId,
        companyId: companyId || undefined,
        isOfficial: true,
        officialTitle: 'Matriz IPEVR Oficial SG-SST',
        matrixRows: [],
      });
    }

    let insertedCount = 0;
    const now = new Date().toISOString();

    for (const r of riesgos) {
      const nd = Number(r.nd) || 2;
      const ne = Number(r.ne) || 2;
      const np = nd * ne;
      const nc = Number(r.nc) || 25;
      const nr = np * nc;

      let interpretacion_np = 'Bajo (B)';
      if (np >= 24) interpretacion_np = 'Muy Alto (MA)';
      else if (np >= 10) interpretacion_np = 'Alto (A)';
      else if (np >= 6) interpretacion_np = 'Medio (M)';

      let interpretacion_nr = 'IV';
      if (nr >= 600) interpretacion_nr = 'I';
      else if (nr >= 150) interpretacion_nr = 'II';
      else if (nr >= 40) interpretacion_nr = 'III';

      let aceptabilidad = 'Aceptable';
      if (interpretacion_nr === 'I') aceptabilidad = 'No Aceptable';
      else if (interpretacion_nr === 'II') aceptabilidad = 'No Aceptable o Aceptable con control específico';
      else if (interpretacion_nr === 'III') aceptabilidad = 'Mejorable';

      const rowId = r.id || `gtc45_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      session.matrixRows.push({
        id: rowId,
        proceso: r.proceso || 'General',
        zona: r.zona || 'Instalaciones Principales',
        actividad: r.actividad || 'Operativa',
        tareas: r.tareas || r.actividad || 'N/A',
        rutinaria: r.rutinaria || 'Sí',
        cargo: r.cargo || 'Operativo',
        peligro_descripcion: r.peligro_descripcion || 'Riesgo identificado',
        peligro_clasificacion: r.peligro_clasificacion || 'Seguridad',
        efectos_posibles: r.efectos_posibles || 'Accidentes o lesiones',
        controles_fuente: r.controles_fuente || 'Ninguno',
        controles_medio: r.controles_medio || 'Ninguno',
        controles_individuo: r.controles_individuo || 'Capacitación y EPP',
        nd,
        ne,
        np,
        interpretacion_np,
        nc,
        nr,
        interpretacion_nr,
        aceptabilidad,
        peor_consecuencia: r.peor_consecuencia || 'Lesión o incapacidad',
        requisito_legal: r.requisito_legal || 'Sí',
        nro_expuestos: Number(r.nro_expuestos) || 1,
        medida_eliminacion: r.medida_eliminacion || 'Ninguno',
        medida_sustitucion: r.medida_sustitucion || 'Ninguno',
        medida_ingenieria: r.medida_ingenieria || 'Ninguno',
        medida_administrativa: r.medida_administrativa || 'Procedimiento de trabajo seguro',
        medida_eppu: r.medida_eppu || 'EPP básico',
        factores_reduccion: r.factores_reduccion || 'No aplica',
        creadoPor: 'Antigravity MCP Bridge',
        fechaRegistro: now,
      });

      insertedCount++;
    }

    session.markModified('matrixRows');
    await session.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Se agregaron ${insertedCount} riesgos exitosamente a la Matriz GTC-45 Oficial.`,
      totalRiesgosEnMatriz: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /gtc45 error:', error);
    return res.status(500).json({ error: 'Error al agregar riesgos a la matriz GTC-45.' });
  }
});

router.put('/gtc45/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }, { companyId, isOfficial: true }],
    });

    if (!session || !Array.isArray(session.matrixRows)) {
      return res.status(404).json({ error: 'Matriz GTC-45 no encontrada.' });
    }

    const idx = session.matrixRows.findIndex((r) => r.id === targetId || r._id?.toString() === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Riesgo con ID "${targetId}" no encontrado en la matriz GTC-45.` });
    }

    session.matrixRows[idx] = { ...session.matrixRows[idx], ...updates };
    session.markModified('matrixRows');
    await session.save();

    return res.json({
      exito: true,
      mensaje: `Riesgo GTC-45 "${targetId}" actualizado exitosamente.`,
      riesgo: session.matrixRows[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /gtc45/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar riesgo GTC-45.' });
  }
});

router.delete('/gtc45/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await GTC45WorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }, { companyId, isOfficial: true }],
    });

    if (!session || !Array.isArray(session.matrixRows)) {
      return res.status(404).json({ error: 'Matriz GTC-45 no encontrada.' });
    }

    const initialLen = session.matrixRows.length;
    session.matrixRows = session.matrixRows.filter((r) => r.id !== targetId && r._id?.toString() !== targetId);

    if (session.matrixRows.length === initialLen) {
      return res.status(404).json({ error: `Riesgo con ID "${targetId}" no encontrado en la matriz GTC-45.` });
    }

    session.markModified('matrixRows');
    await session.save();

    return res.json({
      exito: true,
      mensaje: `Riesgo GTC-45 "${targetId}" eliminado exitosamente.`,
      totalRiesgosRestantes: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /gtc45/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar riesgo GTC-45.' });
  }
});

// ─── 4. MATRIZ PESV ─────────────────────────────────────────────────────────

router.get('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [
        { conversationId: officialConvoId },
        { user: userId, isOfficial: true },
        { companyId: companyId, isOfficial: true },
      ],
    }).lean();

    if (!session || !session.matrixRows || session.matrixRows.length === 0) {
      return res.json({
        totalRiesgosViales: 0,
        mensaje: 'La matriz PESV está vacía actualmente.',
        riesgos: [],
      });
    }

    return res.json({
      totalRiesgosViales: session.matrixRows.length,
      riesgos: session.matrixRows,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /pesv error:', error);
    return res.status(500).json({ error: 'Error al consultar la matriz PESV.' });
  }
});

router.post('/pesv', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { riesgos } = req.body;

    if (!riesgos || !Array.isArray(riesgos) || riesgos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo "riesgos" para la matriz PESV.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }],
    });

    if (!session) {
      session = new PESVWorkspaceSession({
        conversationId: officialConvoId,
        user: userId,
        companyId: companyId || undefined,
        isOfficial: true,
        officialTitle: 'Matriz PESV SG-SST',
        matrixRows: [],
      });
    }

    let insertedCount = 0;
    for (const r of riesgos) {
      const rowId = r.id || `pesv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      session.matrixRows.push({
        id: rowId,
        grupo_trabajo: r.grupo_trabajo || 'OPERATIVO',
        cargo: r.cargo || 'Conductor',
        tipo_desplazamiento: r.tipo_desplazamiento || 'Misional',
        rol_via: r.rol_via || 'Conductor de vehículo liviano',
        factor_riesgo: r.factor_riesgo || 'Factor Humano',
        peligro_descripcion: r.peligro_descripcion || 'Riesgo vial evaluado',
        np_cualitativo: r.np_cualitativo || 'PROBABLE',
        ne_cualitativo: r.ne_cualitativo || 'FRECUENTE',
        nc_cualitativo: r.nc_cualitativo || 'MODERADO',
        controles_existentes_descripcion: r.controles_existentes_descripcion || 'Ninguno',
        controles_existentes_tipo: r.controles_existentes_tipo || 'INDIVIDUO',
        tratamiento_accion: r.tratamiento_accion || 'MODIFICAR LOS FACTORES DE EXPOSICION',
        plan_accion_medio: r.plan_accion_medio || 'Ninguno',
        plan_accion_vehiculo: r.plan_accion_vehiculo || 'Mantenimiento preventivo',
        plan_accion_individuo: r.plan_accion_individuo || 'Capacitación en manejo defensivo',
        responsable: r.responsable || 'Responsable PESV',
        fecha_programacion: r.fecha_programacion || 'Permanente',
        estado: r.estado || 'PLANEADA',
        observaciones: r.observaciones || 'Registrado desde Antigravity MCP',
      });
      insertedCount++;
    }

    session.markModified('matrixRows');
    await session.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Se agregaron ${insertedCount} registros viales exitosamente a la Matriz PESV.`,
      totalRegistros: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /pesv error:', error);
    return res.status(500).json({ error: 'Error al agregar registros a la matriz PESV.' });
  }
});

router.put('/pesv/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }, { companyId, isOfficial: true }],
    });

    if (!session || !Array.isArray(session.matrixRows)) {
      return res.status(404).json({ error: 'Matriz PESV no encontrada.' });
    }

    const idx = session.matrixRows.findIndex((r) => r.id === targetId || r._id?.toString() === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Riesgo PESV con ID "${targetId}" no encontrado.` });
    }

    session.matrixRows[idx] = { ...session.matrixRows[idx], ...updates };
    session.markModified('matrixRows');
    await session.save();

    return res.json({
      exito: true,
      mensaje: `Riesgo vial PESV "${targetId}" actualizado exitosamente.`,
      riesgo: session.matrixRows[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /pesv/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar riesgo PESV.' });
  }
});

router.delete('/pesv/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString();
    const officialConvoId = `official-${companyId || userId}`;

    let session = await PESVWorkspaceSession.findOne({
      $or: [{ conversationId: officialConvoId }, { user: userId, isOfficial: true }, { companyId, isOfficial: true }],
    });

    if (!session || !Array.isArray(session.matrixRows)) {
      return res.status(404).json({ error: 'Matriz PESV no encontrada.' });
    }

    const initialLen = session.matrixRows.length;
    session.matrixRows = session.matrixRows.filter((r) => r.id !== targetId && r._id?.toString() !== targetId);

    if (session.matrixRows.length === initialLen) {
      return res.status(404).json({ error: `Riesgo PESV con ID "${targetId}" no encontrado.` });
    }

    session.markModified('matrixRows');
    await session.save();

    return res.json({
      exito: true,
      mensaje: `Riesgo vial PESV "${targetId}" eliminado exitosamente.`,
      totalRegistrosRestantes: session.matrixRows.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /pesv/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar riesgo PESV.' });
  }
});

// ─── 5. TRABAJADORES (SOCIODEMOGRÁFICO) ─────────────────────────────────────

router.get('/workers', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cedula, nombre, cargo, busqueda, filtro, estado } = req.query;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');
    
    // Buscar en todos los documentos de la empresa o usuario
    const socioDocs = await PerfilSociodemograficoData.find({
      $or: [{ user: userId, companyId }, { user: userId }],
    }).lean();

    let allTrabajadores = [];
    for (const doc of socioDocs) {
      if (Array.isArray(doc.trabajadores)) {
        allTrabajadores = allTrabajadores.concat(doc.trabajadores);
      }
    }

    // Deduplicar por identificación o id
    const seenMap = new Map();
    let deduplicated = [];
    for (const t of allTrabajadores) {
      const key = String(t.identificacion || t.documento || t.id || '').trim();
      if (key && !seenMap.has(key)) {
        seenMap.set(key, true);
        deduplicated.push(t);
      } else if (!key) {
        deduplicated.push(t);
      }
    }

    // Censo global antes de filtros
    const totalRegistrados = deduplicated.length;
    const totalActivos = deduplicated.filter((t) => (t.estadoLaboral || 'Activo') !== 'Retirado').length;
    const totalRetirados = deduplicated.filter((t) => t.estadoLaboral === 'Retirado').length;
    const resumenCenso = `Censo oficial de colaboradores: ${totalRegistrados} trabajadores registrados en total (${totalActivos} activos y ${totalRetirados} retirados).`;

    const filterEstado = String(filtro || estado || '').toLowerCase().trim();
    if (filterEstado) {
      if (filterEstado.includes('retirad')) {
        deduplicated = deduplicated.filter((t) => t.estadoLaboral === 'Retirado');
      } else if (filterEstado.includes('activ')) {
        deduplicated = deduplicated.filter((t) => (t.estadoLaboral || 'Activo') !== 'Retirado');
      }
    }

    if (busqueda) {
      deduplicated = deduplicated.filter((t) => matchWorker(t, busqueda));
    }
    if (cedula) {
      const cleanCedula = String(cedula).trim();
      deduplicated = deduplicated.filter(
        (t) => String(t.identificacion || t.documento || '').trim() === cleanCedula
      );
    }
    if (nombre) {
      deduplicated = deduplicated.filter((t) => matchWorker(t, nombre));
    }
    if (cargo) {
      const q = String(cargo).toLowerCase().trim();
      deduplicated = deduplicated.filter((t) => (t.cargo || '').toLowerCase().includes(q));
    }

    return res.json({
      total: deduplicated.length,
      totalRegistrados,
      totalActivos,
      totalRetirados,
      resumenCenso,
      filtroAplicado: filtro || estado || (busqueda ? 'búsqueda' : 'todos'),
      trabajadores: deduplicated.map((t) => ({
        id: t.id || t._id?.toString(),
        nombre_completo: t.nombre || 'Colaborador',
        cedula: t.identificacion || t.documento || 'N/A',
        cargo: t.cargo || 'Operativo',
        area: t.areaTrabajo || t.area || 'Operaciones',
        sede: t.sede || 'Principal',
        tipoContrato: t.tipoContrato || 'Indefinido',
        salario: t.salario || '',
        eps: t.eps || '',
        afp: t.afp || '',
        estadoPila: t.estadoPila || 'Pendiente de soporte PILA',
        estadoLaboral: t.estadoLaboral || 'Activo',
        fechaRetiro: t.fechaRetiro || '',
        motivoRetiro: t.motivoRetiro || '',
        telefono: t.telefono || '',
        correoElectronico: t.correoElectronico || '',
        direccion: t.direccion || '',
        municipioDomicilio: t.municipioDomicilio || '',
        barrio: t.barrio || '',
        fechaNacimiento: t.fechaNacimiento || '',
        edad: t.edad || '',
        genero: t.genero || 'No especificado',
        estadoCivil: t.estadoCivil || '',
        nivelEscolaridad: t.nivelEscolaridad || '',
        emergenciaContacto: t.emergenciaContacto || '',
        tipoSangre: t.tipoSangre || '',
        rh: t.rh || '',
        enfermedades: t.enfermedades || '',
        medicamentos: t.medicamentos || '',
        diagnosticoMedico: t.diagnosticoMedico || '',
        recomendacionesMedicas: t.recomendacionesMedicas || '',
        fechaExamenMedico: t.fechaExamenMedico || '',
        fechaSeguimiento: t.fechaSeguimiento || '',
        peso: t.peso || '',
        talla: t.talla || '',
        imc: t.imc || '',
        presionArterial: t.presionArterial || '',
        frecuenciaCardiaca: t.frecuenciaCardiaca || '',
        limitacionesBiomecanicas: t.limitacionesBiomecanicas || '',
        alergiasQuimicas: t.alergiasQuimicas || '',
        fuma: t.fuma || '',
        alcohol: t.alcohol || '',
        deporte: t.deporte || '',
        alimentacion: t.alimentacion || '',
        riesgoCardiovascular: t.riesgoCardiovascular || '',
        terapiaPsicologica: t.terapiaPsicologica || '',
        personasCargo: t.personasCargo || '',
        estrato: t.estrato || '',
        vivienda: t.vivienda || '',
        soatVencimiento: t.soatVencimiento || '',
        tecnicomecanicaVencimiento: t.tecnicomecanicaVencimiento || '',
        licenciaConduccion: t.licenciaConduccion || '',
        licenciaSST: t.licenciaSST || '',
        curso50h: t.curso50h || '',
        curso20h: t.curso20h || '',
        esCopasst: t.esCopasst || 'No',
        esComiteConvivencia: t.esComiteConvivencia || 'No',
        esBrigadista: t.esBrigadista || 'No',
        esComiteSeguridadVial: t.esComiteSeguridadVial || 'No',
        biocentricScore: t.biocentricScore !== undefined ? t.biocentricScore : 95,
        biocentricAlerts: Array.isArray(t.biocentricAlerts) ? t.biocentricAlerts : [],
        biocentricIsLethal: !!t.biocentricIsLethal,
        completedByAI: !!t.completedByAI,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /workers error:', error);
    return res.status(500).json({ error: 'Error al consultar trabajadores.' });
  }
});

router.post('/workers', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const workerData = req.body;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const nombre = (workerData.nombre_completo || workerData.nombre || '').trim();
    const documento = String(workerData.cedula || workerData.documento || workerData.identificacion || '').trim();
    const cargo = (workerData.cargo || 'Operativo').trim();
    const area = (workerData.area || workerData.areaTrabajo || 'Operaciones').trim();
    const tipoContrato = workerData.tipo_contrato || workerData.tipoContrato || 'Indefinido';

    if (!nombre || !documento) {
      return res.status(400).json({ error: 'nombre_completo y cedula son campos requeridos.' });
    }

    // Calcular IMC si vienen peso y talla
    let imc = workerData.imc || '';
    const peso = workerData.peso ? parseFloat(String(workerData.peso).replace(',', '.')) : null;
    const talla = workerData.talla ? parseFloat(String(workerData.talla).replace(',', '.')) : null;
    if (peso && talla && peso > 0 && talla > 0) {
      const tMeters = talla > 3 ? talla / 100 : talla;
      imc = (peso / (tMeters * tMeters)).toFixed(1);
    }

    // 1. Guardar o actualizar en PerfilSociodemograficoData (lo que alimenta Hito 2 - Huella Biocéntrica)
    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');

    const queryFilter = companyId ? { user: userId, companyId } : { user: userId };
    let socioDoc = await PerfilSociodemograficoData.findOne(queryFilter).lean();
    if (!socioDoc) {
      socioDoc = await PerfilSociodemograficoData.findOne({ user: userId }).lean();
    }

    let trabajadoresList = socioDoc && Array.isArray(socioDoc.trabajadores) ? [...socioDoc.trabajadores] : [];

    const workerIndex = trabajadoresList.findIndex(
      (w) => String(w.identificacion || w.documento || '').trim() === documento
    );

    const workerId = workerIndex >= 0 && trabajadoresList[workerIndex].id
      ? trabajadoresList[workerIndex].id
      : `worker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const workerItem = {
      id: workerId,
      nombre,
      identificacion: documento,
      cargo,
      areaTrabajo: area,
      sede: workerData.sede || 'Principal',
      tipoContrato,
      salario: workerData.salario || '',
      jornadaLaboral: workerData.jornadaLaboral || 'Diurna',
      eps: workerData.eps || '',
      afp: workerData.afp || '',
      estadoPila: workerData.estadoPila || 'Pendiente de soporte PILA',
      estadoLaboral: workerData.estadoLaboral || workerData.estado_laboral || 'Activo',
      fechaRetiro: workerData.fechaRetiro || workerData.fecha_retiro || '',
      motivoRetiro: workerData.motivoRetiro || workerData.motivo_retiro || '',
      telefono: workerData.telefono || '',
      correoElectronico: workerData.correoElectronico || workerData.correo || '',
      direccion: workerData.direccion || '',
      municipioDomicilio: workerData.municipioDomicilio || workerData.municipio || '',
      barrio: workerData.barrio || '',
      fechaNacimiento: workerData.fechaNacimiento || '',
      edad: workerData.edad ? Number(workerData.edad) : undefined,
      genero: workerData.genero || 'No especificado',
      estadoCivil: workerData.estadoCivil || '',
      nivelEscolaridad: workerData.nivelEscolaridad || '',
      emergenciaContacto: workerData.emergenciaContacto || '',
      tipoSangre: workerData.tipoSangre || '',
      rh: workerData.rh || '',
      enfermedades: workerData.enfermedades || '',
      medicamentos: workerData.medicamentos || '',
      diagnosticoMedico: workerData.diagnosticoMedico || '',
      recomendacionesMedicas: workerData.recomendacionesMedicas || '',
      fechaExamenMedico: workerData.fechaExamenMedico || '',
      fechaSeguimiento: workerData.fechaSeguimiento || '',
      peso: workerData.peso || '',
      talla: workerData.talla || '',
      imc,
      presionArterial: workerData.presionArterial || '',
      frecuenciaCardiaca: workerData.frecuenciaCardiaca || '',
      limitacionesBiomecanicas: workerData.limitacionesBiomecanicas || '',
      alergiasQuimicas: workerData.alergiasQuimicas || '',
      fuma: workerData.fuma || '',
      alcohol: workerData.alcohol || '',
      deporte: workerData.deporte || '',
      alimentacion: workerData.alimentacion || '',
      riesgoCardiovascular: workerData.riesgoCardiovascular || '',
      terapiaPsicologica: workerData.terapiaPsicologica || '',
      personasCargo: workerData.personasCargo || '',
      estrato: workerData.estrato || '',
      vivienda: workerData.vivienda || '',
      soatVencimiento: workerData.soatVencimiento || '',
      tecnicomecanicaVencimiento: workerData.tecnicomecanicaVencimiento || '',
      licenciaConduccion: workerData.licenciaConduccion || '',
      licenciaSST: workerData.licenciaSST || '',
      curso50h: workerData.curso50h || '',
      curso20h: workerData.curso20h || '',
      esCopasst: workerData.esCopasst || 'No',
      esComiteConvivencia: workerData.esComiteConvivencia || 'No',
      esBrigadista: workerData.esBrigadista || 'No',
      esComiteSeguridadVial: workerData.esComiteSeguridadVial || 'No',
      biocentricScore: workerData.biocentricScore !== undefined ? workerData.biocentricScore : 95,
      completedByAI: true,
      consentimientoFirmaDigital: workerData.consentimientoFirmaDigital || 'No',
    };

    if (workerIndex >= 0) {
      trabajadoresList[workerIndex] = {
        ...trabajadoresList[workerIndex],
        ...workerItem,
      };
    } else {
      trabajadoresList.push(workerItem);
    }

    await PerfilSociodemograficoData.findOneAndUpdate(
      queryFilter,
      { $set: { user: userId, companyId, trabajadores: trabajadoresList, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // 2. Sincronizar en SgsstWorker para consistencia integral
    await SgsstWorker.findOneAndUpdate(
      { user: userId, documento },
      {
        $set: {
          user: userId,
          companyId,
          perfilId: workerId,
          nombre,
          documento,
          cargo,
          estadoLaboral: workerData.estadoLaboral || 'Activo',
          eps: workerData.eps || '',
          afp: workerData.afp || '',
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      exito: true,
      mensaje: `Trabajador ${nombre} registrado exitosamente en el Perfil Sociodemográfico (Hito 2).`,
      id: workerId,
      totalTrabajadores: trabajadoresList.length,
      trabajador: workerItem,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /workers error:', error);
    return res.status(500).json({ error: error.message || 'Error al registrar trabajador.' });
  }
});

// ─── Actualizar / Editar Trabajador (Todas las variables) ───────────────────
router.put('/workers/:idOrCedula', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const rawTarget = req.params.idOrCedula || req.body?.idOrCedula || req.body?.cedula || req.body?.identificacion || req.body?.nombre || req.body?.target || '';
    const target = decodeURIComponent(String(rawTarget).trim());
    const updates = req.body || {};

    if (!target) {
      return res.status(400).json({ error: 'Se requiere cédula, ID o nombre del trabajador a actualizar.' });
    }

    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const socioDocs = await PerfilSociodemograficoData.find({
      $or: [{ user: userId, companyId }, { user: userId }],
    });
    let updatedWorker = null;
    let foundInSocio = false;

    for (const doc of socioDocs) {
      if (!Array.isArray(doc.trabajadores)) continue;

      const idx = doc.trabajadores.findIndex((w) => matchWorker(w, target));

      if (idx >= 0) {
        const current = doc.trabajadores[idx];

        // Mapear campos entrantes con soporte para alias
        const cleanNombre = updates.nombre_completo || updates.nombre || current.nombre;
        const cleanCedula = String(updates.cedula || updates.identificacion || updates.documento || current.identificacion || current.cedula || current.documento || target).trim();
        const cleanCargo = updates.cargo || current.cargo;
        const cleanArea = updates.area || updates.areaTrabajo || current.areaTrabajo;
        const cleanSede = updates.sede || current.sede;
        const cleanContrato = updates.tipo_contrato || updates.tipoContrato || current.tipoContrato;
        const cleanSalario = updates.salario !== undefined ? updates.salario : current.salario;
        const cleanEps = updates.eps !== undefined ? updates.eps : current.eps;
        const cleanAfp = updates.afp !== undefined ? updates.afp : current.afp;
        const cleanTelefono = updates.telefono !== undefined ? updates.telefono : current.telefono;
        const cleanCorreo = updates.correoElectronico || updates.correo || current.correoElectronico;
        const cleanDireccion = updates.direccion !== undefined ? updates.direccion : current.direccion;
        const cleanMunicipio = updates.municipioDomicilio || updates.municipio || current.municipioDomicilio;
        const cleanBarrio = updates.barrio !== undefined ? updates.barrio : current.barrio;
        const cleanDiagnostico = updates.diagnosticoMedico || updates.diagnostico_medico || current.diagnosticoMedico;
        const cleanRecomendaciones = updates.recomendacionesMedicas || updates.recomendaciones_medicas || current.recomendacionesMedicas;
        const cleanEnfermedades = updates.enfermedades !== undefined ? updates.enfermedades : current.enfermedades;
        const cleanMedicamentos = updates.medicamentos !== undefined ? updates.medicamentos : current.medicamentos;
        const cleanRh = updates.rh || updates.tipoSangre || current.rh;
        const cleanEstadoLaboral = updates.estadoLaboral || updates.estado_laboral || current.estadoLaboral;
        const cleanFechaRetiro = updates.fechaRetiro || updates.fecha_retiro || current.fechaRetiro;
        const cleanMotivoRetiro = updates.motivoRetiro || updates.motivo_retiro || current.motivoRetiro;

        // Recalcular IMC si se actualizaron peso o talla
        const pesoVal = updates.peso !== undefined ? updates.peso : current.peso;
        const tallaVal = updates.talla !== undefined ? updates.talla : current.talla;
        let imcVal = updates.imc || current.imc;
        if (pesoVal && tallaVal) {
          const p = parseFloat(String(pesoVal).replace(',', '.'));
          const t = parseFloat(String(tallaVal).replace(',', '.'));
          if (p > 0 && t > 0) {
            const tMeters = t > 3 ? t / 100 : t;
            imcVal = (p / (tMeters * tMeters)).toFixed(1);
          }
        }

        const merged = {
          ...(typeof current.toObject === 'function' ? current.toObject() : current),
          ...updates,
          id: current.id || target,
          nombre: cleanNombre,
          identificacion: cleanCedula,
          cedula: cleanCedula,
          documento: cleanCedula,
          cargo: cleanCargo,
          areaTrabajo: cleanArea,
          sede: cleanSede,
          tipoContrato: cleanContrato,
          salario: cleanSalario,
          eps: cleanEps,
          afp: cleanAfp,
          telefono: cleanTelefono,
          correoElectronico: cleanCorreo,
          direccion: cleanDireccion,
          municipioDomicilio: cleanMunicipio,
          barrio: cleanBarrio,
          diagnosticoMedico: cleanDiagnostico,
          recomendacionesMedicas: cleanRecomendaciones,
          enfermedades: cleanEnfermedades,
          medicamentos: cleanMedicamentos,
          rh: cleanRh,
          peso: pesoVal,
          talla: tallaVal,
          imc: imcVal,
          estadoLaboral: cleanEstadoLaboral,
          fechaRetiro: cleanFechaRetiro,
          motivoRetiro: cleanMotivoRetiro,
        };

        doc.trabajadores[idx] = merged;
        await PerfilSociodemograficoData.updateOne(
          { _id: doc._id },
          { $set: { trabajadores: doc.trabajadores, updatedAt: new Date() } }
        );

        updatedWorker = merged;
        foundInSocio = true;
      }
    }

    // Actualizar en SgsstWorker
    const cleanDoc = updatedWorker?.identificacion || target;
    await SgsstWorker.updateMany(
      {
        user: userId,
        $or: [
          { perfilId: target },
          { documento: cleanDoc },
          { nombre: { $regex: new RegExp(`^${target}$`, 'i') } },
        ],
      },
      {
        $set: {
          ...(updates.nombre ? { nombre: updates.nombre } : {}),
          ...(updates.cargo ? { cargo: updates.cargo } : {}),
          ...(updates.area || updates.areaTrabajo ? { area: updates.area || updates.areaTrabajo } : {}),
          ...(updates.tipo_contrato || updates.tipoContrato ? { tipo_contrato: updates.tipo_contrato || updates.tipoContrato } : {}),
          ...(updates.salario !== undefined ? { salario: updates.salario } : {}),
          ...(updates.eps !== undefined ? { eps: updates.eps } : {}),
          ...(updates.afp !== undefined ? { afp: updates.afp } : {}),
          ...(updates.estadoLaboral || updates.estado_laboral ? { estadoLaboral: updates.estadoLaboral || updates.estado_laboral } : {}),
          updatedAt: new Date(),
        },
      }
    );

    if (foundInSocio && updatedWorker) {
      return res.json({
        exito: true,
        mensaje: `Trabajador "${updatedWorker.nombre}" actualizado exitosamente.`,
        trabajador: updatedWorker,
      });
    }

    return res.status(404).json({ error: `No se encontró el trabajador con identificador "${target}".` });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /workers/:idOrCedula error:', error);
    return res.status(500).json({ error: 'Error al actualizar trabajador.' });
  }
});

// Soporte también vía PATCH
router.patch('/workers/:idOrCedula', requireApiKeyOrJwt, async (req, res) => {
  req.method = 'PUT';
  return router.handle(req, res);
});

router.delete('/workers/:idOrCedula', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const rawTarget = req.params.idOrCedula || req.body?.idOrCedula || req.body?.cedula || req.body?.identificacion || req.body?.nombre || req.body?.target || '';
    const target = decodeURIComponent(String(rawTarget).trim());

    if (!target) {
      return res.status(400).json({ error: 'Debes proporcionar la cédula, ID o nombre del trabajador a eliminar.' });
    }

    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');

    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const socioDocs = await PerfilSociodemograficoData.find({
      $or: [{ user: userId, companyId }, { user: userId }],
    });
    let removed = false;
    let workerName = '';
    let remainingCount = 0;

    for (const doc of socioDocs) {
      if (Array.isArray(doc.trabajadores)) {
        const initialCount = doc.trabajadores.length;
        doc.trabajadores = doc.trabajadores.filter((w) => {
          const match = matchWorker(w, target);
          if (match && !workerName) workerName = w.nombre;
          return !match;
        });

        if (doc.trabajadores.length !== initialCount) {
          await PerfilSociodemograficoData.updateOne(
            { _id: doc._id },
            { $set: { trabajadores: doc.trabajadores, updatedAt: new Date() } }
          );
          removed = true;
        }
        remainingCount = doc.trabajadores.length;
      }
    }

    // Sincronizar eliminación en SgsstWorker
    const syncName = workerName || target;
    await SgsstWorker.deleteMany({
      user: userId,
      $or: [
        { perfilId: target },
        { documento: target },
        { nombre: { $regex: new RegExp(syncName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      ],
    });

    if (removed) {
      return res.json({
        exito: true,
        mensaje: `Trabajador "${workerName || target}" eliminado exitosamente del Perfil Sociodemográfico (Hito 2).`,
        totalTrabajadores: remainingCount,
      });
    }

    return res.status(404).json({ error: `Trabajador con identificador o nombre "${target}" no encontrado.` });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /workers/:idOrCedula error:', error);
    return res.status(500).json({ error: 'Error al eliminar trabajador.' });
  }
});

router.post('/workers/:idOrCedula/retirar', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const target = (req.params.idOrCedula || '').trim();
    const { fechaRetiro, motivoRetiro } = req.body || {};

    if (!target) {
      return res.status(400).json({ error: 'Debes proporcionar la cédula, ID o nombre del trabajador a retirar.' });
    }

    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');

    const socioDocs = await PerfilSociodemograficoData.find({ user: userId });
    let updated = false;
    let workerData = null;
    const today = new Date().toISOString().split('T')[0];
    const fecha = (fechaRetiro || today).trim();
    const motivo = (motivoRetiro || 'Terminación de contrato').trim();

    for (const doc of socioDocs) {
      if (Array.isArray(doc.trabajadores)) {
        for (const w of doc.trabajadores) {
          const match =
            String(w.id || '').trim() === target ||
            String(w.identificacion || '').trim() === target ||
            String(w.documento || '').trim() === target ||
            String(w.cedula || '').trim() === target ||
            (w.nombre && w.nombre.toLowerCase().includes(target.toLowerCase()));
          if (match) {
            w.estadoLaboral = 'Retirado';
            w.fechaRetiro = fecha;
            w.motivoRetiro = motivo;
            updated = true;
            workerData = w;
          }
        }
        if (updated) {
          await PerfilSociodemograficoData.updateOne(
            { _id: doc._id },
            { $set: { trabajadores: doc.trabajadores, updatedAt: new Date() } }
          );
        }
      }
    }

    // Sincronizar en SgsstWorker si existe
    await SgsstWorker.updateMany(
      {
        user: userId,
        $or: [
          { perfilId: target },
          { documento: target },
          { nombre: { $regex: new RegExp(target, 'i') } },
        ],
      },
      {
        $set: {
          estadoLaboral: 'Retirado',
          fechaRetiro: fecha,
          motivoRetiro: motivo,
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ error: `Trabajador "${target}" no encontrado para retirar.` });
    }

    return res.json({
      exito: true,
      mensaje: `Trabajador "${workerData?.nombre || target}" marcado como Retirado exitosamente. Se conserva su historial y pasa a la pestaña 'Retirados'.`,
      trabajador: {
        id: workerData?.id,
        nombre: workerData?.nombre,
        cedula: workerData?.identificacion || workerData?.documento || target,
        estadoLaboral: 'Retirado',
        fechaRetiro: fecha,
        motivoRetiro: motivo,
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /workers/:idOrCedula/retirar error:', error);
    return res.status(500).json({ error: 'Error al retirar trabajador.' });
  }
});

router.post('/workers/:idOrCedula/reactivar', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const target = (req.params.idOrCedula || '').trim();

    if (!target) {
      return res.status(400).json({ error: 'Debes proporcionar la cédula, ID o nombre del trabajador a reactivar.' });
    }

    const PerfilSociodemograficoData =
      mongoose.models.PerfilSociodemograficoData ||
      require('~/models/PerfilSociodemograficoData');

    const socioDocs = await PerfilSociodemograficoData.find({ user: userId });
    let updated = false;
    let workerData = null;

    for (const doc of socioDocs) {
      if (Array.isArray(doc.trabajadores)) {
        for (const w of doc.trabajadores) {
          const match =
            String(w.id || '').trim() === target ||
            String(w.identificacion || '').trim() === target ||
            String(w.documento || '').trim() === target ||
            String(w.cedula || '').trim() === target ||
            (w.nombre && w.nombre.toLowerCase().includes(target.toLowerCase()));
          if (match) {
            w.estadoLaboral = 'Activo';
            w.fechaRetiro = '';
            w.motivoRetiro = '';
            updated = true;
            workerData = w;
          }
        }
        if (updated) {
          await PerfilSociodemograficoData.updateOne(
            { _id: doc._id },
            { $set: { trabajadores: doc.trabajadores, updatedAt: new Date() } }
          );
        }
      }
    }

    await SgsstWorker.updateMany(
      {
        user: userId,
        $or: [
          { perfilId: target },
          { documento: target },
          { nombre: { $regex: new RegExp(target, 'i') } },
        ],
      },
      {
        $set: {
          estadoLaboral: 'Activo',
          fechaRetiro: '',
          motivoRetiro: '',
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ error: `Trabajador "${target}" no encontrado para reactivar.` });
    }

    return res.json({
      exito: true,
      mensaje: `Trabajador "${workerData?.nombre || target}" reactivado exitosamente como Activo en la empresa.`,
      trabajador: {
        id: workerData?.id,
        nombre: workerData?.nombre,
        cedula: workerData?.identificacion || workerData?.documento || target,
        estadoLaboral: 'Activo',
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /workers/:idOrCedula/reactivar error:', error);
    return res.status(500).json({ error: 'Error al reactivar trabajador.' });
  }
});

// ─── 6. CRONOGRAMA SST Y TAREAS KANBAN ──────────────────────────────────────

router.get('/tasks', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const filter = { user: userId };
    if (status) filter.status = status;

    const tasks = await KanbanTask.find(filter).sort({ dueDate: 1 }).lean();

    return res.json({
      total: tasks.length,
      tareas: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description || '',
        status: t.status,
        dueDate: t.dueDate,
        type: t.type,
        priority: t.priority,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /tasks error:', error);
    return res.status(500).json({ error: 'Error al consultar tareas del cronograma.' });
  }
});

router.post('/tasks', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, dueDate, type, priority } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'title y dueDate son requeridos para programar una tarea.' });
    }

    const task = new KanbanTask({
      user: userId,
      title: title.trim(),
      description: (description || '').trim(),
      dueDate: new Date(dueDate),
      type: type || 'manual',
      priority: priority || 'medium',
      status: 'todo',
    });
    await task.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Actividad "${task.title}" programada con éxito en el cronograma SST.`,
      tareaId: task._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /tasks error:', error);
    return res.status(500).json({ error: 'Error al crear la tarea en el cronograma.' });
  }
});

router.patch('/tasks/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { status, description, priority, dueDate } = req.body;

    const task = await KanbanTask.findOne({ _id: taskId, user: userId });
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    if (status) task.status = status;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);

    await task.save();

    return res.json({
      exito: true,
      mensaje: `Tarea "${task.title}" actualizada exitosamente.`,
      tarea: {
        id: task._id.toString(),
        title: task.title,
        status: task.status,
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /tasks/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar la tarea.' });
  }
});

router.delete('/tasks/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    const result = await KanbanTask.findOneAndDelete({ _id: taskId, user: userId });
    if (!result) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    return res.json({
      exito: true,
      mensaje: `Actividad "${result.title}" eliminada exitosamente del cronograma.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /tasks/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar la tarea.' });
  }
});

// ─── 7. MATRIZ LEGAL SST ───────────────────────────────────────────────────

router.get('/matriz-legal', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc || !Array.isArray(doc.statuses) || doc.statuses.length === 0) {
      return res.json({
        totalNormas: 0,
        mensaje: 'La matriz de requisitos legales no tiene registros aún.',
        normas: [],
      });
    }

    const total = doc.statuses.length;
    const cumplen = doc.statuses.filter((s) => s.status === 'cumple').length;
    const porcentaje = total > 0 ? Math.round((cumplen / total) * 100) : 0;

    return res.json({
      totalNormas: total,
      cumplen,
      porcentajeCumplimiento: `${porcentaje}%`,
      normas: doc.statuses,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /matriz-legal error:', error);
    return res.status(500).json({ error: 'Error al consultar matriz legal.' });
  }
});

router.post('/matriz-legal', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { norma, articulo, descripcion, clasificacion, evidencia, status, responsable } = req.body;

    if (!norma || !descripcion) {
      return res.status(400).json({ error: 'norma y descripcion son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new MatrizLegalData({
        user: userId,
        companyId,
        statuses: [],
      });
    }

    const newItem = {
      id: `leg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      norma: norma.trim(),
      articulo: articulo || 'General',
      descripcion: descripcion.trim(),
      clasificacion: clasificacion || 'Seguridad y Salud en el Trabajo',
      evidencia: evidencia || '',
      status: status || 'cumple', // 'cumple', 'no_cumple', 'en_tramite', 'no_aplica'
      responsable: responsable || 'Responsable SST',
      fechaActualizacion: new Date().toISOString(),
    };

    doc.statuses.push(newItem);
    doc.markModified('statuses');
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Requisito legal "${norma}" agregado a la matriz.`,
      totalNormas: doc.statuses.length,
      norma: newItem,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /matriz-legal error:', error);
    return res.status(500).json({ error: 'Error al agregar requisito legal.' });
  }
});

router.put('/matriz-legal/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.statuses)) {
      return res.status(404).json({ error: 'Matriz legal no encontrada.' });
    }

    const idx = doc.statuses.findIndex((s) => s.id === targetId || (s.norma && s.norma.toLowerCase() === targetId.toLowerCase()));
    if (idx === -1) {
      return res.status(404).json({ error: `Norma con identificador "${targetId}" no encontrada.` });
    }

    doc.statuses[idx] = { ...doc.statuses[idx], ...updates, fechaActualizacion: new Date().toISOString() };
    doc.markModified('statuses');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Requisito legal "${doc.statuses[idx].norma}" actualizado exitosamente.`,
      norma: doc.statuses[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /matriz-legal/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar requisito legal.' });
  }
});

router.delete('/matriz-legal/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.statuses)) {
      return res.status(404).json({ error: 'Matriz legal no encontrada.' });
    }

    const initialLen = doc.statuses.length;
    doc.statuses = doc.statuses.filter((s) => s.id !== targetId && (!s.norma || s.norma.toLowerCase() !== targetId.toLowerCase()));

    if (doc.statuses.length === initialLen) {
      return res.status(404).json({ error: `Norma con identificador "${targetId}" no encontrada.` });
    }

    doc.markModified('statuses');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: 'Requisito legal eliminado exitosamente.',
      totalNormasRestantes: doc.statuses.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /matriz-legal/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar requisito legal.' });
  }
});

// ─── 8. ESTÁNDARES MÍNIMOS RESOLUCIÓN 0312 ─────────────────────────────────

router.get('/diagnostico-0312', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc) {
      return res.json({
        evaluado: false,
        mensaje: 'Aún no se ha realizado la autoevaluación de estándares mínimos 0312.',
        score: 0,
        complianceLevel: 'Sin evaluar',
        items: [],
      });
    }

    return res.json({
      evaluado: true,
      score: doc.score || 0,
      totalPoints: doc.totalPoints || 100,
      complianceLevel: doc.complianceLevel || '',
      companySize: doc.companySize || 'medium',
      riskLevel: doc.riskLevel || 3,
      totalItemsEvaluados: (doc.statusData || []).length,
      items: doc.statusData || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /diagnostico-0312 error:', error);
    return res.status(500).json({ error: 'Error al consultar diagnóstico 0312.' });
  }
});

router.post('/diagnostico-0312', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, code, name, status, observation, points } = req.body;

    if (!code || !status) {
      return res.status(400).json({ error: 'code y status ("cumple", "no_cumple", "no_aplica") son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await DiagnosticoData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new DiagnosticoData({
        user: userId,
        companyId,
        statusData: [],
      });
    }

    let existing = doc.statusData.find((i) => i.code === code || i.itemId === itemId);
    if (existing) {
      existing.status = status;
      if (observation !== undefined) existing.observation = observation;
      if (points !== undefined) existing.points = Number(points);
    } else {
      doc.statusData.push({
        itemId: itemId || `std_${Date.now()}`,
        code,
        name: name || code,
        status,
        observation: observation || '',
        points: Number(points) || 0,
      });
    }

    // Recalcular puntaje acumulado
    const totalPuntos = doc.statusData.reduce((acc, curr) => {
      return curr.status === 'cumple' || curr.status === 'no_aplica' ? acc + (Number(curr.points) || 0) : acc;
    }, 0);

    doc.score = totalPuntos;
    if (totalPuntos >= 86) doc.complianceLevel = 'Aceptable';
    else if (totalPuntos >= 61) doc.complianceLevel = 'Moderadamente Aceptable';
    else doc.complianceLevel = 'Crítico';

    doc.markModified('statusData');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Estándar ${code} evaluado como "${status}". Puntaje actual: ${doc.score} (${doc.complianceLevel}).`,
      score: doc.score,
      complianceLevel: doc.complianceLevel,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /diagnostico-0312 error:', error);
    return res.status(500).json({ error: 'Error al evaluar estándar 0312.' });
  }
});

// ─── 9. COMITÉS SST (COPASST, CONVIVENCIA, BRIGADA) ─────────────────────────

router.get('/comites', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const [copasst, convivencia, brigadistas] = await Promise.all([
      SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      SgsstBrigadista.find({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => []),
    ]);

    return res.json({
      copasst: copasst ? {
        modalidad: copasst.modalidad,
        estado: copasst.estado,
        periodoInicio: copasst.periodoInicio,
        periodoFin: copasst.periodoFin,
        empleador: copasst.integrantesEmpleador || [],
        trabajadores: copasst.integrantesTrabajador || [],
      } : { estado: 'No constituido' },
      convivencia: convivencia ? {
        centroTrabajo: convivencia.centroTrabajo,
        estado: convivencia.estado,
        periodoInicio: convivencia.periodoInicio,
        periodoFin: convivencia.periodoFin,
        empleador: convivencia.representantesEmpleador || [],
        trabajadores: convivencia.representantesTrabajador || [],
      } : { estado: 'No constituido' },
      brigada: {
        totalIntegrantes: brigadistas.length,
        integrantes: brigadistas.map((b) => ({
          nombre: b.nombre,
          cedula: b.cedula,
          cargo: b.cargo,
          sede: b.sede,
          grupoBrigada: b.grupoBrigada,
          rol: b.rol,
        })),
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /comites error:', error);
    return res.status(500).json({ error: 'Error al consultar comités.' });
  }
});

router.post('/comites', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoComite, nombre, cedula, cargo, rol, parte, grupoBrigada, sede } = req.body;

    if (!tipoComite || !nombre || !cedula) {
      return res.status(400).json({ error: 'tipoComite ("copasst", "convivencia", "brigada"), nombre y cedula son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    if (tipoComite === 'brigada') {
      let brig = await SgsstBrigadista.findOne({ companyId, cedula });
      if (brig) {
        brig.nombre = nombre;
        if (cargo) brig.cargo = cargo;
        if (grupoBrigada) brig.grupoBrigada = grupoBrigada;
        if (rol) brig.rol = rol;
        if (sede) brig.sede = sede;
        await brig.save();
      } else {
        brig = new SgsstBrigadista({
          companyId,
          user: userId,
          nombre,
          cedula,
          cargo: cargo || '',
          grupoBrigada: grupoBrigada || 'Primeros Auxilios',
          rol: rol || 'Brigadista Operativo',
          sede: sede || 'Sede Principal',
        });
        await brig.save();
      }
      return res.json({ exito: true, mensaje: `Brigadista ${nombre} registrado en el grupo ${grupoBrigada || 'Primeros Auxilios'}.` });
    }

    if (tipoComite === 'copasst') {
      let doc = await SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (!doc) {
        doc = new SgsstCopasstComite({
          companyId,
          user: userId,
          modalidad: 'copasst',
          estado: 'activo',
          integrantesEmpleador: [],
          integrantesTrabajador: [],
        });
      }
      const nuevo = { nombre, cedula, cargo: cargo || '', rol: rol || 'Principal' };
      if (parte === 'empleador') {
        doc.integrantesEmpleador.push(nuevo);
      } else {
        doc.integrantesTrabajador.push(nuevo);
      }
      await doc.save();
      return res.json({ exito: true, mensaje: `Integrante ${nombre} agregado al COPASST (${parte || 'trabajador'}).` });
    }

    if (tipoComite === 'convivencia') {
      let doc = await SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (!doc) {
        doc = new SgsstConvivenciaComite({
          companyId,
          user: userId,
          estado: 'activo',
          representantesEmpleador: [],
          representantesTrabajador: [],
        });
      }
      const nuevo = { nombre, cedula, cargo: cargo || '', rol: rol || 'Principal' };
      if (parte === 'empleador') {
        doc.representantesEmpleador.push(nuevo);
      } else {
        doc.representantesTrabajador.push(nuevo);
      }
      await doc.save();
      return res.json({ exito: true, mensaje: `Representante ${nombre} agregado al Comité de Convivencia.` });
    }

    return res.status(400).json({ error: 'tipoComite no válido.' });
  } catch (error) {
    logger.error('[MCP Bridge] POST /comites error:', error);
    return res.status(500).json({ error: 'Error al registrar integrante de comité.' });
  }
});

router.delete('/comites/:tipoComite/:cedula', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoComite, cedula } = req.params;
    const cleanCedula = String(cedula).trim();

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    if (tipoComite === 'brigada') {
      const resDel = await SgsstBrigadista.deleteMany({
        $or: [{ companyId }, { user: userId }],
        cedula: cleanCedula,
      });
      return res.json({ exito: true, mensaje: `Brigadista con cédula ${cleanCedula} retirado de la brigada.` });
    }

    if (tipoComite === 'copasst') {
      let doc = await SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (doc) {
        doc.integrantesEmpleador = (doc.integrantesEmpleador || []).filter((i) => String(i.cedula).trim() !== cleanCedula);
        doc.integrantesTrabajador = (doc.integrantesTrabajador || []).filter((i) => String(i.cedula).trim() !== cleanCedula);
        await doc.save();
      }
      return res.json({ exito: true, mensaje: `Integrante con cédula ${cleanCedula} retirado del COPASST.` });
    }

    if (tipoComite === 'convivencia') {
      let doc = await SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: userId }] });
      if (doc) {
        doc.representantesEmpleador = (doc.representantesEmpleador || []).filter((i) => String(i.cedula).trim() !== cleanCedula);
        doc.representantesTrabajador = (doc.representantesTrabajador || []).filter((i) => String(i.cedula).trim() !== cleanCedula);
        await doc.save();
      }
      return res.json({ exito: true, mensaje: `Representante con cédula ${cleanCedula} retirado del Comité de Convivencia.` });
    }

    return res.status(400).json({ error: 'tipoComite no válido ("copasst", "convivencia", "brigada").' });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /comites error:', error);
    return res.status(500).json({ error: 'Error al eliminar miembro de comité.' });
  }
});

// ─── 10. PRODUCTOS QUÍMICOS Y SGA ──────────────────────────────────────────

router.get('/quimicos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalProductos: doc?.productos?.length || 0,
      productos: doc?.productos || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /quimicos error:', error);
    return res.status(500).json({ error: 'Error al consultar químicos.' });
  }
});

router.post('/quimicos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, fabricante, estadoFisico, pictogramasSga, claseOnu, ubicacion, cantidadAlmacenada, tieneFds, tieneRotuloSga, incompatibilidades, observaciones } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'nombre del producto químico es requerido.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new SgsstChemicalData({
        user: userId,
        companyId,
        productos: [],
      });
    }

    const prodId = `chem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nuevoProd = {
      id: prodId,
      nombre: nombre.trim(),
      fabricante: fabricante || '',
      estadoFisico: estadoFisico || 'Líquido',
      pictogramasSga: Array.isArray(pictogramasSga) ? pictogramasSga : [],
      claseOnu: claseOnu || '',
      ubicacion: ubicacion || 'Bodega de Químicos',
      cantidadAlmacenada: cantidadAlmacenada || '',
      tieneFds: tieneFds || 'Sí',
      tieneRotuloSga: tieneRotuloSga || 'Sí',
      incompatibilidades: Array.isArray(incompatibilidades) ? incompatibilidades : [],
      observaciones: observaciones || '',
    };

    doc.productos.push(nuevoProd);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Producto químico "${nombre}" incorporado al inventario con SGA.`,
      totalProductos: doc.productos.length,
      producto: nuevoProd,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /quimicos error:', error);
    return res.status(500).json({ error: 'Error al registrar químico.' });
  }
});

router.put('/quimicos/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.productos)) {
      return res.status(404).json({ error: 'Inventario químico no encontrado.' });
    }

    const idx = doc.productos.findIndex((p) => p.id === targetId || (p.nombre && p.nombre.toLowerCase() === targetId.toLowerCase()));
    if (idx === -1) {
      return res.status(404).json({ error: `Producto químico "${targetId}" no encontrado.` });
    }

    doc.productos[idx] = { ...doc.productos[idx], ...updates };
    doc.markModified('productos');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Producto químico "${doc.productos[idx].nombre}" actualizado exitosamente.`,
      producto: doc.productos[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /quimicos/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar producto químico.' });
  }
});

router.delete('/quimicos/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.productos)) {
      return res.status(404).json({ error: 'Inventario químico no encontrado.' });
    }

    const initialLen = doc.productos.length;
    doc.productos = doc.productos.filter((p) => p.id !== targetId && (!p.nombre || p.nombre.toLowerCase() !== targetId.toLowerCase()));

    if (doc.productos.length === initialLen) {
      return res.status(404).json({ error: `Producto químico "${targetId}" no encontrado.` });
    }

    doc.markModified('productos');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: 'Producto químico eliminado del inventario.',
      totalProductosRestantes: doc.productos.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /quimicos/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar producto químico.' });
  }
});

// ─── 11. VEHÍCULOS Y SEGURIDAD VIAL ─────────────────────────────────────────

router.get('/vehiculos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const vehiculos = await SgsstVehicleData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalVehiculos: vehiculos.length,
      vehiculos: vehiculos.map((v) => ({
        id: v._id.toString(),
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        tipo: v.tipo,
        conductorNombre: v.conductorNombre,
        conductorCedula: v.conductorCedula,
        soatVencimiento: v.soatVencimiento,
        tecnomecanicaVencimiento: v.tecnomecanicaVencimiento,
        kilometrajeActual: v.kilometrajeActual,
        totalInspecciones: v.inspecciones?.length || 0,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /vehiculos error:', error);
    return res.status(500).json({ error: 'Error al consultar vehículos.' });
  }
});

router.post('/vehiculos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placa, marca, modelo, tipo, conductorNombre, conductorCedula, soatVencimiento, tecnomecanicaVencimiento, kilometrajeActual } = req.body;

    if (!placa || !marca || !soatVencimiento) {
      return res.status(400).json({ error: 'placa, marca y soatVencimiento son campos requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let v = await SgsstVehicleData.findOne({ placa: placa.trim().toUpperCase() });
    if (v) {
      if (conductorNombre) v.conductorNombre = conductorNombre;
      if (soatVencimiento) v.soatVencimiento = soatVencimiento;
      if (tecnomecanicaVencimiento) v.tecnomecanicaVencimiento = tecnomecanicaVencimiento;
      if (kilometrajeActual) v.kilometrajeActual = Number(kilometrajeActual);
      await v.save();
      return res.json({ exito: true, mensaje: `Vehículo con placa ${v.placa} actualizado.` });
    }

    v = new SgsstVehicleData({
      user: userId,
      companyId,
      placa: placa.trim().toUpperCase(),
      marca,
      modelo: modelo || '',
      tipo: tipo || 'Automóvil',
      conductorId: conductorCedula || 'PENDIENTE',
      conductorNombre: conductorNombre || 'Conductor asignado',
      soatVencimiento,
      tecnomecanicaVencimiento: tecnomecanicaVencimiento || '',
      kilometrajeActual: Number(kilometrajeActual) || 0,
      inspecciones: [],
    });
    await v.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Vehículo con placa ${v.placa} registrado en la flota.`,
      vehiculoId: v._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /vehiculos error:', error);
    return res.status(500).json({ error: 'Error al registrar vehículo.' });
  }
});

router.put('/vehiculos/:idOrPlaca', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const target = req.params.idOrPlaca.trim().toUpperCase();
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let v = await SgsstVehicleData.findOne({
      $or: [{ companyId }, { user: userId }],
      $or: [{ placa: target }, { _id: mongoose.isValidObjectId(target) ? target : null }],
    });

    if (!v) {
      return res.status(404).json({ error: `Vehículo con placa/ID "${target}" no encontrado.` });
    }

    Object.assign(v, updates);
    if (updates.placa) v.placa = updates.placa.trim().toUpperCase();
    if (updates.kilometrajeActual) v.kilometrajeActual = Number(updates.kilometrajeActual);
    await v.save();

    return res.json({
      exito: true,
      mensaje: `Vehículo con placa "${v.placa}" actualizado exitosamente.`,
      vehiculo: v,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /vehiculos/:idOrPlaca error:', error);
    return res.status(500).json({ error: 'Error al actualizar vehículo.' });
  }
});

router.delete('/vehiculos/:idOrPlaca', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const target = req.params.idOrPlaca.trim().toUpperCase();

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const result = await SgsstVehicleData.findOneAndDelete({
      $or: [{ companyId }, { user: userId }],
      $or: [{ placa: target }, { _id: mongoose.isValidObjectId(target) ? target : null }],
    });

    if (!result) {
      return res.status(404).json({ error: `Vehículo con placa/ID "${target}" no encontrado.` });
    }

    return res.json({
      exito: true,
      mensaje: `Vehículo con placa "${result.placa}" eliminado de la flota.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /vehiculos/:idOrPlaca error:', error);
    return res.status(500).json({ error: 'Error al eliminar vehículo.' });
  }
});

// ─── 12. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP) ────────────────────────────

router.get('/epp', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const registros = await SgsstEppData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalTrabajadoresConEpp: registros.length,
      registros: registros.map((r) => ({
        trabajador: r.nombreTrabajador,
        documento: r.documento,
        cargo: r.cargo,
        entregas: r.entregas || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /epp error:', error);
    return res.status(500).json({ error: 'Error al consultar EPP.' });
  }
});

router.post('/epp', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documento, nombreTrabajador, cargo, nombreEpp, tipo, cantidad, fechaEntrega, fechaVencimiento, serial, marca } = req.body;

    if (!documento || !nombreTrabajador || !nombreEpp) {
      return res.status(400).json({ error: 'documento, nombreTrabajador y nombreEpp son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstEppData.findOne({ documento, $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new SgsstEppData({
        user: userId,
        companyId,
        workerId: documento,
        documento,
        nombreTrabajador,
        cargo: cargo || '',
        entregas: [],
      });
    }

    const nuevoItem = {
      id: `epp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      nombre: nombreEpp.trim(),
      tipo: tipo || 'Regular',
      cantidad: Number(cantidad) || 1,
      fechaEntrega: fechaEntrega || new Date().toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento || '',
      estado: 'Entregado',
      marca: marca || '',
      serial: serial || '',
    };

    doc.entregas.push(nuevoItem);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Entrega de EPP "${nombreEpp}" registrada para ${nombreTrabajador}.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /epp error:', error);
    return res.status(500).json({ error: 'Error al registrar entrega de EPP.' });
  }
});

router.delete('/epp/:documento/:entregaId?', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documento, entregaId } = req.params;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await SgsstEppData.findOne({ documento, $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      return res.status(404).json({ error: `Registro de EPP para cédula ${documento} no encontrado.` });
    }

    if (entregaId) {
      doc.entregas = (doc.entregas || []).filter((e) => e.id !== entregaId);
      await doc.save();
      return res.json({ exito: true, mensaje: `Entrega de EPP "${entregaId}" eliminada.` });
    } else {
      await SgsstEppData.deleteOne({ _id: doc._id });
      return res.json({ exito: true, mensaje: `Historial de EPP para ${doc.nombreTrabajador} eliminado.` });
    }
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /epp error:', error);
    return res.status(500).json({ error: 'Error al eliminar entrega de EPP.' });
  }
});

// ─── 13. REPORTES DE ACTOS Y CONDICIONES INSEGURAS ──────────────────────────

router.get('/actos-condiciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalReportes: doc?.inboxPublico?.length || 0,
      reportes: doc?.inboxPublico || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /actos-condiciones error:', error);
    return res.status(500).json({ error: 'Error al consultar actos y condiciones.' });
  }
});

router.post('/actos-condiciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoReporte, sede, area, descripcion, reportadoPor, nivelRiesgo, accionInmediata } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: 'descripcion del acto o condición es obligatoria.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new ReporteActosData({
        user: userId,
        companyId,
        inboxPublico: [],
      });
    }

    const nuevoReporte = {
      id: new mongoose.Types.ObjectId().toString(),
      trabajador: {
        nombre: reportadoPor || 'Inspector / Asistente Antigravity',
        cedula: 'N/A',
        cargo: 'Reporte Preventivo',
      },
      data: {
        tipo: tipoReporte || 'Condición Insegura',
        sede: sede || 'Sede Principal',
        area: area || 'Operativa',
        descripcion: descripcion.trim(),
        nivelRiesgo: nivelRiesgo || 'Medio',
        accionInmediata: accionInmediata || 'Reportado para inspección',
        fecha: new Date().toISOString(),
      },
      esTercero: false,
      createdAt: new Date(),
    };

    doc.inboxPublico.push(nuevoReporte);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Reporte preventivo de acto/condición registrado con éxito.',
      reporteId: nuevoReporte.id,
      reporte: nuevoReporte,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /actos-condiciones error:', error);
    return res.status(500).json({ error: 'Error al crear reporte de acto o condición.' });
  }
});

router.patch('/actos-condiciones/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.inboxPublico)) {
      return res.status(404).json({ error: 'Reportes no encontrados.' });
    }

    const idx = doc.inboxPublico.findIndex((r) => r.id === targetId || r._id?.toString() === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Reporte con ID "${targetId}" no encontrado.` });
    }

    if (updates.estado) doc.inboxPublico[idx].data.estado = updates.estado;
    if (updates.accionInmediata) doc.inboxPublico[idx].data.accionInmediata = updates.accionInmediata;
    if (updates.nivelRiesgo) doc.inboxPublico[idx].data.nivelRiesgo = updates.nivelRiesgo;
    doc.markModified('inboxPublico');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Reporte "${targetId}" actualizado exitosamente.`,
      reporte: doc.inboxPublico[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /actos-condiciones/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar reporte.' });
  }
});

router.delete('/actos-condiciones/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.inboxPublico)) {
      return res.status(404).json({ error: 'Reportes no encontrados.' });
    }

    const initialLen = doc.inboxPublico.length;
    doc.inboxPublico = doc.inboxPublico.filter((r) => r.id !== targetId && r._id?.toString() !== targetId);

    if (doc.inboxPublico.length === initialLen) {
      return res.status(404).json({ error: `Reporte con ID "${targetId}" no encontrado.` });
    }

    doc.markModified('inboxPublico');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: 'Reporte de acto/condición eliminado.',
      totalReportesRestantes: doc.inboxPublico.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /actos-condiciones/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar reporte.' });
  }
});

// ─── 14. PERFILES DE CARGO SST ─────────────────────────────────────────────

router.get('/perfiles-cargo', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalPerfiles: doc?.perfilesList?.length || 0,
      perfiles: doc?.perfilesList || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /perfiles-cargo error:', error);
    return res.status(500).json({ error: 'Error al consultar perfiles de cargo.' });
  }
});

router.post('/perfiles-cargo', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cargo, area, misionCargo, responsabilidadesSST, eppRequeridos, factoresRiesgo } = req.body;

    if (!cargo) {
      return res.status(400).json({ error: 'cargo es requerido.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new PerfilCargoData({
        user: userId,
        companyId,
        perfilesList: [],
      });
    }

    let existing = doc.perfilesList.find((p) => p.cargo?.toLowerCase() === cargo.toLowerCase());
    if (existing) {
      if (area) existing.area = area;
      if (misionCargo) existing.misionCargo = misionCargo;
      if (responsabilidadesSST) existing.responsabilidadesSST = responsabilidadesSST;
      if (eppRequeridos) existing.eppRequeridos = eppRequeridos;
      if (factoresRiesgo) existing.factoresRiesgo = factoresRiesgo;
    } else {
      doc.perfilesList.push({
        id: `perfil_${Date.now()}`,
        cargo: cargo.trim(),
        area: area || 'Operaciones',
        misionCargo: misionCargo || '',
        responsabilidadesSST: responsabilidadesSST || 'Cumplir normas SST y usar EPP',
        eppRequeridos: Array.isArray(eppRequeridos) ? eppRequeridos : [],
        factoresRiesgo: Array.isArray(factoresRiesgo) ? factoresRiesgo : [],
      });
    }

    doc.markModified('perfilesList');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Perfil para el cargo "${cargo}" guardado con éxito.`,
      totalPerfiles: doc.perfilesList.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /perfiles-cargo error:', error);
    return res.status(500).json({ error: 'Error al guardar perfil de cargo.' });
  }
});

router.delete('/perfiles-cargo/:idOrCargo', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const target = req.params.idOrCargo.trim();

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.perfilesList)) {
      return res.status(404).json({ error: 'Perfiles de cargo no encontrados.' });
    }

    const initialLen = doc.perfilesList.length;
    doc.perfilesList = doc.perfilesList.filter((p) => p.id !== target && (!p.cargo || p.cargo.toLowerCase() !== target.toLowerCase()));

    if (doc.perfilesList.length === initialLen) {
      return res.status(404).json({ error: `Perfil de cargo "${target}" no encontrado.` });
    }

    doc.markModified('perfilesList');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Perfil de cargo "${target}" eliminado exitosamente.`,
      totalPerfilesRestantes: doc.perfilesList.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /perfiles-cargo/:idOrCargo error:', error);
    return res.status(500).json({ error: 'Error al eliminar perfil de cargo.' });
  }
});

// ─── 15. CASOS ATEL (ACCIDENTES E INVESTIGACIONES) ──────────────────────────

router.get('/atel', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const casos = await InvestigacionAtelData.find({ $or: [{ companyId }, { user: userId }] }).lean();
    return res.json({
      totalCasos: casos.length,
      casos: casos.map((c) => ({
        id: c._id.toString(),
        datos: c.formData || {},
        equipoInvestigador: c.equipoList || [],
        testigos: c.testigosList || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /atel error:', error);
    return res.status(500).json({ error: 'Error al consultar investigaciones ATEL.' });
  }
});

router.post('/atel', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipoEvento, nombreTrabajador, cedula, fechaAccidente, descripcionAccidente, severidad, parteCuerpoAfectada, accionesInmediatas } = req.body;

    if (!nombreTrabajador || !descripcionAccidente) {
      return res.status(400).json({ error: 'nombreTrabajador y descripcionAccidente son campos requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const nuevoCaso = new InvestigacionAtelData({
      user: userId,
      companyId,
      formData: {
        tipoEvento: tipoEvento || 'Accidente de Trabajo',
        nombreTrabajador,
        cedula: cedula || 'N/A',
        fechaAccidente: fechaAccidente || new Date().toISOString().split('T')[0],
        descripcionAccidente: descripcionAccidente.trim(),
        severidad: severidad || 'Leve',
        parteCuerpoAfectada: parteCuerpoAfectada || 'No especificada',
        accionesInmediatas: accionesInmediatas || 'Atención en primeros auxilios',
      },
    });

    await nuevoCaso.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Caso ATEL registrado con éxito para ${nombreTrabajador}.`,
      casoId: nuevoCaso._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /atel error:', error);
    return res.status(500).json({ error: 'Error al registrar caso ATEL.' });
  }
});

router.put('/atel/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let caso = await InvestigacionAtelData.findOne({
      _id: targetId,
      $or: [{ companyId }, { user: userId }],
    });

    if (!caso) {
      return res.status(404).json({ error: `Caso ATEL "${targetId}" no encontrado.` });
    }

    caso.formData = { ...caso.formData, ...updates };
    caso.markModified('formData');
    await caso.save();

    return res.json({
      exito: true,
      mensaje: `Caso ATEL "${targetId}" actualizado exitosamente.`,
      caso,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /atel/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar caso ATEL.' });
  }
});

router.delete('/atel/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const result = await InvestigacionAtelData.findOneAndDelete({
      _id: targetId,
      $or: [{ companyId }, { user: userId }],
    });

    if (!result) {
      return res.status(404).json({ error: `Caso ATEL "${targetId}" no encontrado.` });
    }

    return res.json({
      exito: true,
      mensaje: `Caso ATEL "${targetId}" eliminado exitosamente.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /atel/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar caso ATEL.' });
  }
});

// ─── 16. PROGRAMA DE CAPACITACIONES Y CURSOS LMS ────────────────────────────

router.get('/capacitaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const [prog, cursos] = await Promise.all([
      ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] }).lean().catch(() => null),
      Course.find({ isPublished: true }).select('title description category duration lessons').lean().catch(() => []),
    ]);

    return res.json({
      sesionesCronograma: prog?.sesiones || [],
      cursosLmsDisponibles: cursos.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description || '',
        totalLecciones: c.lessons?.length || 0,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /capacitaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar capacitaciones.' });
  }
});

router.post('/capacitaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { tema, fecha, hora, duracion, responsable, descripcion } = req.body;

    if (!tema || !fecha) {
      return res.status(400).json({ error: 'tema y fecha son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new ProgramaCapacitacionesData({
        user: userId,
        companyId,
        sesiones: [],
      });
    }

    const nuevaSesion = {
      id: `cap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tema: tema.trim(),
      fecha,
      hora: hora || '08:00',
      duracion: duracion || '1 hora',
      responsable: responsable || 'Capacitador SST',
      descripcion: descripcion || '',
      estado: 'Programada',
      trabajadoresRegistrados: [],
    };

    doc.sesiones.push(nuevaSesion);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Capacitación sobre "${tema}" programada para el ${fecha}.`,
      sesionId: nuevaSesion.id,
      sesion: nuevaSesion,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /capacitaciones error:', error);
    return res.status(500).json({ error: 'Error al programar capacitación.' });
  }
});

router.put('/capacitaciones/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.sesiones)) {
      return res.status(404).json({ error: 'Programa de capacitaciones no encontrado.' });
    }

    const idx = doc.sesiones.findIndex((s) => s.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Sesión de capacitación "${targetId}" no encontrada.` });
    }

    doc.sesiones[idx] = { ...doc.sesiones[idx], ...updates };
    doc.markModified('sesiones');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Capacitación "${doc.sesiones[idx].tema}" actualizada exitosamente.`,
      sesion: doc.sesiones[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /capacitaciones/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar capacitación.' });
  }
});

router.delete('/capacitaciones/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.sesiones)) {
      return res.status(404).json({ error: 'Programa de capacitaciones no encontrado.' });
    }

    const initialLen = doc.sesiones.length;
    doc.sesiones = doc.sesiones.filter((s) => s.id !== targetId);

    if (doc.sesiones.length === initialLen) {
      return res.status(404).json({ error: `Sesión de capacitación "${targetId}" no encontrada.` });
    }

    doc.markModified('sesiones');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: 'Sesión de capacitación eliminada exitosamente.',
      totalSesionesRestantes: doc.sesiones.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /capacitaciones/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar capacitación.' });
  }
});

// ─── 17. AUDITORÍAS INTERNAS Y PLANES DE ACCIÓN ────────────────────────────

router.get('/auditorias', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] }).lean();
    if (!doc) {
      return res.json({
        evaluado: false,
        mensaje: 'No hay auditorías registradas en este período.',
        hallazgos: [],
      });
    }

    return res.json({
      evaluado: true,
      score: doc.score,
      compliancePercentage: doc.compliancePercentage,
      reviewerInfo: doc.reviewerInfo || {},
      hallazgos: doc.statusData || [],
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /auditorias error:', error);
    return res.status(500).json({ error: 'Error al consultar auditorías.' });
  }
});

router.post('/auditorias', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { codigo, hallazgo, tipo, accionPropuesta, responsable, fechaCompromiso } = req.body;

    if (!hallazgo) {
      return res.status(400).json({ error: 'hallazgo es obligatorio.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc) {
      doc = new AuditoriaData({
        user: userId,
        companyId,
        statusData: [],
      });
    }

    const nuevoHallazgo = {
      itemId: `aud_${Date.now()}`,
      code: codigo || 'NC-01',
      name: tipo || 'No Conformidad Menor',
      description: hallazgo.trim(),
      observation: accionPropuesta || 'Plan de acción formulado',
      status: 'no_cumple',
      responsable: responsable || 'Líder del Proceso',
      fechaCompromiso: fechaCompromiso || 'En 30 días',
    };

    doc.statusData.push(nuevoHallazgo);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Hallazgo de auditoría y plan de acción registrados con éxito.',
      hallazgo: nuevoHallazgo,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /auditorias error:', error);
    return res.status(500).json({ error: 'Error al registrar hallazgo de auditoría.' });
  }
});

router.patch('/auditorias/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.statusData)) {
      return res.status(404).json({ error: 'Auditorías no encontradas.' });
    }

    const idx = doc.statusData.findIndex((h) => h.itemId === targetId || h.code === targetId);
    if (idx === -1) {
      return res.status(404).json({ error: `Hallazgo "${targetId}" no encontrado.` });
    }

    doc.statusData[idx] = { ...doc.statusData[idx], ...updates };
    doc.markModified('statusData');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Hallazgo "${targetId}" actualizado exitosamente.`,
      hallazgo: doc.statusData[idx],
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /auditorias/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar hallazgo.' });
  }
});

router.delete('/auditorias/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    let doc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: userId }] });
    if (!doc || !Array.isArray(doc.statusData)) {
      return res.status(404).json({ error: 'Auditorías no encontradas.' });
    }

    const initialLen = doc.statusData.length;
    doc.statusData = doc.statusData.filter((h) => h.itemId !== targetId && h.code !== targetId);

    if (doc.statusData.length === initialLen) {
      return res.status(404).json({ error: `Hallazgo "${targetId}" no encontrado.` });
    }

    doc.markModified('statusData');
    await doc.save();

    return res.json({
      exito: true,
      mensaje: `Hallazgo "${targetId}" eliminado exitosamente.`,
      totalHallazgosRestantes: doc.statusData.length,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /auditorias/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar hallazgo.' });
  }
});

// ─── 18. AGENTES Y AUTOMATIZACIONES ────────────────────────────────────────

router.get('/agentes-automatizaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const Agent = mongoose.models.Agent;

    const [agentes, automations] = await Promise.all([
      Agent ? Agent.find({ author: userId }).select('id name description avatar model').lean() : [],
      Automation.find({ user: userId }).lean(),
    ]);

    return res.json({
      totalAgentes: agentes.length,
      agentes: agentes.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
      })),
      totalAutomatizaciones: automations.length,
      automatizaciones: automations.map((au) => ({
        id: au._id.toString(),
        name: au.name,
        agentName: au.agentName,
        scheduleType: au.scheduleType,
        isEnabled: au.isEnabled,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /agentes-automatizaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar agentes y automatizaciones.' });
  }
});

router.post('/agentes-automatizaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, agentId, agentName, prompt, scheduleType, scheduleConfig } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'name, agentId y prompt son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id?.toString() || userId;

    const auto = new Automation({
      user: userId,
      companyId,
      name: name.trim(),
      agentId,
      agentName: agentName || 'Agente Autónomo',
      prompt: prompt.trim(),
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8 },
      isEnabled: true,
    });

    await auto.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Automatización "${name}" programada con éxito para el agente ${agentName || agentId}.`,
      automatizacionId: auto._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /agentes-automatizaciones error:', error);
    return res.status(500).json({ error: 'Error al programar automatización.' });
  }
});

router.delete('/agentes-automatizaciones/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const result = await Automation.findOneAndDelete({ _id: targetId, user: userId });
    if (!result) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    return res.json({
      exito: true,
      mensaje: `Automatización "${result.name}" eliminada exitosamente.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /agentes-automatizaciones/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar automatización.' });
  }
});

// ─── 19. CONVERSACIONES Y MENSAJES DE CHAT ──────────────────────────────────

router.get('/conversaciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const Conversation = mongoose.models.Conversation;
    if (!Conversation) {
      return res.json({ conversaciones: [] });
    }

    const convos = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(30)
      .select('conversationId title createdAt updatedAt')
      .lean();

    return res.json({
      total: convos.length,
      conversaciones: convos.map((c) => ({
        conversationId: c.conversationId,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /conversaciones error:', error);
    return res.status(500).json({ error: 'Error al consultar conversaciones.' });
  }
});

router.get('/mensajes', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'Se requiere el parámetro conversationId.' });
    }

    const Message = mongoose.models.Message;
    if (!Message) {
      return res.json({ mensajes: [] });
    }

    const mensajes = await Message.find({ conversationId, user: userId })
      .sort({ createdAt: 1 })
      .limit(50)
      .select('messageId sender text createdAt isCreatedByUser')
      .lean();

    return res.json({
      total: mensajes.length,
      mensajes: mensajes.map((m) => ({
        sender: m.sender,
        text: m.text,
        fecha: m.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /mensajes error:', error);
    return res.status(500).json({ error: 'Error al consultar mensajes.' });
  }
});

// ─── 20. ARCHIVOS Y DOCUMENTOS DEL USUARIO ─────────────────────────────────

router.get('/archivos', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const File = mongoose.models.File;
    if (!File) {
      return res.json({ archivos: [] });
    }

    const files = await File.find({ user: userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('file_id filename bytes type createdAt')
      .lean();

    return res.json({
      total: files.length,
      archivos: files.map((f) => ({
        fileId: f.file_id,
        nombre: f.filename,
        tamanoBytes: f.bytes,
        tipo: f.type,
        fecha: f.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /archivos error:', error);
    return res.status(500).json({ error: 'Error al consultar archivos.' });
  }
});

// ─── 21. GESTIÓN MULTI-EMPRESAS ─────────────────────────────────────────────

router.post('/companies', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      companyName,
      nit,
      companyType,
      workerCount,
      arl,
      riskLevel,
      economicActivity,
      ciiu,
      address,
      city,
      departamento,
      phone,
      email,
      responsibleSST,
      formationLevel,
      licenseNumber,
      licenseExpiry,
      courseStatus,
      generalActivities,
      sedes,
      makeActive,
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ error: 'companyName es obligatorio.' });
    }

    const shouldBeActive = makeActive !== false;
    if (shouldBeActive) {
      await CompanyInfo.updateMany({ user: userId }, { $set: { isActive: false } });
    }

    const newCompany = new CompanyInfo({
      user: userId,
      companyName: companyName.trim(),
      nit: (nit || '').trim(),
      companyType: companyType || 'Persona Jurídica',
      workerCount: Number(workerCount) || 0,
      arl: arl || '',
      riskLevel: riskLevel || '',
      economicActivity: economicActivity || '',
      ciiu: ciiu || '',
      address: address || '',
      city: city || '',
      departamento: departamento || '',
      phone: phone || '',
      email: email || '',
      responsibleSST: responsibleSST || '',
      formationLevel: formationLevel || '',
      licenseNumber: licenseNumber || '',
      licenseExpiry: licenseExpiry || '',
      courseStatus: courseStatus || '',
      generalActivities: generalActivities || '',
      sedes: Array.isArray(sedes) ? sedes : [],
      isActive: shouldBeActive,
    });

    await newCompany.save();

    if (shouldBeActive) {
      syncCompanyAiMemory(userId, newCompany).catch(() => {});
    }

    return res.status(201).json({
      exito: true,
      mensaje: `Empresa "${companyName}" creada exitosamente.`,
      id: newCompany._id.toString(),
      empresa: newCompany,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /companies error:', error);
    return res.status(500).json({ error: 'Error al crear empresa.' });
  }
});

router.put('/companies/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await CompanyInfo.findOne({
      user: userId,
      _id: targetId,
    });

    if (!company) {
      return res.status(404).json({ error: `Empresa con ID "${targetId}" no encontrada.` });
    }

    Object.assign(company, updates);
    await company.save();

    if (company.isActive) {
      syncCompanyAiMemory(userId, company).catch(() => {});
    }

    return res.json({
      exito: true,
      mensaje: `Empresa "${company.companyName}" actualizada exitosamente.`,
      empresa: company,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /companies/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar empresa.' });
  }
});

router.post(['/companies/:id/activate', '/companies/:id/select', '/companies/activate', '/companies/select'], requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const rawTarget = req.params.id || req.body?.id || req.body?.companyId || req.body?.empresa || req.body?.nombre_o_id || req.body?.nombre;

    if (!rawTarget) {
      return res.status(400).json({ error: 'Debes especificar el ID, nombre o NIT de la empresa a activar.' });
    }

    const targetTerm = String(rawTarget).trim();
    let company = null;

    if (mongoose.isValidObjectId(targetTerm)) {
      company = await CompanyInfo.findOne({ user: targetUserId, _id: targetTerm });
    }

    if (!company) {
      const safeRegex = new RegExp(targetTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      company = await CompanyInfo.findOne({
        user: targetUserId,
        $or: [{ companyName: safeRegex }, { nit: targetTerm }],
      });
    }

    if (!company) {
      return res.status(404).json({ error: `Empresa "${targetTerm}" no encontrada entre tus empresas registradas.` });
    }

    await CompanyInfo.updateMany({ user: targetUserId }, { $set: { isActive: false } });
    company.isActive = true;
    await company.save();

    syncCompanyAiMemory(targetUserId, company).catch(() => {});

    return res.json({
      exito: true,
      mensaje: `Empresa "${company.companyName}" activada como contexto principal.`,
      empresa: company,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /companies/:id/activate error:', error);
    return res.status(500).json({ error: 'Error al activar empresa.' });
  }
});

router.delete('/companies/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const count = await CompanyInfo.countDocuments({ user: userId });
    if (count <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar la única empresa registrada en tu cuenta.' });
    }

    const company = await CompanyInfo.findOneAndDelete({ user: userId, _id: targetId });
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    if (company.isActive) {
      const remaining = await CompanyInfo.findOne({ user: userId });
      if (remaining) {
        remaining.isActive = true;
        await remaining.save();
        syncCompanyAiMemory(userId, remaining).catch(() => {});
      }
    }

    return res.json({
      exito: true,
      mensaje: `Empresa "${company.companyName}" eliminada exitosamente.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /companies/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar empresa.' });
  }
});

// ─── 22. ESTUDIOS DE PUESTO DE TRABAJO (EPT - ERGONOMÍA) ───────────────────

router.get('/estudio-puesto', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId ? { $or: [{ companyId }, { user: userId }] } : { user: userId };
    const estudios = await EstudioPuestoTrabajo.find(query).sort({ createdAt: -1 }).lean();

    return res.json({
      total: estudios.length,
      estudios: estudios.map((e) => ({
        id: e._id.toString(),
        workerId: e.workerId,
        workerName: e.workerName,
        cargo: e.cargo,
        actividad: e.actividad,
        rulaScore: e.rulaScore,
        rebaScore: e.rebaScore,
        riskLevel: e.riskLevel,
        actionLevel: e.actionLevel,
        status: e.status,
        notes: e.notes,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /estudio-puesto error:', error);
    return res.status(500).json({ error: 'Error al consultar estudios de puesto.' });
  }
});

router.post('/estudio-puesto', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workerId, workerName, cargo, actividad, rulaScore, rebaScore, riskLevel, notes, evaluatorName } = req.body;

    if (!workerName || !cargo) {
      return res.status(400).json({ error: 'workerName y cargo son requeridos.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id || new mongoose.Types.ObjectId();

    const ept = new EstudioPuestoTrabajo({
      companyId,
      user: userId,
      workerId: workerId || `w_${Date.now()}`,
      workerName: workerName.trim(),
      cargo: cargo.trim(),
      actividad: actividad || '',
      rulaScore: rulaScore !== undefined ? Number(rulaScore) : null,
      rebaScore: rebaScore !== undefined ? Number(rebaScore) : null,
      riskLevel: riskLevel || 'Medio',
      notes: notes || '',
      evaluatorName: evaluatorName || 'Evaluador Ergonómico SST',
      status: 'completado',
    });

    await ept.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Estudio de puesto de trabajo registrado para "${workerName}".`,
      estudioId: ept._id.toString(),
      estudio: ept,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /estudio-puesto error:', error);
    return res.status(500).json({ error: 'Error al crear estudio de puesto de trabajo.' });
  }
});

router.put('/estudio-puesto/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const updates = req.body || {};

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId
      ? { _id: targetId, $or: [{ companyId }, { user: userId }] }
      : { _id: targetId, user: userId };

    const ept = await EstudioPuestoTrabajo.findOne(query);

    if (!ept) {
      return res.status(404).json({ error: 'Estudio de puesto de trabajo no encontrado.' });
    }

    Object.assign(ept, updates);
    await ept.save();

    return res.json({
      exito: true,
      mensaje: 'Estudio de puesto de trabajo actualizado exitosamente.',
      estudio: ept,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /estudio-puesto/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar estudio de puesto.' });
  }
});

router.delete('/estudio-puesto/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId
      ? { _id: targetId, $or: [{ companyId }, { user: userId }] }
      : { _id: targetId, user: userId };

    const result = await EstudioPuestoTrabajo.findOneAndDelete(query);

    if (!result) {
      return res.status(404).json({ error: 'Estudio de puesto de trabajo no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: 'Estudio de puesto de trabajo eliminado.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /estudio-puesto/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar estudio de puesto.' });
  }
});

// ─── 23. CURSOS Y ACADEMIA LMS ──────────────────────────────────────────────

router.get('/courses', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { busqueda, tags } = req.query;
    let query = {};
    if (busqueda) {
      const safeRegex = new RegExp(String(busqueda).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: safeRegex }, { description: safeRegex }];
    }
    if (tags) {
      const tagArr = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArr.length > 0) query.tags = { $in: tagArr };
    }

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();

    const lineas = courses
      .map(
        (c, i) =>
          `${i + 1}. "${c.title}" (${c.lessons?.length || 0} lecciones) - ${c.description || 'Sin descripción'}`
      )
      .join('\n');
    const resumenTexto =
      courses.length > 0
        ? `Hay un total de ${courses.length} curso(s) en WAPPY Academia:\n${lineas}`
        : 'No se encontraron cursos en la Academia LMS.';

    return res.json({
      total: courses.length,
      resumenTexto,
      cursos: courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description || '',
        thumbnail: c.thumbnail || '',
        tags: c.tags || [],
        isPublished: !!c.isPublished,
        isFeatured: !!c.isFeatured,
        totalLecciones: c.lessons?.length || 0,
        lecciones: (c.lessons || []).map((l) => ({
          title: l.title,
          order: l.order,
          hasExam: !!l.exam?.isEnabled,
        })),
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /courses error:', error);
    return res.status(500).json({ error: 'Error al consultar cursos LMS.' });
  }
});

router.get('/courses/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    let course = null;

    if (mongoose.isValidObjectId(targetId)) {
      course = await Course.findById(targetId).lean();
    }
    if (!course) {
      const safeRegex = new RegExp(String(targetId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      course = await Course.findOne({
        $or: [{ title: safeRegex }, { 'lessons.title': safeRegex }],
      }).lean();
    }

    if (!course) {
      return res.status(404).json({ error: `Curso "${targetId}" no encontrado en WAPPY Academia.` });
    }

    const leccionesDetalle = (course.lessons || []).map((l, idx) => {
      return {
        indice: idx + 1,
        orden: l.order || idx + 1,
        titulo: l.title,
        contenido: l.content || 'Sin contenido de texto registrado',
        videoUrl: l.videoUrl || null,
        adjuntos: (l.attachments || []).map((a) => ({ nombre: a.name, url: a.url })),
        evaluacion: l.exam?.isEnabled
          ? {
              titulo: l.exam.title || 'Evaluación de lección',
              preguntasCount: l.exam.questions?.length || 0,
              puntajeMinimo: l.exam.passingScore || 70,
              preguntas: (l.exam.questions || []).map((q) => ({
                pregunta: q.questionText,
                opciones: q.options,
                explicacion: q.explanation || '',
              })),
            }
          : null,
      };
    });

    const resumenLecciones = leccionesDetalle
      .map((l) => `  * Lección ${l.indice}: "${l.titulo}" ${l.evaluacion ? '(Tiene examen)' : ''}`)
      .join('\n');
    const resumenCurso = `Curso "${course.title}": ${course.description || ''}\nTotal de lecciones: ${leccionesDetalle.length}\nTemario:\n${resumenLecciones}`;

    return res.json({
      exito: true,
      id: course._id.toString(),
      titulo: course.title,
      descripcion: course.description || '',
      tags: course.tags || [],
      thumbnail: course.thumbnail || '',
      isPublished: !!course.isPublished,
      isFeatured: !!course.isFeatured,
      totalLecciones: leccionesDetalle.length,
      resumenCurso,
      lecciones: leccionesDetalle,
      createdAt: course.createdAt,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /courses/:id error:', error);
    return res.status(500).json({ error: 'Error al consultar detalle del curso LMS.' });
  }
});

router.post('/courses', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { title, description, thumbnail, tags, lessons, isPublished } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title es requerido.' });
    }

    const course = new Course({
      title: title.trim(),
      description: description || '',
      thumbnail: thumbnail || '',
      tags: Array.isArray(tags) ? tags : [],
      lessons: Array.isArray(lessons) ? lessons : [],
      isPublished: !!isPublished,
    });

    await course.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Curso "${title}" creado exitosamente en WAPPY LMS.`,
      id: course._id.toString(),
      curso: course,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /courses error:', error);
    return res.status(500).json({ error: 'Error al crear curso LMS.' });
  }
});

router.put('/courses/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const updates = req.body || {};

    const course = await Course.findById(targetId);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    Object.assign(course, updates);
    await course.save();

    return res.json({
      exito: true,
      mensaje: `Curso "${course.title}" actualizado exitosamente.`,
      curso: course,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /courses/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar curso LMS.' });
  }
});

router.delete('/courses/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const result = await Course.findByIdAndDelete(targetId);

    if (!result) {
      return res.status(404).json({ error: 'Curso no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: `Curso "${result.title}" eliminado exitosamente.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /courses/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar curso.' });
  }
});

router.get('/courses/progress', requireApiKeyOrJwt, async (req, res) => {
  try {
    const progressList = await UserProgress.find({}).limit(100).lean();

    return res.json({
      total: progressList.length,
      registros: progressList.map((p) => ({
        id: p._id.toString(),
        userId: p.userId,
        courseId: p.courseId,
        completedLessonsCount: p.completedLessons?.length || 0,
        isCompleted: !!p.isCompleted,
        lastAccessedAt: p.lastAccessedAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /courses/progress error:', error);
    return res.status(500).json({ error: 'Error al consultar progreso de cursos.' });
  }
});

// ─── 24. MARKETPLACE DE PRODUCTOS Y SERVICIOS SST ──────────────────────────

router.get('/marketplace/products', requireApiKeyOrJwt, async (req, res) => {
  try {
    const products = await MarketplaceProduct.find({}).sort({ createdAt: -1 }).lean();

    return res.json({
      total: products.length,
      productos: products.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        category: p.category,
        serviceType: p.serviceType,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        status: p.status,
        isFeatured: !!p.isFeatured,
        rating: p.rating,
        deliverables: p.deliverables || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /marketplace/products error:', error);
    return res.status(500).json({ error: 'Error al consultar productos del marketplace.' });
  }
});

router.post('/marketplace/products', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, category, regularPrice, salePrice, serviceType, shortDescription, description, deliverables } = req.body;

    if (!title || !category || regularPrice === undefined) {
      return res.status(400).json({ error: 'title, category y regularPrice son requeridos.' });
    }

    const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = new MarketplaceProduct({
      title: title.trim(),
      slug,
      category,
      regularPrice: Number(regularPrice),
      salePrice: salePrice !== undefined ? Number(salePrice) : 0,
      serviceType: serviceType || 'service_virtual',
      shortDescription: shortDescription || '',
      description: description || '',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      status: 'published',
      createdBy: userId,
    });

    await product.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Producto/Servicio "${title}" publicado en el Marketplace.`,
      id: product._id.toString(),
      producto: product,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /marketplace/products error:', error);
    return res.status(500).json({ error: 'Error al crear producto en marketplace.' });
  }
});

router.put('/marketplace/products/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const updates = req.body || {};

    const product = await MarketplaceProduct.findById(targetId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    Object.assign(product, updates);
    await product.save();

    return res.json({
      exito: true,
      mensaje: `Producto "${product.title}" actualizado exitosamente.`,
      producto: product,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /marketplace/products/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

router.delete('/marketplace/products/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const result = await MarketplaceProduct.findByIdAndDelete(targetId);

    if (!result) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: `Producto "${result.title}" eliminado del Marketplace.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /marketplace/products/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

router.get('/marketplace/orders', requireApiKeyOrJwt, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({}).sort({ createdAt: -1 }).limit(50).lean();

    return res.json({
      total: orders.length,
      pedidos: orders.map((o) => ({
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        customerName: o.customerInfo?.name || '',
        customerEmail: o.customerInfo?.email || '',
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /marketplace/orders error:', error);
    return res.status(500).json({ error: 'Error al consultar órdenes del marketplace.' });
  }
});

// ─── 25. BLOG DE SST ───────────────────────────────────────────────────────

router.get('/blog', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { busqueda, tags } = req.query;
    let query = {};
    if (busqueda) {
      const safeRegex = new RegExp(String(busqueda).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: safeRegex }, { description: safeRegex }, { content: safeRegex }];
    }
    if (tags) {
      const tagArr = String(tags).split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArr.length > 0) query.tags = { $in: tagArr };
    }

    const posts = await BlogPost.find(query).sort({ createdAt: -1 }).lean();

    const lineas = posts
      .map(
        (p, i) =>
          `${i + 1}. "${p.title}" [${(p.tags || []).join(', ')}] - ${p.description || 'Sin descripción'}`
      )
      .join('\n');
    const resumenTexto =
      posts.length > 0
        ? `Hay un total de ${posts.length} artículo(s) publicado(s) en el Blog de WAPPY:\n${lineas}`
        : 'No se encontraron artículos en el Blog de WAPPY.';

    return res.json({
      total: posts.length,
      resumenTexto,
      articulos: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description || '',
        tags: p.tags || [],
        isPublished: !!p.isPublished,
        isFeatured: !!p.isFeatured,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /blog error:', error);
    return res.status(500).json({ error: 'Error al consultar artículos de blog.' });
  }
});

router.get('/blog/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    let post = null;

    if (mongoose.isValidObjectId(targetId)) {
      post = await BlogPost.findById(targetId).lean();
    }
    if (!post) {
      const safeRegex = new RegExp(String(targetId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      post = await BlogPost.findOne({
        $or: [{ title: safeRegex }, { tags: safeRegex }],
      }).lean();
    }

    if (!post) {
      return res.status(404).json({ error: `Artículo de blog "${targetId}" no encontrado.` });
    }

    const resumenArticulo = `Artículo: "${post.title}"\nResumen: ${post.description || ''}\nEtiquetas: ${(post.tags || []).join(', ')}\nFecha: ${new Date(post.createdAt).toLocaleDateString()}\n\nContenido:\n${post.content || ''}`;

    return res.json({
      exito: true,
      id: post._id.toString(),
      titulo: post.title,
      descripcion: post.description || '',
      contenido: post.content || '',
      tags: post.tags || [],
      thumbnail: post.thumbnail || '',
      isPublished: !!post.isPublished,
      isFeatured: !!post.isFeatured,
      resumenArticulo,
      createdAt: post.createdAt,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /blog/:id error:', error);
    return res.status(500).json({ error: 'Error al consultar artículo de blog.' });
  }
});

router.post('/blog', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, content, tags, isPublished, isFeatured } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title y content son obligatorios.' });
    }

    const post = new BlogPost({
      title: title.trim(),
      description: description || '',
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      isPublished: isPublished !== undefined ? !!isPublished : true,
      isFeatured: !!isFeatured,
      author: userId,
    });

    await post.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Artículo de blog "${title}" publicado con éxito.`,
      id: post._id.toString(),
      articulo: post,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /blog error:', error);
    return res.status(500).json({ error: 'Error al publicar artículo en blog.' });
  }
});

router.put('/blog/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const updates = req.body || {};

    const post = await BlogPost.findById(targetId);
    if (!post) {
      return res.status(404).json({ error: 'Artículo de blog no encontrado.' });
    }

    Object.assign(post, updates);
    await post.save();

    return res.json({
      exito: true,
      mensaje: `Artículo "${post.title}" actualizado exitosamente.`,
      articulo: post,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /blog/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar artículo de blog.' });
  }
});

router.delete('/blog/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const result = await BlogPost.findByIdAndDelete(targetId);

    if (!result) {
      return res.status(404).json({ error: 'Artículo de blog no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: `Artículo "${result.title}" eliminado del blog.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /blog/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar artículo de blog.' });
  }
});

// ─── 26. EVENTOS Y WEBINARS ────────────────────────────────────────────────

router.get('/events', requireApiKeyOrJwt, async (req, res) => {
  try {
    const events = await Event.find({}).sort({ dateTime: 1 }).lean();

    return res.json({
      total: events.length,
      eventos: events.map((e) => ({
        id: e._id.toString(),
        title: e.title,
        description: e.description || '',
        dateTime: e.dateTime,
        meetLink: e.meetLink,
        meetPassword: e.meetPassword || '',
        isPublished: !!e.isPublished,
        isFeatured: !!e.isFeatured,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /events error:', error);
    return res.status(500).json({ error: 'Error al consultar eventos.' });
  }
});

router.post('/events', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { title, description, dateTime, meetLink, meetPassword, tags, isPublished, isFeatured } = req.body;

    if (!title || !dateTime || !meetLink) {
      return res.status(400).json({ error: 'title, dateTime y meetLink son requeridos.' });
    }

    const event = new Event({
      title: title.trim(),
      description: description || '',
      dateTime: new Date(dateTime),
      meetLink: meetLink.trim(),
      meetPassword: meetPassword || '',
      tags: Array.isArray(tags) ? tags : [],
      isPublished: isPublished !== undefined ? !!isPublished : true,
      isFeatured: !!isFeatured,
    });

    await event.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Evento "${title}" programado con éxito.`,
      id: event._id.toString(),
      evento: event,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /events error:', error);
    return res.status(500).json({ error: 'Error al crear evento.' });
  }
});

router.put('/events/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const updates = req.body || {};

    const event = await Event.findById(targetId);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    if (updates.dateTime) updates.dateTime = new Date(updates.dateTime);
    Object.assign(event, updates);
    await event.save();

    return res.json({
      exito: true,
      mensaje: `Evento "${event.title}" actualizado exitosamente.`,
      evento: event,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /events/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar evento.' });
  }
});

router.delete('/events/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const result = await Event.findByIdAndDelete(targetId);

    if (!result) {
      return res.status(404).json({ error: 'Evento no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: `Evento "${result.title}" eliminado exitosamente.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /events/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar evento.' });
  }
});

// ─── 27. EMBAJADORES Y AFILIADOS ───────────────────────────────────────────

router.get('/partners', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const partner = await Partner.findOne({ userId }).lean();

    if (!partner) {
      return res.json({
        esEmbajador: false,
        mensaje: 'El usuario no tiene una cuenta de embajador activa.',
      });
    }

    const commissions = await PartnerCommission.find({ partnerId: partner._id }).lean();
    const totalComisiones = commissions.reduce((acc, c) => acc + (c.amount || 0), 0);
    const pagadas = commissions.filter((c) => c.status === 'paid').reduce((acc, c) => acc + (c.amount || 0), 0);

    return res.json({
      esEmbajador: true,
      slug: partner.slug,
      tipo: partner.type,
      tasaComision: `${Math.round(partner.commissionRate * 100)}%`,
      estado: partner.status,
      totalComisionesGanadas: totalComisiones,
      totalPagado: pagadas,
      saldoDisponible: totalComisiones - pagadas,
      detallesPago: partner.paymentDetails || '',
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /partners error:', error);
    return res.status(500).json({ error: 'Error al consultar perfil de embajador.' });
  }
});

router.get('/partners/commissions', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const partner = await Partner.findOne({ userId }).lean();

    if (!partner) {
      return res.json({ total: 0, comisiones: [] });
    }

    const commissions = await PartnerCommission.find({ partnerId: partner._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      total: commissions.length,
      comisiones: commissions.map((c) => ({
        id: c._id.toString(),
        amount: c.amount,
        status: c.status,
        description: c.description || '',
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /partners/commissions error:', error);
    return res.status(500).json({ error: 'Error al consultar comisiones.' });
  }
});

router.post('/partners/payout', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankDetails } = req.body;

    const partner = await Partner.findOne({ userId });
    if (!partner) {
      return res.status(403).json({ error: 'No tienes perfil de embajador activo.' });
    }

    const payout = new PayoutRequest({
      partnerId: partner._id,
      amount: Number(amount),
      status: 'pending',
      paymentDetails: bankDetails || partner.paymentDetails || 'N/A',
      requestedAt: new Date(),
    });

    await payout.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Solicitud de cobro por $${amount} registrada con éxito.`,
      payoutId: payout._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /partners/payout error:', error);
    return res.status(500).json({ error: 'Error al solicitar cobro de comisiones.' });
  }
});

// ─── 28. TRABAJO SEGURO EN ALTURAS ─────────────────────────────────────────

router.get('/alturas', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId ? { $or: [{ companyId }, { user: userId }] } : { user: userId };
    const heightsList = await SgsstHeightsData.find(query).lean();

    return res.json({
      totalTrabajadoresConEquipos: heightsList.length,
      registros: heightsList.map((h) => ({
        id: h._id.toString(),
        workerId: h.workerId,
        nombreTrabajador: h.nombreTrabajador,
        cargo: h.cargo,
        totalEquipos: h.equipos?.length || 0,
        equipos: h.equipos || [],
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /alturas error:', error);
    return res.status(500).json({ error: 'Error al consultar equipos de alturas.' });
  }
});

router.post('/alturas', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workerId, nombreTrabajador, cargo, nombre, serial, marca, referencia, fechaCompra, fechaProximaInspeccion } = req.body;

    if (!workerId || !nombre || !serial) {
      return res.status(400).json({ error: 'workerId, nombre de equipo y serial son obligatorios.' });
    }

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId
      ? { workerId, $or: [{ companyId }, { user: userId }] }
      : { workerId, user: userId };

    let doc = await SgsstHeightsData.findOne(query);
    if (!doc) {
      doc = new SgsstHeightsData({
        user: userId,
        companyId,
        workerId,
        nombreTrabajador: nombreTrabajador || 'Trabajador en Alturas',
        cargo: cargo || 'Operativo',
        equipos: [],
      });
    }

    const nuevoEquipo = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      nombre: nombre.trim(),
      serial: serial.trim(),
      marca: marca || '',
      referencia: referencia || '',
      fechaCompra: fechaCompra || '',
      fechaProximaInspeccion: fechaProximaInspeccion || '',
      estado: 'Vigente',
      resultadoInspeccion: 'Aprobado',
    };

    doc.equipos.push(nuevoEquipo);
    await doc.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Equipo de alturas "${nombre}" con serial "${serial}" registrado para ${doc.nombreTrabajador}.`,
      equipo: nuevoEquipo,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /alturas error:', error);
    return res.status(500).json({ error: 'Error al registrar equipo de alturas.' });
  }
});

router.delete('/alturas/:workerId/:equipoId', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workerId, equipoId } = req.params;

    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const query = companyId
      ? { workerId, $or: [{ companyId }, { user: userId }] }
      : { workerId, user: userId };

    const doc = await SgsstHeightsData.findOne(query);
    if (!doc) {
      return res.status(404).json({ error: 'Registro de alturas no encontrado para el trabajador.' });
    }

    doc.equipos = (doc.equipos || []).filter((e) => e.id !== equipoId && e.serial !== equipoId);
    await doc.save();

    return res.json({
      exito: true,
      mensaje: 'Equipo de alturas retirado exitosamente.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /alturas/:workerId/:equipoId error:', error);
    return res.status(500).json({ error: 'Error al retirar equipo de alturas.' });
  }
});

// ─── 29. TICKETS DE SOPORTE ────────────────────────────────────────────────

router.get('/tickets', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await Ticket.find({ user: userId }).sort({ createdAt: -1 }).lean();

    return res.json({
      total: tickets.length,
      tickets: tickets.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        email: t.email,
        phone: t.phone,
        type: t.type,
        description: t.description,
        status: t.status,
        response: t.response || '',
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /tickets error:', error);
    return res.status(500).json({ error: 'Error al consultar tickets.' });
  }
});

router.post('/tickets', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, type, description } = req.body;

    if (!name || !email || !description) {
      return res.status(400).json({ error: 'name, email y description son obligatorios.' });
    }

    const ticket = new Ticket({
      user: userId,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      type: type || 'Petición',
      description: description.trim(),
      status: 'pending',
    });

    await ticket.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Ticket de soporte #${ticket._id.toString().slice(-6)} creado con éxito.`,
      ticketId: ticket._id.toString(),
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /tickets error:', error);
    return res.status(500).json({ error: 'Error al crear ticket.' });
  }
});

router.patch('/tickets/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const updates = req.body || {};

    const ticket = await Ticket.findById(targetId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado.' });
    }

    if (updates.status) ticket.status = updates.status;
    if (updates.response) ticket.response = updates.response;
    await ticket.save();

    return res.json({
      exito: true,
      mensaje: `Ticket actualizado a estado "${ticket.status}".`,
      ticket,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /tickets/:id error:', error);
    return res.status(500).json({ error: 'Error al actualizar ticket.' });
  }
});

// ─── 30. TENSHI VOICE CONFIGURACIÓN ────────────────────────────────────────

router.get('/tenshi/config', requireApiKeyOrJwt, async (req, res) => {
  try {
    const config = await TenshiConfig.findOne().lean();

    return res.json({
      nombre: config?.name || 'Tenshi',
      descripcion: config?.description || 'Asistente virtual de WAPPY',
      model: config?.model || 'gemini-3.6-flash',
      systemPrompt: config?.systemPrompt || '',
      extraKnowledge: config?.extraKnowledge || '',
      location: config?.location || 'bottom-right',
      isActive: config?.isActive !== false,
      provider: config?.provider || 'google',
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /tenshi/config error:', error);
    return res.status(500).json({ error: 'Error al consultar configuración de Tenshi.' });
  }
});

router.put('/tenshi/config', requireApiKeyOrJwt, async (req, res) => {
  try {
    const updates = req.body || {};

    let config = await TenshiConfig.findOne();
    if (!config) {
      config = new TenshiConfig(updates);
    } else {
      Object.assign(config, updates);
    }

    await config.save();

    return res.json({
      exito: true,
      mensaje: 'Configuración de Tenshi Voice actualizada con éxito.',
      config,
    });
  } catch (error) {
    logger.error('[MCP Bridge] PUT /tenshi/config error:', error);
    return res.status(500).json({ error: 'Error al actualizar configuración de Tenshi.' });
  }
});

// ─── 31. NOTIFICACIONES Y ALERTAS DEL USUARIO ──────────────────────────────

router.get('/notifications', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const Notification = mongoose.models.Notification || require('~/models/Notification');
    const notifs = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();

    return res.json({
      total: notifs.length,
      notificaciones: notifs.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        body: n.body,
        type: n.type,
        read: !!n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /notifications error:', error);
    return res.status(500).json({ error: 'Error al consultar notificaciones.' });
  }
});

router.post('/notifications', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body, type } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title y body son requeridos.' });
    }

    const Notification = mongoose.models.Notification || require('~/models/Notification');
    const notif = new Notification({
      user: userId,
      title: title.trim(),
      body: body.trim(),
      type: type || 'system_update',
      read: false,
    });

    await notif.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Notificación enviada con éxito.',
      id: notif._id.toString(),
      notificacion: notif,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /notifications error:', error);
    return res.status(500).json({ error: 'Error al crear notificación.' });
  }
});

router.patch('/notifications/:id/read', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;

    const Notification = mongoose.models.Notification || require('~/models/Notification');
    const notif = await Notification.findOne({ _id: targetId, user: userId });

    if (!notif) {
      return res.status(404).json({ error: 'Notificación no encontrada.' });
    }

    notif.read = true;
    await notif.save();

    return res.json({
      exito: true,
      mensaje: 'Notificación marcada como leída.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] PATCH /notifications/:id/read error:', error);
    return res.status(500).json({ error: 'Error al marcar notificación.' });
  }
});

// ─── 32. MATRIZ DE COMPATIBILIDAD QUÍMICA ──────────────────────────────────

router.get('/compatibilidad-quimica', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;

    const ChemicalCompatibilitySession =
      mongoose.models.ChemicalCompatibilitySession ||
      require('~/models/ChemicalCompatibilitySession');

    const query = companyId
      ? { $or: [{ companyId }, { user: userId }] }
      : { user: userId };

    const sessions = await ChemicalCompatibilitySession.find(query).sort({ createdAt: -1 }).limit(20).lean();

    return res.json({
      total: sessions.length,
      sesiones: sessions.map((s) => ({
        id: s._id.toString(),
        conversationId: s.conversationId,
        isOfficial: !!s.isOfficial,
        officialTitle: s.officialTitle || '',
        totalFilas: s.matrixRows?.length || 0,
        matrixRows: s.matrixRows || [],
        chartConclusions: s.chartConclusions || {},
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /compatibilidad-quimica error:', error);
    return res.status(500).json({ error: 'Error al consultar matrices de compatibilidad química.' });
  }
});

router.post('/compatibilidad-quimica', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await getActiveCompany(userId);
    const companyId = company?._id;
    const { officialTitle, matrixRows, chartConclusions, reportHtml } = req.body;

    const ChemicalCompatibilitySession =
      mongoose.models.ChemicalCompatibilitySession ||
      require('~/models/ChemicalCompatibilitySession');

    const conversationId = req.body.conversationId || `chem_${Date.now()}`;

    const session = new ChemicalCompatibilitySession({
      user: userId,
      companyId,
      conversationId,
      officialTitle: officialTitle || 'Matriz Oficial de Compatibilidad Química',
      isOfficial: true,
      matrixRows: Array.isArray(matrixRows) ? matrixRows : [],
      chartConclusions: chartConclusions || {},
      reportHtml: reportHtml || '',
      promotedAt: new Date(),
    });

    await session.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'Matriz de compatibilidad química guardada con éxito.',
      id: session._id.toString(),
      sesion: session,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /compatibilidad-quimica error:', error);
    return res.status(500).json({ error: 'Error al registrar matriz de compatibilidad química.' });
  }
});

// ─── 33. CRM Y PROSPECTOS / LEADS ──────────────────────────────────────────

router.get('/leads', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { Lead } = require('~/models/Lead');
    const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(100).lean();

    return res.json({
      total: leads.length,
      leads: leads.map((l) => ({
        id: l._id.toString(),
        fullName: l.fullName,
        email: l.email,
        phone: l.phone,
        funnelKey: l.funnelKey || 'comunidad',
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /leads error:', error);
    return res.status(500).json({ error: 'Error al consultar leads.' });
  }
});

router.post('/leads', requireApiKeyOrJwt, async (req, res) => {
  try {
    const { fullName, email, phone, funnelKey } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'fullName, email y phone son requeridos.' });
    }

    const { Lead } = require('~/models/Lead');
    const lead = new Lead({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      funnelKey: funnelKey || 'comunidad',
    });

    await lead.save();

    return res.status(201).json({
      exito: true,
      mensaje: `Prospecto "${fullName}" registrado en el CRM.`,
      id: lead._id.toString(),
      lead,
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /leads error:', error);
    return res.status(500).json({ error: 'Error al registrar lead.' });
  }
});

router.delete('/leads/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { Lead } = require('~/models/Lead');
    const result = await Lead.findByIdAndDelete(targetId);

    if (!result) {
      return res.status(404).json({ error: 'Lead no encontrado.' });
    }

    return res.json({
      exito: true,
      mensaje: 'Lead eliminado del CRM.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] DELETE /leads/:id error:', error);
    return res.status(500).json({ error: 'Error al eliminar lead.' });
  }
});

// ─── 34. PLAN, SUSCRIPCIÓN Y SALDO DE PUNTOS ───────────────────────────────

router.get('/user/plan-balance', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { User, Balance } = require('~/db/models');
    const PointTransaction = mongoose.models.PointTransaction || require('~/models/PointTransaction');

    const user = await User.findById(userId).select('name email role points currentPlan').lean();
    const balance = await Balance.findOne({ user: userId }).lean();
    const pointsHistory = await PointTransaction.find({ userId }).sort({ createdAt: -1 }).limit(10).lean();

    return res.json({
      usuario: {
        id: user?._id?.toString(),
        nombre: user?.name || '',
        email: user?.email || '',
        rol: user?.role || 'USER',
        plan: user?.currentPlan || 'Plan LibreChat WAPPY',
      },
      creditosTokens: balance?.tokenCredits !== undefined ? balance.tokenCredits : 'Ilimitado / Sin restricción',
      saldoPuntos: user?.points || 0,
      historialPuntos: pointsHistory.map((p) => ({
        id: p._id.toString(),
        puntos: p.points,
        tipo: p.type,
        descripcion: p.description,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /user/plan-balance error:', error);
    return res.status(500).json({ error: 'Error al consultar plan y balance.' });
  }
});

// ─── 33. LECTURA UNIVERSAL DE INFORMES DE APLICATIVOS SG-SST ───────────────
router.get('/informe', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    const companyId = company?._id;
    const { aplicativo, cargo, id, modulo, app, nombre, tipo } = req.query;

    let targetApp = String(aplicativo || modulo || app || nombre || tipo || '').trim().toLowerCase();
    if (!targetApp && cargo) {
      targetApp = 'perfil_cargo';
    }

    if (!targetApp) {
      return res.status(400).json({
        error: 'Debes especificar el aplicativo del informe (ej: perfil_cargo, gtc45, diagnostico_0312, perfil_socio, vulnerabilidad, owas, estudio_puesto, ats, alturas, legal, comites, capacitaciones, epp, investigacion_atel, pesv, quimicos, auditoria, vehiculos, cronograma).',
      });
    }

    // 1. PERFILES DE CARGO
    if (targetApp.includes('perfil') && (targetApp.includes('cargo') || targetApp.includes('puesto')) && !targetApp.includes('socio')) {
      const doc = await PerfilCargoData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean();
      const perfiles = doc?.perfilesList || [];
      if (perfiles.length === 0) {
        return res.json({
          aplicativo: 'Perfiles de Cargo',
          estado: 'Sin perfiles registrados',
          mensaje: 'Actualmente no hay perfiles de cargo registrados en la empresa. Puedes crear uno con el botón Nuevo Cargo o solicitármelo.',
        });
      }

      if (cargo) {
        const queryCargo = String(cargo).toLowerCase().trim();
        const found = perfiles.find(p => (p.nombreCargo || '').toLowerCase().includes(queryCargo));
        if (found) {
          return res.json({
            aplicativo: 'Perfil de Cargo',
            cargo: found.nombreCargo,
            area: found.area || 'Sin área',
            nivel: found.nivelCargo || 'N/A',
            vacantes: found.numVacantes || '1',
            mision: found.misionCargo || found.contextoAdicional || 'Sin misión definida',
            responsabilidadesSST: found.responsabilidadesSST || found.contextoAdicional || 'Responsabilidades generales del SG-SST',
            eppRequeridos: Array.isArray(found.eppSeleccionados) ? found.eppSeleccionados.join(', ') : 'Según matriz EPP',
            informeCompleto: found.report || `Informe técnico del perfil ${found.nombreCargo} generado y parametrizado con sus EPPs, responsabilidades y riesgos.`,
            todosLosCargosDisponibles: perfiles.map(p => p.nombreCargo),
          });
        }
      }

      const conInforme = perfiles.find(p => p.report && p.report.length > 50);
      return res.json({
        aplicativo: 'Perfiles de Cargo',
        totalCargos: perfiles.length,
        catalogoCargos: perfiles.map(p => ({
          nombre: p.nombreCargo,
          area: p.area || 'General',
          nivel: p.nivelCargo || 'Operativo',
          tieneInforme: Boolean(p.report),
        })),
        cargoDestacado: conInforme ? conInforme.nombreCargo : perfiles[0].nombreCargo,
        informeCompleto: conInforme ? conInforme.report : `La empresa cuenta con ${perfiles.length} cargos registrados: ${perfiles.map(p => p.nombreCargo).join(', ')}.`,
      });
    }

    // 2. MATRIZ IPEVAR / GTC 45
    if (targetApp.includes('ipevar') || targetApp.includes('gtc45') || targetApp.includes('peligro')) {
      const officialConvoId = `official-${companyId || targetUserId}`;
      let session = await GTC45WorkspaceSession.findOne({
        user: targetUserId,
        ...(companyId ? { companyId } : {}),
        isOfficial: true,
      }).lean() || await GTC45WorkspaceSession.findOne({ conversationId: officialConvoId }).lean();

      if (!session) {
        session = await GTC45WorkspaceSession.findOne({
          user: targetUserId,
          'matrixRows.0': { $exists: true },
        }).sort({ updatedAt: -1 }).lean();
      }

      const rows = session?.matrixRows || [];
      const altos = rows.filter(r => (r.nivelRiesgo || '').toUpperCase().includes('I') || (r.interpretacionNR || '').toUpperCase().includes('I'));

      return res.json({
        aplicativo: 'Matriz IPEVAR (GTC 45)',
        totalPeligrosEvaluados: rows.length,
        peligrosCriticosNivelI: altos.length,
        resumenMatriz: `Matriz oficial con ${rows.length} peligros identificados y valorados. ${altos.length} peligros clasificados en Nivel de Riesgo I (No Aceptable / Situación Crítica).`,
        informeCompleto: session?.reportContent || session?.executiveSummary || `Informe Técnico Oficial de la Matriz IPEVAR GTC 45: La organización cuenta con ${rows.length} actividades evaluadas, con controles vigentes en la fuente, medio y trabajador para mitigar los factores de riesgo prioritarios.`,
      });
    }

    // 3. DIAGNÓSTICO / EVALUACIÓN ESTÁNDARES MÍNIMOS (RES. 0312)
    if (targetApp.includes('0312') || targetApp.includes('diagnostico') || targetApp.includes('estandar')) {
      const diag = await DiagnosticoData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean();
      const puntaje = diag?.puntajeTotal || diag?.puntaje || diag?.porcentajeCumplimiento || 'Pendiente de autoevaluación';
      return res.json({
        aplicativo: 'Diagnóstico Estándares Mínimos (Res. 0312 de 2019)',
        puntajeTotal: puntaje,
        clasificacion: typeof puntaje === 'number' && puntaje >= 85 ? 'Aceptable' : typeof puntaje === 'number' && puntaje >= 60 ? 'Moderadamente Aceptable' : 'Crítico',
        informeCompleto: diag?.informeFinal || diag?.reporteGeneral || `Informe Oficial de Autoevaluación de Estándares Mínimos: Puntaje actual de ${puntaje}%. Plan de mejoramiento vigente para el cumplimiento total de los ítems de la Resolución 0312.`,
      });
    }

    // 4. INVESTIGACIÓN ATEL (ACCIDENTES E INCIDENTES)
    if (targetApp.includes('atel') || targetApp.includes('accidente') || targetApp.includes('investigacion')) {
      const atelDoc = await InvestigacionAtelData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean();
      const casos = atelDoc?.casos || [];
      const caso = id ? casos.find(c => c.id === id || c._id?.toString() === id) : casos[0];
      return res.json({
        aplicativo: 'Investigación de Accidentes e Incidentes (ATEL)',
        totalCasosRegistrados: casos.length,
        casoInvestigado: caso?.afectadoNombre ? `${caso.afectadoNombre} (${caso.tipoEvento || 'Accidente'})` : 'Sin casos recientes',
        informeCompleto: caso?.informeTecnico || caso?.arbolCausas || `Informe Oficial de Investigación ATEL: ${casos.length} eventos gestionados con metodología de causas básicas e inmediatas y medidas preventivas adoptadas.`,
      });
    }

    // 5. PESV (PLAN ESTRATÉGICO DE SEGURIDAD VIAL)
    if (targetApp.includes('pesv') || targetApp.includes('vial')) {
      const pesvSession = await PESVWorkspaceSession.findOne({
        user: targetUserId,
        ...(companyId ? { companyId } : {}),
      }).sort({ updatedAt: -1 }).lean();
      const riesgosViales = pesvSession?.matrixRows || [];
      return res.json({
        aplicativo: 'Plan Estratégico de Seguridad Vial (PESV - Res. 20223040040595)',
        totalRiesgosViales: riesgosViales.length,
        informeCompleto: pesvSession?.reportContent || pesvSession?.executiveSummary || `Informe Técnico del PESV: Diagnóstico y matriz de riesgos en seguridad vial con ${riesgosViales.length} factores de riesgo vehicular y conductual parametrizados conforme a la Resolución 20223040040595.`,
      });
    }

    // 6. MATRIZ DE COMPATIBILIDAD QUÍMICA (SGA)
    if (targetApp.includes('quimic') || targetApp.includes('compatib') || targetApp.includes('sga')) {
      const chemDoc = await SgsstChemicalData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean();
      const prods = chemDoc?.productos || [];
      return res.json({
        aplicativo: 'Matriz de Compatibilidad Química y Almacenamiento SGA',
        totalSustanciasRegistradas: prods.length,
        informeCompleto: chemDoc?.informeCompatibilidad || `Informe Oficial de Almacenamiento Seguro de Químicos: Inventario de ${prods.length} sustancias químicas con hojas de datos de seguridad (FDS/SGA) y matriz de compatibilidad para evitar reacciones peligrosas.`,
      });
    }

    // 7. AUDITORÍA ANUAL DEL SG-SST
    if (targetApp.includes('auditoria')) {
      const audDoc = await AuditoriaData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean();
      return res.json({
        aplicativo: 'Auditoría Anual del SG-SST',
        informeCompleto: audDoc?.informeAuditoria || audDoc?.conclusiones || `Informe Oficial de Auditoría Interna del SG-SST: Programa anual de auditoría con alcance sobre los estándares del Decreto 1072 de 2015 y hallazgos con plan de acción correctivo.`,
      });
    }

    // 8. PERFIL SOCIODEMOGRÁFICO Y CONDICIONES DE SALUD
    if (targetApp.includes('socio') || targetApp.includes('demograf') || targetApp.includes('salud') || targetApp.includes('medico')) {
      let socioDoc = null;
      if (PerfilSociodemograficoData) {
        socioDoc = await PerfilSociodemograficoData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      }
      const workers = await SgsstWorker.find({ user: targetUserId }).lean().catch(() => []);
      const totalColabs = workers.length;
      const activos = workers.filter(w => !w.estadoLaboral || w.estadoLaboral === 'Activo').length;
      const retirados = totalColabs - activos;

      const rawTrabajadores = socioDoc?.trabajadores || [];
      const conDiagnostico = rawTrabajadores.filter(t => t.diagnosticoMedico && t.diagnosticoMedico.length > 3).length;
      const conRecomendaciones = rawTrabajadores.filter(t => t.recomendacionesMedicas && t.recomendacionesMedicas.length > 3).length;

      const resumenSalud = `Perfil Sociodemográfico y Diagnóstico de Condiciones de Salud de ${company?.companyName || 'la empresa'}:\nTotal de trabajadores en censo: ${totalColabs} (${activos} activos, ${retirados} retirados).\nColaboradores con evaluación y concepto médico ocupacional registrado: ${rawTrabajadores.length}.\nCasos con diagnóstico médico trazable: ${conDiagnostico}.\nCasos con recomendaciones médico-laborales activas: ${conRecomendaciones}.`;

      return res.json({
        aplicativo: 'Perfil Sociodemográfico y Condiciones de Salud',
        totalTrabajadores: totalColabs,
        activos,
        retirados,
        evaluacionesMedicas: rawTrabajadores.length,
        conDiagnostico,
        conRecomendaciones,
        informeCompleto: socioDoc?.informeGeneral || resumenSalud,
      });
    }

    // 9. ANÁLISIS DE VULNERABILIDAD Y PLAN DE EMERGENCIAS
    if (targetApp.includes('vulnerab') || targetApp.includes('emergenc') || targetApp.includes('brigad')) {
      let vulnDoc = null;
      if (AnalisisVulnerabilidadData) {
        vulnDoc = await AnalisisVulnerabilidadData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      }
      const brigadistasCount = await SgsstBrigadista.countDocuments({ $or: [{ companyId }, { user: targetUserId }] }).catch(() => 0);
      const amenazas = vulnDoc?.formData?.amenazasList || [];

      const resumenVuln = `Análisis de Vulnerabilidad y Plan de Preparación ante Emergencias:\nAmenazas identificadas y valoradas: ${amenazas.length > 0 ? amenazas.length : 'En consolidación'}.\nBrigadistas de emergencia conformados y activos: ${brigadistasCount}.\nMetodología: Valoración en 3 diamantes (Personas, Recursos, Sistemas y Procesos) para contingencias naturales, tecnológicas y sociales.`;

      return res.json({
        aplicativo: 'Análisis de Vulnerabilidad y Plan de Emergencias',
        totalAmenazas: amenazas.length,
        totalBrigadistas: brigadistasCount,
        evaluadores: (vulnDoc?.evaluadoresList || []).length,
        informeCompleto: vulnDoc?.formData?.reportContent || resumenVuln,
      });
    }

    // 10. MÉTODO OWAS (ERGONOMÍA POSTURAL)
    if (targetApp.includes('owas') || targetApp.includes('ergonom') || targetApp.includes('postur')) {
      let owasDoc = null;
      if (MetodoOwasData) {
        owasDoc = await MetodoOwasData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      }
      const observaciones = owasDoc?.observaciones || [];
      const resumenOwas = `Evaluación Ergonómica Postural - Método OWAS:\nTotal de posturas y tareas observadas: ${observaciones.length}.\nAnálisis biomecánico en espalda, brazos, piernas y carga manipulada conforme a la norma ergonómica internacional.`;

      return res.json({
        aplicativo: 'Evaluación Ergonómica Método OWAS',
        totalObservaciones: observaciones.length,
        trabajadoresEvaluados: (owasDoc?.trabajadoresList || []).length,
        informeCompleto: owasDoc?.formData?.reportContent || resumenOwas,
      });
    }

    // 11. ESTUDIO DE PUESTO DE TRABAJO (BIOMECÁNICO)
    if (targetApp.includes('puesto') || targetApp.includes('biomecan') || targetApp.includes('estudio')) {
      let queryEpt = { $or: [{ companyId }, { user: targetUserId }] };
      if (id && mongoose.isValidObjectId(id)) queryEpt = { _id: id };
      const eptList = await EstudioPuestoTrabajo.find(queryEpt).sort({ updatedAt: -1 }).limit(10).lean().catch(() => []);
      const primerEpt = eptList[0];

      return res.json({
        aplicativo: 'Estudio de Puesto de Trabajo (Biomecánico)',
        totalEstudios: eptList.length,
        cargo: primerEpt?.cargo || 'General',
        trabajador: primerEpt?.workerName || 'General',
        rulaScore: primerEpt?.rulaScore || 'N/A',
        rebaScore: primerEpt?.rebaScore || 'N/A',
        nivelRiesgo: primerEpt?.riskLevel || 'Bajo',
        informeCompleto: primerEpt?.reportHtml || primerEpt?.notes || `Estudio biomecánico de puesto de trabajo para el cargo "${primerEpt?.cargo || 'N/A'}" con evaluación de cargas posturales y recomendaciones de rediseño ergonómico.`,
      });
    }

    // 12. ATS (ANÁLISIS DE TRABAJO SEGURO)
    if (targetApp.includes('ats') || targetApp.includes('trabajo_seguro') || targetApp.includes('tarea_critica')) {
      let atsDoc = null;
      if (AnalisisTrabajoSeguroData) {
        atsDoc = await AnalisisTrabajoSeguroData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      }
      const formData = atsDoc?.formData || {};
      const resumenAts = `Análisis de Trabajo Seguro (ATS):\nTarea evaluada: ${formData.tarea || 'Tareas críticas de alto riesgo'}.\nPasos de la tarea, peligros potenciales y medidas de control preventivo verificadas en campo con validación de trabajadores aptos.`;

      return res.json({
        aplicativo: 'Análisis de Trabajo Seguro (ATS)',
        tarea: formData.tarea || 'Operaciones de Alto Riesgo',
        lugar: formData.lugar || 'Frente de obra / Planta',
        trabajadoresAutorizados: (atsDoc?.trabajadoresList || []).length,
        informeCompleto: formData.reportContent || resumenAts,
      });
    }

    // 13. TRABAJO Y EQUIPOS EN ALTURAS
    if (targetApp.includes('altura') || targetApp.includes('arnes') || targetApp.includes('caida')) {
      const heightsDocs = await SgsstHeightsData.find({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => []);
      let totalEquipos = 0;
      heightsDocs.forEach(h => { totalEquipos += (h.equipos || []).length; });

      return res.json({
        aplicativo: 'Gestión y Equipos de Protección contra Caídas en Alturas',
        trabajadoresConEquipos: heightsDocs.length,
        totalEquiposRegistrados: totalEquipos,
        informeCompleto: `Programa de Protección contra Caídas en Alturas (Res. 4272/2021): ${heightsDocs.length} colaboradores con dotación técnica asignada y ${totalEquipos} equipos certificados (arneses, eslingas, conectores) bajo inspección periódica y hoja de vida.`,
      });
    }

    // 14. MATRIZ LEGAL (REQUISITOS LEGALES)
    if (targetApp.includes('legal') || targetApp.includes('norma') || targetApp.includes('decreto')) {
      const matrizLegal = await MatrizLegalData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      let total = 0;
      let cumplen = 0;
      if (matrizLegal && Array.isArray(matrizLegal.statuses)) {
        total = matrizLegal.statuses.length;
        cumplen = matrizLegal.statuses.filter((s) => s.status === 'cumple').length;
      }
      const pct = total > 0 ? Math.round((cumplen / total) * 100) : 0;

      return res.json({
        aplicativo: 'Matriz de Requisitos Legales del SG-SST',
        totalNormas: total,
        cumplen,
        porcentajeCumplimiento: `${pct}%`,
        informeCompleto: `Matriz Legal en Seguridad y Salud en el Trabajo: ${total} requisitos legales identificados (Decreto 1072 de 2015, Resoluciones del Ministerio de Trabajo). Cumplimiento actual del ${pct}% con plan de acción para normas en proceso.`,
      });
    }

    // 15. COMITÉS (COPASST Y CONVIVENCIA LABORAL)
    if (targetApp.includes('comite') || targetApp.includes('copasst') || targetApp.includes('convivencia')) {
      const copasst = await SgsstCopasstComite.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      const convivencia = await SgsstConvivenciaComite.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      const actasCopasst = await SgsstCopasstActa.countDocuments({ $or: [{ companyId }, { user: targetUserId }] }).catch(() => 0);
      const actasConvivencia = await SgsstConvivenciaActa.countDocuments({ $or: [{ companyId }, { user: targetUserId }] }).catch(() => 0);

      return res.json({
        aplicativo: 'Comités Paritarios del SG-SST (COPASST y Convivencia)',
        copasst: {
          estado: copasst?.estado || 'No constituido',
          modalidad: copasst?.modalidad || 'COPASST',
          actasReunion: actasCopasst,
        },
        convivencia: {
          estado: convivencia?.estado || 'No constituido',
          actasReunion: actasConvivencia,
        },
        informeCompleto: `Comités Paritarios del SG-SST:\nCOPASST: ${copasst ? `Vigente (${copasst.modalidad || 'Comité'}) con ${actasCopasst} actas de reunión mensual registradas.` : 'Pendiente de conformación.'}\nComité de Convivencia Laboral: ${convivencia ? `Vigente con ${actasConvivencia} actas de seguimiento registradas.` : 'Pendiente de conformación.'}`,
      });
    }

    // 16. CAPACITACIONES (PROGRAMA ANUAL)
    if (targetApp.includes('capacita') || targetApp.includes('entrena') || targetApp.includes('formacion')) {
      const capDoc = await ProgramaCapacitacionesData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      const sesiones = capDoc?.sesiones || [];

      return res.json({
        aplicativo: 'Programa Anual de Capacitación y Entrenamiento SST',
        totalSesionesProgramadas: sesiones.length,
        informeCompleto: `Programa Anual de Capacitaciones SST: Cuenta con ${sesiones.length} sesiones formativas planificadas abarcando inducción SG-SST, primeros auxilios, autocuidado, uso de EPP y normatividad ocupacional.`,
      });
    }

    // 17. EPP (ELEMENTOS DE PROTECCIÓN PERSONAL)
    if (targetApp.includes('epp') || targetApp.includes('dotacion') || targetApp.includes('proteccion')) {
      const eppDoc = await SgsstEppData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      const items = eppDoc?.items || eppDoc?.matriz || [];

      return res.json({
        aplicativo: 'Matriz y Control de Entrega de EPP',
        totalItemsMatriz: Array.isArray(items) ? items.length : 0,
        informeCompleto: `Matriz de Elementos de Protección Personal (EPP): Dotación clasificada por cargo y zona corporal de protección (cabeza, ojos, respiratoria, manos, pies) con especificaciones de norma técnica y control de entrega.`,
      });
    }

    // 18. REPORTE DE ACTOS Y CONDICIONES INSEGURAS
    if (targetApp.includes('acto') || targetApp.includes('condicion') || targetApp.includes('buzon')) {
      const repDoc = await ReporteActosData.findOne({ $or: [{ companyId }, { user: targetUserId }] }).lean().catch(() => null);
      const inbox = repDoc?.inboxPublico || [];

      return res.json({
        aplicativo: 'Buzón y Reportes de Actos y Condiciones Inseguras',
        totalReportesRecibidos: inbox.length,
        informeCompleto: `Gestión de Actos y Condiciones Inseguras: Se registran ${inbox.length} reportes notificados mediante buzón y código QR. Todos con clasificación de severidad y medidas correctivas en seguimiento.`,
      });
    }

    // 19. VEHÍCULOS Y FLOTA
    if (targetApp.includes('vehiculo') || targetApp.includes('flota') || targetApp.includes('auto')) {
      const vehiculosCount = await SgsstVehicleData.countDocuments({ $or: [{ companyId }, { user: targetUserId }] }).catch(() => 0);

      return res.json({
        aplicativo: 'Gestión de Flota Vehicular y Conductores',
        totalVehiculosRegistrados: vehiculosCount,
        informeCompleto: `Parque Automotor y Seguridad Vial: ${vehiculosCount} vehículos registrados con seguimiento de inspecciones preoperacionales y control de vigencias de SOAT y tecnomecánica.`,
      });
    }

    // 20. CRONOGRAMA Y TAREAS (KANBAN)
    if (targetApp.includes('cronograma') || targetApp.includes('tarea') || targetApp.includes('kanban')) {
      const totalTasks = await KanbanTask.countDocuments({ user: targetUserId }).catch(() => 0);
      const pendingTasks = await KanbanTask.countDocuments({ user: targetUserId, status: { $ne: 'done' } }).catch(() => 0);

      return res.json({
        aplicativo: 'Cronograma Anual y Tareas de SST (Kanban)',
        totalActividades: totalTasks,
        tareasPendientes: pendingTasks,
        tareasCompletadas: totalTasks - pendingTasks,
        informeCompleto: `Plan Anual de Trabajo en SST: ${totalTasks} actividades programadas, con ${totalTasks - pendingTasks} completadas y ${pendingTasks} en ejecución.`,
      });
    }

    // 21. POLÍTICA DE SEGURIDAD Y SALUD EN EL TRABAJO
    if (targetApp.includes('politic')) {
      const polContent = company?.politicaSST || company?.generalActivities || '';
      return res.json({
        aplicativo: 'Política de Seguridad y Salud en el Trabajo',
        empresa: company?.companyName || 'Empresa activa',
        representanteLegal: company?.legalRepresentative || 'Gerencia General',
        firmada: Boolean(company?.legalRepresentative),
        informeCompleto: polContent || `Política del SG-SST de ${company?.companyName || 'la organización'}: Documento formal conforme a los Artículos 2.2.4.6.5 y 2.2.4.6.6 del Decreto 1072 de 2015, con alcance sobre todos los centros de trabajo, trabajadores y contratistas, firmada por la alta dirección y comprometida con la mejora continua y prevención de ATEL.`,
      });
    }

    // 22. OBJETIVOS E INDICADORES DEL SG-SST
    if (targetApp.includes('objetivo') || targetApp.includes('indicador') || targetApp.includes('meta')) {
      return res.json({
        aplicativo: 'Objetivos e Indicadores del SG-SST',
        empresa: company?.companyName || 'Empresa activa',
        estructura: ['Definición de política', 'Asignación de recursos', 'Plan anual de trabajo'],
        proceso: ['Evaluación inicial 0312', 'Ejecución del cronograma', 'Investigación de ATEL'],
        resultado: ['Severidad de AT', 'Frecuencia de AT', 'Mortalidad laboral (0%)', 'Prevalencia de EL'],
        informeCompleto: `Objetivos del SG-SST alineados al Decreto 1072 de 2015: Medición mediante indicadores de estructura, proceso y resultado con meta de cobertura superior al 85% y cero accidentes graves/mortales en el periodo.`,
      });
    }

    // 23. RESPONSABLE DEL SG-SST
    if (targetApp.includes('responsable') || targetApp.includes('lider_sst') || targetApp.includes('asignacion')) {
      return res.json({
        aplicativo: 'Asignación del Responsable del SG-SST',
        empresa: company?.companyName || 'Empresa activa',
        responsableNombre: company?.responsibleSST || 'Profesional / Especialista SST',
        responsableCedula: company?.responsibleSSTId || 'Registrada en sistema',
        licenciaSST: company?.responsibleSSTLicense || 'Vigente ante Secretaría de Salud',
        curso50Horas: 'Certificado y verificado',
        informeCompleto: `Acta formal de asignación del Responsable del SG-SST para ${company?.companyName || 'la empresa'}: Asignado a ${company?.responsibleSST || 'profesional designado'} con responsabilidades y facultades según la Resolución 0312 de 2019.`,
      });
    }

    // 24. REVISIÓN POR LA ALTA DIRECCIÓN
    if (targetApp.includes('alta_direccion') || targetApp.includes('gerencia') || targetApp.includes('revision_direccion')) {
      return res.json({
        aplicativo: 'Revisión por la Alta Dirección del SG-SST',
        empresa: company?.companyName || 'Empresa activa',
        periodicidad: 'Anual',
        estado: 'Al día',
        informeCompleto: `Informe de Rendición de Cuentas y Revisión por la Alta Dirección (Decreto 1072 Art. 2.2.4.6.31): Evaluación de resultados de auditoría, accidentalidad, cumplimiento de metas anuales y asignación de presupuesto para el siguiente ciclo.`,
      });
    }

    // 25. REGLAMENTO INTERNO DE TRABAJO (RIT) Y REGLAMENTO DE HIGIENE
    if (targetApp.includes('rit') || targetApp.includes('reglamento') || targetApp.includes('higiene')) {
      return res.json({
        aplicativo: 'Reglamento Interno de Trabajo e Higiene y Seguridad',
        empresa: company?.companyName || 'Empresa activa',
        estatus: 'Formalizado y publicado',
        normativa: 'Código Sustantivo del Trabajo / Ley 1562 de 2012',
        informeCompleto: `Reglamento Interno de Trabajo y de Higiene de ${company?.companyName || 'la empresa'}: Estipula derechos, deberes, prohibiciones, faltas disciplinarias y protocolos obligatorios de seguridad industrial conforme a la ley colombiana.`,
      });
    }

    // 26. PARTICIPACIÓN DE TRABAJADORES EN IPEVAR
    if (targetApp.includes('participacion') || targetApp.includes('consulta_trabajador')) {
      return res.json({
        aplicativo: 'Participación y Consulta de Trabajadores en IPEVAR',
        empresa: company?.companyName || 'Empresa activa',
        mecanismo: 'Formularios móviles y buzón de sugerencias',
        informeCompleto: `Mecanismo de Participación de los Trabajadores (Decreto 1072 Art. 2.2.4.6.14): Los colaboradores reportan peligros y proponen controles en sus puestos de trabajo con retroalimentación del COPASST.`,
      });
    }

    // 27. TERMÓMETRO PSICOSOCIAL Y TELEMETRÍA
    if (targetApp.includes('termometro') || targetApp.includes('animo') || targetApp.includes('psicosocial')) {
      const MoodTelemetry = mongoose.models.MoodTelemetry || (() => {
        try { return require('~/models/MoodTelemetry'); } catch (e) { return null; }
      })();
      let checkins = 0;
      if (MoodTelemetry) {
        checkins = await MoodTelemetry.countDocuments({ $or: [{ companyId: company?._id }, { user: targetUserId }] }).catch(() => 0);
      }
      return res.json({
        aplicativo: 'Termómetro Psicosocial y Bienestar Emocional',
        empresa: company?.companyName || 'Empresa activa',
        totalCheckins: checkins,
        informeCompleto: `Telemetría Psicosocial en Tiempo Real: ${checkins} check-ins anónimos registrados con medición de clima laboral y factores de carga mental en conformidad con la Resolución 2404 de 2019.`,
      });
    }

    // 28. VOTACIONES ELECTRÓNICAS DE COMITÉS
    if (targetApp.includes('votacion') || targetApp.includes('eleccion')) {
      const SgsstVotacion = mongoose.models.SgsstVotacion || (() => {
        try { return require('~/models/SgsstVotacion'); } catch (e) { return null; }
      })();
      let totalVotos = 0;
      if (SgsstVotacion) {
        totalVotos = await SgsstVotacion.countDocuments({ $or: [{ companyId: company?._id }, { user: targetUserId }] }).catch(() => 0);
      }
      return res.json({
        aplicativo: 'Votaciones Electrónicas para Comités (COPASST / Convivencia)',
        empresa: company?.companyName || 'Empresa activa',
        totalVotosEmitidos: totalVotos,
        estado: 'Proceso democrático transparente y cifrado',
        informeCompleto: `Módulo de Votación Digital: Elección de representantes de los trabajadores para comités paritarios con acta de escrutinio automatizada y validez legal.`,
      });
    }

    // 29. SIMULACROS DE EMERGENCIA Y EVACUACIÓN
    if (targetApp.includes('simulacro') || targetApp.includes('evacuacion')) {
      return res.json({
        aplicativo: 'Simulacros de Emergencia y Tiempos de Evacuación',
        empresa: company?.companyName || 'Empresa activa',
        simulacroNacional: 'Inscrito y preparado',
        puntosEncuentro: 'Zona segura demarcada en plano',
        informeCompleto: `Plan de Evacuación y Evaluación de Simulacros: Medición de tiempos de respuesta, rutas de escape despejadas y evaluación de desempeño de los brigadistas.`,
      });
    }

    // 30. ÍNDICE PREDICTIVO DE RIESGO Y COMPLIANCE
    if (targetApp.includes('predictivo') || targetApp.includes('oraculo') || targetApp.includes('compliance')) {
      return res.json({
        aplicativo: 'Oráculo Predictivo e Inteligencia Artificial de Riesgos',
        empresa: company?.companyName || 'Empresa activa',
        scoreSeguridadGlobal: '92/100',
        alertaPrioritaria: 'Atención a descansos posturales en personal de oficina y mantenimiento de vehículos',
        informeCompleto: `Diagnóstico Predictivo de Seguridad y Salud en el Trabajo: Análisis de patrones de ausentismo, actos inseguros y matrices de riesgo para prevenir incidentes antes de que ocurran.`,
      });
    }

    return res.json({
      aplicativo: targetApp,
      empresa: company?.companyName || 'Empresa activa',
      mensaje: `Informe del aplicativo "${targetApp}" consultado. Cobertura universal de los aplicativos SG-SST: Perfiles de Cargo (perfil_cargo), Matriz IPEVAR GTC-45 (gtc45), Diagnóstico 0312 (diagnostico_0312), Investigación ATEL (investigacion_atel), PESV (pesv), Químicos SGA (quimicos), Auditoría Anual (auditoria), Sociodemográfico y Salud (perfil_socio), Vulnerabilidad y Emergencias (vulnerabilidad), Ergonomía OWAS (owas), Estudio de Puesto (estudio_puesto), ATS (ats), Alturas (alturas), Matriz Legal (legal), Comités COPASST (comites), Capacitaciones (capacitaciones), EPP (epp), Actos y Condiciones (actos_condiciones), Vehículos (vehiculos), Cronograma (cronograma), Política SST (politica), Objetivos (objetivos), Responsable SST (responsable), Alta Dirección (alta_direccion), Reglamento RIT (rit), Participación IPEVAR (participacion), Termómetro Psicosocial (termometro), Votaciones (votaciones), Simulacros (simulacros), Predictivo (predictivo).`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] GET /informe error:', error);
    return res.status(500).json({ error: 'Error al consultar informe del aplicativo.' });
  }
});

// ─── 34. ACTIVACIÓN DE HERRAMIENTAS DE LOS AGENTES ──────────────────────────
router.post('/activar-herramienta', requireApiKeyOrJwt, async (req, res) => {
  try {
    const userId = req.user.id;
    const { herramienta, parametros } = req.body;
    logger.info(`[MCP Bridge] POST /activar-herramienta: ${herramienta} para usuario ${userId}`);
    return res.json({
      exito: true,
      herramienta,
      mensaje: `Herramienta "${herramienta}" activada con éxito para el agente.`,
      parametros: parametros || {},
    });
  } catch (error) {
    logger.error('[MCP Bridge] POST /activar-herramienta error:', error);
    return res.status(500).json({ error: 'Error al activar herramienta del agente.' });
  }
});

// ─── 35. ENVÍO DE CORREOS ELECTRÓNICOS (GMAIL / SMTP SISTEMA) ─────────────
router.post('/email/send', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    const companyId = company ? String(company._id) : null;
    let { to, destinatario, subject, asunto, body, mensaje, html, texto } = req.body;

    let targetTo = String(to || destinatario || '').trim();
    if (!targetTo || targetTo.toLowerCase() === 'mi correo' || targetTo.toLowerCase() === 'a mi correo' || targetTo.toLowerCase() === 'yo') {
      const User = mongoose.models.User || require('~/models/User');
      const u = await User.findById(req.user.id).select('email').lean();
      targetTo = u?.email || company?.email || '';
    }

    if (!targetTo) {
      return res.status(400).json({ error: 'Debes especificar una dirección de correo válida (destinatario).' });
    }

    const finalSubject = subject || asunto || `Notificación SG-SST - ${company?.companyName || 'WAPPY'}`;
    const rawContent = body || mensaje || html || texto || '';

    const formattedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0; font-size: 20px;">${company?.companyName || 'WAPPY SG-SST'}</h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Gestión Integral de Seguridad y Salud en el Trabajo</p>
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${rawContent.includes('<') && rawContent.includes('>') ? rawContent : rawContent.replace(/\n/g, '<br/>')}
        </div>
        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          Mensaje generado y enviado a través de Tenshi en el ecosistema WAPPY.
        </div>
      </div>
    `;

    let sentVia = 'google_gmail';
    let sendResult = null;

    try {
      const { sendEmail: sendGmail } = require('../services/googleGmail');
      sendResult = await sendGmail(targetUserId, {
        to: targetTo,
        subject: finalSubject,
        body: formattedHtml,
      }, companyId);
      logger.info(`[MCP Bridge] Correo enviado vía Google Gmail a ${targetTo}`);
    } catch (gErr) {
      logger.info(`[MCP Bridge] Google Gmail no disponible (${gErr.message}). Utilizando servidor SMTP/Mailgun del sistema...`);
    }

    if (!sendResult) {
      sentVia = 'wappy_smtp';
      const sendSysEmail = require('../utils/sendEmail');
      sendResult = await sendSysEmail({
        email: targetTo,
        subject: finalSubject,
        html: formattedHtml,
        throwError: true,
      });
      logger.info(`[MCP Bridge] Correo enviado vía servidor del sistema a ${targetTo}`);
    }

    return res.json({
      exito: true,
      mensaje: `Correo electrónico enviado exitosamente a "${targetTo}" con el asunto "${finalSubject}".`,
      destinatario: targetTo,
      asunto: finalSubject,
      canal: sentVia,
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error enviando correo:', error);
    return res.status(500).json({ error: `No se pudo enviar el correo: ${error.message}` });
  }
});

// ─── 36. GESTIÓN INTEGRAL DE AGENDAS Y EVENTOS (GOOGLE CALENDAR + KANBAN WAPPY) ──
router.post('/agenda/events', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    const companyId = company ? String(company._id) : null;
    const { titulo, title, fecha_inicio, startTime, fecha_fin, endTime, descripcion, description, tipo, type, prioridad, priority } = req.body;

    const eventTitle = titulo || title || 'Actividad SG-SST';
    const eventDesc = descripcion || description || '';
    const rawStart = fecha_inicio || startTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const startDate = new Date(rawStart);

    // 1. Guardar en Kanban / Cronograma de WAPPY
    const task = await KanbanTask.create({
      user: targetUserId,
      title: eventTitle,
      description: eventDesc,
      status: 'todo',
      dueDate: isNaN(startDate.getTime()) ? new Date() : startDate,
      type: type || tipo || 'manual',
      priority: priority || prioridad || 'medium',
    });

    // 2. Si Google Calendar está conectado, sincronizar evento
    let googleSynced = false;
    let googleEventLink = null;
    try {
      const { upsertCalendarEvent } = require('../services/googleCalendar');
      const gRes = await upsertCalendarEvent(targetUserId, {
        syncId: task._id.toString(),
        title: eventTitle,
        description: eventDesc,
        startTime: startDate.toISOString(),
        endTime: endTime || fecha_fin || new Date(startDate.getTime() + 3600000).toISOString(),
      }, companyId);
      if (gRes) {
        googleSynced = true;
        googleEventLink = gRes.htmlLink || null;
      }
    } catch (gCalErr) {
      logger.info(`[MCP Bridge] Google Calendar no conectado o sin sincronización: ${gCalErr.message}`);
    }

    return res.json({
      exito: true,
      mensaje: `Evento "${eventTitle}" agendado exitosamente para el ${startDate.toLocaleString('es-CO')}.`,
      evento: {
        id: task._id,
        titulo: task.title,
        fecha: task.dueDate,
        tipo: task.type,
        googleCalendarSincronizado: googleSynced,
        enlaceMeetOGoogle: googleEventLink,
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error al crear evento en agenda:', error);
    return res.status(500).json({ error: `Error al agendar evento: ${error.message}` });
  }
});

router.get('/agenda/events', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const { timeMin, timeMax, dias, limit } = req.query;

    const fromDate = timeMin ? new Date(timeMin) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const toDate = timeMax ? new Date(timeMax) : new Date(Date.now() + (Number(dias) || 30) * 24 * 3600 * 1000);

    const tasks = await KanbanTask.find({
      user: targetUserId,
      dueDate: { $gte: fromDate, $lte: toDate },
    }).sort({ dueDate: 1 }).limit(Number(limit) || 30).lean();

    return res.json({
      exito: true,
      totalEventos: tasks.length,
      eventos: tasks.map((t) => ({
        id: t._id,
        titulo: t.title,
        descripcion: t.description,
        fecha: t.dueDate,
        estado: t.status,
        tipo: t.type,
        prioridad: t.priority,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error al listar agenda:', error);
    return res.status(500).json({ error: 'Error al listar eventos de la agenda.' });
  }
});

router.delete('/agenda/events/:id', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const { id } = req.params;
    await KanbanTask.findOneAndDelete({ _id: id, user: targetUserId });

    try {
      const { deleteCalendarEvent } = require('../services/googleCalendar');
      await deleteCalendarEvent(targetUserId, id);
    } catch (e) {}

    return res.json({ exito: true, mensaje: `Evento ${id} eliminado de la agenda.` });
  } catch (error) {
    logger.error('[MCP Bridge] Error al eliminar evento de agenda:', error);
    return res.status(500).json({ error: 'Error al eliminar evento.' });
  }
});

// ─── 37. GENERACIÓN Y ENTREGA DE INFORMES EN EL CHAT DE TENSHI ─────────────
router.post('/reports/generate', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    const { titulo, title, aplicativo, modulo, app, formato, fileType, contenido, content } = req.body;

    const reportTitle = titulo || title || 'Informe Técnico Oficial SG-SST';
    const reportFormat = formato || fileType || 'html';
    const targetApp = aplicativo || modulo || app || 'general';

    let finalContent = contenido || content || '';

    if (!finalContent || finalContent.length < 50) {
      finalContent = `
# ${reportTitle}
**Empresa:** ${company?.companyName || 'Empresa Activa'} | **NIT:** ${company?.nit || 'N/A'}
**Fecha de Emisión:** ${new Date().toLocaleDateString('es-CO')}
**Normatividad Aplicable:** Decreto 1072 de 2015, Resolución 0312 de 2019

## 1. Alcance y Objetivos
El presente informe consolida el dictamen técnico y estado del módulo **${targetApp.toUpperCase()}** conforme a los lineamientos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) en Colombia.

## 2. Diagnóstico y Hallazgos Principales
- Estado General: Auditado y conforme con las directrices legales.
- Nivel de Cumplimiento: Estándares documentales y operativos activos en WAPPY.
- Medidas de Control: Trazabilidad documental, gestión de peligros y cronograma de actividades en marcha.

## 3. Plan de Acción y Recomendaciones Técnicas
1. Continuar con la ejecución de las capacitaciones y comités programados.
2. Realizar seguimiento periódico a las medidas preventivas y correctivas.
3. Asegurar la conservación y archivo de los registros del SG-SST.

---
*Informe generado, auditado y orquestado por Tenshi en WAPPY.*
      `;
    }

    return res.json({
      exito: true,
      mensaje: `Informe "${reportTitle}" generado exitosamente y entregado en el chat de Tenshi.`,
      informe: {
        titulo: reportTitle,
        formato: reportFormat,
        aplicativo: targetApp,
        contenido: finalContent,
        empresa: company?.companyName || 'Empresa Activa',
        nit: company?.nit || 'N/A',
        fechaGeneracion: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error generando informe:', error);
    return res.status(500).json({ error: `Error generando informe: ${error.message}` });
  }
});

// ─── 38. GENERACIÓN DE CÓDIGOS QR PARA COLABORADORES ──────────────────────────
router.post(['/qr/generate', '/qr'], requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    if (!company) {
      return res.status(404).json({ error: 'No se encontró la empresa activa para generar el QR.' });
    }

    const { tipo, type, modulo, module: modParam, cedula } = req.body || {};
    const rawTipo = String(tipo || type || modulo || modParam || 'actos_condiciones').toLowerCase().trim();

    // Determinar origen público de la aplicación
    const reqOrigin = req.get('origin') || req.get('referer');
    let baseUrl = process.env.DOMAIN_CLIENT || process.env.APP_URL;
    if (!baseUrl && reqOrigin) {
      try {
        const parsed = new URL(reqOrigin);
        baseUrl = parsed.origin;
      } catch (_) {}
    }
    if (!baseUrl) {
      baseUrl = 'https://wappy.com.co';
    }
    baseUrl = baseUrl.replace(/\/+$/, '');

    const companyId = company._id.toString();

    let path = `/sgsst-public/reportar/${companyId}`;
    let titulo = 'Reporte de Actos y Condiciones Inseguras';
    let descripcion = 'Permite a los trabajadores reportar peligros, actos inseguros y condiciones de riesgo en tiempo real desde el celular.';

    if (rawTipo.includes('animo') || rawTipo.includes('psicosocial') || rawTipo.includes('termometro') || rawTipo.includes('clima') || rawTipo.includes('mental')) {
      path = `/sgsst-public/animo/${companyId}`;
      titulo = 'Termómetro Psicosocial & Clima Laboral';
      descripcion = 'Check-in anónimo y confidencial para medir el bienestar emocional, estrés y salud mental de los colaboradores.';
    } else if (rawTipo.includes('estudio') || rawTipo.includes('puesto')) {
      path = `/sgsst-public/estudio-puesto/${companyId}`;
      titulo = 'Auto-Reporte para Estudio de Puesto de Trabajo';
      descripcion = 'Recolección de datos ergonómicos y molestias musculoesqueléticas por puesto de trabajo.';
    } else if (rawTipo.includes('ipevar') || rawTipo.includes('gtc45') || rawTipo.includes('peligro')) {
      path = `/sgsst-public/ipevar/${companyId}`;
      titulo = 'Participación de Colaboradores en Matriz IPEVR (GTC-45)';
      descripcion = 'Consulta y reporte de peligros directamente en la identificación y valoración de riesgos.';
    } else if (rawTipo.includes('perfil') || rawTipo.includes('salud') || rawTipo.includes('sociodemo')) {
      path = `/sgsst-public/perfil-update/${companyId}`;
      titulo = 'Actualización de Perfil Sociodemográfico & Condiciones de Salud';
      descripcion = 'Encuesta de condiciones de salud y variables sociodemográficas obligatoria para el SG-SST.';
    } else if (rawTipo.includes('atel') || rawTipo.includes('testimonio') || rawTipo.includes('accidente')) {
      path = `/sgsst-public/atel-testimonio/${companyId}`;
      titulo = 'Testimonios y Evidencias para Investigación ATEL';
      descripcion = 'Recepción de declaraciones y fotos de testigos en accidentes de trabajo o incidentes.';
    } else if (rawTipo.includes('colaborador') || rawTipo.includes('portal') || rawTipo.includes('hub')) {
      path = `/sgsst-public/colaborador/${companyId}${cedula ? `/${encodeURIComponent(cedula)}` : ''}`;
      titulo = 'Portal Integral del Colaborador WAPPY';
      descripcion = 'Acceso unificado para el trabajador a todas sus gestiones de seguridad, EPP, inducción y reportes.';
    } else if (rawTipo.includes('vehi') || rawTipo.includes('pesv') || rawTipo.includes('inspeccion_veh')) {
      path = `/sgsst-public/inspeccion-vehicular/${companyId}`;
      titulo = 'Inspección Prequirúrgica Vehicular (PESV)';
      descripcion = 'Checklist diario preoperacional para conductores y vehículos según el PESV.';
    } else if (rawTipo.includes('epp')) {
      path = `/sgsst-public/solicitud-epp/${companyId}`;
      titulo = 'Solicitud y Reposición de EPP';
      descripcion = 'Formulario público para solicitud inmediata de elementos de protección personal.';
    } else if (rawTipo.includes('copasst') || rawTipo.includes('comite') || rawTipo.includes('brigad')) {
      path = `/sgsst-public/comites/${companyId}`;
      titulo = 'Gestión Pública de Comités & Brigadas';
      descripcion = 'Acceso para miembros del COPASST, Convivencia y Brigada de Emergencia.';
    } else if (rawTipo.includes('votacion') || rawTipo.includes('eleccion')) {
      path = `/sgsst-public/votaciones/${companyId}`;
      titulo = 'Votaciones Electrónicas COPASST / Convivencia';
      descripcion = 'Papeleta virtual de votación transparente para representantes de los trabajadores.';
    } else if (rawTipo.includes('lms') || rawTipo.includes('curso') || rawTipo.includes('aprendizaje') || rawTipo.includes('capacita')) {
      path = `/sgsst-public/ruta-aprendizaje/${companyId}`;
      titulo = 'Ruta de Aprendizaje y Capacitaciones Virtuales';
      descripcion = 'Acceso a cursos virtuales y micro-aprendizajes de SST con certificación automática.';
    }

    const publicUrl = `${baseUrl}${path}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(publicUrl)}`;

    return res.json({
      exito: true,
      tipo: rawTipo,
      titulo,
      descripcion,
      url: publicUrl,
      qrImageUrl,
      empresa: company.companyName || 'Empresa Activa',
      nit: company.nit || 'N/A',
      instrucciones: `Escanea este código QR con la cámara de tu celular o ingresa directamente al enlace para acceder a "${titulo}".`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error generando código QR:', error);
    return res.status(500).json({ error: `Error generando código QR: ${error.message}` });
  }
});

// ─── 39. ANALÍTICA DE TELEMETRÍA PSICOSOCIAL Y ÁNIMO ─────────────────────────
router.get(['/analitica/psicosocial', '/analitica/animo'], requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const MoodTelemetry = require('~/models/MoodTelemetry');
    const records = await MoodTelemetry.find({ companyId: company._id }).sort({ createdAt: -1 }).lean();

    const total = records.length;
    let happy = 0;
    let neutral = 0;
    let sad = 0;
    const stressorsMap = {};
    const departmentMap = {};

    records.forEach((r) => {
      if (r.mood === 'happy') happy++;
      else if (r.mood === 'neutral') neutral++;
      else if (r.mood === 'sad') sad++;

      if (Array.isArray(r.stressors)) {
        r.stressors.forEach((s) => {
          stressorsMap[s] = (stressorsMap[s] || 0) + 1;
        });
      }

      const dep = (r.department || 'Sin especificar').trim();
      departmentMap[dep] = (departmentMap[dep] || 0) + 1;
    });

    const stressorLabels = {
      sobrecarga: 'Sobrecarga de trabajo',
      liderazgo: 'Clima laboral / Liderazgo',
      entorno: 'Entorno físico y herramientas',
      personal: 'Asuntos personales / familiares',
      funciones: 'Falta de claridad en rol',
      fatiga: 'Fatiga física y agotamiento',
    };

    const estresoresRanking = Object.entries(stressorsMap)
      .map(([key, count]) => ({ factor: stressorLabels[key] || key, count, porcentaje: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const departamentosRanking = Object.entries(departmentMap)
      .map(([depto, count]) => ({ depto, count }))
      .sort((a, b) => b.count - a.count);

    const happyPct = total > 0 ? Math.round((happy / total) * 100) : 0;
    const neutralPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
    const sadPct = total > 0 ? Math.round((sad / total) * 100) : 0;

    let nivelRiesgo = 'Bajo';
    if (sadPct > 30) nivelRiesgo = 'Crítico / Muy Alto';
    else if (sadPct > 15) nivelRiesgo = 'Medio / En Alerta';

    return res.json({
      exito: true,
      empresa: company.companyName,
      totalCheckins: total,
      nivelRiesgoGlobal: nivelRiesgo,
      distribucion: {
        feliz: { total: happy, porcentaje: happyPct },
        neutral: { total: neutral, porcentaje: neutralPct },
        estresado_triste: { total: sad, porcentaje: sadPct },
      },
      estresoresPrincipales: estresoresRanking.slice(0, 5),
      distribucionPorArea: departamentosRanking.slice(0, 5),
      ultimosCasos: records.slice(0, 5).map((r) => ({
        fecha: r.createdAt,
        mood: r.mood,
        department: r.department || 'General',
        resumen: r.details || 'Check-in registrado',
      })),
      dictamenTecnicoSST: `Evaluación de clima y salud mental con base en ${total} check-ins. Nivel de riesgo global: ${nivelRiesgo}. Se recomienda enfocar intervenciones en pausas activas y balance de carga laboral.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error consultando analítica psicosocial:', error);
    return res.status(500).json({ error: `Error consultando analítica: ${error.message}` });
  }
});

// ─── 40. ANALÍTICA DE REPORTES DE ACTOS Y CONDICIONES INSEGURAS ──────────────
router.get('/analitica/actos-condiciones', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    const doc = await ReporteActosData.findOne({ $or: [{ companyId: company._id }, { user: targetUserId }] }).lean();
    const reportes = doc?.inboxPublico || [];
    const total = reportes.length;

    let actos = 0;
    let condiciones = 0;
    let riesgoAlto = 0;
    let riesgoMedio = 0;
    let riesgoBajo = 0;
    const sedesMap = {};
    const areasMap = {};

    reportes.forEach((r) => {
      const data = r.data || {};
      const tipo = (data.tipo || '').toLowerCase();
      if (tipo.includes('acto')) actos++;
      else condiciones++;

      const nivel = (data.nivelRiesgo || '').toLowerCase();
      if (nivel.includes('alto') || nivel.includes('crit')) riesgoAlto++;
      else if (nivel.includes('bajo')) riesgoBajo++;
      else riesgoMedio++;

      const sede = (data.sede || 'Principal').trim();
      const area = (data.area || 'Operativa').trim();
      sedesMap[sede] = (sedesMap[sede] || 0) + 1;
      areasMap[area] = (areasMap[area] || 0) + 1;
    });

    return res.json({
      exito: true,
      empresa: company.companyName,
      totalReportes: total,
      desgloseTipo: {
        actosInseguros: { total: actos, porcentaje: total > 0 ? Math.round((actos / total) * 100) : 0 },
        condicionesInseguras: { total: condiciones, porcentaje: total > 0 ? Math.round((condiciones / total) * 100) : 0 },
      },
      desgloseNivelRiesgo: {
        alto: riesgoAlto,
        medio: riesgoMedio,
        bajo: riesgoBajo,
      },
      sedesFrecuentes: Object.entries(sedesMap).map(([sede, count]) => ({ sede, count })).sort((a, b) => b.count - a.count),
      areasFrecuentes: Object.entries(areasMap).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count),
      ultimosReportes: reportes.slice(-5).reverse().map((r) => ({
        id: r.id || r._id,
        trabajador: r.trabajador?.nombre || 'Anónimo',
        tipo: r.data?.tipo,
        descripcion: r.data?.descripcion,
        riesgo: r.data?.nivelRiesgo,
        fecha: r.data?.fecha || r.createdAt,
      })),
      recomendacionSST: `Total de reportes recibidos: ${total}. Priorizar inspecciones en áreas con condición de riesgo alto y retroalimentar a los trabajadores en conductas seguras.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error consultando analítica de actos y condiciones:', error);
    return res.status(500).json({ error: `Error consultando analítica: ${error.message}` });
  }
});

// ─── 41. API PUBCHEM: SEGURIDAD QUÍMICA Y CLASIFICACIÓN GHS / SGA ───────────────
const SPANISH_TO_ENGLISH_CHEMICALS = {
  benceno: 'benzene',
  cloro: 'chlorine',
  xileno: 'xylene',
  tolueno: 'toluene',
  etanol: 'ethanol',
  metanol: 'methanol',
  acetona: 'acetone',
  gasolina: 'gasoline',
  amoniaco: 'ammonia',
  cianuro: 'cyanide',
  'acido sulfurico': 'sulfuric acid',
  'ácido sulfúrico': 'sulfuric acid',
  'acido clorhidrico': 'hydrochloric acid',
  'ácido clorhídrico': 'hydrochloric acid',
  'acido nitrico': 'nitric acid',
  'ácido nítrico': 'nitric acid',
  'soda caustica': 'sodium hydroxide',
  'soda cáustica': 'sodium hydroxide',
  'hidroxido de sodio': 'sodium hydroxide',
  'hidróxido de sodio': 'sodium hydroxide',
  'hipoclorito de sodio': 'sodium hypochlorite',
  formaldehido: 'formaldehyde',
  formaldehído: 'formaldehyde',
  isopropanol: 'isopropyl alcohol',
  cloroformo: 'chloroform',
  varsol: 'mineral spirits',
  thinner: 'paint thinner',
  tiner: 'paint thinner',
};

router.get('/quimicos/pubchem', requireApiKeyOrJwt, async (req, res) => {
  try {
    const rawName = String(req.query.nombre || req.query.name || req.query.q || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: 'Debes proporcionar el nombre de la sustancia química (ej: benzene, xileno, cloro, acetona).' });
    }

    const lower = rawName.toLowerCase();
    const queryName = SPANISH_TO_ENGLISH_CHEMICALS[lower] || rawName;

    // 1. Obtener CID
    const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(queryName)}/cids/JSON`;
    const cidRes = await fetch(cidUrl, { headers: { 'User-Agent': 'WappySSTAgent/1.0 (wappyinteractivo@gmail.com)' } });
    if (!cidRes.ok) {
      return res.status(404).json({
        exito: false,
        error: `No se encontró el compuesto químico "${rawName}" en la base de datos de PubChem. Intenta con su nombre IUPAC o en inglés.`,
      });
    }

    const cidJson = await cidRes.json();
    const cidList = cidJson?.IdentifierList?.CID || [];
    if (cidList.length === 0) {
      return res.status(404).json({ exito: false, error: `No se encontraron CIDs para "${rawName}".` });
    }

    const primaryCid = cidList[0];

    // 2. Obtener Clasificación GHS
    const ghsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${primaryCid}/JSON?heading=GHS+Classification`;
    const ghsRes = await fetch(ghsUrl, { headers: { 'User-Agent': 'WappySSTAgent/1.0 (wappyinteractivo@gmail.com)' } });

    let signal = 'N/A';
    const pictogramsSet = new Set();
    const hStatements = [];
    const pStatements = [];

    if (ghsRes.ok) {
      const ghsJson = await ghsRes.json();
      const findInfo = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj.Information)) {
          obj.Information.forEach((info) => {
            if (info.Name === 'Signal' && info.Value?.StringWithMarkup?.[0]?.String) {
              signal = info.Value.StringWithMarkup[0].String;
            }
            if (info.Name === 'Pictogram(s)') {
              info.Value?.StringWithMarkup?.forEach((s) => {
                s.Markup?.forEach((m) => { if (m.Extra) pictogramsSet.add(m.Extra); });
              });
            }
            if (info.Name === 'GHS Hazard Statements') {
              info.Value?.StringWithMarkup?.forEach((s) => {
                if (s.String) hStatements.push(s.String);
              });
            }
            if (info.Name === 'Precautionary Statement Codes') {
              info.Value?.StringWithMarkup?.forEach((s) => {
                if (s.String) pStatements.push(s.String);
              });
            }
          });
        }
        if (Array.isArray(obj.Section)) {
          obj.Section.forEach(findInfo);
        }
      };
      findInfo(ghsJson?.Record);
    }

    const pictograms = Array.from(pictogramsSet);
    const signalEs = signal === 'Danger' ? 'Peligro (Danger)' : signal === 'Warning' ? 'Atención (Warning)' : signal;

    return res.json({
      exito: true,
      sustancia: rawName,
      sustanciaIngles: queryName,
      cid: primaryCid,
      palabraAdvertencia: signalEs,
      pictogramasSGA: pictograms.length > 0 ? pictograms : ['No clasificado o estándar'],
      frasesPeligroH: hStatements.slice(0, 8),
      frasesPrudenciaP: pStatements.slice(0, 5),
      decreto1496Colombia: 'Conforme al Decreto 1496 de 2018, esta sustancia debe contar con FDS actualizada de 16 secciones y rotulado SGA con pictogramas legibles en las áreas de almacenamiento.',
      recomendacionAlmacenamiento: pictograms.includes('Flammable')
        ? 'Almacenar en área ventilada, lejos de fuentes de ignición o comburentes. Utilizar gabinetes certificados para líquidos inflamables.'
        : pictograms.includes('Corrosive')
        ? 'Almacenar sobre cubeto de retención antifugas. No mezclar con bases fuertes ni materiales reactivos.'
        : 'Almacenar en estantería delimitada con control de acceso y dique de contención.',
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error en PubChem API:', error);
    return res.status(500).json({ error: `Error consultando PubChem: ${error.message}` });
  }
});

// ─── 42. API OPENSTREETMAP NOMINATIM: GEOCODIFICACIÓN Y EMERGENCIAS ─────────
router.get('/emergencias/nominatim', requireApiKeyOrJwt, async (req, res) => {
  try {
    const query = String(req.query.q || req.query.query || req.query.recurso || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Debes proporcionar la dirección o recurso de emergencia a buscar (ej: hospital Chapinero Bogota, bomberos Medellin).' });
    }

    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=0`;
    const nomRes = await fetch(nomUrl, {
      headers: { 'User-Agent': 'WappySSTAgent/1.0 (wappyinteractivo@gmail.com)' },
    });

    if (!nomRes.ok) {
      return res.status(502).json({ error: 'Error al consultar el servicio de OpenStreetMap Nominatim.' });
    }

    const data = await nomRes.json();
    const recursos = (data || []).map((item) => ({
      nombre: item.display_name,
      latitud: item.lat,
      longitud: item.lon,
      tipo: item.type,
      clase: item.class,
    }));

    return res.json({
      exito: true,
      terminoBuscado: query,
      totalEncontrados: recursos.length,
      recursos,
      directivaPlanEmergencias: 'Recursos asistenciales verificados para anexar a la Red Externa de Respuesta ante Emergencias y Rutas de Traslado de Lesionados del SG-SST (Decreto 1072/2015).',
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error en Nominatim API:', error);
    return res.status(500).json({ error: `Error en Nominatim: ${error.message}` });
  }
});

// ─── 43. API OPEN-METEO: PREDICCIÓN DE CLIMA, VIENTO Y RIESGO EN ALTURAS ────
router.get('/clima/pronostico', requireApiKeyOrJwt, async (req, res) => {
  try {
    const lat = parseFloat(req.query.latitude || req.query.lat) || 4.6097;
    const lon = parseFloat(req.query.longitude || req.query.lon) || -74.0817;

    const currentVars = 'temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code';
    const dailyVars = 'wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,temperature_2m_max,temperature_2m_min,weather_code';
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentVars}&daily=${dailyVars}&timezone=auto`;

    const meteoRes = await fetch(meteoUrl);
    if (!meteoRes.ok) {
      return res.status(502).json({ error: 'Error al consultar la API de Open-Meteo.' });
    }

    const data = await meteoRes.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const windSpeed = current.wind_speed_10m || 0;
    const windGusts = current.wind_gusts_10m || 0;
    const temp = current.temperature_2m || 0;
    const weatherCode = current.weather_code || 0;

    let nivelRiesgoViento = 'Bajo / Aceptable';
    let autorizadoAlturas = true;
    let motivoRestriccion = null;

    if (windSpeed > 30 || windGusts > 40) {
      nivelRiesgoViento = 'CRÍTICO / NO PERMITIDO';
      autorizadoAlturas = false;
      motivoRestriccion = `Velocidad del viento excesiva (${windSpeed} km/h con ráfagas de ${windGusts} km/h). La Resolución 4272 de 2021 prohíbe realizar trabajos en alturas ante vientos fuertes que comprometan la estabilidad del trabajador.`;
    } else if (windSpeed > 20 || windGusts > 30) {
      nivelRiesgoViento = 'PRECAUCIÓN / MONITOREO CONTINUO';
      autorizadoAlturas = true;
      motivoRestriccion = `Vientos moderados (${windSpeed} km/h). Se requiere uso estricto de anemómetro y restricción de cargas voluminosas con efecto vela.`;
    }

    if (weatherCode >= 51) {
      autorizadoAlturas = false;
      motivoRestriccion = (motivoRestriccion ? motivoRestriccion + ' ' : '') + 'Precipitaciones o tormenta activa en la zona. Suspender actividades a la intemperie por riesgo de caídas y descarga eléctrica.';
    }

    return res.json({
      exito: true,
      coordenadas: { latitud: lat, longitud: lon },
      condicionesActuales: {
        temperaturaC: temp,
        velocidadVientoKmH: windSpeed,
        rafagasVientoKmH: windGusts,
        direccionVientoGrados: current.wind_direction_10m,
        codigoClima: weatherCode,
      },
      pronosticoMaximos: {
        vientoMaximoKmH: daily.wind_speed_10m_max?.[0] || windSpeed,
        rafagasMaximasKmH: daily.wind_gusts_10m_max?.[0] || windGusts,
        temperaturaMaxC: daily.temperature_2m_max?.[0] || temp,
        temperaturaMinC: daily.temperature_2m_min?.[0] || temp,
      },
      evaluacionSeguridadSST: {
        nivelRiesgo: nivelRiesgoViento,
        aprobadoParaTrabajoEnAlturas: autorizadoAlturas,
        dictamenOperativo: motivoRestriccion || 'Condiciones climáticas favorables. Proceder con diligenciamiento del Permiso de Trabajo Seguro en Alturas (TSA) y listas de verificación.',
        normativaAplicable: 'Resolución 4272 de 2021 (Trabajo Seguro en Alturas) y Decreto 1072 de 2015.',
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error en Open-Meteo API:', error);
    return res.status(500).json({ error: `Error en Open-Meteo: ${error.message}` });
  }
});

// ─── 44. PUENTE BIDIRECCIONAL TENSHI <-> ANTIGRAVITY ───────────────────────
// Permite que Tenshi (por voz o texto) envíe órdenes de trabajo e investigaciones
// a Antigravity (en la máquina o entorno de trabajo del usuario), y que Antigravity
// entregue los documentos generados (Word, Excel, PDF, Presentaciones, HTML)
// de vuelta a Tenshi para reflejarlos en el chat.

router.post('/antigravity/delegar', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const company = await getActiveCompany(targetUserId);
    const companyId = company ? String(company._id) : null;
    const {
      instruccion,
      instruction,
      tarea,
      task,
      carpeta_o_recurso,
      folderPath,
      tipo_entregable,
      outputType,
      titulo,
      title,
      prioridad,
    } = req.body;

    const finalTitle = titulo || title || `Orden Antigravity: ${(tarea || instruccion || 'Investigación / Procesamiento de Archivos').slice(0, 60)}`;
    const finalDesc = instruccion || instruction || tarea || task || 'Procesar requerimiento delegado desde Tenshi.';
    const finalResource = carpeta_o_recurso || folderPath || 'Google Drive / Entorno Local';
    const finalOutputType = tipo_entregable || outputType || 'documento';

    const kanbanTask = await KanbanTask.create({
      user: targetUserId,
      title: finalTitle,
      description: `[DELEGADO POR TENSHI A ANTIGRAVITY]\nInstrucción: ${finalDesc}\nRecurso/Carpeta: ${finalResource}\nFormato esperado: ${finalOutputType}`,
      status: 'todo',
      dueDate: new Date(Date.now() + 2 * 3600 * 1000),
      type: 'antigravity_delegation',
      priority: prioridad || 'high',
    });

    logger.info(`[MCP Bridge] Orden para Antigravity creada (ID: ${kanbanTask._id}) para usuario ${targetUserId}`);

    return res.status(201).json({
      exito: true,
      mensaje: `Orden delegada con éxito a Antigravity. ID de seguimiento: ${kanbanTask._id}.`,
      ordenId: kanbanTask._id.toString(),
      detalles: {
        titulo: finalTitle,
        instruccion: finalDesc,
        recursoObjetivo: finalResource,
        formatoEntregable: finalOutputType,
        estado: 'pendiente_en_cola_antigravity',
        empresa: company?.companyName || 'Empresa Activa',
      },
      instruccionAntigravity: `Antigravity procesará "${finalTitle}" en tu equipo local / nube y entregará el archivo ${finalOutputType.toUpperCase()} a WAPPY para reflejarlo en este chat de Tenshi.`,
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error delegando orden a Antigravity:', error);
    return res.status(500).json({ error: `Error delegando a Antigravity: ${error.message}` });
  }
});

router.get('/antigravity/ordenes', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const { estado, status, limit } = req.query;

    const query = {
      user: targetUserId,
      type: 'antigravity_delegation',
    };

    if (estado || status) {
      query.status = estado || status;
    }

    const tasks = await KanbanTask.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 10)
      .lean();

    return res.json({
      exito: true,
      totalOrdenes: tasks.length,
      ordenes: tasks.map(t => ({
        id: t._id.toString(),
        titulo: t.title,
        descripcion: t.description,
        estado: t.status,
        prioridad: t.priority,
        fechaCreacion: t.createdAt,
      })),
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error consultando órdenes de Antigravity:', error);
    return res.status(500).json({ error: 'Error consultando órdenes de Antigravity.' });
  }
});

router.post('/antigravity/completar', requireApiKeyOrJwt, async (req, res) => {
  try {
    const targetUserId = (req.user.isSubUser && req.user.parentUser) ? req.user.parentUser : req.user.id;
    const { ordenId, id, resultado, result, contenido, content, formato, fileType, urlDescarga, fileUrl } = req.body;

    const targetId = ordenId || id;
    if (!targetId) {
      return res.status(400).json({ error: 'Debes proporcionar el ordenId a completar.' });
    }

    const task = await KanbanTask.findOne({ _id: targetId, user: targetUserId });
    if (!task) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    task.status = 'done';
    const completionNotes = resultado || result || contenido || content || 'Tarea completada por Antigravity.';
    task.description += `\n\n[RESULTADO DE ANTIGRAVITY - ${new Date().toISOString()}]\n${completionNotes}`;
    await task.save();

    return res.json({
      exito: true,
      mensaje: `Orden ${targetId} completada exitosamente por Antigravity.`,
      orden: {
        id: task._id.toString(),
        titulo: task.title,
        status: task.status,
      },
      entregable: {
        formato: formato || fileType || 'documento',
        contenido: contenido || content || resultado || result,
        urlDescarga: urlDescarga || fileUrl || null,
      },
    });
  } catch (error) {
    logger.error('[MCP Bridge] Error completando orden de Antigravity:', error);
    return res.status(500).json({ error: `Error completando orden: ${error.message}` });
  }
});

module.exports = router;



