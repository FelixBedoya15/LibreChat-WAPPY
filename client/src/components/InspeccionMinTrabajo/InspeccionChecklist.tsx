import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, ChevronDown, ChevronRight, FileText, Sparkles, Loader2, HelpCircle, AlertTriangle } from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { INSPECCION_ITEMS, CATEGORIA_LABELS, CATEGORIA_COLORS, MAX_SCORE, InspeccionItem } from './inspeccionData';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import { useAuthContext } from '~/hooks';
import ModelSelector, { AI_MODELS } from '~/components/SGSST/ModelSelector';
import ExportDropdown from '~/components/SGSST/ExportDropdown';
import { useAutoLoadReport } from '~/components/SGSST/useAutoLoadReport';
import SGSSTToolbar from '~/components/SGSST/SGSSTToolbar';
import CollapsibleReportBox from '~/components/SGSST/CollapsibleReportBox';
import axios from 'axios';

interface ComplianceStatus {
  itemId: string;
  status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
}

const STATUS_OPTIONS = [
  { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  { value: 'parcial' as const, label: 'Parcial', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
  { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10' },
];

const InspeccionChecklist: React.FC = () => {
  const { showToast } = useToastContext();
  const { user, token } = useAuthContext();
  const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => user?.personalization?.geminiModels?.sstManagement || AI_MODELS[0].id);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState('new');
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const STORAGE_KEY = 'sgsst_inspeccion_form';

  // Company info auto-loaded
  const companyInfo = useMemo(() => ({
    razonSocial: user?.company || '',
    nit: '',
    ciudad: '',
    representanteLegal: user?.name || '',
    arl: '',
  }), [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.statuses) setStatuses(d.statuses);
        if (d.observations) setObservations(d.observations);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const validStatuses = useMemo(() => {
    const ids = new Set(INSPECCION_ITEMS.map(i => i.id));
    return statuses.filter(s => ids.has(s.itemId));
  }, [statuses]);

  const completedCount = useMemo(() => validStatuses.filter(s => s.status !== 'pendiente').length, [validStatuses]);

  const earnedScore = useMemo(() => validStatuses.reduce((acc, s) => {
    if (s.status === 'cumple' || s.status === 'no_aplica') {
      const item = INSPECCION_ITEMS.find(i => i.id === s.itemId);
      return acc + (item?.points || 0);
    }
    return acc;
  }, 0), [validStatuses]);

  const scorePercentage = useMemo(() => MAX_SCORE > 0 ? (earnedScore / MAX_SCORE) * 100 : 0, [earnedScore]);

  const complianceLevel = useMemo(() => {
    if (scorePercentage >= 85) return { label: 'Favorable', color: 'text-green-600 bg-green-100' };
    if (scorePercentage >= 60) return { label: 'Con Observaciones', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Crítico', color: 'text-red-600 bg-red-100' };
  }, [scorePercentage]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, InspeccionItem[]> = { laboral: [], genero: [], sgsst: [] };
    INSPECCION_ITEMS.forEach(item => { if (groups[item.category]) groups[item.category].push(item); });
    return groups;
  }, []);

  const getItemStatus = useCallback((id: string) => statuses.find(s => s.itemId === id)?.status || 'pendiente', [statuses]);

  const handleStatusChange = useCallback((itemId: string, status: ComplianceStatus['status']) => {
    setStatuses(prev => {
      const existing = prev.find(s => s.itemId === itemId);
      return existing ? prev.map(s => s.itemId === itemId ? { ...s, status } : s) : [...prev, { itemId, status }];
    });
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleSaveData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses: validStatuses, observations }));
      showToast({ message: 'Guardado localmente', status: 'success', severity: 'success' });
    } catch { showToast({ message: 'Error al guardar', status: 'error' }); }
  }, [validStatuses, observations, showToast]);

  const handleAnalyze = useCallback(async () => {
    if (completedCount === 0) { showToast({ message: 'Complete al menos un ítem', status: 'warning' }); return; }
    setIsAnalyzing(true);
    try {
      const analysisData = {
        type: 'inspeccion_mintrabajo',
        checklist: INSPECCION_ITEMS.map(item => ({ ...item, status: getItemStatus(item.id), points: item.points })),
        score: earnedScore, maxScore: MAX_SCORE,
        complianceLevel: { level: complianceLevel.label },
        scorePercentage,
        companyInfo,
        userName: user?.name || 'Inspector',
        currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        observations,
        model: selectedModel,
      };
      const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, { timeout: 200000 });
      const cleanReport = response.data.report.replace(/<img[^>]*>/gi, '');
      setAnalysisReport(cleanReport);
      editorContentRef.current = cleanReport;
      liveEditorRef.current?.setHTML(cleanReport);
      setConversationId('new'); setReportMessageId(null);
      showToast({ message: 'Informe de Inspección generado', status: 'success', severity: 'success' });
    } catch (error: any) {
      showToast({ message: `Error: ${error.response?.data?.error || error.message}`, status: 'error', duration: 8000 });
    } finally { setIsAnalyzing(false); }
  }, [completedCount, earnedScore, complianceLevel, scorePercentage, getItemStatus, showToast, user, companyInfo, observations, selectedModel]);

  const handleSave = useCallback(async () => {
    let contentToSave = editorContentRef.current || analysisReport;
    if (!contentToSave || !token) return;
    const stateStr = `<!-- SGSST_INSPECCION_V1:${JSON.stringify({ statuses: validStatuses, observations })} -->`;
    contentToSave = contentToSave.replace(/<!-- SGSST_INSPECCION_V1:.*? -->/g, '') + stateStr;
    const isNew = !conversationId || conversationId === 'new';
    try {
      const body = { content: contentToSave, title: `Inspección MinTrabajo - ${new Date().toLocaleDateString('es-CO')}`, tags: ['sgsst-inspeccion-mintrabajo'], ...(isNew ? {} : { conversationId, messageId: reportMessageId }) };
      const res = await fetch('/api/sgsst/diagnostico/save-report', { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
        setAnalysisReport(contentToSave); editorContentRef.current = contentToSave; liveEditorRef.current?.setHTML(contentToSave);
        setRefreshTrigger(p => p + 1);
        showToast({ message: 'Guardado exitosamente', status: 'success', severity: 'success' });
      }
    } catch { showToast({ message: 'Error al guardar', status: 'error' }); }
  }, [editorContentRef.current, analysisReport, token, conversationId, reportMessageId, showToast, validStatuses, observations]);

  const handleSelectReport = useCallback(async (selectedConvoId: string) => {
    try {
      const res = await fetch(`/api/messages/${selectedConvoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const messages = await res.json();
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.text) {
        const stateMatch = lastMsg.text.match(/<!-- SGSST_INSPECCION_V1:(.*?) -->/);
        let content = lastMsg.text;
        if (stateMatch?.[1]) {
          try { const d = JSON.parse(stateMatch[1]); if (d.statuses) setStatuses(d.statuses); if (d.observations) setObservations(d.observations); } catch { /* ignore */ }
          content = content.replace(/<!-- SGSST_INSPECCION_V1:.*? -->/g, '');
        }
        setAnalysisReport(content); editorContentRef.current = content; liveEditorRef.current?.setHTML(content);
        setConversationId(selectedConvoId); setReportMessageId(lastMsg.messageId); setIsHistoryOpen(false);
        showToast({ message: 'Inspección cargada y restaurada', status: 'success', severity: 'success' });
      }
    } catch { showToast({ message: 'Error al cargar', status: 'error' }); }
  }, [token, showToast]);

  useAutoLoadReport({ token, tags: ['sgsst-inspeccion-mintrabajo'], generatedReport: analysisReport, handleSelectReport });

  return (
    <div className="flex flex-col gap-6">
      {/* Company Info Panel */}
      <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-black text-text-secondary uppercase tracking-widest">Información del Establecimiento</span>
          <span className="ml-auto text-xs text-text-tertiary bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Auto-completado</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Razón Social', value: companyInfo.razonSocial, placeholder: 'Nombre empresa' },
            { label: 'Representante Legal', value: companyInfo.representanteLegal, placeholder: 'Nombre representante' },
          ].map(field => (
            <div key={field.label} className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wider">{field.label}</label>
              <div className="px-3 py-2 rounded-xl border border-border-medium bg-surface-primary text-sm text-text-primary">
                {field.value || <span className="text-text-tertiary italic">{field.placeholder}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Cards */}
      <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-text-primary">Acta de Inspección General – MinTrabajo</h3>
            <p className="text-xs text-text-secondary">Código: IVC-PD-54-F-01 / Versión 1.0</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-primary p-4 rounded-2xl border border-border-medium flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-text-secondary">Puntaje Ponderado</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-text-primary">{earnedScore}</span>
                <span className="text-sm font-medium text-text-secondary">/ {MAX_SCORE} pts</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', complianceLevel.color)}>{complianceLevel.label.toUpperCase()}</span>
              </div>
            </div>
            <div className={cn('h-12 w-12 rounded-full border-4 flex items-center justify-center text-xs font-bold', scorePercentage >= 85 ? 'border-green-500 text-green-600' : scorePercentage >= 60 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600')}>
              {scorePercentage.toFixed(0)}%
            </div>
          </div>
          <div className="bg-surface-primary p-4 rounded-2xl border border-border-medium flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-text-secondary">Ítems Evaluados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-text-primary">{completedCount}</span>
                <span className="text-xs text-text-tertiary">/ {INSPECCION_ITEMS.length} ítems</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-blue-500 flex items-center justify-center text-xs font-bold bg-blue-50 text-blue-700">
              {INSPECCION_ITEMS.length > 0 ? Math.round((completedCount / INSPECCION_ITEMS.length) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary font-medium">Progreso Ponderado</span>
            <span className="font-bold text-text-primary">{scorePercentage.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
            <div className={cn('h-full transition-all duration-300', scorePercentage >= 85 ? 'bg-green-500' : scorePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${scorePercentage}%` }} />
          </div>
        </div>
        <SGSSTToolbar
          onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          isHistoryOpen={isHistoryOpen}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onSaveLocal={handleSaveData}
          hasContent={!!(editorContentRef.current || analysisReport)}
          exportContent={editorContentRef.current || analysisReport || ''}
          exportFileName="Acta_Inspeccion_MinTrabajo"
        />
      </div>

      {/* Checklist by category */}
      <div className="space-y-4">
        {(['laboral', 'genero', 'sgsst'] as const).map(category => {
          const items = groupedItems[category];
          if (!items?.length) return null;
          const isExpanded = expandedCategories.has(category);
          const catCompleted = items.filter(i => getItemStatus(i.id) !== 'pendiente').length;
          return (
            <div key={category} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm">
              <button onClick={() => toggleCategory(category)} className={cn('flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-tertiary border-l-4', CATEGORIA_COLORS[category])}>
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                  <span className="font-bold">{CATEGORIA_LABELS[category]}</span>
                  <span className="text-sm text-text-secondary">({catCompleted}/{items.length})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y divide-border-light">
                  {items.map(item => {
                    const status = getItemStatus(item.id);
                    return (
                      <div key={item.id} className="bg-surface-primary/50">
                        <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-col gap-1.5">
                                  <h4 className="font-medium text-text-primary text-base">
                                    <span className="font-bold text-blue-600 mr-2">{item.code}</span>{item.name}
                                    {item.isInformative && <span className="ml-2 text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">INFORMATIVO</span>}
                                  </h4>
                                  <span className="inline-block font-mono text-[10px] uppercase tracking-wide font-bold text-text-tertiary bg-surface-tertiary px-2 py-1 rounded border border-border-light w-fit">{item.criteria} · {item.points} pts</span>
                                </div>
                                <p className="mt-1 text-sm text-text-secondary">{item.description}</p>
                                {expandedItems.has(item.id) && item.normativeText && (
                                  <div className="mt-2 text-xs text-text-tertiary bg-surface-tertiary p-2 rounded whitespace-pre-wrap">{item.normativeText}</div>
                                )}
                                <button onClick={() => toggleItem(item.id)} className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1">
                                  <HelpCircle className="h-3 w-3" /> {expandedItems.has(item.id) ? 'Ocultar' : 'Ver'} fundamento legal
                                </button>
                              </div>
                              <div className="flex sm:flex-col lg:flex-row flex-wrap gap-1 sm:ml-4 sm:flex-shrink-0 border-t sm:border-t-0 border-border-light pt-3 sm:pt-0 justify-between sm:justify-end">
                                {STATUS_OPTIONS.map(opt => (
                                  <button key={opt.value} onClick={() => handleStatusChange(item.id, opt.value)} className={cn('rounded-xl p-2 transition-all flex-1 sm:flex-none flex justify-center', status === opt.value ? opt.color : 'text-text-tertiary hover:bg-surface-tertiary')} title={opt.label}>
                                    <opt.icon className="h-5 w-5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        {(status === 'parcial' || status === 'no_cumple' || status === 'no_aplica') && (
                          <div className="px-4 pb-4">
                            <textarea placeholder="Describa el hallazgo, evidencia o motivo..." value={observations[item.id] || ''} onChange={e => setObservations(prev => ({ ...prev, [item.id]: e.target.value }))} className="w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-blue-500 focus:outline-none resize-none" rows={2} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CollapsibleReportBox onSave={handleSave} onHistory={() => setIsHistoryOpen(!isHistoryOpen)} isHistoryOpen={isHistoryOpen} title="Acta de Inspección MinTrabajo" icon={<FileText className="h-5 w-5 text-blue-700" />} actions={<ExportDropdown content={editorContentRef.current || analysisReport || ''} fileName="Acta_Inspeccion_MinTrabajo" reportType="general" />}>
        <div style={{ minHeight: '400px', overflowX: 'auto' }}>
          <div style={{ minWidth: '900px' }}>
            <LiveEditor ref={liveEditorRef} reportType="checklist" initialContent={analysisReport} onUpdate={html => { editorContentRef.current = html; }} />
          </div>
        </div>
      </CollapsibleReportBox>

      <ReportHistory isOpen={isHistoryOpen} toggleOpen={() => setIsHistoryOpen(false)} onSelectReport={handleSelectReport} refreshTrigger={refreshTrigger} tags={['sgsst-inspeccion-mintrabajo']} />
    </div>
  );
};

export default InspeccionChecklist;
