import React, { useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { SettingsTabValues, SystemRoles } from 'librechat-data-provider';
import { 
  User, 
  Bell, 
  SlidersHorizontal, 
  Database, 
  MessageSquare, 
  Terminal, 
  Volume2, 
  Sparkles, 
  TicketCheck, 
  ShieldCheck, 
  Megaphone, 
  Coins, 
  X,
  Bot,
  Award,
  Loader2
} from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useMediaQuery } from '@librechat/client';
import type { TDialogProps } from '~/common';
import {
  General,
  Chat,
  Commands,
  Speech,
  Personalization,
  Data,
  Balance,
  Account,
  Admin,
  Ads,
} from './SettingsTabs';
import NotificationsPage from '~/components/Notifications/NotificationsPage';
import TicketManagement from '~/components/Tickets/TicketManagement';
import { useAuthContext } from '~/hooks/AuthContext';
import usePersonalizationAccess from '~/hooks/usePersonalizationAccess';
import { useLocalize, TranslationKeys } from '~/hooks';
import useAmbassadorAccess from '~/hooks/useAmbassadorAccess';
import { useGetStartupConfig } from '~/data-provider';
import { cn } from '~/utils';

const TenshiAdminPanel = lazy(() => import('~/components/Tenshi/TenshiAdminPanel'));
const AmbassadorDashboard = lazy(() => import('~/components/Ambassadors/AmbassadorDashboard'));

const SECTIONS: Record<string, { label: string }> = {
  account: { label: 'Cuenta & Perfil' },
  preferences: { label: 'Preferencias & Chat' },
  support: { label: 'Gestión & Soporte' },
  admin: { label: 'Administración WAPPY' },
};

export default function Settings({ open, onOpenChange, activeTab: initialTab }: TDialogProps & { activeTab?: SettingsTabValues | string }) {
  const isSmallScreen = useMediaQuery('(max-width: 767px)');
  const { data: startupConfig } = useGetStartupConfig();
  const { user } = useAuthContext();
  const { hasAmbassadorAccess } = useAmbassadorAccess();
  const localize = useLocalize();
  const [activeTab, setActiveTab] = useState<SettingsTabValues | string>(initialTab || SettingsTabValues.ACCOUNT);
  const [targetTicketId, setTargetTicketId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab || SettingsTabValues.ACCOUNT);
    }
  }, [open, initialTab]);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { hasAnyPersonalizationFeature, hasMemoryOptOut } = usePersonalizationAccess();

  // Listen for custom navigation events from child components
  useEffect(() => {
    const handleSettingsNavigation = (e: CustomEvent) => {
      if (e.detail?.mainTab) {
        setActiveTab(e.detail.mainTab);
      }
      if (e.detail?.ticketId) {
        setTargetTicketId(e.detail.ticketId);
      } else {
        setTargetTicketId(undefined);
      }
    };
    // Listen for programmatic open to jump to notifications
    const handleOpenSettings = () => {
      // no-op: settings is already open when this fires from notification click
    };
    window.addEventListener('switch-settings-tab', handleSettingsNavigation as EventListener);
    window.addEventListener('open-settings', handleOpenSettings as EventListener);
    return () => {
      window.removeEventListener('switch-settings-tab', handleSettingsNavigation as EventListener);
      window.removeEventListener('open-settings', handleOpenSettings as EventListener);
    };
  }, []);

  const settingsTabs = useMemo(() => {
    const isAdmin = user?.role === SystemRoles.ADMIN;
    return [
      {
        value: SettingsTabValues.ACCOUNT,
        icon: User,
        label: 'com_nav_setting_account' as TranslationKeys,
        section: 'account' as const,
      },
      {
        value: 'notifications',
        icon: Bell,
        label: 'Notificaciones' as TranslationKeys,
        section: 'account' as const,
      },
      {
        value: SettingsTabValues.GENERAL,
        icon: SlidersHorizontal,
        label: 'com_nav_setting_general' as TranslationKeys,
        section: 'preferences' as const,
      },
      {
        value: SettingsTabValues.DATA,
        icon: Database,
        label: 'com_nav_setting_data' as TranslationKeys,
        section: 'preferences' as const,
      },
      ...(startupConfig?.balance?.enabled
        ? [
            {
              value: SettingsTabValues.BALANCE,
              icon: Coins,
              label: 'com_nav_setting_balance' as TranslationKeys,
              section: 'preferences' as const,
            },
          ]
        : []),
      ...(isAdmin
        ? [
            {
              value: SettingsTabValues.CHAT,
              icon: MessageSquare,
              label: 'com_nav_setting_chat' as TranslationKeys,
              section: 'preferences' as const,
            },
            {
              value: SettingsTabValues.COMMANDS,
              icon: Terminal,
              label: 'com_nav_commands' as TranslationKeys,
              section: 'preferences' as const,
            },
            {
              value: SettingsTabValues.SPEECH,
              icon: Volume2,
              label: 'com_nav_setting_speech' as TranslationKeys,
              section: 'preferences' as const,
            },
            ...(hasAnyPersonalizationFeature
              ? [
                  {
                    value: SettingsTabValues.PERSONALIZATION,
                    icon: Sparkles,
                    label: 'com_nav_setting_personalization' as TranslationKeys,
                    section: 'preferences' as const,
                  },
                ]
              : []),
            {
              value: 'tickets',
              icon: TicketCheck,
              label: 'Tickets PQRS' as TranslationKeys,
              section: 'support' as const,
            },
            {
              value: SettingsTabValues.ADMIN,
              icon: ShieldCheck,
              label: 'Admin' as TranslationKeys,
              section: 'admin' as const,
              badge: 'Staff',
            },
            {
              value: 'ads',
              icon: Megaphone,
              label: 'Ads' as TranslationKeys,
              section: 'admin' as const,
            },
            {
              value: 'tenshi',
              icon: Bot,
              label: 'Configurar Tenshi' as TranslationKeys,
              section: 'admin' as const,
            },
          ]
        : []),
      ...((isAdmin || hasAmbassadorAccess)
        ? [
            {
              value: 'metricas',
              icon: Award,
              label: 'Métricas & Embajadores' as TranslationKeys,
              section: 'admin' as const,
            },
          ]
        : []),
    ];
  }, [user?.role, startupConfig?.balance?.enabled, hasAnyPersonalizationFeature, hasAmbassadorAccess]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tabs = settingsTabs.map((t) => t.value);
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
        break;
      case 'Home':
        event.preventDefault();
        setActiveTab(tabs[0]);
        break;
      case 'End':
        event.preventDefault();
        setActiveTab(tabs[tabs.length - 1]);
        break;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as SettingsTabValues);
  };

  const getTabHeaderInfo = () => {
    switch (activeTab) {
      case SettingsTabValues.ADMIN:
        return {
          icon: ShieldCheck,
          title: 'Panel de Administración',
          subtitle: 'Gestión de usuarios, planes, roles, anuncios y analítica global',
        };
      case 'tickets':
        return {
          icon: TicketCheck,
          title: 'Tickets y Soporte PQRS',
          subtitle: 'Atención de solicitudes, estados de casos y respuestas a usuarios',
        };
      case 'notifications':
        return {
          icon: Bell,
          title: 'Notificaciones del Sistema',
          subtitle: 'Historial de avisos, alertas de IA y comunicados importantes',
        };
      case SettingsTabValues.ACCOUNT:
        return {
          icon: User,
          title: 'Mi Cuenta y Perfil',
          subtitle: 'Datos personales, credenciales, conexiones e integraciones',
        };
      case SettingsTabValues.DATA:
        return {
          icon: Database,
          title: 'Controles de Datos',
          subtitle: 'Exportación, copias de seguridad y privacidad de conversaciones',
        };
      case SettingsTabValues.CHAT:
        return {
          icon: MessageSquare,
          title: 'Configuración del Chat',
          subtitle: 'Parámetros de conversación, historial y comportamiento de mensajes',
        };
      case SettingsTabValues.COMMANDS:
        return {
          icon: Terminal,
          title: 'Comandos del Sistema',
          subtitle: 'Atajos y configuraciones de comandos rápidos de IA',
        };
      case SettingsTabValues.SPEECH:
        return {
          icon: Volume2,
          title: 'Voz y Habla',
          subtitle: 'Configuración de síntesis de voz, reconocimiento y audio',
        };
      case SettingsTabValues.PERSONALIZATION:
        return {
          icon: Sparkles,
          title: 'Personalización de la IA',
          subtitle: 'Preferencias de memoria, tono y comportamiento adaptativo',
        };
      case 'ads':
        return {
          icon: Megaphone,
          title: 'Gestión de Anuncios (Ads)',
          subtitle: 'Publicación de banners publicitarios y comunicados para usuarios',
        };
      case 'tenshi':
        return {
          icon: Bot,
          title: 'Configuración de Tenshi',
          subtitle: 'Personalización de agente de voz, modelo IA, prompts y habilidades',
        };
      case 'metricas':
        return {
          icon: Award,
          title: 'Métricas & Embajadores',
          subtitle: 'Estadísticas de referidos, comisiones, conversiones y red WAPPY',
        };
      default:
        return {
          icon: SlidersHorizontal,
          title: localize('com_nav_settings') || 'Configuración',
          subtitle: 'Preferencias de cuenta, personalización y herramientas del sistema',
        };
    }
  };

  const headerInfo = getTabHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <Transition appear show={open}>
      <Dialog as="div" className="relative z-50" onClose={onOpenChange}>
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity" aria-hidden="true" />
        </TransitionChild>

        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center p-3 sm:p-5">
            <DialogPanel
              className={cn(
                'overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex flex-col',
                activeTab === SettingsTabValues.ADMIN || activeTab === 'tickets' || activeTab === 'metricas' || activeTab === 'tenshi'
                  ? 'w-[98vw] max-w-[1440px] h-[92vh] max-h-[950px] min-h-[580px]'
                  : 'w-[96vw] max-w-[1060px] h-[88vh] max-h-[850px] min-h-[520px]',
              )}
            >
              {/* Header con estilo Somos SST / WAPPY */}
              <DialogTitle
                className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-sm shrink-0"
                as="div"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                    <HeaderIcon size={20} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                      {headerInfo.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                      {headerInfo.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-2xs shrink-0"
                  onClick={() => onOpenChange(false)}
                  title={localize('com_ui_close_settings')}
                >
                  <X size={18} />
                  <span className="sr-only">{localize('com_ui_close_settings')}</span>
                </button>
              </DialogTitle>

              {/* Panel Central con Sidebar Categorizado y Contenido */}
              <div className="overflow-hidden p-4 sm:p-5 transition-all duration-300 flex-1 min-h-0 flex flex-col">
                <Tabs.Root
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full flex-1 min-h-0"
                  orientation="vertical"
                >
                  {/* Lateral Sidebar */}
                  <Tabs.List
                    aria-label="Settings"
                    className={cn(
                      'shrink-0 overflow-auto',
                      isSmallScreen
                        ? 'flex flex-row gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-x-auto w-full shrink-0 no-scrollbar'
                        : 'w-64 shrink-0 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 p-2.5 flex flex-col gap-1 shadow-xs sticky top-0 max-h-full overflow-y-auto scrollbar-thin',
                    )}
                    onKeyDown={handleKeyDown}
                  >
                    {settingsTabs.map(({ value, icon: Icon, label, section, badge }, index) => {
                      const isFirstOfSection = !isSmallScreen && (index === 0 || settingsTabs[index - 1].section !== section);
                      const isActive = activeTab === value;

                      return (
                        <React.Fragment key={value}>
                          {isFirstOfSection && (
                            <div
                              className={cn(
                                'px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5 select-none',
                                index > 0
                                  ? 'pt-3 pb-1 border-t border-slate-200/60 dark:border-zinc-800/60 mt-1.5'
                                  : 'pt-1 pb-1',
                              )}
                            >
                              {SECTIONS[section]?.label}
                            </div>
                          )}
                          <Tabs.Trigger
                            value={value}
                            ref={(el) => (tabRefs.current[value] = el)}
                            className={cn(
                              'group relative flex items-center gap-2.5 rounded-xl transition-all duration-200 ease-in-out cursor-pointer active:scale-[0.98]',
                              isSmallScreen
                                ? cn(
                                    'flex-none px-3 py-2 text-xs font-semibold whitespace-nowrap',
                                    isActive
                                      ? 'bg-teal-600 text-white font-bold shadow-sm shadow-teal-600/30'
                                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60 hover:text-slate-900 dark:hover:text-zinc-100',
                                  )
                                : cn(
                                    'w-full px-2.5 py-2 text-xs font-semibold text-left',
                                    isActive
                                      ? 'bg-teal-50/90 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold border border-teal-500/30 shadow-xs'
                                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/90 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/60',
                                  ),
                            )}
                          >
                            <div
                              className={cn(
                                'rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
                                isSmallScreen
                                  ? 'w-5 h-5'
                                  : cn(
                                      'w-7 h-7',
                                      isActive
                                        ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm shadow-teal-600/30'
                                        : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200/70 dark:border-zinc-700/60 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/40 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:border-teal-300/40',
                                    ),
                              )}
                            >
                              <Icon
                                size={isSmallScreen ? 14 : 15}
                                className={cn('stroke-[2.2]', isSmallScreen && isActive ? 'text-white' : '')}
                              />
                            </div>
                            <span className="truncate">{localize(label as TranslationKeys)}</span>
                            {!isSmallScreen && badge && (
                              <span
                                className={cn(
                                  'ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0',
                                  isActive
                                    ? 'bg-teal-600 text-white border-transparent'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/40',
                                )}
                              >
                                {badge}
                              </span>
                            )}
                            {!isSmallScreen && isActive && !badge && (
                              <div className="ml-auto w-1.5 h-3.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0 animate-in fade-in zoom-in-50 duration-200" />
                            )}
                          </Tabs.Trigger>
                        </React.Fragment>
                      );
                    })}
                  </Tabs.List>

                  {/* Right Content Panel */}
                  <div
                    className={cn(
                      'flex-1 min-w-0 bg-white/70 dark:bg-zinc-900/40 rounded-2xl border border-slate-200/70 dark:border-zinc-800/80 p-4 sm:p-6 overflow-y-auto max-h-full shadow-xs transition-all duration-300',
                      activeTab === SettingsTabValues.ADMIN || activeTab === 'metricas' || activeTab === 'tenshi' ? 'w-full' : '',
                    )}
                  >
                    <Tabs.Content value={SettingsTabValues.GENERAL} tabIndex={-1} className="outline-none">
                      <General />
                    </Tabs.Content>
                    <Tabs.Content value={SettingsTabValues.CHAT} tabIndex={-1} className="outline-none">
                      <Chat />
                    </Tabs.Content>
                    <Tabs.Content value={SettingsTabValues.COMMANDS} tabIndex={-1} className="outline-none">
                      <Commands />
                    </Tabs.Content>
                    <Tabs.Content value={SettingsTabValues.SPEECH} tabIndex={-1} className="outline-none">
                      <Speech />
                    </Tabs.Content>
                    {hasAnyPersonalizationFeature && (
                      <Tabs.Content value={SettingsTabValues.PERSONALIZATION} tabIndex={-1} className="outline-none">
                        <Personalization
                          hasMemoryOptOut={hasMemoryOptOut}
                          hasAnyPersonalizationFeature={hasAnyPersonalizationFeature}
                        />
                      </Tabs.Content>
                    )}
                    <Tabs.Content value={SettingsTabValues.DATA} tabIndex={-1} className="outline-none">
                      <Data />
                    </Tabs.Content>
                    {startupConfig?.balance?.enabled && (
                      <Tabs.Content value={SettingsTabValues.BALANCE} tabIndex={-1} className="outline-none">
                        <Balance />
                      </Tabs.Content>
                    )}
                    <Tabs.Content value={SettingsTabValues.ACCOUNT} tabIndex={-1} className="outline-none">
                      <Account />
                    </Tabs.Content>
                    {user?.role === SystemRoles.ADMIN && (
                      <Tabs.Content value={SettingsTabValues.ADMIN} tabIndex={-1} className="outline-none">
                        <Admin />
                      </Tabs.Content>
                    )}
                    {user?.role === SystemRoles.ADMIN && (
                      <Tabs.Content value={'ads'} tabIndex={-1} className="outline-none">
                        <Ads />
                      </Tabs.Content>
                    )}
                    {user?.role === SystemRoles.ADMIN && (
                      <Tabs.Content value={'tenshi'} tabIndex={-1} className="outline-none">
                        <Suspense fallback={<div className="flex h-64 items-center justify-center gap-2 text-text-secondary"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /><span>Cargando configuración de Tenshi...</span></div>}>
                          <TenshiAdminPanel isEmbedded={true} />
                        </Suspense>
                      </Tabs.Content>
                    )}
                    {(user?.role === SystemRoles.ADMIN || hasAmbassadorAccess) && (
                      <Tabs.Content value={'metricas'} tabIndex={-1} className="outline-none">
                        <Suspense fallback={<div className="flex h-64 items-center justify-center gap-2 text-text-secondary"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /><span>Cargando métricas de embajadores...</span></div>}>
                          <AmbassadorDashboard isEmbedded={true} />
                        </Suspense>
                      </Tabs.Content>
                    )}
                    <Tabs.Content value={'notifications'} tabIndex={-1} className="outline-none">
                      <NotificationsPage />
                    </Tabs.Content>
                    <Tabs.Content value={'tickets'} tabIndex={-1} className="outline-none">
                      <TicketManagement initialTicketId={targetTicketId} />
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </div>
            </DialogPanel>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}
