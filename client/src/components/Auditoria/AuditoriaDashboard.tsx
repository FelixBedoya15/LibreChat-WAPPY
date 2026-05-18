import React from 'react';
import AuditoriaChecklist from '~/components/SGSST/AuditoriaChecklist';
import { ClipboardCheck } from 'lucide-react';

const AuditoriaDashboard = () => {
    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary dark:bg-gray-900">
            <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-text-primary">
                            <ClipboardCheck className="h-8 w-8 text-teal-600" /> Informe de Auditoría
                        </h1>
                        <p className="mt-2 text-text-secondary">
                            Módulo independiente para la generación y gestión de auditorías SST.
                        </p>
                    </div>
                </div>
                
                <AuditoriaChecklist />
            </div>
        </div>
    );
};

export default AuditoriaDashboard;
