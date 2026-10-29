'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const ChemicalCompatibilitySession = require('~/models/ChemicalCompatibilitySession');
const CompanyInfo = require('~/models/CompanyInfo');
const KanbanTask = require('~/models/KanbanTask');
const SgsstChemicalData = require('~/models/SgsstChemicalData');
const DiagnosticoData = require('~/models/DiagnosticoData');
const SgsstWorker = require('~/models/SgsstWorker');
const { buildStandardHeader, buildSignatureSection } = require('./reportHeader');
const { generateWithKeyRotation, SGSST_FALLBACK_MODELS, cleanRawRows } = require('./sgsstGemini');

const TEST_FALLBACK_EMAILS = [
  'carlos@grupowappy.com',
  'test_wappy_trial_1792945447151@wappy.club',
  'pruebaspc96@gmail.com',
  'grupowappy@gmail.com',
  'felix.bedoya15@gmail.com',
];

function round2(val) {
  return Math.round(Number(val || 0) * 100) / 100;
}

function toSentenceCase(str) {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function ensureChemicalEcosystemModels() {
  const inlineRoutes = [
    './matrizPeligros',
    './perfilesCargo',
    './perfilSociodemografico',
    './programaCapacitaciones',
  ];
  for (const modPath of inlineRoutes) {
    try {
      require(modPath);
    } catch (_) {
      // Ignorar si ya fue cargado
    }
  }
}

/**
 * Resuelve el usuario propietario efectivo y la empresa activa (soporta Multi-Empresa, Subusuarios y Cuentas de Prueba)
 */
async function resolveUserAndCompany(reqOrUser, explicitCompanyId = null) {
  let userOrId = reqOrUser;
  let companyIdParam = explicitCompanyId;

  if (
    reqOrUser &&
    typeof reqOrUser === 'object' &&
    (reqOrUser.user !== undefined || reqOrUser.headers !== undefined || reqOrUser.query !== undefined)
  ) {
    userOrId = reqOrUser.user;
    companyIdParam =
      explicitCompanyId ||
      reqOrUser.headers?.['x-company-id'] ||
      reqOrUser.query?.companyId ||
      reqOrUser.body?.companyId ||
      null;
  }

  let rawUserId = userOrId;
  let userEmail = '';
  let isSubUser = false;
  let parentUser = null;
  let assignedCompany = companyIdParam;

  const isUserObject =
    userOrId &&
    typeof userOrId === 'object' &&
    !(userOrId instanceof mongoose.Types.ObjectId) &&
    !Buffer.isBuffer(userOrId) &&
    typeof userOrId.toHexString !== 'function';

  if (isUserObject) {
    rawUserId = String(userOrId.id || userOrId._id || '');
    userEmail = String(userOrId.email || '').toLowerCase().trim();
    isSubUser = Boolean(userOrId.isSubUser);
    parentUser = userOrId.parentUser || userOrId.parentUserId || null;
    const firstAllowed =
      Array.isArray(userOrId.allowedCompanies) && userOrId.allowedCompanies.length > 0
        ? userOrId.allowedCompanies[0]
        : null;
    assignedCompany =
      companyIdParam ||
      userOrId.assignedCompany ||
      userOrId.assignedCompanyId ||
      firstAllowed ||
      null;
  } else if (rawUserId) {
    rawUserId = String(rawUserId);
    if (mongoose.isValidObjectId(rawUserId)) {
      try {
        const User = mongoose.models.User || mongoose.model('User');
        const uDoc = await User.findById(rawUserId)
          .select('email isSubUser parentUser parentUserId assignedCompany assignedCompanyId allowedCompanies')
          .lean();
        if (uDoc) {
          userEmail = String(uDoc.email || '').toLowerCase().trim();
          if (uDoc.isSubUser) {
            isSubUser = true;
            parentUser = uDoc.parentUser || uDoc.parentUserId || null;
            const firstAllowed =
              Array.isArray(uDoc.allowedCompanies) && uDoc.allowedCompanies.length > 0
                ? uDoc.allowedCompanies[0]
                : null;
            assignedCompany =
              companyIdParam ||
              uDoc.assignedCompany ||
              uDoc.assignedCompanyId ||
              firstAllowed ||
              null;
          }
        }
      } catch (_) {
        // Fallback silencioso
      }
    }
  }

  const targetUserId = String((isSubUser && parentUser ? parentUser : rawUserId) || '');
  let company = null;

  if (assignedCompany && mongoose.isValidObjectId(String(assignedCompany))) {
    company = await CompanyInfo.findById(String(assignedCompany)).lean();
  }
  if (!company && targetUserId && mongoose.isValidObjectId(targetUserId)) {
    company = await CompanyInfo.findOne({ user: targetUserId, isActive: true }).lean();
    if (!company) {
      company = await CompanyInfo.findOne({ user: targetUserId }).lean();
    }
  }
  if (!company && TEST_FALLBACK_EMAILS.includes(userEmail)) {
    company =
      (await CompanyInfo.findOne({ companyName: /wappy/i }).lean()) ||
      (await CompanyInfo.findOne({ isActive: true }).lean()) ||
      (await CompanyInfo.findOne({}).lean());
  }

  const resolvedUserId = String(company?.user || targetUserId || rawUserId || '');
  const resolvedCompanyId =
    company?._id ||
    (assignedCompany && mongoose.isValidObjectId(String(assignedCompany)) ? assignedCompany : null);

  return {
    userId: resolvedUserId,
    targetUserId: resolvedUserId,
    company,
    companyId: resolvedCompanyId,
  };
}

async function getActiveCompanyId(userOrReq) {
  const { companyId } = await resolveUserAndCompany(userOrReq);
  return companyId;
}

async function markChemicalStandardCompliant(userId, companyId, rowCount = 1) {
  try {
    if (!companyId || rowCount <= 0) return;
    let doc = await DiagnosticoData.findOne({ user: userId, companyId });
    if (!doc) {
      doc = new DiagnosticoData({
        user: userId,
        companyId,
        statusData: [],
        companySize: 'medium',
        riskLevel: 3,
        score: 0,
        totalPoints: 100,
        complianceLevel: '',
      });
    }
    const statusList = Array.isArray(doc.statusData) ? [...doc.statusData] : [];
    const codeClean = '4.1.3';
    const existingIdx = statusList.findIndex(
      (item) => item.code === codeClean || item.itemId === 'std_4_1_3' || item.itemId === 'art16_39'
    );
    const updatedItem = {
      itemId: existingIdx >= 0 ? statusList[existingIdx].itemId : 'std_4_1_3',
      code: codeClean,
      status: 'cumple',
      observation: `Matriz Oficial de Compatibilidad Química SGA activa (${rowCount} sustancias evaluadas con rótulos y fichas bajo Decreto 1496 de 2018, Res. 773 de 2021, NTC 3966 y Res. 0312/2019 Est. 4.1.3).`,
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      statusList[existingIdx] = { ...statusList[existingIdx], ...updatedItem };
    } else {
      statusList.push(updatedItem);
    }
    doc.statusData = statusList;
    doc.updatedAt = new Date();
    await doc.save();
  } catch (err) {
    logger.warn('[ChemicalCompatibility] Could not auto-mark 4.1.3 in DiagnosticoData:', err.message);
  }
}

const SPANISH_TO_PUBCHEM_QUERY = {
  'hipoclorito de sodio': 'sodium hypochlorite',
  'cloro': 'sodium hypochlorite',
  'blanqueador': 'sodium hypochlorite',
  'límpido': 'sodium hypochlorite',
  'acido clorhidrico': 'hydrochloric acid',
  'ácido clorhídrico': 'hydrochloric acid',
  'acido muriatico': 'hydrochloric acid',
  'ácido muriático': 'hydrochloric acid',
  'acido sulfurico': 'sulfuric acid',
  'ácido sulfúrico': 'sulfuric acid',
  'acido nitrico': 'nitric acid',
  'ácido nítrico': 'nitric acid',
  'acido acetico': 'acetic acid',
  'ácido acético': 'acetic acid',
  'acido fosforico': 'phosphoric acid',
  'ácido fosfórico': 'phosphoric acid',
  'hidroxido de sodio': 'sodium hydroxide',
  'hidróxido de sodio': 'sodium hydroxide',
  'soda caustica': 'sodium hydroxide',
  'soda cáustica': 'sodium hydroxide',
  'amoniaco': 'ammonia',
  'amoníaco': 'ammonia',
  'peroxido de hidrogeno': 'hydrogen peroxide',
  'peróxido de hidrógeno': 'hydrogen peroxide',
  'agua oxigenada': 'hydrogen peroxide',
  'alcohol etilico': 'ethanol',
  'alcohol etílico': 'ethanol',
  'etanol': 'ethanol',
  'alcohol antiseptico': 'ethanol',
  'alcohol antiséptico': 'ethanol',
  'alcohol isopropilico': 'isopropanol',
  'alcohol isopropílico': 'isopropanol',
  'isopropanol': 'isopropanol',
  'metanol': 'methanol',
  'alcohol metilico': 'methanol',
  'acetona': 'acetone',
  'tolueno': 'toluene',
  'xileno': 'xylene',
  'thinner': 'toluene',
  'tíner': 'toluene',
  'varsol': 'mineral spirits',
  'gasolina': 'gasoline',
  'acpm': 'diesel fuel',
  'diesel': 'diesel fuel',
  'glutaraldehido': 'glutaraldehyde',
  'glutaraldehído': 'glutaraldehyde',
  'formaldehido': 'formaldehyde',
  'formaldehído': 'formaldehyde',
  'formol': 'formaldehyde',
  'oxigeno': 'oxygen',
  'oxígeno': 'oxygen',
  'acetileno': 'acetylene',
  'propano': 'propane',
  'gas propano': 'propane',
  'dioxido de carbono': 'carbon dioxide',
  'dióxido de carbono': 'carbon dioxide',
};

const GHS_CODE_TO_WAPPY_KEY = {
  GHS01: 'explosivo',
  GHS02: 'inflamable',
  GHS03: 'comburente',
  GHS04: 'gas_comprimido',
  GHS05: 'corrosivo',
  GHS06: 'calavera',
  GHS07: 'signo_exclamacion',
  GHS08: 'peligro_salud',
  GHS09: 'medio_ambiente',
};

async function lookupPubChemGHS(rawQuery) {
  if (!rawQuery) return null;
  try {
    const clean = String(rawQuery).trim().toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, ' ')
      .replace(/\s+\d+%.*$/g, '')
      .trim();
    const mappedQuery = SPANISH_TO_PUBCHEM_QUERY[clean] ||
      Object.entries(SPANISH_TO_PUBCHEM_QUERY).find(([k]) => clean.includes(k))?.[1] ||
      clean;

    const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(mappedQuery)}/cids/JSON`;
    const cidRes = await fetch(cidUrl, { headers: { Accept: 'application/json' } });
    if (!cidRes.ok) return null;
    const cidData = await cidRes.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    if (!cid) return null;

    // Consultar en paralelo GHS Classification y CAS Registry Number (RN)
    const ghsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;
    const rnUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/rn/JSON`;

    const [ghsRes, rnRes] = await Promise.all([
      fetch(ghsUrl, { headers: { Accept: 'application/json' } }).catch(() => null),
      fetch(rnUrl, { headers: { Accept: 'application/json' } }).catch(() => null),
    ]);

    let cas = '';
    if (rnRes && rnRes.ok) {
      try {
        const rnData = await rnRes.json();
        const rnList = rnData?.InformationList?.Information?.[0]?.RN || [];
        if (Array.isArray(rnList) && rnList.length > 0) {
          cas = rnList.find((r) => /^\d{2,7}-\d{2}-\d$/.test(r)) || rnList[0] || '';
        }
      } catch (_e) {}
    }

    if (!ghsRes || !ghsRes.ok) {
      return {
        cid,
        cas,
        queryUsed: mappedQuery,
        signalWord: 'ATENCIÓN',
        pictograms: [],
        ghsCodes: [],
        wappyPictograms: [],
        pictogramDetails: [],
        hazardStatements: [],
        precautionaryStatements: [],
        clasificacion_onu: 'No Peligroso',
        incompatibilidades: 'Verificar FDS de 16 secciones del fabricante (Decreto 1496 de 2018).',
      };
    }

    const ghsData = await ghsRes.json();
    const ghsCodes = new Set();
    const hazardStatements = [];
    const precautionaryStatements = [];
    let signalWord = '';

    const extractInfo = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(extractInfo);
        return;
      }
      if (obj.Name === 'Pictogram(s)' && obj.Value?.StringWithMarkup) {
        obj.Value.StringWithMarkup.forEach((sm) => {
          (sm.Markup || []).forEach((m) => {
            if (m.Extra) {
              const codeMatch = String(m.Extra).match(/GHS0[1-9]/);
              if (codeMatch) ghsCodes.add(codeMatch[0]);
            }
            if (m.URL) {
              const urlMatch = String(m.URL).match(/GHS0[1-9]/);
              if (urlMatch) ghsCodes.add(urlMatch[0]);
            }
          });
        });
      }
      if (obj.Name === 'Signal' && obj.Value?.StringWithMarkup) {
        const sig = obj.Value.StringWithMarkup[0]?.String || '';
        if (/danger/i.test(sig)) signalWord = 'PELIGRO';
        else if (/warning/i.test(sig) && !signalWord) signalWord = 'ATENCIÓN';
      }
      if (obj.Name === 'GHS Hazard Statements' && obj.Value?.StringWithMarkup) {
        obj.Value.StringWithMarkup.forEach((sm) => {
          if (sm.String && /^H\d{3}/.test(sm.String) && hazardStatements.length < 8) {
            hazardStatements.push(sm.String);
          }
        });
      }
      if (obj.Name === 'Precautionary Statement Codes' && obj.Value?.StringWithMarkup) {
        obj.Value.StringWithMarkup.forEach((sm) => {
          if (sm.String && precautionaryStatements.length < 6) {
            precautionaryStatements.push(sm.String);
          }
        });
      }
      Object.values(obj).forEach(extractInfo);
    };
    extractInfo(ghsData);

    const ghsCodeList = Array.from(ghsCodes);
    const wappyPictograms = ghsCodeList.map((c) => GHS_CODE_TO_WAPPY_KEY[c]).filter(Boolean);
    const pictogramDetails = ghsCodeList.map((code) => ({
      code,
      key: GHS_CODE_TO_WAPPY_KEY[code],
      svgUrl: `https://pubchem.ncbi.nlm.nih.gov/images/ghs/${code}.svg`,
    }));

    // Sugerir Clase ONU e Incompatibilidades según códigos GHS y naturaleza química
    let clasificacion_onu = 'Clase 9: Peligros Varios';
    if (ghsCodeList.includes('GHS01')) clasificacion_onu = 'Clase 1: Explosivos';
    else if (ghsCodeList.includes('GHS04') && ghsCodeList.includes('GHS02')) clasificacion_onu = 'Clase 2.1: Gases Inflamables';
    else if (ghsCodeList.includes('GHS04') && ghsCodeList.includes('GHS06')) clasificacion_onu = 'Clase 2.3: Gases Tóxicos';
    else if (ghsCodeList.includes('GHS04')) clasificacion_onu = 'Clase 2.2: Gases No Inflamables ni Tóxicos';
    else if (ghsCodeList.includes('GHS02')) clasificacion_onu = 'Clase 3: Líquidos Inflamables';
    else if (ghsCodeList.includes('GHS03')) clasificacion_onu = 'Clase 5.1: Sustancias Comburentes';
    else if (ghsCodeList.includes('GHS05')) clasificacion_onu = 'Clase 8: Sustancias Corrosivas';
    else if (ghsCodeList.includes('GHS06')) clasificacion_onu = 'Clase 6.1: Sustancias Tóxicas';

    const incompParts = [];
    if (ghsCodeList.includes('GHS05')) {
      if (/\b([aá]cido|acid|muri[aá]tico|clorh[ií]drico|sulf[uú]rico|n[ií]trico|fosf[oó]rico|ac[eé]tico)\b/i.test(clean + ' ' + mappedQuery)) {
        incompParts.push('Hipoclorito de sodio (libera gas Cl2 letal), bases fuertes (Hidróxido de sodio/potasio, reacción exotérmica violenta), amoníaco y metales activos');
      } else if (/\b(hipoclorito|hypochlorite|cloro|blanqueador)\b/i.test(clean + ' ' + mappedQuery)) {
        incompParts.push('Ácidos (clorhídrico, muriático, sulfúrico, nítrico: libera gas cloro Cl2 altamente tóxico), amoníaco (genera cloraminas tóxicas) y reductores');
      } else {
        incompParts.push('Ácidos fuertes, bases fuertes, agentes oxidantes y metales reactivos según NTC 3966');
      }
    }
    if (ghsCodeList.includes('GHS02')) {
      incompParts.push('Agentes oxidantes/comburentes (Clase 5.1/5.2), ácidos minerales fuertes, fuentes de ignición, chispas y calor');
    }
    if (ghsCodeList.includes('GHS03')) {
      incompParts.push('Líquidos y sólidos inflamables (Clase 3 y 4), materiales orgánicos combustibles, reductores y polvos metálicos');
    }

    return {
      cid,
      cas,
      queryUsed: mappedQuery,
      signalWord: signalWord || (ghsCodeList.some((c) => ['GHS01', 'GHS02', 'GHS03', 'GHS05', 'GHS06', 'GHS08'].includes(c)) ? 'PELIGRO' : 'ATENCIÓN'),
      ghsCodes: ghsCodeList,
      wappyPictograms: [...new Set(wappyPictograms)],
      pictogramDetails,
      hazardStatements: [...new Set(hazardStatements)],
      precautionaryStatements: [...new Set(precautionaryStatements)],
      clasificacion_onu,
      incompatibilidades: incompParts.length > 0 ? incompParts.join('. ') : 'Evitar contacto con agentes oxidantes fuertes, ácidos/bases incompatibles y fuentes de calor según FDS Sección 10.',
    };
  } catch (err) {
    logger.warn('[ChemicalCompatibility/lookupPubChemGHS] Fallback:', err.message);
    return null;
  }
}

function mapHito5ProductToCompatRow(p) {
  return {
    id: p.id || Date.now().toString() + Math.random().toString(36).substring(7),
    nombre: toSentenceCase(p.nombre || 'Producto Químico'),
    fabricante: p.fabricante || 'Proveedor Industrial Certificado',
    estado_fisico: p.estadoFisico === 'Gaseoso' ? 'Gas' : (p.estadoFisico || 'Líquido'),
    clasificacion_onu: p.claseOnu || 'No Peligroso',
    numero_onu: p.numeroOnu || '',
    cas: p.cas || '',
    palabra_advertencia: p.palabraAdvertencia || 'PELIGRO',
    pictogramas_sga: Array.isArray(p.pictogramasSga) ? p.pictogramasSga : [],
    cantidad_almacenada: p.cantidadAlmacenada || '20 Litros',
    ubicacion: toSentenceCase(p.ubicacion || 'Almacén General'),
    tiene_fds: /^s[ií]/i.test(String(p.tieneFds || '')) ? 'Sí' : 'No',
    tiene_rotulo: /^s[ií]/i.test(String(p.tieneRotuloSga || '')) ? 'Sí' : 'No',
    frases_h: p.frasesH || '',
    consejos_p: p.consejosP || '',
    epp_recomendado: p.eppRecomendado || '',
    primeros_auxilios: p.primerosAuxilios || '',
    control_derrames: p.controlDerrames || '',
    incompatibilidades: Array.isArray(p.incompatibilidades) ? p.incompatibilidades.join(', ') : (p.incompatibilidades || 'Verificar FDS'),
    requisitos_almacenamiento: p.requisitosAlmacenamiento || 'Almacenar en área ventilada y señalizada según SGA y NTC 3966.',
  };
}

function mapCompatRowToHito5Product(r) {
  const est = String(r.estado_fisico || 'Líquido').trim();
  const estadoFisico = /gas/i.test(est) ? 'Gaseoso' : /s[oó]lid/i.test(est) ? 'Sólido' : 'Líquido';
  const tieneFds = /^s[ií]/i.test(String(r.tiene_fds || 'Sí')) ? 'Sí' : 'No';
  const tieneRotuloSga = /^s[ií]/i.test(String(r.tiene_rotulo || 'Sí')) ? 'Sí' : 'No';
  const incompArr = Array.isArray(r.incompatibilidades)
    ? r.incompatibilidades
    : String(r.incompatibilidades || '')
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    id: r.id || `chem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    nombre: toSentenceCase(r.nombre || 'Producto Químico'),
    fabricante: r.fabricante || 'Proveedor Industrial Certificado',
    estadoFisico,
    pictogramasSga: Array.isArray(r.pictogramas_sga) ? r.pictogramas_sga : [],
    claseOnu: r.clasificacion_onu || 'Clase 8: Sustancias Corrosivas',
    ubicacion: toSentenceCase(r.ubicacion || 'Almacén Químico'),
    cantidadAlmacenada: r.cantidad_almacenada || '20 Litros',
    tieneFds,
    tieneRotuloSga,
    requisitosAlmacenamiento: r.requisitos_almacenamiento || 'Almacenar en área ventilada con dique de contención según NTC 3966.',
    incompatibilidades: incompArr,
    trabajadoresExpuestos: [],
    observaciones: r.frases_h ? `ONU: ${r.numero_onu || 'N/A'} | CAS: ${r.cas || 'N/A'} | ${r.frases_h}` : '',
  };
}

/**
 * Genera 5 sustancias químicas industriales completas con datos SGA verificados (Decreto 1496 de 2018 / Res. 773 de 2021 / NTC 3966)
 */
function buildDefaultChemicalSeedProducts() {
  const baseId = Date.now();
  return [
    {
      id: `sga-seed-1-${baseId}`,
      nombre: 'Hipoclorito de sodio al 13%',
      fabricante: 'Brinsa S.A. / Químicos Industriales',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
      numero_onu: 'UN 1791',
      cas: '7681-52-9',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: ['corrosivo', 'medio_ambiente'],
      cantidad_almacenada: '60 Litros (3 Garrafas x 20L)',
      ubicacion: 'Cuarto de aseo y desinfección (Estiba bases/clorados)',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: 'H314: Provoca quemaduras graves en la piel y lesiones oculares graves | H400: Muy tóxico para los organismos acuáticos | EUH031: En contacto con ácidos libera gases tóxicos (Cloro letal Cl2).',
      consejos_p: 'P260: No respirar los vapores | P280: Llevar guantes de nitrilo, gafas de seguridad y careta facial | P273: No dispersar en el medio ambiente.',
      epp_recomendado: 'Guantes de nitrilo o neopreno caña larga, monogafas de ventilación indirecta, delantal impermeable de PVC y respirador con cartucho para gases ácidos/vapores.',
      primeros_auxilios: 'Ojos/Piel: Lavar inmediatamente con abundante agua en ducha lavaojos por mínimo 15 minutos. Inhalación: Trasladar al aire fresco. Ingestión: No inducir el vómito.',
      control_derrames: 'Contener con dique y material absorbente inerte (arena o vermiculita). JAMÁS neutralizar ni mezclar con ácidos.',
      incompatibilidades: 'INCOMPATIBILIDAD CRÍTICA con Ácidos fuertes (Ácido clorhídrico/muriático, sulfúrico, nítrico, acético), amoníaco, aminas y metales en polvo (libera gas Cloro Cl2 letal).',
      requisitos_almacenamiento: 'Almacenar en envase original opaco en lugar fresco (<25°C), ventilado, sobre bandeja antiderrames exclusiva para bases/hipocloritos, estrictamente separado de ácidos (NTC 3966).',
    },
    {
      id: `sga-seed-2-${baseId + 1}`,
      nombre: 'Ácido clorhídrico al 33% (Ácido muriático)',
      fabricante: 'Quimpac de Colombia S.A.',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
      numero_onu: 'UN 1789',
      cas: '7647-01-0',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: ['corrosivo', 'signo_exclamacion'],
      cantidad_almacenada: '40 Litros (2 Garrafas x 20L)',
      ubicacion: 'Bodega de químicos - Gabinete exclusivo ácidos',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: 'H290: Puede ser corrosivo para los metales | H314: Provoca quemaduras graves en la piel y lesiones oculares graves | H335: Puede irritar las vías respiratorias.',
      consejos_p: 'P260: No respirar nieblas ni vapores | P280: Usar guantes resistentes a ácidos, protección ocular y respirador para gases ácidos | P305+P351+P338: Enjuagar ojos cuidadosamente con agua.',
      epp_recomendado: 'Guantes de neopreno/butilo, monogafas herméticas + careta facial, respirador media cara con cartuchos para gases ácidos (cinta amarilla) y botas de caucho.',
      primeros_auxilios: 'Lavar zona afectada con abundante agua durante 15-20 minutos retirando ropa contaminada. Atención médica inmediata.',
      control_derrames: 'Ventilar el área, contener derrame con absorbente para ácidos o neutralizar lentamente con carbonato de sodio/cal apagada bajo supervisión.',
      incompatibilidades: 'INCOMPATIBILIDAD CRÍTICA con Bases fuertes (Hidróxido de sodio/Soda cáustica), Hipoclorito de sodio/cloro (genera gas cloro mortal Cl2), oxidantes fuertes (peróxidos) y metales activos (genera gas Hidrógeno inflamable).',
      requisitos_almacenamiento: 'Almacenar en gabinete resistente a la corrosión exclusivo para ácidos inorgánicos, lejos de bases, hipocloritos e inflamables, con ventilación mecánica y ducha lavaojos cercana.',
    },
    {
      id: `sga-seed-3-${baseId + 2}`,
      nombre: 'Thinner acrílico industrial (Mezcla tolueno / xileno)',
      fabricante: 'Pintuco / Brentagg Colombia',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'Clase 3: Líquidos Inflamables',
      numero_onu: 'UN 1263',
      cas: '108-88-3',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: ['inflamable', 'peligro_salud', 'signo_exclamacion'],
      cantidad_almacenada: '38 Litros (2 Cuñetes metálicos)',
      ubicacion: 'Gabinete cortafuego de inflamables (Taller mantenimiento)',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: 'H225: Líquido y vapores muy inflamables | H304: Puede ser mortal en caso de ingestión y penetración en las vías respiratorias | H336: Puede provocar somnolencia o vértigo | H361d: Se sospecha que daña al feto.',
      consejos_p: 'P210: Mantener alejado del calor, chispas, llamas abiertas y superficies calientes. No fumar | P240: Toma de tierra y enlace equipotencial del recipiente | P280: Usar guantes de nitrilo y respirador para vapores orgánicos.',
      epp_recomendado: 'Respirador media cara con cartuchos para vapores orgánicos (cinta negra), guantes de nitrilo/PVA, gafas de seguridad herméticas y ropa de algodón antiestática.',
      primeros_auxilios: 'Inhalación: Llevar al aire libre. Piel/Ojos: Lavar con agua abundante. Ingestión: NO inducir el vómito por riesgo de aspiración pulmonar.',
      control_derrames: 'Eliminar toda fuente de ignición. Contener con paños oleofílicos o tierra diatomácea anti-chispa. Extintor multipropósito ABC o CO2.',
      incompatibilidades: 'Incompatible con Agentes Comburentes/Oxidantes (Clase 5.1/5.2 como Peróxido de hidrógeno), ácidos fuertes (ácido nítrico/sulfúrico), halógenos y fuentes de calor o chispas.',
      requisitos_almacenamiento: 'Almacenar en gabinete de seguridad cortafuego certificado (FM/NFPA 30), con conexión de puesta a tierra, lejos de comburentes y corrosivos.',
    },
    {
      id: `sga-seed-4-${baseId + 3}`,
      nombre: 'Peróxido de hidrógeno al 50%',
      fabricante: 'Evonik / Peróxidos industriales',
      estado_fisico: 'Líquido',
      clasificacion_onu: 'Clase 5.1: Sustancias Comburentes',
      numero_onu: 'UN 2014',
      cas: '7722-84-1',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: ['comburente', 'corrosivo', 'signo_exclamacion'],
      cantidad_almacenada: '25 Litros (1 Garrafa con válvula de venteo)',
      ubicacion: 'Almacén ventilado de oxidantes',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: 'H271: Puede provocar un incendio o una explosión; muy comburente | H302+H332: Nocivo en caso de ingestión o inhalación | H314: Provoca quemaduras graves en la piel y lesiones oculares graves.',
      consejos_p: 'P210: Mantener alejado de fuentes de calor | P220: Mantener alejado de la ropa y materiales combustibles/inflamables | P280: Llevar guantes de neopreno y pantalla facial.',
      epp_recomendado: 'Guantes de neopreno o PVC (NUNCA cuero ni algodón), gafas herméticas, careta facial y delantal impermeable.',
      primeros_auxilios: 'Lavar inmediatamente piel y ojos con abundante agua durante 15 minutos. Si la ropa se salpica, enjuagarla con agua antes de quitársela para evitar ignición.',
      control_derrames: 'Diluir con abundante agua en lluvia. NO usar aserrín, papel, trapos ni materiales orgánicos combustibles para absorber (riesgo de ignición espontánea).',
      incompatibilidades: 'INCOMPATIBILIDAD CRÍTICA con Líquidos y Sólidos Inflamables (Clase 3 y 4: thinner, solventes, alcoholes), sustancias tóxicas/orgánicas (Clase 6.1), ácidos, bases y metales pesados.',
      requisitos_almacenamiento: 'Almacenar exclusivamente en su envase original con tapa de venteo en posición vertical, en área fresca y aislada de combustibles, inflamables y corrosivos (NTC 3966).',
    },
    {
      id: `sga-seed-5-${baseId + 4}`,
      nombre: 'Hidróxido de sodio en escamas (Soda cáustica)',
      fabricante: 'Alcalis / Quimpac S.A.',
      estado_fisico: 'Sólido',
      clasificacion_onu: 'Clase 8: Sustancias Corrosivas',
      numero_onu: 'UN 1823',
      cas: '1310-73-2',
      palabra_advertencia: 'PELIGRO',
      pictogramas_sga: ['corrosivo'],
      cantidad_almacenada: '50 Kg (2 Sacos herméticos x 25Kg)',
      ubicacion: 'Bodega de químicos - Estiba bases alcalinas',
      tiene_fds: 'Sí',
      tiene_rotulo: 'Sí',
      frases_h: 'H290: Puede ser corrosivo para los metales | H314: Provoca quemaduras graves en la piel y lesiones oculares graves (riesgo de ceguera irreversible).',
      consejos_p: 'P260: No respirar el polvo | P280: Llevar guantes de nitrilo/neopreno, traje impermeable, gafas herméticas y pantalla facial | P305+P351+P338: Enjuagar ojos con agua durante varios minutos.',
      epp_recomendado: 'Guantes de nitrilo o caucho butílico, monogafas herméticas + visor facial completo, respirador N95 para polvos alcalinos y botas impermeables.',
      primeros_auxilios: 'Retirar exceso de polvo seco con cuidado y lavar con abundante agua corriente durante mínimo 20 minutos. Atención oftalmológica o médica urgente.',
      control_derrames: 'Recoger en seco con pala plástica evitando generar polvo. No verter agua directamente sobre grandes cantidades de sólido (reacción altamente exotérmica).',
      incompatibilidades: 'INCOMPATIBILIDAD CRÍTICA con Ácidos fuertes (Ácido clorhídrico, sulfúrico, nítrico -> reacción exotérmica violenta), metales como aluminio, estaño y zinc (genera gas Hidrógeno explosivo) y agua en espacios confinados.',
      requisitos_almacenamiento: 'Almacenar en recipientes de polietileno de alta densidad herméticamente cerrados sobre estiba plástica libre de humedad, segregado estrictamente del gabinete de ácidos.',
    },
  ];
}

/**
 * Recolecta métricas reales 360° del Ecosistema Somos SST relacionadas con Riesgo Químico y SGA
 */
async function gatherChemicalEcosystem(userOrId, explicitCompanyId = null) {
  ensureChemicalEcosystemModels();
  const { userId, company, companyId } = await resolveUserAndCompany(userOrId, explicitCompanyId);
  const filter = companyId ? { user: userId, companyId } : { user: userId };
  const companyOnlyOrFilter = companyId ? { companyId } : { user: userId };

  const companyName = company?.companyName || 'Empresa SG-SST';
  const economicActivity = company?.economicActivity || 'Operaciones Industriales y Servicios';
  const riskLevel = company?.riskLevel || 'III';

  // 1. SgsstChemicalData (Hito 5 - Registro y Rótulo de Productos Químicos)
  let hito5ProductosCount = 0;
  let hito5ConFdsCount = 0;
  let hito5ConRotuloCount = 0;
  let hito5ProductosList = [];
  try {
    let chemDoc = await SgsstChemicalData.findOne(filter).lean();
    if (!chemDoc && companyId) {
      chemDoc = await SgsstChemicalData.findOne({ companyId }).lean();
    }
    const prods = Array.isArray(chemDoc?.productos) ? chemDoc.productos : [];
    hito5ProductosCount = prods.length;
    prods.forEach((p) => {
      if (/^s[ií]/i.test(String(p.tieneFds || ''))) hito5ConFdsCount++;
      if (/^s[ií]/i.test(String(p.tieneRotuloSga || ''))) hito5ConRotuloCount++;
      hito5ProductosList.push({
        nombre: p.nombre || 'Producto Químico',
        claseOnu: p.claseOnu || 'Clase 8: Sustancias Corrosivas',
        ubicacion: p.ubicacion || 'Almacén Químico',
        tieneFds: p.tieneFds || 'Sí',
        tieneRotuloSga: p.tieneRotuloSga || 'Sí',
      });
    });
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] SgsstChemicalData error:', err.message);
  }

  // 2. GTC45WorkspaceSession (Hito 1 - Peligros Químicos identificados)
  let peligrosQuimicosGtc45Count = 0;
  let peligrosQuimicosGtc45List = [];
  try {
    const GTC45WorkspaceSession =
      mongoose.models.GTC45WorkspaceSession || require('~/models/GTC45WorkspaceSession');
    let gtcSession = await GTC45WorkspaceSession.findOne({ ...filter, isOfficial: true }).lean();
    if (!gtcSession) {
      gtcSession = await GTC45WorkspaceSession.findOne(companyOnlyOrFilter).sort({ updatedAt: -1 }).lean();
    }
    const gtcRows = gtcSession?.matrixRows || gtcSession?.rows || [];
    gtcRows.forEach((r) => {
      const combined = `${r.peligro_clasificacion || ''} ${r.peligro_descripcion || ''} ${r.actividad || ''}`;
      if (/qu[ií]mic|vapor|gas|humo|polvo|roc[ií]o|niebla|corrosiv|inflamabl|solvent|hipoclorito|[aá]cido|desinfectant|pintura|aseo/i.test(combined)) {
        peligrosQuimicosGtc45Count++;
        peligrosQuimicosGtc45List.push({
          proceso: r.proceso || 'Operativo',
          cargo: r.cargo || 'Operario',
          clasificacion: r.peligro_clasificacion || 'Químico',
          descripcion: r.peligro_descripcion || 'Exposición a sustancias químicas',
          epp: r.medida_epp || r.control_individuo || '',
        });
      }
    });
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] GTC45 error:', err.message);
  }

  // 3. SgsstEppData / SgsstEppInventory (Hito 5 - EPP de protección química)
  let eppQuimicosCount = 0;
  let eppEntregasTotal = 0;
  let eppQuimicosList = [];
  try {
    const SgsstEppData = mongoose.models.SgsstEppData || require('~/models/SgsstEppData');
    let eppDocs = await SgsstEppData.find(filter).lean();
    if (eppDocs.length === 0 && companyId) {
      eppDocs = await SgsstEppData.find({ companyId }).lean();
    }
    eppDocs.forEach((d) => {
      const entregas = Array.isArray(d.entregas) ? d.entregas : [];
      eppEntregasTotal += entregas.length;
      entregas.forEach((e) => {
        const elem = `${e.elemento || e.nombreEpp || e.epp || ''} ${e.norma || ''} ${e.observaciones || ''}`;
        if (/nitrilo|neopreno|butilo|respirador|cartucho|filtro|monogafa|careta|delantal|pvc|qu[ií]mic|guante|mascarilla|gafa/i.test(elem)) {
          eppQuimicosCount++;
          if (eppQuimicosList.length < 8) {
            eppQuimicosList.push(e.elemento || e.nombreEpp || 'EPP Protección Química');
          }
        }
      });
    });
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] EPP error:', err.message);
  }

  // 4. PlanEmergenciasData (Hito 1 - Kits antiderrames, duchas lavaojos, PON derrames)
  let planEmergenciasActivo = false;
  let ponDerramesActivo = false;
  let kitsAntiderramesCount = 0;
  let recursosQuimicosEmergencia = [];
  try {
    const PlanEmergenciasData =
      mongoose.models.PlanEmergenciasData || require('~/models/PlanEmergenciasData');
    let ppreDoc = await PlanEmergenciasData.findOne(filter).lean();
    if (!ppreDoc && companyId) {
      ppreDoc = await PlanEmergenciasData.findOne({ companyId }).lean();
    }
    if (ppreDoc) {
      planEmergenciasActivo = true;
      const recursos = Array.isArray(ppreDoc.recursosInventario) ? ppreDoc.recursosInventario : [];
      recursos.forEach((rec) => {
        const txt = `${rec.tipo || ''} ${rec.descripcion || ''} ${rec.ubicacion || ''}`;
        if (/derrame|kit|lavaojo|ducha|absorbente|extintor|qu[ií]mic|hazmat/i.test(txt)) {
          kitsAntiderramesCount += Number(rec.cantidad) || 1;
          recursosQuimicosEmergencia.push(`${rec.tipo || 'Recurso'}: ${rec.descripcion || ''}`.trim());
        }
      });
      const pons = Array.isArray(ppreDoc.procedimientosOperativos) ? ppreDoc.procedimientosOperativos : [];
      ponDerramesActivo = pons.some((p) =>
        /derrame|qu[ií]mic|fuga|peligros|incendio/i.test(`${p.titulo || ''} ${p.amenazaAsociada || ''}`)
      );
    }
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] PlanEmergencias error:', err.message);
  }

  // 5. PerfilCargoData y SgsstWorker (Hito 2 - Cargos expuestos a riesgo químico)
  let totalTrabajadores = 0;
  let cargosExpuestosCount = 0;
  let cargosExpuestosList = [];
  const cargosSet = new Set();
  try {
    let workers = await SgsstWorker.find({ ...filter, estadoLaboral: { $ne: 'Retirado' } })
      .select('nombre cargo')
      .lean();
    if (workers.length === 0 && companyId) {
      workers = await SgsstWorker.find({ companyId, estadoLaboral: { $ne: 'Retirado' } })
        .select('nombre cargo')
        .lean();
    }
    totalTrabajadores = workers.length || Number(company?.workerCount) || 0;

    const PerfilCargoData = mongoose.models.PerfilCargoData;
    if (PerfilCargoData) {
      const cargoDoc =
        (await PerfilCargoData.findOne(filter).lean()) ||
        (companyId ? await PerfilCargoData.findOne({ companyId }).lean() : null);
      if (Array.isArray(cargoDoc?.perfilesList)) {
        cargoDoc.perfilesList.forEach((p) => {
          const txt = `${p.nombreCargo || ''} ${p.area || ''} ${p.contextoAdicional || ''} ${p.report || ''}`;
          if (/qu[ií]mic|aseo|limpieza|mantenimiento|operari|laboratori|bodega|almac[eé]n|producci[oó]n|pintur|desinfecci[oó]n|servicios generales/i.test(txt)) {
            if (p.nombreCargo) cargosSet.add(toSentenceCase(p.nombreCargo));
          }
        });
        if (cargosSet.size === 0) {
          cargoDoc.perfilesList.slice(0, 4).forEach((p) => {
            if (p.nombreCargo) cargosSet.add(toSentenceCase(p.nombreCargo));
          });
        }
      }
    }
    peligrosQuimicosGtc45List.forEach((g) => {
      if (g.cargo) cargosSet.add(toSentenceCase(g.cargo));
    });
    cargosExpuestosList = Array.from(cargosSet);
    cargosExpuestosCount = cargosExpuestosList.length;
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] Cargos error:', err.message);
  }

  // 6. ProgramaCapacitaciones (Hito 6 - Capacitaciones en Riesgo Químico / SGA / FDS)
  let capacitacionesQuimicasCount = 0;
  let capacitacionesTotal = 0;
  let capacitacionesQuimicasList = [];
  try {
    const ProgramaCapacitacionesData = mongoose.models.ProgramaCapacitacionesData;
    if (ProgramaCapacitacionesData) {
      const capDoc = await ProgramaCapacitacionesData.findOne(filter).lean();
      if (capDoc) {
        const items = [
          ...(Array.isArray(capDoc.sesiones) ? capDoc.sesiones : []),
          ...(Array.isArray(capDoc.planPersonalizado) ? capDoc.planPersonalizado : []),
        ];
        capacitacionesTotal = items.length;
        items.forEach((c) => {
          const tema = c.tema || c.nombre || c.titulo || '';
          if (/qu[ií]mic|sga|1496|773|fds|ficha|derrame|rotulado|sustancia|peligros|epp/i.test(tema)) {
            capacitacionesQuimicasCount++;
            capacitacionesQuimicasList.push(tema);
          }
        });
      }
    }
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] Capacitaciones error:', err.message);
  }

  // 7. KanbanTask (Hito 7 - Tareas ACPM de Matriz de Compatibilidad Química)
  let kanbanAbiertasCount = 0;
  let kanbanCerradasCount = 0;
  let kanbanTotalCount = 0;
  try {
    const chemTasks = await KanbanTask.find({
      ...filter,
      sourceModule: 'matriz_compatibilidad',
    })
      .select('status')
      .lean();
    kanbanTotalCount = chemTasks.length;
    chemTasks.forEach((t) => {
      if (t.status === 'done' || t.status === 'completada' || t.status === 'cerrada') {
        kanbanCerradasCount++;
      } else if (t.status !== 'dismissed') {
        kanbanAbiertasCount++;
      }
    });
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] KanbanTask error:', err.message);
  }

  // 8. DiagnosticoData (Hito 1) y AuditoriaData (Hito 7) — redondeados a máximo 2 decimales
  let diagnosticoScore = 0;
  let auditoriaScore = 0;
  let estandar413Cumple = false;
  try {
    const diagDoc = await DiagnosticoData.findOne(filter).lean();
    if (diagDoc) {
      diagnosticoScore = round2(diagDoc.score || 0);
      if (Array.isArray(diagDoc.statusData)) {
        estandar413Cumple = diagDoc.statusData.some(
          (s) => (s.code === '4.1.3' || s.itemId === 'std_4_1_3' || s.itemId === 'art16_39') && s.status === 'cumple'
        );
      }
    }
    const AuditoriaData = mongoose.models.AuditoriaData || require('~/models/AuditoriaData');
    const audDoc = await AuditoriaData.findOne(filter).lean();
    if (audDoc) {
      auditoriaScore = round2(
        audDoc.compliancePercentage || audDoc.weightedPercentage || audDoc.score || 0
      );
    }
  } catch (err) {
    logger.debug('[ChemicalCompatibility/gatherChemicalEcosystem] Diagnostico/Auditoria error:', err.message);
  }

  return {
    userId,
    companyId,
    companyName,
    economicActivity,
    riskLevel,
    hito5ProductosCount,
    hito5ChemicalsCount: hito5ProductosCount,
    hito5ConFdsCount,
    hito5ConRotuloCount,
    hito5ProductosList,
    peligrosQuimicosGtc45Count,
    gtc45ChemicalRisksCount: peligrosQuimicosGtc45Count,
    peligrosQuimicosGtc45List,
    eppQuimicosCount,
    eppChemicalCount: eppQuimicosCount,
    eppEntregasTotal,
    eppQuimicosList,
    planEmergenciasActivo,
    ponDerramesActivo,
    kitsAntiderramesCount,
    spillKitsPpreCount: kitsAntiderramesCount,
    recursosQuimicosEmergencia,
    totalTrabajadores,
    cargosExpuestosCount,
    cargosExpuestosList,
    capacitacionesQuimicasCount,
    sgaTrainingsCount: capacitacionesQuimicasCount,
    capacitacionesTotal,
    capacitacionesQuimicasList,
    kanbanAbiertasCount,
    kanbanCerradasCount,
    kanbanTotalCount,
    acpmChemicalTasksCount: kanbanTotalCount,
    diagnosticoScore: round2(diagnosticoScore),
    compliance0312: round2(diagnosticoScore),
    auditoriaScore: round2(auditoriaScore),
    estandar413Cumple,
  };
}

/**
 * Sincroniza controles químicos, brechas SGA y alertas de segregación NTC 3966 con KanbanTask (Hito 7)
 */
async function syncChemicalKanbanTasks(userId, companyId, matrixRows = []) {
  if (!KanbanTask || !Array.isArray(matrixRows) || matrixRows.length === 0) {
    return { createdTasks: 0, updatedTasks: 0, totalSynced: 0 };
  }

  let createdTasks = 0;
  let updatedTasks = 0;
  const dueDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

  for (const row of matrixRows) {
    const faltaFds = String(row.tiene_fds).toLowerCase() === 'no';
    const faltaRotulo = String(row.tiene_rotulo).toLowerCase() === 'no';
    const tieneRequisitos =
      row.requisitos_almacenamiento &&
      row.requisitos_almacenamiento.trim() !== '' &&
      row.requisitos_almacenamiento.toLowerCase() !== 'ninguno';

    if (!faltaFds && !faltaRotulo && !tieneRequisitos) continue;

    const taskTitle = `[Químicos SGA] ${row.nombre || 'Sustancia Química'} - ${row.ubicacion || 'Almacén'}`;
    const gapAlerts = [];
    if (faltaFds) gapAlerts.push('⚠️ FALTA FICHA DE DATOS DE SEGURIDAD (FDS 16 Secciones)');
    if (faltaRotulo) gapAlerts.push('⚠️ FALTA ROTULADO Y ETIQUETADO SGA EN ENVASE');

    const taskDescription = [
      `Producto Químico: ${row.nombre || 'N/A'} (${row.fabricante || 'Proveedor no especificado'})`,
      `Clase Peligro ONU: ${row.clasificacion_onu || 'N/A'} (${row.numero_onu || 'SGA'}) | Estado: ${row.estado_fisico || 'Líquido'}`,
      `Ubicación: ${row.ubicacion || 'N/A'} | Cantidad: ${row.cantidad_almacenada || 'N/A'}`,
      gapAlerts.length > 0 ? `Brechas Legales Decreto 1496/2018 y Res. 773/2021: ${gapAlerts.join(' | ')}` : '',
      `Incompatibilidades: ${row.incompatibilidades || 'N/A'}`,
      `Requisitos de Almacenamiento / Controles (NTC 3966): ${row.requisitos_almacenamiento || 'Segregar según matriz de compatibilidad NTC 3966.'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const isHighRisk =
      faltaFds ||
      faltaRotulo ||
      /Explosiv|Inflamabl|Tóxic|Corrosiv|Comburent/i.test(row.clasificacion_onu || '');
    const priority = isHighRisk ? 'alta' : 'media';
    const actionType = faltaFds || faltaRotulo ? 'correctiva' : 'preventiva';
    const referenceId = `chem-sga-${(row.nombre || 'prod').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const existing = await KanbanTask.findOne({
      user: userId,
      ...(companyId ? { companyId: String(companyId) } : {}),
      sourceModule: 'matriz_compatibilidad',
      $or: [{ referenceId }, { title: taskTitle }],
    });

    if (existing) {
      existing.title = taskTitle;
      existing.description = taskDescription;
      existing.priority = priority;
      existing.actionType = actionType;
      existing.referenceId = referenceId;
      await existing.save();
      updatedTasks++;
    } else {
      await KanbanTask.create({
        user: userId,
        companyId: companyId ? String(companyId) : undefined,
        title: taskTitle,
        description: taskDescription,
        status: 'todo',
        type: 'ipevar_finding',
        priority,
        actionType,
        assignedTo: 'Coordinador SG-SST / Responsable de Almacén Químico',
        sourceModule: 'matriz_compatibilidad',
        referenceId,
        referenceName: `Matriz Compatibilidad Química (${row.nombre || 'SGA'})`,
        dueDate,
      });
      createdTasks++;
    }
  }

  return {
    createdTasks,
    updatedTasks,
    totalSynced: createdTasks + updatedTasks,
  };
}

// ─── ECOSISTEMA 360°: Resumen en tiempo real de módulos vinculados a Riesgo Químico ─
router.get('/ecosystem-summary', requireJwtAuth, async (req, res) => {
  try {
    const ecosystemStats = await gatherChemicalEcosystem(req);
    return res.json({ success: true, ecosystemStats });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ecosystem-summary] Error:', error);
    return res.status(500).json({ error: 'Error al obtener el resumen del ecosistema químico 360°' });
  }
});

// ─── ECOSISTEMA 360°: Sincronización Bidireccional Hito 1 <-> Hito 5 + GTC 45 + Kanban ACPM ─
router.post('/sync-ecosystem', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const officialConvId = `official-chem-${companyId || userId}`;

    let officialSession = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId });
    let currentRows =
      Array.isArray(req.body?.matrixRows) && req.body.matrixRows.length > 0
        ? [...req.body.matrixRows]
        : Array.isArray(officialSession?.matrixRows)
          ? [...officialSession.matrixRows]
          : [];

    let hito5Doc = companyId
      ? (await SgsstChemicalData.findOne({ user: userId, companyId })) ||
        (await SgsstChemicalData.findOne({ companyId }))
      : null;

    let importedCount = 0;

    // 1. Si Hito 5 tiene productos, importar los que falten a Hito 1
    if (hito5Doc && Array.isArray(hito5Doc.productos) && hito5Doc.productos.length > 0) {
      for (const prod of hito5Doc.productos) {
        const mapped = mapHito5ProductToCompatRow(prod);
        const existingIdx = currentRows.findIndex(
          (r) => String(r.nombre || '').trim().toLowerCase() === mapped.nombre.trim().toLowerCase()
        );
        if (existingIdx === -1) {
          currentRows.push(mapped);
          importedCount++;
        }
      }
    }

    // 2. Si ambos están vacíos, sembrar las 5 sustancias industriales con datos SGA verificados
    if (currentRows.length === 0) {
      const seedRows = buildDefaultChemicalSeedProducts();
      currentRows.push(...seedRows);
      importedCount += seedRows.length;
    }

    // Normalizar filas
    const normalizedRows = currentRows.map((row) => ({
      ...row,
      id: row.id || `chem-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion || 'Almacén Químico'),
    }));

    // 3. Guardar en ChemicalCompatibilitySession (Hito 1)
    officialSession = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId: officialConvId },
      {
        $set: {
          user: userId,
          companyId,
          isOfficial: true,
          matrixRows: normalizedRows,
          officialTitle: officialSession?.officialTitle || 'Matriz Oficial de Compatibilidad Química',
          promotedAt: officialSession?.promotedAt || new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 4. Sincronizar hacia SgsstChemicalData (Hito 5) para mantener inventario unificado
    if (companyId) {
      try {
        if (!hito5Doc) {
          hito5Doc = new SgsstChemicalData({
            user: userId,
            companyId,
            productos: normalizedRows.map(mapCompatRowToHito5Product),
          });
          await hito5Doc.save();
        } else {
          const existingHito5Prods = Array.isArray(hito5Doc.productos) ? [...hito5Doc.productos] : [];
          let hito5Modified = false;
          for (const row of normalizedRows) {
            const existsInHito5 = existingHito5Prods.some(
              (p) => String(p.nombre || '').trim().toLowerCase() === String(row.nombre || '').trim().toLowerCase()
            );
            if (!existsInHito5) {
              existingHito5Prods.push(mapCompatRowToHito5Product(row));
              hito5Modified = true;
            }
          }
          if (hito5Modified) {
            hito5Doc.productos = existingHito5Prods;
            hito5Doc.markModified('productos');
            await hito5Doc.save();
          }
        }
      } catch (hito5Err) {
        logger.warn('[ChemicalCompatibility/sync-ecosystem] Could not sync back to SgsstChemicalData:', hito5Err.message);
      }
    }

    // 5. Sincronizar tareas con KanbanTask (Hito 7) y marcar estándar 4.1.3 en DiagnosticoData (Hito 1)
    const { totalSynced: syncedTasksCount } = await syncChemicalKanbanTasks(userId, companyId, normalizedRows);
    await markChemicalStandardCompliant(userId, companyId, normalizedRows.length);

    const ecosystemStats = await gatherChemicalEcosystem(req, companyId);

    return res.json({
      success: true,
      matrixRows: officialSession.matrixRows,
      ecosystemStats,
      importedCount,
      syncedTasksCount,
      message: `Sincronización 360° SGA completada: ${normalizedRows.length} sustancias químicas sincronizadas entre Matriz de Compatibilidad (Hito 1) e Inventario Químico (Hito 5), y ${syncedTasksCount} controles registrados en el Centro ACPM.`,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/sync-ecosystem] Error:', error);
    return res.status(500).json({ error: error.message || 'Error al sincronizar el ecosistema químico 360°' });
  }
});

// ─── GET: Obtener la Matriz Oficial de Compatibilidad Química de la empresa ─────
router.get('/official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const officialConvId = `official-chem-${companyId || userId}`;

    let officialSession = await ChemicalCompatibilitySession.findOne({ conversationId: officialConvId });

    // Si no existe sesión oficial aún o está vacía, buscar la sesión con datos más reciente de la empresa/usuario
    if (!officialSession || !officialSession.matrixRows || officialSession.matrixRows.length === 0) {
      const fallbackQuery = companyId ? { companyId } : { user: userId };
      const latestWithData = await ChemicalCompatibilitySession.findOne({
        ...fallbackQuery,
        'matrixRows.0': { $exists: true },
      }).sort({ updatedAt: -1 });

      if (latestWithData) {
        officialSession = await ChemicalCompatibilitySession.findOneAndUpdate(
          { conversationId: officialConvId },
          {
            $set: {
              user: userId,
              companyId,
              isOfficial: true,
              matrixRows: latestWithData.matrixRows,
              chartConclusions: latestWithData.chartConclusions || {},
              reportHtml: latestWithData.reportHtml || '',
              sourceConversationId: latestWithData.conversationId,
              officialTitle: latestWithData.officialTitle || 'Matriz Oficial de Compatibilidad Química',
              promotedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      } else {
        // Intentar poblar inicialmente desde el Hito 5 (Registro y Rótulo de Productos Químicos) si existe
        let hito5Doc = companyId
          ? (await SgsstChemicalData.findOne({ user: userId, companyId }).lean()) ||
            (await SgsstChemicalData.findOne({ companyId }).lean())
          : await SgsstChemicalData.findOne({ user: userId }).lean();

        let initialRows = [];
        let sourceTag = 'hito5-chemical-registry';

        if (hito5Doc && Array.isArray(hito5Doc.productos) && hito5Doc.productos.length > 0) {
          initialRows = hito5Doc.productos.map(mapHito5ProductToCompatRow);
        } else {
          // Si Hito 5 también está vacío, sembrar 5 sustancias químicas industriales completas con datos SGA verificados
          initialRows = buildDefaultChemicalSeedProducts();
          sourceTag = 'sga-verified-seed';
          if (companyId) {
            try {
              await SgsstChemicalData.findOneAndUpdate(
                { user: userId, companyId },
                {
                  $setOnInsert: {
                    user: userId,
                    companyId,
                    productos: initialRows.map(mapCompatRowToHito5Product),
                  },
                },
                { upsert: true, new: true }
              );
            } catch (seedErr) {
              logger.debug('[ChemicalCompatibility/official] Hito 5 seed skipped:', seedErr.message);
            }
          }
        }

        officialSession = await ChemicalCompatibilitySession.findOneAndUpdate(
          { conversationId: officialConvId },
          {
            $set: {
              user: userId,
              companyId,
              isOfficial: true,
              matrixRows: initialRows,
              chartConclusions: {},
              reportHtml: '',
              sourceConversationId: sourceTag,
              officialTitle: 'Matriz Oficial de Compatibilidad Química',
              promotedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
        await markChemicalStandardCompliant(userId, companyId, initialRows.length);
      }
    }

    const ecosystemStats = await gatherChemicalEcosystem(req, companyId);

    return res.json({
      conversationId: officialSession.conversationId,
      matrixRows: officialSession.matrixRows || [],
      chartConclusions: officialSession.chartConclusions || {},
      reportHtml: officialSession.reportHtml || '',
      officialTitle: officialSession.officialTitle || 'Matriz Oficial de Compatibilidad Química',
      sourceConversationId: officialSession.sourceConversationId || '',
      updatedAt: officialSession.updatedAt,
      promotedAt: officialSession.promotedAt,
      ecosystemStats,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/official] Error fetching official matrix:', error);
    return res.status(500).json({ error: 'Error al obtener la Matriz Oficial de Compatibilidad Química' });
  }
});

// ─── POST: Promover / Fijar cualquier matriz de chat como Matriz Oficial Química ─
router.post('/set-official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { sourceConversationId, matrixRows, chartConclusions, reportHtml, officialTitle } = req.body;
    const officialConvId = `official-chem-${companyId || userId}`;

    let rowsToPromote = matrixRows;
    let conclusionsToPromote = chartConclusions || {};
    let reportToPromote = reportHtml;

    if ((!rowsToPromote || !Array.isArray(rowsToPromote)) && sourceConversationId) {
      const sourceSession = await ChemicalCompatibilitySession.findOne({ conversationId: sourceConversationId });
      if (!sourceSession) {
        return res.status(404).json({ error: 'No se encontró la matriz química de origen para fijar como oficial.' });
      }
      rowsToPromote = sourceSession.matrixRows || [];
      conclusionsToPromote = sourceSession.chartConclusions || {};
      if (reportToPromote === undefined) reportToPromote = sourceSession.reportHtml || '';
    }

    const normalizedRows = (rowsToPromote || []).map(row => ({
      ...row,
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    const updateFields = {
      user: userId,
      companyId,
      isOfficial: true,
      matrixRows: normalizedRows,
      chartConclusions: conclusionsToPromote,
      sourceConversationId: sourceConversationId || officialConvId,
      officialTitle: officialTitle || 'Matriz Oficial de Compatibilidad Química',
      promotedAt: new Date(),
    };
    if (reportToPromote !== undefined) {
      updateFields.reportHtml = reportToPromote;
    }

    const officialSession = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId: officialConvId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    if (normalizedRows.length > 0) {
      await markChemicalStandardCompliant(userId, companyId, normalizedRows.length);
    }

    logger.info(`[ChemicalCompatibility/set-official] Promoted matrix from ${sourceConversationId} to ${officialConvId} (${normalizedRows.length} rows)`);
    return res.json({
      success: true,
      conversationId: officialSession.conversationId,
      matrixRows: officialSession.matrixRows,
      chartConclusions: officialSession.chartConclusions || {},
      reportHtml: officialSession.reportHtml || '',
      officialTitle: officialSession.officialTitle,
      sourceConversationId: officialSession.sourceConversationId,
      updatedAt: officialSession.updatedAt,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/set-official] Error setting official matrix:', error);
    return res.status(500).json({ error: 'Error al fijar la Matriz Oficial de Compatibilidad Química' });
  }
});

// ─── PUT: Guardar directamente en la Matriz Oficial de Compatibilidad Química ───
router.put('/official', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { matrixRows, officialTitle, reportHtml } = req.body;
    const officialConvId = `official-chem-${companyId || userId}`;

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    const updateFields = {
      user: userId,
      companyId,
      isOfficial: true,
      matrixRows: normalizedRows,
    };
    if (officialTitle) updateFields.officialTitle = officialTitle;
    if (reportHtml !== undefined) updateFields.reportHtml = reportHtml;

    const officialSession = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId: officialConvId },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    if (normalizedRows.length > 0) {
      await markChemicalStandardCompliant(userId, companyId, normalizedRows.length);
    }

    return res.json({
      success: true,
      conversationId: officialSession.conversationId,
      matrixRows: officialSession.matrixRows,
      reportHtml: officialSession.reportHtml || '',
      updatedAt: officialSession.updatedAt,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/official PUT] Error saving official matrix:', error);
    return res.status(500).json({ error: 'Error al guardar la Matriz Oficial de Compatibilidad Química' });
  }
});

// ─── GET: Listar todas las matrices químicas creadas en chats para el selector ──
router.get('/list-user-matrices', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);

    const query = companyId
      ? { companyId, 'matrixRows.0': { $exists: true } }
      : { user: userId, $or: [{ companyId: null }, { companyId: { $exists: false } }], 'matrixRows.0': { $exists: true } };

    const sessions = await ChemicalCompatibilitySession.find(query)
      .select('conversationId isOfficial officialTitle sourceConversationId matrixRows updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    const list = sessions.map(s => {
      const ubicaciones = [...new Set((s.matrixRows || []).map(r => r.ubicacion).filter(Boolean))].slice(0, 3);
      return {
        conversationId: s.conversationId,
        isOfficial: !!s.isOfficial || String(s.conversationId).startsWith('official-chem-'),
        officialTitle: s.officialTitle || '',
        rowCount: (s.matrixRows || []).length,
        previewUbicaciones: ubicaciones.join(', ') || 'General',
        updatedAt: s.updatedAt,
      };
    });

    return res.json({ matrices: list });
  } catch (error) {
    logger.error('[ChemicalCompatibility/list-user-matrices] Error:', error);
    return res.status(500).json({ error: 'Error al listar matrices de compatibilidad química' });
  }
});

// ─── POST: Sincronizar inventario desde Hito 5 (Registro Químico) ──────────────
router.post('/sync-hito5', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { conversationId } = req.body;
    const targetConvId = conversationId || `official-chem-${companyId || userId}`;

    const hito5Doc =
      (await SgsstChemicalData.findOne({ user: userId, companyId }).lean()) ||
      (companyId ? await SgsstChemicalData.findOne({ companyId }).lean() : null);

    if (!hito5Doc || !Array.isArray(hito5Doc.productos) || hito5Doc.productos.length === 0) {
      return res.json({
        success: true,
        importedCount: 0,
        message: 'No se encontraron productos registrados en el Inventario Químico del Hito 5.',
      });
    }

    let session = await ChemicalCompatibilitySession.findOne({ conversationId: targetConvId });
    if (!session) {
      session = new ChemicalCompatibilitySession({
        conversationId: targetConvId,
        user: userId,
        companyId,
        matrixRows: [],
      });
    }

    let importedCount = 0;
    for (const prod of hito5Doc.productos) {
      const mapped = mapHito5ProductToCompatRow(prod);
      const existingIdx = (session.matrixRows || []).findIndex(
        r => (r.nombre || '').toLowerCase() === mapped.nombre.toLowerCase()
      );
      if (existingIdx === -1) {
        session.matrixRows.push(mapped);
        importedCount++;
      } else {
        session.matrixRows[existingIdx] = {
          ...session.matrixRows[existingIdx],
          ...mapped,
          id: session.matrixRows[existingIdx].id || mapped.id,
        };
      }
    }

    session.markModified('matrixRows');
    await session.save();

    return res.json({
      success: true,
      importedCount,
      matrixRows: session.matrixRows,
      message: `Se sincronizaron ${hito5Doc.productos.length} productos químicos desde el Hito 5 (${importedCount} nuevos añadidos).`,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/sync-hito5] Error:', error);
    return res.status(500).json({ error: 'Error al sincronizar con el inventario químico del Hito 5' });
  }
});

// ─── POST: Sincronizar controles químicos y brechas SGA con el Centro de Control (Kanban ACPM) ─
router.post('/sync-controles-quimicos', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const { matrixRows } = req.body;

    const rows = Array.isArray(matrixRows) ? matrixRows : [];
    const { createdTasks, updatedTasks } = await syncChemicalKanbanTasks(userId, companyId, rows);

    return res.json({
      success: true,
      createdTasks,
      updatedTasks,
      message: `Sincronización SGA completada: ${createdTasks} acciones nuevas creadas y ${updatedTasks} actualizadas en el Centro de Control.`,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/sync-controles-quimicos] Error:', error);
    return res.status(500).json({ error: 'Error al sincronizar controles químicos con el Centro de Control' });
  }
});

// ─── GET: Obtener matriz para una conversación ────────────────────────────────
router.get('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, companyId } = await resolveUserAndCompany(req);

    logger.debug(`[ChemicalCompatibility GET] conversationId=${conversationId} | userId=${userId}`);

    let session = await ChemicalCompatibilitySession.findOne({ conversationId, user: userId, companyId: companyId });
    
    if (!session) {
      session = await ChemicalCompatibilitySession.findOne({ conversationId });
      if (session) {
        let modified = false;
        if (!session.user) {
          session.user = userId;
          modified = true;
        }
        if (!session.companyId && companyId) {
          session.companyId = companyId;
          modified = true;
        }
        if (modified) {
          await session.save();
          logger.info(`[ChemicalCompatibility GET] Adopted user/companyId for session ${conversationId}`);
        }
      }
    }

    // Fallback: buscar sesión temporal si es nueva conversación
    if (!session && conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      const tempSession = await ChemicalCompatibilitySession.findOne({ conversationId: tempId, user: userId });
      if (tempSession && tempSession.matrixRows && tempSession.matrixRows.length > 0) {
        tempSession.conversationId = conversationId;
        tempSession.companyId = companyId;
        await tempSession.save();
        session = tempSession;
        logger.info(`[ChemicalCompatibility GET] Migrated temporal session for user ${userId} to ${conversationId}`);
      }
    }

    if (!session) {
      return res.json({ matrixRows: [], chartConclusions: {}, reportHtml: '' });
    }

    res.json({
      matrixRows: session.matrixRows,
      chartConclusions: session.chartConclusions || {},
      reportHtml: session.reportHtml || '',
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility] Error fetching matrix:', error);
    res.status(500).json({ error: 'Failed to fetch chemical matrix' });
  }
});

// ─── PUT: Guardar/actualizar la matriz ──────────────────────────────────────────
router.put('/matrix/:conversationId', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { matrixRows, reportHtml } = req.body;
    const { userId, companyId } = await resolveUserAndCompany(req);

    const normalizedRows = (matrixRows || []).map(row => ({
      ...row,
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    const updateSet = { matrixRows: normalizedRows, companyId };
    if (reportHtml !== undefined) updateSet.reportHtml = reportHtml;

    let session = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId, companyId: companyId },
      {
        $set: updateSet,
        $setOnInsert: { user: userId },
      },
      { upsert: true, new: true },
    );

    // Sincronizar también con la Matriz Oficial de Compatibilidad Química
    const officialConvId = `official-chem-${companyId || userId}`;
    if (conversationId !== officialConvId && normalizedRows.length > 0) {
      const officialUpdate = {
        matrixRows: normalizedRows,
        isOfficial: true,
        companyId,
        sourceConversationId: conversationId,
        promotedAt: new Date(),
      };
      if (reportHtml !== undefined) officialUpdate.reportHtml = reportHtml;
      await ChemicalCompatibilitySession.findOneAndUpdate(
        { conversationId: officialConvId },
        {
          $set: officialUpdate,
          $setOnInsert: { user: userId, officialTitle: 'Matriz Oficial de Compatibilidad Química' },
        },
        { upsert: true }
      );
    }

    if (conversationId && conversationId !== 'new' && !conversationId.startsWith('temp-')) {
      const tempId = `temp-${userId}`;
      await ChemicalCompatibilitySession.deleteOne({ conversationId: tempId, user: userId });
      logger.info(`[ChemicalCompatibility PUT] Cleaned up temporal session for user ${userId}`);
    }

    if (normalizedRows.length > 0) {
      await markChemicalStandardCompliant(userId, companyId, normalizedRows.length);
    }

    res.json({ success: true, matrixRows: session.matrixRows, reportHtml: session.reportHtml || '' });
  } catch (error) {
    logger.error('[ChemicalCompatibility] Error updating matrix:', error);
    res.status(500).json({ error: 'Failed to update chemical matrix' });
  }
});

// ─── GET: Consultar PubChem NIH GHS API para un producto químico ───────────────
router.get('/pubchem', requireJwtAuth, async (req, res) => {
  try {
    const query = (req.query.q || req.query.name || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Se requiere el parámetro q con el nombre o CAS del químico.' });
    }
    const ghsInfo = await lookupPubChemGHS(query);
    if (!ghsInfo) {
      return res.json({ found: false, query });
    }
    return res.json({ found: true, ...ghsInfo });
  } catch (error) {
    logger.error('[ChemicalCompatibility/pubchem] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── POST: Enriquecer en lote todas las sustancias de una sesión con PubChem NIH GHS ─
router.post('/pubchem-enrich', requireJwtAuth, async (req, res) => {
  try {
    const { userId, companyId } = await resolveUserAndCompany(req);
    const officialConvId = `official-chem-${companyId || userId}`;
    const targetConvId = req.body.conversationId || officialConvId;

    let session = await ChemicalCompatibilitySession.findOne({ conversationId: targetConvId });
    if (!session && targetConvId === officialConvId) {
      session = await ChemicalCompatibilitySession.findOne(
        companyId ? { user: userId, companyId, isOfficial: true } : { user: userId, isOfficial: true }
      );
    }

    const inputRows = Array.isArray(req.body.matrixRows) && req.body.matrixRows.length > 0
      ? req.body.matrixRows
      : (session?.matrixRows || []);

    if (inputRows.length === 0) {
      return res.json({
        success: true,
        enrichedCount: 0,
        matrixRows: [],
        message: 'No hay sustancias químicas para enriquecer.',
      });
    }

    let enrichedCount = 0;
    const enrichedRows = [];
    for (const rawRow of inputRows) {
      const row = typeof rawRow.toObject === 'function' ? rawRow.toObject() : { ...rawRow };
      if (row.nombre) {
        const ghs = await lookupPubChemGHS(row.nombre);
        if (ghs) {
          enrichedCount++;
          row.pubchem_cid = ghs.cid;
          if (!row.cas && ghs.cas) row.cas = ghs.cas;
          if (ghs.signalWord) row.palabra_advertencia = ghs.signalWord;
          if (Array.isArray(ghs.wappyPictograms) && ghs.wappyPictograms.length > 0) {
            row.pictogramas_sga = Array.from(new Set([...(row.pictogramas_sga || []), ...ghs.wappyPictograms]));
          }
          if ((!row.frases_h || row.frases_h === 'Verificar FDS') && ghs.hazardStatements?.length > 0) {
            row.frases_h = ghs.hazardStatements.join(' | ');
          }
          if ((!row.consejos_p || row.consejos_p === 'Verificar FDS') && ghs.precautionaryStatements?.length > 0) {
            row.consejos_p = ghs.precautionaryStatements.join(', ');
          }
          if ((!row.clasificacion_onu || row.clasificacion_onu === 'No Peligroso') && ghs.clasificacion_onu && ghs.clasificacion_onu !== 'No Peligroso') {
            row.clasificacion_onu = ghs.clasificacion_onu;
          }
          if ((!row.incompatibilidades || row.incompatibilidades === 'Verificar FDS') && ghs.incompatibilidades) {
            row.incompatibilidades = ghs.incompatibilidades;
          }
        }
      }
      enrichedRows.push(row);
    }

    const saved = await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId: session ? session.conversationId : targetConvId },
      {
        $set: {
          matrixRows: enrichedRows,
          ...(companyId ? { companyId } : {}),
        },
        $setOnInsert: {
          user: userId,
          isOfficial: targetConvId === officialConvId,
          officialTitle: 'Matriz Oficial de Compatibilidad Química',
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      enrichedCount,
      totalRows: enrichedRows.length,
      matrixRows: saved.matrixRows,
      message: `Enriquecimiento PubChem NIH GHS completado (${enrichedCount}/${enrichedRows.length} sustancias verificadas).`,
    });
  } catch (error) {
    logger.error('[ChemicalCompatibility/pubchem-enrich] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── IA + PUBCHEM: Analizar o completar una fila individual y su Tarjeta SGA ───
router.post('/ai-update-row', requireJwtAuth, async (req, res) => {
  try {
    const { row } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!row || !row.nombre) {
      return res.status(400).json({ error: 'Se requiere un objeto row con el campo "nombre".' });
    }

    // 1. Consultar PubChem NIH GHS en paralelo/previo para obtener pictogramas y frases H/P oficiales
    const pubchemData = await lookupPubChemGHS(row.nombre);
    const pubchemContext = pubchemData
      ? `\nDATOS OFICIALES PUBCHEM NIH (CID ${pubchemData.cid}${pubchemData.cas ? `, CAS ${pubchemData.cas}` : ''}):
- Pictogramas GHS detectados: ${(pubchemData.wappyPictograms || []).join(', ') || 'Ninguno'} (${(pubchemData.ghsCodes || []).join(', ')})
- Palabra de advertencia oficial: ${pubchemData.signalWord || 'PELIGRO'}
- Clase ONU sugerida por GHS: ${pubchemData.clasificacion_onu || 'Verificar'}
- Frases H (PubChem): ${(pubchemData.hazardStatements || []).join(' | ')}
- Códigos P (PubChem): ${(pubchemData.precautionaryStatements || []).join(', ')}`
      : '';

    const prompt = `Eres un Higienista Industrial certificado y experto en Seguridad Química en Colombia (Decreto 1496 de 2018, Resolución 773 de 2021, NTC 4435 / NTC 3966, Guía Técnica del Ministerio del Trabajo y SGA de Naciones Unidas).
Analiza este producto químico y genera tanto sus propiedades para la Matriz de Compatibilidad como los datos técnicos completos para su Tarjeta de Emergencia / Rótulo SGA.

DATOS DEL PRODUCTO:
Nombre del producto: ${row.nombre}
Clase de Peligro ONU actual: ${row.clasificacion_onu || 'No especificada'}
Estado Físico actual: ${row.estado_fisico || 'No especificado'}
Pictogramas SGA actuales: ${(row.pictogramas_sga || []).join(', ') || 'No especificados'}
Cantidad almacenada: ${row.cantidad_almacenada || 'No especificada'}
Ubicación actual: ${row.ubicacion || 'No especificada'}
Tiene FDS: ${row.tiene_fds || 'No especificado'}
Tiene Rotulado: ${row.tiene_rotulo || 'No especificado'}${pubchemContext}

TU TAREA:
1. Determina el Estado Físico correcto ("Líquido", "Sólido", o "Gas").
2. Identifica la Clase de Peligro ONU más adecuada (debe ser exactamente una de: "Clase 1: Explosivos", "Clase 2.1: Gases Inflamables", "Clase 2.2: Gases No Inflamables ni Tóxicos", "Clase 2.3: Gases Tóxicos", "Clase 3: Líquidos Inflamables", "Clase 4.1: Sólidos Inflamables", "Clase 4.2: Sustancias de Combustión Espontánea", "Clase 4.3: Desprenden gases inflamables con agua", "Clase 5.1: Sustancias Comburentes", "Clase 5.2: Peróxidos Orgánicos", "Clase 6.1: Sustancias Tóxicas", "Clase 8: Sustancias Corrosivas", "Clase 9: Peligros Varios", "No Peligroso").
3. Selecciona los pictogramas SGA aplicables (valores permitidos: "inflamable", "corrosivo", "calavera", "peligro_salud", "signo_exclamacion", "medio_ambiente", "comburente", "explosivo", "gas_comprimido"). Respeta e incluye los pictogramas oficiales de PubChem si están presentes.
4. Define la palabra de advertencia SGA ("PELIGRO" o "ATENCIÓN"), el Número ONU (ej. "UN 1791") y el Número CAS (ej. "7681-52-9").
5. Redacta en español las Frases H (Indicaciones de Peligro SGA con su código H) y los Consejos P (Consejos de Prudencia SGA con su código P).
6. Especifica los EPP recomendados, medidas de Primeros Auxilios y Control de Derrames/Incendios para la Tarjeta del Producto Químico.
7. Genera las incompatibilidades químicas específicas (ej. Ácidos vs Bases/Hipocloritos dentro de Clase 8 por generación de gas Cl2 o reacción exotérmica) y requisitos de almacenamiento seguro según NTC 3966 y Res. 773 de 2021.

REGLAS DE FORMATO:
Responde ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni código \`\`\`) que contenga exactamente estas propiedades:
{
  "estado_fisico": "<Líquido|Sólido|Gas>",
  "clasificacion_onu": "<Clase ONU sugerida>",
  "numero_onu": "<ej. UN 1791>",
  "cas": "<ej. 7681-52-9>",
  "palabra_advertencia": "<PELIGRO|ATENCIÓN>",
  "pictogramas_sga": [<arreglo de pictogramas en minúscula>],
  "frases_h": "<Indicaciones de peligro H en español>",
  "consejos_p": "<Consejos de prudencia P en español>",
  "epp_recomendado": "<EPP específico requerido para manipulación>",
  "primeros_auxilios": "<Medidas de primeros auxilios en caso de inhalación, piel, ojos e ingestión>",
  "control_derrames": "<Medidas de contención de derrames y agentes extintores>",
  "incompatibilidades": "<texto detallado de incompatibilidades químicas>",
  "requisitos_almacenamiento": "<texto detallado de almacenamiento seguro y controles>"
}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    let updatedFields = {};
    try {
      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      updatedFields = JSON.parse(text);
    } catch (aiErr) {
      logger.warn('[ChemicalCompatibility/ai-update-row] AI fallback to PubChem data:', aiErr.message);
      if (pubchemData) {
        updatedFields = {
          estado_fisico: row.estado_fisico || 'Líquido',
          clasificacion_onu: row.clasificacion_onu || pubchemData.clasificacion_onu || 'Clase 8: Sustancias Corrosivas',
          cas: row.cas || pubchemData.cas || '',
          palabra_advertencia: pubchemData.signalWord || 'PELIGRO',
          pictogramas_sga: pubchemData.wappyPictograms?.length ? pubchemData.wappyPictograms : (row.pictogramas_sga || []),
          frases_h: (pubchemData.hazardStatements || []).join(' | ') || 'Consultar FDS del fabricante.',
          consejos_p: (pubchemData.precautionaryStatements || []).join(', ') || 'P280: Usar guantes y protección ocular/facial.',
          incompatibilidades: row.incompatibilidades || pubchemData.incompatibilidades || 'Evitar contacto con ácidos fuertes, agentes oxidantes y materiales incompatibles según FDS.',
          requisitos_almacenamiento: row.requisitos_almacenamiento || 'Almacenar en lugar fresco, seco, ventilado, con dique de contención y señalización SGA.',
        };
      } else {
        throw aiErr;
      }
    }

    // Combinar pictogramas y CAS de PubChem si se detectaron oficialmente
    if (pubchemData) {
      if (Array.isArray(pubchemData.wappyPictograms) && pubchemData.wappyPictograms.length > 0) {
        const mergedPictos = new Set([
          ...(Array.isArray(updatedFields.pictogramas_sga) ? updatedFields.pictogramas_sga : []),
          ...pubchemData.wappyPictograms,
        ]);
        updatedFields.pictogramas_sga = Array.from(mergedPictos);
      }
      updatedFields.pubchem_cid = pubchemData.cid;
      if (!updatedFields.cas && pubchemData.cas) {
        updatedFields.cas = pubchemData.cas;
      }
    }

    // Mantener campos informativos del usuario
    updatedFields.nombre = row.nombre;
    updatedFields.fabricante = row.fabricante || '';
    updatedFields.cantidad_almacenada = row.cantidad_almacenada || '';
    updatedFields.ubicacion = row.ubicacion || '';
    updatedFields.tiene_fds = row.tiene_fds || 'Sí';
    updatedFields.tiene_rotulo = 'Sí';

    return res.json({ updatedFields, pubchemData });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-update-row] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── HELPER: Evaluar compatibilidad química rigurosa NTC 3966 + Ácido/Base ──────
const ACID_KEYWORDS_REGEX = /\b([aá]cido|acid|muri[aá]tico|clorh[ií]drico|sulf[uú]rico|n[ií]trico|fosf[oó]rico|ac[eé]tico|f[oó]rmico|percl[oó]rico|fluorh[ií]drico|b[oó]rico|c[ií]trico|ox[aá]lico)\b/i;
const BASE_OR_HYPOCHLORITE_REGEX = /\b(hipoclorito|hidr[oó]xido|soda|sosa|c[aá]ustic[oa]|potasa|amon[ií]aco|amoniacal|alcalin[oa]|cal\s+viva|carbonato|bicarbonato|cloro|blanqueador|l[ií]mpido|lej[ií]a)\b/i;

function isAcidCorrosive(name = '', incomp = '') {
  if (ACID_KEYWORDS_REGEX.test(String(name))) return true;
  if (/\b(incompatib\w*\s+con\s+bases|libera\s+gas\s+cloro\s+con\s+hipoclorito)\b/i.test(String(incomp))) return true;
  return false;
}

function isBaseOrHypochloriteCorrosive(name = '', incomp = '') {
  if (BASE_OR_HYPOCHLORITE_REGEX.test(String(name))) return true;
  if (/\b(incompatib\w*\s+con\s+[aá]cidos)\b/i.test(String(incomp))) return true;
  return false;
}

function getCompatibilityStatus(classA, classB, nameA = '', nameB = '', incompA = '', incompB = '') {
  // Matriz técnica rigurosa de compatibilidad química (NTC 3966 / Guía Mintrabajo / Decreto 1496 de 2018)
  if (!classA || !classB || classA === 'No Peligroso' || classB === 'No Peligroso') return 'compatible';

  const cA = classA.split(':')[0].trim();
  const cB = classB.split(':')[0].trim();

  // Explosivos (Clase 1) y Radiactivos (Clase 7) siempre segregar (Rojo)
  if (cA === 'Clase 1' || cB === 'Clase 1' || cA === 'Clase 7' || cB === 'Clase 7') return 'incompatible';

  if (cA === cB) {
    if (cA === 'Clase 8') {
      // Regla Crítica NTC 3966 / SGA: Dentro de Clase 8, Ácidos vs Bases/Hipocloritos/Amoníaco son INCOMPATIBLES (Rojo)
      const aIsAcid = isAcidCorrosive(nameA, incompA);
      const bIsAcid = isAcidCorrosive(nameB, incompB);
      const aIsBase = isBaseOrHypochloriteCorrosive(nameA, incompA);
      const bIsBase = isBaseOrHypochloriteCorrosive(nameB, incompB);
      if ((aIsAcid && bIsBase) || (bIsAcid && aIsBase)) {
        return 'incompatible';
      }
      return 'caution'; // Misma subfamilia corrosiva o sin especificar: verificar FDS Sección 7 y 10
    }
    if (cA === 'Clase 5.2' || cA === 'Clase 4.2' || cA === 'Clase 4.3') return 'caution';
    return 'compatible';
  }

  const pair = [cA, cB];
  const has = (x, y) => (pair[0] === x && pair[1] === y) || (pair[0] === y && pair[1] === x);
  const hasAny = (group1, group2) =>
    (group1.includes(cA) && group2.includes(cB)) || (group1.includes(cB) && group2.includes(cA));

  // 1. Inflamables (Clase 3, 2.1, 4.1, 4.2, 4.3) vs Comburentes / Peróxidos (Clase 5.1, 5.2) -> Incompatible (Rojo)
  if (hasAny(['Clase 3', 'Clase 2.1', 'Clase 4.1', 'Clase 4.2', 'Clase 4.3'], ['Clase 5.1', 'Clase 5.2'])) {
    return 'incompatible';
  }

  // 2. Comburentes / Peróxidos (Clase 5.1, 5.2) vs Tóxicos (Clase 6.1, 2.3) -> Incompatible (Rojo)
  if (hasAny(['Clase 5.1', 'Clase 5.2'], ['Clase 6.1', 'Clase 2.3'])) {
    return 'incompatible';
  }

  // 3. Corrosivos (Clase 8) vs Inflamables (Clase 3, 2.1, 4.1, 4.2, 4.3) o Comburentes (Clase 5.1, 5.2) -> Incompatible (Rojo)
  if (hasAny(['Clase 8'], ['Clase 3', 'Clase 2.1', 'Clase 4.1', 'Clase 4.2', 'Clase 4.3', 'Clase 5.1', 'Clase 5.2'])) {
    return 'incompatible';
  }

  // 4. Gases Inflamables (Clase 2.1) vs Gases Tóxicos (Clase 2.3) o Tóxicos (Clase 6.1) -> Incompatible (Rojo)
  if (hasAny(['Clase 2.1'], ['Clase 2.3', 'Clase 6.1'])) {
    return 'incompatible';
  }

  // 5. Sustancias que desprenden gases inflamables con el agua (Clase 4.3) vs Líquidos/Corrosivos/Tóxicos -> Incompatible
  if (hasAny(['Clase 4.3'], ['Clase 3', 'Clase 8', 'Clase 6.1', 'Clase 2.2', 'Clase 2.3'])) {
    return 'incompatible';
  }

  // 6. Combustión espontánea (Clase 4.2) vs Tóxicos o Gases -> Incompatible
  if (hasAny(['Clase 4.2'], ['Clase 6.1', 'Clase 2.1', 'Clase 2.3'])) {
    return 'incompatible';
  }

  // Casos de precaución / segregación en estantería (Amarillo)
  if (has('Clase 8', 'Clase 6.1') || has('Clase 3', 'Clase 6.1')) {
    return 'caution';
  }

  return 'caution';
}

function buildChemicalChartsHtml(matrixRows) {
  if (!matrixRows || matrixRows.length === 0) return '';

  // 1. Conteo de Clases ONU
  const classCounts = {};
  matrixRows.forEach(r => {
    const k = r.clasificacion_onu || 'No Peligroso';
    classCounts[k] = (classCounts[k] || 0) + 1;
  });
  const chartClasses = Object.entries(classCounts).map(([name, val]) => ({ name, val })).sort((a,b) => b.val - a.val);
  const maxClass = Math.max(...chartClasses.map(d => d.val), 1);

  // 2. Conteo de FDS y Rotulado
  let fdsCount = 0;
  let labelCount = 0;
  matrixRows.forEach(r => {
    if (String(r.tiene_fds).toLowerCase() === 'sí') fdsCount++;
    if (String(r.tiene_rotulo).toLowerCase() === 'sí') labelCount++;
  });
  const total = matrixRows.length || 1;
  const pctFDS = Math.round((fdsCount / total) * 100);
  const pctLabel = Math.round((labelCount / total) * 100);

  // 3. Parejas Incompatibles detectadas (incluyendo Ácido vs Base/Hipoclorito dentro de Clase 8)
  const incompatiblePairs = [];
  for (let i = 0; i < matrixRows.length; i++) {
    for (let j = i + 1; j < matrixRows.length; j++) {
      const pA = matrixRows[i];
      const pB = matrixRows[j];
      const status = getCompatibilityStatus(
        pA.clasificacion_onu,
        pB.clasificacion_onu,
        pA.nombre,
        pB.nombre,
        pA.incompatibilidades,
        pB.incompatibilidades
      );
      if (status === 'incompatible') {
        const cA = pA.clasificacion_onu?.split(':')[0]?.trim() || 'Desconocido';
        const cB = pB.clasificacion_onu?.split(':')[0]?.trim() || 'Desconocido';
        const isAcidBaseClash = cA === 'Clase 8' && cB === 'Clase 8';
        incompatiblePairs.push({
          prodA: pA.nombre,
          classA: cA,
          prodB: pB.nombre,
          classB: cB,
          ubicacionA: pA.ubicacion || 'N/A',
          ubicacionB: pB.ubicacion || 'N/A',
          hazardNote: isAcidBaseClash
            ? 'ALERTA CRÍTICA ÁCIDO vs BASE/HIPOCLORITO (Clase 8): Riesgo de liberación de gas Cloro (Cl2) letal o reacción exotérmica violenta. Segregación física obligatoria en diques independientes (NTC 3966).'
            : 'Incompatibilidad por clase de peligro ONU (NTC 3966 / Decreto 1496 de 2018).',
        });
      }
    }
  }

  function renderBar(label, value, max, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
      <div style="display:flex; align-items:center; margin-bottom:8px;">
        <div style="width:180px; font-size:11px; color:#475569; font-weight:600; text-align:right; padding-right:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${label}">${label}</div>
        <div style="flex:1; background-color:#f1f5f9; border-radius:10px; height:16px; position:relative; overflow:hidden;">
          <div style="background-color:${color}; width:${Math.max(5, pct)}%; height:100%; border-radius:10px; display:flex; align-items:center; justify-content:flex-end; padding-right:8px; color:white; font-size:10px; font-weight:bold;">
            ${value}
          </div>
        </div>
      </div>
    `;
  }

  let html = `
    <div style="margin: 25px 0; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background-color: #f8fafc; page-break-inside: avoid;">
      <h3 style="color:#0f766e; font-size:16px; margin-top:0; border-bottom:2px solid #0f766e; padding-bottom:8px; margin-bottom:20px; text-transform:uppercase;">
          ANALÍTICA DE COMPATIBILIDAD Y RIESGO QUÍMICO (DECRETO 1496 DE 2018 / RES. 773 DE 2021 / NTC 3966)
      </h3>
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Inventario por Clase ONU</h4>
          ${chartClasses.map(d => renderBar(d.name, d.val, maxClass, '#0ea5e9')).join('')}
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#334155; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:5px;">Conformidad Legal (SGA - Decreto 1496/2018 & Res. 773/2021)</h4>
          ${renderBar('Fichas FDS 16 Secciones', fdsCount, total, '#10b981')}
          <div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:10px;">Cumplimiento: ${pctFDS}% de productos</div>
          ${renderBar('Rotulado con Pictogramas SGA', labelCount, total, '#8b5cf6')}
          <div style="font-size:9px; color:#64748b; text-align:right; margin-bottom:5px;">Cumplimiento: ${pctLabel}% de productos</div>
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:15px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <h4 style="margin-top:0; color:#dc2626; font-size:12px; text-transform:uppercase; margin-bottom:12px; border-bottom:1px solid #fde8e8; padding-bottom:5px;">Puntos Críticos de Incompatibilidad Detectados (${incompatiblePairs.length})</h4>
          ${incompatiblePairs.length === 0 
            ? '<p style="font-size:11px; color:#22c55e; font-style:italic; font-weight:600; text-align:center; padding:10px 0;">¡Excelente! No se detectaron cruces de almacenamiento incompatibles basados en la clase de peligro.</p>' 
            : incompatiblePairs.map(p => `
              <div style="display:flex; flex-direction:column; background:#fff5f5; border:1px solid #fee2e2; padding:8px 12px; border-radius:8px; margin-bottom:8px; border-left: 4px solid #ef4444;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                  <strong style="color:#ef4444;">Incompatibilidad Crítica — ${p.hazardNote}</strong>
                </div>
                <div style="font-size:12px; color:#334155; margin-top:4px;">
                  El producto <strong>${p.prodA}</strong> (${p.classA}) y el producto <strong>${p.prodB}</strong> (${p.classB}) no pueden ser almacenados juntos.
                </div>
                <div style="font-size:10px; color:#64748b; margin-top:4px; display:flex; gap:10px;">
                  <span>Ubicación A: ${p.ubicacionA}</span>
                  <span>Ubicación B: ${p.ubicacionB}</span>
                </div>
              </div>
            `).join('')
          }
        </div>

      </div>
    </div>
  `;
  return html;
}

// ─── IA: Analizar toda la matriz y generar reporte Canvas ────────────────────────
router.post('/ai-analyze-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { matrixRows, instruction, conversationId } = req.body;
    const { userId, companyInfo: loadedCompanyInfo } = await resolveUserAndCompany(req);

    if (!matrixRows || !matrixRows.length) {
      return res.status(400).json({ error: 'El inventario químico está vacío.' });
    }

    const currentDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const headerHTML = buildStandardHeader({
      title: 'AUDITORÍA TÉCNICA Y MATRIZ DE COMPATIBILIDAD QUÍMICA',
      companyInfo: loadedCompanyInfo,
      date: currentDate,
      norm: 'Decreto 1496 de 2018 / Res. 773 de 2021 / SGA / NTC 3966',
      responsibleName: req.user?.name,
    });

    const inventorySummary = matrixRows.map((r, i) =>
      `[${i+1}] Producto: ${r.nombre} | CAS: ${r.cas || 'N/A'} | Clase ONU: ${r.clasificacion_onu} | Estado: ${r.estado_fisico} | Ubicación: ${r.ubicacion} | Cantidad: ${r.cantidad_almacenada} | FDS: ${r.tiene_fds} | Rotulado SGA: ${r.tiene_rotulo} | Incompatibilidades: ${r.incompatibilidades || 'N/A'}`
    ).join('\n');

    const prompt = `Eres un auditor e Inspector de Seguridad y Salud en el Trabajo experto en Riesgo Químico y en la normatividad colombiana (Decreto 1496 de 2018, Resolución 773 de 2021, Guía Técnica del Ministerio del Trabajo, SGA Rev. 6 y NTC 3966 / NTC 4435).
Analiza este inventario de productos químicos de la empresa y genera un Informe de Auditoría de Almacenamiento y Matriz de Compatibilidad sumamente detallado, técnico y extenso.

**INSTRUCCIONES DE FORMATO HTML:**
- Responde EXCLUSIVAMENTE en HTML limpio, listo para inyectarse en el DOM. NO uses \`\`\`html.
- Estructura las tablas con estilo premium:
  <table style="width:100%;table-layout:fixed;word-wrap:break-word;border-collapse:separate;border-spacing:0;border:1px solid #ccfbf1;border-radius:8px;margin-bottom:25px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
- Headers de tablas (<th>): <th style="background-color:#0f766e;color:#fff;padding:12px 14px;font-size:13px;font-weight:700;text-transform:uppercase;text-align:left;">
- Celdas (<td>): <td style="padding:10px 14px;border-bottom:1px solid #f0fdfa;font-size:13px;color:#334155;vertical-align:top;background-color:#fff;">
- Headers de sección (H3): <h3 style="color:#0f766e; margin-top:30px; border-bottom:1px solid #ccc; padding-bottom:5px;">

**ESTRUCTURA DEL INFORME EXIGIDA (en HTML):**
1. **Introducción y Objetivos:** Resumen legal y propósito técnico de la auditoría en base al Decreto 1496 de 2018, Resolución 773 de 2021 y Guía Técnica del Ministerio del Trabajo.
2. **Evaluación de Cumplimiento Legal (FDS y Rotulado):** Diagnóstico de los productos que carecen de FDS de 16 secciones (NTC 4435) o etiquetado SGA. Argumenta el riesgo sancionatorio.
3. **Análisis Crítico de Incompatibilidades en Almacenamiento (NTC 3966):** Señala las sustancias químicas incompatibles (incluyendo cruces Ácido vs Base/Hipoclorito dentro de la Clase 8 Corrosivos y Líquidos Inflamables Clase 3 vs Oxidantes/Corrosivos) que representan un riesgo crítico de reacción exotérmica, incendio o liberación de gas cloro ($Cl_2$).
4. **Plan de Acción y Reorganización de Almacenes (Tabla):** Genera una tabla detallada con 4 columnas: [Producto Químico, Peligro Principal, Medida de Separación/Segregación Recomendada (NTC 3966), Tipo de Control (Ingeniería/Administrativo)].
5. **Procedimiento de Emergencia y Control de Derrames:** Escribe un protocolo robusto ante derrames de sustancias incompatibles.
6. **Conclusión y Recomendaciones de Mejora Continua:** Consejos organizacionales para auditorías de riesgo químico.

**DATOS DEL INVENTARIO QUÍMICO:**
${inventorySummary}

**INSTRUCCIÓN ADICIONAL:**
${instruction || 'Generar informe técnico estructurado de almacenamiento seguro.'}`;

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const analysisRaw = result.response.text();
    const htmlBody = analysisRaw.replace(/```html\n ?/g, '').replace(/```\n?/g, '').trim();

    const chartsHTML = buildChemicalChartsHtml(matrixRows);

    let fullReport = headerHTML + chartsHTML + '<div style="margin-top:20px;">' + htmlBody + '</div>';
    if (loadedCompanyInfo) {
      fullReport += buildSignatureSection(loadedCompanyInfo);
    }

    if (conversationId) {
      await ChemicalCompatibilitySession.findOneAndUpdate(
        { conversationId },
        { $set: { reportHtml: fullReport } },
        { upsert: true }
      );
    }

    logger.info(`[ChemicalCompatibility/ai-analyze-matrix] Generated HTML analysis, ${matrixRows.length} rows`);
    return res.json({ analysis: fullReport });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-analyze-matrix] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── IA: Generar conclusión de gráfico del dashboard ──────────────────────────────
router.post('/ai-chart-conclusion', requireJwtAuth, async (req, res) => {
  try {
    const { conversationId, chartType, matrixRows, chartStats } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!conversationId || !chartType) {
      return res.status(400).json({ error: 'conversationId y chartType son requeridos.' });
    }

    const chartDescriptions = {
      clases_onu: 'distribución de productos químicos por Clase de Peligro ONU',
      pictogramas: 'frecuencia de pictogramas de seguridad SGA en el inventario',
      cumplimiento: 'conformidad de fichas de seguridad FDS y rotulado de recipientes',
      riesgo_compatibilidad: 'análisis del semáforo de compatibilidad de almacenamiento',
    };

    const inventorySummary = (matrixRows || []).map((r, i) =>
      `${r.nombre} | Clase ONU: ${r.clasificacion_onu} | FDS: ${r.tiene_fds} | Rotulado: ${r.tiene_rotulo}`
    ).join('\n').slice(0, 3000);

    const prompt = `Eres un Higienista Industrial experto en Seguridad y Salud en el Trabajo (Decreto 1496 de 2018, Resolución 773 de 2021 y NTC 3966).
Con base en los siguientes datos del gráfico de "${chartDescriptions[chartType] || chartType}" de una matriz de compatibilidad química:

ESTADÍSTICAS DEL GRÁFICO:
${JSON.stringify(chartStats || {}, null, 2)}

RESUMEN DEL INVENTARIO QUÍMICO:
${inventorySummary}

Redacta una conclusión técnica profesional de 3 a 5 oraciones que:
1. Resuma el hallazgo crítico de este gráfico.
2. Identifique la principal brecha de seguridad química detectada.
3. Proponga 1 acción correctiva concreta basada en el SGA (Decreto 1496/2018, Res. 773/2021 y NTC 3966).

Escribe en español técnico, sin viñetas, como párrafo fluido y conciso.`;

    const modelName = SGSST_FALLBACK_MODELS[0];
    const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
    const conclusion = result.response.text().trim();

    await ChemicalCompatibilitySession.findOneAndUpdate(
      { conversationId },
      { $set: { [`chartConclusions.${chartType}`]: conclusion } },
      { upsert: true, new: true }
    );

    logger.info(`[ChemicalCompatibility/ai-chart-conclusion] Conclusion saved for chart '${chartType}', conv=${conversationId}`);
    return res.json({ conclusion });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-chart-conclusion] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── IA: Parsear e importar filas de matriz química externa ──────────────────────────
router.post('/ai-parse-matrix', requireJwtAuth, async (req, res) => {
  try {
    const { rawRows } = req.body;
    const { userId } = await resolveUserAndCompany(req);

    if (!rawRows || !Array.isArray(rawRows)) {
      return res.status(400).json({ error: 'Se requiere una lista de filas en "rawRows".' });
    }

    if (rawRows.length === 0) {
      return res.json({ matrixRows: [] });
    }

    const cleanedRows = cleanRawRows(rawRows);

    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < cleanedRows.length; i += CHUNK_SIZE) {
      chunks.push(cleanedRows.slice(i, i + CHUNK_SIZE));
    }

    const modelName = req.body.modelName || SGSST_FALLBACK_MODELS[0];
    logger.info(`[ChemicalCompatibility/ai-parse-matrix] Processing ${cleanedRows.length} rows for user ${userId} in ${chunks.length} chunks (chunk size ${CHUNK_SIZE})`);

    const parsedRows = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];
      if (chunkIdx > 0) {
        // Pausa de 500ms para evitar saturación de tasa (concurrencia) en el API de Gemini
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      logger.info(`[ChemicalCompatibility/ai-parse-matrix] Processing chunk ${chunkIdx + 1}/${chunks.length} for user ${userId}`);

      const prompt = `Eres un procesador de datos experto en Higiene y Seguridad Química (Decreto 1496 de 2018, Res. 773 de 2021 y NTC 3966).
Mapea estas filas crudas (extraídas de un Excel) a un formato estándar de inventario químico SGA de acuerdo a la normatividad en Colombia.

FILAS CRUDAS:
${JSON.stringify(chunk, null, 2)}

FORMATO EXIGIDO PARA CADA ITEM EN EL ARREGLO JSON:
{
  "nombre": "<Nombre del producto químico, ej. Ácido Clorhídrico>",
  "fabricante": "<Fabricante/Proveedor o 'Desconocido'>",
  "estado_fisico": "<Líquido|Sólido|Gas>",
  "clasificacion_onu": "<Clase 1: Explosivos|Clase 2.1: Gases Inflamables|Clase 2.2: Gases No Inflamables ni Tóxicos|Clase 2.3: Gases Tóxicos|Clase 3: Líquidos Inflamables|Clase 4.1: Sólidos Inflamables|Clase 4.2: Sustancias de Combustión Espontánea|Clase 4.3: Desprenden gases inflamables con agua|Clase 5.1: Sustancias Comburentes|Clase 5.2: Peróxidos Orgánicos|Clase 6.1: Sustancias Tóxicas|Clase 8: Sustancias Corrosivas|Clase 9: Peligros Varios|No Peligroso>",
  "pictogramas_sga": [<arreglo conteniendo valores como: "inflamable", "corrosivo", "calavera", "peligro_salud", "signo_exclamacion", "medio_ambiente", "comburente", "explosivo", "gas_comprimido">],
  "cantidad_almacenada": "<Cantidad, ej. 50 Galones o N/A>",
  "ubicacion": "<Ubicación de almacenamiento, ej. Bodega Central o N/A>",
  "tiene_fds": "<Sí|No>",
  "tiene_rotulo": "<Sí|No>",
  "incompatibilidades": "<Principales incompatibilidades o reactividad>",
  "requisitos_almacenamiento": "<Requisitos de almacenamiento seguro>"
}

REGLAS EXTREMAS:
- Responde ÚNICAMENTE con un arreglo JSON válido conteniendo los objetos mapeados. NO incluyes markdown, código ni explicaciones.
- Si no encuentras un valor para algún campo, estima un valor adecuado según el nombre del producto o usa valores por defecto razonables en lugar de dejarlos vacíos.`;

      const result = await generateWithKeyRotation(modelName, userId, prompt, { useWebSearch: false });
      let text = result.response.text().trim();
      text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        logger.warn(`[ChemicalCompatibility/ai-parse-matrix] Direct JSON parse failed for chunk ${chunkIdx + 1}, attempting repair:`, err.message);
        const startIdx = text.indexOf('[');
        if (startIdx !== -1) {
          let arrayStr = text.slice(startIdx);
          const lastObjEnd = arrayStr.lastIndexOf('}');
          if (lastObjEnd !== -1) {
            try {
              parsed = JSON.parse(arrayStr.slice(0, lastObjEnd + 1) + ']');
            } catch (e2) {
              logger.error(`[ChemicalCompatibility/ai-parse-matrix] JSON repair failed in chunk ${chunkIdx + 1}:`, e2.message);
            }
          }
        }
      }

      if (parsed) {
        if (Array.isArray(parsed)) {
          parsedRows.push(...parsed);
        } else if (typeof parsed === 'object') {
          parsedRows.push(parsed);
        }
      }
    }

    // Agregar IDs únicos a los productos importados
    const finalizedRows = parsedRows.map(row => ({
      ...row,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      nombre: toSentenceCase(row.nombre),
      ubicacion: toSentenceCase(row.ubicacion)
    }));

    return res.json({ matrixRows: finalizedRows });
  } catch (error) {
    logger.error('[ChemicalCompatibility/ai-parse-matrix] Critical parser error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

router.lookupPubChemGHS = lookupPubChemGHS;
router.resolveUserAndCompany = resolveUserAndCompany;
router.getCompatibilityStatus = getCompatibilityStatus;

module.exports = router;
