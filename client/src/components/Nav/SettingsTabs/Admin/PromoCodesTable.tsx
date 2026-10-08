import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Trash2, Plus, Loader2, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { WappyExpandButton } from '../WappyExpandButton';

interface PromoCode {
    _id: string;
    code: string;
    discountPercentage: number;
    active: boolean;
    isWelcomeCode: boolean;
    stripeCouponId?: string;
    createdAt: string;
}

export default function PromoCodesTable() {
    const { showToast } = useToastContext();
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState<number>(10);
    const [isWelcomeCode, setIsWelcomeCode] = useState(false);

    const fetchCodes = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/admin/promocodes');
            setCodes(data);
        } catch (error) {
            showToast({ message: 'Error cargando códigos', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleCreate = async () => {
        if (!newCode.trim() || newDiscount < 1 || newDiscount > 100) {
            showToast({ message: 'Por favor ingresa un código y un descuento válido', status: 'warning' });
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('/api/admin/promocodes', {
                code: newCode.trim(),
                discountPercentage: newDiscount,
                isWelcomeCode: isWelcomeCode
            });
            showToast({ message: 'Código promocional creado exitosamente', status: 'success' });
            setNewCode('');
            setNewDiscount(10);
            setIsWelcomeCode(false);
            fetchCodes();
        } catch (err: any) {
            showToast({ message: err?.response?.data?.error || 'Error creando código promocional', status: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await axios.patch(`/api/admin/promocodes/${id}/toggle`);
            fetchCodes();
        } catch (error) {
            showToast({ message: 'Error actualizando estado', status: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este código? Se borrará de forma permanente.')) {
            return;
        }

        try {
            await axios.delete(`/api/admin/promocodes/${id}`);
            showToast({ message: 'Código eliminado', status: 'success' });
            fetchCodes();
        } catch (error) {
            showToast({ message: 'Error eliminando', status: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Create Code Card */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 p-5 shadow-2xs">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Tag className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                            Crear Nuevo Código de Descuento
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            Aplica descuentos automáticos a suscripciones en pasarela de pagos.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                            Código
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. WAPPY50"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-mono font-bold focus:border-teal-500 outline-none uppercase"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1 block">
                            % Descuento
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={newDiscount}
                            onChange={(e) => setNewDiscount(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs focus:border-teal-500 outline-none font-semibold"
                        />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            id="welcome-code-check"
                            type="checkbox"
                            checked={isWelcomeCode}
                            onChange={(e) => setIsWelcomeCode(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor="welcome-code-check" className="text-xs font-medium text-slate-600 dark:text-zinc-300 cursor-pointer">
                            Bienvenida (Válido 48h)
                        </label>
                    </div>
                    <div>
                        <WappyExpandButton
                            onClick={handleCreate}
                            disabled={isSubmitting || !newCode.trim()}
                            isLoading={isSubmitting}
                            variant="teal"
                            icon={Plus}
                            label="Crear Código"
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs custom-admin-scrollbar">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 dark:bg-zinc-800/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold">
                        <tr>
                            <th className="px-6 py-3.5">Código Promocional</th>
                            <th className="px-6 py-3.5">% Descuento</th>
                            <th className="px-6 py-3.5">Estado</th>
                            <th className="px-6 py-3.5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900">
                        {codes.map((codeItem) => (
                            <tr key={codeItem._id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-zinc-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{codeItem.code}</span>
                                        {codeItem.isWelcomeCode && (
                                            <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                                                Bienvenida (48h)
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold">
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs">
                                        -{codeItem.discountPercentage}% OFF
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            role="switch"
                                            aria-checked={codeItem.active}
                                            onClick={() => handleToggle(codeItem._id)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ${
                                                codeItem.active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-zinc-700'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                                    codeItem.active ? 'translate-x-4' : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                        <span className={`text-xs font-semibold ${codeItem.active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                                            {codeItem.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleDelete(codeItem._id)}
                                            className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg px-1.5 shadow-2xs transition-all duration-300 active:scale-95 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 cursor-pointer"
                                            title="Eliminar Código"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                <span className="text-[10px] font-bold">Eliminar</span>
                                            </div>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {codes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                                    No hay códigos promocionales registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
