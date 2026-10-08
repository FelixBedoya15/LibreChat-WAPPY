import { useState } from 'react';
import { Archive } from 'lucide-react';
import { OGDialogTemplate, OGDialog, OGDialogTrigger, Button } from '@librechat/client';
import ArchivedChatsTable from './ArchivedChatsTable';
import { useLocalize } from '~/hooks';
import { WappyExpandButton } from '../WappyExpandButton';

export default function ArchivedChats() {
  const localize = useLocalize();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>{localize('com_nav_archived_chats')}</div>
      <OGDialog open={isOpen} onOpenChange={setIsOpen}>
        <OGDialogTrigger asChild>
          <WappyExpandButton
            variant="teal"
            aria-label="Archived chats"
            icon={<Archive className="w-4 h-4" />}
            label={localize('com_ui_manage')}
          />
        </OGDialogTrigger>
        <OGDialogTemplate
          title={localize('com_nav_archived_chats')}
          className="max-w-[1000px]"
          showCancelButton={false}
          main={<ArchivedChatsTable isOpen={isOpen} onOpenChange={setIsOpen} />}
        />
      </OGDialog>
    </div>
  );
}
