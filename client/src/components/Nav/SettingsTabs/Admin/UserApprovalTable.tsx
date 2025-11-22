import React, { useState, useEffect } from 'react';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import { useToastContext } from '~/Providers/ToastContext';
import axios from 'axios';

export default function UserApprovalTable() {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users/pending');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching pending users:', error);
            showToast({ message: 'Error fetching pending users', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleApprove = async (userId) => {
        try {
            await axios.post('/api/admin/users/approve', { userId });
            showToast({ message: 'User approved successfully', status: 'success' });
            fetchPendingUsers(); // Refresh list
        } catch (error) {
            console.error('Error approving user:', error);
            showToast({ message: 'Error approving user', status: 'error' });
        }
    };

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (users.length === 0) {
        return <div className="p-4">No pending users found.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name || user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => handleApprove(user._id)}
                                    className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-sm"
                                >
                                    Approve
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
