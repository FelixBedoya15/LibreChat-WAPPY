import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, LayoutDashboard } from 'lucide-react';
import Automatizaciones from '~/components/SGSST/Automatizaciones';
import { useAuthContext } from '~/hooks';
import { canAccessTareas } from '~/utils/planAccess';

/**
 * Tareas (antes "Automatizaciones IA" dentro del Centro de Control SST).
 * Sección independiente del menú lateral, ubicada debajo de "Centro de Control SST".
 * Rutas: /tareas (lista) y /tareas?tab=historial (historial de corridas).
 * Acceso: SOLO Administradores y cuentas principales Wappy Pro (ver canAccessTareas).
 * Rutas antiguas (/sgsst/automatizaciones, /sgsst/control?tab=automatizaciones) redirigen aquí.
 */
export default function TareasPage() {
  const { user } = useAuthContext();
  const hasAccess = canAccessTareas(user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabParam = searchParams.get('tab')?.trim() || '';
  const defaultTab: 'list' | 'logs' = ['historial', 'logs', 'reportes'].includes(tabParam)
    ? 'logs'
    : 'list';

  if (!hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-surface-secondary/30 p-6">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-sm p-8">
          <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold text-text-primary">Tareas de agentes IA</h1>
          <p className="text-xs text-text-secondary mt-2">
            Las tareas programadas y autónomas de agentes IA son exclusivas de Administradores y cuentas Wappy Pro.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => navigate('/sgsst/control')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir al Centro de Control
            </button>
            <button
              onClick={() => navigate('/planes')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white"
            >
              Ver planes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Automatizaciones key={defaultTab} defaultTab={defaultTab} />;
}
