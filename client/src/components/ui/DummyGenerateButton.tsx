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
      className={`group flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded-full transition-all duration-300 shadow-sm shrink-0 cursor-pointer ${hideText ? 'justify-center w-10 h-10 px-0' : ''}`}
    >
      <Bot className="h-[18px] w-[18px]" />
      {!hideText && (
        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 whitespace-nowrap group-hover:ml-2 font-medium text-sm">
          {text}
        </span>
      )}
    </button>
  );
};
