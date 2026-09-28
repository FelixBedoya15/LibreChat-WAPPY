import { useEffect, useContext } from 'react';
import { ThemeContext } from '@librechat/client';

export default function ThemeManager() {
    const context = useContext(ThemeContext);
    const { theme, setTheme } = (context || {}) as { theme: string; setTheme?: (t: string) => void };

    // Establish 'saas' (Figma SaaS) as the new default theme for all users
    useEffect(() => {
        const isSaasDefaultSet = localStorage.getItem('wappy_saas_default_v1');
        if (!isSaasDefaultSet && setTheme) {
            localStorage.setItem('wappy_saas_default_v1', 'true');
            setTheme('saas');
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
