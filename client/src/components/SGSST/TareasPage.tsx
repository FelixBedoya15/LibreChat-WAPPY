import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, LayoutDashboard, Sparkles } from 'lucide-react';
import Automatizaciones from '~/components/SGSST/Automatizaciones';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { useAuthContext } from '~/hooks';
import { canAccessTareas } from '~/utils/planAccess';

/**
 * Tareas (antes "Automatizaciones IA" dentro del Centro de Control SST).
 * Sección independiente del menú lateral, ubicada debajo de "Centro de Control SST".
 * Rutas: /tareas (lista), /tareas?tab=plantillas (flujos preestablecidos) y /tareas?tab=historial (historial de corridas + bandeja de certificados).
 * Acceso: SOLO Administradores y cuentas principales Wappy Pro (ver canAccessTareas).
 * Rutas antiguas (/sgsst/automatizaciones, /sgsst/control?tab=automatizaciones) redirigen aquí.
 */
export default function TareasPage() {
  const { user } = useAuthContext();
  const hasAccess = canAccessTareas(user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab')?.trim() || '').toLowerCase();
  const defaultTab: 'list' | 'presets' | 'logs' = ['historial', 'logs', 'reportes', 'bitacora'].includes(
    tabParam,
  )
    ? 'logs'
    : ['presets', 'plantillas', 'flujos'].includes(tabParam)
      ? 'presets'
      : 'list';

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-surface-secondary/30 p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm p-8">
          <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-text-primary">Tareas de agentes IA</h1>
          <p className="text-xs text-text-secondary mt-2">
            Las tareas programadas y autónomas de agentes IA son exclusivas de Administradores y cuentas Wappy Pro.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <ExpandableButton
              type="button"
              variant="neutral"
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Ir al Centro de Control"
              onClick={() => navigate('/sgsst/control')}
            />
            <ExpandableButton
              type="button"
              variant="teal"
              icon={<Sparkles className="w-4 h-4" />}
              label="Ver Planes WAPPY Pro"
              onClick={() => navigate('/planes')}
            />
          </div>
        </div>
      </div>
    );
  }

  return <Automatizaciones key={defaultTab} defaultTab={defaultTab} />;
}
