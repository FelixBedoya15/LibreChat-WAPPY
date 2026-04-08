import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Shield, AlertTriangle, UserCircle, Key, Send, CheckCircle, X,
    ClipboardCheck, ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertCircle, MinusCircle,
    Loader2, Building2, Lock
} from 'lucide-react';
import axios from 'axios';
import { ALTA_DIRECCION_ITEMS, CATEGORY_TITLES, GERENCIA_KEYWORDS } from '../SGSST/altaDireccionData';

// Check if cargo is managerial
function isGerenciaRole(cargo: string): boolean {
    if (!cargo) return false;
    const lc = cargo.toLowerCase().trim();
    return GERENCIA_KEYWORDS.some(kw => lc.includes(kw));
}

type ItemStatus = 'cumple' | 'no_cumple' | 'parcial' | 'no_aplica' | 'pendiente';

interface StatusEntry {
    itemId: string;
    status: ItemStatus;
    observation: string;
}

const STATUS_OPTS = [
    { value: 'cumple' as const, label: 'Cumple', icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7' },
    { value: 'no_cumple' as const, label: 'No Cumple', icon: XCircle, color: '#dc2626', bg: '#fee2e2' },
    { value: 'parcial' as const, label: 'Parcial', icon: AlertCircle, color: '#d97706', bg: '#fef3c7' },
    { value: 'no_aplica' as const, label: 'N/A', icon: MinusCircle, color: '#6b7280', bg: '#f3f4f6' },
];

export default function PublicAltaDireccion() {
    const { companyId } = useParams();
    const [company, setCompany] = useState<any>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1); // 1=identify, 2=checklist, 3=done

    // Step 1 – Identity
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Step 2 – Checklist
    const [statuses, setStatuses] = useState<StatusEntry[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['insumos', 'revision', 'seguimiento']));
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        axios.get(`/api/public-sgsst/company/${companyId}`)
            .then(r => setCompany(r.data))
            .catch(err => console.error('Error fetching company:', err))
            .finally(() => setLoadingCompany(false));
    }, [companyId]);

    const getStatus = (itemId: string): ItemStatus =>
        statuses.find(s => s.itemId === itemId)?.status || 'pendiente';

    const getObservation = (itemId: string): string =>
        statuses.find(s => s.itemId === itemId)?.observation || '';

    const setStatus = (itemId: string, status: ItemStatus) => {
        setStatuses(prev => {
            const existing = prev.find(s => s.itemId === itemId);
            if (existing) return prev.map(s => s.itemId === itemId ? { ...s, status } : s);
            return [...prev, { itemId, status, observation: '' }];
        });
    };

    const setObservation = (itemId: string, observation: string) => {
        setStatuses(prev => {
            const existing = prev.find(s => s.itemId === itemId);
            if (existing) return prev.map(s => s.itemId === itemId ? { ...s, observation } : s);
            return [...prev, { itemId, status: 'pendiente', observation }];
        });
    };

    const validateIdentity = async () => {
        if (!nombre.trim() || !cedula.trim()) {
            setValidationError('Por favor ingrese su nombre y cédula para continuar.');
            return;
        }
        setIsValidating(true);
        setValidationError('');
        try {
            await axios.post(`/api/public-sgsst/validate-alta-direccion/${companyId}`, { cedula, nombre });
            setStep(2);
        } catch (err: any) {
            setValidationError(err.response?.data?.error || 'Error al validar la identidad.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async () => {
        const evaluated = statuses.filter(s => s.status !== 'pendiente').length;
        if (evaluated === 0) {
            setSubmitError('Por favor evalúe al menos un aspecto antes de enviar.');
            return;
        }
        setIsSubmitting(true);
        setSubmitError('');
        try {
            await axios.post(`/api/public-sgsst/alta-direccion/${companyId}`, {
                cedula,
                nombre,
                data: { statusData: statuses }
            });
            setStep(3);
        } catch (err: any) {
            setSubmitError(err.response?.data?.error || 'Error al enviar la evaluación.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupedItems = ALTA_DIRECCION_ITEMS.reduce<Record<string, typeof ALTA_DIRECCION_ITEMS>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    const evaluatedCount = statuses.filter(s => s.status !== 'pendiente').length;

    if (loadingCompany) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <Shield className="w-16 h-16 text-[#0f766e] animate-bounce mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Cargando Portal SG-SST...</h2>
            <p className="text-gray-500 mt-2">Conectando de forma segura</p>
        </div>
    );

    if (!company) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Enlace Inválido</h2>
            <p className="text-gray-500 mt-2">El código QR no está asociado a una empresa válida.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200 p-4 shrink-0">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    {company.logo ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-white">
                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shrink-0 shadow-md">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="font-bold text-sm text-gray-900 leading-tight">{company.companyName}</h1>
                        <p className="text-xs text-teal-600 font-semibold">Revisión por Alta Dirección · SG-SST</p>
                    </div>
                    <div className="ml-auto">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Acceso Restringido
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-y-auto w-full max-w-3xl mx-auto flex flex-col gap-4">

                {/* ─── STEP 1: Identity ─── */}
                {step === 1 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header banner */}
                        <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-5 mb-6 text-white text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3 shadow-inner backdrop-blur-sm">
                                <ClipboardCheck className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-xl font-black">Revisión por Alta Dirección</h2>
                            <p className="text-teal-100 text-xs mt-1 leading-relaxed max-w-xs mx-auto">
                                Decreto 1072 de 2015 — Art. 2.2.4.6.31<br />
                                <strong>Acceso exclusivo para Representante Legal y Gerencia</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                    <UserCircle className="w-4 h-4 text-teal-600" /> Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 py-3 px-4 bg-gray-50 transition-all font-medium text-sm outline-none"
                                    placeholder="Nombre completo del Representante Legal o Gerente"
                                    value={nombre}
                                    onChange={e => { setNombre(e.target.value); setValidationError(''); }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Key className="w-4 h-4 text-teal-600" /> Cédula de Ciudadanía
                                </label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 py-3 px-4 bg-gray-50 transition-all font-medium text-sm outline-none"
                                    placeholder="Número de documento de identidad"
                                    value={cedula}
                                    onChange={e => { setCedula(e.target.value); setValidationError(''); }}
                                />
                            </div>
                        </div>

                        {validationError && (
                            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-red-700 text-sm block mb-1">Acceso Denegado</strong>
                                        <p className="text-red-600 text-sm">{validationError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={validateIdentity}
                            disabled={isValidating}
                            className="mt-6 w-full bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white py-3.5 rounded-xl font-bold tracking-wide shadow-lg shadow-teal-800/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando identidad...</> : <><Shield className="w-4 h-4" /> Verificar y Continuar</>}
                        </button>

                        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
                            Sus datos se validan de forma segura contra el registro de la empresa
                        </p>
                    </div>
                )}

                {/* ─── STEP 2: Checklist ─── */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        {/* Progress bar */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Revisión por Alta Dirección</p>
                                    <p className="text-xs text-gray-500">Evaluate los 24 aspectos del Art. 2.2.4.6.31 · Decreto 1072 de 2015</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-teal-700">{evaluatedCount}<span className="text-gray-400 text-sm font-normal">/{ALTA_DIRECCION_ITEMS.length}</span></p>
                                    <p className="text-[10px] text-gray-400 uppercase">Evaluados</p>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-500 to-teal-700 rounded-full transition-all duration-300"
                                    style={{ width: `${(evaluatedCount / ALTA_DIRECCION_ITEMS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Normative info banner */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <strong>Bienvenido/a, {nombre}.</strong> Evalúe cada uno de los 24 aspectos que la normatividad colombiana exige revisar anualmente. Sus respuestas serán enviadas al equipo de SST para generar el informe oficial.
                            </p>
                        </div>

                        {/* Checklist grouped by category */}
                        {['insumos', 'revision', 'seguimiento'].map(cat => {
                            const items = groupedItems[cat] || [];
                            const isExpanded = expandedCategories.has(cat);
                            const evaluated = items.filter(i => getStatus(i.id) !== 'pendiente').length;
                            const catColorMap: Record<string, string> = {
                                insumos: '#0f766e',
                                revision: '#4f46e5',
                                seguimiento: '#d97706',
                            };

                            return (
                                <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedCategories(prev => {
                                            const s = new Set(prev);
                                            if (s.has(cat)) s.delete(cat); else s.add(cat);
                                            return s;
                                        })}
                                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                        style={{ borderLeft: `4px solid ${catColorMap[cat]}` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{CATEGORY_TITLES[cat]}</p>
                                                <p className="text-xs text-gray-500">{evaluated}/{items.length} evaluados</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {evaluated === items.length && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="divide-y divide-gray-50">
                                            {items.map(item => {
                                                const status = getStatus(item.id);
                                                const obs = getObservation(item.id);
                                                const isItemExpanded = expandedItems.has(item.id);

                                                return (
                                                    <div key={item.id} className="p-4 bg-gray-50/30">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start gap-2 mb-2">
                                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-200 text-gray-600 shrink-0 mt-0.5">{item.code}</span>
                                                                    <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                                                                </div>
                                                                <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.description}</p>

                                                                {/* Status buttons */}
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {STATUS_OPTS.map(opt => {
                                                                        const Icon = opt.icon;
                                                                        const isSelected = status === opt.value;
                                                                        return (
                                                                            <button
                                                                                key={opt.value}
                                                                                onClick={() => setStatus(item.id, opt.value)}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border"
                                                                                style={{
                                                                                    backgroundColor: isSelected ? opt.bg : 'white',
                                                                                    color: isSelected ? opt.color : '#9ca3af',
                                                                                    borderColor: isSelected ? opt.color : '#e5e7eb',
                                                                                    boxShadow: isSelected ? `0 0 0 2px ${opt.color}30` : 'none',
                                                                                }}
                                                                            >
                                                                                <Icon className="w-3.5 h-3.5" />
                                                                                {opt.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Observation field */}
                                                                {(status === 'parcial' || status === 'no_cumple') && (
                                                                    <textarea
                                                                        placeholder="Observación o evidencia (opcional)..."
                                                                        value={obs}
                                                                        onChange={e => setObservation(item.id, e.target.value)}
                                                                        className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-white text-gray-700 resize-none focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 mt-1"
                                                                        rows={2}
                                                                    />
                                                                )}

                                                                {/* How to evaluate toggle */}
                                                                <button
                                                                    onClick={() => setExpandedItems(prev => {
                                                                        const s = new Set(prev);
                                                                        if (s.has(item.id)) s.delete(item.id); else s.add(item.id);
                                                                        return s;
                                                                    })}
                                                                    className="mt-2 text-[11px] text-teal-600 font-semibold hover:text-teal-800 flex items-center gap-1"
                                                                >
                                                                    {isItemExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                                    ¿Cómo evaluar este aspecto?
                                                                </button>

                                                                {isItemExpanded && (
                                                                    <div className="mt-2 p-3 bg-teal-50 rounded-xl border border-teal-100">
                                                                        <p className="text-xs text-teal-800 leading-relaxed">{item.evaluation}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {submitError}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || evaluatedCount === 0}
                            className="w-full py-4 bg-gradient-to-r from-teal-700 to-teal-900 hover:from-teal-800 hover:to-teal-950 text-white rounded-2xl font-black text-base shadow-lg shadow-teal-800/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando evaluación...</> : <><Send className="w-5 h-5" /> Enviar Revisión por Alta Dirección</>}
                        </button>
                        <p className="text-center text-[10px] text-gray-400 pb-4">
                            {evaluatedCount}/{ALTA_DIRECCION_ITEMS.length} aspectos evaluados · Al enviar, el responsable de SST recibirá esta evaluación para generar el informe oficial.
                        </p>
                    </div>
                )}

                {/* ─── STEP 3: Success ─── */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <CheckCircle className="w-12 h-12 text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">¡Evaluación Enviada!</h2>
                        <p className="text-gray-500 text-sm mb-2 max-w-xs leading-relaxed">
                            La revisión por alta dirección ha sido enviada al equipo de Seguridad y Salud en el Trabajo.
                        </p>
                        <p className="text-xs text-teal-600 font-semibold mb-8">
                            El responsable de SST procesará su evaluación y generará el informe oficial.
                        </p>
                        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-left max-w-sm w-full">
                            <p className="text-xs text-teal-800 font-bold mb-1">Normativa aplicada:</p>
                            <p className="text-xs text-teal-700 leading-relaxed">
                                Decreto 1072 de 2015, Art. 2.2.4.6.31 — Revisión por la Alta Dirección del SG-SST
                            </p>
                        </div>
                    </div>
                )}
            </main>

            <footer className="shrink-0 p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-[#0f766e]" /> Módulo SG-SST · Alta Dirección · Wappy
                </div>
            </footer>
        </div>
    );
}
