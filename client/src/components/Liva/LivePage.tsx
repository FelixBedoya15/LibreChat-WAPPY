import React, { useState, useEffect, useCallback, useRef } from 'react';
import LiveEditor, { type LiveEditorHandle } from './Editor/LiveEditor';
import LiveAnalysisModal from './LiveAnalysisModal';
import ReportHistory from './ReportHistory';
import { Video, Save, History } from 'lucide-react';
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
    // Imperative ref to push HTML content into the editor directly
    const editorRef = useRef<LiveEditorHandle>(null);

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
<div style="font-family:'Segoe UI',Arial,sans-serif; max-width:900px; margin:0 auto; color:#222;">
  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#0d2d5e 0%,#1565c0 100%); padding:28px 32px; border-radius:12px 12px 0 0; margin-bottom:0;">
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
      <div>
        <div style="color:#64b5f6; font-size:0.7em; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px;">Sistema de Gestión de Seguridad y Salud en el Trabajo</div>
        <h1 style="color:#fff; font-size:1.6em; font-weight:800; margin:0 0 4px;">Informe de Análisis de Riesgos y Peligros</h1>
        <div style="color:#90caf9; font-size:0.8em;">Modalidad: Inspección en Vivo (Live Analysis)</div>
      </div>
      <div style="text-align:right;">
        <div style="background:rgba(255,255,255,0.15); border-radius:8px; padding:10px 16px; min-width:160px;">
          <div style="color:#64b5f6; font-size:0.65em; font-weight:700; letter-spacing:2px; text-transform:uppercase;">Radicado</div>
          <div style="color:#fff; font-size:1.1em; font-weight:700;">LA-PENDIENTE</div>
          <div style="color:#90caf9; font-size:0.7em; margin-top:4px;">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- INFO BAR -->
  <div style="background:#e3f2fd; border:1px solid #90caf9; border-top:none; padding:12px 24px; display:flex; flex-wrap:wrap; gap:24px; font-size:0.8em; color:#1565c0;">
    <div><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</div>
    <div><strong>Hora:</strong> --:--</div>
    <div><strong>Tipo:</strong> Inspección de Riesgos en Vivo</div>
    <div><strong>Estado:</strong> <span style="color:#e65100; font-weight:700;">En Espera</span></div>
  </div>

  <!-- BODY -->
  <div style="background:#fff; border:1px solid #e0e0e0; border-top:none; padding:28px 32px 16px; min-height: 200px;">
    <p style="color:#7f8c8d; text-align:center; font-style:italic; margin-top:40px;">Activa la cámara para comenzar el análisis predictivo de riesgos en tiempo real.</p>
  </div>
</div>`;

    const handleSave = async () => {
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }
        const contentToSave = editorContent || initialReportContent;

        if (!token) {
            showToast({ message: 'Error: No autorizado (Token faltante)', status: 'error' });
            return;
        }

        const dateStr = new Date().toLocaleDateString('es-CO');

        try {
            // SCENARIO A: Update existing report (PUT)
            if (conversationId && conversationId !== 'new' && reportMessageId) {
                const res = await fetch('/api/sgsst/diagnostico/save-report', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ conversationId, messageId: reportMessageId, content: contentToSave }),
                });
                if (res.ok) {
                    setRefreshTrigger(prev => prev + 1);
                    showToast({ message: 'Informe actualizado exitosamente', status: 'success', severity: 'success' });
                } else {
                    showToast({ message: `Error al actualizar: ${res.status}`, status: 'error' });
                }
                return;
            }

            // SCENARIO B: Create new report (POST)
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    content: contentToSave,
                    title: `Editor Live - ${dateStr}`,
                    tags: ['report'],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConversationId(data.conversationId);
                setReportMessageId(data.messageId);
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
            />

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
                        {/* Start Analysis Button — same style as ModelSelector */}
                        <button
                            onClick={handleStartAnalysis}
                            className="group flex flex-shrink-0 items-center justify-center h-10 px-2.5 min-w-[40px] transition-all duration-300 shadow-sm shrink-0 cursor-pointer border outline-none rounded-xl hover:-rotate-3 hover:scale-105 bg-surface-primary border-border-medium hover:bg-surface-hover text-text-primary hover:text-teal-600 hover:border-teal-500/50"
                        >
                            <Video className="h-5 w-5 flex-shrink-0" />
                            <div className="flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
                                <span className="text-sm font-bold tracking-wide">{localize('com_ui_start_live_analysis')}</span>
                            </div>
                        </button>
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

            {/* Main Content: Full Screen Editor */}
            <div className="flex-1 overflow-hidden p-4 bg-surface-secondary">
                <div className="h-full max-w-5xl mx-auto bg-surface-primary rounded-xl shadow-lg overflow-hidden border border-light">
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
