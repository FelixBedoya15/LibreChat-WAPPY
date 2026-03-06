import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '@librechat/client';
import ImportConversations from './ImportConversations';
import { RevokeKeys } from './RevokeKeys';
import { DeleteCache } from './DeleteCache';
import { ClearChats } from './ClearChats';
import SharedLinks from './SharedLinks';

function Data() {
  const dataTabRef = useRef(null);
  const [confirmClearConvos, setConfirmClearConvos] = useState(false);
  useOnClickOutside(dataTabRef, () => confirmClearConvos && setConfirmClearConvos(false), []);

  return (
    <div className="flex flex-col gap-4 text-sm text-text-primary">
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <ImportConversations />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <SharedLinks />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <RevokeKeys />
      </div>
      <div className="rounded-2xl border border-gray-200 bg-surface-primary px-6 py-5 shadow-sm dark:border-gray-700">
        <DeleteCache />
      </div>
      <div className="rounded-2xl border border-red-200 bg-red-50/50 px-6 py-5 shadow-sm dark:border-red-900/50 dark:bg-red-900/10">
        <ClearChats />
      </div>
    </div>
  );
}

export default React.memo(Data);
