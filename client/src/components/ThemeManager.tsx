import { useEffect, useContext } from 'react';
import { ThemeContext } from '@librechat/client';

export default function ThemeManager() {
    const context = useContext(ThemeContext);
    const { theme } = (context || {}) as { theme: string };

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'green') {
            root.classList.add('green');
            root.classList.remove('dark', 'light');
            // Ensure dark mode specific styles (if any rely on .dark) are handled or that .green provides everything
            // Since .green defines all variables, it should be fine.
            // However, some Tailwind classes like 'dark:bg-gray-800' rely on the 'dark' class.
            // If the Green theme is dark-based, we might want to KEEP 'dark' and add 'green' to override variables.
            // Let's check style.css again. The .green class defines --background etc.
            // But Tailwind's 'dark:' modifier checks for the .dark class.
            // If the Green theme is dark, we should probably add 'dark' as well.
            root.classList.add('dark');
        } else {
            root.classList.remove('green');
        }
    }, [theme]);

    return null;
}
