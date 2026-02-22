import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Sparkles, Save, History, Loader2,
    ChevronDown, ChevronRight, AlertTriangle, Shield,
    Database, Zap,
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useToastContext } from '@librechat/client';
import ModelSelector from './ModelSelector';
import ExportDropdown from './ExportDropdown';
import LiveEditor from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';

// ─── Types ────────────────────────────────────────────────────────────
interface PeligroEntry {
    id: string;
    proceso: string;
    zona: string;
    actividad: string;
    tarea: string;
    rutinario: boolean;
    controlesExistentes: string;
    descripcionPeligro: string;
    clasificacion: string;
    efectosPosibles: string;
    fuenteGeneradora: string;
    medioExistente: string;
    individuoControl: string;
    nivelDeficiencia: number;
    nivelExposicion: number;
    nivelProbabilidad: number;
    interpretacionNP: string;
    nivelConsecuencia: number;
    nivelRiesgo: number;
    interpretacionNR: string;
    aceptabilidad: string;
    numExpuestos: number;
    deficienciaHigienica: string;
    valoracionCuantitativa: string;
    // Anexo E: Factores de Reducción y Justificación
    nrFinal: number;
    factorReduccion: number;
    costoIntervencion: string;
    factorCosto: number;
    factorJustificacion: number;
    justificacion: string;
    eliminacion: string;
    sustitucion: string;
    controlIngenieria: string;
    controlAdministrativo: string;
    epp: string;
    completedByAI: boolean;
}

const EMPTY_ENTRY: Omit<PeligroEntry, 'id'> = {
    proceso: '', zona: '', actividad: '', tarea: '', rutinario: true, controlesExistentes: '',
    descripcionPeligro: '', clasificacion: '', efectosPosibles: '',
    fuenteGeneradora: '', medioExistente: '', individuoControl: '',
    nivelDeficiencia: 0, nivelExposicion: 0, nivelProbabilidad: 0,
    interpretacionNP: '', nivelConsecuencia: 0, nivelRiesgo: 0,
    interpretacionNR: '', aceptabilidad: '', numExpuestos: 0,
    deficienciaHigienica: '', valoracionCuantitativa: '',
    nrFinal: 0, factorReduccion: 0, costoIntervencion: '', factorCosto: 0, factorJustificacion: 0, justificacion: '',
    eliminacion: '', sustitucion: '', controlIngenieria: '',
    controlAdministrativo: '', epp: '', completedByAI: false,
};

// ─── GTC 45 Anexo E: Cost Factor Table (SMMLV) ──────────────────────
const COST_FACTOR_OPTIONS = [
    { label: 'Más de 150 SMMLV', d: 10 },
    { label: '60 a 150 SMMLV', d: 8 },
    { label: '30 a 59 SMMLV', d: 6 },
    { label: '3 a 29 SMMLV', d: 4 },
    { label: '0.3 a 2.9 SMMLV', d: 2 },
    { label: '0.06 a 0.29 SMMLV', d: 1 },
    { label: 'Menos de 0.06 SMMLV', d: 0.5 },
];

// ─── Risk Color Helpers ───────────────────────────────────────────────
const getRiskColor = (nr: number) => {
    if (nr >= 600) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300', label: 'I - No Aceptable' };
    if (nr >= 150) return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300', label: 'II - No Aceptable / Control' };
    if (nr >= 40) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300', label: 'III - Aceptable' };
    return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300', label: 'IV - Aceptable' };
};

const getAcceptabilityBadge = (a: string) => {
    if (!a) return 'bg-gray-100 text-gray-600';
    if (a.includes('No Aceptable') && !a.includes('control')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (a.includes('No Aceptable')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
};

// ─── Component ────────────────────────────────────────────────────────
const MatrizPeligrosGTC45 = () => {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();

    const [entries, setEntries] = useState<PeligroEntry[]>([]);
    const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
    const [isAdding, setIsAdding] = useState(false);
    const [newEntry, setNewEntry] = useState({ proceso: '', zona: '', actividad: '', tarea: '', rutinario: true, controlesExistentes: '' });
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompletingAll, setIsCompletingAll] = useState(false);

    // Report state
    const [generatedReport, setGeneratedReport] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [conversationId, setConversationId] = useState('new');
    const [reportMessageId, setReportMessageId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ─── Load Data ──────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/sgsst/matriz-peligros/data', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.entries?.length) setEntries(data.entries);
                }
            } catch (err) {
                console.error('Error loading hazard matrix:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [token]);

    // ─── Add Entry ──────────────────────────────────────────────
    const handleAdd = () => {
        if (!newEntry.proceso || !newEntry.actividad) {
            showToast({ message: 'Proceso y Actividad son obligatorios', status: 'warning' });
            return;
        }
        const entry: PeligroEntry = {
            ...EMPTY_ENTRY,
            ...newEntry,
            id: crypto.randomUUID(),
        };
        setEntries(prev => [...prev, entry]);
        setExpandedIds(prev => new Set(prev).add(entry.id));
        setNewEntry({ proceso: '', zona: '', actividad: '', tarea: '', rutinario: true, controlesExistentes: '' });
        setIsAdding(false);
    };

    // ─── Delete Entry ───────────────────────────────────────────
    const handleDelete = (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    // ─── Toggle Expand ──────────────────────────────────────────
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ─── AI Complete Single ─────────────────────────────────────
    const handleComplete = useCallback(async (entry: PeligroEntry) => {
        if (!token) return;
        setLoadingIds(prev => new Set(prev).add(entry.id));
        try {
            const res = await fetch('/api/sgsst/matriz-peligros/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ entry, modelName: selectedModel }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al completar');
            }
            const data = await res.json();
            setEntries(prev => prev.map(e =>
                e.id === entry.id ? { ...e, ...data.completed, completedByAI: true } : e
            ));
            setExpandedIds(prev => new Set(prev).add(entry.id));
            showToast({ message: 'Peligro completado con IA', status: 'success' });
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setLoadingIds(prev => { const n = new Set(prev); n.delete(entry.id); return n; });
        }
    }, [token, selectedModel, showToast]);

    // ─── AI Complete All ────────────────────────────────────────
    const handleCompleteAll = useCallback(async () => {
        const incomplete = entries.filter(e => !e.completedByAI);
        if (!incomplete.length) {
            showToast({ message: 'Todos los peligros ya están completados', status: 'info' });
            return;
        }
        setIsCompletingAll(true);
        for (const entry of incomplete) {
            await handleComplete(entry);
        }
        setIsCompletingAll(false);
        showToast({ message: `${incomplete.length} peligros completados con IA`, status: 'success' });
    }, [entries, handleComplete, showToast]);

    // ─── Save Data ──────────────────────────────────────────────
    const handleSaveData = useCallback(async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/sgsst/matriz-peligros/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ entries }),
            });
            if (res.ok) {
                showToast({ message: 'Matriz guardada correctamente', status: 'success' });
            } else {
                throw new Error('Error al guardar');
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        } finally {
            setIsSaving(false);
        }
    }, [token, entries, showToast]);

    // ─── Generate HTML Report ────────────────────────────────────
    const generateReport = useCallback(() => {
        if (!entries.length) {
            showToast({ message: 'No hay peligros para generar reporte', status: 'warning' });
            return;
        }
        const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        const html = `
<div style="font-family: sans-serif; max-width: 100%;">
  <h1 style="color: #004d99; text-align: center; border-bottom: 2px solid #004d99; padding-bottom: 8px;">Matriz de Identificación de Peligros y Valoración de Riesgos</h1>
  <p style="text-align: center; color: #666;">Metodología GTC 45 | Fecha: ${date}</p>

  ${entries.map((e, i) => {
            const risk = getRiskColor(e.nivelRiesgo);
            return `
  <div style="border: 1px solid #ddd; border-radius: 8px; margin: 15px 0; overflow: hidden;">
    <div style="background: ${e.nivelRiesgo >= 600 ? '#fee2e2' : e.nivelRiesgo >= 150 ? '#fff7ed' : e.nivelRiesgo >= 40 ? '#fefce8' : '#f0fdf4'}; padding: 10px 15px;">
      <strong>${i + 1}. ${e.proceso} — ${e.actividad}</strong>
      <span style="float: right; padding: 2px 10px; border-radius: 12px; font-size: 12px; background: ${e.nivelRiesgo >= 600 ? '#dc2626' : e.nivelRiesgo >= 150 ? '#ea580c' : e.nivelRiesgo >= 40 ? '#ca8a04' : '#16a34a'}; color: white;">NR: ${e.nivelRiesgo} - ${e.aceptabilidad || 'Sin valorar'}</span>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr><th style="background: #004d99; color: white; padding: 6px 10px; text-align: left; width: 30%;">Campo</th><th style="background: #004d99; color: white; padding: 6px 10px; text-align: left;">Valor</th></tr>
      <tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Zona / Lugar</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.zona || '-'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Tarea</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.tarea || '-'}</td></tr>
      <tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Rutinario</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.rutinario ? 'Sí' : 'No'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Controles Existentes</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.controlesExistentes || '-'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Peligro</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.descripcionPeligro || '-'}</td></tr>
      <tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Clasificación</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.clasificacion || '-'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Efectos Posibles</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.efectosPosibles || '-'}</td></tr>
      <tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Fuente Generadora</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.fuenteGeneradora || '-'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Control Medio</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.medioExistente || '-'}</td></tr>
      <tr><td style="padding: 6px 10px; border-bottom: 1px solid #eee; font-weight: 600;">Control Individuo</td><td style="padding: 6px 10px; border-bottom: 1px solid #eee;">${e.individuoControl || '-'}</td></tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 2px;">
      <tr><th style="background: #0369a1; color: white; padding: 6px; text-align: center;" colspan="7">Valoración del Riesgo (GTC 45)</th></tr>
      <tr style="background: #e0f2fe; font-weight: 600; text-align: center; font-size: 12px;">
        <td style="padding: 6px; border: 1px solid #ddd;">ND</td><td style="padding: 6px; border: 1px solid #ddd;">NE</td>
        <td style="padding: 6px; border: 1px solid #ddd;">NP (ND×NE)</td><td style="padding: 6px; border: 1px solid #ddd;">Int. NP</td>
        <td style="padding: 6px; border: 1px solid #ddd;">NC</td><td style="padding: 6px; border: 1px solid #ddd;">NR (NP×NC)</td>
        <td style="padding: 6px; border: 1px solid #ddd;">Aceptabilidad</td>
      </tr>
      <tr style="text-align: center;">
        <td style="padding: 6px; border: 1px solid #ddd;">${e.nivelDeficiencia}</td><td style="padding: 6px; border: 1px solid #ddd;">${e.nivelExposicion}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: 600;">${e.nivelProbabilidad}</td><td style="padding: 6px; border: 1px solid #ddd; font-size: 11px;">${e.interpretacionNP || '-'}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.nivelConsecuencia}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: 700; color: ${e.nivelRiesgo >= 600 ? '#dc2626' : e.nivelRiesgo >= 150 ? '#ea580c' : '#16a34a'};">${e.nivelRiesgo}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-size: 11px;">${e.aceptabilidad || '-'}</td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 2px;">
      <tr><th style="background: #065f46; color: white; padding: 6px; text-align: center;" colspan="2">Valoración Higiénica</th></tr>
      <tr><td style="padding: 6px 10px; border: 1px solid #eee; font-weight: 600; width: 30%;">Deficiencia Higiénica (Cualitativa)</td><td style="padding: 6px 10px; border: 1px solid #eee;">${e.deficienciaHigienica || 'N/A'}</td></tr>
      <tr style="background: #f8f9fa;"><td style="padding: 6px 10px; border: 1px solid #eee; font-weight: 600;">Valoración Cuantitativa</td><td style="padding: 6px 10px; border: 1px solid #eee;">${e.valoracionCuantitativa || 'N/A'}</td></tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 2px;">
      <tr><th style="background: #9333ea; color: white; padding: 6px; text-align: center;" colspan="5">Anexo E — Factores de Reducción y Justificación</th></tr>
      <tr style="background: #f3e8ff; font-weight: 600; text-align: center; font-size: 12px;">
        <td style="padding: 6px; border: 1px solid #ddd;">NR Inicial</td>
        <td style="padding: 6px; border: 1px solid #ddd;">NR Final (estimado)</td>
        <td style="padding: 6px; border: 1px solid #ddd;">F (Reducción %)</td>
        <td style="padding: 6px; border: 1px solid #ddd;">Costo (d)</td>
        <td style="padding: 6px; border: 1px solid #ddd;">J (Justificación)</td>
      </tr>
      <tr style="text-align: center;">
        <td style="padding: 6px; border: 1px solid #ddd;">${e.nivelRiesgo}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.nrFinal || '-'}</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: 700; color: ${e.factorReduccion >= 75 ? '#16a34a' : e.factorReduccion >= 50 ? '#ca8a04' : '#dc2626'};">${e.factorReduccion ? e.factorReduccion.toFixed(1) + '%' : '-'}</td>
        <td style="padding: 6px; border: 1px solid #ddd;">${e.costoIntervencion || '-'} (d=${e.factorCosto || '-'})</td>
        <td style="padding: 6px; border: 1px solid #ddd; font-weight: 700;">${e.factorJustificacion ? e.factorJustificacion.toFixed(0) : '-'}</td>
      </tr>
      <tr><td colspan="5" style="padding: 6px 10px; border: 1px solid #eee; font-size: 12px;"><strong>Justificación:</strong> ${e.justificacion || '-'}</td></tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 2px;">
      <tr style="background: #7c3aed; color: white; font-weight: 600;">
        <th style="padding: 6px; text-align: center;">Eliminación</th><th style="padding: 6px; text-align: center;">Sustitución</th>
        <th style="padding: 6px; text-align: center;">Ingeniería</th><th style="padding: 6px; text-align: center;">Administrativo</th>
        <th style="padding: 6px; text-align: center;">EPP</th>
      </tr>
      <tr style="font-size: 12px;">
        <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${e.eliminacion || '-'}</td>
        <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${e.sustitucion || '-'}</td>
        <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${e.controlIngenieria || '-'}</td>
        <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${e.controlAdministrativo || '-'}</td>
        <td style="padding: 6px; border: 1px solid #eee; vertical-align: top;">${e.epp || '-'}</td>
      </tr>
    </table>
  </div>`;
        }).join('')}
</div>`;
        setGeneratedReport(html);
        setEditorContent(html);
        setConversationId('new');
        setReportMessageId(null);
    }, [entries, showToast]);

    // ─── Save Report ─────────────────────────────────────────────
    const handleSaveReport = useCallback(async () => {
        const content = editorContent || generatedReport;
        if (!content || !token) return;
        try {
            const isNew = !conversationId || conversationId === 'new';
            const res = await fetch('/api/sgsst/diagnostico/save-report', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(isNew ? {
                    content,
                    title: `Matriz GTC 45 - ${new Date().toLocaleDateString('es-CO')}`,
                    tags: ['sgsst-matriz-peligros'],
                } : { conversationId, messageId: reportMessageId, content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (isNew) { setConversationId(data.conversationId); setReportMessageId(data.messageId); }
                setRefreshTrigger(prev => prev + 1);
                showToast({ message: 'Informe guardado', status: 'success' });
            }
        } catch (err: any) {
            showToast({ message: err.message, status: 'error' });
        }
    }, [editorContent, generatedReport, conversationId, reportMessageId, token, showToast]);

    // ─── Select Report from History ──────────────────────────────
    const handleSelectReport = async (reportOrId: any) => {
        let content = '', convId = '', msgId = '';
        if (typeof reportOrId === 'string') {
            convId = reportOrId;
            try {
                const res = await fetch(`/api/messages/${convId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const messages = await res.json();
                    const reportMsg = messages.reverse().find((m: any) =>
                        m.sender === 'SGSST Diagnóstico' || (m.isCreatedByUser === false && m.text?.length > 100)
                    );
                    if (reportMsg) { content = reportMsg.text; msgId = reportMsg.messageId; }
                }
            } catch { /* ignore */ }
        } else if (reportOrId?.content) {
            content = reportOrId.content; convId = reportOrId.conversationId; msgId = reportOrId.messageId;
        }
        if (content) {
            setGeneratedReport(content); setEditorContent(content);
            setConversationId(convId); setReportMessageId(msgId);
            setIsHistoryOpen(false);
        }
    };

    // ─── Edit AI field inline ────────────────────────────────────
    const updateField = (id: string, field: keyof PeligroEntry, value: any) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ═══ Toolbar ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary border border-border-medium shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Matriz de Peligros GTC 45</h2>
                        <span className="text-sm text-text-secondary">IPVR — {entries.length} peligros registrados</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleSaveData} disabled={isSaving}
                        className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5 text-gray-500 group-hover:text-blue-500" />}
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Guardar Datos</span>
                    </button>
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`group flex items-center px-3 py-2 border border-border-medium rounded-full transition-all duration-300 shadow-sm font-medium text-sm ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-surface-primary text-text-primary hover:bg-surface-hover'}`}>
                        <History className="h-5 w-5" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Historial</span>
                    </button>
                    {entries.length > 0 && (
                        <>
                            <button onClick={generateReport}
                                className="group flex items-center px-3 py-2 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all duration-300 shadow-sm font-medium text-sm">
                                <Save className="h-5 w-5" />
                                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">Generar Informe</span>
                            </button>
                            {generatedReport && (
                                <ExportDropdown content={editorContent || generatedReport} fileName="Matriz_Peligros_GTC45" />
                            )}
                        </>
                    )}
                    <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
                </div>
            </div>

            {/* ═══ History Panel ═══ */}
            {isHistoryOpen && (
                <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                    <ReportHistory onSelectReport={handleSelectReport} isOpen={isHistoryOpen}
                        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)} refreshTrigger={refreshTrigger}
                        tags={['sgsst-matriz-peligros']} />
                </div>
            )}

            {/* ═══ Add Hazard Form ═══ */}
            <div className="rounded-xl border border-border-medium bg-surface-secondary overflow-hidden">
                <button onClick={() => setIsAdding(!isAdding)}
                    className="w-full flex items-center justify-between p-4 bg-surface-tertiary/50 hover:bg-surface-tertiary transition-colors">
                    <div className="flex items-center gap-2">
                        {isAdding ? <ChevronDown className="h-5 w-5 text-text-secondary" /> : <ChevronRight className="h-5 w-5 text-text-secondary" />}
                        <Plus className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-text-primary">Agregar Peligro</span>
                    </div>
                </button>
                {isAdding && (
                    <div className="p-4 bg-surface-primary/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Proceso <span className="text-red-500">*</span></label>
                                <input type="text" value={newEntry.proceso} onChange={e => setNewEntry({ ...newEntry, proceso: e.target.value })}
                                    placeholder="Ej: Construcción, Soldadura..." className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Zona / Lugar</label>
                                <input type="text" value={newEntry.zona} onChange={e => setNewEntry({ ...newEntry, zona: e.target.value })}
                                    placeholder="Ej: Planta 2, Oficina, Bodega..." className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Actividad <span className="text-red-500">*</span></label>
                                <input type="text" value={newEntry.actividad} onChange={e => setNewEntry({ ...newEntry, actividad: e.target.value })}
                                    placeholder="Ej: Soldadura de estructura metálica..." className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Tarea</label>
                                <input type="text" value={newEntry.tarea} onChange={e => setNewEntry({ ...newEntry, tarea: e.target.value })}
                                    placeholder="Ej: Punteado de perfiles..." className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-text-secondary">Rutinario</label>
                                <select value={newEntry.rutinario ? 'si' : 'no'} onChange={e => setNewEntry({ ...newEntry, rutinario: e.target.value === 'si' })}
                                    className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors">
                                    <option value="si">Sí</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                <label className="text-xs font-medium text-text-secondary">Controles Existentes</label>
                                <textarea value={newEntry.controlesExistentes} onChange={e => setNewEntry({ ...newEntry, controlesExistentes: e.target.value })}
                                    placeholder="Ej: Uso de EPP (guantes, gafas), capacitación en trabajo seguro, señalización..."
                                    rows={2} className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm focus:border-blue-500 transition-colors resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover rounded-lg">Cancelar</button>
                            <button onClick={handleAdd} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Agregar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Batch Actions ═══ */}
            {entries.some(e => !e.completedByAI) && (
                <div className="flex justify-end">
                    <button onClick={handleCompleteAll} disabled={isCompletingAll}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium disabled:opacity-50">
                        {isCompletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Completar Todos con IA ({entries.filter(e => !e.completedByAI).length} pendientes)
                    </button>
                </div>
            )}

            {/* ═══ Hazard Entries List ═══ */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12 text-text-secondary">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando datos...
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary border-2 border-dashed border-border-medium/50 rounded-xl">
                    <Shield className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No hay peligros registrados. Haz clic en "Agregar Peligro" para comenzar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry, idx) => {
                        const isExpanded = expandedIds.has(entry.id);
                        const isCompletingThis = loadingIds.has(entry.id);
                        const riskStyle = entry.completedByAI ? getRiskColor(entry.nivelRiesgo) : { bg: 'bg-gray-50 dark:bg-gray-800/30', text: 'text-gray-500', border: 'border-gray-200', label: 'Sin valorar' };

                        return (
                            <div key={entry.id} className={`rounded-xl border ${riskStyle.border} overflow-hidden transition-all duration-300 shadow-sm`}>
                                {/* Header */}
                                <div className={`flex items-center justify-between p-4 ${riskStyle.bg} cursor-pointer`} onClick={() => toggleExpand(entry.id)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="text-text-secondary flex-shrink-0">
                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-text-primary">{idx + 1}. {entry.proceso}</span>
                                                <span className="text-xs text-text-secondary">• {entry.actividad}</span>
                                                {entry.zona && <span className="text-xs bg-surface-tertiary px-2 py-0.5 rounded">{entry.zona}</span>}
                                            </div>
                                            {entry.completedByAI && (
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAcceptabilityBadge(entry.aceptabilidad)}`}>
                                                        NR: {entry.nivelRiesgo} — {entry.aceptabilidad}
                                                    </span>
                                                    <span className="text-xs text-text-secondary">{entry.clasificacion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!entry.completedByAI && (
                                            <button onClick={(e) => { e.stopPropagation(); handleComplete(entry); }} disabled={isCompletingThis}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all">
                                                {isCompletingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                                Completar con IA
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details — 4 Segments */}
                                {isExpanded && (
                                    <div className="p-4 bg-surface-primary space-y-4 overflow-auto">
                                        {/* Segment 1: Identification */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                                            {[
                                                { label: 'Proceso', field: 'proceso' as const, value: entry.proceso },
                                                { label: 'Zona', field: 'zona' as const, value: entry.zona },
                                                { label: 'Actividad', field: 'actividad' as const, value: entry.actividad },
                                                { label: 'Tarea', field: 'tarea' as const, value: entry.tarea },
                                            ].map(({ label, field, value }) => (
                                                <div key={field} className="space-y-1">
                                                    <label className="text-[10px] font-medium text-text-secondary uppercase">{label}</label>
                                                    <input type="text" value={value || ''} onChange={e => updateField(entry.id, field, e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary" />
                                                </div>
                                            ))}
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-text-secondary uppercase">Rutinario</label>
                                                <select value={entry.rutinario ? 'si' : 'no'} onChange={e => updateField(entry.id, 'rutinario', e.target.value === 'si')}
                                                    className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary">
                                                    <option value="si">Sí</option>
                                                    <option value="no">No</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <label className="text-[10px] font-medium text-text-secondary uppercase">Controles Existentes</label>
                                            <textarea value={entry.controlesExistentes || ''} onChange={e => updateField(entry.id, 'controlesExistentes', e.target.value)}
                                                rows={2} className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary resize-none" />
                                        </div>

                                        {entry.completedByAI && (
                                            <>
                                                {/* Segment 2: Hazard & Controls */}
                                                <div className="border-t border-border-medium pt-3">
                                                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">
                                                        <AlertTriangle className="h-3.5 w-3.5" /> Peligro y Controles Existentes
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                        {[
                                                            { label: 'Descripción del Peligro', field: 'descripcionPeligro' as const },
                                                            { label: 'Clasificación', field: 'clasificacion' as const },
                                                            { label: 'Efectos Posibles', field: 'efectosPosibles' as const },
                                                            { label: 'Fuente Generadora', field: 'fuenteGeneradora' as const },
                                                            { label: 'Control en el Medio', field: 'medioExistente' as const },
                                                            { label: 'Control en el Individuo', field: 'individuoControl' as const },
                                                        ].map(({ label, field }) => (
                                                            <div key={field} className="space-y-1">
                                                                <label className="text-[10px] font-medium text-text-secondary uppercase">{label}</label>
                                                                <textarea value={entry[field] || ''} onChange={e => updateField(entry.id, field, e.target.value)}
                                                                    rows={2} className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary resize-none" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Segment 3: Risk Valuation */}
                                                <div className="border-t border-border-medium pt-3">
                                                    <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase mb-2">Valoración del Riesgo (GTC 45)</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-cyan-700 text-white">
                                                                    <th className="px-3 py-2 text-center">ND</th>
                                                                    <th className="px-3 py-2 text-center">NE</th>
                                                                    <th className="px-3 py-2 text-center">NP</th>
                                                                    <th className="px-3 py-2 text-center">Int. NP</th>
                                                                    <th className="px-3 py-2 text-center">NC</th>
                                                                    <th className="px-3 py-2 text-center">NR</th>
                                                                    <th className="px-3 py-2 text-center">Aceptabilidad</th>
                                                                    <th className="px-3 py-2 text-center">Expuestos</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <input type="number" value={entry.nivelDeficiencia} onChange={e => updateField(entry.id, 'nivelDeficiencia', Number(e.target.value))}
                                                                            className="w-14 text-center text-xs p-1 rounded border border-border-medium bg-surface-primary" />
                                                                    </td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <input type="number" value={entry.nivelExposicion} onChange={e => updateField(entry.id, 'nivelExposicion', Number(e.target.value))}
                                                                            className="w-14 text-center text-xs p-1 rounded border border-border-medium bg-surface-primary" />
                                                                    </td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center font-bold">{entry.nivelProbabilidad}</td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center text-[11px]">{entry.interpretacionNP}</td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <input type="number" value={entry.nivelConsecuencia} onChange={e => updateField(entry.id, 'nivelConsecuencia', Number(e.target.value))}
                                                                            className="w-14 text-center text-xs p-1 rounded border border-border-medium bg-surface-primary" />
                                                                    </td>
                                                                    <td className={`px-2 py-1 border border-border-medium text-center font-bold text-lg ${riskStyle.text}`}>{entry.nivelRiesgo}</td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getAcceptabilityBadge(entry.aceptabilidad)}`}>
                                                                            {entry.aceptabilidad}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <input type="number" value={entry.numExpuestos || 0} onChange={e => updateField(entry.id, 'numExpuestos', Number(e.target.value))}
                                                                            className="w-14 text-center text-xs p-1 rounded border border-border-medium bg-surface-primary" />
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Segment 4: Hygiene */}
                                                <div className="border-t border-border-medium pt-3">
                                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Valoración Higiénica</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                                                        {[
                                                            { label: 'Deficiencia Higiénica (Cualitativa)', field: 'deficienciaHigienica' as const },
                                                            { label: 'Valoración Cuantitativa', field: 'valoracionCuantitativa' as const },
                                                        ].map(({ label, field }) => (
                                                            <div key={field} className="space-y-1">
                                                                <label className="text-[10px] font-medium text-text-secondary uppercase">{label}</label>
                                                                <textarea value={entry[field] || ''} onChange={e => updateField(entry.id, field, e.target.value)}
                                                                    rows={2} className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary resize-none" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Segment 5: Anexo E — Factores de Reducción y Justificación */}
                                                <div className="border-t border-border-medium pt-3">
                                                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Anexo E — Factores de Reducción y Justificación</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs border-collapse">
                                                            <thead>
                                                                <tr className="bg-purple-700 text-white">
                                                                    <th className="px-3 py-2 text-center">NR Inicial</th>
                                                                    <th className="px-3 py-2 text-center">NR Final (estimado)</th>
                                                                    <th className="px-3 py-2 text-center">F (Reducción %)</th>
                                                                    <th className="px-3 py-2 text-center">Costo Intervención</th>
                                                                    <th className="px-3 py-2 text-center">d</th>
                                                                    <th className="px-3 py-2 text-center">J (Justificación)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="px-2 py-1 border border-border-medium text-center font-bold">{entry.nivelRiesgo}</td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <input type="number" value={entry.nrFinal || ''} onChange={e => {
                                                                            const nrf = Number(e.target.value);
                                                                            const nri = entry.nivelRiesgo || 1;
                                                                            const f = nri > 0 ? (100 * (nri - nrf)) / nri : 0;
                                                                            const j = entry.factorCosto > 0 ? (nri * f) / entry.factorCosto : 0;
                                                                            setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, nrFinal: nrf, factorReduccion: Math.round(f * 10) / 10, factorJustificacion: Math.round(j) } : en));
                                                                        }}
                                                                            className="w-20 text-center text-xs p-1 rounded border border-border-medium bg-surface-primary" />
                                                                    </td>
                                                                    <td className={`px-2 py-1 border border-border-medium text-center font-bold ${entry.factorReduccion >= 75 ? 'text-green-600' : entry.factorReduccion >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                        {entry.factorReduccion ? `${entry.factorReduccion}%` : '-'}
                                                                    </td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center">
                                                                        <select value={entry.costoIntervencion || ''} onChange={e => {
                                                                            const selected = COST_FACTOR_OPTIONS.find(o => o.label === e.target.value);
                                                                            const d = selected?.d || 0;
                                                                            const nri = entry.nivelRiesgo || 1;
                                                                            const f = entry.factorReduccion || 0;
                                                                            const j = d > 0 ? (nri * f) / d : 0;
                                                                            setEntries(prev => prev.map(en => en.id === entry.id ? { ...en, costoIntervencion: e.target.value, factorCosto: d, factorJustificacion: Math.round(j) } : en));
                                                                        }}
                                                                            className="text-xs p-1 rounded border border-border-medium bg-surface-primary">
                                                                            <option value="">Seleccionar...</option>
                                                                            {COST_FACTOR_OPTIONS.map(o => (
                                                                                <option key={o.d} value={o.label}>{o.label} (d={o.d})</option>
                                                                            ))}
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center font-mono">{entry.factorCosto || '-'}</td>
                                                                    <td className="px-2 py-1 border border-border-medium text-center font-bold text-lg text-purple-700 dark:text-purple-400">
                                                                        {entry.factorJustificacion || '-'}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-2">
                                                        <label className="text-[10px] font-medium text-text-secondary uppercase">Justificación Técnica</label>
                                                        <textarea value={entry.justificacion || ''} onChange={e => updateField(entry.id, 'justificacion', e.target.value)}
                                                            rows={2} className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary resize-none"
                                                            placeholder="Justificación de la medida de intervención y análisis costo-beneficio..." />
                                                    </div>
                                                </div>

                                                {/* Segment 6: Jerarquía de Controles */}
                                                <div className="border-t border-border-medium pt-3">
                                                    <h5 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Jerarquía de Controles</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                                                        {[
                                                            { label: 'Eliminación', field: 'eliminacion' as const },
                                                            { label: 'Sustitución', field: 'sustitucion' as const },
                                                            { label: 'Control de Ingeniería', field: 'controlIngenieria' as const },
                                                            { label: 'Control Administrativo', field: 'controlAdministrativo' as const },
                                                            { label: 'EPP', field: 'epp' as const },
                                                        ].map(({ label, field }) => (
                                                            <div key={field} className="space-y-1">
                                                                <label className="text-[10px] font-medium text-text-secondary uppercase">{label}</label>
                                                                <textarea value={entry[field] || ''} onChange={e => updateField(entry.id, field, e.target.value)}
                                                                    rows={2} className="w-full text-xs p-1.5 rounded border border-border-medium bg-surface-primary resize-none" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!entry.completedByAI && (
                                            <div className="flex items-center justify-center py-6 border-t border-border-medium">
                                                <button onClick={() => handleComplete(entry)} disabled={isCompletingThis}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50">
                                                    {isCompletingThis ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                                                    Completar este peligro con IA (GTC 45)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ Generated Report — LiveEditor ═══ */}
            {
                generatedReport && (
                    <div className="rounded-xl border border-border-medium bg-surface-primary overflow-hidden shadow-sm">
                        <div className="border-b border-border-medium bg-surface-tertiary/30 px-4 py-3 flex items-center justify-between">
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Informe Matriz de Peligros GTC 45
                            </h3>
                            <div className="flex items-center gap-2">
                                <button onClick={handleSaveReport}
                                    className="group flex items-center px-3 py-1.5 bg-surface-primary border border-border-medium hover:bg-surface-hover text-text-primary rounded-full transition-all text-xs font-medium">
                                    <Save className="h-4 w-4 mr-1" /> Guardar Informe
                                </button>
                            </div>
                        </div>
                        <div className="h-[800px]">
                            <LiveEditor key={reportMessageId || 'editor'} initialContent={generatedReport}
                                onUpdate={(html) => setEditorContent(html)} onSave={handleSaveReport} />
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MatrizPeligrosGTC45;
