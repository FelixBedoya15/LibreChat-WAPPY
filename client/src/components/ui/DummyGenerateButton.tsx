import React from 'react';
import { Bot } from 'lucide-react';

interface DummyGenerateButtonProps {
  onClick: () => void;
  text?: string;
}

export const DummyGenerateButton: React.FC<DummyGenerateButtonProps> = ({
  onClick,
  text = 'Generar Datos de Prueba',
}) => {
  return (
    <button
      onClick={onClick}
      title={text}
      className="group flex items-center justify-center h-9 px-2.5 min-w-[36px] sm:h-10 sm:px-3 sm:min-w-[40px] bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-xl transition-all duration-300 ease-in-out shadow-xs shrink-0 cursor-pointer sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 outline-none"
    >
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <Bot className="w-4 h-4 flex-shrink-0" />
      </div>
      <div className="hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[240px] group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 ease-in-out whitespace-nowrap">
        <span className="text-sm font-bold tracking-wide">{text}</span>
      </div>
    </button>
  );
};
