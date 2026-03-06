import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { Button, useToastContext, Input } from '@librechat/client';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Sparkles,
    History,
    MessageSquare,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Search,
    Brain,
    Send
} from 'lucide-react';
import { cn } from '~/utils';

export default function TicketManagement() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/tickets/all', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setTickets(res.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            showToast({ message: 'Error fetching tickets', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestAi = async (ticketId: string) => {
        setIsAiLoading(true);
        try {
            const res = await axios.post(`/api/tickets/${ticketId}/ai-suggest`, {}, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setResponse(res.data.suggestion);
            showToast({ message: 'Respuesta sugerida por la IA', status: 'success' });
        } catch (error) {
            console.error('Error with AI suggest:', error);
            showToast({ message: 'Error al sugerir respuesta con IA', status: 'error' });
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleRespond = async (ticketId: string) => {
        if (!response.trim()) return;
        setIsSending(true);
        try {
            await axios.post(`/api/tickets/${ticketId}/respond`, { response, status: 'resolved' }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            showToast({ message: 'Respuesta enviada correctamente', status: 'success' });
            setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            console.error('Error responding:', error);
            showToast({ message: 'Error al enviar respuesta', status: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (selectedTicket) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Regresar a la lista
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
                    {/* Detalles del Ticket */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-surface-secondary dark:bg-gray-800/50 p-6 rounded-2xl border border-border-light">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-blue-500" />
                                Detalle de la Solicitud
                            </h3>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="text-xs uppercase font-bold text-text-tertiary">Tipo</label>
                                    <p className="mt-1 font-medium">{selectedTicket.type}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-text-tertiary">Usuario</label>
                                    <p className="mt-1 font-medium">{selectedTicket.name}</p>
                                    <p className="text-xs text-text-secondary">{selectedTicket.email}</p>
                                    <p className="text-xs text-text-secondary">{selectedTicket.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-text-tertiary">Fecha</label>
                                    <p className="mt-1 font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-text-tertiary">Estado</label>
                                    <div className={cn("mt-1 w-fit px-2 py-1 rounded-full text-[10px] font-bold uppercase", getStatusStyles(selectedTicket.status))}>
                                        {selectedTicket.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-secondary dark:bg-gray-800/50 p-6 rounded-2xl border border-border-light">
                            <h4 className="text-sm font-bold mb-3">Descripción</h4>
                            <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                                {selectedTicket.description}
                            </p>
                        </div>
                    </div>

                    {/* Editor de Respuesta con IA */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-surface-primary dark:bg-gray-900 border border-border-light rounded-2xl p-6 shadow-sm flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                                    <MessageSquare className="w-5 h-5 text-green-500" />
                                    Redactar Respuesta
                                </h3>

                                <div className="flex gap-3">
                                    <button
                                        className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-surface-secondary text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        <History className="w-4 h-4 text-orange-500" />
                                        <span>Historial</span>
                                    </button>

                                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-secondary border border-border-light shadow-sm">
                                        <Brain className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold">3 Flash Preview</span>
                                    </div>

                                    <button
                                        onClick={() => handleSuggestAi(selectedTicket._id)}
                                        disabled={isAiLoading}
                                        className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 disabled:opacity-50"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>{isAiLoading ? 'Pensando...' : 'Autocompletar IA'}</span>
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Escribe tu respuesta aquí..."
                                className="flex-1 w-full p-4 rounded-xl border border-border-light bg-surface-secondary dark:bg-gray-800 text-text-primary focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-6"
                            />

                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setSelectedTicket(null)}
                                    variant="outline"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => handleRespond(selectedTicket._id)}
                                    variant="submit"
                                    disabled={isSending || !response.trim()}
                                    className="h-11 px-8 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isSending ? 'Enviando...' : (
                                        <div className="flex items-center gap-2">
                                            Enviar y Cerrar Ticket
                                            <Send className="w-4 h-4" />
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Sistema de Tickets PQRS</h2>
                    <p className="text-text-secondary text-sm">Gestiona y responde las solicitudes de los usuarios.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <Input
                        placeholder="Buscar por usuario o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="bg-surface-primary dark:bg-gray-900 border border-border-light rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface-secondary dark:bg-gray-800 text-xs font-bold uppercase text-text-tertiary tracking-wider border-b border-border-light">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Asunto Preview</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-surface-secondary/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary">{ticket.name}</p>
                                                <p className="text-[10px] text-text-tertiary tracking-tight font-medium uppercase">{ticket.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-text-secondary">{ticket.type}</span>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-xs">
                                        <span className="text-text-primary">{ticket.description}</span>
                                    </td>
                                    <td className="px-6 py-4 text-text-tertiary">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit tracking-wide", getStatusStyles(ticket.status))}>
                                            {ticket.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setResponse(ticket.response || '');
                                            }}
                                            className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                                        >
                                            Responder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTickets.length === 0 && (
                    <div className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-20" />
                        <p className="text-text-secondary">No se han encontrado tickets que coincidan con la búsqueda.</p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-xs text-text-tertiary px-2">
                <p>Mostrando {filteredTickets.length} de {tickets.length} tickets</p>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:text-text-primary"><ChevronLeft className="w-4 h-4" /> Ant.</button>
                    <button className="flex items-center gap-1 hover:text-text-primary">Sig. <ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
}
