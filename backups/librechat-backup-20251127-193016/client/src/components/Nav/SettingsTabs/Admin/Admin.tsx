import React from 'react';
import { useLocalize } from '~/hooks';
import UserManagementTable from './UserApprovalTable'; // Keeping filename for now to avoid breaking imports, but content is updated

export default function Admin() {
    const localize = useLocalize();

    return (
        <div className="flex flex-col gap-4 p-4 text-sm text-text-primary">
            <div className="border-b border-border-medium pb-4">
                <h3 className="text-lg font-medium">User Management</h3>
                <p className="text-text-secondary">Manage users, roles, and account statuses.</p>
            </div>
            <UserManagementTable />
        </div>
    );
}
