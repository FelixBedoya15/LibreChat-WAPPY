import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { Bell, CheckCheck, Ticket, MessageSquare, X, ChevronRight } from 'lucide-react';
import { cn } from '~/utils';

interface Notification {
    _id: string;
    type: 'ticket_created' | 'ticket_responded';
    title: string;
    body: string;
    read: boolean;
    ticketId?: string;
    createdAt: string;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onCountChange?: (count: number) => void;
}

export default function NotificationPanel({ isOpen, onClose, onCountChange }: NotificationPanelProps) {
    const { token, user } = useAuthContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(res.data);
            const unread = res.data.filter((n: Notification) => !n.read).length;
            onCountChange?.(unread);
        } catch (e) {
            console.error('Error fetching notifications:', e);
        } finally {
            setLoading(false);
        }
    }, [token, onCountChange]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const markAllRead = async () => {
        try {
            await axios.put('/api/notifications/read-all', {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            onCountChange?.(0);
        } catch (e) {
            console.error('Error marking all as read:', e);
        }
    };

    const markOneRead = async (id: string) => {
        try {
            await axios.put(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            const newUnread = notifications.filter(n => !n.read && n._id !== id).length;
            onCountChange?.(newUnread);
        } catch (e) {
            console.error('Error marking notification as read:', e);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markOneRead(notification._id);
        }

        // Navigation logic
        if (notification.type === 'ticket_created' && user?.role === 'ADMIN') {
            const event = new CustomEvent('switch-settings-tab', { detail: { mainTab: 'admin', subTab: 'pqrs' } });
            window.dispatchEvent(event);
            const openEvent = new CustomEvent('open-settings');
            window.dispatchEvent(openEvent);
        } else if (notification.type === 'ticket_responded') {
            const event = new CustomEvent('switch-settings-tab', { detail: { mainTab: 'account' } });
            window.dispatchEvent(event);
            const openEvent = new CustomEvent('open-settings');
            window.dispatchEvent(openEvent);
        }
        onClose();
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div
            ref={panelRef}
            className={cn(
                'absolute bottom-16 left-2 z-[100] w-80 bg-surface-primary border border-border-light rounded-2xl shadow-2xl overflow-hidden',
                'animate-in slide-in-from-bottom-4 fade-in duration-200'
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-light bg-surface-secondary">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-sm text-text-primary">Notificaciones</span>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                            title="Marcar todas como leídas"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Leer todas
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 hover:bg-surface-hover rounded-full transition-colors">
                        <X className="w-4 h-4 text-text-tertiary" />
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border-light scrollbar-thin">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-text-tertiary gap-2">
                        <Bell className="w-8 h-8 opacity-20" />
                        <span className="text-sm">No hay notificaciones</span>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                                'flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group',
                                n.read
                                    ? 'bg-surface-primary hover:bg-surface-secondary'
                                    : 'bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/60 dark:hover:bg-blue-900/20'
                            )}
                        >
                            <div className={cn(
                                'mt-0.5 p-1.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-110',
                                n.type === 'ticket_responded'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                            )}>
                                {n.type === 'ticket_responded'
                                    ? <MessageSquare className="w-3.5 h-3.5" />
                                    : <Ticket className="w-3.5 h-3.5" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn('text-sm font-semibold truncate', n.read ? 'text-text-secondary' : 'text-text-primary')}>
                                        {n.title}
                                    </p>
                                    {!n.read && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-text-tertiary leading-relaxed mt-0.5 line-clamp-2">
                                    {n.body}
                                </p>
                                <p className="text-[10px] text-text-tertiary mt-1 flex items-center justify-between">
                                    {new Date(n.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-medium text-blue-500">
                                        Ver <ChevronRight className="w-2.5 h-2.5" />
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Footer footer to reach full page */}
            <button
                onClick={() => {
                    const event = new CustomEvent('switch-settings-tab', { detail: { mainTab: 'notifications' } });
                    window.dispatchEvent(event);
                }}
                className="hidden" // Will handle properly in parent
            ></button>
            <div className="p-2 bg-surface-secondary border-t border-border-light text-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // This event logic is handled better by just having a button in AccountSettings
                        // But let's trigger the event and let parent handle
                        const event = new CustomEvent('switch-settings-tab', { detail: { mainTab: 'notifications' } });
                        window.dispatchEvent(event);
                        const openEvent = new CustomEvent('open-settings');
                        window.dispatchEvent(openEvent);
                        onClose();
                    }}
                    className="text-[11px] font-bold text-blue-500 hover:text-blue-700 transition-colors py-1 px-4 rounded-lg hover:bg-blue-500/5"
                >
                    Ver todas las notificaciones
                </button>
            </div>
        </div>
    );
}
