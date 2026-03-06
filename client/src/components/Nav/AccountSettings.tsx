import { useState, memo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import * as Select from '@ariakit/react/select';
import { FileText, LogOut, BookOpen, Shield, Newspaper, CreditCard, UserCircle, Bot } from 'lucide-react';
import { GearIcon, DropdownMenuSeparator, Avatar } from '@librechat/client';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import FilesView from '~/components/Chat/Input/Files/FilesView';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import Settings from './Settings';
import store from '~/store';
import axios from 'axios';
import NotificationPanel from '~/components/Notifications/NotificationPanel';

function AccountSettings() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated && startupConfig?.balance?.enabled,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | undefined>(undefined);
  const [showFiles, setShowFiles] = useRecoilState(store.showFiles);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Poll unread notifications every 30 seconds
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data.count || 0);
    } catch (e) {
      // Silent fail
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    const handleOpenSettings = () => setShowSettings(true);
    const handleSwitchTab = (e: any) => {
      if (e.detail?.mainTab) setActiveSettingsTab(e.detail.mainTab);
    };

    window.addEventListener('open-settings', handleOpenSettings);
    window.addEventListener('switch-settings-tab', handleSwitchTab);

    return () => {
      clearInterval(interval);
      window.removeEventListener('open-settings', handleOpenSettings);
      window.removeEventListener('switch-settings-tab', handleSwitchTab);
    };
  }, [fetchUnreadCount]);

  return (
    <div ref={containerRef} className="relative">
      <Select.SelectProvider>
        <Select.Select
          aria-label={localize('com_nav_account_settings')}
          data-testid="nav-user"
          className="mt-text-sm flex h-auto w-full items-center gap-2 rounded-xl p-2 text-sm transition-all duration-200 ease-in-out hover:bg-surface-hover"
        >
          <div className="-ml-0.9 -mt-0.8 h-8 w-8 flex-shrink-0">
            <div className="relative flex">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowNotifications(prev => !prev);
                }}
                className="z-50"
              >
                <Avatar user={user} size={32} />
              </button>
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(prev => !prev);
                  }}
                  className="absolute -top-1.5 -right-1.5 z-10 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-lg animate-pulse ring-2 ring-surface-primary"
                  style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.7)' }}
                  title={`${unreadCount} notificaciones sin leer`}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </button>
              )}
            </div>
          </div>
          <div
            className="mt-2 grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
            style={{ marginTop: '0', marginLeft: '0' }}
          >
            {user?.name ?? user?.username ?? localize('com_nav_user')}
          </div>
        </Select.Select>
        <Select.SelectPopover
          className="popover-ui w-[235px]"
          style={{
            transformOrigin: 'bottom',
            marginRight: '0px',
            translate: '0px',
          }}
        >
          <Select.SelectItem
            value=""
            onClick={() => {
              setActiveSettingsTab('account');
              setShowSettings(true);
            }}
            className="select-item text-sm flex items-center gap-2 group"
          >
            <UserCircle className="icon-md text-text-tertiary group-hover:text-text-primary transition-colors shrink-0" />
            <span className="flex flex-col min-w-0">
              <span className="truncate font-medium">{user?.name ?? user?.username ?? localize('com_nav_user')}</span>
              <span className="text-xs text-text-tertiary group-hover:text-indigo-500 transition-colors">Editar cuenta →</span>
            </span>
          </Select.SelectItem>
          <DropdownMenuSeparator />
          {startupConfig?.balance?.enabled === true && balanceQuery.data != null && (
            <>
              <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
                {localize('com_nav_balance')}:{' '}
                {new Intl.NumberFormat().format(Math.round(balanceQuery.data.tokenCredits))}
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <Select.SelectItem
            value=""
            onClick={() => {
              setActiveSettingsTab('notifications');
              setShowSettings(true);
            }}
            className="select-item text-sm"
          >
            <Bell className="icon-md" aria-hidden="true" />
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => navigate('/sgsst')}
            className="select-item text-sm"
          >
            <Shield className="icon-md" aria-hidden="true" />
            {localize('com_nav_sgsst')}
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => navigate('/training')}
            className="select-item text-sm"
          >
            <BookOpen className="icon-md" aria-hidden="true" />
            {localize('com_nav_help_faq')}
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => navigate('/blog')}
            className="select-item text-sm"
          >
            <Newspaper className="icon-md" aria-hidden="true" />
            {localize('com_nav_blog')}
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => setShowFiles(true)}
            className="select-item text-sm"
          >
            <FileText className="icon-md" aria-hidden="true" />
            {localize('com_nav_my_files')}
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => navigate('/planes')}
            className="select-item text-sm"
          >
            <CreditCard className="icon-md" aria-hidden="true" />
            Planes
          </Select.SelectItem>
          <Select.SelectItem
            value=""
            onClick={() => {
              setActiveSettingsTab(undefined);
              setShowSettings(true);
            }}
            className="select-item text-sm"
          >
            <GearIcon className="icon-md" aria-hidden="true" />
            {localize('com_nav_settings')}
          </Select.SelectItem>
          {user?.role === 'ADMIN' && (
            <Select.SelectItem
              value=""
              onClick={() => navigate('/tenshi/admin')}
              className="select-item text-sm text-green-600 dark:text-green-500 font-medium"
            >
              <Bot className="icon-md" aria-hidden="true" />
              Configurar Tenshi
            </Select.SelectItem>
          )}
          <DropdownMenuSeparator />
          <Select.SelectItem
            aria-selected={true}
            onClick={() => logout()}
            value="logout"
            className="select-item text-sm"
          >
            <LogOut className="icon-md" />
            {localize('com_nav_log_out')}
          </Select.SelectItem>
        </Select.SelectPopover>
        {showFiles && <FilesView open={showFiles} onOpenChange={setShowFiles} />}
        {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} activeTab={activeSettingsTab} />}
      </Select.SelectProvider>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onCountChange={setUnreadCount}
      />
    </div>
  );
}

export default memo(AccountSettings);

