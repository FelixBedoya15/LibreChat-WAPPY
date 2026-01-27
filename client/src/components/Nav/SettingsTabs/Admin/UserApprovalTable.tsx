import React, { useState, useEffect } from 'react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

export default function UserManagementTable() {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast({ message: 'Error fetching users', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.post('/api/admin/users/delete', { userId });
            showToast({ message: 'User deleted successfully', status: 'success' });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast({ message: error.response?.data?.message || 'Error deleting user', status: 'error' });
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleExportUsers = () => {
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [
                ['Name', 'Email', 'Role', 'Status'],
                ...users.map((u) => [u.name || u.username, u.email, u.role, u.accountStatus]),
            ]
                .map((e) => e.join(','))
                .join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'users.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast({ message: localize('com_ui_export_success') || 'Users exported successfully', status: 'success' });
    };

    const handleImportUsers = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const rows = text.split('\n').slice(1); // Skip header

            let successCount = 0;
            let errorCount = 0;

            showToast({ message: localize('com_ui_processing') || 'Processing...', status: 'info' });

            for (const row of rows) {
                if (!row.trim()) continue;
                const [name, email, role, status] = row.split(',').map((cell) => cell.trim());

                // Basic validation
                if (!email) continue;

                try {
                    // Using default password for bulk import or generating random one could be better, 
                    // but for now let's assume we set a default one 'Password123!' or similar, 
                    // attempting to use existing create endpoint
                    const userData = {
                        name: name || email.split('@')[0],
                        username: email.split('@')[0],
                        email,
                        password: 'ChangeMe123!', // Default password
                        role: role && ['USER', 'ADMIN', 'USER_PRO', 'USER_PLUS'].includes(role.toUpperCase()) ? role.toUpperCase() : 'USER',
                        accountStatus: status && ['active', 'inactive', 'pending'].includes(status.toLowerCase()) ? status.toLowerCase() : 'active'
                    };

                    await axios.post('/api/admin/users/create', userData);
                    successCount++;
                } catch (error) {
                    console.error(`Error importing user ${email}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                showToast({ message: `${localize('com_ui_import_success')}: ${successCount}`, status: 'success' });
                fetchUsers();
            }
            if (errorCount > 0) {
                showToast({ message: `${localize('com_ui_import_error')}: ${errorCount}`, status: 'warning' });
            }
        };
        reader.readAsText(file);
        // Reset file input
        event.target.value = '';
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="import-users-file"
                        onChange={handleImportUsers}
                    />
                    <label
                        htmlFor="import-users-file"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                    >
                        {localize('com_ui_import_users')}
                    </label>
                    <button
                        onClick={handleExportUsers}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        {localize('com_ui_export_users')}
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        {localize('com_ui_create_user')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-light">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-surface-secondary">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_email')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface-primary divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{user.name || user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                                            user.accountStatus === 'inactive' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {user.accountStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user._id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={fetchUsers}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={selectedUser}
                onUserUpdated={fetchUsers}
            />
        </div>
    );
}
