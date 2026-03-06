import React, { useState } from 'react';
import { useLocalize } from '~/hooks';
import UserManagementTable from './UserApprovalTable';
import RolePermissionsTable from './RolePermissionsTable';
import SubscriptionPlansTable from './SubscriptionPlansTable';
import PromoCodesTable from './PromoCodesTable';
import { cn } from '~/utils';

export default function Admin() {
    const localize = useLocalize();
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="flex flex-col gap-4 text-sm text-text-primary">
            {/* Tarjeta de Encabezado y Navegación */}
            <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
                <div className="mb-4">
                    <h3 className="text-lg font-medium">{localize('com_ui_admin_panel')}</h3>
                    <p className="text-text-secondary">{localize('com_ui_admin_panel_description')}</p>
                </div>

                <div className="flex space-x-4 items-center justify-between">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={cn(
                                "pb-2 px-1 text-sm font-medium transition-colors duration-200",
                                activeTab === 'users'
                                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {localize('com_ui_user_management')}
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={cn(
                                "pb-2 px-1 text-sm font-medium transition-colors duration-200",
                                activeTab === 'roles'
                                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {localize('com_ui_role_permissions')}
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={cn(
                                "pb-2 px-1 text-sm font-medium transition-colors duration-200",
                                activeTab === 'plans'
                                    ? "border-b-2 border-green-500 text-green-600 dark:text-green-400"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            Planes y Suscripciones
                        </button>
                        <button
                            onClick={() => setActiveTab('promos')}
                            className={cn(
                                "pb-2 px-1 text-sm font-medium transition-colors duration-200",
                                activeTab === 'promos'
                                    ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            Códigos Promo
                        </button>
                    </div>
                </div>
            </div>

            {/* Tarjeta de Contenido de la Tabla */}
            <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700 overflow-hidden">
                {activeTab === 'users' ? (
                    <UserManagementTable />
                ) : activeTab === 'roles' ? (
                    <RolePermissionsTable />
                ) : activeTab === 'plans' ? (
                    <SubscriptionPlansTable />
                ) : (
                    <PromoCodesTable />
                )}
            </div>
        </div>
    );
}
