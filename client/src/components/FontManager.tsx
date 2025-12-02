import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import store from '~/store';

export default function FontManager() {
    const fontFamily = useRecoilValue(store.fontFamily);

    useEffect(() => {
        if (!fontFamily || fontFamily === 'system') {
            document.body.style.fontFamily = '';
            return;
        }

        let fontValue = '';
        switch (fontFamily) {
            case '8bit':
                fontValue = '"Press Start 2P", cursive';
                break;
            case 'book-antiqua':
                fontValue = '"Book Antiqua", Palatino, "Palatino Linotype", "Palatino LT STD", Georgia, serif';
                break;
            case 'menlo':
                fontValue = 'Menlo, Monaco, "Courier New", monospace';
                break;
            default:
                fontValue = '';
        }

        document.body.style.fontFamily = fontValue;
    }, [fontFamily]);

    return null;
}
