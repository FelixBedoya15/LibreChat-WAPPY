import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';

interface VitalPublicPortalGuardProps {
  children: React.ReactNode;
}

export default function VitalPublicPortalGuard({ children }: VitalPublicPortalGuardProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [planInfo, setPlanInfo] = useState<{
    planTier: string;
    companyName?: string;
    logo?: string | null;
  } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setChecked(true);
      return;
    }
    let mounted = true;
    fetch(`/api/public-sgsst/company-plan/${companyId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.planTier) {
          setPlanInfo({
            planTier: data.planTier,
            companyName: data.companyName,
            logo: data.logo,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, [companyId]);

  if (checked && planInfo?.planTier === 'vital') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-text-primary flex flex-col">
        <PublicWorkerHeader
          companyId={companyId || ''}
          companyName={planInfo.companyName || 'Huella Biocéntrica'}
          companyLogo={planInfo.logo || null}
          currentModule="perfil_update"
          planTier="vital"
        />

        <main className="flex-1 p-4 sm:p-6 w-full max-w-md mx-auto flex flex-col justify-center">
          <div className="bg-surface-primary dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-border-medium text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-text-primary">
                Módulo Exclusivo de Somos SST
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Tu organización cuenta con el plan <strong>Wappy Vital (Huella Biocéntrica)</strong>, el cual habilita para los trabajadores la autogestión de su <strong>Perfil Sociodemográfico y Condiciones de Salud</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/sgsst-public/perfil-update/${companyId}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Ir a Actualizar Perfil Sociodemográfico</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-sm cursor-pointer"
              >
                <span>Volver al Portal del Trabajador</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
