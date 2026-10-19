import { useState, useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

export interface WorkerSessionData {
  companyId?: string;
  urlCompanyId?: string;
  companyName?: string;
  nombre: string;
  cedula: string;
  identificacion?: string;
  cargo?: string;
  fitScore?: number;
  nivel?: string;
  firmaDigital?: string | null;
}

export function useWorkerSession(companyIdParam?: string) {
  const location = useLocation();
  const params = useParams<{ companyId?: string; cedula?: string; workerId?: string }>();
  
  const effectiveCompanyId = companyIdParam || params.companyId;

  // Resolve initial cédula from URL query, route params, or scoped localStorage
  const getInitialCedula = (): string => {
    try {
      const qParams = new URLSearchParams(location.search);
      const queryCed = qParams.get('cedula');
      if (queryCed && queryCed.trim()) return queryCed.trim();

      if (params.cedula && params.cedula.trim()) return params.cedula.trim();

      // 1. Scoped session for effectiveCompanyId has priority
      if (effectiveCompanyId) {
        const scopedRaw = localStorage.getItem(`wappy_worker_session_${effectiveCompanyId}`);
        if (scopedRaw) {
          const parsed = JSON.parse(scopedRaw);
          if (parsed?.cedula && String(parsed.cedula).trim()) return String(parsed.cedula).trim();
        }
        const scopedCed = localStorage.getItem(`wappy_worker_cedula_${effectiveCompanyId}`);
        if (scopedCed && scopedCed.trim()) return scopedCed.trim();
      }

      // 2. Global legacy session ONLY if it strictly matches effectiveCompanyId
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        const matches = !effectiveCompanyId ||
          parsed?.companyId === effectiveCompanyId ||
          parsed?.urlCompanyId === effectiveCompanyId;
        if (matches && parsed?.cedula && String(parsed.cedula).trim()) {
          return String(parsed.cedula).trim();
        }
      }

      if (!effectiveCompanyId) {
        const directCed = localStorage.getItem('wappy_worker_cedula');
        if (directCed && directCed.trim()) return directCed.trim();
      }
    } catch (e) {
      // ignore
    }
    return '';
  };

  // Resolve initial session data from localStorage
  const getInitialSession = (): WorkerSessionData | null => {
    try {
      // 1. Scoped session for effectiveCompanyId
      if (effectiveCompanyId) {
        const scopedRaw = localStorage.getItem(`wappy_worker_session_${effectiveCompanyId}`);
        if (scopedRaw) {
          const parsed = JSON.parse(scopedRaw);
          if (parsed?.cedula && parsed?.nombre) {
            const cleanCed = String(parsed.cedula).trim();
            return {
              companyId: parsed.companyId || effectiveCompanyId,
              urlCompanyId: parsed.urlCompanyId || effectiveCompanyId,
              companyName: parsed.companyName || '',
              nombre: parsed.nombre || '',
              cedula: cleanCed,
              identificacion: cleanCed,
              cargo: parsed.cargo || '',
              fitScore: parsed.fitScore,
              nivel: parsed.nivel,
              firmaDigital: parsed.firmaDigital || null,
            };
          }
        }
      }

      // 2. Global legacy session ONLY if it strictly matches effectiveCompanyId
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        const matches = !effectiveCompanyId ||
          parsed?.companyId === effectiveCompanyId ||
          parsed?.urlCompanyId === effectiveCompanyId;
        if (matches && parsed?.cedula && parsed?.nombre) {
          const cleanCed = String(parsed.cedula).trim();
          return {
            companyId: parsed.companyId || effectiveCompanyId,
            urlCompanyId: parsed.urlCompanyId || effectiveCompanyId,
            companyName: parsed.companyName || '',
            nombre: parsed.nombre || '',
            cedula: cleanCed,
            identificacion: cleanCed,
            cargo: parsed.cargo || '',
            fitScore: parsed.fitScore,
            nivel: parsed.nivel,
            firmaDigital: parsed.firmaDigital || null,
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
        const cleanCed = String(w.documento || ced).trim();
        const newSession: WorkerSessionData = {
          companyId: res.data.company?._id || targetCompanyId,
          urlCompanyId: targetCompanyId,
          companyName: res.data.company?.companyName || 'Somos SST',
          nombre: w.nombre || '',
          cedula: cleanCed,
          identificacion: cleanCed,
          cargo: w.cargo || 'Trabajador',
          fitScore: w.fitScore,
          nivel: w.nivel,
        };

        setSession(newSession);
        if (targetCompanyId) {
          localStorage.setItem(`wappy_worker_session_${targetCompanyId}`, JSON.stringify(newSession));
          localStorage.setItem(`wappy_worker_cedula_${targetCompanyId}`, newSession.cedula);
        }
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

    // Check if the cached session already matches both the cédula and current company context
    const matchesCompany = !effectiveCompanyId ||
      session?.companyId === effectiveCompanyId ||
      session?.urlCompanyId === effectiveCompanyId;

    if (session && session.cedula === ced && session.nombre && matchesCompany) {
      if (effectiveCompanyId) {
        localStorage.setItem(`wappy_worker_cedula_${effectiveCompanyId}`, ced);
      }
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
        urlCompanyId: effectiveCompanyId || session?.urlCompanyId,
        companyName: session?.companyName || 'Somos SST',
        cedula: cleanCed,
        identificacion: cleanCed,
        nombre: (nombreParam || session?.nombre || '').trim(),
        cargo: (cargoParam || session?.cargo || 'Trabajador').trim(),
        fitScore: session?.fitScore,
        nivel: session?.nivel,
        firmaDigital: session?.firmaDigital || null,
      };
    } else if (dataOrCedula && typeof dataOrCedula === 'object') {
      const rawCed = dataOrCedula.cedula || (dataOrCedula as any).identificacion || (dataOrCedula as any).documento;
      if (!rawCed) return;
      const cleanCed = String(rawCed).trim();
      updated = {
        companyId: dataOrCedula.companyId || effectiveCompanyId || session?.companyId,
        urlCompanyId: dataOrCedula.urlCompanyId || effectiveCompanyId || session?.urlCompanyId,
        companyName: dataOrCedula.companyName || session?.companyName || 'Somos SST',
        nombre: (dataOrCedula.nombre || session?.nombre || '').trim(),
        cedula: cleanCed,
        identificacion: cleanCed,
        cargo: (dataOrCedula.cargo || session?.cargo || 'Trabajador').trim(),
        fitScore: dataOrCedula.fitScore ?? session?.fitScore,
        nivel: dataOrCedula.nivel || session?.nivel,
        firmaDigital: dataOrCedula.firmaDigital ?? session?.firmaDigital ?? null,
      };
    } else {
      return;
    }

    setSession(updated);
    try {
      const cid = updated.companyId || updated.urlCompanyId || effectiveCompanyId;
      if (cid) {
        localStorage.setItem(`wappy_worker_session_${cid}`, JSON.stringify(updated));
        localStorage.setItem(`wappy_worker_cedula_${cid}`, updated.cedula);
      }
      localStorage.setItem('wappy_worker_session', JSON.stringify(updated));
      localStorage.setItem('wappy_worker_cedula', updated.cedula);
    } catch (e) {}
  }, [effectiveCompanyId, session]);

  const clearSession = useCallback(() => {
    setSession(null);
    try {
      if (effectiveCompanyId) {
        localStorage.removeItem(`wappy_worker_session_${effectiveCompanyId}`);
        localStorage.removeItem(`wappy_worker_cedula_${effectiveCompanyId}`);
      }
      const rawSession = localStorage.getItem('wappy_worker_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (!effectiveCompanyId || parsed?.companyId === effectiveCompanyId || parsed?.urlCompanyId === effectiveCompanyId) {
          localStorage.removeItem('wappy_worker_session');
          localStorage.removeItem('wappy_worker_cedula');
        }
      }
    } catch (e) {}
  }, [effectiveCompanyId]);

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
