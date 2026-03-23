import React from 'react';
import { Bot } from 'lucide-react';

interface DummyGenerateButtonProps {
  onClick: () => void;
  hideText?: boolean;
  text?: string;
}

export function DummyGenerateButton({ onClick, text = "Cargar Ejemplo de Prueba" }: DummyGenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      title={text}
      className="flex items-center justify-center w-12 h-10 bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white rounded-xl transition-all duration-300 shadow-sm shrink-0 cursor-pointer transform hover:scale-110 active:scale-95"
    >
      <Bot className="h-5 w-5" />
    </button>
  );
};
