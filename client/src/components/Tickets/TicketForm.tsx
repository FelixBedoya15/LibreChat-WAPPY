import React, { useState } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { Input, Label, Button, useToastContext } from '@librechat/client';
import { Send, FileText, X, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '~/utils';

export default function TicketForm() {
    const { user, token } = useAuthContext();
    const { showToast } = useToastContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        type: 'Petición',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description) {
            showToast({ message: 'Por favor, describe tu solicitud', status: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/tickets', formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            showToast({ message: 'Ticket enviado correctamente. Te contactaremos pronto.', status: 'success' });
            setFormData(prev => ({ ...prev, description: '', phone: '' }));
            setIsExpanded(false);
        } catch (error) {
            console.error('Error sending ticket:', error);
            showToast({ message: 'Error al enviar el ticket', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="flex w-full items-center justify-between py-3 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-blue-600 dark:text-blue-400 group"
            >
                <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-bold">¿Necesitas ayuda? Crear ticket PQRS</span>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        );
    }

    return (
        <div className="mt-4 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enviar una consulta</h3>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-semibold mb-1 block">Nombres y Apellidos <span className="text-red-500">*</span></Label>
                        <Input name="name" value={formData.name} onChange={handleChange} required className="bg-white dark:bg-gray-900" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold mb-1 block">Tipo de Solicitud <span className="text-red-500">*</span></Label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option>Petición</option>
                            <option>Queja</option>
                            <option>Reclamo</option>
                            <option>Sugerencia</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-sm font-semibold mb-1 block">Email <span className="text-red-500">*</span></Label>
                        <Input type="email" name="email" value={formData.email} onChange={handleChange} required className="bg-white dark:bg-gray-900" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold mb-1 block">Celular <span className="text-red-500">*</span></Label>
                        <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="bg-white dark:bg-gray-900" />
                    </div>
                </div>

                <div>
                    <Label className="text-sm font-semibold mb-1 block">Descripción o detalle de la solicitud <span className="text-red-500">*</span></Label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        required
                        className="w-full p-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Describe tu solicitud aquí..."
                    />
                </div>

                <div className="pt-4 flex justify-between items-center">
                    <button type="button" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-2">
                        + Adjuntar archivo (Opcional)
                    </button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl shadow-lg hover:shadow-blue-500/20 shadow-blue-500/20 h-11"
                    >
                        {isLoading ? 'Enviando...' : (
                            <div className="flex items-center gap-2">
                                Enviar Ticket
                                <Send className="w-4 h-4" />
                            </div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
