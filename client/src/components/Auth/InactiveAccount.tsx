import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '~/hooks/AuthContext';

export default function InactiveAccount() {
    const { t } = useTranslation();
    const { logout } = useAuthContext();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900 text-center p-4">
            <div className="max-w-md space-y-6">
                <div className="text-6xl">⏸️</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('com_auth_account_paused', 'Account Paused')}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    {t('com_auth_account_inactive_desc', 'Your account is currently inactive. This may be due to a pending payment or an administrative action.')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('com_auth_contact_support', 'Please contact support or your administrator to reactivate your account.')}
                </p>
                <button
                    onClick={() => logout()}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                    {t('com_auth_logout', 'Log Out')}
                </button>
            </div>
        </div>
    );
}
