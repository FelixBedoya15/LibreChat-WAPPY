import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { Building2, AlertTriangle, ChevronRight } from 'lucide-react';
import type { ContextType } from '~/common';
import { isProUser } from '~/utils/planAccess';

import PhaseDetail from './PhaseDetail';
import CompanyInfoModal from './CompanyInfoModal';

const REQUIRED_FIELDS = [
  'companyName',
  'nit',
  'legalRepresentative',
  'workerCount',
  'arl',
  'economicActivity',
  'riskLevel',
  'ciiu',
  'address',
  'city',
  'phone',
  'email',
  'sector',
  'responsibleSST',
  'generalActivities',
] as const;

const HUELLA_BIOCENTRICA_PHASE = {
  id: 'huella_biocentrica',
  title: 'Huella Biocéntrica',
  subtitle: 'Línea Base del Ser Humano & Matriz Bio-IPEVR',
  description:
    'Perfiles de Cargo (Roles), Perfil Sociodemográfico, Informe de Condiciones de Salud, Dictamen de Compatibilidad Cargo-Persona y Matriz Bio-IPEVR.',
};

export default function HuellaBiocentricaDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuthContext();
  const { navVisible, setNavVisible } = useOutletContext<ContextType>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const hasCheckedRef = React.useRef(false);

  // Si es usuario Wappy Pro puro (no Admin ni Vital), redirigir a Somos SST
  useEffect(() => {
    if (user && isProUser(user)) {
      const moduleParam = searchParams.get('module');
      const targetUrl = moduleParam
        ? `/sgsst?hito=hito2&module=${encodeURIComponent(moduleParam)}`
        : '/sgsst?hito=hito2';
      navigate(targetUrl, { replace: true });
    }
  }, [user, navigate, searchParams]);

  // ─── Fetch Company Info ────────────────────────────────────────────────
  useEffect(() => {
    if (!token || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    fetch(`/api/sgsst/company-info?cb=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((info) => {
        setCompanyInfo(info);
        if (info && info.logoBase64) {
          localStorage.setItem('wappy_sst_global_logo', info.logoBase64);
        } else {
          localStorage.removeItem('wappy_sst_global_logo');
        }
        if (!info || Object.keys(info).length === 0) {
          setMissingFields([...REQUIRED_FIELDS]);
          setShowCompanyInfo(true);
          return;
        }
        const missing = REQUIRED_FIELDS.filter((f) => {
          const val = info[f];
          if (typeof val === 'string') {
            const t = val.trim();
            return t === '' || t === 'N/A' || t === 'No registrado';
          }
          return val === undefined || val === null || val === 0;
        });

        setMissingFields(missing);
        if (missing.length > 0) setShowCompanyInfo(true);
      })
      .catch((err) => {
        console.error('[HuellaBiocentricaDashboard] Error checking company info:', err.message);
        hasCheckedRef.current = false;
      });
  }, [token]);

  const handleModalClose = useCallback(() => {
    setShowCompanyInfo(false);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (next.has('modal')) {
          next.delete('modal');
          changed = true;
        }
        if (
          next.get('module') === 'empresas' ||
          next.get('module') === 'empresas_registradas' ||
          next.get('module') === 'company_info'
        ) {
          next.delete('module');
          changed = true;
        }
        return changed ? next : prev;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // ─── Listen to company modal / module navigation events ─────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { module } = (e as CustomEvent).detail || {};
      if (!module) return;
      if (
        module === 'empresas' ||
        module === 'empresas_registradas' ||
        module === 'company_info'
      ) {
        setShowCompanyInfo(true);
        return;
      }
      setSearchParams({ module });
    };
    const openCompanyHandler = () => setShowCompanyInfo(true);
    const closeCompanyHandler = () => handleModalClose();

    window.addEventListener('navigate-sgsst', handler);
    window.addEventListener('open-company-info', openCompanyHandler);
    window.addEventListener('close-company-info', closeCompanyHandler);
    window.addEventListener('close-modal', closeCompanyHandler);
    return () => {
      window.removeEventListener('navigate-sgsst', handler);
      window.removeEventListener('open-company-info', openCompanyHandler);
      window.removeEventListener('close-company-info', closeCompanyHandler);
      window.removeEventListener('close-modal', closeCompanyHandler);
    };
  }, [setSearchParams, handleModalClose]);

  useEffect(() => {
    if (
      searchParams.get('modal') === 'empresas' ||
      searchParams.get('module') === 'empresas' ||
      searchParams.get('module') === 'company_info'
    ) {
      setShowCompanyInfo(true);
    }
  }, [searchParams]);

  const moduleParam = searchParams.get('module') || undefined;

  const companyWidget = (
    <button
      onClick={() => setShowCompanyInfo(true)}
      className="group flex items-center gap-3 bg-surface-secondary border border-border-medium px-4 py-2.5 rounded-2xl hover:bg-surface-hover hover:border-[#10b981]/40 hover:shadow-sm transition-all text-left w-full sm:w-auto"
    >
      <div className="p-2 bg-[#10b981]/10 rounded-xl group-hover:bg-[#10b981]/20 group-hover:scale-105 transition-all">
        <Building2 className="h-4.5 w-4.5 text-[#10b981]" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase font-bold text-text-secondary mb-0.5 tracking-wider">
          Entidad Activa
        </p>
        <p className="text-xs font-bold text-text-primary truncate max-w-[160px]">
          {companyInfo?.companyName || 'Configurar Organización'}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
    </button>
  );

  const missingInfoBanner =
    missingFields.length > 0 ? (
      <div
        onClick={() => setShowCompanyInfo(true)}
        className="animate-in fade-in slide-in-from-top-4 flex cursor-pointer items-center gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 transition-all hover:bg-amber-500/20 hover:shadow-md"
      >
        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-amber-500 animate-pulse" />
        <div className="text-sm">
          <span className="font-bold text-amber-600 dark:text-amber-500 tracking-wide uppercase text-xs block mb-0.5">
            Atención Requerida
          </span>
          <span className="text-text-secondary font-medium">
            Su organización tiene{' '}
            <strong className="text-text-primary">{missingFields.length} campos</strong> pendientes
            por diligenciar. Finalice la configuración para habilitar simulaciones precisas.
          </span>
        </div>
      </div>
    ) : null;

  return (
    <>
      <PhaseDetail
        phase={HUELLA_BIOCENTRICA_PHASE}
        onBack={() => navigate('/c/new')}
        navVisible={navVisible}
        setNavVisible={setNavVisible}
        autoOpenModule={moduleParam}
        hideBackButton={true}
        headerRightWidget={companyWidget}
        topBanner={missingInfoBanner}
      />
      <CompanyInfoModal isOpen={showCompanyInfo} onClose={handleModalClose} />
    </>
  );
}
