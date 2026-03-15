import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import {
    Bell, Search, Trash2, CheckCheck, EyeOff, Filter, RefreshCw,
    MessageSquare, TicketCheck, ChevronRight, X, Inbox, Building2
} from 'lucide-react';
import { cn } from '~/utils';

interface Notification {
    _id: string;
    type: 'ticket_created' | 'ticket_responded' | 'contact_request';
    title: string;
    body: string;
    read: boolean;
    ticketId?: string;
    createdAt: string;
}

type FilterType = 'all' | 'unread' | 'read' | 'ticket_created' | 'ticket_responded' | 'contact_request';

interface NotificationsPageProps {
    onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsPage({ onUnreadCountChange }: NotificationsPageProps) {
    const { token, user } = useAuthContext();
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(res.data);
            const unread = res.data.filter((n: Notification) => !n.read).length;
            onUnreadCountChange?.(unread);
        } catch (e) {
            showToast({ message: 'Error al cargar notificaciones', status: 'error' });
        } finally {
            setLoading(false);
        }
    }, [token, onUnreadCountChange]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markRead = async (id: string) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            const newCount = notifications.filter(n => !n.read && n._id !== id).length;
            onUnreadCountChange?.(newCount);
        } catch (e) { /* silent */ }
    };

    const markUnread = async (id: string) => {
        try {
            await axios.put(`/api/notifications/${id}/unread`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
            const newCount = notifications.filter(n => !n.read).length + 1;
            onUnreadCountChange?.(newCount);
        } catch (e) { /* silent */ }
    };

    const deleteOne = async (id: string) => {
        try {
            await axios.delete(`/api/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const updated = notifications.filter(n => n._id !== id);
            setNotifications(updated);
            onUnreadCountChange?.(updated.filter(n => !n.read).length);
        } catch (e) {
            showToast({ message: 'Error al eliminar notificación', status: 'error' });
        }
    };

    const deleteAll = async () => {
        try {
            await axios.delete('/api/notifications/all', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications([]);
            onUnreadCountChange?.(0);
            showToast({ message: 'Todas las notificaciones eliminadas', status: 'success' });
        } catch (e) {
            showToast({ message: 'Error al eliminar notificaciones', status: 'error' });
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            onUnreadCountChange?.(0);
        } catch (e) { /* silent */ }
    };

    const handleNavigate = async (notification: Notification) => {
        // Mark as read first
        if (!notification.read) {
            await markRead(notification._id);
        }
        // Navigate based on role and type
        if (notification.type === 'ticket_created' && user?.role === 'ADMIN') {
            // Admin: open settings > tickets tab
            const event = new CustomEvent('switch-settings-tab', { 
                detail: { 
                    mainTab: 'tickets', 
                    ticketId: notification.ticketId 
                } 
            });
            window.dispatchEvent(event);
            // Trigger settings to open
            const settingsEvent = new CustomEvent('open-settings');
            window.dispatchEvent(settingsEvent);
        } else if (notification.type === 'ticket_responded') {
            // User: open settings > account to see their tickets
            const event = new CustomEvent('switch-settings-tab', { detail: { mainTab: 'account' } });
            window.dispatchEvent(event);
            const settingsEvent = new CustomEvent('open-settings');
            window.dispatchEvent(settingsEvent);
        } else if (notification.type === 'contact_request' && user?.role === 'ADMIN') {
            // Admin: open settings > tickets tab
            const event = new CustomEvent('switch-settings-tab', { 
                detail: { 
                    mainTab: 'tickets',
                    ticketId: notification.ticketId 
                } 
            });
            window.dispatchEvent(event);
            const settingsEvent = new CustomEvent('open-settings');
            window.dispatchEvent(settingsEvent);
        }
    };

    // Filter + search
    const filtered = notifications.filter(n => {
        const matchSearch = searchQuery
            ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.body.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        const matchFilter =
            filter === 'all' ? true :
                filter === 'unread' ? !n.read :
                    filter === 'read' ? n.read :
                        n.type === filter;
        return matchSearch && matchFilter;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const filters: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'Todas' },
        { value: 'unread', label: 'No leídas' },
        { value: 'read', label: 'Leídas' },
        { value: 'ticket_created', label: 'Tickets nuevos' },
        { value: 'ticket_responded', label: 'Respuestas' },
        { value: 'contact_request', label: 'Planes Empresa' },
    ];

    return (
        <div className="flex flex-col h-full max-w-2xl mx-auto px-2 py-4 gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-bold text-text-primary">Notificaciones</h2>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 leading-none">
                            {unreadCount} sin leer
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchNotifications()}
                        className="p-2 hover:bg-surface-hover rounded-full transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className={cn('w-4 h-4 text-text-tertiary', loading && 'animate-spin')} />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-light text-xs font-medium text-text-secondary hover:bg-surface-hover transition-all"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Leer todas
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={deleteAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/30 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar todas
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar notificaciones..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-light bg-surface-secondary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-text-tertiary hover:text-text-primary" />
                    </button>
                )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                            filter === f.value
                                ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                : 'border-border-light text-text-secondary hover:bg-surface-hover'
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-text-tertiary gap-3">
                        <Inbox className="w-12 h-12 opacity-25" />
                        <p className="text-sm font-medium">No hay notificaciones</p>
                        {(searchQuery || filter !== 'all') && (
                            <button onClick={() => { setSearchQuery(''); setFilter('all'); }} className="text-xs text-blue-500 hover:underline">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(n => (
                        <div
                            key={n._id}
                            className={cn(
                                'group relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer',
                                n.read
                                    ? 'border-border-light bg-surface-primary hover:bg-surface-secondary'
                                    : 'border-blue-200 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/70 dark:hover:bg-blue-900/20'
                            )}
                            onClick={() => handleNavigate(n)}
                        >
                            {/* Icon */}
                            <div className={cn(
                                'mt-0.5 p-2 rounded-full flex-shrink-0',
                                n.type === 'ticket_responded'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                    : n.type === 'contact_request'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            )}>
                                {n.type === 'ticket_responded'
                                    ? <MessageSquare className="w-4 h-4" />
                                    : n.type === 'contact_request'
                                        ? <Building2 className="w-4 h-4" />
                                        : <TicketCheck className="w-4 h-4" />
                                }
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={cn('text-sm font-semibold', n.read ? 'text-text-secondary' : 'text-text-primary')}>
                                        {n.title}
                                    </p>
                                    {!n.read && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                                    )}
                                </div>
                                <p className="text-xs text-text-tertiary leading-relaxed mt-0.5 line-clamp-2">
                                    {n.body}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-[11px] text-text-tertiary">
                                        {new Date(n.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                    <div className="flex items-center gap-1 text-text-tertiary">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                        <span className="text-[11px]">Ver detalle</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (hover) */}
                            <div
                                className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1 bg-surface-primary border border-border-light rounded-lg p-0.5 shadow-sm"
                                onClick={e => e.stopPropagation()}
                            >
                                {n.read ? (
                                    <button
                                        onClick={() => markUnread(n._id)}
                                        className="p-1.5 hover:bg-surface-hover rounded-md transition-colors"
                                        title="Marcar como no leída"
                                    >
                                        <EyeOff className="w-3.5 h-3.5 text-text-secondary" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => markRead(n._id)}
                                        className="p-1.5 hover:bg-surface-hover rounded-md transition-colors"
                                        title="Marcar como leída"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteOne(n._id)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
