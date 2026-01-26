import { useState } from 'react';
import DisplayUsernameMessages from './DisplayUsernameMessages';
import DeleteAccount from './DeleteAccount';
import Avatar from './Avatar';
import EnableTwoFactorItem from './TwoFactorAuthentication';
import BackupCodesItem from './BackupCodesItem';
import EditProfileModal from './EditProfileModal';
import { useAuthContext, useLocalize } from '~/hooks';

function Account() {
  const { user } = useAuthContext();
  const localize = useLocalize();
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
      <div className="pb-3">
        <DisplayUsernameMessages />
      </div>
      <div className="pb-3">
        <Avatar />
      </div>
      <div className="pb-3">
        <button
          onClick={() => setShowEditModal(true)}
          className="btn btn-neutral"
        >
          {localize('com_ui_edit_profile') || 'Edit Profile'}
        </button>
      </div>
      {user?.provider === 'local' && (
        <>
          <div className="pb-3">
            <EnableTwoFactorItem />
          </div>
          {user?.twoFactorEnabled && (
            <div className="pb-3">
              <BackupCodesItem />
            </div>
          )}
        </>
      )}
      <div className="pb-3">
        <DeleteAccount />
      </div>
      <EditProfileModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </div>
  );
}

export default React.memo(Account);
