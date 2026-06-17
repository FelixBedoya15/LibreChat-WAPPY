import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { Bell, BellOff, Send, CheckCircle2, XCircle } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '~/utils/pushSubscriptionHelper';

export default function PushTestPanel() {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const [permissionStatus, setPermissionStatus] = useState<string>('default');
    const [vapidKey, setVapidKey] = useState<string>('');
    const [loadingKey, setLoadingKey] = useState<boolean>(true);
    const [title, setTitle] = useState<string>('Alerta de Administrador');
    const [body, setBody] = useState<string>('Esta es una notificación de prueba para administradores.');
    const [sendingLocal, setSendingLocal] = useState<boolean>(false);
    const [sendingBroadcast, setSendingBroadcast] = useState<boolean>(false);

    useEffect(() => {
        // Check current notification permission
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }

        // Fetch VAPID Public Key from backend
        const fetchVapidKey = async () => {
            try {
                const response = await axios.get('/api/notifications/vapid-public-key');
                setVapidKey(response.data.publicKey);
            } catch (error) {
                console.error('Error fetching VAPID key:', error);
            } finally {
                setLoadingKey(false);
            }
        };

        fetchVapidKey();
    }, []);

    const handleSubscribe = async () => {
        if (!vapidKey) {
            showToast({ message: 'Llave pública VAPID no cargada.', status: 'error' });
            return;
        }

        const sub = await subscribeToPushNotifications(vapidKey, token);
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }

        if (sub) {
            showToast({ message: 'Dispositivo suscrito exitosamente a Notificaciones Push.', status: 'success' });
        } else {
            showToast({ message: 'No se pudo completar la suscripción. Asegúrate de conceder permisos.', status: 'error' });
        }
    };

    const handleUnsubscribe = async () => {
        await unsubscribeFromPushNotifications(token);
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
        showToast({ message: 'Suscripción removida de este dispositivo.', status: 'success' });
    };

    const handleSendLocalTest = async () => {
        try {
            setSendingLocal(true);
            await axios.post('/api/notifications/test-push');
            showToast({ message: 'Notificación de prueba local enviada.', status: 'success' });
        } catch (error) {
            console.error(error);
            showToast({ message: 'Error al enviar notificación de prueba. ¿Ya te suscribiste?', status: 'error' });
        } finally {
            setSendingLocal(false);
        }
    };

    const handleBroadcastTest = async () => {
        if (!title.trim() || !body.trim()) {
            showToast({ message: 'Título y Mensaje son obligatorios.', status: 'error' });
            return;
        }

        try {
            setSendingBroadcast(true);
            const response = await axios.post('/api/notifications/admin-push', { title, body });
            showToast({ message: response.data.message || 'Notificación masiva enviada a administradores.', status: 'success' });
        } catch (error) {
            console.error(error);
            showToast({ message: 'Error al difundir la notificación a los administradores.', status: 'error' });
        } finally {
            setSendingBroadcast(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 text-sm">
            {/* Estado de Suscripción */}
            <div className="rounded-xl border border-gray-100 bg-surface-secondary p-5 dark:border-gray-800">
                <h4 className="mb-2 font-semibold text-text-primary text-base">Estado del Dispositivo</h4>
                <div className="flex items-center gap-3 mb-4">
                    {permissionStatus === 'granted' ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="h-4 w-4" />
                            Suscrito / Permiso Concedido
                        </div>
                    ) : permissionStatus === 'denied' ? (
                        <div className="flex items-center gap-1.5 text-red-600 font-medium bg-red-500/10 px-3 py-1.5 rounded-full">
                            <XCircle className="h-4 w-4" />
                            Permiso Denegado (Restablece los permisos en el navegador)
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-500/10 px-3 py-1.5 rounded-full">
                            <Bell className="h-4 w-4 animate-bounce" />
                            Permiso Pendiente
                        </div>
                    )}
                </div>
                
                <p className="text-text-secondary mb-5 leading-relaxed">
                    Las notificaciones Push funcionan mediante un Service Worker. Para probar en un teléfono móvil, primero debes agregar esta app a la pantalla de inicio ("Añadir a pantalla de inicio" / instalar PWA) y luego suscribirte desde aquí.
                </p>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleSubscribe}
                        disabled={loadingKey}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 shadow-sm transition-all disabled:opacity-50"
                    >
                        <Bell className="h-4 w-4" />
                        Activar Notificaciones en este dispositivo
                    </button>
                    <button
                        onClick={handleUnsubscribe}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-primary hover:bg-surface-hover text-text-primary font-semibold px-4 py-2.5 shadow-sm transition-all"
                    >
                        <BellOff className="h-4 w-4" />
                        Desactivar Notificaciones
                    </button>
                </div>
            </div>

            {/* Pruebas de Envío */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prueba Local */}
                <div className="rounded-xl border border-gray-100 bg-surface-secondary p-5 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <h4 className="mb-2 font-semibold text-text-primary text-base">Prueba Local (Solo tú)</h4>
                        <p className="text-text-secondary mb-4 leading-relaxed">
                            Envía una notificación de prueba directamente a este navegador o celular para validar que el canal de comunicación y el Service Worker estén activos en segundo plano.
                        </p>
                    </div>
                    <button
                        onClick={handleSendLocalTest}
                        disabled={sendingLocal || permissionStatus !== 'granted'}
                        className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2.5 shadow-sm transition-all disabled:opacity-50 w-full"
                    >
                        <Send className="h-4 w-4" />
                        {sendingLocal ? 'Enviando...' : 'Enviar Prueba Local'}
                    </button>
                </div>

                {/* Difusión Administradores */}
                <div className="rounded-xl border border-gray-100 bg-surface-secondary p-5 dark:border-gray-800">
                    <h4 className="mb-2 font-semibold text-text-primary text-base">Difundir a todos los Administradores</h4>
                    <p className="text-text-secondary mb-4">
                        Envía esta alerta Push en tiempo real a todos los dispositivos registrados por usuarios con el rol de administrador.
                    </p>

                    <div className="flex flex-col gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Título de la Notificación</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-primary px-3.5 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Escribe el título..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1">Mensaje</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-primary px-3.5 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Escribe el mensaje..."
                                rows={2}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleBroadcastTest}
                        disabled={sendingBroadcast}
                        className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 shadow-sm transition-all disabled:opacity-50 w-full"
                    >
                        <Send className="h-4 w-4" />
                        {sendingBroadcast ? 'Enviando Difusión...' : 'Difundir a Administradores'}
                    </button>
                </div>
            </div>
        </div>
    );
}
