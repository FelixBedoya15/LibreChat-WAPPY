import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { X, Send, Sparkles, RotateCcw, FileText, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import Markdown from '~/components/Chat/Messages/Content/Markdown';
import { getDehydratedDOM, executeGUIAction } from '../Chat/TenshiPageController';

export default function TenshiChat() {
  const { isAuthenticated, token } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { _id?: string; role: string; content: string; htmlReport?: string }[]
  >([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [tenshiStatus, setTenshiStatus] = useState<string>('');
  const [guiSteps, setGuiSteps] = useState<{ action: string; details: string; status: 'pending' | 'success' | 'failed' }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const startDrag = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    hasMovedRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    const handleTouchEnd = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Ensure the chat window stays inside screen bounds when toggled open/closed
  useEffect(() => {
    if (!position || !containerRef.current) return;
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = rect.left;
      let adjustedY = rect.top;

      if (rect.right > viewportWidth) {
        adjustedX = Math.max(0, viewportWidth - rect.width);
      }
      if (rect.left < 0) {
        adjustedX = 0;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(0, viewportHeight - rect.height);
      }
      if (rect.top < 0) {
        adjustedY = 0;
      }

      if (adjustedX !== rect.left || adjustedY !== rect.top) {
        setPosition({ x: adjustedX, y: adjustedY });
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      if (!position || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = rect.left;
      let adjustedY = rect.top;

      if (rect.right > viewportWidth) {
        adjustedX = Math.max(0, viewportWidth - rect.width);
      }
      if (rect.left < 0) {
        adjustedX = 0;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(0, viewportHeight - rect.height);
      }
      if (rect.top < 0) {
        adjustedY = 0;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
  };

  const { data: config } = useQuery(
    ['tenshiConfig', token],
    async () => {
      const res = await axios.get('/api/tenshi/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['tenshiHistory', token],
    async () => {
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: Infinity,
    },
  );

  useEffect(() => {
    if (historyData) {
      if (historyData.length > 0) {
        setMessages(historyData);
      } else {
        setMessages([
          {
            role: 'assistant',
            content:
              '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
          },
        ]);
      }
    }
  }, [historyData]);

  const handleClearHistory = async () => {
    if (!confirm('¿Deseas reiniciar la conversación con Tenshi?')) return;
    try {
      await axios.delete('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages([
        {
          role: 'assistant',
          content:
            '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        },
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error clearing Tenshi history:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('¿Deseas eliminar este mensaje y el resto de la conversación a partir de este punto?')) return;
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data.length > 0 ? res.data : [
        {
          role: 'assistant',
          content: '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        }
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleUpdateMessage = async (msgId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setEditingMessageId(null);
    setIsTyping(true);
    try {
      await axios.put(
        `/api/tenshi/message/${msgId}`,
        { content: newContent },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();
      
      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error updating message:', err);
      setIsTyping(false);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    setIsTyping(true);
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();

      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error regenerating response:', err);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-tenshi-chat', handleOpen);
    return () => window.removeEventListener('open-tenshi-chat', handleOpen);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const showVoiceModal = useRecoilValue(store.showVoiceModal);
  const showLiveAnalysisModal = useRecoilValue(store.showLiveAnalysisModal);

  if (!isAuthenticated || !config || !config.isActive || showVoiceModal || showLiveAnalysisModal) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-24 md:bottom-6 right-6',
    'bottom-left': 'bottom-24 md:bottom-6 left-6',
    'top-right': 'top-6 md:top-6 right-6',
    'top-left': 'top-6 md:top-6 left-6',
  };

  const floatPosition =
    positionClasses[config.location as keyof typeof positionClasses] || 'bottom-6 right-6';

  const runChatTurn = async (currentMessages: { role: string; content: string; htmlReport?: string }[]) => {
    setIsTyping(true);
    setTenshiStatus('Capturando pantalla...');
    try {
      console.log('[Tenshi Frontend] Starting chat turn. Messages:', currentMessages);
      const domState = getDehydratedDOM();
      console.log('[Tenshi Frontend] Dehydrated DOM length:', domState.length);
      
      setTenshiStatus('Consultando con Tenshi...');

      // Limitar el historial a los últimos 20 mensajes para evitar saturación de tokens (429).
      // Siempre preservar el primer mensaje del usuario como ancla de la tarea original.
      const filteredMessages = currentMessages.filter((m) => m.role !== 'system');
      const MAX_HISTORY = 20;
      let cappedMessages = filteredMessages;
      if (filteredMessages.length > MAX_HISTORY) {
        const firstUserMsg = filteredMessages.find(m => m.role === 'user');
        const recentMessages = filteredMessages.slice(-MAX_HISTORY);
        // Preservar el primer mensaje si no está en los recientes
        if (firstUserMsg && !recentMessages.includes(firstUserMsg)) {
          cappedMessages = [firstUserMsg, ...recentMessages];
        } else {
          cappedMessages = recentMessages;
        }
      }

      const response = await axios.post(
        '/api/tenshi/chat',
        {
          messages: cappedMessages,
          browserState: domState,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const responseData = response.data;
      console.log('[Tenshi Frontend] Received response:', responseData);

      const assistantMsg = {
        role: 'assistant',
        content: responseData.response,
        htmlReport: responseData.htmlReport,
        isIntermediate: !!responseData.guiAction,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Si Tenshi requiere una acción visual, la ejecutamos en el cliente y continuamos el ciclo
      if (responseData.guiAction) {
        console.log('[Tenshi Frontend] GUI action requested:', responseData.guiAction);
        setTenshiStatus(`Acción visual requerida: ${responseData.guiAction.accion}...`);

        // Registrar paso de automatización para mostrar en el acordeón de acciones
        const actionLabel = responseData.guiAction.accion.toUpperCase();
        let detailLabel = '';
        if (responseData.guiAction.indice !== undefined) {
          detailLabel = `Índice [${responseData.guiAction.indice}]`;
        }
        if (responseData.guiAction.texto) {
          detailLabel += `${detailLabel ? ': ' : ''}"${responseData.guiAction.texto}"`;
        } else if (responseData.guiAction.direccion) {
          detailLabel += `${detailLabel ? ': ' : ''}hacia ${responseData.guiAction.direccion}`;
        }
        if (!detailLabel) {
          detailLabel = responseData.guiAction.accion === 'esperar' ? 'Espera temporal de 1.5s' : 'Ejecución de acción general';
        }

        setGuiSteps((prev) => [
          ...prev,
          { action: actionLabel, details: detailLabel, status: 'pending' },
        ]);

        // Esperamos un momento mínimo para actualización de UI
        await new Promise((resolve) => setTimeout(resolve, 250));

        setTenshiStatus(`Desplazando e interactuando con elemento [${responseData.guiAction.indice}]...`);
        const actionResult = await executeGUIAction(
          responseData.guiAction.accion,
          responseData.guiAction.indice,
          responseData.guiAction.texto,
          responseData.guiAction.direccion,
        );
        console.log('[Tenshi Frontend] GUI action result:', actionResult);

        // Actualizar estado de la acción ejecutada en los logs del acordeón
        setGuiSteps((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1].status = actionResult.success ? 'success' : 'failed';
          }
          return updated;
        });

        const newDOM = getDehydratedDOM();
        // Detectar si el scroll no cambió el DOM (bucle infinito de scroll)
        const lastUserMsg = currentMessages.filter(m => m.role === 'user').at(-1);
        const lastDOM = lastUserMsg?.content?.includes('Estado actual de la pantalla:')
          ? lastUserMsg.content.split('Estado actual de la pantalla:')[1]?.trim()
          : null;
        const domChanged = !lastDOM || lastDOM !== newDOM;
        const scrollStuck = responseData.guiAction.accion === 'scroll' && !domChanged;

        const feedbackMsg = {
          role: 'user',
          content: `[RESULTADO_GUI] Acción ${responseData.guiAction.accion} ejecutada. Resultado: ${scrollStuck ? 'ADVERTENCIA: El DOM no cambió tras el scroll. Has llegado al límite de la página. El botón de guardar puede ser uno de los botones sin etiqueta visibles en pantalla (como [28] o [29]). Analiza los elementos vacíos disponibles y haz clic en el correcto.' : actionResult.message}. Estado actual de la pantalla:\n${newDOM}`,
        };

        // Reanudamos la conversación de forma automática pasándole todo el historial acumulado
        console.log('[Tenshi Frontend] Sending automated feedback to backend:', feedbackMsg);
        setTenshiStatus('Enviando resultado...');
        await runChatTurn([...currentMessages, assistantMsg, feedbackMsg]);
      } else {
        console.log('[Tenshi Frontend] No GUI action requested. Ending turn.');
        setTenshiStatus('');
        setIsTyping(false);
      }
    } catch (error: any) {
      console.error('[Tenshi Frontend] Error in runChatTurn:', error);
      setTenshiStatus('Error en la automatización.');
      const status = error.response?.status;
      let userFriendlyMsg = error.response?.data?.details || error.message;

      if (status === 502 || userFriendlyMsg.includes('502')) {
        userFriendlyMsg =
          'Se interrumpió la conexión brevemente mientras el servidor terminaba de actualizarse (Error 502). Ya estamos totalmente en línea. ¡Por favor reenvíame tu solicitud!';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Lo siento, he tenido un inconveniente de conexión. ${userFriendlyMsg}`,
        },
      ]);
      setIsTyping(false);
      setTenshiStatus('');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    setGuiSteps([]); // Limpiar logs de automatización anteriores
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    await runChatTurn([...messages, userMsg]);
  };

  const openHtmlReport = (html: string) => {
    let fullContent = html;

    const stickyHeader = `
        <div id="report-sticky-header" style="position: sticky; top: 0; background: #ffffff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; z-index: 99999; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #10b981; color: #ffffff !important; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">WAPPY IA</span>
                <span id="report-header-title" style="color: #0f172a !important; font-weight: 700; font-size: 14px;">Informe Oficial de SST</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button id="theme-toggle-btn" onclick="toggleTheme()" style="background: #f1f5f9; color: #334155 !important; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <span id="theme-btn-text">🌓 Modo Oscuro</span>
                </button>
                <button onclick="window.print()" style="background: #10b981; color: #ffffff !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;">
                    🖨️ Imprimir / Guardar PDF
                </button>
            </div>
        </div>
        <script>
            function toggleTheme() {
                const isDark = document.documentElement.classList.toggle('report-dark');
                document.body.classList.toggle('report-dark', isDark);
                const btnText = document.getElementById('theme-btn-text');
                const btn = document.getElementById('theme-toggle-btn');
                const title = document.getElementById('report-header-title');
                const header = document.getElementById('report-sticky-header');
                if (isDark) {
                    if(btnText) btnText.innerText = '☀️ Modo Claro';
                    if(btn) { btn.style.backgroundColor = '#334155'; btn.style.borderColor = '#475569'; btn.style.setProperty('color', '#ffffff', 'important'); }
                    if(header) { header.style.backgroundColor = '#1e293b'; header.style.borderColor = '#334155'; }
                    if(title) title.style.setProperty('color', '#ffffff', 'important');
                } else {
                    if(btnText) btnText.innerText = '🌓 Modo Oscuro';
                    if(btn) { btn.style.backgroundColor = '#f1f5f9'; btn.style.borderColor = '#cbd5e1'; btn.style.setProperty('color', '#334155', 'important'); }
                    if(header) { header.style.backgroundColor = '#ffffff'; header.style.borderColor = '#e2e8f0'; }
                    if(title) title.style.setProperty('color', '#0f172a', 'important');
                }
            }
        </script>
        <style>
            @media print {
                #report-sticky-header { display: none !important; }
            }
            /* Global Light Theme Override (High Contrast) */
            html, body {
                background-color: #f8fafc !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                margin: 0; padding: 0;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #0f172a !important;
            }
            p, span, li, td, th, label, div {
                color: inherit;
            }
            /* Fix invisible text on cards/containers in Light Mode */
            .text-white, .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 {
                color: #0f172a !important;
            }
            /* Table Styling High Contrast */
            table {
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 16px 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            th, td {
                border: 1px solid #cbd5e1 !important;
                color: #0f172a !important;
                padding: 12px 16px !important;
                text-align: left;
            }
            th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #0f172a !important;
            }
            tr:nth-child(even) td {
                background-color: #f8fafc !important;
            }
            
            /* Dark Theme Overrides */
            html.report-dark, body.report-dark {
                background-color: #0f172a !important;
                color: #f8fafc !important;
            }
            .report-dark h1, .report-dark h2, .report-dark h3, .report-dark h4, .report-dark h5, .report-dark h6 {
                color: #ffffff !important;
            }
            .report-dark .text-white, .report-dark .text-slate-100, .report-dark .text-slate-200, .report-dark .text-slate-300, .report-dark .text-slate-400 {
                color: #f8fafc !important;
            }
            .report-dark table {
                background-color: #1e293b !important;
                border-color: #334155 !important;
            }
            .report-dark th, .report-dark td {
                border-color: #334155 !important;
                color: #f8fafc !important;
            }
            .report-dark th {
                background-color: #334155 !important;
                color: #ffffff !important;
            }
            .report-dark tr:nth-child(even) td {
                background-color: #0f172a !important;
            }
        </style>
        `;

    if (fullContent.includes('<body')) {
      fullContent = fullContent.replace(/<body([^>]*)>/i, `<body$1>${stickyHeader}`);
    } else {
      fullContent = stickyHeader + fullContent;
    }

    // Use Blob URL so printing or closing print modal in Safari/Chrome doesn't destroy the tab
    const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  const getHtmlFromMsg = (msg: { content: string; htmlReport?: string }) => {
    if (msg.htmlReport) return msg.htmlReport;
    if (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('<html')) {
      const match = msg.content.match(/<!DOCTYPE html[\s\S]*<\/html>|<html[\s\S]*<\/html>/i);
      if (match) return match[0];
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      style={
        position
          ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: 'auto',
              right: 'auto',
            }
          : {}
      }
      className={`tenshi-widget-container fixed z-[9999] ${position ? '' : floatPosition} flex flex-col items-end`}
    >
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in slide-in-from-bottom-5 dark:border-gray-700 dark:bg-gray-800 sm:w-[400px]">
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="flex shrink-0 cursor-move select-none items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 p-4 text-white"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-white p-0.5 shadow-inner">
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi"
                  className="h-full w-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/logo.svg';
                  }}
                />
                {!isOpen && <Sparkles className="absolute h-5 w-5 text-green-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold leading-none">{config.name}</h3>
                <p className="mt-1 text-xs text-green-100">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Reiniciar conversación"
                className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
            {messages.filter(msg => !msg.content?.startsWith('[RESULTADO_GUI]') && !(msg as any).isIntermediate).map((msg, i) => (
              <div
                key={i}
                className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-tr-none bg-blue-600 text-white shadow-md'
                      : 'rounded-tl-none border border-gray-100 bg-white text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {editingMessageId === msg._id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-lg border border-blue-300 p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="rounded bg-gray-200 px-2.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleUpdateMessage(msg._id!, editingText)}
                          className="rounded bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="markdown-content max-w-full overflow-hidden">
                        <style>{`
                          .markdown-content table {
                              display: block;
                              width: 100%;
                              overflow-x: auto;
                              white-space: nowrap;
                              border-collapse: collapse;
                              margin-top: 0.5rem;
                              margin-bottom: 0.5rem;
                          }
                          .markdown-content th, .markdown-content td {
                              padding: 6px 10px;
                              border: 1px solid rgba(156, 163, 175, 0.3);
                              font-size: 0.75rem;
                          }
                        `}</style>
                        <Markdown content={msg.content} isLatestMessage={i === messages.length - 1} />
                      </div>
                      {(() => {
                        const reportHtml = getHtmlFromMsg(msg);
                        if (!reportHtml) return null;
                        return (
                          <button
                            onClick={() => openHtmlReport(reportHtml)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl active:scale-95"
                          >
                            <FileText className="h-4 w-4 animate-pulse" />
                            {/* eslint-disable-next-line i18next/no-literal-string */}
                            <span>📄 Abrir / Descargar Informe HTML (PDF)</span>
                          </button>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Message action controls (Edit, Delete, Regenerate) */}
                {msg._id && editingMessageId !== msg._id && (
                  <div className={`mt-1 flex items-center gap-2 text-[10px] transition-all opacity-40 hover:opacity-100 sm:opacity-0 group-hover:opacity-100 ${
                    msg.role === 'user' ? 'justify-end pr-1 text-blue-500/70 dark:text-blue-400/70' : 'justify-start pl-1 text-gray-400 dark:text-gray-500'
                  }`}>
                    {msg.role === 'user' && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg._id!);
                          setEditingText(msg.content);
                        }}
                        className="flex items-center gap-0.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                        <span>Editar</span>
                      </button>
                    )}
                    {msg.role === 'assistant' && i === messages.length - 1 && (
                      <button
                        onClick={() => handleRegenerate(msg._id!)}
                        className="flex items-center gap-0.5 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <RefreshCw className="h-2.5 w-2.5" />
                        <span>Regenerar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg._id!)}
                      className="flex items-center gap-0.5 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Live automation steps collapsible log */}
            {guiSteps.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-3.5 backdrop-blur-sm shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                <details className="group" open>
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-xs text-gray-700 select-none dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Acciones automáticas en pantalla ({guiSteps.filter(s => s.status === 'success').length}/{guiSteps.length})
                    </span>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-gray-400 text-[10px]">▼</span>
                  </summary>
                  <div className="mt-3.5 space-y-2 border-t border-gray-100/50 pt-2.5 dark:border-gray-700/50">
                    {guiSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[9px] dark:bg-gray-700 dark:text-gray-300">
                            {step.action}
                          </span>
                          {step.details}
                        </span>
                        <span>
                          {step.status === 'pending' && (
                            <span className="text-amber-500 font-medium animate-pulse">Ejecutando...</span>
                          )}
                          {step.status === 'success' && (
                            <span className="text-emerald-500 font-bold">✓ Listo</span>
                          )}
                          {step.status === 'failed' && (
                            <span className="text-rose-500 font-bold">✗ Error</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-col gap-2">
                    {tenshiStatus && (
                      <span className="text-[10px] text-gray-500 font-semibold animate-pulse dark:text-gray-400">
                        ⚙️ {tenshiStatus}
                      </span>
                    )}
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-transparent px-4 py-3 shadow-inner transition-all focus-within:ring-2 focus-within:ring-green-500/30 dark:border-gray-700">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu consulta..."
                className="flex-1 border-none bg-transparent text-sm placeholder-gray-400 outline-none focus:outline-none focus:ring-0 dark:text-gray-100"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="shrink-0 rounded-full bg-green-500 p-1.5 text-white shadow-sm transition-all hover:bg-green-600 active:scale-95 disabled:bg-gray-300"
              >
                <Send className="ml-0.5 h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-center">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className="text-[10px] font-medium tracking-tight text-gray-400">
                Tenshi por WAPPY IA
              </span>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleButtonClick}
          className="animate-bounce-short relative flex h-14 w-14 cursor-grab items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 p-1 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-2xl active:cursor-grabbing"
        >
          {/* Ripple effect */}
          <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
          <img
            src="/assets/tenshi.png"
            alt="Tenshi"
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/logo.svg';
            }}
          />
        </button>
      )}
    </div>
  );
}
