import { atom } from 'recoil';

const showVoiceModal = atom<boolean>({
    key: 'showVoiceModal',
    default: false,
});

const showLiveAnalysisModal = atom<boolean>({
    key: 'showLiveAnalysisModal',
    default: false,
});

export default { showVoiceModal, showLiveAnalysisModal };
