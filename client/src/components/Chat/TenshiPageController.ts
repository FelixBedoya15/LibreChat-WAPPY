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
  const viewWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewHeight = window.innerHeight || document.documentElement.clientHeight;

  // Si tiene dimensiones cero, o está oculto por estilos, no es visible
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  // Verificar si se cruza con el viewport
  return (
    rect.top < viewHeight &&
    rect.bottom > 0 &&
    rect.left < viewWidth &&
    rect.right > 0
  );
}

/**
 * Determina si un elemento HTML es interactivo
 */
function isInteractive(el: HTMLElement): boolean {
  const tagName = el.tagName.toLowerCase();
  
  // Elementos interactivos nativos
  if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
    return true;
  }

  // Roles interactivos de ARIA
  const role = el.getAttribute('role');
  if (role && ['button', 'link', 'checkbox', 'radio', 'tab', 'menuitem', 'option'].includes(role)) {
    return true;
  }

  // Si no es un elemento interactivo nativo ni tiene rol interactivo explícito,
  // y además contiene elementos interactivos nativos adentro, no lo tratamos como interactivo.
  // Esto evita que la IA haga clic en contenedores padres gigantes (ej: divs del sidebar).
  if (!['button', 'input', 'select', 'textarea', 'a'].includes(tagName) && role !== 'button' && role !== 'link') {
    const hasInteractiveChildren = el.querySelector('button, input, select, textarea, a, [role="button"], [role="link"]') !== null;
    if (hasInteractiveChildren) {
      return false;
    }
  }

  // Si tiene un cursor de puntero configurado por CSS
  const style = window.getComputedStyle(el);
  if (style.cursor === 'pointer') {
    return true;
  }

  // Elementos con evento click (aproximación)
  if (el.onclick || el.getAttribute('onclick')) {
    return true;
  }

  return false;
}

/**
 * Obtiene el texto representativo o la etiqueta del elemento
 */
function getElementText(el: HTMLElement): string {
  const label = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder');
  if (label) return label.trim();

  // Texto interno limpio, truncado si es demasiado largo
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  return text.length > 50 ? text.substring(0, 47) + '...' : text;
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

      const indent = '\t'.repeat(depth);

      if (isInteractive(htmlEl)) {
        const idx = index++;
        selectorMap.set(idx, htmlEl);

        const tagName = htmlEl.tagName.toLowerCase();
        const type = htmlEl.getAttribute('type') || '';
        const placeholder = htmlEl.getAttribute('placeholder') || '';
        const value = (htmlEl as any).value || '';
        const checked = (htmlEl as any).checked ? 'checked' : '';
        const text = getElementText(htmlEl);

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
        // Si es un contenedor con texto directo útil, capturar el texto
        const childNodes = Array.from(htmlEl.childNodes);
        const hasDirectText = childNodes.some(
          node => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()
        );
        
        if (hasDirectText && depth < 4) {
          const text = (htmlEl.innerText || '').trim().replace(/\s+/g, ' ');
          if (text && text.length < 150) {
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
 * Ejecuta una acción de UI simulada en un elemento indexado
 */
export async function executeGUIAction(
  action: 'click' | 'escribir' | 'scroll' | 'esperar',
  index?: number,
  texto?: string,
  direccion?: 'arriba' | 'abajo'
): Promise<{ success: boolean; message: string }> {
  
  if (action === 'esperar') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, message: 'Espera de 1.5s completada.' };
  }

  if (action === 'scroll') {
    const scrollAmount = window.innerHeight * 0.6;
    window.scrollBy({
      top: direccion === 'abajo' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, message: `Desplazamiento hacia ${direccion} completado.` };
  }

  if (index === undefined || !selectorMap.has(index)) {
    return { success: false, message: `El índice [${index}] no existe en la pantalla actual.` };
  }

  const el = selectorMap.get(index)!;

  // Desplazar elemento a la vista
  el.scrollIntoView({ block: 'center', inline: 'center' });
  await new Promise(resolve => setTimeout(resolve, 300));

  if (action === 'click') {
    try {
      // Resaltar visualmente el elemento temporalmente
      const originalOutline = el.style.outline;
      el.style.outline = '4px solid #10b981';
      setTimeout(() => {
        el.style.outline = originalOutline;
      }, 800);

      // Secuencia de eventos para simular comportamiento humano
      const coords = el.getBoundingClientRect();
      const clientX = coords.left + coords.width / 2;
      const clientY = coords.top + coords.height / 2;

      const opts = { bubbles: true, cancelable: true, clientX, clientY };

      el.dispatchEvent(new PointerEvent('pointerover', { ...opts, pointerType: 'mouse' }));
      el.dispatchEvent(new PointerEvent('pointerenter', { ...opts, pointerType: 'mouse', bubbles: false }));
      el.dispatchEvent(new MouseEvent('mouseover', opts));
      el.dispatchEvent(new MouseEvent('mouseenter', { ...opts, bubbles: false }));
      
      el.dispatchEvent(new PointerEvent('pointerdown', { ...opts, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      
      el.focus();
      
      el.dispatchEvent(new PointerEvent('pointerup', { ...opts, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      
      el.click();
      
      // Esperar a que la SPA procese la navegación o transición y renderice la nueva UI
      await new Promise(resolve => setTimeout(resolve, 800));

      return { success: true, message: `Clic ejecutado en el elemento [${index}] (${el.tagName.toLowerCase()}).` };
    } catch (err: any) {
      return { success: false, message: `Error al hacer clic: ${err.message}` };
    }
  }

  if (action === 'escribir') {
    try {
      if (texto === undefined) {
        return { success: false, message: 'Se requiere el parámetro "texto" para la acción escribir.' };
      }

      // Resaltar
      const originalOutline = el.style.outline;
      el.style.outline = '4px solid #3b82f6';
      setTimeout(() => {
        el.style.outline = originalOutline;
      }, 800);

      el.focus();

      // Simular escritura asegurando compatibilidad con el rastreador de estado de React 16+
      const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
      const isTextArea = inputEl.tagName.toLowerCase() === 'textarea';
      
      const prototype = isTextArea 
        ? window.HTMLTextAreaElement.prototype 
        : window.HTMLInputElement.prototype;
        
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      
      if (descriptor && descriptor.set) {
        descriptor.set.call(inputEl, texto);
      } else {
        inputEl.value = texto;
      }

      // Disparar eventos nativos para que React detecte la mutación
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      return { success: true, message: `Texto "${texto}" escrito en elemento [${index}].` };
    } catch (err: any) {
      return { success: false, message: `Error al escribir: ${err.message}` };
    }
  }

  return { success: false, message: `Acción "${action}" no soportada.` };
}
