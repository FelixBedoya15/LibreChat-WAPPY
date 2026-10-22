import React from 'react';
import { Bot } from 'lucide-react';

interface DummyGenerateButtonProps {
  onClick: () => void;
  hideText?: boolean;
  text?: string;
}

export function DummyGenerateButton({ onClick, hideText = false, text = "Cargar Ejemplo" }: DummyGenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      title={text}
      className="group flex items-center justify-center h-9 px-3.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] bg-white dark:bg-gray-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-border-medium/40 text-amber-600 dark:text-amber-400 rounded-xl transition-all duration-300 ease-in-out shadow-sm shrink-0 cursor-pointer active:scale-95 outline-none"
    >
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </div>
      {!hideText && (
        <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap group-hover:ml-2">
          <span className="text-xs sm:text-sm font-bold tracking-wide">{text}</span>
        </div>
      )}
    </button>
  );
};
