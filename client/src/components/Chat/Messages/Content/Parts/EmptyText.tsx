import { memo } from 'react';

const EmptyTextPart = memo(() => {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-text-secondary select-none">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
      </div>
      <span className="text-xs font-semibold tracking-wide text-text-secondary/80 animate-pulse">
        Pensando respuesta...
      </span>
    </div>
  );
});

export default EmptyTextPart;
