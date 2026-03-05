import React, { useState, useEffect } from 'react';
import { useAuthContext, useLocalize } from '~/hooks';
import { Input, Label, Button, useToastContext } from '@librechat/client';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { formatDateForInput } from '~/utils/dateHelpers';

import DisplayUsernameMessages from './DisplayUsernameMessages';
import DeleteAccount from './DeleteAccount';
import Avatar from './Avatar';
import EnableTwoFactorItem from './TwoFactorAuthentication';
import BackupCodesItem from './BackupCodesItem';

function Account() {
  const localize = useLocalize();
  const { user, setUser } = useAuthContext();
  const { showToast } = useToastContext();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    inactiveAt: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
        inactiveAt: formatDateForInput(user.inactiveAt),
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast({ message: localize('com_auth_password_not_match'), status: 'error' });
      return;
    }

    try {
      const payload: Record<string, string> = {
        name: formData.name,
        username: formData.username,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await axios.post('/api/user/update', payload);
      setUser(response.data.user);
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      showToast({ message: localize('com_ui_profile_update_success'), status: 'success' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;
      showToast({
        message: `(${status || 'N/A'}) ${serverMessage || localize('com_ui_profile_update_error')}`,
        status: 'error'
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-2 text-sm text-text-primary">
      {/* Left Column: Form */}
      <div className="md:col-span-7 flex flex-col gap-6 p-5 rounded-2xl border border-border-light bg-surface-primary shadow-sm h-fit">
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-1">{localize('com_ui_edit_profile')}</h3>
          <p className="text-sm text-text-secondary mb-5">Actualiza tu información personal y verifica el estado de tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs font-bold text-text-secondary uppercase">{localize('com_auth_full_name')}</Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="username" className="text-xs font-bold text-text-secondary uppercase">{localize('com_auth_username')}</Label>
            <Input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="createdAt" className="text-xs font-bold text-text-secondary uppercase">{localize('com_ui_registration_date')}</Label>
              <Input
                id="createdAt"
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                disabled
                className="mt-1 bg-surface-secondary text-text-secondary opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="inactiveAt" className="text-xs font-bold text-text-secondary uppercase">{localize('com_ui_inactivation_date')}</Label>
              <Input
                id="inactiveAt"
                type="date"
                name="inactiveAt"
                value={formData.inactiveAt}
                disabled
                className="mt-1 bg-surface-secondary text-text-secondary opacity-70 cursor-not-allowed text-xs"
              />
            </div>
          </div>
          <p className="text-xs text-text-tertiary">
            {formData.inactiveAt
              ? localize('com_ui_account_will_deactivate') + ' ' + new Date(formData.inactiveAt).toLocaleDateString()
              : localize('com_ui_account_active_indefinitely')}
          </p>

          <div className="border-t border-border-light pt-6 mt-6">
            <h4 className="text-sm font-bold text-text-primary mb-3">Seguridad y Acceso</h4>
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="password" className="text-xs font-bold text-text-secondary uppercase">{localize('com_ui_change_password')}</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={localize('com_ui_leave_blank_keep_current')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {formData.password && (
                <div className="relative">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-text-secondary uppercase">{localize('com_auth_password_confirm')}</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-tertiary hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold px-6">
              {localize('com_ui_save_changes')}
            </Button>
          </div>
        </form>
      </div>

      {/* Right Column: Other Options */}
      <div className="md:col-span-5 flex flex-col gap-5">
        <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border-light bg-surface-primary shadow-sm h-fit">
          <h3 className="text-base font-bold text-text-primary mb-1 pb-3 border-b border-border-light">Opciones de Cuenta</h3>
          <div className="py-2"><Avatar /></div>
          <div className="h-px bg-border-light w-full my-1"></div>
          <div className="py-2"><DisplayUsernameMessages /></div>

          {user?.provider === 'local' && (
            <>
              <div className="h-px bg-border-light w-full my-1"></div>
              <div className="py-2"><EnableTwoFactorItem /></div>
              {user?.twoFactorEnabled && (
                <div className="pb-2">
                  <BackupCodesItem />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 shadow-sm">
          <h3 className="text-base font-bold text-red-500 border-b border-red-500/20 pb-3 mb-1">Zona de Peligro</h3>
          <div className="py-2"><DeleteAccount /></div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Account);
