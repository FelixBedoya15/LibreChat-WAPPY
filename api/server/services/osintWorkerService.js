let logger = console;
try {
  const cfg = require('~/config');
  if (cfg?.logger) logger = cfg.logger;
} catch (_) {}

const MINTRABAJO_BASE_URL = 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento';
const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
};

/**
 * Decodifica entidades HTML comunes y numéricas en textos extraídos de ASP.NET GridViews.
 */
function decodeHtmlEntities(str = '') {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae el valor de un input oculto de ASP.NET WebForms (__VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION).
 */
function extractHiddenInput(html = '', fieldName = '') {
  if (!html || !fieldName) return '';
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const byId = html.match(new RegExp(`id="${escaped}"[^>]*value="([^"]*)"`, 'i'));
  if (byId) return byId[1];
  const byName = html.match(new RegExp(`name="${escaped}"[^>]*value="([^"]*)"`, 'i'));
  if (byName) return byName[1];
  const valueFirst = html.match(new RegExp(`value="([^"]*)"[^>]*id="${escaped}"`, 'i'));
  return valueFirst ? valueFirst[1] : '';
}

/**
 * Combina cookies Set-Cookie de fetch en un encabezado Cookie unificado.
 */
function mergeCookies(res, existingCookieHeader = '') {
  const cookieMap = new Map();
  if (existingCookieHeader) {
    existingCookieHeader.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k) cookieMap.set(k, v);
      }
    });
  }

  let rawCookies = [];
  if (res?.headers) {
    if (typeof res.headers.getSetCookie === 'function') {
      rawCookies = res.headers.getSetCookie();
    } else {
      const sc = res.headers.get('set-cookie');
      if (sc) rawCookies = [sc];
    }
  }

  for (const raw of rawCookies) {
    if (!raw) continue;
    const firstPart = raw.split(';')[0];
    const idx = firstPart.indexOf('=');
    if (idx > 0) {
      const k = firstPart.slice(0, idx).trim();
      const v = firstPart.slice(idx + 1).trim();
      if (k) cookieMap.set(k, v);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Convierte fecha DD/MM/YYYY a ISO YYYY-MM-DD y calcula meses transcurridos.
 */
function parseMinTrabajoDate(fechaStr = '') {
  const clean = String(fechaStr || '').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (y && m && d) {
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      if (!isNaN(dateObj.getTime())) {
        const iso = dateObj.toISOString().split('T')[0];
        const diffMs = Date.now() - dateObj.getTime();
        const meses = Math.max(0, Number((diffMs / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1)));
        return {
          fechaFinISO: iso,
          mesesTranscurridos: meses,
          vigente: meses <= 18, // Res. 4272 de 2021 Art. 30
        };
      }
    }
  }
  return {
    fechaFinISO: clean,
    mesesTranscurridos: 999,
    vigente: false,
  };
}

/**
 * Extrae el titular y la lista de certificados desde el HTML de consulta_lista.aspx.
 */
function parseMinTrabajoListaHtml(htmlLista = '', fallbackDoc = '') {
  const extractLabel = (idSuffix) => {
    const m = htmlLista.match(new RegExp(`${idSuffix}"[^>]*>([^<]*)<`, 'i'));
    return m ? decodeHtmlEntities(m[1]) : '';
  };

  const pNombre = extractLabel('primer_nombreLabel_0');
  const sNombre = extractLabel('segundo_normbreLabel_0') || extractLabel('segundo_nombreLabel_0');
  const pApellido = extractLabel('primer_apellidoLabel_0');
  const sApellido = extractLabel('segundo_apellidoLabel_0');

  const titular = [pNombre, sNombre, pApellido, sApellido].filter(Boolean).join(' ').trim() || null;

  const historialCompleto = [];
  const trBlocks = htmlLista.split(/<tr[^>]*>/i);

  for (const block of trBlocks) {
    const trContent = block.split(/<\/tr>/i)[0] || '';
    if (!trContent.includes('__doPostBack')) continue;

    const tdMatches = Array.from(trContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
    if (tdMatches.length < 8) continue;

    const pbMatch = tdMatches[7][1].match(/__doPostBack\((?:&#39;|'|&apos;|")([^'"&]+)(?:&#39;|'|&apos;|")/i);
    if (!pbMatch) continue;

    const cleanCell = (idx) => decodeHtmlEntities(tdMatches[idx][1].replace(/<[^>]+>/g, ''));
    const programa = cleanCell(0);
    const nivel = cleanCell(1);
    const documento = cleanCell(2) || fallbackDoc;
    const fechaInicio = cleanCell(3);
    const fechaFin = cleanCell(4);
    const organizacion = cleanCell(5);
    const sede = cleanCell(6);
    const eventTarget = String(pbMatch[1] || '').trim();

    const { fechaFinISO, mesesTranscurridos, vigente } = parseMinTrabajoDate(fechaFin);

    historialCompleto.push({
      programa,
      nivel,
      documento,
      fechaInicio,
      fechaFin,
      fechaFinISO,
      organizacion,
      sede,
      eventTarget,
      mesesTranscurridos,
      vigente,
    });
  }

  historialCompleto.sort((a, b) => String(b.fechaFinISO).localeCompare(String(a.fechaFinISO)));

  return { titular, historialCompleto };
}

/**
 * Ejecuta la sesión inicial GET -> POST consulta_ext.aspx -> GET consulta_lista.aspx en MinTrabajo.
 */
async function executeMinTrabajoSession({ tipoDoc = 'CC', cedula = '' }) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();

  // 1. GET consulta_ext.aspx (timeout rápido de 2.5s para detectar geo-bloqueo en VPS y saltar al relay colombiano)
  const getRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_ext.aspx`, {
    headers: DEFAULT_HEADERS,
    signal: AbortSignal.timeout(2500),
  });
  let cookieHeader = mergeCookies(getRes);
  const htmlExt = await getRes.text();

  const viewState = extractHiddenInput(htmlExt, '__VIEWSTATE');
  const viewStateGenerator = extractHiddenInput(htmlExt, '__VIEWSTATEGENERATOR');
  const eventValidation = extractHiddenInput(htmlExt, '__EVENTVALIDATION');

  // 2. POST consulta_ext.aspx (redirect: 'manual')
  const form = new URLSearchParams({
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __VIEWSTATE: viewState,
    __VIEWSTATEGENERATOR: viewStateGenerator,
    __EVENTVALIDATION: eventValidation,
    'ctl00$contenido$tipo_documentoTextBox': cleanTipoDoc,
    'ctl00$contenido$valor_consulta': cleanCedula,
    'ctl00$contenido$consultar': 'Consultar',
  });

  const postRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_ext.aspx`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
      Referer: `${MINTRABAJO_BASE_URL}/consulta_ext.aspx`,
    },
    body: form.toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  });
  cookieHeader = mergeCookies(postRes, cookieHeader);

  // 3. GET consulta_lista.aspx
  const listaRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_lista.aspx`, {
    headers: {
      ...DEFAULT_HEADERS,
      Cookie: cookieHeader,
      Referer: `${MINTRABAJO_BASE_URL}/consulta_ext.aspx`,
    },
    signal: AbortSignal.timeout(15000),
  });
  cookieHeader = mergeCookies(listaRes, cookieHeader);
  const htmlLista = await listaRes.text();

  return { cookieHeader, htmlLista, cleanTipoDoc, cleanCedula };
}

/**
 * Descarga el binario PDF de una fila específica de consulta_lista.aspx.
 */
async function postDownloadPdfFromLista({ cookieHeader, htmlLista, eventTarget }) {
  const formPayload = {
    __EVENTTARGET: eventTarget,
    __EVENTARGUMENT: '',
    __VIEWSTATE: extractHiddenInput(htmlLista, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: extractHiddenInput(htmlLista, '__VIEWSTATEGENERATOR'),
  };
  const eventValidation = extractHiddenInput(htmlLista, '__EVENTVALIDATION');
  if (eventValidation) {
    formPayload.__EVENTVALIDATION = eventValidation;
  }

  const pdfForm = new URLSearchParams(formPayload);
  const pdfRes = await fetch(`${MINTRABAJO_BASE_URL}/consulta_lista.aspx`, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
      Referer: `${MINTRABAJO_BASE_URL}/consulta_lista.aspx`,
    },
    body: pdfForm.toString(),
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });

  const arrayBuffer = await pdfRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const headerStr = buffer.subarray(0, 5).toString('ascii');
  if (!headerStr.startsWith('%PDF')) {
    return null;
  }
  return buffer.toString('base64');
}

/**
 * Consulta Certificados de Trabajo en Alturas y Espacios Confinados en MinTrabajo
 * y descarga opcionalmente el PDF de la constancia más reciente en base64.
 */
async function consultarAlturasMinTrabajo({ tipoDoc = 'CC', cedula, includePdf = true } = {}) {
  const cleanCedula = String(cedula || '').trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();

  if (!cleanCedula) {
    return {
      encontrado: false,
      activoEnAlturas: false,
      activoEnConfinados: false,
      documento: '',
      tipoDoc: cleanTipoDoc,
      titular: null,
      ultimoCertificadoAlturas: null,
      ultimoCertificadoConfinados: null,
      pdfBase64: null,
      pdfFileName: null,
      historialCompleto: [],
    };
  }

  try {
    const { cookieHeader, htmlLista } = await executeMinTrabajoSession({
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
    });

    if (
      !htmlLista ||
      htmlLista.includes('No se encontraron resultados para la consulta realizada')
    ) {
      return {
        encontrado: false,
        activoEnAlturas: false,
        activoEnConfinados: false,
        documento: cleanCedula,
        tipoDoc: cleanTipoDoc,
        titular: null,
        ultimoCertificadoAlturas: null,
        ultimoCertificadoConfinados: null,
        pdfBase64: null,
        pdfFileName: null,
        historialCompleto: [],
      };
    }

    const { titular, historialCompleto } = parseMinTrabajoListaHtml(htmlLista, cleanCedula);

    if (historialCompleto.length === 0 && !titular) {
      return {
        encontrado: false,
        activoEnAlturas: false,
        activoEnConfinados: false,
        documento: cleanCedula,
        tipoDoc: cleanTipoDoc,
        titular: null,
        ultimoCertificadoAlturas: null,
        ultimoCertificadoConfinados: null,
        pdfBase64: null,
        pdfFileName: null,
        historialCompleto: [],
      };
    }

    const ultimoCertificadoAlturas =
      historialCompleto.find((c) => c.programa.toUpperCase().includes('ALTURAS')) || null;
    const ultimoCertificadoConfinados =
      historialCompleto.find((c) => c.programa.toUpperCase().includes('CONFINADOS')) || null;

    let pdfBase64 = null;
    let pdfFileName = null;

    if (includePdf && ultimoCertificadoAlturas?.eventTarget) {
      try {
        pdfBase64 = await postDownloadPdfFromLista({
          cookieHeader,
          htmlLista,
          eventTarget: ultimoCertificadoAlturas.eventTarget,
        });
        if (pdfBase64) {
          pdfFileName = `Constancia_Alturas_${cleanCedula}_${ultimoCertificadoAlturas.fechaFinISO}.pdf`;
        }
      } catch (pdfErr) {
        logger.warn(
          `[OSINT MinTrabajo] No se pudo descargar el PDF automático para ${cleanCedula}: ${pdfErr.message}`
        );
      }
    }

    return {
      encontrado: true,
      activoEnAlturas: Boolean(ultimoCertificadoAlturas?.vigente),
      activoEnConfinados: Boolean(ultimoCertificadoConfinados?.vigente),
      documento: cleanCedula,
      tipoDoc: cleanTipoDoc,
      titular,
      ultimoCertificadoAlturas,
      ultimoCertificadoConfinados,
      pdfBase64,
      pdfFileName,
      historialCompleto,
    };
  } catch (error) {
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      try {
        logger.info(`[OSINT MinTrabajo] Reenviando consulta de cédula ${cleanCedula} por túnel IP Colombia (wappy-push-daemon)...`);
        const relayed = await global.dispatchOsintViaAntigravityDaemon({
          action: 'query',
          tipoDoc: cleanTipoDoc,
          cedula: cleanCedula,
          includePdf,
        });
        if (relayed && typeof relayed === 'object') {
          return relayed;
        }
      } catch (relayErr) {
        logger.warn(`[OSINT MinTrabajo] Falló relay por daemon para ${cleanCedula}: ${relayErr.message}`);
      }
    }
    logger.warn(`[OSINT MinTrabajo] Error consultando cédula ${cleanCedula}: ${error.message}`);
    return {
      encontrado: false,
      activoEnAlturas: false,
      activoEnConfinados: false,
      documento: cleanCedula,
      tipoDoc: cleanTipoDoc,
      titular: null,
      ultimoCertificadoAlturas: null,
      ultimoCertificadoConfinados: null,
      pdfBase64: null,
      pdfFileName: null,
      historialCompleto: [],
      error: error.message,
    };
  }
}

/**
 * Descarga bajo demanda el PDF de cualquier constancia de MinTrabajo (por eventTarget o la más reciente disponible).
 */
async function descargarPdfConstanciaMinTrabajo({ tipoDoc = 'CC', cedula, eventTarget } = {}) {
  const cleanCedula = String(cedula || '').trim();
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();

  if (!cleanCedula) {
    return { ok: false, error: 'El número de documento (cédula) es obligatorio.' };
  }

  try {
    const { cookieHeader, htmlLista } = await executeMinTrabajoSession({
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
    });

    if (
      !htmlLista ||
      htmlLista.includes('No se encontraron resultados para la consulta realizada')
    ) {
      return {
        ok: false,
        error: 'No se encontraron certificados registrados en MinTrabajo para este documento.',
      };
    }

    const { historialCompleto } = parseMinTrabajoListaHtml(htmlLista, cleanCedula);
    if (historialCompleto.length === 0) {
      return {
        ok: false,
        error: 'No se encontraron filas de certificados disponibles para descargar.',
      };
    }

    const targetCert = eventTarget
      ? historialCompleto.find((c) => c.eventTarget === eventTarget) || {
          eventTarget,
          fechaFinISO: new Date().toISOString().split('T')[0],
          programa: 'ALTURAS',
        }
      : historialCompleto[0];

    const pdfBase64 = await postDownloadPdfFromLista({
      cookieHeader,
      htmlLista,
      eventTarget: targetCert.eventTarget,
    });

    if (!pdfBase64) {
      return {
        ok: false,
        error: 'El portal de MinTrabajo no devolvió un archivo PDF válido.',
      };
    }

    const tipoTag = String(targetCert.programa || '')
      .toUpperCase()
      .includes('CONFINADOS')
      ? 'Confinados'
      : 'Alturas';
    const fileName = `Constancia_${tipoTag}_${cleanCedula}_${targetCert.fechaFinISO || 'oficial'}.pdf`;

    return {
      ok: true,
      pdfBase64,
      fileName,
      contentType: 'application/pdf',
    };
  } catch (error) {
    if (typeof global.dispatchOsintViaAntigravityDaemon === 'function') {
      try {
        logger.info(`[OSINT MinTrabajo PDF] Reenviando descarga de constancia ${cleanCedula} por túnel IP Colombia (wappy-push-daemon)...`);
        const relayed = await global.dispatchOsintViaAntigravityDaemon({
          action: 'pdf',
          tipoDoc: cleanTipoDoc,
          cedula: cleanCedula,
          eventTarget,
        });
        if (relayed && typeof relayed === 'object' && relayed.ok) {
          return relayed;
        }
      } catch (relayErr) {
        logger.warn(`[OSINT MinTrabajo PDF] Falló relay por daemon para ${cleanCedula}: ${relayErr.message}`);
      }
    }
    logger.error(`[OSINT MinTrabajo PDF] Error descargando constancia ${cleanCedula}:`, error);
    return {
      ok: false,
      error: `Error al descargar constancia desde MinTrabajo: ${error.message}`,
    };
  }
}

/**
 * Consulta procesos judiciales en la API REST v2 oficial de la Rama Judicial por Nombre Completo.
 */
async function consultarRamaJudicialPorNombre(nombreCompleto = '') {
  const cleanNombre = String(nombreCompleto || '').trim();
  if (!cleanNombre || cleanNombre.length < 4) {
    return {
      ok: false,
      consultado: false,
      nombreConsultado: cleanNombre,
      totalProcesos: 0,
      procesos: [],
    };
  }

  const url = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=${encodeURIComponent(cleanNombre)}&tipoPersona=nat&SoloActivos=false&codificacionDespacho=&pagina=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        ok: false,
        consultado: true,
        status: res.status,
        nombreConsultado: cleanNombre,
        totalProcesos: 0,
        procesos: [],
        aviso: `El servidor de la Rama Judicial respondió con estado HTTP ${res.status}.`,
      };
    }

    const data = await res.json();
    const rawProcesos = Array.isArray(data?.procesos) ? data.procesos : [];

    return {
      ok: true,
      consultado: true,
      nombreConsultado: cleanNombre,
      totalProcesos: data?.paginacion?.cantidadRegistros ?? rawProcesos.length,
      procesos: rawProcesos.slice(0, 25).map((p) => ({
        idProceso: p.idProceso,
        llaveProceso: p.llaveProceso || '',
        fechaProceso: p.fechaProceso || '',
        fechaUltimaActuacion: p.fechaUltimaActuacion || '',
        despacho: p.despacho || '',
        departamento: p.departamento || '',
        sujetosProcesales: p.sujetosProcesales || '',
        esPrivado: Boolean(p.esPrivado),
      })),
    };
  } catch (error) {
    logger.warn(`[OSINT Rama Judicial] Aviso consultando "${cleanNombre}": ${error.message}`);
    return {
      ok: false,
      consultado: false,
      nombreConsultado: cleanNombre,
      totalProcesos: 0,
      procesos: [],
      aviso: `Consulta directa no disponible temporalmente (${error.message}). Puede verificar manualmente en el portal oficial.`,
    };
  }
}

/**
 * Retorna el catálogo estructurado de las 26 fuentes oficiales de verificación 360° en Colombia.
 */
function obtenerCatalogoPortales360({ tipoDoc = 'CC', cedula = '', placa = '', nombre = '' } = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanPlaca = String(placa || '').trim().toUpperCase();
  const cleanNombre = String(nombre || '').trim();

  const altoRiesgo = [
    {
      id: 'mintrabajo_alturas_confinados',
      categoria: 'altoRiesgo',
      entidad: 'Ministerio del Trabajo',
      titulo: 'Centros de Entrenamiento — Alturas y Espacios Confinados',
      descripcion:
        'Consulta nacional de certificados de Trabajo en Alturas (Res. 4272/2021) y Espacios Confinados (Res. 0491/2020) con descarga de PDF oficial.',
      url: 'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'sena_sofia_plus',
      categoria: 'altoRiesgo',
      entidad: 'SENA — Sofia Plus',
      titulo: 'Certificados Digitales SENA (50h SG-SST y Competencias)',
      descripcion:
        'Descarga de certificados de cursos complementarios (50h/20h SG-SST, alturas, manipulación de alimentos) y títulos tecnológicos.',
      url: 'https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'B',
    },
  ];

  const seguridadSocialArl = [
    {
      id: 'ruaf_sispro',
      categoria: 'seguridadSocialArl',
      entidad: 'Ministerio de Salud — SISPRO',
      titulo: 'RUAF — Afiliaciones a EPS, ARL, AFP y Caja de Compensación',
      descripcion:
        'Reporte maestro 360° de Seguridad Social que revela en cuál EPS, ARL, Fondo de Pensión y Caja está activo el trabajador.',
      url: 'https://ruaf.sispro.gov.co/Default.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + Fecha de Expedición`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'adres_bdua',
      categoria: 'seguridadSocialArl',
      entidad: 'ADRES — BDUA',
      titulo: 'Consulta de Afiliación a EPS (Base de Datos Única de Afiliados)',
      descripcion:
        'Verifica estado activo/suspendido en salud (EPS), régimen contributivo o subsidiado y tipo de cotizante.',
      url: 'https://www.adres.gov.co/consulte-su-eps',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'arl_sura',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL SURA',
      titulo: 'Verificación de Afiliación y Certificado ARL SURA',
      descripcion:
        'Consulta en línea de cobertura activa en ARL SURA y generación de certificado / carné de afiliación en PDF.',
      url: 'https://www.arlsura.com/afiliacion/verificar.php',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_positiva',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Positiva',
      titulo: 'Certificado de Afiliación Individual ARL Positiva',
      descripcion:
        'Descarga de certificado de afiliación individual y carné de riesgos laborales en Positiva Compañía de Seguros.',
      url: 'https://www.positivaenlinea.gov.co/nuevo/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'arl_colmena',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Colmena Seguros',
      titulo: 'Consulta de Afiliación y Escarapela ARL Colmena',
      descripcion:
        'Impresión de certificado individual de cobertura en riesgos laborales y carné ARL Colmena.',
      url: 'https://afiliacionarl.colmenaseguros.com/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + Fecha de Nacimiento`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_axa_colpatria',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL AXA Colpatria',
      titulo: 'Certificados de Afiliación ARL AXA Colpatria',
      descripcion:
        'Generación en línea de certificado individual de afiliación a riesgos laborales en AXA Colpatria.',
      url: 'https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'arl_bolivar',
      categoria: 'seguridadSocialArl',
      entidad: 'ARL Seguros Bolívar',
      titulo: 'Certificado de Cobertura ARL Seguros Bolívar',
      descripcion:
        'Consulta y descarga de constancia de afiliación activa en ARL Seguros Bolívar.',
      url: 'https://www.segurosbolivar.com/arl',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'colpensiones_rpm',
      categoria: 'seguridadSocialArl',
      entidad: 'Colpensiones',
      titulo: 'Certificado de Afiliación / No Pensión en Colpensiones',
      descripcion:
        'Verifica afiliación o estado pensional en el Régimen de Prima Media con Prestación Definida.',
      url: 'https://sede.colpensiones.gov.co/tramite/updInfo/72/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
  ];

  const seguridadVialPesv = [
    {
      id: 'simit_fcm',
      categoria: 'seguridadVialPesv',
      entidad: 'Federación Colombiana de Municipios — SIMIT',
      titulo: 'SIMIT — Comparendos, Fotomultas y Acuerdos de Pago',
      descripcion:
        'Auditoría nacional de infracciones de tránsito por Cédula del conductor o Placa del vehículo (Paso 10 PESV Res. 20223040040595).',
      url: 'https://www.fcm.org.co/simit/#/home-public',
      requiere: cleanPlaca
        ? `Cédula ${cleanCedula || '[Cédula]'} o Placa ${cleanPlaca}`
        : `Cédula ${cleanCedula || '[Cédula]'} o Placa`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'runt_persona',
      categoria: 'seguridadVialPesv',
      entidad: 'RUNT — Concesión RUNT 2.0',
      titulo: 'RUNT por Documento — Vigencia y Categoría de Licencia de Conducción',
      descripcion:
        'Verifica estado activo de licencia de conducción, categorías autorizadas (A2, B1, C1, C2, C3), vencimientos y restricciones.',
      url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaPersona',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'runt_vehiculo',
      categoria: 'seguridadVialPesv',
      entidad: 'RUNT — Concesión RUNT 2.0',
      titulo: 'RUNT por Placa — Vigencia de SOAT y Revisión Técnico-Mecánica',
      descripcion:
        'Audita póliza SOAT vigente, certificado de Revisión Técnico-Mecánica (RTM) y características técnicas del vehículo.',
      url: 'https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo',
      requiere: `Placa ${cleanPlaca || '[Placa]'} + ${cleanTipoDoc} ${cleanCedula || '[Cédula Propietario]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
  ];

  const matriculasProfesionales = [
    {
      id: 'conte_electricistas',
      categoria: 'matriculasProfesionales',
      entidad: 'CONTE',
      titulo: 'Matrícula Profesional de Técnicos Electricistas (RETIE)',
      descripcion:
        'Verifica vigencia de matrícula profesional CONTE (clases TE-1 a TE-6) para trabajos con riesgo eléctrico.',
      url: 'https://www.conte.org.co/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'conaltel_tecnologos',
      categoria: 'matriculasProfesionales',
      entidad: 'CONALTEL',
      titulo: 'Matrícula Profesional de Tecnólogos en Electricidad y Afines',
      descripcion:
        'Certificado de vigencia y antecedentes disciplinarios para tecnólogos electricistas y electromecánicos.',
      url: 'https://conaltel.org/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'copnia_ingenieria',
      categoria: 'matriculasProfesionales',
      entidad: 'COPNIA',
      titulo: 'Certificado de Vigencia de Matrícula de Ingeniería y Afines',
      descripcion:
        'Valida tarjeta profesional y certificado de vigencia sin sanciones para ingenieros, tecnólogos y profesionales afines.',
      url: 'https://tramites.copnia.gov.co/Copnia_Microsite/certificadosVigencia.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'rethus_salud_sst',
      categoria: 'matriculasProfesionales',
      entidad: 'Ministerio de Salud — ReTHUS',
      titulo: 'Registro Único Nacional del Talento Humano en Salud',
      descripcion:
        'Verifica inscripción legal de médicos laborales, enfermeros, psicólogos especialistas en SST y profesionales de la salud.',
      url: 'https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'colpsic_psicologos',
      categoria: 'matriculasProfesionales',
      entidad: 'COLPSIC',
      titulo: 'Colegio Colombiano de Psicólogos — Tarjeta Profesional',
      descripcion:
        'Verifica idoneidad legal de psicólogos (requisito obligatorio para aplicación de Batería de Riesgo Psicosocial Res. 2764/2022).',
      url: 'https://www.colpsic.org.co/',
      requiere: `Cédula ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
  ];

  const antecedentesDisciplinarios = [
    {
      id: 'policia_antecedentes_judiciales',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional de Colombia',
      titulo: 'Consulta de Antecedentes Judiciales',
      descripcion:
        'Certifica si el ciudadano registra o no asuntos pendientes con las autoridades judiciales penales.',
      url: 'https://antecedentes.policia.gov.co:7005/WebJudicial/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'policia_rnmc_convivencia',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional — RNMC',
      titulo: 'Registro Nacional de Medidas Correctivas (Ley 1801 de 2016)',
      descripcion:
        'Verifica comparendos del Código de Seguridad y Convivencia Ciudadana (mora > 6 meses genera inhabilidad de contratación).',
      url: 'https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'policia_inhabilidades_delitos_sexuales',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Policía Nacional — Ley 1918 de 2018',
      titulo: 'Consulta de Inhabilidades por Delitos Sexuales contra Menores',
      descripcion:
        'Requisito obligatorio para cargos con trato directo con menores de edad (transporte escolar, educación, salud, recreación).',
      url: 'https://inhabilidades.policia.gov.co:8080/',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'} + NIT Empresa`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'procuraduria_siri',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Procuraduría General de la Nación',
      titulo: 'Certificado de Antecedentes Disciplinarios (SIRI)',
      descripcion:
        'Consulta y descarga en PDF del certificado ordinario o especial de antecedentes disciplinarios e inhabilidades.',
      url: 'https://apps.procuraduria.gov.co/webcert/Certificado.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'contraloria_sibor',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Contraloría General de la República',
      titulo: 'Certificado de Antecedentes Fiscales (SIBOR)',
      descripcion:
        'Descarga del boletín de responsables fiscales en PDF para personas naturales o jurídicas.',
      url: 'https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: true,
      tipoMotor: 'C',
    },
    {
      id: 'rama_judicial_procesos',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Rama Judicial — Consejo Superior de la Judicatura',
      titulo: 'Consulta Nacional Unificada de Procesos Judiciales',
      descripcion:
        'Historial de demandas laborales, civiles, penales o ejecutivas donde el trabajador figure como sujeto procesal.',
      url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index',
      requiere: cleanNombre ? `Nombre: ${cleanNombre}` : 'Nombre completo o Razón Social',
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
    {
      id: 'personeria_bogota',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'Personería de Bogotá D.C.',
      titulo: 'Certificado de Antecedentes Disciplinarios Distritales',
      descripcion:
        'Expedición inmediata en PDF de antecedentes disciplinarios distritales para contratistas y trabajadores.',
      url: 'https://www.personeriabogota.gov.co/al-servicio-de-la-ciudad/expedicion-de-antecedentes',
      requiere: `${cleanTipoDoc} ${cleanCedula || '[Cédula]'}`,
      tieneCaptcha: false,
      tipoMotor: 'B',
    },
    {
      id: 'ofac_sarlaft_sagrilaft',
      categoria: 'antecedentesDisciplinarios',
      entidad: 'U.S. Treasury — OFAC Sanctions List',
      titulo: 'Listas Restrictivas LAFT / SARLAFT / SAGRILAFT (OFAC)',
      descripcion:
        'Debida diligencia de contrapartes (trabajadores, proveedores y contratistas) frente a listas internacionales vinculantes.',
      url: 'https://sanctionssearch.ofac.treas.gov/',
      requiere: `${cleanCedula || '[Cédula]'} / ${cleanNombre || '[Nombre Completo]'}`,
      tieneCaptcha: false,
      tipoMotor: 'A',
    },
  ];

  return {
    altoRiesgo,
    seguridadSocialArl,
    seguridadVialPesv,
    matriculasProfesionales,
    antecedentesDisciplinarios,
  };
}

/**
 * Ejecuta la Investigación 360° de un Trabajador o Conductor en Colombia:
 * 1) MinTrabajo (Alturas y Confinados + PDF en Base64)
 * 2) Rama Judicial API v2 (por nombre suministrado o descubierto en MinTrabajo)
 * 3) Catálogo completo de las 26 fuentes oficiales parametrizado con los datos del trabajador.
 */
async function investigarTrabajador360({
  tipoDoc = 'CC',
  cedula = '',
  placa = '',
  nombre = '',
  includePdf = true,
} = {}) {
  const cleanTipoDoc = String(tipoDoc || 'CC').trim().toUpperCase();
  const cleanCedula = String(cedula || '').trim();
  const cleanPlaca = String(placa || '').trim().toUpperCase();
  const cleanNombre = String(nombre || '').trim();

  let minTrabajo = {
    encontrado: false,
    activoEnAlturas: false,
    activoEnConfinados: false,
    documento: cleanCedula,
    tipoDoc: cleanTipoDoc,
    titular: null,
    ultimoCertificadoAlturas: null,
    ultimoCertificadoConfinados: null,
    pdfBase64: null,
    pdfFileName: null,
    historialCompleto: [],
  };

  if (cleanCedula) {
    minTrabajo = await consultarAlturasMinTrabajo({
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
      includePdf: Boolean(includePdf),
    });
  }

  const nombreEfectivo = cleanNombre || minTrabajo?.titular || '';

  let ramaJudicial = {
    ok: false,
    consultado: false,
    nombreConsultado: nombreEfectivo,
    totalProcesos: 0,
    procesos: [],
  };

  if (nombreEfectivo) {
    ramaJudicial = await consultarRamaJudicialPorNombre(nombreEfectivo);
  }

  const portalesOficiales = obtenerCatalogoPortales360({
    tipoDoc: cleanTipoDoc,
    cedula: cleanCedula,
    placa: cleanPlaca,
    nombre: nombreEfectivo,
  });

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    input: {
      tipoDoc: cleanTipoDoc,
      cedula: cleanCedula,
      placa: cleanPlaca,
      nombre: nombreEfectivo,
    },
    minTrabajo,
    ramaJudicial,
    portalesOficiales,
  };
}

module.exports = {
  consultarAlturasMinTrabajo,
  descargarPdfConstanciaMinTrabajo,
  consultarRamaJudicialPorNombre,
  obtenerCatalogoPortales360,
  investigarTrabajador360,
};
