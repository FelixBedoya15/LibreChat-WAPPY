import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Button } from '@librechat/client';
import { Eye, EyeOff, Settings2, Save } from 'lucide-react';

// Default visibility (only Pro shown, no extra sections)
const DEFAULT_VISIBILITY = {
    showPlanFree: false,
    showPlanGo: false,
    showPlanPlus: false,
    showPlanPro: true,
    showSectionAppPlans: false,
    showSectionCustomPlan: false,
    showSectionEnterprise: false,
};

interface VisibilitySettings {
    showPlanFree: boolean;
    showPlanGo: boolean;
    showPlanPlus: boolean;
    showPlanPro: boolean;
    showSectionAppPlans: boolean;
    showSectionCustomPlan: boolean;
    showSectionEnterprise: boolean;
}

const VISIBILITY_ITEMS: Array<{ key: keyof VisibilitySettings; label: string; description: string; color: string }> = [
    { key: 'showPlanFree',          label: 'Plan Gratis',              description: 'Muestra el plan gratuito en la página',            color: 'text-gray-500' },
    { key: 'showPlanGo',            label: 'Plan Go',                  description: 'Muestra el plan Go ($49.200/mes)',                  color: 'text-blue-500' },
    { key: 'showPlanPlus',          label: 'Plan Plus',                description: 'Muestra el plan Plus ($57.800/mes)',                color: 'text-green-500' },
    { key: 'showPlanPro',           label: 'Plan Pro ⭐',              description: 'Muestra el plan Pro ($66.300/mes) — Recomendado',   color: 'text-amber-500' },
    { key: 'showSectionAppPlans',   label: 'Sección: Plan IPEVAR',     description: 'Muestra la sección de Planes por Aplicativos',     color: 'text-emerald-500' },
    { key: 'showSectionCustomPlan', label: 'Sección: Plan a la Medida',description: 'Muestra el constructor de plan personalizado',     color: 'text-fuchsia-500' },
    { key: 'showSectionEnterprise', label: 'Sección: Planes Corporativos', description: 'Muestra los planes empresariales y asesores', color: 'text-violet-500' },
];

export default function SubscriptionPlansTable() {
    const { showToast } = useToastContext();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibility, setVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
    const [visibilityLoading, setVisibilityLoading] = useState(true);
    const [visibilitySaving, setVisibilitySaving] = useState(false);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/plans');
            // Filter out the internal visibility document
            setPlans(response.data.filter((p: any) => p.planId !== '__visibility__'));
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast({ message: 'Error al cargar los planes', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchVisibility = async () => {
        try {
            setVisibilityLoading(true);
            const { data } = await axios.get('/api/admin/plans-visibility');
            setVisibility({ ...DEFAULT_VISIBILITY, ...data });
        } catch (error) {
            console.error('Error fetching visibility:', error);
        } finally {
            setVisibilityLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchVisibility();
    }, []);

    const handleChange = (planId, field, subfield, value) => {
        setPlans(prev => prev.map(p => {
            if (p.planId === planId) {
                return {
                    ...p,
                    [field]: {
                        ...p[field],
                        [subfield]: value
                    }
                };
            }
            return p;
        }));
    };

    const handleSave = async (plan) => {
        try {
            await axios.put(`/api/admin/plans/${plan.planId}`, plan);
            showToast({ message: `Configuración del plan ${plan.name} guardada existosamente`, status: 'success' });
        } catch (error) {
            console.error('Error saving plan', error);
            showToast({ message: `Error guardando ${plan.name}`, status: 'error' });
        }
    };

    const handleVisibilityToggle = (key: keyof VisibilitySettings) => {
        setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveVisibility = async () => {
        setVisibilitySaving(true);
        try {
            await axios.put('/api/admin/plans-visibility', visibility);
            showToast({ message: 'Configuración de visibilidad guardada correctamente', status: 'success' });
        } catch (error) {
            console.error('Error saving visibility:', error);
            showToast({ message: 'Error al guardar la visibilidad', status: 'error' });
        } finally {
            setVisibilitySaving(false);
        }
    };

    if (loading || visibilityLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-text-secondary">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent mr-3" />
                Cargando configuración de planes...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">

            {/* ── VISIBILITY SECTION ─────────────────────────────────── */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-orange-500/5 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 bg-amber-500/10 px-6 py-4 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
                            <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-text-primary">Visibilidad de la Página de Planes</h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Controla qué planes y secciones son visibles públicamente. Los cambios aplican de inmediato al guardar.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveVisibility}
                        disabled={visibilitySaving}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 text-sm font-bold transition-all shadow-sm"
                    >
                        {visibilitySaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar Visibilidad
                    </button>
                </div>

                {/* Two columns: Plans and Sections */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Plans column */}
                    <div>
                        <h4 className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Settings2 className="h-3.5 w-3.5" />
                            Planes Individuales
                        </h4>
                        <div className="flex flex-col gap-2">
                            {VISIBILITY_ITEMS.filter(i => i.key.startsWith('showPlan')).map(item => {
                                const isVisible = visibility[item.key];
                                return (
                                    <label
                                        key={item.key}
                                        className={`flex items-center gap-3 rounded-xl border cursor-pointer p-3 transition-all duration-200 ${
                                            isVisible
                                                ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10'
                                                : 'border-border-light bg-surface-primary hover:bg-surface-hover'
                                        }`}
                                    >
                                        {/* Custom toggle */}
                                        <div
                                            onClick={() => handleVisibilityToggle(item.key)}
                                            className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                                                isVisible ? 'bg-amber-500' : 'bg-surface-tertiary border border-border-medium'
                                            }`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                isVisible ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={() => handleVisibilityToggle(item.key)}>
                                            <div className={`text-sm font-semibold ${item.color}`}>{item.label}</div>
                                            <div className="text-xs text-text-tertiary truncate">{item.description}</div>
                                        </div>
                                        {isVisible
                                            ? <Eye className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            : <EyeOff className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                                        }
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sections column */}
                    <div>
                        <h4 className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Settings2 className="h-3.5 w-3.5" />
                            Secciones Adicionales
                        </h4>
                        <div className="flex flex-col gap-2">
                            {VISIBILITY_ITEMS.filter(i => i.key.startsWith('showSection')).map(item => {
                                const isVisible = visibility[item.key];
                                return (
                                    <label
                                        key={item.key}
                                        className={`flex items-center gap-3 rounded-xl border cursor-pointer p-3 transition-all duration-200 ${
                                            isVisible
                                                ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10'
                                                : 'border-border-light bg-surface-primary hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div
                                            onClick={() => handleVisibilityToggle(item.key)}
                                            className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                                                isVisible ? 'bg-amber-500' : 'bg-surface-tertiary border border-border-medium'
                                            }`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                isVisible ? 'translate-x-4' : 'translate-x-0.5'
                                            }`} />
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={() => handleVisibilityToggle(item.key)}>
                                            <div className={`text-sm font-semibold ${item.color}`}>{item.label}</div>
                                            <div className="text-xs text-text-tertiary">{item.description}</div>
                                        </div>
                                        {isVisible
                                            ? <Eye className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                            : <EyeOff className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                                        }
                                    </label>
                                );
                            })}
                        </div>

                        {/* Info box */}
                        <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                            <strong>💡 Nota:</strong> Las 4 temporalidades (Mensual, Trimestral, Semestral, Anual) siempre están disponibles. 
                            El <strong>Plan Pro</strong> en modo Mensual y Anual es el predeterminado recomendado.
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PLAN PRICING CARDS ──────────────────────────────────── */}
            {plans.map((plan) => (
                <div key={plan.planId} className="border border-border-light rounded-xl overflow-hidden bg-surface-primary shadow-sm">
                    <div className="bg-surface-secondary px-6 py-4 flex justify-between items-center border-b border-border-light">
                        <h3 className="text-xl font-bold capitalize text-primary">Plan {plan.name}</h3>
                        <Button
                            variant="default"
                            onClick={() => handleSave(plan)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Guardar Cambios
                        </Button>
                    </div>

                    <div className="p-6 flex flex-row overflow-x-auto gap-6 bg-surface-primary pb-8">
                        {['monthly', 'quarterly', 'semiannual', 'annual'].map(interval => (
                            <div key={interval} className="min-w-[260px] flex-1 border border-border-medium/60 bg-surface-secondary rounded-xl p-4 shadow-sm flex flex-col gap-5">
                                <h4 className="font-bold text-lg capitalize text-primary text-center pb-3 border-b border-border-light">
                                    {interval === 'monthly' ? 'Mensual' : interval === 'quarterly' ? 'Trimestral' : interval === 'semiannual' ? 'Semestral' : 'Anual'}
                                </h4>

                                <div>
                                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">Precio (COP)</label>
                                    <input
                                        type="number"
                                        value={plan.prices?.[interval] || 0}
                                        onChange={(e) => handleChange(plan.planId, 'prices', interval, Number(e.target.value))}
                                        className="w-full rounded-lg border border-border-light bg-surface-primary px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block" title="Identificador o meta para Wompi/Sistema">
                                        ID Wompi / Enlace
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. prod_1N... (Opcional)"
                                        value={plan.stripePriceIds?.[interval] || ''}
                                        onChange={(e) => handleChange(plan.planId, 'stripePriceIds', interval, e.target.value)}
                                        className="w-full rounded-lg border border-border-light bg-surface-primary px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono transition-colors"
                                    />
                                </div>

                                <div className="mt-auto bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="checkbox"
                                            checked={plan.promotions?.[interval]?.active || false}
                                            onChange={(e) => handleChange(plan.planId, 'promotions', interval, { ...plan.promotions?.[interval], active: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className="text-sm font-bold text-primary">Promoción</span>
                                    </label>

                                    {plan.promotions?.[interval]?.active && (
                                        <div className="flex flex-col gap-3 mt-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-text-secondary uppercase mb-1 block">Texto</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Ahorra 20%"
                                                    value={plan.promotions?.[interval]?.text || ''}
                                                    onChange={(e) => handleChange(plan.planId, 'promotions', interval, { ...plan.promotions?.[interval], text: e.target.value })}
                                                    className="w-full rounded-md border border-border-light bg-surface-primary px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-text-secondary uppercase mb-1 block">% Descuento</label>
                                                <input
                                                    type="number"
                                                    placeholder="20"
                                                    value={plan.promotions?.[interval]?.discountPercentage || 0}
                                                    onChange={(e) => handleChange(plan.planId, 'promotions', interval, { ...plan.promotions?.[interval], discountPercentage: Number(e.target.value) })}
                                                    className="w-full rounded-md border border-border-light bg-surface-primary px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
