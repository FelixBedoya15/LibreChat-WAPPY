import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { X, MessageSquare, Send, Sparkles, RotateCcw, FileText } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import Markdown from '~/components/Chat/Messages/Content/Markdown';

export default function TenshiChat() {
    const { isAuthenticated, token } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string, content: string, htmlReport?: string }[]>([
        { role: 'assistant', content: '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: config } = useQuery(['tenshiConfig', token], async () => {
        const res = await axios.get('/api/tenshi/config', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return res.data;
    }, {
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000
    });

    const { data: historyData, refetch: refetchHistory } = useQuery(['tenshiHistory', token], async () => {
        const res = await axios.get('/api/tenshi/history', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return res.data;
    }, {
        enabled: isAuthenticated,
        staleTime: Infinity
    });

    useEffect(() => {
        if (historyData && historyData.length > 0) {
            setMessages(historyData);
        }
    }, [historyData]);

    const handleClearHistory = async () => {
        if (!confirm('¿Deseas reiniciar la conversación con Tenshi?')) return;
        try {
            await axios.delete('/api/tenshi/history', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setMessages([{ role: 'assistant', content: '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?' }]);
            refetchHistory();
        } catch (err) {
            console.error('Error clearing Tenshi history:', err);
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

    const floatPosition = positionClasses[config.location as keyof typeof positionClasses] || 'bottom-6 right-6';

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post('/api/tenshi/chat',
                { messages: [...messages, userMsg].filter(m => m.role !== 'system') },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            const assistantMsg = { role: 'assistant', content: response.data.response, htmlReport: response.data.htmlReport };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error: any) {
            console.error('Error with Tenshi:', error);
            const backendError = error.response?.data?.details || error.message;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Lo siento, he tenido un problema conectando con el servidor. Error: ${backendError}. Por favor, verifica la configuración en el panel de admin.`
            }]);
        } finally {
            setIsTyping(false);
        }
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

    const getHtmlFromMsg = (msg: { content: string, htmlReport?: string }) => {
        if (msg.htmlReport) return msg.htmlReport;
        if (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('<html')) {
            const match = msg.content.match(/<!DOCTYPE html[\s\S]*<\/html>|<html[\s\S]*<\/html>/i);
            if (match) return match[0];
        }
        return null;
    };

    return (
        <div className={`fixed z-[9999] ${floatPosition} flex flex-col items-end`}>
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl w-[350px] sm:w-[400px] h-[500px] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-0.5 rounded-full flex items-center justify-center shadow-inner h-10 w-10 overflow-hidden border border-emerald-200">
                                <img src="/assets/tenshi.png" alt="Tenshi" className="h-full w-full object-cover rounded-full" onError={(e) => { e.currentTarget.src = '/assets/logo.svg'; }} />
                                {!isOpen && <Sparkles className="w-5 h-5 text-green-600 absolute" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">{config.name}</h3>
                                <p className="text-xs text-green-100 mt-1">{config.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={handleClearHistory} title="Reiniciar conversación" className="hover:bg-white/20 p-1.5 rounded-full transition-colors text-white">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm'
                                    }`}>
                                    <div className="markdown-content overflow-hidden max-w-full">
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
                                                className="mt-3 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 border border-emerald-400/30"
                                            >
                                                <FileText className="w-4 h-4 animate-pulse" />
                                                <span>📄 Abrir / Descargar Informe HTML (PDF)</span>
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner group focus-within:ring-2 focus-within:ring-green-500/30 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu consulta..."
                                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm dark:text-gray-100 placeholder-gray-400"
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isTyping || !input.trim()}
                                className="p-1.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-full transition-all shrink-0 shadow-sm active:scale-95"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">Tenshi por WAPPY IA</span>
                        </div>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-1 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center animate-bounce-short relative w-14 h-14 border-2 border-white overflow-hidden"
                >
                    {/* Ripple effect */}
                    <span className="absolute w-full h-full rounded-full bg-emerald-400 animate-ping opacity-20"></span>
                    <img src="/assets/tenshi.png" alt="Tenshi" className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.src = '/assets/logo.svg'; }} />
                </button>
            )}
        </div>
    );
}
