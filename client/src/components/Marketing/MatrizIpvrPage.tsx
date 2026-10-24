import React, { useEffect } from 'react';

export default function MatrizIpvrPage() {
  useEffect(() => {
    // Si se navega internamente mediante el router cliente, 
    // redirigir a la URL servida directamente por el servidor para renderizado instantáneo
    window.location.replace('/matrizipvr.html');
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0e1300] text-white">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#c7f303] border-t-transparent" />
        <div>
          <h1 className="font-display text-lg font-black tracking-tight text-white">
            Matriz IPEVR GTC-45 · WAPPY IA
          </h1>
          <p className="mt-1 font-sans text-xs font-semibold text-slate-300">
            Cargando la landing page interactiva sin autenticación...
          </p>
        </div>
      </div>
    </div>
  );
}
