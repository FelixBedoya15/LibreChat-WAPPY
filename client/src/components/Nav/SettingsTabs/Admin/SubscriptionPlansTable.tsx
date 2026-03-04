import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Button } from '@librechat/client';

export default function SubscriptionPlansTable() {
    const { showToast } = useToastContext();
    const [plans, setPlans] = useState([]);
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

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Precios Section */}
                        <div>
                            <h4 className="font-semibold text-lg mb-4 text-secondary">Valores del Plan (COP)</h4>
                            <div className="space-y-3">
                                {['monthly', 'quarterly', 'semiannual', 'annual'].map(interval => (
                                    <div key={`price-${interval}`} className="flex items-center gap-3">
                                        <label className="w-24 text-sm font-medium capitalize text-text-secondary">
                                            {interval === 'monthly' ? 'Mensual' : interval === 'quarterly' ? 'Trimestral' : interval === 'semiannual' ? 'Semestral' : 'Anual'}
                                        </label>
                                        <input
                                            type="number"
                                            value={plan.prices?.[interval] || 0}
                                            onChange={(e) => handleChange(plan.planId, 'prices', interval, Number(e.target.value))}
                                            className="flex-1 rounded-md border border-border-light bg-surface-primary px-3 py-1.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stripe IDs Section */}
                        <div>
                            <h4 className="font-semibold text-lg mb-4 text-secondary">IDs de Precio Stripe</h4>
                            <div className="space-y-3">
                                {['monthly', 'quarterly', 'semiannual', 'annual'].map(interval => (
                                    <div key={`stripe-${interval}`} className="flex items-center gap-3">
                                        <label className="w-24 text-sm font-medium capitalize text-text-secondary">
                                            {interval === 'monthly' ? 'Mensual' : interval === 'quarterly' ? 'Trimestral' : interval === 'semiannual' ? 'Semestral' : 'Anual'}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="price_1N..."
                                            value={plan.stripePriceIds?.[interval] || ''}
                                            onChange={(e) => handleChange(plan.planId, 'stripePriceIds', interval, e.target.value)}
                                            className="flex-1 rounded-md border border-border-light bg-surface-primary px-3 py-1.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 text-sm font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Promociones Section */}
                        <div className="md:col-span-2">
                            <h4 className="font-semibold text-lg mb-4 text-secondary">Promociones Adicionales</h4>
                            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex flex-col gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={plan.promotions?.active || false}
                                        onChange={(e) => handleChange(plan.planId, 'promotions', 'active', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="font-semibold">Activar Promoción para este plan</span>
                                </label>

                                {plan.promotions?.active && (
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 text-sm">
                                            <div className="mb-1 text-text-secondary font-medium">Texto de Oferta</div>
                                            <input
                                                type="text"
                                                placeholder="Ej. Ahorra 20% anual"
                                                value={plan.promotions?.text || ''}
                                                onChange={(e) => handleChange(plan.planId, 'promotions', 'text', e.target.value)}
                                                className="w-full rounded-md border border-border-light bg-surface-primary px-3 py-1.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                            />
                                        </div>
                                        <div className="w-32 text-sm">
                                            <div className="mb-1 text-text-secondary font-medium">Descuento (%)</div>
                                            <input
                                                type="number"
                                                placeholder="20"
                                                min="0"
                                                max="100"
                                                value={plan.promotions?.discountPercentage || 0}
                                                onChange={(e) => handleChange(plan.planId, 'promotions', 'discountPercentage', Number(e.target.value))}
                                                className="w-full rounded-md border border-border-light bg-surface-primary px-3 py-1.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
