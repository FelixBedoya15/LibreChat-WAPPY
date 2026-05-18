import React from 'react';
import InspeccionChecklist from './InspeccionChecklist';
import { Briefcase } from 'lucide-react';

const InspeccionDashboard = () => (
  <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary dark:bg-gray-900">
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-text-primary">
            <Briefcase className="h-8 w-8 text-blue-600" /> Inspección MinTrabajo
          </h1>
          <p className="mt-2 text-text-secondary">
            Acta de Inspección General · Código: IVC-PD-54-F-01 · Versión 1.0 · Ministerio del Trabajo
          </p>
        </div>
      </div>
      <InspeccionChecklist />
    </div>
  </div>
);

export default InspeccionDashboard;
