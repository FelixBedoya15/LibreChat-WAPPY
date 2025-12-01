import { atom } from 'recoil';

const showVoiceModal = atom<boolean>({
    key: 'showVoiceModal',
    default: false,
});

export default { showVoiceModal };
