import React, { useState, useEffect, useCallback, useRef } from 'react';
import LiveEditor, { type LiveEditorHandle } from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import ReportHistory from './ReportHistory';
import { Video, Save, History, Upload, Trash2, Mic, MicOff, AlertTriangle, Sparkles } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useLocalize, useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { OpenSidebar } from '~/components/Chat/Menus';
import ModelSelector from '~/components/SGSST/ModelSelector';
import ExportDropdown from '~/components/SGSST/ExportDropdown';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';
import type { ContextType } from '~/common';

const LivePage = () => {
    const localize = useLocalize();
    const { token, user } = useAuthContext();
    const isPro = user?.role === 'ADMIN' || user?.role === 'USER_PRO';
    const { showToast } = useToastContext();
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();
    const [editorContent, setEditorContent] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [reportSourceData, setReportSourceData] = useState<any>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [offlineTemplate, setOfflineTemplate] = useState('general');
    const [offlineNotes, setOfflineNotes] = useState('');
    const [offlineFiles, setOfflineFiles] = useState<any[]>([]);
    const [offlineVideoPreview, setOfflineVideoPreview] = useState<string | null>(null);
    const [offlineImagesPreview, setOfflineImagesPreview] = useState<string[]>([]);
    const [isGeneratingOfflineReport, setIsGeneratingOfflineReport] = useState(false);
    const [offlineReportGenerated, setOfflineReportGenerated] = useState(false);

    // Imperative ref to push HTML content into the editor directly
    const editorRef = useRef<LiveEditorHandle>(null);

    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleSpeechRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast({ message: 'El dictado por voz no es soportado por este navegador.', status: 'warning' });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-CO';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                showToast({ message: 'Escuchando... Dicta tus observaciones de seguridad.', status: 'info' });
            };

            recognition.onresult = (event: any) => {
                const resultText = event.results[0][0].transcript;
                setOfflineNotes(prev => prev ? prev + ' ' + resultText : resultText);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;
        const filesArray = Array.from(fileList);
        
        // Check for video file first (10s max)
        const videoFile = filesArray.find(f => f.type.startsWith('video/'));
        if (videoFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOfflineFiles([{ name: videoFile.name, base64: reader.result as string, mimeType: videoFile.type }]);
                setOfflineVideoPreview(URL.createObjectURL(videoFile));
                setOfflineImagesPreview([]);
            };
            reader.readAsDataURL(videoFile);
            return;
        }

        // Otherwise process image files up to 5
        const imageFiles = filesArray.filter(f => f.type.startsWith('image/')).slice(0, 5);
        if (imageFiles.length > 0) {
            setOfflineVideoPreview(null);
            const loadedFiles: any[] = [];
            const previews: string[] = [];
            let loadedCount = 0;

            imageFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    loadedFiles.push({ name: file.name, base64: reader.result as string, mimeType: file.type });
                    previews.push(URL.createObjectURL(file));
                    loadedCount++;
                    if (loadedCount === imageFiles.length) {
                        setOfflineFiles(loadedFiles);
                        setOfflineImagesPreview(previews);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeOfflineImage = (index: number) => {
        const newFiles = [...offlineFiles];
        newFiles.splice(index, 1);
        setOfflineFiles(newFiles);

        const newPreviews = [...offlineImagesPreview];
        newPreviews.splice(index, 1);
        setOfflineImagesPreview(newPreviews);
    };

    const clearOfflineFiles = () => {
        setOfflineFiles([]);
        setOfflineVideoPreview(null);
        setOfflineImagesPreview([]);
    };

    const handleSubmitOfflineReport = async () => {
        if (!token) return;
        if (offlineFiles.length === 0) {
            showToast({ message: 'Debe cargar al menos una foto o un video corto para realizar el análisis.', status: 'error' });
            return;
        }
        setIsGeneratingOfflineReport(true);
        try {
            const response = await fetch('/api/live-analysis/offline-report', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    files: offlineFiles, 
                    notes: offlineNotes, 
                    template: offlineTemplate, 
                    conversationId 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al generar el informe');
            }

            const data = await response.json();
            if (data.success) {
                if (data.conversationId) {
                    setConversationId(data.conversationId);
                }
                handleReportReceived(data.html, null, data.conversationId);
                setOfflineFiles([]);
                setOfflineNotes('');
                setOfflineVideoPreview(null);
                setOfflineImagesPreview([]);
                setOfflineReportGenerated(true);
                showToast({ message: '¡Informe generado con éxito desde carga offline!', status: 'success', severity: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message || 'Error al conectar con el servidor', status: 'error' });
        } finally {
            setIsGeneratingOfflineReport(false);
        }
    };

    // REMOVED useNewConvo because it forces a redirect to /c/new.
    // We handle "new" state locally.
    useEffect(() => {
        setConversationId('new');
        setEditorContent('');
        setReportMessageId(null);
    }, []);

    const handleStartAnalysis = () => {
        setIsModalOpen(true);
    };

    const handleTextReceived = (text: string) => {
        // console.log("LivePage: Text received (ignored for editor):", text);
    };

    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    // State to trigger history refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleReportReceived = useCallback((html: string, kpi?: any, messageId?: string) => {
        console.log("LivePage: Full Report received", kpi?.riesgo);
        // Push content imperatively into the editor (it only reads initialContent once on mount)
        editorRef.current?.setHTML(html);
        setEditorContent(html);
        setReportSourceData(kpi);
        setLastUpdated(new Date());
        if (messageId) {
            setReportMessageId(messageId);
        }
    }, []);

    // Background polling for report completion if socket disconnected before it finished
    useEffect(() => {
        if (!conversationId || conversationId === 'new') return;
        
        const isGenerating = editorContent && (
            editorContent.includes('Generando informe técnico') || 
            editorContent.includes('Generando Reporte')
        );
        
        if (!isGenerating) return;

        console.log('[LivePage] Active report generation detected. Starting background polling for conversationId:', conversationId);

        let isMounted = true;
        let pollCount = 0;
        const maxPolls = 24; // 2 minutes (24 * 5s)

        const pollInterval = setInterval(async () => {
            if (!isMounted) return;
            pollCount++;

            if (pollCount > maxPolls) {
                console.log('[LivePage] Polling timeout reached. Stopping.');
                clearInterval(pollInterval);
                return;
            }

            try {
                const res = await fetch(`/api/messages/${conversationId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) return;

                const data = await res.json();
                let messages = [];
                if (Array.isArray(data)) {
                    messages = data;
                } else if (data && data.messages) {
                    messages = data.messages;
                }

                // Look for a finished HTML report message
                // The finished report shouldn't contain the "Generando informe técnico" placeholder
                const finishedReport = [...messages].reverse().find((m: any) => {
                    const isHtml = m.isHtmlReport || (m.text && m.text.trim().startsWith('<'));
                    const isPlaceholder = m.text && (
                        m.text.includes('Generando informe técnico') || 
                        m.text.includes('Generando Reporte')
                    );
                    return isHtml && !isPlaceholder;
                });

                if (finishedReport && finishedReport.text) {
                    console.log('[LivePage] Finished report found in DB! Updating editor.', finishedReport.messageId);
                    
                    // Parse KPI if present
                    const parseKpi = (rawHtml: string) => {
                        const defaults = { riesgo: 'INDETERMINADO', accion: 'Evaluar', consecuencia: 'Incapacitante', npeligros: '5+' };
                        try {
                            const match = rawHtml.match(/<div[^>]+id=["']wappy-kpi["'][^>]*>/i);
                            if (!match) return defaults;
                            const tag = match[0];
                            const get = (attr: string) => {
                                const m = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, 'i'));
                                return m ? m[1].trim() : '';
                            };
                            return {
                                riesgo:       get('data-riesgo')       || defaults.riesgo,
                                accion:       get('data-accion')       || defaults.accion,
                                consecuencia: get('data-consecuencia') || defaults.consecuencia,
                                npeligros:    get('data-npeligros')    || defaults.npeligros,
                            };
                        } catch { return defaults; }
                    };

                    const kpi = parseKpi(finishedReport.text);
                    handleReportReceived(finishedReport.text, kpi, finishedReport.messageId);
                    
                    // Trigger history refresh
                    setRefreshTrigger(prev => prev + 1);
                    
                    clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('[LivePage] Error polling for finished report:', err);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, [conversationId, editorContent, token, handleReportReceived]);

    const handleSelectReport = async (selectedConvoId: string) => {
        try {
            console.log("Loading report from conversation:", selectedConvoId);
            setConversationId(selectedConvoId);
            setIsHistoryOpen(false);

            const res = await fetch(`/api/messages/${selectedConvoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Handle both array and object response formats
            let messages = [];
            if (Array.isArray(data)) {
                messages = data;
            } else if (data && data.messages) {
                messages = data.messages;
            }

            // DEBUG: Traceability for Report Loading
            console.log('[ReportDebug] Total messages loaded:', messages.length);
            messages.forEach((m: any, i: number) => {
                const hasImg = m.text && m.text.includes('<img src="data:');
                const isHtml = m.isHtmlReport || (m.text && m.text.trim().startsWith('<'));
                console.log(`[ReportDebug] Msg ${i}: ID=${m.messageId}, IsHtml=${isHtml}, HasImage=${hasImg}, Len=${m.text?.length || 0}`);
            });

            // PRIORITY 1: Find HTML reports (new format with isHtmlReport marker)
            const htmlReport = [...messages].reverse().find((m: any) =>
                m.isHtmlReport === true
            );

            // PRIORITY 2: Reports with embedded images (captures snapshot)
            const reportWithImage = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('<img src="data:')
            );

            // PRIORITY 3: Base64 packed content (legacy format)
            const b64_to_utf8 = (str: string) => {
                return decodeURIComponent(escape(window.atob(str)));
            };
            const reportWithPackedData = [...messages].reverse().find((m: any) =>
                m.text && m.text.includes('data-report-content="')
            );

            // PRIORITY 4: Any message that looks like HTML (starts with <)
            const htmlLookingMsg = [...messages].reverse().find((m: any) =>
                m.text && (m.text.trim().startsWith('<') || m.text.includes('<h1>') || m.text.includes('<h2>') || m.text.includes('<table'))
            );

            // PRIORITY 5: Last resort - any message with header (Markdown)
            const reportSystemMsg = [...messages].reverse().find((m: any) =>
                m.text && (m.text.includes('# ') || m.text.includes('## '))
            );

            // Select the best match
            const lastMsg = htmlReport || reportWithImage || reportWithPackedData || htmlLookingMsg || reportSystemMsg || messages[messages.length - 1];

            console.log('[ReportDebug] Selected message type:',
                htmlReport ? 'isHtmlReport' :
                    reportWithImage ? 'withImage' :
                        reportWithPackedData ? 'packed' :
                            htmlLookingMsg ? 'htmlLooking' :
                                reportSystemMsg ? 'markdown' : 'lastMsg');

            if (lastMsg && lastMsg.text) {
                // Use text field directly (stores HTML for reports)
                let html = lastMsg.text;

                // Try decode Base64 packed content (legacy)
                if (html.includes('data-report-content="')) {
                    try {
                        const match = html.match(/data-report-content="([^"]+)"/);
                        if (match && match[1]) {
                            html = b64_to_utf8(match[1]);
                            console.log('[ReportDebug] Successfully decoded Base64 content');
                        }
                    } catch (e) {
                        console.error('[ReportDebug] Failed to decode report:', e);
                    }
                }

                // Convert Markdown to HTML if content is in Markdown format
                if (!html.trim().startsWith('<') && !html.includes('<div') && !html.includes('<h1') && !html.includes('<table')) {
                    // Convert Markdown tables to HTML
                    const lines = html.split('\n');
                    const convertedLines: string[] = [];
                    let inTable = false;
                    let tableRows: string[] = [];

                    for (const line of lines) {
                        const trimmed = line.trim();

                        // Check if it's a table row (has pipes and is not a separator)
                        if (trimmed.includes('|') && !trimmed.match(/^\|?[\s\-:|]+\|?$/)) {
                            if (!inTable) {
                                inTable = true;
                                tableRows = [];
                            }
                            tableRows.push(trimmed);
                        } else if (trimmed.match(/^\|?[\s\-:|]+\|?$/) && inTable) {
                            // Skip separator line but keep collecting
                            continue;
                        } else {
                            // End of table or non-table line
                            if (inTable && tableRows.length > 0) {
                                // Convert collected table rows to HTML
                                let tableHtml = '<table border="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd; margin: 10px 0;"><tbody>';
                                tableRows.forEach((row, idx) => {
                                    const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
                                    const tag = idx === 0 ? 'th' : 'td';
                                    tableHtml += '<tr>' + cells.map(c => `<${tag} style="padding: 8px; border: 1px solid #ddd;">${c}</${tag}>`).join('') + '</tr>';
                                });
                                tableHtml += '</tbody></table>';
                                convertedLines.push(tableHtml);
                                tableRows = [];
                            }
                            inTable = false;
                            convertedLines.push(trimmed);
                        }
                    }

                    // Handle remaining table if file ends with table
                    if (inTable && tableRows.length > 0) {
                        let tableHtml = '<table border="0" style="width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;"><tbody>';
                        tableRows.forEach((row, idx) => {
                            const cells = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
                            const tag = idx === 0 ? 'th' : 'td';
                            tableHtml += '<tr>' + cells.map(c => `<${tag} style="padding: 8px; border: 1px solid #ddd;">${c}</${tag}>`).join('') + '</tr>';
                        });
                        tableHtml += '</tbody></table>';
                        convertedLines.push(tableHtml);
                    }

                    html = convertedLines.join('\n');

                    // Basic Markdown formatting
                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
                    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
                    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
                    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
                    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');
                }

                // Set content and update state
                editorRef.current?.setHTML(html);
                setEditorContent(html);
                setReportMessageId(lastMsg.messageId);
                setLastUpdated(new Date(lastMsg.createdAt));
            }
        } catch (e) {
            console.error("Error loading conversation:", e);
            showToast({ message: 'Error al cargar el informe', status: 'error' });
        }
    };


    const initialReportContent = `
<div style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; margin:0 auto; color:#111827; background-color:#f9fafb; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
  <!-- HEADER (WAPPY PREMIUM EMERALD-TEAL-CYAN DEGRADADO) -->
  <div style="background:linear-gradient(135deg,#064e3b 0%,#0f766e 60%,#0891b2 100%); padding:32px; position:relative; overflow:hidden; border-bottom:3px solid #14b8a6;">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; position:relative; z-index:10;">
      <div>
        <div style="color:#22d3ee; font-size:0.75em; font-weight:800; letter-spacing:4px; text-transform:uppercase; margin-bottom:6px; text-shadow:0 0 10px rgba(34,211,238,0.3); display:flex; align-items:center; gap:8px;">
          <svg width="12" height="12" viewBox="0 0 100 100" style="overflow:visible;">
            <circle cx="50" cy="50" r="45" fill="#22d3ee">
              <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
              <animate attributeName="r" values="45;65;45" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
          ✨ WAPPY IA • HSE Command Center
        </div>
        <h1 style="color:#ffffff; font-size:1.8em; font-weight:900; margin:0 0 6px; letter-spacing:-0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.2);">
          Informe de Análisis de Riesgos y Peligros
        </h1>
        <div style="color:#a7f3d0; font-size:0.85em; font-weight:500; display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:8px; height:8px; background-color:#34d399; border-radius:50%; box-shadow:0 0 8px #34d399;"></span>
          Modalidad: Auditoría de Campo Asistida por IA (Predictiva)
        </div>
      </div>
      <div>
        <div style="background:rgba(255,255,255,0.07); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.15); border-radius:12px; padding:12px 20px; min-width:180px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="color:#22d3ee; font-size:0.65em; font-weight:800; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px;">RADICADO</div>
          <div style="color:#ffffff; font-size:1.25em; font-weight:900; font-family:monospace; letter-spacing:1px;">LA-PENDIENTE</div>
          <div style="color:#e2e8f0; font-size:0.75em; margin-top:4px; font-weight:500;">
            📅 \${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Background grid pattern -->
    <div style="position:absolute; inset:0; opacity:0.15; pointer-events:none; z-index:1;">
      <svg width="100%" height="100%">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  </div>

  <!-- INFO BAR -->
  <div style="background:#f0fdfa; border-bottom:1px solid #ccfbf1; padding:14px 32px; display:flex; flex-wrap:wrap; gap:32px; font-size:0.85em; color:#0f766e; font-weight:600; align-items:center;">
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="color:#14b8a6; font-size:1.2em;">📅</span> <strong>Fecha:</strong> \${new Date().toLocaleDateString()}
    </div>
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="color:#14b8a6; font-size:1.2em;">⏱️</span> <strong>Hora:</strong> --:--
    </div>
    <div style="display:flex; align-items:center; gap:6px;">
      <span style="color:#14b8a6; font-size:1.2em;">🛡️</span> <strong>Estándar:</strong> GTC 45 / ISO 45001
    </div>
    <div style="display:flex; align-items:center; gap:6px; margin-left:auto;">
      <strong>Estado:</strong> 
      <span style="background-color:#fffbeb; color:#d97706; padding:3px 12px; border-radius:50px; font-size:0.9em; font-weight:700; border:1px solid #fde68a; display:flex; align-items:center; gap:6px;">
        <svg width="8" height="8" viewBox="0 0 100 100" style="overflow:visible;">
          <circle cx="50" cy="50" r="50" fill="#d97706">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
        ⌛ Esperando Evidencias
      </span>
    </div>
  </div>

  <!-- BODY (PREMIUM LAYOUT WITH INTEGRATED TELEMETRY) -->
  <div style="background:#ffffff; padding:40px 32px; min-height:400px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; position:relative;">
    
    <!-- FUTURISTIC SWEEP RADAR & SIGNAL WAVE VISUALIZER (SVG with animation) -->
    <div style="width:100%; max-width:480px; margin-bottom:28px; background:#042f2e; border-radius:24px; padding:20px; border:2px solid #0f766e; box-shadow:inset 0 0 20px rgba(20,184,166,0.2), 0 10px 15px -3px rgba(0,0,0,0.1); overflow:hidden;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(20,184,166,0.3); padding-bottom:8px;">
        <div style="color:#a5f3fc; font-family:monospace; font-size:0.8em; font-weight:bold; letter-spacing:1px;">
          📡 RADAR DE MONITOREO EN VIVO
        </div>
        <div style="color:#34d399; font-family:monospace; font-size:0.8em; font-weight:bold; display:flex; align-items:center; gap:6px;">
          ONLINE
          <svg width="8" height="8" style="overflow:visible;">
            <circle cx="4" cy="4" r="4" fill="#34d399">
              <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
      
      <svg viewBox="0 0 400 120" fill="none" style="width:100%; height:auto;">
        <!-- Circular sweep radar grids -->
        <circle cx="200" cy="60" r="10" stroke="#0f766e" stroke-dasharray="2 2" stroke-width="1" />
        <circle cx="200" cy="60" r="25" stroke="#0f766e" stroke-dasharray="3 3" stroke-width="1" />
        <circle cx="200" cy="60" r="45" stroke="#0f766e" stroke-dasharray="4 4" stroke-width="1" />
        <circle cx="200" cy="60" r="55" stroke="#115e59" stroke-width="1" />
        
        <!-- Radar Crosshairs -->
        <line x1="200" y1="5" x2="200" y2="115" stroke="#0f766e" stroke-dasharray="2 2" stroke-width="1" />
        <line x1="140" y1="60" x2="260" y2="60" stroke="#0f766e" stroke-dasharray="2 2" stroke-width="1" />
        
        <!-- Sweeping radial scanner arm -->
        <line x1="200" y1="60" x2="200" y2="5" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" filter="drop-shadow(0 0 4px rgba(20,184,166,0.6))">
          <animateTransform attributeName="transform" type="rotate" from="0 200 60" to="360 200 60" dur="4s" repeatCount="indefinite" />
        </line>
        
        <!-- Detected Hazard Glow Dots (Simulated) -->
        <g>
          <!-- Hazard 1 (EPP) -->
          <circle cx="170" cy="40" r="4.5" fill="#ef4444" filter="drop-shadow(0 0 6px #ef4444)">
            <animate attributeName="opacity" values="1;0.1;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="145" y="32" fill="#ef4444" font-family="monospace" font-size="7" font-weight="bold">AMENAZA_EPP</text>
          
          <!-- Hazard 2 (Alturas) -->
          <circle cx="235" cy="75" r="4.5" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)">
            <animate attributeName="opacity" values="0.1;1;0.1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="215" y="90" fill="#f59e0b" font-family="monospace" font-size="7" font-weight="bold">CAIDA_ALTURA</text>
        </g>
        
        <!-- Live Liquid Audio/Video Signal Waveforms -->
        <g opacity="0.6">
          <path d="M 20 60 Q 50 15 100 60 T 180 60 T 260 60 T 380 60" stroke="#06b6d4" stroke-width="2" stroke-linecap="round">
            <animateTransform attributeName="transform" type="translate" from="0,0" to="-40,0" dur="3s" repeatCount="indefinite" />
          </path>
          <path d="M 20 60 Q 60 95 120 60 T 200 60 T 280 60 T 380 60" stroke="#10b981" stroke-width="1.5" stroke-linecap="round">
            <animateTransform attributeName="transform" type="translate" from="-40,0" to="0,0" dur="3.5s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>

    <h3 style="color:#0f766e; font-size:1.4em; font-weight:900; margin:0 0 12px; letter-spacing:-0.3px;">
      Centro de Mando HSE Predictivo • WAPPY IA
    </h3>
    <p style="color:#6b7280; font-size:0.95em; max-width:560px; line-height:1.6; margin:0 0 28px;">
      El motor neuronal de Wappy está listo para evaluar el entorno en tiempo real. 
      Activa tu cámara utilizando el botón de <strong>Video En Vivo</strong> en la barra superior, o selecciona 
      <strong>Carga Rápida (Offline)</strong> para procesar videos grabados y fotos tomadas en campo.
    </p>

    <!-- TELEMETRY CORE MODULES (Futuristic Glass Cards Grid) -->
    <div style="display:grid; grid-template-cols:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; width:100%; max-width:780px; margin-bottom:36px;">
      
      <!-- Module 1 -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:18px; text-align:left; display:flex; align-items:flex-start; gap:12px; transition:all 0.3s ease;">
        <div style="background:#e0f2fe; color:#0284c7; font-size:1.6em; padding:10px; border-radius:12px; display:flex; align-items:center; justify-content:center; line-height:1;">
          👁️
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
            <strong style="color:#0f172a; font-size:0.9em; font-weight:700;">Visión Artificial</strong>
            <span style="background-color:#fef3c7; color:#d97706; font-size:0.7em; font-weight:800; padding:2px 8px; border-radius:50px; margin-left:auto; display:flex; align-items:center; gap:4px;">
              <svg width="6" height="6" style="overflow:visible;"><circle cx="3" cy="3" r="3" fill="#d97706"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/></circle></svg>
              STANDBY
            </span>
          </div>
          <p style="color:#64748b; font-size:0.78em; margin:4px 0 0; line-height:1.4;">
            Detección de EPP, líneas de vida y actos inseguros dinámicos.
          </p>
        </div>
      </div>

      <!-- Module 2 -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:18px; text-align:left; display:flex; align-items:flex-start; gap:12px; transition:all 0.3s ease;">
        <div style="background:#ecfeff; color:#0891b2; font-size:1.6em; padding:10px; border-radius:12px; display:flex; align-items:center; justify-content:center; line-height:1;">
          🎙️
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
            <strong style="color:#0f172a; font-size:0.9em; font-weight:700;">Dictado por Voz</strong>
            <span style="background-color:#d1fae5; color:#065f46; font-size:0.7em; font-weight:800; padding:2px 8px; border-radius:50px; margin-left:auto; display:flex; align-items:center; gap:4px;">
              <svg width="6" height="6" style="overflow:visible;"><circle cx="3" cy="3" r="3" fill="#065f46"><animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/></circle></svg>
              READY
            </span>
          </div>
          <p style="color:#64748b; font-size:0.78em; margin:4px 0 0; line-height:1.4;">
            Transcribe observaciones habladas al instante usando Web Speech.
          </p>
        </div>
      </div>

      <!-- Module 3 -->
      <div style="background:#f0fdf4; color:#16a34a; font-size:1.6em; padding:10px; border-radius:12px; display:flex; align-items:center; justify-content:center; line-height:1;">
        🧠
      </div>
      <div style="flex:1;">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <strong style="color:#0f172a; font-size:0.9em; font-weight:700;">Motor Predictivo</strong>
          <span style="background-color:#d1fae5; color:#065f46; font-size:0.7em; font-weight:800; padding:2px 8px; border-radius:50px; margin-left:auto; display:flex; align-items:center; gap:4px;">
            <svg width="6" height="6" style="overflow:visible;"><circle cx="3" cy="3" r="3" fill="#065f46"><animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/></circle></svg>
            GTC 45
          </span>
        </div>
        <p style="color:#64748b; font-size:0.78em; margin:4px 0 0; line-height:1.4;">
          Clasifica la probabilidad y consecuencia de riesgos reglamentarios.
        </p>
      </div>
    </div>

    </div>

    <!-- MOCK PREDICTIVE RISK IDENTIFICATION CARD (Educational / visual preview) -->
    <div style="width:100%; max-width:780px; border:1px solid #ccfbf1; border-radius:20px; background:linear-gradient(to bottom, #f0fdfa 0%, #ffffff 100%); padding:24px; text-align:left; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px; border-bottom:1px solid #e6fffa; padding-bottom:10px;">
        <span style="font-size:1.2em;">⚡</span>
        <strong style="color:#0f766e; font-size:0.9em; text-transform:uppercase; letter-spacing:0.5px;">
          Muestra de Detección de Riesgos (Estilo GTC 45)
        </strong>
      </div>
      
      <div style="display:flex; flex-wrap:wrap; gap:16px;">
        
        <!-- Left Item -->
        <div style="flex:1; min-width:240px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="background-color:#fee2e2; color:#ef4444; padding:2px 8px; border-radius:6px; font-size:0.7em; font-weight:800;">
              RIESGO CRÍTICO
            </span>
            <span style="color:#94a3b8; font-size:0.75em; font-family:monospace; margin-left:auto;">ID: #9941</span>
          </div>
          <strong style="display:block; color:#1e293b; font-size:0.85em; margin-bottom:4px;">
            Trabajo en Alturas sin EPP
          </strong>
          <p style="color:#64748b; font-size:0.8em; margin:0; line-height:1.4;">
            Operario a 3.5 metros sobre andamio incompleto sin arnés ni línea de vida activa.
          </p>
        </div>

        <!-- Right Item -->
        <div style="flex:1; min-width:240px; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; border-left:4px solid #ef4444;">
          <strong style="display:block; color:#0f172a; font-size:0.85em; margin-bottom:8px;">
            Evaluación Predictiva Wappy IA:
          </strong>
          <table style="width:100%; border-collapse:collapse; font-size:0.75em;">
            <tr>
              <td style="color:#64748b; padding:2px 0;"><strong>Probabilidad (NP):</strong></td>
              <td style="color:#ef4444; font-weight:bold; text-align:right;">Muy Alto (40)</td>
            </tr>
            <tr>
              <td style="color:#64748b; padding:2px 0;"><strong>Consecuencia (NC):</strong></td>
              <td style="color:#ef4444; font-weight:bold; text-align:right;">Muerte / Invalidez (100)</td>
            </tr>
            <tr>
              <td style="color:#64748b; padding:2px 0;"><strong>Nivel de Riesgo (NR):</strong></td>
              <td style="color:#ffffff; background:#ef4444; font-weight:bold; text-align:center; padding:1px 6px; border-radius:4px; display:inline-block; margin-left:auto;">I (Intervención Inmediata)</td>
            </tr>
          </table>
        </div>

      </div>
    </div>

  </div>
</div>`;

    const handleSave = async () => {
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }
        const contentToSave = editorContent || initialReportContent;
        if (!token || !conversationId || conversationId === 'new') {
            showToast({ message: 'Inicia un chat primero para guardar el informe.', status: 'warning' });
            return;
        }

        try {
            // Save content to live-editor session
            const res = await fetch(`/api/live-editor/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: contentToSave, fileName: `Análisis Riesgos - ${new Date().toLocaleDateString('es-CO')}` }),
            });

            if (res.ok) {
                // Tag the conversation so ReportHistory can find it
                const convoRes = await fetch(`/api/convos/${conversationId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (convoRes.ok) {
                    const convo = await convoRes.json();
                    const currentTags: string[] = convo.tags ?? [];
                    if (!currentTags.includes('report')) {
                        await fetch('/api/convos/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ arg: { conversationId, tags: [...currentTags, 'report'] } }),
                        });
                    }
                }
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Informe guardado en historial', status: 'success', severity: 'success' });
            } else {
                showToast({ message: `Error al guardar: ${res.status}`, status: 'error' });
            }
        } catch (error) {
            console.error('[Save] Error:', error);
            showToast({ message: 'Error de red al guardar', status: 'error' });
        }

    };


    return (
        <div className="flex h-full w-full flex-col bg-surface-secondary relative">
            {/* Report History Sidebar */}
            <ReportHistory
                isOpen={isHistoryOpen}
                toggleOpen={() => setIsHistoryOpen(false)}
                onSelectReport={handleSelectReport}
                refreshTrigger={refreshTrigger}
                tags={['report']}
                historyEndpoint="/api/live-editor/history"
            />

            {/* Style Inject for animations */}
            <style>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>

            {/* Live Analysis Content (Accessible to all) */}
            <div className="flex-1 flex flex-col min-h-0">
                    {/* Toolbar / Header Actions */}
                    <div className="w-full p-4 pb-0">
                        <div className="max-w-5xl mx-auto bg-surface-primary rounded-xl shadow-lg border border-light p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {!navVisible && (
                            <OpenSidebar setNavVisible={setNavVisible} className="mr-2 hidden md:flex" />
                        )}
                        <h1 className="text-2xl font-bold text-primary hidden md:block">{localize('com_ui_risk_analysis')}</h1>
                        
                        {/* Mode Selector Capsule (Verde-Esmeralda-Cyan Accent) */}
                        <div className="bg-surface-secondary border border-border-medium rounded-xl p-0.5 flex space-x-1 shadow-inner">
                            <button
                                onClick={() => {
                                    setIsOfflineMode(false);
                                    setOfflineReportGenerated(false);
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                                    !isOfflineMode
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md font-extrabold'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            >
                                En Vivo
                            </button>
                            <button
                                onClick={() => {
                                    setIsOfflineMode(true);
                                }}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                                    isOfflineMode
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md font-extrabold'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                            >
                                Carga Rápida (Offline)
                            </button>
                        </div>

                        {lastUpdated && (
                            <span className="text-xs text-green-600 font-medium animate-pulse hidden md:inline">
                                {localize('com_ui_updated_at')} {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <ModelSelector
                            selectedModel={selectedModel}
                            onSelectModel={setSelectedModel}
                        />
                        {/* History Button — same style as ModelSelector */}
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className={`group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 ${
                                isHistoryOpen
                                    ? 'bg-surface-hover ring-2 ring-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400'
                                    : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary'
                             }`}
                        >
                            <History className="h-5 w-5 flex-shrink-0" />
                            <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                <span className="text-sm font-bold tracking-wide">{localize('com_ui_history')}</span>
                            </div>
                        </button>
                        
                        {/* Action buttons (Camera / Offline state dependent) */}
                        {isOfflineMode ? (
                            offlineReportGenerated && (
                                <button
                                    onClick={() => setOfflineReportGenerated(false)}
                                    className="group flex flex-shrink-0 items-center justify-center h-10 px-3 transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:text-teal-600 hover:border-teal-500/50"
                                >
                                    <Upload className="h-5 w-5 flex-shrink-0 animate-bounce" />
                                    <span className="text-sm font-bold tracking-wide ml-2">Nueva Carga Offline</span>
                                </button>
                            )
                        ) : (
                            <button
                                onClick={handleStartAnalysis}
                                className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:text-teal-600 hover:border-teal-500/50"
                            >
                                <Video className="h-5 w-5 flex-shrink-0" />
                                <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                    <span className="text-sm font-bold tracking-wide">{localize('com_ui_start_live_analysis')}</span>
                                </div>
                            </button>
                        )}

                        {/* Save Report Button — same style as ModelSelector */}
                        <button
                            onClick={handleSave}
                            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:text-emerald-600 hover:border-emerald-500/50"
                        >
                            <Save className="h-5 w-5 flex-shrink-0" />
                            <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                <span className="text-sm font-bold tracking-wide">{localize('com_ui_save_report')}</span>
                            </div>
                        </button>
                        <div onClickCapture={(e) => {
                            if (!isPro) {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowUpgradeModal(true);
                            }
                        }}>
                            <ExportDropdown
                                content={editorContent || initialReportContent}
                                fileName="Informe_Analisis_Riesgos"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Full Screen Editor or Offline Submission Form */}
            <div className="flex-1 overflow-hidden p-4 bg-surface-secondary">
                <div className="h-full max-w-5xl mx-auto bg-surface-primary rounded-xl shadow-lg overflow-hidden border border-light">
                    {isOfflineMode && !offlineReportGenerated ? (
                        <div className="h-full overflow-y-auto p-6 flex flex-col space-y-6 relative bg-gradient-to-b from-surface-primary to-surface-secondary">
                            
                            {/* Scanning/Pulse Indicator during report generation */}
                            {isGeneratingOfflineReport && (
                                <div className="absolute inset-0 bg-black/55 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
                                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                                        {/* Radial frequency wave effect */}
                                        <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
                                        <div className="absolute inset-2 rounded-full bg-cyan-500/30 animate-pulse" />
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                            <Sparkles className="h-6 w-6 text-white animate-spin-slow" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-wide animate-pulse">Wappy-Audit HSE Command Center</h3>
                                    <p className="text-cyan-400 text-sm mt-2 font-mono">PROCESANDO EVIDENCIAS & FORMULANDO MATRIZ GTC 45...</p>
                                    <div className="w-64 h-1.5 bg-gray-700 rounded-full mt-4 overflow-hidden relative">
                                        <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full w-2/3 animate-[loading-bar_2s_ease-in-out_infinite]" />
                                    </div>
                                    <p className="text-gray-300 text-xs mt-6 max-w-md">Gemini Flash está analizando secuencialmente el video/imágenes y estructurando el informe reglamentario.</p>
                                </div>
                            )}

                            {/* Form Header */}
                            <div className="flex flex-col space-y-1 pb-4 border-b border-light">
                                <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
                                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                                    <span className="text-xs font-mono font-bold tracking-widest uppercase">Modo Carga Rápida (Offline)</span>
                                </div>
                                <h2 className="text-xl font-black text-text-primary">Inspección de HSE en Entornos de Baja Cobertura</h2>
                                <p className="text-sm text-text-secondary">Sube fotos tomadas previamente en campo o graba/carga un video de hasta 10 segundos. Wappy IA generará una auditoría completa bajo el estándar GTC 45.</p>
                            </div>

                            {/* Step 1: Template Selection (Guided Cards) */}
                            <div className="flex flex-col space-y-3">
                                <label className="text-sm font-bold text-text-primary tracking-wide">1. Seleccionar Plantilla de Inspección:</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'general', title: 'ISO 45001 General', desc: 'Entorno de trabajo, EPPs, ergonomía y orden general.', color: 'border-blue-500/30 hover:border-blue-500', activeBg: 'bg-blue-500/10 border-blue-500/80 ring-2 ring-blue-500/20' },
                                        { id: 'alturas', title: 'Trabajo en Alturas', desc: 'Líneas de vida, puntos de anclaje, arneses y certificados.', color: 'border-orange-500/30 hover:border-orange-500', activeBg: 'bg-orange-500/10 border-orange-500/80 ring-2 ring-orange-500/20' },
                                        { id: 'eléctrico', title: 'Riesgo Eléctrico', desc: 'Tableros, cableado, sistema LOTO y herramientas aisladas.', color: 'border-yellow-500/30 hover:border-yellow-500', activeBg: 'bg-yellow-500/10 border-yellow-500/80 ring-2 ring-yellow-500/20' },
                                        { id: '5s', title: 'Orden & Aseo (5S)', desc: 'Clasificar, organizar, limpiar, estandarizar y disciplina.', color: 'border-emerald-500/30 hover:border-emerald-500', activeBg: 'bg-emerald-500/10 border-emerald-500/80 ring-2 ring-emerald-500/20' },
                                        { id: 'biomecanico_estandar', title: 'Riesgo Biomecánico', desc: 'Ergonomía cualitativa, cargas, posturas y movimientos repetitivos.', color: 'border-purple-500/30 hover:border-purple-500', activeBg: 'bg-purple-500/10 border-purple-500/80 ring-2 ring-purple-500/20' },
                                        { id: 'biomecanico_mediapipe', title: 'Biomecánico (MediaPipe)', desc: 'Ergonomía cuantitativa asistida por IA y telemetría articular en vivo.', color: 'border-cyan-500/30 hover:border-cyan-500', activeBg: 'bg-cyan-500/10 border-cyan-500/80 ring-2 ring-cyan-500/20' }
                                    ].map(tmpl => (
                                        <div
                                            key={tmpl.id}
                                            onClick={() => setOfflineTemplate(tmpl.id)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between h-32 hover:-translate-y-1 hover:shadow-md ${
                                                offlineTemplate === tmpl.id ? tmpl.activeBg : `bg-surface-primary ${tmpl.color}`
                                            }`}
                                        >
                                            <div>
                                                <h4 className="text-sm font-black text-text-primary">{tmpl.title}</h4>
                                                <p className="text-xs text-text-secondary mt-1 line-clamp-3 leading-relaxed">{tmpl.desc}</p>
                                            </div>
                                            <div className="flex justify-end items-center mt-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${offlineTemplate === tmpl.id ? 'bg-current animate-pulse' : 'bg-gray-300'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Evidence Upload */}
                            <div className="flex flex-col space-y-3">
                                <label className="text-sm font-bold text-text-primary tracking-wide">2. Cargar Evidencia de Campo (Máx 5 fotos o 1 video corto de 10s):</label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Drag & Drop File Input */}
                                    <div className="relative border-2 border-dashed border-border-medium hover:border-teal-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-surface-primary/40 hover:bg-surface-hover/20 transition-all duration-300">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                        <Upload className="h-10 w-10 text-text-secondary mb-3 hover:text-teal-500 transition-colors" />
                                        <p className="text-sm font-bold text-text-primary">Arrastra tus archivos aquí o haz clic para explorar</p>
                                        <p className="text-xs text-text-secondary mt-2">Soporta múltiples imágenes o un video de hasta 10 segundos.</p>
                                    </div>

                                    {/* Previews panel */}
                                    <div className="bg-surface-primary/50 border border-border-medium rounded-2xl p-4 flex flex-col justify-center min-h-[160px]">
                                        {offlineFiles.length === 0 ? (
                                            <p className="text-xs text-text-secondary text-center italic">Ningún archivo cargado todavía. La evidencia visual es obligatoria para realizar la auditoría.</p>
                                        ) : (
                                            <div className="flex flex-col space-y-4 w-full">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                                                        {offlineVideoPreview ? '1 Video Detectado' : `${offlineFiles.length} Imagen(es) Detectada(s)`}
                                                    </span>
                                                    <button
                                                        onClick={clearOfflineFiles}
                                                        className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        <span>Eliminar todos</span>
                                                    </button>
                                                </div>

                                                {/* Image Thumbnail Strip */}
                                                {offlineImagesPreview.length > 0 && (
                                                    <div className="flex flex-wrap gap-3">
                                                        {offlineImagesPreview.map((src, idx) => (
                                                            <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-light">
                                                                <img src={src} className="w-full h-full object-cover" alt="Preview" />
                                                                <button
                                                                    onClick={() => removeOfflineImage(idx)}
                                                                    className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Video Player Preview */}
                                                {offlineVideoPreview && (
                                                    <div className="relative w-full rounded-xl overflow-hidden border border-light max-h-48 bg-black">
                                                        <video src={offlineVideoPreview} controls className="w-full h-full max-h-48 object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Speech / Notes */}
                            <div className="flex flex-col space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-text-primary tracking-wide">3. Notas y Observaciones en Campo (Opcional):</label>
                                    <button
                                        onClick={toggleSpeechRecognition}
                                        className={`flex items-center space-x-2 px-3 py-1 text-xs font-bold rounded-lg transition-all border outline-none hover:scale-105 duration-300 cursor-pointer ${
                                            isListening
                                                ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 animate-pulse'
                                                : 'bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:text-teal-600'
                                        }`}
                                    >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        <span>{isListening ? 'Detener Dictado' : 'Dictar Notas'}</span>
                                    </button>
                                </div>

                                <textarea
                                    value={offlineNotes}
                                    onChange={(e) => setOfflineNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Escribe o dicta aquí detalles sobre EPP faltantes, actos inseguros dinámicos observados, condiciones del terreno, o cualquier anotación crítica para el reporte de riesgos..."
                                    className="w-full p-4 rounded-2xl border border-border-medium bg-surface-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm text-text-primary shadow-sm leading-relaxed"
                                />
                            </div>

                            {/* Step 4: Submission Trigger */}
                            <div className="pt-4 border-t border-light flex justify-end">
                                <button
                                    onClick={handleSubmitOfflineReport}
                                    disabled={offlineFiles.length === 0 || isGeneratingOfflineReport}
                                    className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center space-x-3 cursor-pointer ${
                                        offlineFiles.length === 0
                                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-teal-500/20 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <Sparkles className="h-5 w-5" />
                                    <span>Generar Reporte de Inspección</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <LiveEditor
                            ref={editorRef}
                            initialContent={editorContent || initialReportContent}
                            onUpdate={(html) => {
                                setEditorContent(html);
                            }}
                            onSave={handleSave}
                            paperMode={false}
                            reportSourceData={reportSourceData}
                        />
                    )}
                </div>
            </div>

            {/* Live Analysis Modal Overlay */}
            {isModalOpen && (
                <LiveAnalysisModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    conversationId={conversationId}
                    onConversationIdUpdate={setConversationId}
                    onTextReceived={handleTextReceived}
                    onReportReceived={handleReportReceived}
                    selectedModel={selectedModel}
                />
            )}
            </div>

            {/* Upgrade Modal (Freemium Teaser) */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setShowUpgradeModal(false)} 
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold bg-white/10 px-3 py-1 rounded-full backdrop-blur-md text-sm"
                        >
                            Cerrar ✕
                        </button>
                        <div className="bg-surface-primary rounded-3xl shadow-2xl overflow-hidden">
                            <UpgradeWall
                                title="Desbloquear Reportes"
                                description="Adquiere Premium para redactar y guardar el informe."
                                plan="USER_PRO"
                                isCompact={true}
                                hideFeatures={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LivePage;
