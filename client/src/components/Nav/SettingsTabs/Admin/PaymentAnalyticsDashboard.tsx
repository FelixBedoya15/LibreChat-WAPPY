import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, TrendingUp, Users, ShoppingCart, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useToastContext } from '@librechat/client';

interface AnalyticsData {
    period: string;
    funnel: {
        page_view: number;
        plan_selected: number;
        payment_started: number;
        payment_approved: number;
        payment_failed: number;
        payment_cancelled: number;
    };
    totalRevenueCOP: number;
    uniqueSessions: number;
    conversionRate: string;
    revenueByPlan: { _id: string; totalCents: number; count: number }[];
    dailyRevenue: { _id: { year: number; month: number; day: number }; totalCents: number; count: number }[];
}

interface EventData {
    _id: string;
    event: string;
    planId: string;
    interval: string;
    amountInCents: number;
    email: string;
    createdAt: string;
}

export default function PaymentAnalyticsDashboard() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [summaryRes, eventsRes] = await Promise.all([
                    axios.get(`/api/admin/checkout/summary?period=${period}`),
                    axios.get('/api/admin/checkout/events?page=1')
                ]);
                setData(summaryRes.data);
                setEvents(eventsRes.data.events);
            } catch (err) {
                showToast({ message: 'Error cargando métricas de pagos', status: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [period, showToast]);

    if (loading && !data) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!data) return null;

    const funnelMax = Math.max(data.funnel.page_view, 1);
    const getFunnelWidth = (count: number) => `${Math.max((count / funnelMax) * 100, 2)}%`;

    const getStatusIcon = (event: string) => {
        if (event === 'payment_approved') return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (event === 'payment_failed') return <AlertCircle className="h-4 w-4 text-red-500" />;
        return <XCircle className="h-4 w-4 text-gray-400" />;
    };

    const getStatusText = (event: string) => {
        if (event === 'payment_approved') return 'Aprobado';
        if (event === 'payment_failed') return 'Rechazado';
        if (event === 'payment_cancelled') return 'Cancelado';
        return event;
    };

    return (
        <div className="space-y-6">
            {/* Header / Filters */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analítica de Pagos</h2>
                    <p className="text-sm text-gray-500">Métricas de conversión y desempeño de checkout</p>
                </div>
                <div className="flex space-x-2">
                    {['today', 'week', 'month', 'all'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p as any)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                period === p
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            {p === 'today' ? 'Hoy' : p === 'week' ? '7 Días' : p === 'month' ? 'Mes' : 'Todo'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                        ${data.totalRevenueCOP.toLocaleString('es-CO')}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Visitantes Únicos</p>
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                        {data.uniqueSessions.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Pagos Aprobados</p>
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                        {data.funnel.payment_approved.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">Tasa de Conversión</p>
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                        {data.conversionRate}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Funnel */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Embudo de Conversión</h3>
                    <div className="space-y-4">
                        {[
                            { id: 'page_view', label: 'Vistas del Portal', color: 'bg-blue-500' },
                            { id: 'plan_selected', label: 'Plan Seleccionado', color: 'bg-indigo-500' },
                            { id: 'payment_started', label: 'Pago Iniciado', color: 'bg-purple-500' },
                            { id: 'payment_approved', label: 'Pago Aprobado', color: 'bg-green-500' },
                        ].map((step) => {
                            const count = data.funnel[step.id as keyof typeof data.funnel] || 0;
                            const percentage = data.funnel.page_view > 0 ? ((count / data.funnel.page_view) * 100).toFixed(1) : '0';
                            return (
                                <div key={step.id}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{step.label}</span>
                                        <span className="text-gray-500">{count} <span className="text-xs">({percentage}%)</span></span>
                                    </div>
                                    <div className="h-6 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${step.color}`}
                                            style={{ width: getFunnelWidth(count) }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue by Plan */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Ingresos por Plan</h3>
                    {data.revenueByPlan.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-10">No hay ventas en este período</p>
                    ) : (
                        <div className="space-y-4">
                            {data.revenueByPlan.map((plan) => {
                                const percentage = ((plan.totalCents / data.totalRevenueCOP) / 100).toFixed(1);
                                return (
                                    <div key={plan._id || 'Desconocido'} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white uppercase">{plan._id || 'Plan Borrado'}</p>
                                            <p className="text-xs text-gray-500">{plan.count} compras</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                ${Math.round(plan.totalCents / 100).toLocaleString('es-CO')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Chart (CSS Bar Chart) */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Tendencia de Ingresos (Últimos 30 días)</h3>
                <div className="flex h-48 items-end gap-1 overflow-x-auto pb-2">
                    {data.dailyRevenue.length === 0 ? (
                        <p className="w-full text-center text-sm text-gray-500 pt-20">Sin datos para la gráfica</p>
                    ) : (
                        (() => {
                            const maxVal = Math.max(...data.dailyRevenue.map(d => d.totalCents));
                            return data.dailyRevenue.map((day, idx) => {
                                const height = Math.max((day.totalCents / maxVal) * 100, 5);
                                return (
                                    <div key={idx} className="group relative flex flex-1 flex-col justify-end items-center min-w-[20px]">
                                        <div 
                                            className="w-full rounded-t-sm bg-purple-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                            style={{ height: `${height}%` }}
                                        />
                                        <span className="mt-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 absolute -bottom-6">
                                            {day._id.day}/{day._id.month}
                                        </span>
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 hidden w-max rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block z-10 shadow-lg">
                                            ${Math.round(day.totalCents / 100).toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            </div>

            {/* Recent Events Table */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Actividad Reciente</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Usuario / Email</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Monto</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev) => (
                                <tr key={ev._id} className="border-b dark:border-gray-700">
                                    <td className="px-4 py-3">{new Date(ev.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3">{ev.email || 'Anónimo'}</td>
                                    <td className="px-4 py-3 uppercase">{ev.planId || '-'} <span className="text-xs text-gray-400 lowercase">{ev.interval}</span></td>
                                    <td className="px-4 py-3 font-medium">${Math.round(ev.amountInCents / 100).toLocaleString('es-CO')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {getStatusIcon(ev.event)}
                                            {getStatusText(ev.event)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
