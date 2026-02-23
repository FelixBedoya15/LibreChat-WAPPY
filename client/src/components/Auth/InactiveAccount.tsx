import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '~/hooks/AuthContext';

/* ─── Animated Lock SVG ────────────────────────────────────────────── */
const PausedLockSVG = () => (
    <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" fill="none">
        <defs>
            <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
        </defs>
        {/* Lock body */}
        <rect x="30" y="55" width="60" height="45" rx="8" stroke="url(#lockGrad)" strokeWidth="2.5" opacity="0.15" fill="url(#lockGrad)">
            <animate attributeName="opacity" values="0.08;0.2;0.08" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="30" y="55" width="60" height="45" rx="8" stroke="url(#lockGrad)" strokeWidth="2.5" fill="none">
            <animate attributeName="stroke-dasharray" from="0 240" to="240 0" dur="1.5s" fill="freeze" />
        </rect>
        {/* Lock shackle */}
        <path d="M42 55V40C42 29 50 22 60 22C70 22 78 29 78 40V55" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin="0.8s" dur="0.5s" fill="freeze" />
            <animate attributeName="stroke-dasharray" from="0 120" to="120 0" begin="0.8s" dur="0.8s" fill="freeze" />
        </path>
        {/* Keyhole */}
        <circle cx="60" cy="73" r="6" fill="#f59e0b" opacity="0">
            <animate attributeName="opacity" from="0" to="0.8" begin="1.5s" dur="0.3s" fill="freeze" />
            <animate attributeName="r" values="5;7;5" dur="2.5s" begin="2s" repeatCount="indefinite" />
        </circle>
        <rect x="57" y="78" width="6" height="10" rx="2" fill="#f59e0b" opacity="0">
            <animate attributeName="opacity" from="0" to="0.8" begin="1.8s" dur="0.3s" fill="freeze" />
        </rect>
        {/* Warning pulses */}
        <circle cx="60" cy="73" r="20" stroke="#f59e0b" strokeWidth="1" fill="none" opacity="0">
            <animate attributeName="r" values="15;25;15" dur="2s" begin="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.3;0" dur="2s" begin="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="60" cy="73" r="30" stroke="#f97316" strokeWidth="0.8" fill="none" opacity="0">
            <animate attributeName="r" values="25;35;25" dur="2.5s" begin="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.15;0" dur="2.5s" begin="3s" repeatCount="indefinite" />
        </circle>
    </svg>
);

/* ─── Background Particles ─────────────────────────────────────────── */
const InactiveParticles = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg className="absolute h-full w-full">
            <circle cx="18%" cy="22%" r="55" fill="#f59e0b" opacity="0.04">
                <animate attributeName="r" values="45;65;45" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="82%" cy="72%" r="40" fill="#f97316" opacity="0.04">
                <animate attributeName="r" values="30;50;30" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="5%" cy="50%" r="3" fill="#f59e0b" opacity="0.1">
                <animate attributeName="opacity" values="0.05;0.15;0.05" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="92%" cy="30%" r="2" fill="#f97316" opacity="0.08">
                <animate attributeName="opacity" values="0.04;0.12;0.04" dur="5s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

export default function InactiveAccount() {
    const { t } = useTranslation();
    const { logout } = useAuthContext();

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900 text-center p-4">
            <InactiveParticles />
            <div className="relative max-w-md w-full rounded-2xl border border-amber-500/20 bg-white/80 p-8 shadow-xl shadow-amber-500/[0.03] backdrop-blur-sm dark:bg-gray-900/80 space-y-6">
                <PausedLockSVG />
                <h1 className="text-2xl font-bold text-text-primary">{t('com_auth_account_paused', 'Account Paused')}</h1>
                <p className="text-sm leading-relaxed text-text-secondary">
                    {t('com_auth_account_inactive_desc', 'Your account is currently inactive. This may be due to a pending payment or an administrative action.')}
                </p>
                <p className="text-xs text-text-tertiary">
                    {t('com_auth_contact_support', 'Please contact support or your administrator to reactivate your account.')}
                </p>
                <button
                    onClick={() => logout()}
                    className="inline-flex w-full justify-center rounded-xl border border-transparent bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                    {t('com_auth_logout', 'Log Out')}
                </button>
            </div>
        </div>
    );
}
