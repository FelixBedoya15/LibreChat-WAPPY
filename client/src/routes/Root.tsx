import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  useSearchEnabled,
  useAssistantsMap,
  useAuthContext,
  useAgentsMap,
  useFileMap,
  useLocalize,
} from '~/hooks';
import {
  PromptGroupsProvider,
  AssistantsMapContext,
  AgentsMapContext,
  SetConvoProvider,
  FileMapContext,
} from '~/Providers';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { TermsAndConditionsModal } from '~/components/ui';
import { Nav, MobileNav } from '~/components/Nav';
import { useHealthCheck } from '~/data-provider';
import { Banner } from '~/components/Banners';
import InactiveAccount from '~/components/Auth/InactiveAccount';
import TenshiChat from '~/components/Tenshi/TenshiChat';

const playStartupSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Play a soft, pleasant chord (C major 7th: C, E, G, B)
    const frequencies = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Envelope
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1 + (i * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + (i * 0.05));
      osc.stop(ctx.currentTime + 1.5);
    });

  } catch (e) {
    console.warn('Startup sound could not be played:', e);
  }
};

export default function Root() {
  const localize = useLocalize();
  const [showTerms, setShowTerms] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });

  const { isAuthenticated, logout, user } = useAuthContext();

  // Global health check - runs once per authenticated session
  useHealthCheck(isAuthenticated);

  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  // Attempt to play startup sound once the component is ready and authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Many browsers block audio without human interaction,
      // but we'll try our best here.
      playStartupSound();
    }
  }, [isAuthenticated]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-dvh w-full overflow-hidden bg-surface-primary animate-pulse">
        {/* Sidebar skeleton */}
        <div className="flex h-full w-[260px] flex-shrink-0 flex-col bg-surface-secondary px-3 py-3 gap-2">
          {/* Header */}
          <div className="h-8 w-3/4 rounded-lg bg-surface-tertiary mb-2" />
          {/* Nav items */}
          {[1, 0.85, 0.9, 0.7, 0.95].map((w, i) => (
            <div key={i} className="h-7 rounded-md bg-surface-tertiary" style={{ width: `${w * 100}%`, opacity: 0.6 + i * 0.05 }} />
          ))}
          <div className="mt-2 h-px w-full bg-surface-tertiary opacity-40" />
          <div className="text-xs h-4 w-1/3 rounded bg-surface-tertiary opacity-40 mt-1" />
          {[0.8, 0.95, 0.65, 0.75].map((w, i) => (
            <div key={i} className="h-7 rounded-md bg-surface-tertiary" style={{ width: `${w * 100}%`, opacity: 0.5 }} />
          ))}
          {/* Bottom user area */}
          <div className="mt-auto flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-surface-tertiary flex-shrink-0" />
            <div className="h-4 w-24 rounded bg-surface-tertiary" />
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="h-10 w-48 rounded-xl bg-surface-secondary" />
          <div className="h-4 w-80 rounded-lg bg-surface-secondary" />
          <div className="h-4 w-64 rounded-lg bg-surface-secondary opacity-70" />
          {/* Input bar skeleton */}
          <div className="absolute bottom-6 w-full max-w-2xl px-4">
            <div className="h-12 w-full rounded-2xl bg-surface-secondary" />
          </div>
        </div>
      </div>
    );
  }


  if (user?.accountStatus === 'inactive') {
    return <InactiveAccount />;
  }

  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={fileMap}>
        <AssistantsMapContext.Provider value={assistantsMap}>
          <AgentsMapContext.Provider value={agentsMap}>
            <PromptGroupsProvider>
              <Banner onHeightChange={setBannerHeight} />
              <div className="flex" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
                <div className="relative z-0 flex h-full w-full overflow-hidden">
                  <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
                  <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
                    <MobileNav setNavVisible={setNavVisible} />
                    <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                  </div>
                </div>
              </div>
            </PromptGroupsProvider>
          </AgentsMapContext.Provider>
          {config?.interface?.termsOfService?.modalAcceptance === true && (
            <TermsAndConditionsModal
              open={showTerms}
              onOpenChange={setShowTerms}
              onAccept={handleAcceptTerms}
              onDecline={handleDeclineTerms}
              title={localize('com_ui_terms_title')}
              modalContent={localize('com_ui_terms_content')}
            />
          )}
          <TenshiChat />
        </AssistantsMapContext.Provider>
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
