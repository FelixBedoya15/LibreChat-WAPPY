import React, { useState } from 'react';
import { useLocalize } from '~/hooks';
import UserManagementTable from './UserApprovalTable';
import RolePermissionsTable from './RolePermissionsTable';
import { cn } from '~/utils';

export default function Admin() {
    const localize = useLocalize();
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="flex flex-col gap-4 p-4 text-sm text-text-primary">
            <div className="border-b border-border-medium pb-4">
                <h3 className="text-lg font-medium">{localize('com_ui_admin_panel')}</h3>
                <p className="text-text-secondary">{localize('com_ui_admin_panel_description')}</p>
            </div>

            <div className="flex space-x-4 border-b border-border-medium items-center justify-between">
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
                </div>
            </div>

            {activeTab === 'users' ? (
                <UserManagementTable />
            ) : (
                <RolePermissionsTable />
            )}
        </div>
    );
}
