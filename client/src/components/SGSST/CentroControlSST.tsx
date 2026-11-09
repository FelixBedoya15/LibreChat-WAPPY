import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { 
  Trello, 
  LayoutDashboard,
  Layers,
  Users,
  Brain
} from 'lucide-react';
import KanbanDashboard from '~/components/Kanban/KanbanDashboard';
import MemoriaProceduralPanel from '~/components/SGSST/MemoriaProceduralPanel';
import SubUserManagerModal from '~/components/SGSST/SubUserManagerModal';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { useAuthContext } from '~/hooks';
import { isVitalUser } from '~/utils/planAccess';

// Nota: 'Automatizaciones IA' e 'Historial & Reportes' se movieron a la sección independiente
// "Tareas" (/tareas), ubicada en el menú lateral debajo de "Centro de Control SST".
export type CentroControlTab = 'acpm' | 'memoria';

export default function CentroControlSST() {
  const { user } = useAuthContext();
  const isVital = isVitalUser(user);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSubUsersModal, setShowSubUsersModal] = useState(false);

  // Determine initial tab from URL or query param
  const getInitialTab = (): CentroControlTab => {
    if (isVital) {
      return 'acpm';
    }
    const tabParam = searchParams.get('tab');
    if (tabParam === 'memoria' || tabParam === 'procedural') {
      return 'memoria';
    }
    if (tabParam === 'acpm' || tabParam === 'kanban') {
      return 'acpm';
    }
    return 'acpm';
  };

  // Enlaces antiguos a Automatizaciones / Historial ahora viven en /tareas
  const legacyTab = searchParams.get('tab');
  const legacyTareasRoute =
    legacyTab === 'automatizaciones' || legacyTab === 'ia' || legacyTab === 'agentes'
      ? '/tareas'
      : legacyTab === 'historial' || legacyTab === 'logs'
        ? '/tareas?tab=historial'
        : location.pathname.includes('/automatizaciones')
          ? '/tareas'
          : null;

  const [activeTab, setActiveTab] = useState<CentroControlTab>(getInitialTab);

  // Sync state if URL changes
  useEffect(() => {
    const currentTab = getInitialTab();
    setActiveTab(currentTab);
  }, [location.pathname, searchParams, isVital]);

  const handleTabChange = (tab: CentroControlTab) => {
    if (isVital && tab !== 'acpm') return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (legacyTareasRoute && !isVital) {
    return <Navigate to={legacyTareasRoute} replace={true} />;
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-12">
      {/* Master Top Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-border-medium/40 px-6 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-purple-600 dark:from-teal-400 dark:via-emerald-400 dark:to-purple-400">
              <LayoutDashboard className="w-7 h-7 text-teal-500" />
              Centro de Control SST
            </h1>
          </div>

          {/* Master Tabs Selector con Botones Estilo WAPPY (ExpandableButton) */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <ExpandableButton
              onClick={() => handleTabChange('acpm')}
              variant="teal"
              isActive={activeTab === 'acpm'}
              icon={<Trello className="w-4 h-4" />}
              label="Acciones ACPM"
              title="Acciones ACPM"
            />

            {!isVital && (
              <ExpandableButton
                onClick={() => handleTabChange('memoria')}
                variant="amber"
                isActive={activeTab === 'memoria'}
                icon={<Brain className="w-4 h-4" />}
                label="Memoria Procedural"
                title="Memoria Procedural"
              />
            )}

            {!user?.isSubUser && (
              <ExpandableButton
                onClick={() => setShowSubUsersModal(true)}
                variant="cyan"
                icon={<Users className="w-4 h-4" />}
                label="Sub-Usuarios"
                title="Gestionar Sub-Usuarios"
              />
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'acpm' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-200">
            <KanbanDashboard inline={false} hideMainHeader={true} />
          </div>
        )}

        {!isVital && activeTab === 'memoria' && (
          <div className="flex-1 flex flex-col animate-in fade-in duration-200">
            <MemoriaProceduralPanel />
          </div>
        )}
      </div>

      {/* Sub-users Modal */}
      <SubUserManagerModal
        isOpen={showSubUsersModal}
        onClose={() => setShowSubUsersModal(false)}
      />
    </div>
  );
}
