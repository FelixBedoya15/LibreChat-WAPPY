import React from 'react';
import { BookOpen } from 'lucide-react';
import { useLocalize } from '~/hooks';

export default function ManualButton() {
    const localize = useLocalize();

    const openManual = () => {
        window.open('/manual_usuario.md', '_blank');
    };

    return (
        <button
            onClick={openManual}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
        >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <BookOpen className="h-4 w-4" />
            </div>
            <span>Manual de Usuario</span>
        </button>
    );
}
