/**
 * TenshiPageController - Controlador cliente de automatización e interacción con el DOM.
 * Implementa de manera ligera los conceptos de "Deshidratación de DOM" y "Simulación de Eventos" de Page-Agent.
 */

export interface InteractiveElement {
  element: HTMLElement;
  index: number;
  tagName: string;
  type?: string;
  placeholder?: string;
  value?: string;
  checked?: boolean;
  text: string;
}

// Mapa para rastrear las referencias de elementos activos indexados
let selectorMap = new Map<number, HTMLElement>();

/**
 * Verifica si un elemento es visible en el viewport
 */
function isElementVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();

  // Si tiene dimensiones cero, o está oculto por estilos, no es visible
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  // Retornamos true aunque esté fuera del viewport (off-screen) para evitar que la IA
  // tenga que hacer scroll paso a paso para descubrir los elementos.
  // El controlador ya desplaza el elemento a la vista automáticamente al interactuar.
  return true;
}

/**
 * Determina si un elemento HTML es interactivo
 */
function isInteractive(el: HTMLElement): boolean {
  const tagName = el.tagName.toLowerCase();
  
  // Elementos interactivos nativos
  if (['button', 'input', 'select', 'textarea', 'a', 'summary'].includes(tagName)) {
    return true;
  }

  // Roles interactivos de ARIA
  const role = el.getAttribute('role');
  if (role && ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'option', 'switch'].includes(role)) {
    return true;
  }

  // Atributos y marcas de interactividad (Radix UI, tabs, accordions)
  if (el.getAttribute('data-action') || el.getAttribute('data-clickable') || el.getAttribute('tabindex') === '0' || el.getAttribute('aria-expanded')) {
    return true;
  }

  // Clases CSS de interactividad (Tailwind y WAPPY buttons / pills / micro-botones)
  const classList = el.className || '';
  if (typeof classList === 'string' && (classList.includes('cursor-pointer') || classList.includes('btn') || classList.includes('group-hover') || classList.includes('active:scale-95'))) {
    return true;
  }

  // Si tiene un cursor de puntero configurado por CSS
  const style = window.getComputedStyle(el);
  if (style.cursor === 'pointer') {
    return true;
  }

  // Elementos con evento click
  if (el.onclick || el.getAttribute('onclick')) {
    return true;
  }

  return false;
}

/**
 * Obtiene el texto representativo o la etiqueta del elemento
 */
function getElementText(el: HTMLElement): string {
  // 1. Atributos explícitos de accesibilidad
  const label = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('aria-describedby') || el.getAttribute('data-tooltip') || el.getAttribute('data-title');
  if (label) return label.trim();

  // 2. Texto interno limpio, truncado si es demasiado largo
  const innerText = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  if (innerText) return innerText.length > 50 ? innerText.substring(0, 47) + '...' : innerText;

  // 3. Para botones sin texto ni aria-label, intentar inferir función por clases CSS
  const classList = el.className || '';
  if (/save|guardar|submit/i.test(classList)) return '[Botón Guardar]';
  if (/delete|eliminar|trash/i.test(classList)) return '[Botón Eliminar]';
  if (/edit|editar|pencil/i.test(classList)) return '[Botón Editar]';
  if (/expand|chevron|toggle/i.test(classList)) return '[Botón Expandir]';
  if (/close|cerrar/i.test(classList)) return '[Botón Cerrar]';

  // 4. Inspeccionar ícono SVG hijo por data attributes
  const svgChild = el.querySelector('svg[data-icon], svg[aria-label]');
  if (svgChild) {
    const svgLabel = svgChild.getAttribute('data-icon') || svgChild.getAttribute('aria-label');
    if (svgLabel) return `[Ícono: ${svgLabel}]`;
  }

  return '';
}

/**
 * Intenta deducir la etiqueta de texto asociada a un elemento de formulario (input, select, textarea)
 */
function getInputLabel(el: HTMLElement): string {
  // 1. Atributos explícitos
  const explicit = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('aria-describedby') || el.getAttribute('data-tooltip') || el.getAttribute('data-title');
  if (explicit) return explicit.trim();

  // 2. Asociaciones de etiqueta por ID (htmlFor)
  const id = el.getAttribute('id');
  if (id) {
    const labelEl = document.querySelector(`label[for="${id}"]`);
    if (labelEl && labelEl.textContent) {
      return labelEl.textContent.trim().replace(/\s+/g, ' ');
    }
  }

  // 3. Si el input está anidado dentro de una etiqueta label
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent) {
    return parentLabel.textContent.trim().replace(el.textContent || '', '').trim().replace(/\s+/g, ' ');
  }

  // 4. Buscar texto de etiqueta en hermanos anteriores
  let prev = el.previousElementSibling;
  for (let i = 0; i < 3; i++) {
    if (!prev) break;
    const text = (prev.textContent || '').trim().replace(/\s+/g, ' ');
    if (text && text.length < 50 && !prev.querySelector('input, select, textarea, button')) {
      return text;
    }
    prev = prev.previousElementSibling;
  }

  // 5. Buscar en hermanos anteriores del contenedor padre
  const parent = el.parentElement;
  if (parent) {
    let parentPrev = parent.previousElementSibling;
    if (parentPrev) {
      const text = (parentPrev.textContent || '').trim().replace(/\s+/g, ' ');
      if (text && text.length < 50 && !parentPrev.querySelector('input, select, textarea, button')) {
        return text;
      }
    }
  }

  return '';
}

/**
 * Deshidrata el DOM actual en un formato de texto estructurado y ligero para el LLM
 */
export function getDehydratedDOM(): string {
  try {
    selectorMap.clear();
    let index = 0;
    let resultText = '';

    // Escanear recursivamente el DOM a partir del body
    function traverse(el: Element, depth = 0) {
      const htmlEl = el as HTMLElement;
      if (!htmlEl || !isElementVisible(htmlEl)) return;

      // Excluir el widget de Tenshi por completo para evitar que la IA interactúe consigo misma
      if (htmlEl.classList.contains('tenshi-widget-container') || htmlEl.closest('.tenshi-widget-container')) {
        return;
      }

      // Excluir elementos SVG y sus hijos — nunca son interactivos y son ruido puro para el LLM
      const tagNameLower = htmlEl.tagName.toLowerCase();
      if (['svg', 'path', 'rect', 'circle', 'line', 'polygon', 'polyline', 'ellipse', 'g', 'defs', 'use', 'symbol', 'clippath', 'lineargradient'].includes(tagNameLower)) {
        return;
      }

      const indent = '\t'.repeat(depth);

      if (isInteractive(htmlEl)) {
        const idx = index++;
        selectorMap.set(idx, htmlEl);

        const tagName = htmlEl.tagName.toLowerCase();
        const type = htmlEl.getAttribute('type') || '';
        const placeholder = htmlEl.getAttribute('placeholder') || '';
        const value = (htmlEl as any).value || '';
        const checked = (htmlEl as any).checked ? 'checked' : '';
        const text = ['input', 'select', 'textarea'].includes(tagName) ? getInputLabel(htmlEl) : getElementText(htmlEl);

        // Crear representación compacta de texto
        let attrs = '';
        if (type) attrs += ` type="${type}"`;
        if (placeholder) attrs += ` placeholder="${placeholder}"`;
        if (value && ['input', 'textarea'].includes(tagName)) attrs += ` value="${value}"`;
        if (checked) attrs += ` ${checked}`;

        resultText += `${indent}[${idx}]<${tagName}${attrs}>${text}</${tagName}>\n`;
        
        // Detener recursión profunda en elementos interactivos pequeños para evitar ruido
        if (['button', 'a', 'option'].includes(tagName)) return;
      } else {
        // Si es un contenedor con texto directo útil, capturar solo el texto directo (no de los descendientes)
        const childNodes = Array.from(htmlEl.childNodes);
        const directTextNodes = childNodes.filter(
          node => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()
        );
        
        if (directTextNodes.length > 0 && depth < 5) {
          const text = directTextNodes.map(node => node.nodeValue?.trim()).join(' ').replace(/\s+/g, ' ');
          if (text && text.length < 100) {
            resultText += `${indent}${text}\n`;
          }
        }
      }

      // Continuar explorando hijos
      Array.from(htmlEl.children).forEach(child => traverse(child, depth + 1));
    }

    traverse(document.body);
    return resultText || '<Pantalla sin elementos interactivos visibles>';
  } catch (err: any) {
    console.error('Error deshidratando el DOM:', err);
    return `<Error deshidratando el DOM: ${err.message}>`;
  }
}

/**
 * Extrae de forma limpia, estructurada y legible el contenido visible de la pantalla actual:
 * títulos, informes abiertos, tarjetas de datos, tablas, modales y formularios.
 */
export function getVisibleScreenContent(section?: string): string {
  try {
    const lines: string[] = [];
    const currentUrl = window.location.pathname + window.location.search;
    lines.push(`[PANTALLA ACTUAL: ${currentUrl}]`);

    // 1. Detectar si hay un modal o diálogo activo en primer plano
    const modalEl = document.querySelector<HTMLElement>(
      '[role="dialog"], [aria-modal="true"], .modal, .dialog, [data-headlessui-state="open"]'
    );
    const rootScope: HTMLElement = (modalEl && isElementVisible(modalEl)) ? modalEl : document.body;

    if (rootScope !== document.body) {
      lines.push('[EN PRIMER PLANO: Ventana emergente / Modal de informe abierta]');
    }

    // 1.1 Si hay mensajes de chat o respuestas de especialistas visibles en pantalla, extraer la respuesta completa
    const chatMessages = Array.from(rootScope.querySelectorAll<HTMLElement>(
      '.agent-turn .markdown, .agent-turn [class*="message-content"], [data-message-id] .markdown, [class*="text-message"], article .markdown'
    )).filter(m => isElementVisible(m) && !m.closest('.tenshi-widget-container'));

    if (chatMessages.length > 0) {
      lines.push('=== RESPUESTA COMPLETA DEL ESPECIALISTA / AGENTE EN PANTALLA ===');
      const lastMsg = chatMessages[chatMessages.length - 1];
      const text = lastMsg.innerText?.trim();
      if (text && text.length > 10) {
        lines.push(text.length > 5000 ? text.substring(0, 5000) + '... [Ver resto en pantalla]' : text);
        lines.push('');
      }
    }

    // 1.2 Extracción Prioritaria de Informes Oficiales Completos en Pantalla
    const reportEditorEl = rootScope.querySelector<HTMLElement>(
      '.live-editor, [data-live-editor], .ProseMirror, [contenteditable="true"], #sgsst-live-editor-content, [data-report-content], [data-report-markdown], .report-preview, .report-viewer'
    );
    if (reportEditorEl && isElementVisible(reportEditorEl)) {
      const reportText = reportEditorEl.innerText?.trim();
      if (reportText && reportText.length > 80) {
        lines.push('=== INFORME OFICIAL COMPLETO EN PANTALLA ===');
        lines.push(reportText.length > 10000 ? reportText.substring(0, 10000) + '... [Informe extenso continúa en pantalla]' : reportText);
        lines.push('');
      }
    }

    // 1.3 Detección Especializada de Catálogo de Perfiles de Cargo (Todos los cargos de la empresa)
    const perfilesResumenEl = rootScope.querySelector<HTMLElement>('[data-tenshi-data="resumen-perfiles-cargo"]');
    const perfilCards = Array.from(rootScope.querySelectorAll<HTMLElement>(
      '[data-tenshi-perfil-card], .perfil-cargo-card, [data-cargo-nombre]'
    )).filter(c => isElementVisible(c) && !c.closest('.tenshi-widget-container'));

    if (perfilesResumenEl || perfilCards.length > 0) {
      lines.push(`=== CATÁLOGO COMPLETO DE PERFILES DE CARGO EN LA EMPRESA (Total: ${perfilCards.length} cargos) ===`);
      if (perfilesResumenEl) {
        const resumenText = perfilesResumenEl.innerText?.trim();
        if (resumenText) {
          lines.push(resumenText);
        }
      } else {
        perfilCards.forEach((card, idx) => {
          const nombre = card.getAttribute('data-cargo-nombre') || card.querySelector('h5')?.innerText?.trim() || `Cargo #${idx + 1}`;
          const area = card.getAttribute('data-cargo-area') || card.querySelector('p')?.innerText?.trim() || 'Sin área';
          const nivel = card.getAttribute('data-cargo-nivel') || '';
          const activo = card.getAttribute('data-cargo-activo') === 'true';
          const tieneInforme = card.getAttribute('data-cargo-tiene-informe') === 'true';
          lines.push(`* ${nombre} | Área: ${area}${nivel ? ` | Nivel: ${nivel}` : ''}${tieneInforme ? ' | [Informe disponible]' : ''}${activo ? ' << [SELECCIONADO ACTUALMENTE EN PANTALLA]' : ''}`);
        });
      }
      lines.push('');
    }

    // 2. Extraer Título Principal del módulo o pantalla
    const headers = Array.from(rootScope.querySelectorAll<HTMLElement>('h1, h2, h3, header h4'));
    const visibleHeaders = headers.filter(h => isElementVisible(h) && !h.closest('.tenshi-widget-container'));
    if (visibleHeaders.length > 0) {
      lines.push('TÍTULOS Y SECCIONES:');
      visibleHeaders.slice(0, 5).forEach(h => {
        const text = h.innerText?.trim();
        if (text) lines.push(`- ${text}`);
      });
      lines.push('');
    }

    // 2.1 Extraer Filtros de Estado y Botones de Conteo (ej: "Todos (58)", "Activos (57)", "Retirados (1)")
    const metricButtons = Array.from(rootScope.querySelectorAll<HTMLElement>(
      'button, [role="tab"], [role="button"], [class*="badge"], [class*="pill"], [class*="chip"]'
    )).filter(b => isElementVisible(b) && !b.closest('.tenshi-widget-container'));

    const counterTexts = metricButtons
      .map(b => b.innerText?.trim())
      .filter(t => t && (/\(\d+\)/.test(t) || /\b\d+\s+(trabajador|colaborador|activo|retirado|registro|caso|riesgo|informe|evaluacion|empleado)/i.test(t)));

    if (counterTexts.length > 0) {
      lines.push('FILTROS Y CONTEOS DE ESTADO EN PANTALLA:');
      const uniqueCounters = Array.from(new Set(counterTexts));
      lines.push(uniqueCounters.slice(0, 10).join(' | '));
      lines.push('');
    }

    // 2.2 Extraer Tarjetas de KPIs y Cifras Resumen Clave
    const kpiElements = Array.from(rootScope.querySelectorAll<HTMLElement>(
      '[class*="grid"] > div, [class*="card"], [class*="stat"], [class*="kpi"], [class*="summary"]'
    )).filter(c => isElementVisible(c) && !c.closest('.tenshi-widget-container'));

    const kpiLines: string[] = [];
    kpiElements.forEach(c => {
      const numEl = c.querySelector<HTMLElement>('.text-2xl, .text-3xl, .text-xl, .text-4xl, .font-black, [class*="font-black"]');
      const labelEl = c.querySelector<HTMLElement>('.text-xs, .text-sm, [class*="text-text-secondary"], [class*="text-gray"]');
      if (numEl && labelEl && isElementVisible(numEl)) {
        const num = numEl.innerText?.trim();
        const label = labelEl.innerText?.trim();
        if (num && label && /^\d+[\w%]*$/.test(num) && label.length > 2 && label.length < 40) {
          kpiLines.push(`- ${label}: ${num}`);
        }
      }
    });

    if (kpiLines.length > 0) {
      lines.push('INDICADORES Y CIFRAS RESUMEN EN PANTALLA:');
      lines.push(Array.from(new Set(kpiLines)).slice(0, 8).join('\n'));
      lines.push('');
    }

    // 3. Extraer Tablas de datos visibles (registros de informes, trabajadores, mediciones)
    const tables = Array.from(rootScope.querySelectorAll<HTMLTableElement>('table'));
    const visibleTables = tables.filter(t => isElementVisible(t) && !t.closest('.tenshi-widget-container'));
    if (visibleTables.length > 0) {
      lines.push('TABLA DE DATOS / REGISTROS:');
      visibleTables.slice(0, 2).forEach((table) => {
        const rows = Array.from(table.querySelectorAll('tr')).filter(r => isElementVisible(r));
        if (rows.length > 0) {
          rows.slice(0, 10).forEach(row => {
            const cells = Array.from(row.querySelectorAll('th, td')).map(c => (c as HTMLElement).innerText?.trim().replace(/\n+/g, ' ') || '');
            if (cells.some(c => c)) {
              lines.push(`| ${cells.join(' | ')} |`);
            }
          });
          lines.push('');
        }
      });
    }

    // 4. Extraer Tarjetas, Artículos o Contenedores de Informes / Reportes
    const reportCards = Array.from(rootScope.querySelectorAll<HTMLElement>(
      'article, [role="article"], .report-card, .card, [class*="card"], [class*="report"], [class*="record"]'
    )).filter(c => isElementVisible(c) && !c.closest('.tenshi-widget-container') && (c.innerText?.length || 0) > 30);

    if (reportCards.length > 0 && !perfilesResumenEl && perfilCards.length === 0) {
      lines.push('INFORMES / REGISTROS VISIBLES EN PANTALLA:');
      reportCards.slice(0, 6).forEach((card, idx) => {
        const text = card.innerText?.trim().replace(/\n{3,}/g, '\n\n');
        if (text && text.length > 20) {
          const truncated = text.length > 800 ? text.substring(0, 800) + '...' : text;
          lines.push(`--- Registro #${idx + 1} ---`);
          lines.push(truncated);
        }
      });
      lines.push('');
    }

    // 5. Extraer campos de formulario con sus valores actuales si hay un formulario visible
    const formInputs = Array.from(rootScope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )).filter(i => isElementVisible(i) && !i.closest('.tenshi-widget-container'));

    if (formInputs.length > 0) {
      const filledInputs = formInputs.filter(input => {
        const val = input.value?.trim();
        return val && val !== 'on' && val !== 'false';
      });
      if (filledInputs.length > 0) {
        lines.push('CAMPOS DILIGENCIADOS EN PANTALLA:');
        filledInputs.slice(0, 15).forEach(input => {
          const label = getInputLabel(input) || input.getAttribute('placeholder') || input.name || 'Campo';
          lines.push(`* ${label}: ${input.value}`);
        });
        lines.push('');
      }
    }

    // 6. Si no hubo tablas ni tarjetas estructuradas, volcar el texto visible de los bloques principales
    if (visibleTables.length === 0 && reportCards.length === 0) {
      const textBlocks = Array.from(rootScope.querySelectorAll<HTMLElement>('p, li, blockquote, [class*="content"]'))
        .filter(b => isElementVisible(b) && !b.closest('.tenshi-widget-container'))
        .map(b => b.innerText?.trim())
        .filter(t => t && t.length > 15);

      if (textBlocks.length > 0) {
        lines.push('CONTENIDO TEXTUAL:');
        lines.push(textBlocks.slice(0, 15).join('\n'));
      }
    }

    const fullResult = lines.join('\n').trim();
    if (fullResult.length < 50) {
      return `[PANTALLA ACTUAL: ${currentUrl}]\nNo se detectó un informe abierto en primer plano. Puedes pedirme que abra el aplicativo para ver los registros.`;
    }

    // Limitar a ~12000 caracteres para permitir informes y dictámenes completos
    return fullResult.length > 12000 ? fullResult.substring(0, 12000) + '\n... [Contenido truncado por longitud]' : fullResult;
  } catch (err: any) {
    return `Error extrayendo contenido de pantalla: ${err.message}`;
  }
}

/**
 * Encuentra el contenedor con scroll activo en la pantalla actual
 * (ej. el área principal de contenido de la SPA, modales abiertos o tablas con scroll interno)
 */
function findActiveScrollContainer(): HTMLElement | null {
  // 1. Si hay un modal o diálogo en primer plano
  const modalEl = document.querySelector<HTMLElement>(
    '[role="dialog"], [aria-modal="true"], .modal, .dialog, [data-headlessui-state="open"]'
  );
  if (modalEl && isElementVisible(modalEl)) {
    const scrollableInModal = modalEl.querySelector<HTMLElement>(
      '.overflow-y-auto, .overflow-y-scroll, [class*="overflow-y-auto"], [class*="overflow-auto"]'
    );
    if (scrollableInModal && scrollableInModal.scrollHeight > scrollableInModal.clientHeight + 10) {
      return scrollableInModal;
    }
    if (modalEl.scrollHeight > modalEl.clientHeight + 10) {
      return modalEl;
    }
  }

  // 2. Selectores de contenedores scrolleables habituales en LibreChat / WAPPY
  const candidateSelectors = [
    'main',
    '[role="main"]',
    '.overflow-y-auto',
    '.overflow-auto',
    '#root main',
    '.chat-container',
    '[data-testid="chat-container"]',
    '.presentation-editor-container',
    '.sgsst-container',
  ];

  for (const sel of candidateSelectors) {
    const matched = Array.from(document.querySelectorAll<HTMLElement>(sel)).filter(isElementVisible);
    for (const el of matched) {
      if (el.closest('.tenshi-widget-container')) continue;
      if (el.scrollHeight > el.clientHeight + 15) {
        return el;
      }
    }
  }

  // 3. Búsqueda profunda en contenedores visibles con overflow-y auto/scroll
  const allElements = Array.from(document.querySelectorAll<HTMLElement>('div, section, article')).filter(isElementVisible);
  for (const el of allElements) {
    if (el.closest('.tenshi-widget-container')) continue;
    const style = window.getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 25) {
      return el;
    }
  }

  return null;
}

/**
 * Ejecuta una acción de UI simulada en un elemento indexado
 */
export async function executeGUIAction(
  action: 'click' | 'escribir' | 'scroll' | 'esperar' | 'leer_pantalla',
  index?: number,
  texto?: string,
  direccion?: 'arriba' | 'abajo',
  detalle?: string
): Promise<{ success: boolean; message: string }> {
  
  if (action === 'leer_pantalla') {
    const content = getVisibleScreenContent();
    return { success: true, message: content };
  }

  if (action === 'esperar') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: 'Espera de 1.5s completada.' };
  }

  // Asegurar que selectorMap esté poblado si está vacío
  if (selectorMap.size === 0) {
    try {
      getDehydratedDOM();
    } catch (e) {
      console.warn('[TenshiPageController] Error al hidratar selectorMap on-demand:', e);
    }
  }

  if (action === 'scroll') {
    // Si se especificó un elemento específico por índice, desplazarlo al centro
    if (index !== undefined && selectorMap.has(index)) {
      const targetEl = selectorMap.get(index)!;
      targetEl.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      await new Promise(resolve => setTimeout(resolve, 600));
      return { success: true, message: `Desplazamiento enfocado en elemento [${index}] (${targetEl.tagName.toLowerCase()}) completado.` };
    }

    const scrollAmount = window.innerHeight * 0.6;
    const delta = direccion === 'arriba' ? -scrollAmount : scrollAmount;

    let targetDesc = 'pantalla principal';
    const container = findActiveScrollContainer();
    if (container) {
      container.scrollBy({
        top: delta,
        behavior: 'smooth'
      });
      const tag = container.tagName.toLowerCase();
      const cls = container.className && typeof container.className === 'string' ? `.${container.className.split(' ')[0]}` : '';
      targetDesc = `contenedor ${tag}${cls}`;
    }

    // Desplazar también window de forma complementaria
    window.scrollBy({
      top: delta,
      behavior: 'smooth'
    });

    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, message: `Desplazamiento hacia ${direccion || 'abajo'} completado en ${targetDesc}.` };
  }

  let el: HTMLElement | null = null;
  let targetIndex = index;

  /**
   * Comprueba con alta tolerancia a sinónimos y variaciones semánticas si un elemento interactivo
   * coincide con la orden o etiqueta buscada por Tenshi.
   */
  function matchesInteractiveTarget(targetElement: HTMLElement, rawQuery: string): boolean {
    if (!targetElement || !rawQuery) return false;
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const q = normalize(rawQuery);
    if (!q) return false;

    const innerText = normalize(targetElement.innerText || '');
    const title = normalize(targetElement.getAttribute('title') || '');
    const ariaLabel = normalize(targetElement.getAttribute('aria-label') || '');
    const id = normalize(targetElement.id || '');
    const name = normalize(targetElement.getAttribute('name') || '');
    const placeholder = normalize(targetElement.getAttribute('placeholder') || '');
    const elData = normalize(targetElement.getAttribute('data-action') || targetElement.getAttribute('data-clickable') || '');
    const labelText = normalize(getInputLabel(targetElement) || '');
    const childSpans = Array.from(targetElement.querySelectorAll('span, p, div, svg, label'))
      .map((s) => normalize((s as HTMLElement).innerText || s.getAttribute('aria-label') || ''))
      .join(' ');

    const allClues = [innerText, title, ariaLabel, id, name, placeholder, elData, labelText, childSpans].filter(Boolean);
    const combined = allClues.join(' ');

    // 1. Coincidencia exacta o inclusión de subcadena directa
    for (const clue of allClues) {
      if (clue === q || clue.includes(q) || (q.length > 3 && q.includes(clue))) return true;
    }

    // 2. Tokenización eliminando stopwords
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'en', 'con', 'por', 'para', 'y', 'o',
      'boton', 'botón', 'clic', 'click', 'haz', 'dale', 'presiona', 'pulsa', 'por favor', 'tu', 'tú',
      'campo', 'casilla', 'cuadro', 'seccion', 'sección', 'escribe', 'escribir', 'pon', 'poner'
    ]);
    const qTokens = q.split(/[\s,._\-+/]+/).filter((t) => t.length > 1 && !stopWords.has(t));
    if (qTokens.length > 0) {
      const allFound = qTokens.every((tok) => combined.includes(tok));
      if (allFound) return true;

      // Tokens semánticos de alta prioridad en WAPPY
      const strongTokens = [
        'generar', 'analisis', 'analizar', 'informe', 'reintegrar', 'reactivar', 'retirar',
        'guardar', 'exportar', 'importar', 'historial', 'descargar', 'plantilla',
        'peligro', 'peligros', 'riesgo', 'riesgos', 'alcance', 'compromiso', 'compromisos',
        'objetivo', 'objetivos', 'norma', 'normas', 'normatividad', 'decreto', 'responsable'
      ];
      for (const st of strongTokens) {
        if (q.includes(st) && combined.includes(st)) return true;
      }
    }

    // 3. Alias específico para botones de Generar IA / Análisis en SGSSTToolbar
    const isAiGenQuery = /generar|analiz|informe|ia\b|reporte/i.test(q);
    const isAiGenBtn = /generar\s+con\s+ia|generar\s+ia|ai-default|sparkles/i.test(combined) || id === 'ai-default';
    if (isAiGenQuery && isAiGenBtn) return true;

    // 4. Mapeo específico de campos de formularios SG-SST
    if (/peligro|riesgo|hazard/i.test(q) && (/peligro|riesgo|hazard/i.test(combined) || id === 'hazards')) return true;
    if (/alcance|scope/i.test(q) && (/alcance|scope/i.test(combined) || id === 'scope')) return true;
    if (/compromiso|commitment/i.test(q) && (/compromiso|commitment/i.test(combined) || id === 'commitments')) return true;
    if (/objetivo|goal/i.test(q) && (/objetivo|goal/i.test(combined) || id === 'objectives')) return true;
    if (/norma|marco|legal|decreto/i.test(q) && (/norma|marco|legal|decreto/i.test(combined) || id === 'additionalnorms')) return true;

    // 5. Pestañas de trabajadores
    if (/retirad/i.test(q) && /retirad/i.test(combined)) return true;
    if (/activ/i.test(q) && /activ/i.test(combined)) return true;
    if (/reintegrar|reactivar/i.test(q) && (/reactivar|reintegrar|activ/i.test(combined))) return true;

    return false;
  }

  // ACCIÓN 1: ESCRIBIR EN CAMPOS / FORMULARIOS
  if (action === 'escribir') {
    try {
      if (texto === undefined) {
        return { success: false, message: 'Se requiere el parámetro "texto" para la acción escribir.' };
      }

      // Query representativa del campo a buscar (detalle o palabras clave)
      const fieldQuery = String(detalle || '').trim() || (texto.length < 40 ? texto : '');

      // 1. Si se dio índice explícito y existe en selectorMap
      if (index !== undefined && selectorMap.has(index)) {
        el = selectorMap.get(index)!;
      }

      // 2. Si no se encontró, buscar en todos los inputs/textareas visibles de la pantalla
      if (!el) {
        const formFields = Array.from(document.querySelectorAll<HTMLElement>(
          'textarea, input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([type="checkbox"]):not([type="radio"])'
        )).filter(isElementVisible);

        if (fieldQuery) {
          for (const field of formFields) {
            if (field.closest('.tenshi-widget-container')) continue;
            if (matchesInteractiveTarget(field, fieldQuery)) {
              el = field;
              break;
            }
          }
        }

        // Si aún no se encuentra y el usuario tiene un campo enfocado
        if (!el && document.activeElement && formFields.includes(document.activeElement as HTMLElement)) {
          el = document.activeElement as HTMLElement;
        }

        // Si aún no se encuentra, usar el primer textarea/input visible vacío
        if (!el && formFields.length > 0) {
          el = formFields.find(f => !(f as HTMLInputElement).value?.trim()) || formFields[0];
        }
      }

      if (!el) {
        return { success: false, message: `No se encontró un campo de texto para escribir "${fieldQuery || 'texto'}" en la pantalla actual.` };
      }

      // Desplazar campo a la vista de inmediato
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });

      // Resaltar visualmente en azul
      const originalOutline = el.style.outline;
      el.style.outline = '4px solid #3b82f6';
      setTimeout(() => {
        if (el) el.style.outline = originalOutline;
      }, 1000);

      el.focus();

      // Simular escritura asegurando compatibilidad completa con el rastreador de estado de React 16-19
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
      const isTextArea = inputEl.tagName.toLowerCase() === 'textarea';
      
      const proto = isTextArea 
        ? window.HTMLTextAreaElement.prototype 
        : window.HTMLInputElement.prototype;
        
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

      // Forzar reseteo del tracker interno de React 18/19 para que detecte la mutación
      const tracker = (inputEl as any)._valueTracker;
      if (tracker) {
        tracker.setValue((inputEl.value || '') + '_force_react_sync');
      }
      
      if (descriptor && descriptor.set) {
        descriptor.set.call(inputEl, texto);
      } else {
        inputEl.value = texto;
      }

      // Disparar secuencia completa de eventos de entrada
      inputEl.dispatchEvent(new Event('focus', { bubbles: true }));
      try {
        inputEl.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, data: texto, inputType: 'insertText' }));
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: texto, inputType: 'insertText' }));
      } catch (ieErr) {
        // Fallback para navegadores antiguos
      }
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      // Invocar directamente el listener de React Props si está disponible
      const reactPropsKey = Object.keys(inputEl).find(k => k.startsWith('__reactProps$'));
      if (reactPropsKey && (inputEl as any)[reactPropsKey]?.onChange) {
        try {
          (inputEl as any)[reactPropsKey].onChange({
            target: inputEl,
            currentTarget: inputEl,
            preventDefault: () => {},
            stopPropagation: () => {},
          });
        } catch (e) {
          console.warn('[TenshiPageController] Llamada directa a reactProps.onChange:', e);
        }
      }

      // Notificar a módulos suscritos sobre la actualización del campo
      window.dispatchEvent(new CustomEvent('wappy-campo-actualizado', {
        detail: {
          id: inputEl.id,
          name: inputEl.getAttribute('name'),
          valor: texto
        }
      }));

      const fieldLabel = getInputLabel(inputEl) || inputEl.id || inputEl.getAttribute('placeholder') || 'campo';
      return { success: true, message: `Texto escrito exitosamente en "${fieldLabel}".` };
    } catch (err: any) {
      return { success: false, message: `Error al escribir: ${err.message}` };
    }
  }

  // ACCIÓN 2: HACER CLIC EN BOTONES O ELEMENTOS INTERACTIVOS
  if (action === 'click') {
    const rawQuery = String(detalle || texto || direccion || '').toLowerCase().trim();
    const isAiGenRequest = /generar|analiz|informe|ia\b|reporte/i.test(rawQuery);

    // Si es una petición de generación IA, disparar también el evento global de análisis
    if (isAiGenRequest) {
      window.dispatchEvent(new CustomEvent('wappy-generar-analisis-ia', { detail: { aplicativo: 'actual' } }));
      window.dispatchEvent(new CustomEvent('wappy-generar-analisis-actual', { detail: { aplicativo: 'actual' } }));
    }

    if (index !== undefined && selectorMap.has(index)) {
      el = selectorMap.get(index)!;
    } else if (rawQuery) {
      // 1. Si es petición de Generar IA, priorizar los botones oficiales de IA
      if (isAiGenRequest) {
        const aiButtons = Array.from(document.querySelectorAll<HTMLElement>(
          '#ai-default, [data-action="ai-default"], [data-action="generar-analisis-ia"], [id="btn-generar-responsable-ia"], button[title*="Generar"], button[aria-label*="Generar"]'
        )).filter(isElementVisible);

        if (aiButtons.length > 0) {
          el = aiButtons[0];
        }
      }

      // 2. Buscar en selectorMap con matchesInteractiveTarget
      if (!el) {
        for (const [idx, itemEl] of selectorMap.entries()) {
          if (matchesInteractiveTarget(itemEl, rawQuery)) {
            el = itemEl;
            targetIndex = idx;
            break;
          }
        }
      }

      // 3. Buscar en todos los elementos interactivos del DOM visible
      if (!el) {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>(
          'button, [role="button"], [role="tab"], a, input[type="button"], input[type="submit"], [tabindex="0"], summary, [data-action], [data-clickable]'
        )).filter(isElementVisible);

        for (const cand of candidates) {
          if (cand.closest('.tenshi-widget-container')) continue;
          if (matchesInteractiveTarget(cand, rawQuery)) {
            el = cand;
            break;
          }
        }
      }
    }

    if (!el) {
      return { success: false, message: `No se encontró el elemento interactivo [${index !== undefined ? index : (rawQuery || 'N/A')}] en la pantalla actual.` };
    }

    try {
      // Desplazar elemento a la vista de inmediato
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });

      // Resaltar visualmente en verde
      const originalOutline = el.style.outline;
      el.style.outline = '4px solid #10b981';
      setTimeout(() => {
        if (el) el.style.outline = originalOutline;
      }, 800);

      const coords = el.getBoundingClientRect();
      const clientX = coords.left + coords.width / 2;
      const clientY = coords.top + coords.height / 2;

      const pOpts = { bubbles: true, cancelable: true, view: window, clientX, clientY, pointerId: 1, isPrimary: true, pointerType: 'mouse' };
      const mOpts = { bubbles: true, cancelable: true, view: window, clientX, clientY };

      el.dispatchEvent(new PointerEvent('pointerover', pOpts));
      el.dispatchEvent(new PointerEvent('pointerenter', { ...pOpts, bubbles: false }));
      el.dispatchEvent(new MouseEvent('mouseover', mOpts));
      el.dispatchEvent(new MouseEvent('mouseenter', { ...mOpts, bubbles: false }));
      
      el.dispatchEvent(new PointerEvent('pointerdown', pOpts));
      el.dispatchEvent(new MouseEvent('mousedown', mOpts));
      
      el.focus();
      
      el.dispatchEvent(new PointerEvent('pointerup', pOpts));
      el.dispatchEvent(new MouseEvent('mouseup', mOpts));
      el.dispatchEvent(new MouseEvent('click', mOpts));
      
      el.click();

      // Invocar directamente el listener React onClick para Framer Motion o Radix
      const reactPropsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
      if (reactPropsKey && (el as any)[reactPropsKey]?.onClick) {
        try {
          (el as any)[reactPropsKey].onClick({
            preventDefault: () => {},
            stopPropagation: () => {},
            target: el,
            currentTarget: el
          });
        } catch (e) {
          console.warn('[TenshiPageController] Llamada directa a reactProps.onClick:', e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 400));

      const elTag = el.tagName.toLowerCase();
      const elLabel = (el.innerText || el.getAttribute('title') || el.getAttribute('aria-label') || '').trim();
      return { success: true, message: `Clic ejecutado exitosamente en "${elLabel || elTag}" [${targetIndex !== undefined ? targetIndex : 'directo'}].` };
    } catch (err: any) {
      return { success: false, message: `Error al hacer clic: ${err.message}` };
    }
  }

  return { success: false, message: `Acción "${action}" no soportada.` };
}
