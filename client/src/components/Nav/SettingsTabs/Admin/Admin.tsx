import React, { useState } from 'react';
import { useLocalize } from '~/hooks';
import UserManagementTable from './UserApprovalTable';
import RolePermissionsTable from './RolePermissionsTable';
import SubscriptionPlansTable from './SubscriptionPlansTable';
import PromoCodesTable from './PromoCodesTable';
import PaymentAnalyticsDashboard from './PaymentAnalyticsDashboard';
import PushTestPanel from './PushTestPanel';
import MarketingPortal from './MarketingPortal';
import { cn } from '~/utils';
import { 
    Users, 
    ShieldCheck, 
    CreditCard, 
    Tag, 
    BarChart3, 
    Bell, 
    Mail, 
    Sparkles,
    SlidersHorizontal,
    Layers
} from 'lucide-react';

export default function Admin() {
    const localize = useLocalize();
    const [activeTab, setActiveTab] = useState('users');

    // Listen for custom navigation events
    React.useEffect(() => {
        const handleSettingsNavigation = (e: CustomEvent) => {
            if (e.detail?.subTab) {
                setActiveTab(e.detail.subTab);
            }
        };
        window.addEventListener('switch-settings-tab', handleSettingsNavigation as EventListener);
        return () => {
            window.removeEventListener('switch-settings-tab', handleSettingsNavigation as EventListener);
        };
    }, []);

    const tabs = [
        { id: 'users', label: localize('com_ui_user_management') || 'Gestión de Usuarios', icon: Users, color: 'text-teal-600 dark:text-teal-400' },
        { id: 'roles', label: localize('com_ui_role_permissions') || 'Roles y Permisos', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400' },
        { id: 'plans', label: 'Planes y Suscripciones', icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400' },
        { id: 'promos', label: 'Códigos Promo', icon: Tag, color: 'text-indigo-600 dark:text-indigo-400' },
        { id: 'analytics', label: 'Analítica Pagos', icon: BarChart3, color: 'text-purple-600 dark:text-purple-400' },
        { id: 'push-test', label: 'Notificaciones Push', icon: Bell, color: 'text-rose-600 dark:text-rose-400' },
        { id: 'marketing', label: 'Mercadeo por Correo', icon: Mail, color: 'text-amber-600 dark:text-amber-400' },
    ];

    const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

    return (
        <div className="flex flex-col gap-5 text-sm text-text-primary w-full">
            {/* Header Somos SST / WAPPY */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
                {/* Background decorative glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5" />
                <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />

                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/25">
                            <SlidersHorizontal className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">
                                    {localize('com_ui_admin_panel') || 'Panel de Administración'}
                                </h3>
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-500/20 dark:bg-teal-950/40 dark:text-teal-300">
                                    <Sparkles className="h-3 w-3" />
                                    Somos SST
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                {localize('com_ui_admin_panel_description') || 'Gestión centralizada de usuarios, planes, accesos, roles y analíticas de WAPPY.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">Módulo actual:</span>
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200/60 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                            <currentTabObj.icon className={cn("h-3.5 w-3.5", currentTabObj.color)} />
                            <span>{currentTabObj.label}</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar cápsula flotante WAPPY (SGSSTToolbar style) */}
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-zinc-800/80">
                    <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-700/80 shadow-inner">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer",
                                        isActive
                                            ? "bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 font-bold shadow-xs border border-teal-500/30"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-900/40"
                                    )}
                                >
                                    <IconComponent className={cn("h-4 w-4", isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-zinc-500")} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Contenedor Principal de la Vista */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 overflow-hidden">
                {activeTab === 'users' ? (
                    <UserManagementTable />
                ) : activeTab === 'roles' ? (
                    <RolePermissionsTable />
                ) : activeTab === 'plans' ? (
                    <SubscriptionPlansTable />
                ) : activeTab === 'analytics' ? (
                    <PaymentAnalyticsDashboard />
                ) : activeTab === 'push-test' ? (
                    <PushTestPanel />
                ) : activeTab === 'marketing' ? (
                    <MarketingPortal />
                ) : (
                    <PromoCodesTable />
                )}
            </div>
        </div>
    );
}
