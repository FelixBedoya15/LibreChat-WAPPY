import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Label } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { WappyExpandButton } from '../WappyExpandButton';

interface DisableTwoFactorToggleProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const DisableTwoFactorToggle: React.FC<DisableTwoFactorToggleProps> = ({
  enabled,
  onChange,
  disabled,
}) => {
  const localize = useLocalize();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Label> {localize('com_nav_2fa')}</Label>
      </div>
      <div className="flex items-center gap-3">
        <WappyExpandButton
          variant={enabled ? 'red' : 'teal'}
          onClick={onChange}
          disabled={disabled}
          icon={enabled ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          label={enabled ? localize('com_ui_2fa_disable') : localize('com_ui_2fa_enable')}
        />
      </div>
    </div>
  );
};
