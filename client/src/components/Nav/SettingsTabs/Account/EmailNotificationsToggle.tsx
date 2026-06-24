import React, { useState } from 'react';
import { Switch, Label, InfoHoverCard, ESide, useToastContext } from '@librechat/client';
import { useAuthContext, useLocalize } from '~/hooks';
import axios from 'axios';

export default function EmailNotificationsToggle() {
  const localize = useLocalize();
  const { user, setUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState(false);

  // Default to true if emailNotifications is not explicitly false
  const emailNotifications = user?.emailNotifications !== false;

  const handleCheckedChange = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/user/update', {
        emailNotifications: checked,
      });
      setUser(response.data.user);
      showToast({
        message: checked 
          ? localize('com_nav_email_notifications_enabled')
          : localize('com_nav_email_notifications_disabled'),
        status: 'success',
      });
    } catch (error) {
      console.error('Error al actualizar las notificaciones por correo:', error);
      showToast({
        message: localize('com_nav_email_notifications_error'),
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Label id="email-notifications-label">{localize('com_nav_email_notifications')}</Label>
        <InfoHoverCard 
          side={ESide.Bottom} 
          text={localize('com_nav_email_notifications_desc')} 
        />
      </div>
      <Switch
        id="emailNotifications"
        checked={emailNotifications}
        onCheckedChange={handleCheckedChange}
        disabled={loading}
        className="ml-4"
        data-testid="emailNotifications"
        aria-labelledby="email-notifications-label"
      />
    </div>
  );
}
