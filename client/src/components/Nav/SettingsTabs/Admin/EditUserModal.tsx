import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { formatDateForInput } from '~/utils/dateHelpers';
import axios from 'axios';

export default function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [formData, setFormData] = useState({
        userId: '',
        name: '',
        username: '',
        email: '',
        role: 'USER',
        accountStatus: 'active',
        password: '', // Optional
        inactiveAt: '',
        activeAt: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                userId: user._id,
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                role: user.role || 'USER',
                accountStatus: user.accountStatus || 'active',
                password: '',
                inactiveAt: formatDateForInput(user.inactiveAt),
                activeAt: formatDateForInput(user.activeAt),
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Auto-update status based on dates
    useEffect(() => {
        const parseLocal = (s) => {
            if (!s) return null;
            const [y, m, d] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
        };
        const inactiveAt = parseLocal(formData.inactiveAt);
        const nowStartOfDay = new Date();
        nowStartOfDay.setHours(0, 0, 0, 0);

        if (inactiveAt && nowStartOfDay >= inactiveAt && formData.accountStatus !== 'inactive') {
            setFormData(prev => ({ ...prev, accountStatus: 'inactive' }));
        }
    }, [formData.inactiveAt, formData.activeAt]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.password) delete payload.password; // Only send if changed

            await axios.post('/api/admin/users/update', payload);
            showToast({ message: localize('com_ui_user_updated_success') || 'User updated successfully', status: 'success' });
            onUserUpdated();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            showToast({ message: error.response?.data?.message || localize('com_ui_user_update_error') || 'Error updating user', status: 'error' });
        }
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                    {localize('com_ui_edit_user')}
                                </DialogTitle>
                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_name')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_username')}</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_email')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_role')}</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="USER">User</option>
                                            <option value="USER_PLUS">User Plus</option>
                                            <option value="USER_PRO">User Pro</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_status')}</label>
                                        <select
                                            name="accountStatus"
                                            value={formData.accountStatus}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="pending">Pending</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {(() => {
                                            const now = new Date();
                                            // Ensure we are comparing local dates correctly
                                            const parseLocal = (s) => {
                                                if (!s) return null;
                                                const [y, m, d] = s.split('-').map(Number);
                                                return new Date(y, m - 1, d);
                                            };
                                            const inactiveAt = parseLocal(formData.inactiveAt);
                                            const activeAt = parseLocal(formData.activeAt);
                                            const nowStartOfDay = new Date();
                                            nowStartOfDay.setHours(0, 0, 0, 0);

                                            const isExpired = inactiveAt && nowStartOfDay >= inactiveAt;
                                            const isNotStarted = activeAt && nowStartOfDay < activeAt;

                                            // Formatting helper that won't shift timezone
                                            const formatDate = (s) => {
                                                if (!s) return '';
                                                const [y, m, d] = s.split('-');
                                                return `${d}/${m}/${y}`;
                                            };

                                            if (isExpired && formData.accountStatus === 'active') {
                                                return <p className="text-red-500 text-xs mt-1">{localize('com_ui_account_status_active_but_expired', { '0': formatDate(formData.inactiveAt) })}</p>;
                                            }
                                            if (isNotStarted) {
                                                return <p className="text-yellow-600 text-xs mt-1">{localize('com_ui_account_status_active_but_pending', { '0': formatDate(formData.activeAt) })}</p>;
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_active_date')}</label>
                                        <input
                                            type="date"
                                            name="activeAt"
                                            value={formData.activeAt}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formData.activeAt
                                                ? localize('com_ui_account_not_yet_active') + ' ' + formData.activeAt.split('-').reverse().join('/')
                                                : localize('com_ui_account_is_active_immediately')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_inactivation_date')}</label>
                                        <input
                                            type="date"
                                            name="inactiveAt"
                                            value={formData.inactiveAt}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formData.inactiveAt
                                                ? localize('com_ui_account_will_deactivate') + ' ' + formData.inactiveAt.split('-').reverse().join('/')
                                                : localize('com_ui_account_active_indefinitely')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_new_password')}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder={localize('com_ui_leave_blank_password')}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                            onClick={onClose}
                                        >
                                            {localize('com_ui_cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        >
                                            {localize('com_ui_save_changes')}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
