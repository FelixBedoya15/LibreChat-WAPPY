'use strict';

/**
 * WAPPY Editorial HTML v2 — Sistema Unificado de Formateo Editorial para el Blog
 *
 * Garantiza que todo artículo generado por IA, importado vía MCP, redactado por agentes
 * o guardado desde el editor quede con diseño editorial premium, limpio en modo claro
 * y oscuro, semánticamente balanceado y sin bloques de texto plano.
 */

const WAPPY_EDITORIAL_VERSION = 'v2';

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title']);

const EDITORIAL_STYLES = {
  articleWrapper: 'line-height: 1.75;',
  bylinePill:
    'display:inline-flex;align-items:center;gap:0.5rem;margin:0 0 1.1rem 0;padding:0.4rem 0.9rem;border-radius:999px;border:1px solid rgba(13,148,136,0.28);background:rgba(13,148,136,0.08);font-size:0.88rem;font-weight:600;line-height:1.4;',
  kicker: 'font-size:1.12rem;font-weight:700;color:#0d9488;margin:0 0 1.15rem 0;',
  leadCard:
    'margin:0 0 1.85rem 0;padding:1.25rem 1.45rem;border-radius:16px;border:1px solid rgba(13,148,136,0.24);border-left:5px solid #0d9488;background:linear-gradient(135deg, rgba(13,148,136,0.11) 0%, rgba(199,243,3,0.06) 100%);',
  leadBadge:
    'display:inline-flex;align-items:center;gap:0.35rem;margin-bottom:0.65rem;padding:0.22rem 0.65rem;border-radius:999px;background:rgba(13,148,136,0.16);color:#0d9488;font-size:0.75rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;',
  h2: 'margin-top:2.25rem;margin-bottom:0.95rem;padding:0.45rem 0 0.5rem 0.85rem;border-left:4px solid #0d9488;border-bottom:1px solid rgba(13,148,136,0.22);font-weight:800;line-height:1.3;',
  h3: 'margin-top:1.5rem;margin-bottom:0.6rem;font-weight:700;color:#0d9488;',
  listCard:
    'margin:1.15rem 0 1.5rem 0;padding:1.1rem 1.35rem;border-radius:14px;border:1px solid rgba(148,163,184,0.24);background:rgba(148,163,184,0.06);',
  listRoot: 'margin:0;padding-left:1.35rem;line-height:1.7;',
  listNested: 'margin:0.4rem 0 0.25rem 0;padding-left:1.3rem;line-height:1.65;',
  listItem: 'margin:0.35rem 0;',
  tableWrap:
    'overflow-x:auto;-webkit-overflow-scrolling:touch;margin:1.65rem 0;border-radius:14px;border:1px solid rgba(13,148,136,0.28);background:rgba(148,163,184,0.03);',
  table: 'width:100%;border-collapse:collapse;margin:0;font-size:0.94rem;line-height:1.55;',
  thead: 'background:rgba(13,148,136,0.18);',
  th: 'padding:10px 14px;text-align:left;font-weight:700;border-bottom:2px solid rgba(13,148,136,0.32);',
  thStandalone:
    'padding:10px 14px;text-align:left;font-weight:700;border-bottom:2px solid rgba(13,148,136,0.32);background:rgba(13,148,136,0.18);',
  td: 'padding:10px 14px;border-bottom:1px solid rgba(148,163,184,0.22);vertical-align:top;',
  trEven: 'background:rgba(148,163,184,0.05);',
  calloutTeal:
    'margin:1.45rem 0;padding:1.05rem 1.35rem;border-radius:14px;border:1px solid rgba(13,148,136,0.24);border-left:4px solid #0d9488;background:rgba(13,148,136,0.09);font-style:normal;line-height:1.68;',
  calloutAmber:
    'margin:1.45rem 0;padding:1.05rem 1.35rem;border-radius:14px;border:1px solid rgba(245,158,11,0.26);border-left:4px solid #f59e0b;background:rgba(245,158,11,0.09);font-style:normal;line-height:1.68;',
  ctaCard:
    'margin-top:2.25rem;padding:1.45rem 1.6rem;border-radius:18px;border:1px solid rgba(13,148,136,0.38);background:linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(199,243,3,0.08) 100%);display:flex;flex-direction:column;gap:0.65rem;',
  ctaPill:
    'display:inline-flex;align-items:center;gap:0.35rem;align-self:flex-start;padding:0.28rem 0.78rem;border-radius:999px;background:#c7f303;color:#0e1300;font-size:0.74rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;',
  link: 'color:#0d9488;text-decoration:underline;text-underline-offset:3px;font-weight:600;',
  img: 'max-width:100%;height:auto;border-radius:12px;',
};

const WAPPY_BLOG_EDITORIAL_PROMPT = `Actúa como el Director Editorial y Especialista Senior en Seguridad y Salud en el Trabajo (SG-SST), Normatividad Colombiana, Seguridad Vial (PESV) e Inteligencia Artificial de WAPPY IA.
Tu tarea es redactar un artículo de blog con diseño editorial premium **WAPPY Editorial HTML v2**, optimizado para lectura ejecutiva, SEO y motores de respuesta IA (AEO).

REGLAS CRÍTICAS Y ABSOLUTAS DE FORMATO:
1. Devuelve ÚNICA Y EXCLUSIVAMENTE código HTML limpio y válido.
   - CERO Markdown (nada de #, ##, **, *, listas con guiones ni bloques \`\`\`html).
   - NO incluyas <!DOCTYPE>, <html>, <head>, <body> ni etiquetas <style> o <script>.
   - NO incluyas <h1> duplicado del título principal, porque el visor BlogPostViewer ya renderiza el título del artículo en la cabecera.
2. COMPATIBILIDAD ESTRICTA MODO CLARO Y MODO OSCURO:
   - NUNCA uses colores fijos oscuros para texto (prohibido color: #000, #111, #222, #333, #444, #555, black, rgb(66,66,66) o similares).
   - NUNCA uses fondos blancos o grises opacos fijos (prohibido background: #fff, white, rgb(255,255,255), #f8fafc).
   - Usa SIEMPRE herencia de color del tema (omite color o usa color: inherit) y fondos translúcidos rgba(...).
   - Usa únicamente los acentos oficiales de marca: Turquesa SST (#0d9488), Ámbar alerta (#f59e0b) y píldora Verde Lima Eléctrico (#c7f303 con texto #0e1300).

ESTRUCTURA EDITORIAL OBLIGATORIA (envuelta en <div class="wappy-editorial-article" data-wappy-editorial="v2" style="line-height: 1.75;">...</div>):
1. **Tarjeta Superior de Resumen Ejecutivo (Bloque AEO directo de 2-3 oraciones):**
   <div class="wappy-lead-card" style="${EDITORIAL_STYLES.leadCard}">
     <div class="wappy-lead-badge" style="${EDITORIAL_STYLES.leadBadge}">⚡ RESUMEN EJECUTIVO</div>
     <p style="margin:0;line-height:1.7;">Respuesta directa, concreta y accionable sobre el tema central del artículo.</p>
   </div>

2. **Secciones Principales con Encabezados <h2> Numerados o Temáticos:**
   <h2 style="${EDITORIAL_STYLES.h2}">1. Título claro de la sección</h2>
   Usa subtítulos <h3> cuando necesites desglosar subtemas:
   <h3 style="${EDITORIAL_STYLES.h3}">Subtema específico</h3>
   Redacta párrafos ágiles de máximo 3-4 líneas con <p> y resalta conceptos clave con <strong>. Evita bloques largos de texto plano.

3. **Tarjetas de Listas Clave (class="wappy-list-card"):**
   Siempre que enumeres requisitos, pasos, beneficios o evidencias, envuelve el <ul> o <ol> de primer nivel en:
   <div class="wappy-list-card" style="${EDITORIAL_STYLES.listCard}">
     <ul style="${EDITORIAL_STYLES.listRoot}">
       <li style="${EDITORIAL_STYLES.listItem}"><strong>Punto clave:</strong> explicación clara y práctica.</li>
     </ul>
   </div>

4. **Bloques de Alerta / Idea Clave (<blockquote class="wappy-callout">):**
   Incluye al menos 1 o 2 callouts estratégicos:
   - Para consejos clave o buena práctica SST usa borde turquesa (#0d9488):
     <blockquote class="wappy-callout" style="${EDITORIAL_STYLES.calloutTeal}"><strong>💡 Idea clave:</strong> ...</blockquote>
   - Para advertencias legales, plazos o riesgos críticos usa borde ámbar (#f59e0b):
     <blockquote class="wappy-callout" style="${EDITORIAL_STYLES.calloutAmber}"><strong>⚠️ Alerta normativa:</strong> ...</blockquote>

5. **Tablas Comparativas o de Cronograma Responsivas (class="wappy-table-wrap"):**
   Cuando el tema incluya plazos, comparativas, roles, criterios normativos o planes de acción, incluye al menos una tabla envuelta en:
   <div class="wappy-table-wrap table-responsive custom-table-scroll" style="${EDITORIAL_STYLES.tableWrap}">
     <table style="${EDITORIAL_STYLES.table}">
       <thead style="${EDITORIAL_STYLES.thead}">
         <tr><th style="${EDITORIAL_STYLES.th}">Columna 1</th><th style="${EDITORIAL_STYLES.th}">Columna 2</th></tr>
       </thead>
       <tbody>
         <tr><td style="${EDITORIAL_STYLES.td}">Dato 1</td><td style="${EDITORIAL_STYLES.td}">Dato 2</td></tr>
       </tbody>
     </table>
   </div>

6. **Tarjeta Final CTA WAPPY IA + Instagram (class="wappy-cta-card"):**
   Cierra siempre con una invitación práctica contextualizada al tema del artículo y el botón oficial para seguir a WAPPY IA en Instagram:
   <div class="wappy-cta-card" style="${EDITORIAL_STYLES.ctaCard}">
     <span style="${EDITORIAL_STYLES.ctaPill}">⚡ WAPPY IA · COPILOTO SG-SST</span>
     <p style="margin:0;font-weight:700;font-size:1.05rem;line-height:1.45;">Título breve orientado a la acción con WAPPY IA</p>
     <p style="margin:0;opacity:0.9;line-height:1.65;">Cómo aplicar este contenido hoy mismo usando los agentes, matrices y documentos en vivo de WAPPY IA.</p>
     <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-top:0.35rem;">
       <a href="https://www.instagram.com/wappy_ia/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.55rem 1.15rem;border-radius:999px;background:linear-gradient(135deg,#f59e0b 0%,#ec4899 52%,#8b5cf6 100%);color:#ffffff;font-weight:800;font-size:0.86rem;text-decoration:none;box-shadow:0 6px 18px rgba(236,72,153,0.28);">📸 Síguenos en Instagram @wappy_ia →</a>
     </div>
   </div>

Empieza directamente con <div class="wappy-editorial-article" data-wappy-editorial="v2" style="line-height: 1.75;"> y termina con </div>.`;

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de texto, entidades y CSS
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtmlAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  const named = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    mdash: '—',
    ndash: '–',
    hellip: '…',
    laquo: '«',
    raquo: '»',
    bull: '•',
    middot: '·',
    copy: '©',
    reg: '®',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    ntilde: 'ñ',
    uuml: 'ü',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    Ntilde: 'Ñ',
    Uuml: 'Ü',
    iquest: '¿',
    iexcl: '¡',
  };
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (match, name) => (Object.prototype.hasOwnProperty.call(named, name) ? named[name] : match));
}

function normalizeForComparison(text) {
  return decodeHtmlEntities(String(text || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRedundantTitle(candidateText, mainTitle) {
  const normCandidate = normalizeForComparison(candidateText);
  const normTitle = normalizeForComparison(mainTitle);
  if (!normCandidate || !normTitle) return false;
  if (normCandidate === normTitle) return true;
  if (normTitle.length >= 8 && normCandidate.length >= 8) {
    if (normTitle.includes(normCandidate) || normCandidate.includes(normTitle)) {
      const minLen = Math.min(normTitle.length, normCandidate.length);
      const maxLen = Math.max(normTitle.length, normCandidate.length);
      if (minLen / maxLen >= 0.55) {
        return true;
      }
    }
  }
  const tokensA = new Set(normCandidate.split(' ').filter((w) => w.length >= 3));
  const tokensB = new Set(normTitle.split(' ').filter((w) => w.length >= 3));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let shared = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) shared += 1;
  }
  const overlapMin = shared / Math.min(tokensA.size, tokensB.size);
  const jaccard = shared / (tokensA.size + tokensB.size - shared);
  return overlapMin >= 0.72 || jaccard >= 0.6;
}

function isBylineText(rawText) {
  const text = decodeHtmlEntities(String(rawText || ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (!text || text.length < 6 || text.length > 190) return false;
  if (/^(?:autor(?:a)?\s*:|escrito\s+por\s+|redactado\s+por\s+)/i.test(text)) {
    return true;
  }
  // Evitar falsos positivos con conectores en español ("Por eso...", "Por otra parte...")
  if (
    /^por\s+(?:eso|ello|esto|otra\s+parte|lo\s+tanto|consiguiente|ende|ultimo|último|fin|ejemplo|supuesto|fortuna|desgracia|su\s+parte|otro\s+lado|el\s+contrario|medio|favor|que|qué|cierto|primera|segunda|esta|este|estas|estos|la|el|los|las|un|una|unos|unas|mas|más|menos|cada|todo|toda|todos|todas|si|sí|no|qué)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  // Ej.: "Por Mauricio Posada — Especialista SST" o "Por Equipo Editorial WAPPY"
  return /^[Pp][Oo][Rr]\s+(?:(?:[Dd]r\.?|[Dd]ra\.?|[Ii]ng\.?|[Ll]ic\.?|[Mm]g\.?|[Ee]sp\.?)\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ.]+(?:\s+(?:de|del|la|y|[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ.]+)){0,6}(?:\s*[—–\-|·•,:]|$)/.test(
    text,
  );
}

function isSafeUrl(url) {
  const cleaned = String(url || '').trim();
  if (!cleaned) return false;
  if (/^(https?:|mailto:|\/|#)/i.test(cleaned)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversión de Markdown / Texto plano a HTML semántico limpio
// ─────────────────────────────────────────────────────────────────────────────

function convertInlineMarkdown(text) {
  if (!text || typeof text !== 'string') return '';

  // Proteger código inline `...` primero
  const codeSlots = [];
  let result = text.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = codeSlots.length;
    codeSlots.push(
      `<code style="padding:0.12rem 0.38rem;border-radius:6px;background:rgba(148,163,184,0.16);font-size:0.9em;">${escapeHtmlText(code)}</code>`,
    );
    return `\uE000CODE${idx}\uE001`;
  });

  // Imágenes ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, url) => {
    if (!isSafeUrl(url)) return escapeHtmlText(alt);
    return `<img src="${escapeHtmlAttr(url)}" alt="${escapeHtmlAttr(alt || 'Imagen del artículo')}" style="${EDITORIAL_STYLES.img}" />`;
  });

  // Enlaces [label](url)
  result = result.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
    if (!isSafeUrl(url)) return label;
    const isExternal = /^https?:\/\//i.test(url);
    const extra = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtmlAttr(url)}"${extra}>${label}</a>`;
  });

  // Negrita + cursiva ***texto***
  result = result.replace(/\*\*\*([^\s*](?:[^*]*?[^\s*])?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Negrita **texto** o __texto__
  result = result.replace(/\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(^|[\s(])__([^\s_](?:[^_]*?[^\s_])?)__(?=$|[\s.,;:!?)\]])/g, '$1<strong>$2</strong>');
  // Cursiva *texto*
  result = result.replace(/(^|[\s(>])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?=$|[\s.,;:!?)\]<])/g, '$1<em>$2</em>');

  // Restaurar código inline
  result = result.replace(/\uE000CODE(\d+)\uE001/g, (_, idx) => codeSlots[Number(idx)] || '');
  return result;
}

function isMarkdownTableSeparator(line) {
  if (!line || !line.includes('-')) return false;
  const trimmed = line.trim();
  return /^\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?$/.test(trimmed) || /^\|\s*:?-{2,}:?\s*\|$/.test(trimmed);
}

function splitMarkdownTableRow(line) {
  let trimmed = String(line || '').trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) trimmed = trimmed.slice(0, -1);
  const cells = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (ch === '\\' && trimmed[i + 1] === '|') {
      current += '|';
      i += 1;
    } else if (ch === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseMarkdownListBlock(lines, startIndex) {
  const listRegex = /^([ \t]*)([-*+•]|(?:\d+[.)]))\s+(.+)$/;
  const rootItems = [];
  const stack = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(listRegex);
    if (!match) {
      // Continuación indentada de un item existente (sin nuevo marcador)
      if (/^[ \t]{2,}\S/.test(line) && stack.length > 0) {
        const lastList = stack[stack.length - 1];
        const lastItem = lastList.items[lastList.items.length - 1];
        if (lastItem) {
          lastItem.text += ` ${line.trim()}`;
          i += 1;
          continue;
        }
      }
      break;
    }

    const indent = match[1].replace(/\t/g, '  ').length;
    const marker = match[2];
    const listTag = /^\d+[.)]$/.test(marker) ? 'ol' : 'ul';
    const text = match[3].trim();
    const itemNode = { text, children: [] };

    while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      const listObj = { tag: listTag, indent, items: [itemNode] };
      rootItems.push(listObj);
      stack.push(listObj);
    } else {
      const top = stack[stack.length - 1];
      if (indent > top.indent) {
        const parentItem = top.items[top.items.length - 1];
        const subList = { tag: listTag, indent, items: [itemNode] };
        if (parentItem) {
          parentItem.children.push(subList);
        } else {
          rootItems.push(subList);
        }
        stack.push(subList);
      } else if (top.tag !== listTag) {
        stack.pop();
        const siblingList = { tag: listTag, indent, items: [itemNode] };
        if (stack.length > 0) {
          const parentItem = stack[stack.length - 1].items[stack[stack.length - 1].items.length - 1];
          if (parentItem) {
            parentItem.children.push(siblingList);
          } else {
            rootItems.push(siblingList);
          }
        } else {
          rootItems.push(siblingList);
        }
        stack.push(siblingList);
      } else {
        top.items.push(itemNode);
      }
    }
    i += 1;
  }

  const renderList = (listObj) => {
    const itemsHtml = listObj.items
      .map((item) => {
        const nestedHtml = item.children.map(renderList).join('');
        return `<li>${convertInlineMarkdown(item.text)}${nestedHtml}</li>`;
      })
      .join('');
    return `<${listObj.tag}>${itemsHtml}</${listObj.tag}>`;
  };

  return {
    html: rootItems.map(renderList).join('\n'),
    nextIndex: i,
  };
}

function convertMarkdownToHtml(rawText) {
  const normalized = String(rawText || '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const hasBlankLines = /\n\s*\n/.test(normalized);
  const blocks = [];
  let i = 0;

  const isSpecialStart = (idx) => {
    const l = lines[idx];
    if (l === undefined) return false;
    const t = l.trim();
    if (!t) return true;
    if (/^```/.test(t)) return true;
    if (/^#{1,6}\s+/.test(t)) return true;
    if (/^(?:[-*_]\s*){3,}$/.test(t)) return true;
    if (/^>\s?/.test(t)) return true;
    if (/^[ \t]*(?:[-*+•]|\d+[.)])\s+/.test(l)) return true;
    if (t.includes('|') && idx + 1 < lines.length && isMarkdownTableSeparator(lines[idx + 1])) return true;
    return false;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // 1. Bloque de código cercado ```
    if (/^```/.test(trimmed)) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // consumir cierre ```
      blocks.push(
        `<pre style="overflow-x:auto;padding:1rem 1.2rem;border-radius:12px;border:1px solid rgba(148,163,184,0.24);background:rgba(148,163,184,0.08);margin:1.25rem 0;"><code>${escapeHtmlText(codeLines.join('\n'))}</code></pre>`,
      );
      continue;
    }

    // 2. Encabezados # .. ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      blocks.push(`<h${level}>${convertInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // 3. Línea horizontal
    if (/^(?:[-*_]\s*){3,}$/.test(trimmed)) {
      blocks.push('<hr style="border:none;border-top:1px solid rgba(148,163,184,0.28);margin:1.75rem 0;" />');
      i += 1;
      continue;
    }

    // 4. Tabla Markdown pipe | a | b |
    if (trimmed.includes('|') && i + 1 < lines.length && isMarkdownTableSeparator(lines[i + 1])) {
      const headerCells = splitMarkdownTableRow(trimmed);
      i += 2; // saltar header y separador
      const bodyRows = [];
      while (i < lines.length) {
        const rowTrimmed = lines[i].trim();
        if (!rowTrimmed || !rowTrimmed.includes('|')) break;
        if (/^#{1,6}\s+/.test(rowTrimmed) || /^>\s?/.test(rowTrimmed)) break;
        bodyRows.push(splitMarkdownTableRow(rowTrimmed));
        i += 1;
      }
      const theadHtml = `<thead><tr>${headerCells
        .map((c) => `<th>${convertInlineMarkdown(c)}</th>`)
        .join('')}</tr></thead>`;
      const tbodyHtml =
        bodyRows.length > 0
          ? `<tbody>${bodyRows
              .map(
                (row) =>
                  `<tr>${row.map((c) => `<td>${convertInlineMarkdown(c)}</td>`).join('')}</tr>`,
              )
              .join('')}</tbody>`
          : '';
      blocks.push(`<table>${theadHtml}${tbodyHtml}</table>`);
      continue;
    }

    // 5. Blockquote >
    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const quoteParagraphs = quoteLines
        .join('\n')
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p style="margin:0.25rem 0;">${convertInlineMarkdown(p.replace(/\n/g, '<br />'))}</p>`)
        .join('');
      blocks.push(`<blockquote>${quoteParagraphs || convertInlineMarkdown(quoteLines.join(' '))}</blockquote>`);
      continue;
    }

    // 6. Listas ordenadas / desordenadas (con soporte a listas anidadas)
    if (/^[ \t]*(?:[-*+•]|\d+[.)])\s+/.test(line)) {
      const { html, nextIndex } = parseMarkdownListBlock(lines, i);
      blocks.push(html);
      i = nextIndex;
      continue;
    }

    // 7. Párrafo narrativo
    if (!hasBlankLines) {
      blocks.push(`<p>${convertInlineMarkdown(trimmed)}</p>`);
      i += 1;
      continue;
    }

    const paraLines = [];
    while (i < lines.length && !isSpecialStart(i)) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p>${convertInlineMarkdown(paraLines.join('<br />'))}</p>`);
    }
  }

  return blocks.join('\n');
}

function hasBlockHtmlTags(text) {
  return /<(?:p|div|h[1-6]|ul|ol|li|table|thead|tbody|tr|td|th|blockquote|section|article|figure|hr|pre)\b/i.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser HTML liviano (sin dependencias) basado en pila — garantiza HTML balanceado
// ─────────────────────────────────────────────────────────────────────────────

function parseAttributes(attrSource) {
  const attrs = {};
  if (!attrSource) return attrs;
  let i = 0;
  const len = attrSource.length;

  while (i < len) {
    while (i < len && /[\s/]/.test(attrSource[i])) i += 1;
    if (i >= len) break;

    const nameStart = i;
    while (i < len && !/[\s=/>]/.test(attrSource[i])) i += 1;
    const rawName = attrSource.slice(nameStart, i);
    if (!rawName) {
      i += 1;
      continue;
    }
    const name = rawName.toLowerCase();

    while (i < len && /\s/.test(attrSource[i])) i += 1;
    if (attrSource[i] === '=') {
      i += 1;
      while (i < len && /\s/.test(attrSource[i])) i += 1;
      let val = '';
      if (attrSource[i] === '"' || attrSource[i] === "'") {
        const quote = attrSource[i];
        i += 1;
        const valStart = i;
        while (i < len && attrSource[i] !== quote) i += 1;
        val = attrSource.slice(valStart, i);
        if (i < len && attrSource[i] === quote) i += 1;
      } else {
        const valStart = i;
        while (i < len && !/[\s>]/.test(attrSource[i])) i += 1;
        val = attrSource.slice(valStart, i);
      }
      attrs[name] = decodeHtmlEntities(val);
    } else {
      attrs[name] = '';
    }
  }
  return attrs;
}

function findTagClose(html, startIndex) {
  let quote = null;
  for (let i = startIndex; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }
  return -1;
}

function parseHtmlFragment(html) {
  const root = { type: 'root', tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const src = String(html || '');
  const len = src.length;
  let i = 0;

  const currentParent = () => stack[stack.length - 1];

  const pushText = (text) => {
    if (!text) return;
    const parent = currentParent();
    const prev = parent.children[parent.children.length - 1];
    if (prev && prev.type === 'text') {
      prev.value += text;
    } else {
      parent.children.push({ type: 'text', value: text });
    }
  };

  const closeTagUpTo = (tagName, stopTags = null) => {
    for (let idx = stack.length - 1; idx >= 1; idx -= 1) {
      const t = stack[idx].tag;
      if (t === tagName) {
        stack.length = idx;
        return true;
      }
      if (stopTags && stopTags.has(t)) {
        return false;
      }
    }
    return false;
  };

  const applyImplicitCloses = (openingTag) => {
    const topTag = currentParent().tag;
    if (BLOCK_TAGS.has(openingTag) && topTag === 'p') {
      stack.pop();
    }
    if (openingTag === 'li') {
      closeTagUpTo('li', new Set(['ul', 'ol']));
    } else if (openingTag === 'td' || openingTag === 'th') {
      if (!closeTagUpTo('td', new Set(['tr', 'table']))) {
        closeTagUpTo('th', new Set(['tr', 'table']));
      }
    } else if (openingTag === 'tr') {
      closeTagUpTo('tr', new Set(['thead', 'tbody', 'tfoot', 'table']));
    } else if (openingTag === 'thead' || openingTag === 'tbody' || openingTag === 'tfoot') {
      closeTagUpTo('thead', new Set(['table']));
      closeTagUpTo('tbody', new Set(['table']));
      closeTagUpTo('tfoot', new Set(['table']));
    }
  };

  while (i < len) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      pushText(src.slice(i));
      break;
    }

    if (lt > i) {
      pushText(src.slice(i, lt));
    }

    // Comentarios HTML <!-- ... -->
    if (src.startsWith('<!--', lt)) {
      const commentEnd = src.indexOf('-->', lt + 4);
      if (commentEnd === -1) {
        break;
      }
      i = commentEnd + 3;
      continue;
    }

    // Declaraciones <!DOCTYPE ...> o CDATA
    if (src[lt + 1] === '!') {
      const closePos = findTagClose(src, lt + 2);
      if (closePos === -1) {
        pushText(src.slice(lt));
        break;
      }
      i = closePos + 1;
      continue;
    }

    // Etiqueta de cierre </tag>
    if (src[lt + 1] === '/') {
      const closePos = findTagClose(src, lt + 2);
      if (closePos === -1) {
        pushText(src.slice(lt));
        break;
      }
      const rawClose = src.slice(lt + 2, closePos).trim();
      const closeTag = rawClose.split(/\s+/)[0].toLowerCase();
      if (closeTag && !VOID_TAGS.has(closeTag)) {
        closeTagUpTo(closeTag);
      }
      i = closePos + 1;
      continue;
    }

    // Si `<` no inicia un nombre de etiqueta válido (ej. "x < 10"), tratar como texto
    if (!/[a-zA-Z]/.test(src[lt + 1] || '')) {
      pushText('<');
      i = lt + 1;
      continue;
    }

    const closePos = findTagClose(src, lt + 1);
    if (closePos === -1) {
      pushText(src.slice(lt));
      break;
    }

    const inner = src.slice(lt + 1, closePos);
    const selfClosing = /\/\s*$/.test(inner);
    const cleanInner = selfClosing ? inner.replace(/\/\s*$/, '') : inner;
    const tagMatch = cleanInner.match(/^([a-zA-Z][a-zA-Z0-9:-]*)([\s\S]*)$/);
    if (!tagMatch) {
      pushText(src.slice(lt, closePos + 1));
      i = closePos + 1;
      continue;
    }

    const tag = tagMatch[1].toLowerCase();
    const attrs = parseAttributes(tagMatch[2]);

    applyImplicitCloses(tag);

    const node = { type: 'element', tag, attrs, children: [] };
    currentParent().children.push(node);

    // Contenido raw (<style>, <script>, etc.)
    if (RAW_TEXT_TAGS.has(tag) && !selfClosing) {
      const endRe = new RegExp(`</${tag}\\s*>`, 'i');
      const rest = src.slice(closePos + 1);
      const endMatch = endRe.exec(rest);
      if (endMatch) {
        const rawBody = rest.slice(0, endMatch.index);
        if (rawBody) node.children.push({ type: 'text', value: rawBody });
        i = closePos + 1 + endMatch.index + endMatch[0].length;
      } else {
        i = len;
      }
      continue;
    }

    if (!VOID_TAGS.has(tag) && !selfClosing) {
      stack.push(node);
    }

    i = closePos + 1;
  }

  return root;
}

function serializeAttrs(attrs) {
  if (!attrs) return '';
  const parts = [];
  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null) continue;
    if (key === 'style' && !String(val).trim()) continue;
    if (key === 'class' && !String(val).trim()) continue;
    parts.push(`${key}="${escapeHtmlAttr(val)}"`);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function serializeTextSafe(value) {
  // Evitar doble escape de entidades válidas existentes, pero escapar `<` y `>` literales
  return String(value ?? '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeNode(node) {
  if (!node) return '';
  if (node.type === 'text') {
    return serializeTextSafe(node.value);
  }
  if (node.type === 'root') {
    return node.children.map(serializeNode).join('');
  }
  if (node.type === 'element') {
    const attrsStr = serializeAttrs(node.attrs);
    if (VOID_TAGS.has(node.tag)) {
      return `<${node.tag}${attrsStr} />`;
    }
    const inner = node.children.map(serializeNode).join('');
    return `<${node.tag}${attrsStr}>${inner}</${node.tag}>`;
  }
  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de manipulación del AST
// ─────────────────────────────────────────────────────────────────────────────

function createElement(tag, attrs = {}, children = []) {
  return { type: 'element', tag, attrs: { ...attrs }, children: [...children] };
}

function createText(value) {
  return { type: 'text', value: String(value ?? '') };
}

function getClasses(node) {
  if (!node || node.type !== 'element' || !node.attrs?.class) return [];
  return String(node.attrs.class)
    .split(/\s+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function hasClass(node, className) {
  return getClasses(node).includes(className);
}

function addClasses(node, ...classNames) {
  if (!node || node.type !== 'element') return;
  const set = new Set(getClasses(node));
  for (const cn of classNames) {
    if (cn) set.add(cn);
  }
  node.attrs.class = Array.from(set).join(' ');
}

function getTextContent(node) {
  if (!node) return '';
  if (node.type === 'text') return decodeHtmlEntities(node.value);
  if (node.type === 'element' && node.tag === 'br') return ' ';
  if (!Array.isArray(node.children)) return '';
  return node.children.map(getTextContent).join('');
}

function hasMediaOrVisualElement(node) {
  if (!node || node.type !== 'element') return false;
  if (['img', 'iframe', 'svg', 'video', 'audio', 'hr', 'canvas'].includes(node.tag)) return true;
  return (node.children || []).some(hasMediaOrVisualElement);
}

function isVisuallyEmptyNode(node) {
  if (!node) return true;
  if (node.type === 'text') {
    return !decodeHtmlEntities(node.value).replace(/\u00a0/g, ' ').trim();
  }
  if (node.type === 'element') {
    if (hasMediaOrVisualElement(node)) return false;
    const text = getTextContent(node).replace(/\u00a0/g, ' ').trim();
    return text.length === 0;
  }
  return true;
}

function findFirstByPredicate(node, predicate) {
  if (!node) return null;
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    const found = findFirstByPredicate(child, predicate);
    if (found) return found;
  }
  return null;
}

function parseStyleMap(styleStr) {
  const map = new Map();
  if (!styleStr || typeof styleStr !== 'string') return map;
  const parts = styleStr.split(';');
  for (const raw of parts) {
    const colon = raw.indexOf(':');
    if (colon === -1) continue;
    const prop = raw.slice(0, colon).trim().toLowerCase();
    const val = raw.slice(colon + 1).trim();
    if (prop && val) {
      map.set(prop, val);
    }
  }
  return map;
}

function serializeStyleMap(map) {
  const out = [];
  for (const [k, v] of map.entries()) {
    if (k && v) out.push(`${k}:${v}`);
  }
  return out.length > 0 ? `${out.join(';')};` : '';
}

function mergeStyles(existingStyle, requiredStyle) {
  const base = parseStyleMap(existingStyle);
  const req = parseStyleMap(requiredStyle);
  for (const [k, v] of req.entries()) {
    base.set(k, v);
  }
  return serializeStyleMap(base);
}

// ─────────────────────────────────────────────────────────────────────────────
// Saneamiento de estilos inline incompatibles con Modo Oscuro
// ─────────────────────────────────────────────────────────────────────────────

function parseCssColorToRgb(rawValue) {
  const val = String(rawValue || '')
    .replace(/!important/gi, '')
    .trim()
    .toLowerCase();
  if (!val) return null;

  const namedColors = {
    black: [0, 0, 0, 1],
    white: [255, 255, 255, 1],
    dimgray: [105, 105, 105, 1],
    dimgrey: [105, 105, 105, 1],
    gray: [128, 128, 128, 1],
    grey: [128, 128, 128, 1],
    darkgray: [169, 169, 169, 1],
    darkslategray: [47, 79, 79, 1],
    windowtext: [0, 0, 0, 1],
    whitesmoke: [245, 245, 245, 1],
    snow: [255, 250, 250, 1],
    ivory: [255, 255, 240, 1],
    ghostwhite: [248, 248, 255, 1],
    aliceblue: [240, 248, 255, 1],
    floralwhite: [255, 250, 240, 1],
    gainsboro: [220, 220, 220, 1],
    lightgray: [211, 211, 211, 1],
    lightgrey: [211, 211, 211, 1],
  };
  if (Object.prototype.hasOwnProperty.call(namedColors, val)) {
    return namedColors[val];
  }

  const hex3 = val.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const h = hex3[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16), 1];
  }

  const hex6 = val.match(/^#([0-9a-f]{6})$/i);
  if (hex6) {
    const h = hex6[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }

  const rgbMatch = val.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/,
  );
  if (rgbMatch) {
    let alpha = 1;
    if (rgbMatch[4] !== undefined) {
      alpha = rgbMatch[4].endsWith('%') ? parseFloat(rgbMatch[4]) / 100 : parseFloat(rgbMatch[4]);
    }
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]), Number.isFinite(alpha) ? alpha : 1];
  }

  return null;
}

function isBrokenDarkTextColor(val, hasBrightBrandBg) {
  if (hasBrightBrandBg) return false;
  const clean = String(val || '')
    .replace(/!important/gi, '')
    .trim()
    .toLowerCase();
  if (!clean) return false;
  if (clean === 'inherit' || clean === 'currentcolor') return false;
  if (/^(?:black|windowtext|initial|unset)$/i.test(clean)) return true;

  const rgb = parseCssColorToRgb(clean);
  if (!rgb) return false;
  const [r, g, b, a] = rgb;
  if (a < 0.25) return false;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const spread = max - min;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  // Cualquier color muy oscuro (incluye #000-#555, azul marino #003366/#1a237e, verde oscuro) ilegible en modo oscuro
  if (lum < 88) return true;
  // Cualquier gris neutro oscuro o medio (ej. rgb(66,66,66), #4b5563, #666, #64748b)
  if (spread <= 35 && lum <= 145) return true;
  if (max <= 105 && spread <= 45) return true;
  return false;
}

function isBrokenLightBackground(val) {
  const clean = String(val || '')
    .replace(/!important/gi, '')
    .trim()
    .toLowerCase();
  if (!clean) return false;
  if (/rgba\(/i.test(clean) || /gradient\(/i.test(clean)) return false;
  if (/#c7f303|rgb\(\s*199\s*[,\s]\s*243\s*[,\s]\s*3\s*\)/i.test(clean)) return false;
  if (/^(?:white|transparent|initial|unset)\b/i.test(clean)) return true;

  let rgb = parseCssColorToRgb(clean);
  if (!rgb) {
    // Soportar shorthand CSS como `background: #f8f9fa none repeat` o `background: rgb(255,255,255) no-repeat`
    const tokenMatch = clean.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|\b(?:white|whitesmoke|snow|ivory|ghostwhite|aliceblue|floralwhite|gainsboro|lightgray|lightgrey)\b)/i);
    if (tokenMatch) {
      rgb = parseCssColorToRgb(tokenMatch[1]);
    }
  }
  if (!rgb) return false;
  const [r, g, b, a] = rgb;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // Cualquier fondo opaco claro o pastel (#fff, #f8fafc, #f0f9ff, #fff3cd, #fef3c7, #e0f2fe) que rompe modo oscuro
  if (a >= 0.85 && lum >= 190) return true;
  return false;
}

function sanitizeInlineStyle(styleStr, tagName = '') {
  if (!styleStr || typeof styleStr !== 'string') return '';
  const map = parseStyleMap(styleStr);
  const isImage = tagName === 'img' || tagName === 'svg' || tagName === 'video';

  const bgVal = map.get('background') || map.get('background-color') || '';
  const hasBrightBrandBg = /#c7f303|rgb\(\s*199\s*[,\s]\s*243\s*[,\s]\s*3\s*\)/i.test(bgVal);

  for (const [prop, val] of Array.from(map.entries())) {
    const cleanVal = val.replace(/!important/gi, '').trim();
    if (prop.startsWith('mso-')) {
      map.delete(prop);
      continue;
    }
    if (prop === 'color' && isBrokenDarkTextColor(val, hasBrightBrandBg)) {
      map.delete(prop);
      continue;
    }
    if ((prop === 'background' || prop === 'background-color') && isBrokenLightBackground(val)) {
      map.delete(prop);
      continue;
    }
    if (prop === 'font-family') {
      map.delete(prop);
      continue;
    }
    if (!isImage && prop === 'max-width' && /\d+(?:\.\d+)?(?:px|pt|cm|mm|in)\b/i.test(cleanVal)) {
      map.delete(prop);
      continue;
    }
    if (!isImage && tagName !== 'table' && prop === 'width' && /\d+(?:\.\d+)?(?:px|pt|cm|mm|in)\b/i.test(cleanVal)) {
      map.delete(prop);
      continue;
    }
    if (prop === 'font-size' && /^\d+(?:\.\d+)?pt$/i.test(cleanVal)) {
      map.delete(prop);
      continue;
    }
    if (prop === 'white-space' && /^pre-wrap$/i.test(cleanVal)) {
      map.delete(prop);
      continue;
    }
  }

  return serializeStyleMap(map);
}

function sanitizeTreeStylesAndNoise(node, insideCode = false) {
  if (!node || !Array.isArray(node.children)) return;

  const nextChildren = [];
  for (const child of node.children) {
    if (child.type === 'element') {
      if (child.tag === 'script' || child.tag === 'style' || child.tag === 'meta' || child.tag === 'link') {
        continue;
      }

      const isCode = insideCode || child.tag === 'code' || child.tag === 'pre';

      if (child.attrs && child.attrs.style) {
        const cleaned = sanitizeInlineStyle(child.attrs.style, child.tag);
        if (cleaned) {
          child.attrs.style = cleaned;
        } else {
          delete child.attrs.style;
        }
      }

      // Eliminar atributos obsoletos de presentación Word/HTML4
      if (child.attrs) {
        delete child.attrs.bgcolor;
        delete child.attrs.face;
      }

      sanitizeTreeStylesAndNoise(child, isCode);

      // Si es un <span> o <font> sin atributos útiles tras limpiar estilos rotos, desenvolver sus hijos
      if ((child.tag === 'span' || child.tag === 'font') && Object.keys(child.attrs || {}).length === 0) {
        for (const grandChild of child.children) {
          nextChildren.push(grandChild);
        }
        continue;
      }

      // Convertir <b> -> <strong> y <i> -> <em> solo si no es ícono
      if (child.tag === 'b' && Object.keys(child.attrs || {}).length === 0) {
        child.tag = 'strong';
      }

      nextChildren.push(child);
    } else if (child.type === 'text') {
      if (!insideCode && /\*\*[^\s*](?:[^*\n]*?[^\s*])?\*\*/.test(child.value)) {
        // Convertir negritas Markdown residuales dentro de nodos de texto sin alterar etiquetas vecinas
        const parts = child.value.split(/(\*\*[^\s*](?:[^*\n]*?[^\s*])?\*\*)/g);
        for (const part of parts) {
          if (!part) continue;
          const boldMatch = part.match(/^\*\*([^\s*](?:[^*\n]*?[^\s*])?)\*\*$/);
          if (boldMatch) {
            nextChildren.push(createElement('strong', {}, [createText(boldMatch[1])]));
          } else {
            nextChildren.push(createText(part));
          }
        }
      } else {
        nextChildren.push(child);
      }
    }
  }

  node.children = nextChildren;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transformaciones editoriales WAPPY v2 sobre el AST
// ─────────────────────────────────────────────────────────────────────────────

function unwrapRedundantRootContainers(root) {
  let guard = 0;
  while (guard < 5) {
    guard += 1;
    const meaningful = root.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
    if (meaningful.length !== 1) break;
    const only = meaningful[0];
    if (only.type !== 'element') break;

    const isEditorialWrapper =
      hasClass(only, 'wappy-editorial-article') || only.attrs?.['data-wappy-editorial'] !== undefined;
    const isGenericContainer =
      ['div', 'article', 'main', 'section'].includes(only.tag) &&
      !hasClass(only, 'wappy-lead-card') &&
      !hasClass(only, 'wappy-list-card') &&
      !hasClass(only, 'wappy-table-wrap') &&
      !hasClass(only, 'wappy-cta-card') &&
      !hasClass(only, 'wappy-byline-pill');

    if (isEditorialWrapper || isGenericContainer) {
      root.children = only.children;
    } else {
      break;
    }
  }
}

function pruneEmptyBlocksRecursive(node) {
  if (!node || !Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    if (child.type === 'element') {
      pruneEmptyBlocksRecursive(child);
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(child.tag)) {
        if (isVisuallyEmptyNode(child)) continue;
      }
    }
    next.push(child);
  }
  node.children = next;
}

function pruneEmptyTopLevelBlocks(root) {
  pruneEmptyBlocksRecursive(root);
  root.children = root.children.filter((node) => {
    if (node.type === 'text') {
      return Boolean(decodeHtmlEntities(node.value).replace(/\u00a0/g, ' ').trim());
    }
    return true;
  });
}

function hasAnyBlockDescendant(node) {
  if (!node || !Array.isArray(node.children)) return false;
  for (const child of node.children) {
    if (child.type === 'element') {
      if (BLOCK_TAGS.has(child.tag) || child.tag === 'figure') return true;
      if (hasAnyBlockDescendant(child)) return true;
    }
  }
  return false;
}

function isProtectedWappyContainer(node) {
  if (!node || node.type !== 'element') return false;
  return (
    hasClass(node, 'wappy-lead-card') ||
    hasClass(node, 'wappy-lead-badge') ||
    hasClass(node, 'wappy-list-card') ||
    hasClass(node, 'wappy-table-wrap') ||
    hasClass(node, 'wappy-cta-card') ||
    hasClass(node, 'wappy-byline-pill') ||
    hasClass(node, 'table-responsive') ||
    hasClass(node, 'table-container') ||
    hasClass(node, 'table-wrapper')
  );
}

function flattenGenericDivWrappers(root) {
  // Si existen <div> contenedores genéricos sin estilos visuales propios (border/background)
  // que solo envuelven bloques hijos (p, h1, h2, ul, table, div), levantar sus hijos al nivel raíz
  let changed = true;
  let guard = 0;
  while (changed && guard < 4) {
    changed = false;
    guard += 1;
    const next = [];
    for (const child of root.children) {
      if (
        child.type === 'element' &&
        child.tag === 'div' &&
        !isProtectedWappyContainer(child) &&
        hasAnyBlockDescendant(child)
      ) {
        const st = String(child.attrs?.style || '');
        const hasVisualCardStyle = /(?:border|background|box-shadow)/i.test(st);
        if (!hasVisualCardStyle) {
          next.push(...child.children);
          changed = true;
          continue;
        }
      }
      next.push(child);
    }
    root.children = next;
  }
}

function normalizeContentEditableDivs(root) {
  // Convierte <div> planos de primer nivel con texto/<span> directo (ej. Post #23 de editor contentEditable)
  // en párrafos <p> semánticos para que Resumen Ejecutivo, autoría y tipografía los reconozcan limpiamente.
  for (const child of root.children) {
    if (
      child.type === 'element' &&
      child.tag === 'div' &&
      !isProtectedWappyContainer(child) &&
      !hasAnyBlockDescendant(child) &&
      !isVisuallyEmptyNode(child)
    ) {
      child.tag = 'p';
      if (child.attrs && child.attrs.style) {
        const cleaned = sanitizeInlineStyle(child.attrs.style, 'p');
        if (cleaned) child.attrs.style = cleaned;
        else delete child.attrs.style;
      }
    }
  }
}

function normalizeInlineNodesAtTopLevel(root) {
  // Si quedaron nodos de texto sueltos a nivel raíz, envolverlos en <p>
  const result = [];
  let inlineBuffer = [];
  const flushBuffer = () => {
    if (inlineBuffer.length === 0) return;
    const hasContent = inlineBuffer.some((n) => !isVisuallyEmptyNode(n));
    if (hasContent) {
      result.push(createElement('p', {}, inlineBuffer));
    }
    inlineBuffer = [];
  };

  for (const child of root.children) {
    if (child.type === 'element' && (BLOCK_TAGS.has(child.tag) || child.tag === 'figure')) {
      flushBuffer();
      result.push(child);
    } else {
      inlineBuffer.push(child);
    }
  }
  flushBuffer();
  root.children = result;
}

const MAX_H1_HEADING_CHARS = 180;

function processH1Elements(root, mainTitle) {
  let handledLeadingH1 = false;
  const nextChildren = [];

  for (let i = 0; i < root.children.length; i += 1) {
    const node = root.children[i];
    if (node.type === 'element' && node.tag === 'h1') {
      const h1Text = getTextContent(node).replace(/\u00a0/g, ' ').trim();
      if (!h1Text) {
        // Eliminar <h1> vacío (ej. <h1><br></h1>)
        continue;
      }

      // Caso real Post #13: párrafo narrativo largo (>180 chars) metido accidentalmente en <h1> -> convertir a <p>
      if (h1Text.length > MAX_H1_HEADING_CHARS) {
        node.tag = 'p';
        delete node.attrs.class;
        if (node.attrs.style) {
          const cleaned = sanitizeInlineStyle(node.attrs.style, 'p');
          if (cleaned) node.attrs.style = cleaned;
          else delete node.attrs.style;
        }
        nextChildren.push(node);
        continue;
      }

      const isNearStart = nextChildren.length <= 2 && !handledLeadingH1;
      if (isNearStart) {
        handledLeadingH1 = true;
        if (mainTitle && isRedundantTitle(h1Text, mainTitle)) {
          // Eliminar primer <h1> redundante con el título principal
          continue;
        }
        // Si el <h1> trae un subtítulo distinto al título principal (<=180 chars), elevarlo a kicker editorial
        node.tag = 'p';
        node.attrs = {
          class: 'wappy-kicker',
          style: EDITORIAL_STYLES.kicker,
        };
        nextChildren.push(node);
        continue;
      }

      // Cualquier <h1> posterior (<=180 chars) en el cuerpo pasa a <h2> para evitar duplicados SEO/accesibilidad
      node.tag = 'h2';
      nextChildren.push(node);
      continue;
    }
    nextChildren.push(node);
  }

  root.children = nextChildren;

  // Asegurar que tampoco queden <h1> vacíos, largos o duplicados anidados en contenedores internos
  const cleanNestedH1 = (container) => {
    if (!container || !Array.isArray(container.children)) return;
    const cleaned = [];
    for (const child of container.children) {
      if (child.type === 'element') {
        if (child.tag === 'h1') {
          const text = getTextContent(child).replace(/\u00a0/g, ' ').trim();
          if (!text) continue;
          if (text.length > MAX_H1_HEADING_CHARS) {
            child.tag = 'p';
            delete child.attrs.class;
          } else if (mainTitle && isRedundantTitle(text, mainTitle)) {
            continue;
          } else {
            child.tag = 'h2';
          }
        }
        cleanNestedH1(child);
      }
      cleaned.push(child);
    }
    container.children = cleaned;
  };
  cleanNestedH1(root);
}

function buildLeadBadgeNode() {
  return createElement(
    'div',
    {
      class: 'wappy-lead-badge',
      style: EDITORIAL_STYLES.leadBadge,
    },
    [createText('⚡ RESUMEN EJECUTIVO')],
  );
}

function buildBylineNode(children) {
  return createElement(
    'div',
    {
      class: 'wappy-byline-pill',
      style: EDITORIAL_STYLES.bylinePill,
    },
    [
      createElement('span', { 'aria-hidden': 'true' }, [createText('✍️')]),
      createElement('span', {}, children),
    ],
  );
}

function applyBylineAndLeadCard(root) {
  // 1. Normalizar o detectar línea de autoría inicial ("Por Mauricio Posada — ...")
  for (let i = 0; i < Math.min(root.children.length, 3); i += 1) {
    const node = root.children[i];
    if (node.type !== 'element') continue;
    if (hasClass(node, 'wappy-byline-pill')) {
      node.attrs.style = EDITORIAL_STYLES.bylinePill;
      break;
    }
    if (hasClass(node, 'wappy-lead-card') || ['h2', 'h3', 'ul', 'ol', 'table'].includes(node.tag)) {
      break;
    }
    if (node.tag === 'p' && !hasClass(node, 'wappy-kicker') && !hasMediaOrVisualElement(node)) {
      const text = getTextContent(node);
      if (isBylineText(text)) {
        root.children[i] = buildBylineNode(node.children);
        break;
      }
    }
  }

  // 2. Verificar si ya existe una tarjeta wappy-lead-card
  const existingLead = findFirstByPredicate(root, (n) => n.type === 'element' && hasClass(n, 'wappy-lead-card'));
  if (existingLead) {
    existingLead.attrs.style = EDITORIAL_STYLES.leadCard;
    const existingBadge = findFirstByPredicate(
      existingLead,
      (n) =>
        n !== existingLead &&
        n.type === 'element' &&
        (hasClass(n, 'wappy-lead-badge') || /^(?:⚡\s*)?resumen\s+ejecutivo:?$/i.test(getTextContent(n).trim())),
    );
    if (existingBadge) {
      addClasses(existingBadge, 'wappy-lead-badge');
      existingBadge.attrs.style = EDITORIAL_STYLES.leadBadge;
    } else {
      existingLead.children.unshift(buildLeadBadgeNode());
    }
    return;
  }

  // 3. Buscar primer bloque narrativo introductorio para envolver en Resumen Ejecutivo
  let leadStartIdx = -1;
  let removeSummaryHeadingIdx = -1;

  for (let i = 0; i < root.children.length; i += 1) {
    const node = root.children[i];
    if (node.type !== 'element') continue;
    if (hasClass(node, 'wappy-byline-pill') || hasClass(node, 'wappy-kicker') || node.tag === 'figure') {
      continue;
    }
    if (node.tag === 'p' && hasMediaOrVisualElement(node) && !getTextContent(node).trim()) {
      continue;
    }
    if (node.tag === 'p' && getTextContent(node).trim()) {
      leadStartIdx = i;
      break;
    }
    // Caso especial: artículo que arranca directamente con <h2>Resumen Ejecutivo</h2><p>...</p>
    if (
      (node.tag === 'h2' || node.tag === 'h3') &&
      /^(?:⚡\s*)?resumen\s+ejecutivo:?$/i.test(getTextContent(node).trim())
    ) {
      const next = root.children[i + 1];
      if (next && next.type === 'element' && next.tag === 'p' && getTextContent(next).trim()) {
        removeSummaryHeadingIdx = i;
        leadStartIdx = i + 1;
      }
      break;
    }
    // Si aparece otro encabezado, tabla o lista primero, respetar estructura original sin mover texto
    break;
  }

  if (leadStartIdx === -1) return;

  const firstPara = root.children[leadStartIdx];
  const leadNodes = [firstPara];
  let consumeCount = 1;

  // Si el primer párrafo es breve (< 110 chars) y el siguiente también es un párrafo introductorio,
  // incluir ambos en el Resumen Ejecutivo siempre que quede contenido después y no exceda 460 chars.
  const firstTextLen = getTextContent(firstPara).trim().length;
  const secondNode = root.children[leadStartIdx + 1];
  const hasMoreAfterSecond = root.children.length > leadStartIdx + 2;
  if (
    firstTextLen < 110 &&
    hasMoreAfterSecond &&
    secondNode &&
    secondNode.type === 'element' &&
    secondNode.tag === 'p' &&
    !hasMediaOrVisualElement(secondNode) &&
    !hasClass(secondNode, 'wappy-cta-card') &&
    firstTextLen + getTextContent(secondNode).trim().length <= 460
  ) {
    leadNodes.push(secondNode);
    consumeCount = 2;
  }

  leadNodes.forEach((p, idx) => {
    const margin = idx === leadNodes.length - 1 ? '0' : '0 0 0.7rem 0';
    p.attrs.style = mergeStyles(p.attrs.style, `margin:${margin};line-height:1.7;`);
  });

  const leadCard = createElement(
    'div',
    {
      class: 'wappy-lead-card',
      style: EDITORIAL_STYLES.leadCard,
    },
    [buildLeadBadgeNode(), ...leadNodes],
  );

  if (removeSummaryHeadingIdx !== -1) {
    root.children.splice(removeSummaryHeadingIdx, consumeCount + 1, leadCard);
  } else {
    root.children.splice(leadStartIdx, consumeCount, leadCard);
  }
}

function styleTableElement(tableNode) {
  tableNode.attrs.style = mergeStyles(tableNode.attrs.style, EDITORIAL_STYLES.table);

  const walkTable = (node, inThead, tbodyRowCounter) => {
    for (const child of node.children || []) {
      if (child.type !== 'element') continue;

      if (child.tag === 'thead') {
        child.attrs.style = mergeStyles(child.attrs.style, EDITORIAL_STYLES.thead);
        walkTable(child, true, tbodyRowCounter);
      } else if (child.tag === 'tbody') {
        const rowState = { count: 0 };
        walkTable(child, false, rowState);
      } else if (child.tag === 'tr') {
        const hasTh = (child.children || []).some((c) => c.type === 'element' && c.tag === 'th');
        const hasTd = (child.children || []).some((c) => c.type === 'element' && c.tag === 'td');
        const isHeaderRow = inThead || (hasTh && !hasTd);
        if (!isHeaderRow && tbodyRowCounter) {
          tbodyRowCounter.count += 1;
          if (tbodyRowCounter.count % 2 === 0) {
            child.attrs.style = mergeStyles(child.attrs.style, EDITORIAL_STYLES.trEven);
          }
        }
        walkTable(child, inThead, tbodyRowCounter);
      } else if (child.tag === 'th') {
        child.attrs.style = mergeStyles(
          child.attrs.style,
          inThead ? EDITORIAL_STYLES.th : EDITORIAL_STYLES.thStandalone,
        );
      } else if (child.tag === 'td') {
        child.attrs.style = mergeStyles(child.attrs.style, EDITORIAL_STYLES.td);
      } else {
        walkTable(child, inThead, tbodyRowCounter);
      }
    }
  };

  walkTable(tableNode, false, { count: 0 });
}

function styleListElement(listNode, isTopLevelList) {
  listNode.attrs.style = mergeStyles(
    listNode.attrs.style,
    isTopLevelList ? EDITORIAL_STYLES.listRoot : EDITORIAL_STYLES.listNested,
  );
  for (const child of listNode.children || []) {
    if (child.type !== 'element') continue;
    if (child.tag === 'li') {
      child.attrs.style = mergeStyles(child.attrs.style, EDITORIAL_STYLES.listItem);
      for (const nested of child.children || []) {
        if (nested.type === 'element' && (nested.tag === 'ul' || nested.tag === 'ol')) {
          styleListElement(nested, false);
        }
      }
    }
  }
}

function styleCalloutBlockquote(blockquoteNode) {
  addClasses(blockquoteNode, 'wappy-callout');
  const text = getTextContent(blockquoteNode);
  const existingStyle = String(blockquoteNode.attrs.style || '');
  const isAmber =
    /#f59e0b|245\s*,\s*158\s*,\s*11/i.test(existingStyle) ||
    /(?:⚠️|alerta|atenci[oó]n|precauci[oó]n|sanci[oó]n|multa|peligro|cr[ií]tico|fecha\s+l[ií]mite|plazo\s+m[aá]ximo|obligatorio|cuidado|advertencia)/i.test(
      text,
    );
  blockquoteNode.attrs.style = isAmber ? EDITORIAL_STYLES.calloutAmber : EDITORIAL_STYLES.calloutTeal;
  for (const child of blockquoteNode.children || []) {
    if (child.type === 'element' && child.tag === 'p') {
      child.attrs.style = mergeStyles(child.attrs.style, 'margin:0.25rem 0;');
    }
  }
}

function styleSemanticElements(node, canWrapList = true, parentNode = null) {
  if (!node || !Array.isArray(node.children)) return;

  const nextChildren = [];

  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i];
    if (child.type !== 'element') {
      nextChildren.push(child);
      continue;
    }

    // <h2>
    if (child.tag === 'h2') {
      child.attrs.style = EDITORIAL_STYLES.h2;
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // <h3>
    if (child.tag === 'h3') {
      child.attrs.style = EDITORIAL_STYLES.h3;
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // <blockquote>
    if (child.tag === 'blockquote') {
      styleCalloutBlockquote(child);
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // .wappy-list-card ya existente
    if (hasClass(child, 'wappy-list-card')) {
      child.attrs.style = EDITORIAL_STYLES.listCard;
      for (const inner of child.children || []) {
        if (inner.type === 'element' && (inner.tag === 'ul' || inner.tag === 'ol')) {
          styleListElement(inner, true);
          styleSemanticElements(inner, false, inner);
        }
      }
      nextChildren.push(child);
      continue;
    }

    // <ul> / <ol> de PRIMER NIVEL -> envolver en .wappy-list-card sin romper listas anidadas
    if (canWrapList && (child.tag === 'ul' || child.tag === 'ol')) {
      styleListElement(child, true);
      styleSemanticElements(child, false, child);
      const listCard = createElement(
        'div',
        {
          class: 'wappy-list-card',
          style: EDITORIAL_STYLES.listCard,
        },
        [child],
      );
      nextChildren.push(listCard);
      continue;
    }

    // Listas anidadas (dentro de <li>, <td>, <blockquote>, tarjetas)
    if (!canWrapList && (child.tag === 'ul' || child.tag === 'ol')) {
      styleListElement(child, false);
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // Contenedor de tabla ya existente (.wappy-table-wrap o .table-responsive)
    if (
      child.tag === 'div' &&
      (hasClass(child, 'wappy-table-wrap') ||
        hasClass(child, 'table-responsive') ||
        hasClass(child, 'table-container') ||
        hasClass(child, 'table-wrapper')) &&
      child.children.some((c) => c.type === 'element' && c.tag === 'table')
    ) {
      addClasses(child, 'wappy-table-wrap', 'table-responsive', 'custom-table-scroll');
      child.attrs.style = EDITORIAL_STYLES.tableWrap;
      for (const inner of child.children) {
        if (inner.type === 'element' && inner.tag === 'table') {
          styleTableElement(inner);
          styleSemanticElements(inner, false, inner);
        }
      }
      nextChildren.push(child);
      continue;
    }

    // <table> sin contenedor -> envolver en .wappy-table-wrap
    if (child.tag === 'table') {
      styleTableElement(child);
      styleSemanticElements(child, false, child);
      const alreadyInWrapper =
        parentNode &&
        parentNode.type === 'element' &&
        (hasClass(parentNode, 'wappy-table-wrap') || hasClass(parentNode, 'table-responsive'));
      if (alreadyInWrapper) {
        nextChildren.push(child);
      } else {
        const wrapper = createElement(
          'div',
          {
            class: 'wappy-table-wrap table-responsive custom-table-scroll',
            style: EDITORIAL_STYLES.tableWrap,
          },
          [child],
        );
        nextChildren.push(wrapper);
      }
      continue;
    }

    // .wappy-cta-card ya existente
    if (hasClass(child, 'wappy-cta-card')) {
      child.attrs.style = EDITORIAL_STYLES.ctaCard;
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // .wappy-lead-card ya existente
    if (hasClass(child, 'wappy-lead-card')) {
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // Enlaces <a> (no sobrescribir si tienen fondo de botón/píldora)
    if (child.tag === 'a') {
      const curStyle = String(child.attrs.style || '');
      if (!/background/i.test(curStyle)) {
        child.attrs.style = mergeStyles(curStyle, EDITORIAL_STYLES.link);
      }
      if (child.attrs.href && /^https?:\/\//i.test(child.attrs.href)) {
        if (!child.attrs.target) child.attrs.target = '_blank';
        if (!child.attrs.rel) child.attrs.rel = 'noopener noreferrer';
      }
      styleSemanticElements(child, false, child);
      nextChildren.push(child);
      continue;
    }

    // Imágenes <img>
    if (child.tag === 'img') {
      child.attrs.style = mergeStyles(child.attrs.style, EDITORIAL_STYLES.img);
      nextChildren.push(child);
      continue;
    }

    // Recursión estándar: mantener canWrapList solo en contenedores estructurales genéricos
    const childCanWrapList =
      canWrapList && ['section', 'article', 'main', 'div'].includes(child.tag) && !hasClass(child, 'wappy-byline-pill');
    styleSemanticElements(child, childCanWrapList, child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

function maybeHighlightConclusionAndAppendCta(root, tags = []) {
  const hasAnyBlockquote = Boolean(
    findFirstByPredicate(root, (n) => n.type === 'element' && (n.tag === 'blockquote' || hasClass(n, 'wappy-callout'))),
  );

  // Buscar el último nodo sustantivo antes de un eventual .wappy-cta-card
  let lastContentIdx = -1;
  for (let i = root.children.length - 1; i >= 0; i -= 1) {
    const n = root.children[i];
    if (n.type === 'element' && hasClass(n, 'wappy-cta-card')) continue;
    if (!isVisuallyEmptyNode(n)) {
      lastContentIdx = i;
      break;
    }
  }

  // Si no hay blockquote en todo el artículo y el último bloque es claramente un párrafo de cierre/conclusión
  if (!hasAnyBlockquote && lastContentIdx >= 2) {
    const lastNode = root.children[lastContentIdx];
    const prevNode = root.children[lastContentIdx - 1];
    if (
      lastNode &&
      lastNode.type === 'element' &&
      lastNode.tag === 'p' &&
      !hasClass(lastNode, 'wappy-kicker') &&
      !hasMediaOrVisualElement(lastNode)
    ) {
      const lastText = getTextContent(lastNode).trim();
      const prevHeadingText =
        prevNode && prevNode.type === 'element' && (prevNode.tag === 'h2' || prevNode.tag === 'h3')
          ? getTextContent(prevNode).trim()
          : '';
      const isClearConclusion =
        /^(?:en\s+conclusi[oó]n|en\s+resumen|en\s+definitiva|para\s+concluir|como\s+cierre|en\s+s[ií]ntesis|recuerda\s+que|punto\s+clave\s*:|clave\s*:)/i.test(
          lastText,
        ) || /(?:conclusi[oó]n|conclusiones|cierre|reflexi[oó]n\s+final|en\s+resumen)/i.test(prevHeadingText);

      if (isClearConclusion && lastText.length >= 40) {
        const callout = createElement('blockquote', { class: 'wappy-callout' }, [lastNode]);
        styleCalloutBlockquote(callout);
        root.children[lastContentIdx] = callout;
      }
    }
  }

  // Agregar tarjeta final CTA WAPPY IA solo si no existe ya .wappy-cta-card
  const existingCta = findFirstByPredicate(root, (n) => n.type === 'element' && hasClass(n, 'wappy-cta-card'));
  if (!existingCta) {
    const cleanTags = Array.isArray(tags) ? tags.map((t) => String(t || '').trim()).filter(Boolean) : [];
    const pillLabel =
      cleanTags.some((t) => /pesv|vial/i.test(t))
        ? '⚡ WAPPY IA · COPILOTO SG-SST & PESV'
        : '⚡ WAPPY IA · COPILOTO SG-SST';

    const ctaNode = createElement(
      'div',
      {
        class: 'wappy-cta-card',
        style: EDITORIAL_STYLES.ctaCard,
      },
      [
        createElement('span', { style: EDITORIAL_STYLES.ctaPill }, [createText(pillLabel)]),
        createElement('p', { style: 'margin:0;font-weight:700;font-size:1.05rem;line-height:1.45;' }, [
          createText('Lleva este conocimiento a la práctica en minutos con WAPPY IA'),
        ]),
        createElement('p', { style: 'margin:0;opacity:0.9;line-height:1.65;' }, [
          createText('Automatiza matrices GTC 45, diagnósticos Res. 0312, cronogramas, PESV y documentos en vivo con los agentes especializados de '),
          createElement('strong', {}, [createText('WAPPY IA')]),
          createText('.'),
        ]),
        createElement('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-top:0.35rem;' }, [
          createElement(
            'a',
            {
              href: 'https://www.instagram.com/wappy_ia/',
              target: '_blank',
              rel: 'noopener noreferrer',
              style:
                'display:inline-flex;align-items:center;gap:0.45rem;padding:0.55rem 1.15rem;border-radius:999px;background:linear-gradient(135deg,#f59e0b 0%,#ec4899 52%,#8b5cf6 100%);color:#ffffff;font-weight:800;font-size:0.86rem;text-decoration:none;box-shadow:0 6px 18px rgba(236,72,153,0.28);',
            },
            [createText('📸 Síguenos en Instagram @wappy_ia →')],
          ),
        ]),
      ],
    );
    root.children.push(ctaNode);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Pública Principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea cualquier contenido (HTML antiguo, Markdown crudo, texto plano o HTML generado por IA)
 * al estándar unificado WAPPY Editorial HTML v2.
 *
 * @param {string} rawContent
 * @param {{ title?: string, tags?: string[], forceRestyle?: boolean }} [options]
 * @returns {string}
 */
function formatBlogEditorialHtml(rawContent, options = {}) {
  if (!rawContent || typeof rawContent !== 'string') {
    return '';
  }

  const trimmedInput = rawContent.trim();
  if (!trimmedInput) {
    return '';
  }

  const { title = '', tags = [], forceRestyle = false } = options || {};

  // Idempotencia: respetar ediciones manuales en LiveEditor si ya es v2 y no se fuerza re-estilizado
  if (!forceRestyle && /data-wappy-editorial\s*=\s*["']v2["']/i.test(trimmedInput)) {
    return rawContent;
  }

  // 1. Limpiar wrappers markdown ```html ... ``` y etiquetas de documento completo
  let cleaned = trimmedInput
    .replace(/^```(?:html|xml|markdown|md)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1].trim();
  }

  cleaned = cleaned
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();

  if (!cleaned) {
    return '';
  }

  // 2. Convertir Markdown o texto plano a HTML si no trae estructura HTML de bloque
  let htmlSource = cleaned;
  if (!hasBlockHtmlTags(htmlSource)) {
    htmlSource = convertMarkdownToHtml(htmlSource);
  } else {
    // Si mezcla HTML con líneas de encabezados Markdown sueltas fuera de etiquetas, convertirlas
    htmlSource = htmlSource.replace(/(^|\n)[ \t]*(#{1,4})[ \t]+([^\n<]+)(?=\n|$)/g, (_, lead, hashes, heading) => {
      const level = hashes.length;
      return `${lead}<h${level}>${convertInlineMarkdown(heading.trim())}</h${level}>`;
    });
  }

  // 2b. Limpiar etiquetas mal anidadas legadas (</p> huérfanos tras <div>, <p><p> anidados y <p></p> vacíos)
  htmlSource = htmlSource
    .replace(/(<div\b[^>]*>)\s*<\/p>/gi, '$1')
    .replace(/<p\b[^>]*>\s*(?:&nbsp;|\u00a0|<br\s*\/?>|\s)*<\/p>/gi, '')
    .replace(/<p\b[^>]*>\s*(?=<p\b)/gi, '')
    .replace(/<\/p>\s*<\/p>/gi, '</p>');

  // 3. Parsear al AST balanceado y limpiar contenedores/estilos rotos
  const root = parseHtmlFragment(htmlSource);
  unwrapRedundantRootContainers(root);
  sanitizeTreeStylesAndNoise(root, false);
  flattenGenericDivWrappers(root);
  pruneEmptyTopLevelBlocks(root);
  normalizeInlineNodesAtTopLevel(root);
  normalizeContentEditableDivs(root);

  if (root.children.length === 0) {
    return '';
  }

  // 4. Procesar <h1> vacío/largo/duplicado/subtítulo kicker
  processH1Elements(root, title);
  pruneEmptyTopLevelBlocks(root);

  // 5. Preservar autoría ("Por ...") en píldora y envolver intro en Resumen Ejecutivo
  applyBylineAndLeadCard(root);

  // 6. Estilizar <h2>, <h3>, listas de primer nivel, tablas responsivas, blockquotes, links e imágenes
  styleSemanticElements(root, true, root);

  // 7. Destacar cierre si aplica y agregar tarjeta CTA WAPPY IA (sin duplicar)
  maybeHighlightConclusionAndAppendCta(root, tags);

  const innerHtml = serializeNode(root).trim();
  if (!innerHtml) {
    return '';
  }

  return `<div class="wappy-editorial-article" data-wappy-editorial="${WAPPY_EDITORIAL_VERSION}" style="${EDITORIAL_STYLES.articleWrapper}">\n${innerHtml}\n</div>`;
}

/**
 * Extrae texto plano limpio del contenido editorial (omitiendo badges como "RESUMEN EJECUTIVO"
 * y la tarjeta CTA final) para autollenar el campo `description`.
 *
 * @param {string} html
 * @param {number} [maxLen=220]
 * @returns {string}
 */
function extractBlogSummary(html, maxLen = 220) {
  if (!html || typeof html !== 'string') return '';
  const limit = Number.isFinite(maxLen) && maxLen > 20 ? Math.floor(maxLen) : 220;

  const root = parseHtmlFragment(html);

  const extractCleanText = (node) => {
    if (!node) return '';
    if (node.type === 'text') return decodeHtmlEntities(node.value);
    if (node.type === 'element') {
      if (['script', 'style'].includes(node.tag)) return '';
      if (
        hasClass(node, 'wappy-lead-badge') ||
        hasClass(node, 'wappy-cta-card') ||
        hasClass(node, 'wappy-byline-pill')
      ) {
        return '';
      }
      if (node.tag === 'br') return ' ';
      const inner = (node.children || []).map(extractCleanText).join('');
      return BLOCK_TAGS.has(node.tag) ? ` ${inner} ` : inner;
    }
    return (node.children || []).map(extractCleanText).join('');
  };

  // Priorizar el texto de la tarjeta Resumen Ejecutivo si existe y tiene contenido real
  const leadCard = findFirstByPredicate(root, (n) => n.type === 'element' && hasClass(n, 'wappy-lead-card'));
  let candidate = leadCard ? extractCleanText(leadCard) : '';
  candidate = candidate
    .replace(/⚡\s*resumen\s+ejecutivo:?/gi, '')
    .replace(/\bresumen\s+ejecutivo:?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (candidate.length < 30) {
    candidate = extractCleanText(root)
      .replace(/⚡\s*resumen\s+ejecutivo:?/gi, '')
      .replace(/\bresumen\s+ejecutivo:?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (!candidate) return '';
  if (candidate.length <= limit) return candidate;

  const sliced = candidate.slice(0, Math.max(10, limit - 3));
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > limit * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${cut.replace(/[,;:\-–—]+$/, '').trim()}...`;
}

/**
 * Retorna una plantilla HTML v2 editable lista para redactar manualmente un artículo desde cero.
 *
 * @param {string} [title='']
 * @returns {string}
 */
function getWappyEditorialStarterTemplate(title = '') {
  const safeTitle = String(title || '').trim();
  const topicPhrase = safeTitle ? `sobre ${escapeHtmlText(safeTitle)}` : 'sobre el tema principal de tu artículo';

  return `<div class="wappy-editorial-article" data-wappy-editorial="${WAPPY_EDITORIAL_VERSION}" style="${EDITORIAL_STYLES.articleWrapper}">
<div class="wappy-lead-card" style="${EDITORIAL_STYLES.leadCard}">
  <div class="wappy-lead-badge" style="${EDITORIAL_STYLES.leadBadge}">⚡ RESUMEN EJECUTIVO</div>
  <p style="margin:0;line-height:1.7;">Resume aquí en 2 o 3 oraciones claras qué resolverá el lector ${topicPhrase}, cuál es el impacto normativo o práctico y la recomendación principal.</p>
</div>

<h2 style="${EDITORIAL_STYLES.h2}">1. Contexto y alcance normativo</h2>
<p>Presenta el escenario actual, la norma aplicable (por ejemplo, Decreto 1072 de 2015, Resolución 0312 de 2019 o GTC 45) y por qué este tema es prioritario para los responsables de SST y la alta dirección.</p>

<h2 style="${EDITORIAL_STYLES.h2}">2. Claves prácticas para implementar hoy</h2>
<div class="wappy-list-card" style="${EDITORIAL_STYLES.listCard}">
  <ul style="${EDITORIAL_STYLES.listRoot}">
    <li style="${EDITORIAL_STYLES.listItem}"><strong>Diagnóstico inicial:</strong> identifica brechas documentales y operativas antes de ejecutar cambios.</li>
    <li style="${EDITORIAL_STYLES.listItem}"><strong>Evidencia verificable:</strong> define soportes, responsables y fechas en el Plan de Trabajo Anual.</li>
    <li style="${EDITORIAL_STYLES.listItem}"><strong>Seguimiento continuo:</strong> mide indicadores de cumplimiento y cierra acciones preventivas a tiempo.</li>
  </ul>
</div>

<blockquote class="wappy-callout" style="${EDITORIAL_STYLES.calloutAmber}">
  <p style="margin:0.25rem 0;"><strong>⚠️ Alerta clave:</strong> Destaca aquí un plazo obligatorio, un error frecuente en auditorías o un requisito crítico que tu audiencia no debe pasar por alto.</p>
</blockquote>

<h2 style="${EDITORIAL_STYLES.h2}">3. Cuadro comparativo o plan de acción</h2>
<div class="wappy-table-wrap table-responsive custom-table-scroll" style="${EDITORIAL_STYLES.tableWrap}">
  <table style="${EDITORIAL_STYLES.table}">
    <thead style="${EDITORIAL_STYLES.thead}">
      <tr>
        <th style="${EDITORIAL_STYLES.th}">Aspecto</th>
        <th style="${EDITORIAL_STYLES.th}">Requisito / Criterio</th>
        <th style="${EDITORIAL_STYLES.th}">Acción recomendada</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="${EDITORIAL_STYLES.td}">Documentación</td>
        <td style="${EDITORIAL_STYLES.td}">Soporte vigente y trazable</td>
        <td style="${EDITORIAL_STYLES.td}">Centralizar evidencias y firmas</td>
      </tr>
      <tr style="${EDITORIAL_STYLES.trEven}">
        <td style="${EDITORIAL_STYLES.td}">Seguimiento</td>
        <td style="${EDITORIAL_STYLES.td}">Verificación periódica</td>
        <td style="${EDITORIAL_STYLES.td}">Programar alertas automáticas</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="wappy-cta-card" style="${EDITORIAL_STYLES.ctaCard}">
  <span style="${EDITORIAL_STYLES.ctaPill}">⚡ WAPPY IA · COPILOTO SG-SST</span>
  <p style="margin:0;font-weight:700;font-size:1.05rem;line-height:1.45;">Aplica esta guía en minutos con los Agentes de WAPPY IA</p>
  <p style="margin:0;opacity:0.9;line-height:1.65;">Automatiza matrices, diagnósticos normativos, planes de trabajo y documentos en vivo para tu Sistema de Gestión desde tu espacio en <strong>WAPPY</strong>.</p>
  <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;margin-top:0.35rem;">
    <a href="https://www.instagram.com/wappy_ia/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.55rem 1.15rem;border-radius:999px;background:linear-gradient(135deg,#f59e0b 0%,#ec4899 52%,#8b5cf6 100%);color:#ffffff;font-weight:800;font-size:0.86rem;text-decoration:none;box-shadow:0 6px 18px rgba(236,72,153,0.28);">📸 Síguenos en Instagram @wappy_ia →</a>
  </div>
</div>
</div>`;
}

module.exports = {
  WAPPY_EDITORIAL_VERSION,
  WAPPY_BLOG_EDITORIAL_PROMPT,
  formatBlogEditorialHtml,
  extractBlogSummary,
  getWappyEditorialStarterTemplate,
};
