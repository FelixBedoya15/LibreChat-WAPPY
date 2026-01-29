import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';

export default function BulkUpdateDatesModal({ isOpen, onClose, userIds, onSuccess }) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [dates, setDates] = useState({
        activeAt: '',
        inactiveAt: '',
    });

    const handleChange = (e) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                userIds,
                activeAt: dates.activeAt || null,
                inactiveAt: dates.inactiveAt || null
            };

            // If empty string, send null to clear
            if (dates.activeAt === '') delete payload.activeAt;
            if (dates.inactiveAt === '') delete payload.inactiveAt;

            // However, typical bulk update UI: 
            // - If user leaves blank, maybe they don't want to update that field?
            // - Or do they want to clear it?
            // Let's assume if it is set, update it. If not, ignore.
            // But we need a way to clear. 
            // For now, let's just send what is provided.

            const finalPayload = { userIds };
            if (dates.activeAt !== '') finalPayload.activeAt = dates.activeAt;
            if (dates.inactiveAt !== '') finalPayload.inactiveAt = dates.inactiveAt;

            if (Object.keys(finalPayload).length === 1) {
                // Only userIds present
                showToast({ message: 'Please select at least one date to update', status: 'warning' });
                return;
            }

            await axios.post('/api/admin/users/bulk-update', finalPayload);
            showToast({ message: localize('com_ui_user_updated_success') || 'Users updated successfully', status: 'success' });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating users:', error);
            showToast({ message: error.response?.data?.message || localize('com_ui_user_update_error') || 'Error updating users', status: 'error' });
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
                                    Bulk Update Dates
                                </DialogTitle>
                                <p className="text-sm text-gray-500 mt-2">
                                    Updating {userIds.length} users. Leave fields blank to keep existing values.
                                </p>
                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Active Date</label>
                                        <input
                                            type="date"
                                            name="activeAt"
                                            value={dates.activeAt}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{localize('com_ui_inactivation_date')}</label>
                                        <input
                                            type="date"
                                            name="inactiveAt"
                                            value={dates.inactiveAt}
                                            onChange={handleChange}
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
