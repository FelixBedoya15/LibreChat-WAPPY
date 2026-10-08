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

  const saveSession = useCallback((
    dataOrCedula: Partial<WorkerSessionData> | string,
    nombreParam?: string,
    cargoParam?: string
  ) => {
    let updated: WorkerSessionData;

    if (typeof dataOrCedula === 'string') {
      const cleanCed = dataOrCedula.trim();
      if (!cleanCed) return;
      updated = {
        companyId: effectiveCompanyId || session?.companyId,
        companyName: session?.companyName || 'Somos SST',
        cedula: cleanCed,
        nombre: (nombreParam || session?.nombre || '').trim(),
        cargo: (cargoParam || session?.cargo || 'Trabajador').trim(),
        fitScore: session?.fitScore,
        nivel: session?.nivel,
      };
    } else if (dataOrCedula && typeof dataOrCedula === 'object') {
      const rawCed = dataOrCedula.cedula || (dataOrCedula as any).identificacion || (dataOrCedula as any).documento;
      if (!rawCed) return;
      const cleanCed = String(rawCed).trim();
      updated = {
        companyId: dataOrCedula.companyId || effectiveCompanyId || session?.companyId,
        companyName: dataOrCedula.companyName || session?.companyName || 'Somos SST',
        nombre: (dataOrCedula.nombre || session?.nombre || '').trim(),
        cedula: cleanCed,
        cargo: (dataOrCedula.cargo || session?.cargo || 'Trabajador').trim(),
        fitScore: dataOrCedula.fitScore ?? session?.fitScore,
        nivel: dataOrCedula.nivel || session?.nivel,
      };
    } else {
      return;
    }

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
