import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Button } from '@librechat/client';

export default function SubscriptionPlansTable() {
    const { showToast } = useToastContext();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/plans');
            setPlans(response.data);
        } catch (error) {
            console.error('Error fetching plans:', error);
            showToast({ message: 'Error al cargar los planes', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
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

    if (loading) {
        return <div className="p-4 text-center">Cargando planes...</div>;
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
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

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-surface-primary">
                        {['monthly', 'quarterly', 'semiannual', 'annual'].map(interval => (
                            <div key={interval} className="border border-border-medium/60 bg-surface-secondary rounded-xl p-4 shadow-sm flex flex-col gap-5">
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
                                    <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block" title="Identificador de Precio de Stripe">
                                        Stripe Price ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. price_1N..."
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
