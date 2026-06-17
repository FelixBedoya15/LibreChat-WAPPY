// Helper utility to manage PWA Push Notifications permissions and subscriptions

// Helper to convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permissions and register for Push Notifications
 * @param {string} publicVapidKey - Server VAPID Public Key
 * @param {string} token - User auth jwt token
 */
export async function subscribeToPushNotifications(publicVapidKey, token) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Este navegador o dispositivo no soporta Notificaciones Push.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('El usuario denegó los permisos de notificación.');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe the user to Push Services
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    // Send subscription to backend
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Error al registrar la suscripción en el servidor.');
    }

    console.log('Dispositivo registrado para recibir Notificaciones Push.');
    return subscription;
  } catch (error) {
    console.error('Error al suscribirse a notificaciones push:', error);
    return null;
  }
}

/**
 * Unsubscribe current device from Push Notifications
 * @param {string} token - User auth jwt token
 */
export async function unsubscribeFromPushNotifications(token) {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Notify backend to remove subscription
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      
      console.log('Dispositivo cancelado del servicio de notificaciones.');
    }
  } catch (error) {
    console.error('Error al cancelar la suscripción push:', error);
  }
}
