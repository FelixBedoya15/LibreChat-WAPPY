/**
 * Punto de entrada de WAPPY Studio portable: monta EXACTAMENTE el mismo componente del aplicativo
 * (WappyStudioDashboard) dentro de la landing /wappystudio y del archivo HTML descargable.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import WappyStudioDashboard from '~/components/Studio/WappyStudioDashboard';
import { installPortableStudioApi } from './portableApi';
import './portable.css';

installPortableStudioApi();

function PortableOutlet() {
  return <Outlet context={{ navVisible: true, setNavVisible: () => {} }} />;
}

const TAB_ALIASES: Record<string, string> = { bursts: 'lab', voces: 'lab', lab: 'lab', tts: 'tts', video: 'video', library: 'library' };

function mount() {
  const host = document.getElementById('wappy-studio-root');
  if (!host || (host as any).__wappyMounted) return;
  (host as any).__wappyMounted = true;

  if (!document.getElementById('wappy-studio-portal')) {
    const portal = document.createElement('div');
    portal.id = 'wappy-studio-portal';
    document.body.appendChild(portal);
  }

  const podcastOnly =
    host.getAttribute('data-podcast-only') === 'true' ||
    host.getAttribute('data-mode') === 'podcast';
  const rawInitialTab = TAB_ALIASES[host.getAttribute('data-initial-tab') || 'tts'] || 'tts';
  const initialTab = podcastOnly && rawInitialTab === 'video' ? 'tts' : rawInitialTab;
  createRoot(host).render(
    <React.StrictMode>
      <MemoryRouter initialEntries={[`/studio?tab=${initialTab}`]}>
        <Routes>
          <Route element={<PortableOutlet />}>
            <Route path="*" element={<WappyStudioDashboard portable podcastOnly={podcastOnly} />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </React.StrictMode>,
  );

  // API pública para la navbar / menú móvil de la landing
  const switchTab = (tab: string) => {
    const mapped = TAB_ALIASES[tab] || 'tts';
    const t = podcastOnly && mapped === 'video' ? 'tts' : mapped;
    window.dispatchEvent(new CustomEvent('wappy-studio-switch-tab', { detail: t }));
  };
  (window as any).wappyStudioSwitchTab = switchTab;
  (window as any).wappyStudioNav = switchTab;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
