import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sparkles, Loader2, HeartPulse, Briefcase, AlertTriangle, ShieldAlert, 
  CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp, ChevronRight, CheckCircle2, 
  XCircle, AlertCircle, MinusCircle, FileText, HelpCircle, Scale 
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { SGSSTToolbar } from './SGSSTToolbar';
import { INSPECCION_ITEMS, CATEGORIA_LABELS, CATEGORIA_COLORS, MAX_SCORE, InspeccionItem } from '../InspeccionMinTrabajo/inspeccionData';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ModelSelector, { AI_MODELS } from '~/components/SGSST/ModelSelector';
import ExportDropdown from '~/components/SGSST/ExportDropdown';
import { useAutoLoadReport } from '~/components/SGSST/useAutoLoadReport';
import CollapsibleReportBox from '~/components/SGSST/CollapsibleReportBox';
import axios from 'axios';
import { cn } from '~/utils';

interface ComplianceStatus {
  itemId: string;
  status: 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';
}

const SCORE_COLOR = (s: number) => {
  if (s >= 85) return { ring: 'text-green-500', text: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', stroke: '#10b981' };
  if (s >= 60) return { ring: 'text-amber-500', text: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', stroke: '#f59e0b' };
  return { ring: 'text-red-500', text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', stroke: '#ef4444' };
};

const SEV_STYLES: Record<string, { icon: React.ReactNode; border: string; pts: string; bg: string }> = {
  critical: { icon: <ShieldAlert className="w-4 h-4 text-red-500" />, border: 'border-red-200 dark:border-red-900/30', pts: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  warning:  { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, border: 'border-amber-200 dark:border-amber-900/30', pts: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  info:     { icon: <HeartPulse className="w-4 h-4 text-blue-400" />, border: 'border-blue-100 dark:border-blue-900/30', pts: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
};

const STATUS_OPTIONS = [
  { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 hover:bg-green-500/20 border-green-500/20' },
  { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: 'text-red-500 bg-red-500/10 hover:bg-red-500/20 border-red-500/20' },
  { value: 'parcial' as const, label: 'Parcial', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20' },
  { value: 'no_aplica' as const, label: 'No Aplica', icon: MinusCircle, color: 'text-gray-400 bg-gray-400/10 hover:bg-gray-400/20 border-gray-400/20' },
];

export default function InspeccionTrabajoH1() {
  const { showToast } = useToastContext();
  const { user, token } = useAuthContext();
  const [statuses, setStatuses] = useState<ComplianceStatus[]>([]);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['laboral']));
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
  const [customPrompt, setCustomPrompt] = useState('');
  
  const STORAGE_KEY = 'sgsst_inspeccion_form_h1';

  // Company info auto-loaded
  const companyInfo = useMemo(() => ({
    razonSocial: (user as any)?.company || '',
    nit: '',
    borderColor: '',
    ciudad: '',
    representanteLegal: user?.name || '',
    arl: '',
  }), [user]);

  // Load saved progress
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

  const getItemStatus = useCallback((id: string) => statuses.find(s => s.itemId === id)?.status || 'pendiente', [statuses]);

  // Score calculations
  const earnedScore = useMemo(() => validStatuses.reduce((acc, s) => {
    if (s.status === 'cumple' || s.status === 'no_aplica') {
      const item = INSPECCION_ITEMS.find(i => i.id === s.itemId);
      return acc + (item?.points || 0);
    }
    return acc;
  }, 0), [validStatuses]);

  const scorePercentage = useMemo(() => MAX_SCORE > 0 ? (earnedScore / MAX_SCORE) * 100 : 0, [earnedScore]);

  const sc = useMemo(() => SCORE_COLOR(scorePercentage), [scorePercentage]);

  const complianceLevel = useMemo(() => {
    if (scorePercentage >= 85) return { label: 'Favorable', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
    if (scorePercentage >= 60) return { label: 'Con Observaciones', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return { label: 'Crítico', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
  }, [scorePercentage]);

  // Category breakdown calculation
  const catStats = useMemo(() => {
    const stats: Record<string, { earned: number; total: number; pct: number }> = {
      laboral: { earned: 0, total: 0, pct: 0 },
      genero: { earned: 0, total: 0, pct: 0 },
      sgsst: { earned: 0, total: 0, pct: 0 }
    };

    INSPECCION_ITEMS.forEach(item => {
      if (stats[item.category]) {
        stats[item.category].total += item.points;
        const status = getItemStatus(item.id);
        if (status === 'cumple' || status === 'no_aplica') {
          stats[item.category].earned += item.points;
        }
      }
    });

    Object.keys(stats).forEach(cat => {
      const s = stats[cat];
      s.pct = s.total > 0 ? (s.earned / s.total) * 100 : 0;
    });

    return stats;
  }, [statuses, getItemStatus]);

  // Alertas Críticas (no cumple or parcial)
  const auditAlerts = useMemo(() => {
    const alerts: { item: InspeccionItem; status: string; observation: string; severity: 'critical' | 'warning' | 'info' }[] = [];
    validStatuses.forEach(s => {
      if (s.status === 'no_cumple' || s.status === 'parcial') {
        const item = INSPECCION_ITEMS.find(i => i.id === s.itemId);
        if (item) {
          let severity: 'critical' | 'warning' | 'info' = 'info';
          if (item.points >= 4) severity = 'critical';
          else if (item.points === 3) severity = 'warning';
          
          alerts.push({
            item,
            status: s.status,
            observation: observations[item.id] || '',
            severity
          });
        }
      }
    });
    // Sort critical first, then warnings
    return alerts.sort((a, b) => b.item.points - a.item.points);
  }, [validStatuses, observations]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, InspeccionItem[]> = { laboral: [], genero: [], sgsst: [] };
    INSPECCION_ITEMS.forEach(item => { if (groups[item.category]) groups[item.category].push(item); });
    return groups;
  }, []);

  const handleStatusChange = useCallback((itemId: string, status: ComplianceStatus['status']) => {
    setStatuses(prev => {
      const existing = prev.find(s => s.itemId === itemId);
      const updated = existing ? prev.map(s => s.itemId === itemId ? { ...s, status } : s) : [...prev, { itemId, status }];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses: updated, observations }));
      } catch (e) { /* ignore */ }
      return updated;
    });
  }, [observations]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleSaveData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses: validStatuses, observations }));
      showToast({ message: 'Progreso guardado localmente', status: 'success', severity: 'success' as any });
    } catch { showToast({ message: 'Error al guardar localmente', status: 'error' }); }
  }, [validStatuses, observations, showToast]);

  const handleDummy = useCallback(() => {
    const newStatuses: ComplianceStatus[] = [];
    const newObservations: Record<string, string> = {};

    INSPECCION_ITEMS.forEach(item => {
      const rand = Math.random();
      let status: ComplianceStatus['status'] = 'cumple';
      if (rand < 0.12) {
        status = 'no_cumple';
        newObservations[item.id] = `No se cuenta con registro físico ni digital que acredite el cumplimiento del estándar (${item.criteria}).`;
      } else if (rand < 0.22) {
        status = 'parcial';
        newObservations[item.id] = `Se dispone de un borrador preliminar pendiente de socialización, aprobación y firma de la gerencia.`;
      } else if (rand < 0.26) {
        status = 'no_aplica';
        newObservations[item.id] = `Estándar no aplicable según la caracterización de riesgos y actividad económica.`;
      }
      newStatuses.push({ itemId: item.id, status });
    });

    setStatuses(newStatuses);
    setObservations(newObservations);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses: newStatuses, observations: newObservations }));
    } catch (e) { /* ignore */ }
    showToast({ message: 'Datos de simulación cargados exitosamente', status: 'success', severity: 'success' as any });
  }, [showToast]);

  const handleAnalyze = useCallback(async () => {
    if (completedCount === 0) { showToast({ message: 'Complete al menos un ítem para realizar el análisis', status: 'warning' }); return; }
    setIsAnalyzing(true);
    try {
      const analysisData = {
        type: 'inspeccion_mintrabajo',
        checklist: INSPECCION_ITEMS.map(item => ({ ...item, status: getItemStatus(item.id), points: item.points })),
        score: earnedScore, 
        totalPoints: MAX_SCORE,
        complianceLevel: { level: complianceLevel.label },
        compliancePercentage: scorePercentage.toFixed(1),
        companyInfo,
        userName: user?.name || 'Prevencionista SST',
        currentDate: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        observations,
        model: selectedModel,
        customPrompt: customPrompt.trim()
      };
      
      // We pass the analysis to the backend and append the custom user instructions if provided
      const response = await axios.post('/api/sgsst/diagnostico/analyze', analysisData, { timeout: 200000 });
      const cleanReport = response.data.report.replace(/<img[^>]*>/gi, '');
      setAnalysisReport(cleanReport);
      editorContentRef.current = cleanReport;
      liveEditorRef.current?.setHTML(cleanReport);
      setConversationId('new'); 
      setReportMessageId(null);
      showToast({ message: 'Informe de Defensa Legal generado', status: 'success', severity: 'success' as any });
    } catch (error: any) {
      showToast({ message: `Error: ${error.response?.data?.error || error.message}`, status: 'error', duration: 8000 });
    } finally { setIsAnalyzing(false); }
  }, [completedCount, earnedScore, complianceLevel, scorePercentage, getItemStatus, showToast, user, companyInfo, observations, selectedModel, customPrompt]);

  const handleSave = useCallback(async () => {
    let contentToSave = editorContentRef.current || analysisReport;
    if (!contentToSave || !token) return;
    const stateStr = `<!-- SGSST_INSPECCION_V1:${JSON.stringify({ statuses: validStatuses, observations })} -->`;
    contentToSave = contentToSave.replace(/<!-- SGSST_INSPECCION_V1:.*? -->/g, '') + stateStr;
    const isNew = !conversationId || conversationId === 'new';
    try {
      const body = { 
        content: contentToSave, 
        title: `Inspección de Trabajo MinTrabajo - ${new Date().toLocaleDateString('es-CO')}`, 
        tags: ['sgsst-inspeccion-mintrabajo'], 
        ...(isNew ? {} : { conversationId, messageId: reportMessageId }) 
      };
      const res = await fetch('/api/sgsst/diagnostico/save-report', { 
        method: isNew ? 'POST' : 'PUT', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(body) 
      });
      if (res.ok) {
        const data = await res.json();
        if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
        setAnalysisReport(contentToSave); 
        editorContentRef.current = contentToSave; 
        liveEditorRef.current?.setHTML(contentToSave);
        setRefreshTrigger(p => p + 1);
        showToast({ message: 'Informe guardado exitosamente ✅', status: 'success', severity: 'success' as any });
      }
    } catch { showToast({ message: 'Error al guardar informe', status: 'error' }); }
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
          try { 
            const d = JSON.parse(stateMatch[1]); 
            if (d.statuses) setStatuses(d.statuses); 
            if (d.observations) setObservations(d.observations); 
          } catch { /* ignore */ }
          content = content.replace(/<!-- SGSST_INSPECCION_V1:.*? -->/g, '');
        }
        setAnalysisReport(content); 
        editorContentRef.current = content; 
        liveEditorRef.current?.setHTML(content);
        setConversationId(selectedConvoId); 
        setReportMessageId(lastMsg.messageId); 
        setIsHistoryOpen(false);
        showToast({ message: 'Informe de inspección cargado y restaurado', status: 'success', severity: 'success' as any });
      }
    } catch { showToast({ message: 'Error al cargar informe', status: 'error' }); }
  }, [token, showToast]);

  useAutoLoadReport({ token, tags: ['sgsst-inspeccion-mintrabajo'], generatedReport: analysisReport, handleSelectReport });

  // Gauge parameters
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-400 blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-cyan-400 blur-3xl -ml-10 -mb-10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-400/20 backdrop-blur-sm border border-teal-400/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-teal-300" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Inspección de Trabajo (Mintrabajo)</h1>
          </div>
          <p className="text-teal-100/80 text-sm max-w-2xl leading-relaxed">
            Evaluación oficial alineada con el protocolo de Inspección, Vigilancia y Control del Ministerio de Trabajo. Mida la salud legal, configure alertas de sanciones y genere estrategias de defensa institucional.
          </p>
        </div>
      </div>

      {/* Split-Screen Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Circular Fitness Gauge */}
        <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <HeartPulse className="w-4 h-4 text-teal-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Salud Legal y Cumplimiento</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* SVG circular track */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className="text-surface-tertiary stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  className={cn("transition-all duration-500 stroke-current", sc.ring)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Centered text */}
              <div className="absolute text-center">
                <span className={cn("text-3xl font-black tracking-tight", sc.text)}>{scorePercentage.toFixed(0)}%</span>
                <span className="block text-[9px] uppercase tracking-widest text-text-tertiary font-bold mt-0.5">Cumplimiento</span>
              </div>
            </div>
            
            <div className={cn('mt-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-current/15', complianceLevel.color)}>
              {complianceLevel.label}
            </div>
          </div>

          <div className="border-t border-border-light pt-4 mt-2">
            <div className="flex justify-between text-xs text-text-secondary font-semibold mb-1">
              <span>Ítems Auditados</span>
              <span>{completedCount} de {INSPECCION_ITEMS.length} ({Math.round(INSPECCION_ITEMS.length > 0 ? (completedCount / INSPECCION_ITEMS.length) * 100 : 0)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${INSPECCION_ITEMS.length > 0 ? (completedCount / INSPECCION_ITEMS.length) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between items-center text-xs mt-3">
              <span className="text-text-tertiary">Puntos Obtenidos:</span>
              <span className="font-bold text-text-primary">{earnedScore} / {MAX_SCORE} pts</span>
            </div>
          </div>
        </div>

        {/* Right Column - Category Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Desglose Técnico de Cumplimiento</span>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Consulte el grado de cumplimiento agrupado por los tres pilares normativos de las actas de control del Ministerio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'laboral', label: 'Derecho Individual y Colectivo', stats: catStats.laboral, color: 'text-blue-500 border-blue-200 dark:border-blue-800/30' },
              { id: 'genero', label: 'Enfoque de Género', stats: catStats.genero, color: 'text-purple-500 border-purple-200 dark:border-purple-800/30' },
              { id: 'sgsst', label: 'Sistema de Gestión SST', stats: catStats.sgsst, color: 'text-teal-500 border-teal-200 dark:border-teal-800/30' }
            ].map(({ id, label, stats, color }) => (
              <div key={id} className={cn("bg-surface-primary rounded-2xl p-4 border shadow-sm flex flex-col justify-between min-h-[140px]", color)}>
                <div>
                  <p className="text-[10px] text-text-secondary font-black uppercase tracking-wider mb-2 leading-snug">{label}</p>
                  <p className="text-2xl font-black text-text-primary">{stats.pct.toFixed(0)}%</p>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-current transition-all duration-300" style={{ width: `${stats.pct}%` }} />
                  </div>
                  <p className="text-[10px] text-text-tertiary font-medium">{stats.earned} / {stats.total} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Alertas Críticas y Hallazgos Preventivos */}
      <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="text-xs font-black uppercase tracking-wider text-text-secondary">Alertas Críticas y Hallazgos Preventivos</span>
        </div>

        {auditAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-surface-primary rounded-xl border border-border-light">
            <CheckCircle className="w-10 h-10 text-green-500 mb-2 opacity-80" />
            <p className="text-sm font-bold text-text-primary">Ecosistema Laboral Saludable</p>
            <p className="text-xs text-text-secondary max-w-sm mt-0.5 leading-relaxed">No se registran no conformidades activas. Complete la autoevaluación para auditar la salud legal de su organización.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {auditAlerts.map(({ item, status, observation, severity }, idx) => {
              const s = SEV_STYLES[severity];
              return (
                <div key={idx} className={cn('flex items-start gap-3 p-3.5 rounded-xl border bg-surface-primary transition-all hover:scale-[1.005] duration-200', s.border)}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0', s.pts, s.bg)}>
                    -{item.points}
                  </div>
                  <div className="shrink-0 mt-1">{s.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary truncate">{item.code} · {item.name}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-tertiary text-text-secondary border border-border-light">{item.criteria}</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1 leading-normal line-clamp-2">{item.description}</p>
                    {observation && (
                      <div className="mt-2 text-[10px] text-red-700 dark:text-red-400 bg-red-500/5 p-2 rounded-lg border border-red-500/10 italic leading-snug">
                        <strong>Hallazgo:</strong> {observation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Accordion Checklist */}
      <div className="space-y-4">
        {(['laboral', 'genero', 'sgsst'] as const).map(category => {
          const items = groupedItems[category];
          if (!items?.length) return null;
          const isExpanded = expandedCategories.has(category);
          const catCompleted = items.filter(i => getItemStatus(i.id) !== 'pendiente').length;
          
          return (
            <div key={category} className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleCategory(category)} 
                className={cn('flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-tertiary/50 border-l-4 outline-none', CATEGORIA_COLORS[category])}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                  <span className="font-black text-sm uppercase tracking-wide text-text-primary">{CATEGORIA_LABELS[category]}</span>
                  <span className="text-xs text-text-tertiary font-bold bg-surface-primary px-2.5 py-0.5 rounded-full border border-border-light">
                    {catCompleted} / {items.length} Evaluados
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="divide-y divide-border-light bg-surface-primary/20">
                  {items.map(item => {
                    const status = getItemStatus(item.id);
                    return (
                      <div key={item.id} className="transition-all duration-200 hover:bg-surface-primary/30">
                        <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1.5">
                              <h4 className="font-bold text-text-primary text-base flex items-center gap-2 flex-wrap">
                                <span className="text-teal-600 dark:text-teal-400 font-mono font-black">{item.code}</span>
                                {item.name}
                                {item.isInformative && (
                                  <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/30 tracking-widest uppercase">
                                    INFORMATIVO
                                  </span>
                                )}
                              </h4>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-text-tertiary bg-surface-secondary px-2 py-0.5 rounded border border-border-medium">
                                  {item.criteria}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                                  Ponderación: {item.points} pts
                                </span>
                              </div>
                            </div>
                            
                            <p className="mt-2 text-xs text-text-secondary leading-relaxed">{item.description}</p>
                            
                            {expandedItems.has(item.id) && item.normativeText && (
                              <div className="mt-3 text-[11px] text-text-tertiary bg-surface-secondary p-3.5 rounded-xl border border-border-medium leading-relaxed whitespace-pre-wrap">
                                <strong>Fundamento Normativo:</strong> {item.normativeText}
                              </div>
                            )}
                            
                            <button 
                              onClick={() => toggleItem(item.id)} 
                              className="mt-2 text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 transition-colors"
                            >
                              <HelpCircle className="h-3.5 h-3.5" /> 
                              {expandedItems.has(item.id) ? 'Ocultar fundamento legal' : 'Ver fundamento legal'}
                            </button>
                          </div>

                          {/* Status Options Grid */}
                          <div className="flex items-center gap-1 justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-light">
                            {STATUS_OPTIONS.map(opt => {
                              const isSelected = status === opt.value;
                              return (
                                <button 
                                  key={opt.value} 
                                  onClick={() => handleStatusChange(item.id, opt.value)} 
                                  className={cn(
                                    'rounded-xl p-2.5 transition-all flex items-center justify-center border outline-none cursor-pointer',
                                    isSelected 
                                      ? cn(opt.color, 'scale-105 border-current/30 shadow-sm') 
                                      : 'text-text-tertiary border-border-medium hover:bg-surface-tertiary hover:text-text-secondary'
                                  )} 
                                  title={opt.label}
                                >
                                  <opt.icon className="h-5 w-5" />
                                  <span className={cn("text-[10px] font-black uppercase tracking-wider ml-1.5 hidden md:inline-block max-w-0 overflow-hidden opacity-0 transition-all duration-300", isSelected && "max-w-xs opacity-100")}>
                                    {opt.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Observation Input */}
                        {(status === 'parcial' || status === 'no_cumple' || status === 'no_aplica') && (
                          <div className="px-5 pb-5 animate-fadeIn">
                            <textarea 
                              placeholder="Describa la observación, brecha legal, evidencia de soporte o motivo..." 
                              value={observations[item.id] || ''} 
                              onChange={e => {
                                const val = e.target.value;
                                setObservations(prev => {
                                  const updated = { ...prev, [item.id]: val };
                                  try {
                                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ statuses, observations: updated }));
                                  } catch (e) { /* ignore */ }
                                  return updated;
                                });
                              }} 
                              className="w-full rounded-xl border border-border-medium bg-surface-secondary px-3.5 py-2.5 text-xs text-text-primary placeholder-text-tertiary focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none resize-none min-h-[60px]" 
                              rows={2} 
                            />
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

      {/* Oráculo AI Defense Section */}
      <div className="rounded-2xl border border-border-medium bg-surface-secondary shadow-sm p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-teal-500 animate-pulse" />
          <h3 className="font-bold text-text-primary">Oráculo de Defensa Legal y Estrategia de Respuesta</h3>
        </div>
        
        <p className="text-xs text-text-secondary mb-4 leading-relaxed">
          El Oráculo procesará la autoevaluación de los 60 estándares, las brechas declaradas y sus observaciones para estructurar un informe maestro legal, fundamentado en la normativa laboral colombiana (Decreto 1072, CST, Ley 1010, Ley 1257), formulando las estrategias de mitigación ante una fiscalización inminente.
        </p>

        {/* Prompt Customizer */}
        <div className="flex flex-col gap-3 bg-surface-primary p-4 rounded-xl border border-border-medium mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase text-text-secondary tracking-wider">
              Enfoque / Instrucción Adicional para el Oráculo (Opcional)
            </label>
            <textarea
              placeholder="Ej: Enfatizar en los planes preventivos de acoso laboral, estructurar el cronograma a 6 meses de priorización de dotaciones e implementaciones de Comités COPASST..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              className="w-full rounded-xl border border-border-light bg-surface-secondary px-3.5 py-2 text-xs text-text-primary focus:border-teal-500 focus:outline-none resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="border-t border-border-light pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase text-text-tertiary tracking-wider shrink-0">Modelo Inteligente:</span>
            <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} disabled={isAnalyzing} />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDummy}
              className="px-4 py-2 border border-border-medium rounded-xl text-xs font-bold hover:bg-surface-tertiary text-text-primary flex items-center gap-1.5 transition-all outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Simular Respuestas (Dummy)
            </button>
            
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Consultando Oráculo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Consultar Oráculo
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report View */}
      <CollapsibleReportBox 
        onSave={handleSave} 
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)} 
        isHistoryOpen={isHistoryOpen} 
        title="Estrategia y Defensa Legal - Inspección MinTrabajo" 
        icon={<FileText className="h-5 w-5 text-teal-600 animate-pulse" />} 
        actions={<ExportDropdown content={editorContentRef.current || analysisReport || ''} fileName="Defensa_Inspeccion_MinTrabajo" reportType="general" />}
      >
        <div style={{ minHeight: '450px', overflowX: 'auto' }}>
          <div style={{ minWidth: '900px' }}>
            <LiveEditor 
              ref={liveEditorRef} 
              reportType="checklist" 
              initialContent={analysisReport || ''} 
              onUpdate={html => { editorContentRef.current = html; }} 
            />
          </div>
        </div>
      </CollapsibleReportBox>

      <ReportHistory 
        isOpen={isHistoryOpen} 
        toggleOpen={() => setIsHistoryOpen(false)} 
        onSelectReport={handleSelectReport} 
        refreshTrigger={refreshTrigger} 
        tags={['sgsst-inspeccion-mintrabajo']} 
      />
    </div>
  );
}
