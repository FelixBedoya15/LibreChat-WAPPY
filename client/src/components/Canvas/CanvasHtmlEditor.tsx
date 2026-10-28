import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRecoilState } from 'recoil';
import store from '~/store';
import { saveAs } from 'file-saver';
import { cn } from '~/utils';
import { 
  Eye, 
  Code2, 
  Download, 
  Play, 
  Split, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Cpu, 
  Plus,
  Lock,
  Maximize,
  Minimize,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { PREMIUM_SST_COMPONENTS } from './sstTemplates';
import CanvasWorkspaceBridge from './CanvasWorkspaceBridge';

interface CanvasHtmlEditorProps {
  initialContent: string;
  onUpdate: (content: string) => void;
  title: string;
  isMaximized?: boolean;
  onRegisterDownload?: (fn: () => void) => void;
}

const renderIcon = (type: string, colorClass: string) => {
  switch (type) {
    case 'Cpu':
      return <Cpu className={`h-4 w-4 ${colorClass}`} />;
    case 'Layers':
      return <Layers className={`h-4 w-4 ${colorClass}`} />;
    case 'Plus':
      return <Plus className={`h-4 w-4 ${colorClass}`} />;
    case 'Eye':
      return <Eye className={`h-4 w-4 ${colorClass}`} />;
    case 'Sparkles':
      return <Sparkles className={`h-4 w-4 ${colorClass}`} />;
    default:
      return <Cpu className={`h-4 w-4 ${colorClass}`} />;
  }
};

/**
 * Limpia bloques de código o etiquetas residuales generadas por el LLM
 */
function cleanHtmlContent(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  cleaned = cleaned.replace(/^```(?:html|xml)?\s*\n?([\s\S]*?)\n?```$/i, '$1').trim();
  return cleaned;
}

/**
 * Inyecta shims seguros y estilos base para que presentaciones interactivas (Reveal.js, Swiper, custom sliders)
 * y páginas HTML se rendericen de forma impecable sin excepciones dentro del iframe en vista previa.
 */
function preparePreviewHtml(html: string, isForDownload: boolean = false): string {
  if (!html) return '';
  let content = cleanHtmlContent(html);

  // Limpiar cualquier bloque previo de estilos autónomos o guard de modales embebido en el HTML de la base de datos
  content = content
    .replace(/<style id="__wappy_standalone_design_system__">[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script id="__wappy_modal_guard__">[\s\S]*?<\/script>\s*/gi, '');

  // Sanitizar cualquier SVG con path orgánico decorativo que use fill="currentColor" para evitar que pinte en negro
  content = content.replace(/(<svg[^>]*>[\s\S]*?<path[^>]*?)fill="currentColor"/gi, '$1fill="rgba(255,255,255,0.25)"');

  const hasHtml = /<html[^>]*>/i.test(content);
  const hasHead = /<head[^>]*>/i.test(content);
  const isDarkDocument = /bg-\[#0b0f19\]|dark|slate-900|slate-950|gradient-banner/i.test(content);

  const safeShim = `
<script>
(function() {
  // 1. Shims resilientes para librerías comunes (Lucide, Chart.js)
  // No sobreescribimos window.tailwind antes de tiempo para no sabotear el motor JIT de Tailwind CDN
  if (typeof window.lucide === 'undefined') {
    window.lucide = {
      createIcons: function() {
        try {
          if (document.querySelectorAll) {
            var iconEls = document.querySelectorAll('[data-lucide], i[class*="lucide-"]');
          }
        } catch(e) {}
      }
    };
  }
  if (typeof window.Chart === 'undefined') {
    window.Chart = function() {
      return {
        destroy: function() {},
        update: function() {},
        resize: function() {},
        data: { datasets: [] }
      };
    };
  }

  // 2. Polyfill seguro y robusto para localStorage / sessionStorage en iframe sandboxed y visores locales
  var _createMockStorage = function() {
    var _memStore = {};
    return {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(_memStore, k) ? _memStore[k] : null; },
      setItem: function(k, v) { _memStore[k] = String(v); },
      removeItem: function(k) { delete _memStore[k]; },
      clear: function() { _memStore = {}; },
      key: function(i) { return Object.keys(_memStore)[i] || null; },
      get length() { return Object.keys(_memStore).length; }
    };
  };

  try {
    var _testK = '__wappy_test__';
    window.localStorage.setItem(_testK, _testK);
    window.localStorage.removeItem(_testK);
  } catch (e) {
    try {
      var _mockLocal = _createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: _mockLocal,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.localStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  try {
    var _sKey = '__wappy_stest__';
    window.sessionStorage.setItem(_sKey, _sKey);
    window.sessionStorage.removeItem(_sKey);
  } catch (e) {
    try {
      var _mockSession = _createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: _mockSession,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.sessionStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  // 3. Polyfill seguro para history.pushState / history.replaceState
  try {
    var _origPush = window.history.pushState;
    window.history.pushState = function() {
      try {
        if (_origPush) return _origPush.apply(window.history, arguments);
      } catch (err) {}
    };
    var _origReplace = window.history.replaceState;
    window.history.replaceState = function() {
      try {
        if (_origReplace) return _origReplace.apply(window.history, arguments);
      } catch (err) {}
    };
  } catch (e) {}

  // 4. Manejador global de excepciones para evitar que un error no capturado congele la interfaz
  window.addEventListener('error', function(e) {
    console.warn('[Canvas Sandbox Script Warning]:', e.message, 'en', e.filename, ':', e.lineno);
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.warn('[Canvas Sandbox Unhandled Rejection]:', e.reason);
  });

  // 5. Disparador de eventos de resize, iconos y readiness para reactivar scripts interactivos
  function _autoHideInitialBlockingModals() {
    try {
      // 1) Asegurar que todo elemento fijo o modal con la clase .hidden tenga display: none !important
      var hiddenEls = document.querySelectorAll('.hidden');
      hiddenEls.forEach(function(el) {
        if (el.classList.contains('fixed') || (el.id && el.id.toLowerCase().indexOf('modal') !== -1)) {
          el.classList.remove('flex', 'block', 'grid');
          el.style.setProperty('display', 'none', 'important');
        }
      });

      // 2) Ocultar cualquier modal de asistente, diagnóstico o ayuda que esté tapando la pantalla al iniciar
      var overlays = document.querySelectorAll('.fixed.inset-0, [id*="modal"], [id*="assistant"], [id*="asistente"]');
      overlays.forEach(function(el) {
        var text = (el.innerText || '').toLowerCase();
        var id = (el.id || '').toLowerCase();
        if (
          id === 'modalia' ||
          id.indexOf('modal') !== -1 ||
          id.indexOf('assistant') !== -1 ||
          id.indexOf('asistente') !== -1 ||
          id.indexOf('help') !== -1 ||
          id.indexOf('info') !== -1 ||
          text.indexOf('asistente virtual') !== -1 ||
          text.indexOf('diagnóstico automático') !== -1 ||
          text.indexOf('causas frecuentes') !== -1 ||
          text.indexOf('información importante') !== -1 ||
          text.indexOf('cumplimiento legal') !== -1 ||
          text.indexOf('wappy ai copilot') !== -1
        ) {
          if (el.id !== 'wappy-ai-floating-btn' && el.id !== 'wappy-ai-floating-trigger') {
            _closeModalElement(el);
          }
        }
      });
    } catch (e) {}
  }

  function _kickstartApp() {
    try {
      _autoHideInitialBlockingModals();
      if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      window.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }

  // 6. Manejador Universal de Cierre y Apertura de Modales y Drawers (Evita recuadros bloqueados o sin función de cierre)
  function _closeModalElement(modalEl) {
    if (!modalEl) return;
    try {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('flex', 'block', 'grid', 'open', 'active', 'show');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.setAttribute('aria-hidden', 'true');
      // Si es un drawer lateral que usa translate-x-full
      if (modalEl.id === 'ai-drawer' || modalEl.className.indexOf('right-0') !== -1) {
        modalEl.classList.add('translate-x-full');
      }
    } catch (e) {}
  }

  function _openModalElement(modalEl) {
    if (!modalEl) return;
    try {
      modalEl.style.removeProperty('display');
      modalEl.classList.remove('hidden', 'translate-x-full');
      if (!modalEl.classList.contains('flex') && !modalEl.classList.contains('block') && !modalEl.classList.contains('grid')) {
        modalEl.classList.add('flex');
      }
      modalEl.setAttribute('aria-hidden', 'false');
    } catch (e) {}
  }

  // Interceptar classList.remove('hidden') para limpiar cualquier display:none inline previo cuando el usuario sí quiera abrir un modal
  try {
    var _origClassListRemove = DOMTokenList.prototype.remove;
    DOMTokenList.prototype.remove = function() {
      var res = _origClassListRemove.apply(this, arguments);
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] === 'hidden' || arguments[i] === 'translate-x-full') {
          try {
            var hiddenFixed = document.querySelectorAll('[style*="display: none"]');
            hiddenFixed.forEach(function(el) {
              if (!el.classList.contains('hidden')) {
                el.style.removeProperty('display');
              }
            });
          } catch (err) {}
          break;
        }
      }
      return res;
    };
  } catch (e) {}

  // Funciones globales de respaldo por si el HTML generado las invoca pero olvidó definirlas
  var _fallbackCloseFns = [
    'closeModal', 'closeAssistant', 'closeAiModal', 'closeLegalModal',
    'closeImportantInfoModal', 'cerrarModal', 'cerrarModalIA', 'cerrarAsistente', 'hideModal',
    'dismissModal', 'toggleModal', 'closeSyncModal', 'ejecutarSincronizacion', 'syncCanvas'
  ];
  _fallbackCloseFns.forEach(function(fnName) {
    if (typeof window[fnName] !== 'function') {
      window[fnName] = function() {
        var overlays = document.querySelectorAll('.fixed.inset-0, [id*="modal"], [id*="assistant"], [id*="asistente"], [id*="dialog"], [role="dialog"]');
        overlays.forEach(function(el) { _closeModalElement(el); });
      };
    }
  });

  // Delegación global de clics para botones de cerrar (✕, X, Cerrar, Entendido), botón flotante de Asistente IA y clic en el fondo oscuro (backdrop)
  document.addEventListener('click', function(e) {
    try {
      var target = e.target;
      if (!target || typeof target.closest !== 'function') return;

      // A) Clic directo en el backdrop oscuro (div.fixed.inset-0) fuera de la tarjeta del modal
      if (
        target.classList &&
        target.classList.contains('fixed') &&
        target.classList.contains('inset-0') &&
        target.children.length > 0
      ) {
        _closeModalElement(target);
        return;
      }

      // B) Clic en el botón flotante #wappy-ai-floating-btn si no tiene handler propio
      var floatingBtn = target.closest('#wappy-ai-floating-btn, #wappy-ai-floating-trigger');
      if (floatingBtn && !floatingBtn.getAttribute('onclick')) {
        var drawer = document.querySelector('#wappy-ai-chat-drawer, #ai-drawer, [id*="assistant-modal"], [id*="ai-modal"], [id*="asistente"]');
        if (drawer) {
          if (drawer.classList.contains('hidden') || drawer.classList.contains('translate-x-full')) {
            _openModalElement(drawer);
          } else {
            _closeModalElement(drawer);
          }
          return;
        }
      }

      // C) Clic en un botón de cierre dentro de cualquier modal/overlay fijo
      var btn = target.closest('button, [role="button"], a, .cursor-pointer');
      if (!btn) return;

      var modalContainer = btn.closest('.fixed.inset-0, [id*="modal"], [id*="dialog"], [id*="assistant"], [id*="asistente"], [role="dialog"], #wappy-ai-chat-drawer, #ai-drawer');
      if (!modalContainer) return;

      var rawText = (btn.innerText || btn.textContent || '').trim();
      var cleanText = rawText.toLowerCase();
      var ariaLabel = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      var onclickAttr = (btn.getAttribute('onclick') || '').toLowerCase();
      var hasXIcon = btn.querySelector('[data-lucide="x"], .lucide-x, svg line[x1="18"][y1="6"], svg path[d*="M18 6"], svg path[d*="6 18"], svg path[d*="M6 18"], svg path[d*="18 6"]');

      var isCloseAction =
        cleanText === 'x' ||
        cleanText === '✕' ||
        cleanText === '✖' ||
        cleanText === '×' ||
        cleanText === 'cerrar' ||
        cleanText === 'entendido' ||
        cleanText === 'ocultar' ||
        cleanText === 'salir' ||
        cleanText === 'aceptar' ||
        cleanText === 'continuar' ||
        ariaLabel.indexOf('cerrar') !== -1 ||
        ariaLabel.indexOf('close') !== -1 ||
        onclickAttr.indexOf('close') !== -1 ||
        onclickAttr.indexOf('cerrar') !== -1 ||
        onclickAttr.indexOf('hide') !== -1 ||
        onclickAttr.indexOf('dismiss') !== -1 ||
        onclickAttr.indexOf('sincronizar') !== -1 ||
        cleanText.indexOf('ejecutar sincronización') !== -1 ||
        Boolean(hasXIcon && cleanText.length <= 2);

      if (isCloseAction) {
        setTimeout(function() {
          _closeModalElement(modalContainer);
        }, 10);
      }
    } catch (err) {}
  }, true);

  // Cerrar cualquier modal abierto con la tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var overlays = document.querySelectorAll('.fixed.inset-0:not(.hidden), [id*="modal"]:not(.hidden), [id*="assistant"]:not(.hidden), [id*="asistente"]:not(.hidden), [role="dialog"]:not(.hidden)');
      overlays.forEach(function(el) { _closeModalElement(el); });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _kickstartApp);
  } else {
    setTimeout(_kickstartApp, 50);
    setTimeout(_kickstartApp, 250);
    setTimeout(_kickstartApp, 600);
  }
})();
</script>
`;

  // Estilos CSS Autónomos Blindados (Zero-Dependency) para garantizar visualización corporativa impecable
  // incluso si WhatsApp, iOS QuickLook o el teléfono están offline y bloquean los CDNs externos
  const responsiveBaseStyle = `
<style id="__wappy_standalone_design_system__">
  /* ── 1. Reset Móvil y Tipografía de Sistema ── */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    overflow-x: hidden !important;
    max-width: 100vw;
    -webkit-text-size-adjust: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    background-color: ${isDarkDocument ? '#0b0f19' : '#ffffff'} !important;
    color: ${isDarkDocument ? '#f8fafc' : '#1e293b'} !important;
  }

  img, canvas, svg, video {
    max-width: 100%;
  }

  /* ── 2. Banner Superior WAPPY (Degradado Esmeralda/Cyan & Banner Institucional) ── */
  .gradient-banner {
    background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%) !important;
    color: #ffffff !important;
    position: relative !important;
    overflow: hidden !important;
    border-radius: 1.5rem !important;
    padding: 1.5rem !important;
    margin-bottom: 1.5rem !important;
    box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.35) !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
  }
  @media (min-width: 768px) {
    .gradient-banner {
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 2rem !important;
    }
  }
  .gradient-banner h1 {
    font-size: clamp(1.2rem, 4vw, 1.85rem) !important;
    font-weight: 900 !important;
    margin: 0 !important;
    line-height: 1.2 !important;
    color: #ffffff !important;
    letter-spacing: -0.02em !important;
  }
  .gradient-banner h2 {
    font-size: clamp(0.75rem, 2.5vw, 0.875rem) !important;
    font-weight: 700 !important;
    margin: 0.25rem 0 0 0 !important;
    color: #ccfbf1 !important;
    letter-spacing: 0.05em !important;
  }
  .gradient-banner p {
    font-size: 0.75rem !important;
    margin: 0.25rem 0 0 0 !important;
    color: #a5f3fc !important;
  }

  /* Banner Oficial Institucional de Informes (wappy-standard-header-banner) */
  .wappy-standard-header-banner {
    box-sizing: border-box !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 20px !important;
  }
  .wappy-header-logo-container {
    flex-shrink: 0 !important;
    order: 1 !important;
  }
  .wappy-header-title-box {
    flex-grow: 1 !important;
    min-width: 0 !important;
    order: 2 !important;
  }
  .wappy-header-badge-container {
    flex-shrink: 0 !important;
    order: 3 !important;
  }

  @media (max-width: 640px) {
    .wappy-standard-header-banner {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      grid-template-areas:
        "logo . badge"
        "title title title" !important;
      gap: 12px 10px !important;
      padding: 14px 16px !important;
      border-radius: 16px !important;
      align-items: center !important;
    }
    .wappy-header-logo-container {
      grid-area: logo !important;
      width: 46px !important;
      height: 46px !important;
      min-width: 46px !important;
      padding: 6px !important;
      border-radius: 12px !important;
    }
    .wappy-header-logo-container img {
      max-height: 32px !important;
      max-width: 70px !important;
    }
    .wappy-header-badge-container {
      grid-area: badge !important;
      justify-self: end !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
    }
    .wappy-header-badge-container span {
      font-size: 8px !important;
      letter-spacing: 0.3px !important;
    }
    .wappy-header-title-box {
      grid-area: title !important;
      width: 100% !important;
      min-width: 0 !important;
      margin-top: 4px !important;
    }
    .wappy-header-title-box h1 {
      font-size: 13.5px !important;
      line-height: 1.3 !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    /* Tablas Corporativas Adaptativas en Celular */
    .wappy-entity-table, .wappy-worker-table {
      display: block !important;
      width: 100% !important;
      table-layout: auto !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    .wappy-entity-table thead, .wappy-entity-table tbody,
    .wappy-worker-table thead, .wappy-worker-table tbody {
      display: block !important;
      width: 100% !important;
    }
    .wappy-entity-table thead tr, .wappy-worker-table thead tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-entity-table thead th, .wappy-worker-table thead th {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 8px 12px !important;
      font-size: 10px !important;
      text-align: center !important;
      white-space: normal !important;
      word-break: normal !important;
      line-height: 1.35 !important;
    }
    .wappy-entity-table tbody tr {
      display: grid !important;
      grid-template-columns: 105px 1fr !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody tr {
      display: grid !important;
      grid-template-columns: 125px 1fr !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody tr:last-child,
    .wappy-worker-table tbody tr:last-child {
      border-bottom: none !important;
    }
    .wappy-entity-table tbody td,
    .wappy-worker-table tbody td {
      display: block !important;
      box-sizing: border-box !important;
      padding: 6px 10px !important;
      font-size: 10.5px !important;
      line-height: 1.3 !important;
      width: auto !important;
      word-break: break-word !important;
      border: none !important;
    }
    .wappy-entity-table tbody td:nth-child(1) {
      font-weight: 700 !important;
      background-color: #f8fafc !important;
      color: #334155 !important;
      border-right: 1px solid #e2e8f0 !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(1) {
      font-weight: 700 !important;
      background-color: #f0fdfa !important;
      color: #0f766e !important;
      border-right: 1px solid #ccfbf1 !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(2) {
      background-color: #ffffff !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(2) {
      background-color: #ffffff !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(3) {
      font-weight: 700 !important;
      background-color: #f8fafc !important;
      color: #334155 !important;
      border-right: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(3) {
      font-weight: 700 !important;
      background-color: #f0fdfa !important;
      color: #0f766e !important;
      border-right: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(4),
    .wappy-worker-table tbody td:nth-child(4) {
      background-color: #ffffff !important;
    }
    .wappy-entity-table tbody td[colspan="3"],
    .wappy-worker-table tbody td[colspan="3"] {
      grid-column: 2 / -1 !important;
      border-bottom: none !important;
    }
    .wappy-entity-table tbody tr:has(td[colspan="3"]) td:nth-child(1),
    .wappy-worker-table tbody tr:has(td[colspan="3"]) td:nth-child(1) {
      border-bottom: none !important;
    }
    
    /* Bloques de Firmas Adaptativas */
    .wappy-signature-table, .wappy-signature-table tbody, .wappy-signature-table tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-signature-table td {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 12px 6px !important;
    }
    .wappy-committee-table, .wappy-committee-table tbody, .wappy-committee-table tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-committee-table td {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 6px 0 !important;
    }
  }

  /* ── 3. Tarjetas, Paneles y Contenedores ── */
  .bg-slate-900\\/60, .glass-card, [class*="bg-slate-900"], [class*="bg-slate-950"] {
    background-color: ${isDarkDocument ? 'rgba(15, 23, 42, 0.75)' : '#ffffff'} !important;
    border: 1px solid ${isDarkDocument ? 'rgba(51, 65, 85, 0.7)' : '#e2e8f0'} !important;
    border-radius: 1rem !important;
    padding: 1.25rem !important;
    margin-bottom: 1.25rem !important;
    color: ${isDarkDocument ? '#f8fafc' : '#1e293b'} !important;
  }

  /* ── 4. Tablas Técnicas Responsivas ── */
  .overflow-x-auto {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  table:not(.wappy-entity-table):not(.wappy-worker-table):not(.wappy-signature-table):not(.wappy-committee-table) {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 0.875rem !important;
    text-align: left !important;
  }
  th:not(.wappy-entity-table th):not(.wappy-worker-table th) {
    background-color: ${isDarkDocument ? 'rgba(30, 41, 59, 0.85)' : '#f1f5f9'} !important;
    color: ${isDarkDocument ? '#94a3b8' : '#475569'} !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 0.75rem 1rem !important;
    border-bottom: 2px solid ${isDarkDocument ? 'rgba(51, 65, 85, 0.8)' : '#cbd5e1'} !important;
  }
  td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid ${isDarkDocument ? 'rgba(51, 65, 85, 0.4)' : '#e2e8f0'} !important;
    color: ${isDarkDocument ? '#e2e8f0' : '#1e293b'} !important;
  }
  @media (max-width: 640px) {
    th:not(.wappy-entity-table th):not(.wappy-worker-table th),
    td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
      padding: 0.5rem 0.6rem !important;
      font-size: 0.75rem !important;
    }
  }

  /* ── 5. Controles de Formulario Móviles (Evitar aspecto crudo de iOS/Safari) ── */
  select, input[type="text"], input[type="number"], input[type="date"], input[type="email"], textarea {
    font-family: inherit !important;
    border: 1px solid ${isDarkDocument ? '#334155' : '#cbd5e1'} !important;
    border-radius: 0.625rem !important;
    padding: 0.55rem 0.85rem !important;
    outline: none !important;
    background-color: ${isDarkDocument ? '#1e293b' : '#ffffff'} !important;
    color: ${isDarkDocument ? '#f8fafc' : '#0f172a'} !important;
    font-size: 0.875rem !important;
    max-width: 100% !important;
    transition: border-color 0.2s ease-in-out !important;
  }
  select:focus, input:focus, textarea:focus {
    border-color: #0d9488 !important;
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25) !important;
  }

  /* ── 6. Botones Principales ── */
  button, [type="button"], [type="reset"], [type="submit"] {
    font-family: inherit !important;
    border-radius: 0.625rem !important;
    padding: 0.5rem 1rem !important;
    font-weight: 700 !important;
    font-size: 0.8125rem !important;
    cursor: pointer !important;
    border: 1px solid ${isDarkDocument ? 'rgba(51, 65, 85, 0.8)' : '#cbd5e1'} !important;
    background-color: ${isDarkDocument ? '#1e293b' : '#f1f5f9'} !important;
    color: ${isDarkDocument ? '#f8fafc' : '#0f172a'} !important;
    transition: all 0.2s ease-in-out !important;
  }
  button:active, [type="button"]:active {
    transform: scale(0.97) !important;
  }

  /* ── 7. Utilidades Base (Respetando estrictamente .hidden sobre .flex / .block / .grid) ── */
  .overflow-hidden { overflow: hidden !important; }
  .absolute { position: absolute !important; }
  .relative { position: relative !important; }
  .flex:not(.hidden) { display: flex !important; }
  .items-center { align-items: center !important; }
  .justify-between { justify-content: space-between !important; }
  .gap-2 { gap: 0.5rem !important; }
  .gap-4 { gap: 1rem !important; }
  .hidden,
  [hidden],
  .hidden.flex,
  .hidden.block,
  .hidden.grid,
  .hidden.inline-flex,
  .hidden.inline-block {
    display: none !important;
  }

  /* ── 8. SVGs de Fondo Protegidos ── */
  .gradient-banner svg,
  .opacity-10 svg,
  svg[viewBox="0 0 200 200"] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0.15 !important;
    fill: rgba(255, 255, 255, 0.25) !important;
    color: rgba(255, 255, 255, 0.25) !important;
    pointer-events: none !important;
  }
</style>
`;

  // Scripts de Core: Si se descarga, usar URLs absolutas del CDN público para portabilidad offline/móvil completa
  const coreScripts = isForDownload
    ? `
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  if (window.tailwind) {
    tailwind.config = { darkMode: 'class' };
  }
</script>
`
    : `
<script src="/assets/tailwind-cdn.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://cdn.tailwindcss.com'; document.head.appendChild(s);"></script>
<script src="/assets/lucide.min.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://unpkg.com/lucide@latest'; document.head.appendChild(s);"></script>
<script src="/assets/chart.min.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js'; document.head.appendChild(s);"></script>
<script>
  if (window.tailwind) {
    tailwind.config = { darkMode: 'class' };
  }
</script>
`;

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(content);
  const viewportMeta = hasViewport ? '' : '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n';

  if (!hasHtml) {
    content = `<!DOCTYPE html>
<html lang="es" ${isDarkDocument ? 'class="dark"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${coreScripts}
  ${safeShim}
  ${responsiveBaseStyle}
</head>
<body class="${isDarkDocument ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'}">
  ${content}
</body>
</html>`;
  } else if (hasHead) {
    content = content.replace(/<head[^>]*>/i, (match) => `${match}\n${viewportMeta}${coreScripts}${safeShim}\n${responsiveBaseStyle}`);
  } else {
    content = content.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${viewportMeta}${coreScripts}${safeShim}\n${responsiveBaseStyle}\n</head>`);
  }

  return content;
}

const CanvasHtmlEditor: React.FC<CanvasHtmlEditorProps> = ({ 
  initialContent, 
  onUpdate, 
  title, 
  isMaximized = false, 
  onRegisterDownload 
}) => {
  const { user } = useAuthContext();
  const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO' || user?.role === 'USER_IPEVAR' || user?.role === 'IPEVAR';
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'split' | 'code' | 'preview'>(isMaximized ? 'split' : 'preview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [isCanvasMaximized, setIsCanvasMaximized] = useRecoilState<boolean>(store.canvasMaximized);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBridgeOpen, setIsBridgeOpen] = useState<boolean>(false);

  const handleInjectHtmlBlock = (htmlBlock: string) => {
    const current = code || '';
    let updated = '';
    if (/<\/body>/i.test(current)) {
      updated = current.replace(/<\/body>/i, `\n${htmlBlock}\n</body>`);
    } else {
      updated = `${current}\n${htmlBlock}`;
    }
    setCode(updated);
    onUpdate(updated);
    setIframeKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    // Si entra a pantalla completa, maximiza también el canvas general
    if (nextState) {
      setIsCanvasMaximized(true);
    }

    const el = iframeContainerRef.current || containerRef.current;
    if (nextState) {
      try {
        if (el?.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
      } catch (_) {
        // En iOS Safari / navegadores que no soportan Fullscreen API en divs, el modo CSS fixed cubre el 100% de la pantalla
      }
    } else {
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (_) {}
    }
  };

  // Safely fallback activeTab to "preview" if not maximized or on mobile screen and currently in "split"
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      if ((!isMaximized || isMobile) && activeTab === 'split') {
        setActiveTab('preview');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMaximized, activeTab]);

  // Load content with Tailwind CDN included by default for instant premium styling
  useEffect(() => {
    if (initialContent) {
      setCode(cleanHtmlContent(initialContent));
    } else {
      setCode(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <!-- Tailwind CSS CDN for premium utility styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .9; transform: scale(0.99); }
    }
  </style>
</head>
<body class="p-6 sm:p-12">
  <div class="max-w-xl text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
      <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
      Prototipo de Código WAPPY
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-6">
      Bienvenido al sandbox interactivo de prototipos en HTML. Inserta componentes premium de SST desde la barra lateral izquierda y observa cómo cobran vida en tiempo real en la vista previa.
    </p>
    <div class="inline-flex gap-2">
      <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
      <span class="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Listo para Inyectar</span>
    </div>
  </div>
</body>
</html>`);
    }
  }, [initialContent]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    onUpdate(val);
  };

  const handleDownloadHtml = useCallback(async () => {
    try {
      const rawContent = code || initialContent || '';
      if (!rawContent) return;
      const prepared = preparePreviewHtml(rawContent, true);
      const safeTitle = (title || 'aplicativo-sst')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim();
      const fileName = safeTitle.endsWith('.html') ? safeTitle : `${safeTitle}.html`;
      const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });

      // 1. En móviles (iOS Safari / Android), verificar si el navegador soporta compartir archivos directamente (Guardar en Archivos / AirDrop / WhatsApp)
      if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
        try {
          const file = new File([blob], fileName, { type: 'text/html' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title || 'Aplicativo SST',
            });
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return; // Cancelado por el usuario en el share sheet
          }
          console.warn('Native share failed, falling back to saveAs:', shareErr);
        }
      }

      // 2. Descarga multi-navegador con saveAs de file-saver
      saveAs(blob, fileName);
    } catch (err) {
      console.error('Error al descargar HTML:', err);
      try {
        const rawContent = code || initialContent || '';
        const prepared = preparePreviewHtml(rawContent, true);
        const safeTitle = (title || 'aplicativo-sst').replace(/[/\\?%*:|"<>]/g, '_').trim();
        const fileName = safeTitle.endsWith('.html') ? safeTitle : `${safeTitle}.html`;
        const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (_) {}
        }, 5000);
      } catch (fallbackErr) {
        console.error('Fallback download failed:', fallbackErr);
      }
    }
  }, [code, initialContent, title]);

  const handleOpenInNewTab = () => {
    const prepared = preparePreviewHtml(code, true);
    const blob = new Blob([prepared], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const previewDoc = React.useMemo(() => {
    return preparePreviewHtml(code);
  }, [code]);

  useEffect(() => {
    if (onRegisterDownload) {
      onRegisterDownload(handleDownloadHtml);
    }
  }, [onRegisterDownload, code, title]);

  const showSidebar = isMaximized && sidebarOpen;

  return (
    <div ref={containerRef} className="flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMaximized && sidebarOpen && (
        <div 
          className="sm:hidden absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Column: SST Component Library Sidebar */}
      {isMaximized && (
        <div 
          className={`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] sm:relative sm:z-0 ${
            sidebarOpen ? 'w-[280px] sm:w-[320px]' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Biblioteca SST</span>
            </div>
            <span className="text-[10px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-full font-bold">HTML5</span>
          </div>

          {/* scrolling list of codes to insert */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              Aplicativos Inyectables
            </div>
            
            <div className="space-y-3">
              {PREMIUM_SST_COMPONENTS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => {
                    if (!isPro) {
                      alert('Este aplicativo premium es exclusivo para usuarios Pro de Wappy. Por favor actualice su suscripción.');
                      return;
                    }
                    if (code && code.trim() !== '' && !code.includes('Prototipo de Código WAPPY')) {
                      if (!window.confirm(`¿Deseas reemplazar el código actual por el aplicativo "${comp.title}"? Se perderán las modificaciones no guardadas.`)) {
                        return;
                      }
                    }
                    setCode(comp.code);
                    onUpdate(comp.code);
                  }}
                  className="w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200"
                >
                  <div className="h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform">
                    {renderIcon(comp.iconType, comp.color)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors">
                        {comp.title}
                      </h4>
                      {!isPro ? (
                        <span className="flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                          <Lock className="h-2 w-2" />
                          PRO
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          + Insertar
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button for Sidebar - ONLY visible when maximized */}
      {isMaximized && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-[460] h-14 w-5 bg-surface-primary border border-border-medium hover:bg-surface-hover shadow-md rounded-r-lg flex items-center justify-center transition-all duration-300 ${
            sidebarOpen 
              ? 'left-[279px] sm:left-[319px]' 
              : 'left-0 border-l-0'
          }`}
          title={sidebarOpen ? 'Contraer Panel Lateral' : 'Expandir Panel Lateral'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-text-secondary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
          )}
        </button>
      )}

      {/* Right Column: Code Editor & Iframe Preview Container */}
      <div className="flex-1 flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
        {/* Editor Menu & Controls */}
        <div className="flex items-center justify-between p-3 border-b border-border-medium bg-surface-secondary">
          {/* Split/Code/Preview tabs switcher */}
          <div className="flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm">
            {isMaximized && (
              <button
                onClick={() => setActiveTab('split')}
                className={`hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                  activeTab === 'split' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <Split className="h-3.5 w-3.5" />
                <span>Dividido</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                activeTab === 'code' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Código</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:-rotate-1 ${
                activeTab === 'preview' ? 'bg-surface-secondary text-text-primary shadow-inner font-extrabold' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Vista Previa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBridgeOpen(true)}
              className="group flex flex-shrink-0 items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 shadow-xs"
              title="Insertar imágenes, videos o infografías de Google Flow y NotebookLM (30 días)"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[240px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold tracking-wide">
                  Flow & NotebookLM
                </span>
              </div>
            </button>

            {(activeTab === 'preview' || activeTab === 'split') && (
              <>
                <button
                  onClick={() => setIframeKey((prev) => prev + 1)}
                  className="group flex flex-shrink-0 items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl   border rounded-xl bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shadow-xs "
                  title="Recargar vista previa"
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    <RotateCw className="h-4 w-4 text-text-primary" />
                  </div>
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-xs font-bold tracking-wide text-text-primary">
                      Recargar
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleOpenInNewTab}
                  className="group flex flex-shrink-0 items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl   border rounded-xl bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 shadow-xs "
                  title="Abrir en pestaña nueva (presentación completa)"
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    <ExternalLink className="h-4 w-4 text-text-primary" />
                  </div>
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-xs font-bold tracking-wide text-text-primary">
                      Abrir en pestaña
                    </span>
                  </div>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="group flex flex-shrink-0 items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl   border rounded-xl bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 shadow-xs "
                  title={isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                >
                  <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                    {isFullscreen ? <Minimize className="h-4 w-4 text-text-primary" /> : <Maximize className="h-4 w-4 text-text-primary" />}
                  </div>
                  <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                    <span className="text-xs font-bold tracking-wide text-text-primary">
                      {isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}
                    </span>
                  </div>
                </button>
              </>
            )}

            <button
              onClick={handleDownloadHtml}
              className="group flex flex-shrink-0 items-center justify-center h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3 transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 shadow-sm shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none rounded-xl   border rounded-xl bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shadow-xs "
              aria-label="Descargar HTML"
            >
              <div className="relative flex-shrink-0 flex items-center justify-center text-text-primary">
                <Download className="h-4 w-4 text-text-primary" />
              </div>
              <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap">
                <span className="text-xs font-bold tracking-wide text-text-primary">
                  Descargar HTML
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Main Workspace splits */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Code Editor */}
          {(activeTab === 'split' || activeTab === 'code') && (
            <div className="flex-1 h-full relative border-r border-border-medium">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={handleCodeChange}
                className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto scrollbar-thin"
                spellCheck="false"
                placeholder="Introduce tu código HTML/CSS/JS aquí..."
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow select-none">
                <Play className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>Auto-refreshing</span>
              </div>
            </div>
          )}

          {/* Right Side: Iframe Live Preview (in-panel) */}
          {(activeTab === 'split' || activeTab === 'preview') && (
            <div
              ref={iframeContainerRef}
              className={cn(
                "flex-1 h-full min-h-0 min-w-0 bg-white relative flex flex-col overflow-hidden",
                isFullscreen && "invisible"
              )}
            >
              <iframe
                key={iframeKey}
                title="Canvas Live View"
                className="w-full h-full flex-1 border-none bg-white min-h-0 min-w-0"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock"
                allow="fullscreen; presentation; clipboard-read; clipboard-write; autoplay"
                srcDoc={previewDoc}
              />
            </div>
          )}
        </div>

        {/* Portal Fullscreen: True 100dvh screen takeover on mobile/desktop without parent container/overflow/transform traps */}
        {isFullscreen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Sleek top control capsule bar */}
            <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-md pt-[max(0.5rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="h-2 w-2 rounded-full bg-teal-400 shrink-0 animate-pulse" />
                <span className="text-xs font-bold truncate text-slate-200 max-w-[160px] sm:max-w-[400px]">
                  {title || 'Informe Técnico SST'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono hidden sm:inline-block">
                  Pantalla Completa
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-teal-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Pestaña</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700"
                  title="Descargar documento HTML"
                >
                  <Download className="h-3.5 w-3.5 text-teal-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Descargar</span>
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-teal-500/30"
                  title="Salir de pantalla completa"
                >
                  <Minimize className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Salir</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Iframe */}
            <div className="flex-1 w-full h-full min-h-0 bg-white relative">
              <iframe
                key={`fullscreen-${iframeKey}`}
                title="Canvas Live View Fullscreen"
                className="w-full h-full border-none bg-white min-h-0 min-w-0"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock"
                allow="fullscreen; presentation; clipboard-read; clipboard-write; autoplay"
                srcDoc={previewDoc}
              />
            </div>
          </div>,
          document.body
        )}
        {isBridgeOpen && (
          <CanvasWorkspaceBridge
            onClose={() => setIsBridgeOpen(false)}
            onImportTable={handleInjectHtmlBlock}
            onImportMedia={(_item, htmlBlock) => handleInjectHtmlBlock(htmlBlock)}
            activeFileType="html"
            initialTab="media"
          />
        )}
      </div>
    </div>
  );
};

export default CanvasHtmlEditor;
