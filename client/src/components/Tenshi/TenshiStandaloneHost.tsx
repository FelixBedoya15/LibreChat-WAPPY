import React, { Suspense, lazy, useMemo } from 'react';
import { useAuthContext } from '~/hooks';
import {
  SetConvoProvider,
  FileMapContext,
  AssistantsMapContext,
  AgentsMapContext,
} from '~/Providers';

const TenshiChat = lazy(() => import('~/components/Tenshi/TenshiChat'));

/**
 * Host ligero que provee los contextos mínimos para montar Tenshi
 * en páginas institucionales y públicas fuera de Root (/planes, /terms, /privacy, /about).
 * Si el usuario no ha iniciado sesión, simplemente muestra la página normal.
 * Si el usuario está autenticado, monta a Tenshi para que pueda leer la página,
 * explicar su contenido y regresar al chat/SG-SST.
 */
export default function TenshiStandaloneHost({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const emptyMap = useMemo(() => new Map(), []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={emptyMap as any}>
        <AssistantsMapContext.Provider value={emptyMap as any}>
          <AgentsMapContext.Provider value={emptyMap as any}>
            {children}
            <Suspense fallback={null}>
              <TenshiChat />
            </Suspense>
          </AgentsMapContext.Provider>
        </AssistantsMapContext.Provider>
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
