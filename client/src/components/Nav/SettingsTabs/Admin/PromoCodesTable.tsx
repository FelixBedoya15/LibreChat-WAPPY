import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Button } from '@librechat/client';
import { Trash2, Plus, Loader2, Tag } from 'lucide-react';

interface PromoCode {
    _id: string;
    code: string;
    discountPercentage: number;
    active: boolean;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                discountPercentage: newDiscount
            });
            showToast({ message: 'Código promocional creado exitosamente', status: 'success' });
            setNewCode('');
            setNewDiscount(10);
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
        if (!window.confirm('¿Estás seguro de que deseas eliminar este código? Se borrará también de Stripe de forma permanente.')) {
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
                <Loader2 className="h-6 w-6 animate-spin text-text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-border-light bg-surface-primary p-6 shadow-sm">
                <h3 className="mb-4 text-lg items-center gap-2 flex font-bold text-text-primary">
                    <Tag className="w-5 h-5" />
                    Crear Nuevo Código de Descuento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">Código</label>
                        <input
                            type="text"
                            placeholder="Ej. WAPPY50"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            className="w-full rounded-lg border border-border-light bg-surface-secondary px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 uppercase font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-text-secondary uppercase mb-1.5 block">% Descuento</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={newDiscount}
                            onChange={(e) => setNewDiscount(Number(e.target.value))}
                            className="w-full rounded-lg border border-border-light bg-surface-secondary px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <Button
                            variant="default"
                            onClick={handleCreate}
                            disabled={isSubmitting || !newCode.trim()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Crear Código
                        </Button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border-light shadow-sm">
                <table className="w-full text-left text-sm text-text-secondary">
                    <thead className="bg-surface-secondary text-xs uppercase text-text-primary">
                        <tr>
                            <th className="px-6 py-4 font-bold">Código</th>
                            <th className="px-6 py-4 font-bold">% Descuento</th>
                            <th className="px-6 py-4 font-bold">Estado</th>
                            <th className="px-6 py-4 font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light bg-surface-primary">
                        {codes.map((codeItem) => (
                            <tr key={codeItem._id} className="hover:bg-surface-hover/50">
                                <td className="px-6 py-4 font-mono font-bold text-text-primary">
                                    {codeItem.code}
                                </td>
                                <td className="px-6 py-4 font-medium">
                                    <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md">
                                        -{codeItem.discountPercentage}%
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            role="switch"
                                            aria-checked={codeItem.active}
                                            onClick={() => handleToggle(codeItem._id)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 ease-in-out ${codeItem.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${codeItem.active ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                        <span className={codeItem.active ? 'text-green-600 font-medium' : 'text-text-secondary'}>
                                            {codeItem.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(codeItem._id)}
                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 font-medium transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {codes.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-tertiary">
                                    No hay códigos promocionales creados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
