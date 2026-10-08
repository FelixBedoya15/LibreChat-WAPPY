import React, { useState } from 'react';
import { useRevokeAllUserKeysMutation } from 'librechat-data-provider/react-query';
import { KeyRound } from 'lucide-react';
import {
  OGDialogTemplate,
  Button,
  Label,
  OGDialog,
  OGDialogTrigger,
  Spinner,
} from '@librechat/client';
import { useLocalize } from '~/hooks';
import { WappyExpandButton } from '../WappyExpandButton';

export const RevokeKeys = ({
  disabled = false,
  setDialogOpen,
}: {
  disabled?: boolean;
  setDialogOpen?: (open: boolean) => void;
}) => {
  const localize = useLocalize();
  const [open, setOpen] = useState(false);
  const revokeKeysMutation = useRevokeAllUserKeysMutation();

  const handleSuccess = () => {
    if (!setDialogOpen) {
      return;
    }

    setDialogOpen(false);
  };

  const onClick = () => {
    revokeKeysMutation.mutate({}, { onSuccess: handleSuccess });
  };

  const isLoading = revokeKeysMutation.isLoading;

  return (
    <div className="flex items-center justify-between">
      <Label id="revoke-info-label">{localize('com_ui_revoke_info')}</Label>

      <OGDialog open={open} onOpenChange={setOpen}>
        <OGDialogTrigger asChild>
          <WappyExpandButton
            variant="red"
            onClick={() => setOpen(true)}
            disabled={disabled}
            aria-labelledby="revoke-info-label"
            icon={<KeyRound className="w-4 h-4" />}
            label={localize('com_ui_revoke')}
          />
        </OGDialogTrigger>
        <OGDialogTemplate
          showCloseButton={false}
          title={localize('com_ui_revoke_keys')}
          className="max-w-[450px]"
          main={
            <Label className="text-left text-sm font-medium">
              {localize('com_ui_revoke_keys_confirm')}
            </Label>
          }
          selection={{
            selectHandler: onClick,
            selectClasses:
              'bg-destructive text-white transition-all duration-200 hover:bg-destructive/80',
            selectText: isLoading ? <Spinner /> : localize('com_ui_revoke'),
          }}
        />
      </OGDialog>
    </div>
  );
};
