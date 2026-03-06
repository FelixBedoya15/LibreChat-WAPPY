import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { Input, Label, Button, useToastContext } from '@librechat/client';
import { Send, FileText, X, ChevronRight, MessageSquare, TicketCheck, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '~/utils';

interface Ticket {
    _id: string;
    type: string;
    description: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    response?: string;
    createdAt: string;
}

export default function TicketForm() {
    const { user, token } = useAuthContext();
    const { showToast } = useToastContext();
    const [view, setView] = useState<'menu' | 'create' | 'list'>('menu');
    const [isLoading, setIsLoading] = useState(false);
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        type: 'Petición',
        description: '',
    });

    const fetchMyTickets = useCallback(async () => {
        if (!token) return;
        setLoadingTickets(true);
        try {
            const res = await axios.get('/api/tickets/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMyTickets(res.data);
        } catch (e) {
            console.error('Error fetching my tickets:', e);
        } finally {
            setLoadingTickets(false);
        }
    }, [token]);

    useEffect(() => {
        if (view === 'list') {
            fetchMyTickets();
        }
    }, [view, fetchMyTickets]);

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
            setView('menu');
        } catch (error) {
            showToast({ message: 'Error al enviar el ticket', status: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        if (status === 'resolved') return { label: 'Resuelto', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Icon: CheckCircle2 };
        if (status === 'in_progress') return { label: 'En proceso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', Icon: Clock };
        return { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Icon: Clock };
    };

    // MENU VIEW
    if (view === 'menu') {
        return (
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => setView('create')}
                    className="flex w-full items-center justify-between py-3 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-blue-600 dark:text-blue-400 group"
                >
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-bold">¿Necesitas ayuda? Crear ticket PQRS</span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={() => setView('list')}
                    className="flex w-full items-center justify-between py-3 px-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 transition-all text-green-600 dark:text-green-400 group"
                >
                    <div className="flex items-center gap-3">
                        <TicketCheck className="w-5 h-5" />
                        <span className="font-bold">Ver mis tickets y respuestas</span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    // MY TICKETS VIEW
    if (view === 'list') {
        return (
            <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <TicketCheck className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-bold text-text-primary">Mis Tickets PQRS</h3>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchMyTickets} className="p-2 hover:bg-surface-hover rounded-full transition-colors" title="Actualizar">
                            <RefreshCw className={cn('w-4 h-4 text-text-tertiary', loadingTickets && 'animate-spin')} />
                        </button>
                        <button onClick={() => setView('menu')} className="p-2 hover:bg-surface-hover rounded-full transition-colors">
                            <X className="w-4 h-4 text-text-tertiary" />
                        </button>
                    </div>
                </div>

                {loadingTickets ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                ) : myTickets.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary">
                        <TicketCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No tienes tickets enviados aún</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {myTickets.map(ticket => {
                            const { label, className, Icon } = getStatusInfo(ticket.status);
                            return (
                                <div key={ticket._id} className="p-4 rounded-xl border border-border-light bg-surface-secondary">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{ticket.type}</span>
                                            <p className="text-sm text-text-primary mt-1 leading-relaxed">{ticket.description}</p>
                                        </div>
                                        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0', className)}>
                                            <Icon className="w-3 h-3" />
                                            {label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-text-tertiary mb-2">
                                        {new Date(ticket.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                    {ticket.response ? (
                                        <div className="mt-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                                            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Respuesta del equipo de soporte
                                            </p>
                                            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{ticket.response}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30">
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                En espera de respuesta del equipo de soporte
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={() => setView('create')}
                    className="mt-4 flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-blue-600 dark:text-blue-400 text-sm font-medium"
                >
                    <MessageSquare className="w-4 h-4" />
                    Crear nuevo ticket
                </button>
            </div>
        );
    }

    // CREATE FORM VIEW
    return (
        <div className="mt-4 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enviar una consulta</h3>
                </div>
                <button onClick={() => setView('menu')} className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-full transition-colors">
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
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
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
                    <Label className="text-sm font-semibold mb-1 block">Descripción de la solicitud <span className="text-red-500">*</span></Label>
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
                    <button type="button" onClick={() => setView('list')} className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline flex items-center gap-2">
                        <TicketCheck className="w-4 h-4" />
                        Ver mis tickets anteriores
                    </button>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl shadow-lg h-11">
                        {isLoading ? 'Enviando...' : (
                            <div className="flex items-center gap-2">Enviar Ticket <Send className="w-4 h-4" /></div>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
