import { useEffect, useContext } from 'react';
import { ThemeContext } from '@librechat/client';

export default function ThemeManager() {
    const context = useContext(ThemeContext);
    const { theme, setTheme } = (context || {}) as { theme: string; setTheme?: (t: string) => void };

    // Reset default back to 'light' for all users while preserving manual selections
    useEffect(() => {
        const isLightDefaultSet = localStorage.getItem('wappy_light_default_v2');
        if (!isLightDefaultSet && setTheme) {
            localStorage.setItem('wappy_light_default_v2', 'true');
            setTheme('light');
        }
    }, [setTheme]);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'green') {
            root.classList.add('green');
            root.classList.remove('saas');
            root.classList.add('dark');
        } else if (theme === 'saas') {
            root.classList.add('saas');
            root.classList.remove('green', 'dark');
            root.classList.add('light');
        } else {
            root.classList.remove('green', 'saas');
        }
    }, [theme]);

    return null;
}
