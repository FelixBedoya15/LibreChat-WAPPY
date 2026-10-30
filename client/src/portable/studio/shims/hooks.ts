import { useState, useEffect } from 'react';

interface PortableAuthState {
  user: any;
  token: string;
  isAuthenticated: boolean;
}

const DEFAULT_GUEST_STATE: PortableAuthState = {
  user: { name: 'WAPPY Studio', role: 'PORTABLE' },
  token: '',
  isAuthenticated: false,
};

let cachedAuthState: PortableAuthState | null = null;
let authRefreshPromise: Promise<PortableAuthState> | null = null;
const subscribers = new Set<(state: PortableAuthState) => void>();

function notifySubscribers(nextState: PortableAuthState) {
  cachedAuthState = nextState;
  subscribers.forEach((fn) => {
    try {
      fn(nextState);
    } catch {
      /* ignore */
    }
  });
}

function readWindowAuthState(): PortableAuthState | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  if (win.platformUser && (win.isPlatformLoggedIn || win.platformUserToken)) {
    return {
      user: win.platformUser,
      token: String(win.platformUserToken || win.platformAuthToken || ''),
      isAuthenticated: true,
    };
  }
  return null;
}

function triggerSessionRefresh(): Promise<PortableAuthState> {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return Promise.resolve(DEFAULT_GUEST_STATE);
  }
  const fromWin = readWindowAuthState();
  if (fromWin) {
    cachedAuthState = fromWin;
    return Promise.resolve(fromWin);
  }
  if (!authRefreshPromise) {
    authRefreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return DEFAULT_GUEST_STATE;
        const data = await res.json().catch(() => null);
        if (data && data.user) {
          const win = window as any;
          win.platformUser = data.user;
          win.platformUserToken = String(data.token || '');
          win.isPlatformLoggedIn = true;
          const nextState: PortableAuthState = {
            user: data.user,
            token: String(data.token || ''),
            isAuthenticated: true,
          };
          notifySubscribers(nextState);
          return nextState;
        }
        return DEFAULT_GUEST_STATE;
      })
      .catch(() => DEFAULT_GUEST_STATE);
  }
  return authRefreshPromise;
}

if (typeof window !== 'undefined') {
  window.addEventListener('wappy-auth-updated', () => {
    const updated = readWindowAuthState() || DEFAULT_GUEST_STATE;
    notifySubscribers(updated);
  });
}

/**
 * Sesión híbrida para aplicaciones portables de WAPPY:
 * - Si el usuario tiene sesión iniciada en WAPPY (`/api/auth/refresh`), hidrata automáticamente `user`, `token` e `isAuthenticated: true` para traer todas sus conexiones, empresas de Somos SST y puente Antigravity.
 * - Si no está registrado o usa el archivo descargado offline (`file:`), opera como visitante con sus conexiones locales de la app.
 */
export function useAuthContext(): PortableAuthState {
  const [state, setState] = useState<PortableAuthState>(() => {
    return readWindowAuthState() || cachedAuthState || DEFAULT_GUEST_STATE;
  });

  useEffect(() => {
    subscribers.add(setState);
    const currentWin = readWindowAuthState();
    if (currentWin) {
      setState(currentWin);
    } else {
      triggerSessionRefresh().then((resolved) => {
        setState(resolved);
      });
    }
    return () => {
      subscribers.delete(setState);
    };
  }, []);

  return state;
}
