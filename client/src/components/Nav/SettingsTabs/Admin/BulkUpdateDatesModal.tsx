import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import { Calendar, Clock, X, CheckCircle2 } from 'lucide-react';

interface BulkUpdateDatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    userIds: string[];
    onSuccess: () => void;
}

export default function BulkUpdateDatesModal({ isOpen, onClose, userIds, onSuccess }: BulkUpdateDatesModalProps) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [dates, setDates] = useState({
        activeAt: '',
        inactiveAt: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalPayload: any = { userIds };
            if (dates.activeAt !== '') finalPayload.activeAt = dates.activeAt;
            if (dates.inactiveAt !== '') finalPayload.inactiveAt = dates.inactiveAt;

            if (Object.keys(finalPayload).length === 1) {
                showToast({ message: 'Por favor ingresa al menos una fecha a modificar', status: 'warning' });
                return;
            }

            await axios.post('/api/admin/users/bulk-update', finalPayload);
            showToast({ message: localize('com_ui_user_updated_success') || 'Usuarios actualizados correctamente', status: 'success' });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error updating users:', error);
            showToast({ message: error.response?.data?.message || localize('com_ui_user_update_error') || 'Error al actualizar usuarios', status: 'error' });
        }
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-2xl transition-all border border-slate-200/80 dark:border-zinc-800">
                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/20">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <DialogTitle as="h3" className="text-base font-bold text-slate-800 dark:text-zinc-100">
                                                Actualización Masiva de Fechas
                                            </DialogTitle>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                                Modificando {userIds.length} usuario(s) seleccionados.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={onClose} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-emerald-500" /> Nueva Fecha de Activación
                                        </label>
                                        <input
                                            type="date"
                                            name="activeAt"
                                            value={dates.activeAt}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">Dejar vacío si no deseas modificar la activación.</span>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Nueva Fecha de Vencimiento / Inactivación
                                        </label>
                                        <input
                                            type="date"
                                            name="inactiveAt"
                                            value={dates.inactiveAt}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">Dejar vacío si no deseas modificar el vencimiento.</span>
                                    </div>

                                    <div className="mt-6 flex justify-end items-center gap-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                            onClick={onClose}
                                        >
                                            {localize('com_ui_cancel') || 'Cancelar'}
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{localize('com_ui_save_changes') || 'Aplicar Fechas'}</span>
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
