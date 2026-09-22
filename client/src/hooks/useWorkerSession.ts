import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

export interface WorkerSessionData {
  companyId?: string;
  companyName?: string;
  nombre: string;
  cedula: string;
  cargo?: string;
  fitScore?: number;
  nivel?: string;
}

export function useWorkerSession(companyIdParam?: string) {
  const location = useLocation();
  const params = useParams<{ companyId?: string; cedula?: string; workerId?: string }>();
  
  const effectiveCompanyId = companyIdParam || params.companyId;

  // Resolve initial cédula from URL query, route params, or localStorage
  const getInitialCedula = (): string => {
    try {
      const qParams = new URLSearchParams(location.search);
      const queryCed = qParams.get('cedula');
      if (queryCed && queryCed.trim()) return queryCed.trim();

      if (params.cedula && params.cedula.trim()) return params.cedula.trim();

      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.cedula && String(parsed.cedula).trim()) return String(parsed.cedula).trim();
      }

      const directCed = localStorage.getItem('wappy_worker_cedula');
      if (directCed && directCed.trim()) return directCed.trim();
    } catch (e) {
      // ignore
    }
    return '';
  };

  // Resolve initial session data from localStorage
  const getInitialSession = (): WorkerSessionData | null => {
    try {
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed?.cedula && parsed?.nombre) {
          return {
            companyId: parsed.companyId || effectiveCompanyId,
            companyName: parsed.companyName || '',
            nombre: parsed.nombre || '',
            cedula: parsed.cedula || '',
            cargo: parsed.cargo || '',
            fitScore: parsed.fitScore,
            nivel: parsed.nivel,
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const [session, setSession] = useState<WorkerSessionData | null>(getInitialSession);
  const [loading, setLoading] = useState(false);

  // Sync / Fetch worker information from API if we have cédula but incomplete details
  const fetchWorkerInfo = useCallback(async (ced: string, cid?: string) => {
    const targetCompanyId = cid || effectiveCompanyId;
    if (!ced || !targetCompanyId) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/public-sgsst/colaborador-info/${targetCompanyId}/${ced}`);
      if (res.data?.success && res.data?.worker) {
        const w = res.data.worker;
        const newSession: WorkerSessionData = {
          companyId: targetCompanyId,
          companyName: res.data.company?.companyName || 'Somos SST',
          nombre: w.nombre || '',
          cedula: w.documento || ced,
          cargo: w.cargo || 'Trabajador',
          fitScore: w.fitScore,
          nivel: w.nivel,
        };

        setSession(newSession);
        localStorage.setItem('wappy_worker_session', JSON.stringify(newSession));
        localStorage.setItem('wappy_worker_cedula', newSession.cedula);
      }
    } catch (err) {
      // No alert, allow graceful fallback to manual form if worker not found
      console.warn('[useWorkerSession] Could not auto-fetch worker:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

  useEffect(() => {
    const ced = getInitialCedula();
    if (!ced) return;

    // If we already have full session matching this cédula, make sure localStorage keys are fresh
    if (session && session.cedula === ced && session.nombre) {
      localStorage.setItem('wappy_worker_cedula', ced);
      return;
    }

    // Otherwise fetch profile from API
    fetchWorkerInfo(ced, effectiveCompanyId);
  }, [location.search, params.cedula, effectiveCompanyId]);

  const saveSession = useCallback((data: Partial<WorkerSessionData>) => {
    if (!data.cedula) return;
    const updated: WorkerSessionData = {
      companyId: data.companyId || effectiveCompanyId || session?.companyId,
      companyName: data.companyName || session?.companyName || 'Somos SST',
      nombre: data.nombre || session?.nombre || '',
      cedula: data.cedula,
      cargo: data.cargo || session?.cargo || 'Trabajador',
      fitScore: data.fitScore ?? session?.fitScore,
      nivel: data.nivel || session?.nivel,
    };

    setSession(updated);
    try {
      localStorage.setItem('wappy_worker_session', JSON.stringify(updated));
      localStorage.setItem('wappy_worker_cedula', updated.cedula);
    } catch (e) {}
  }, [effectiveCompanyId, session]);

  const clearSession = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem('wappy_worker_session');
      localStorage.removeItem('wappy_worker_cedula');
    } catch (e) {}
  }, []);

  const isAuthenticated = Boolean(session && session.cedula && session.nombre);

  return {
    session,
    worker: session,
    isAuthenticated,
    loading,
    saveSession,
    clearSession,
    refreshSession: () => {
      const ced = getInitialCedula();
      if (ced) fetchWorkerInfo(ced, effectiveCompanyId);
    }
  };
}

export default useWorkerSession;
