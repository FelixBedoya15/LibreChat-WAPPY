import React, { useEffect, useState } from 'react';

export default function WappyPodcastPage() {
  const [iframeSrc, setIframeSrc] = useState<string>('/assets/wappypodcast.html');

  useEffect(() => {
    let cancelled = false;
    // Comprobar si /wappypodcast.html se sirve como archivo standalone (no como el index.html de la SPA)
    fetch('/wappypodcast.html', { cache: 'no-store' })
      .then((res) => (res.ok ? res.text() : ''))
      .then((html) => {
        if (cancelled) return;
        if (
          html &&
          (html.includes('WAPPY Podcast') || html.includes('wappy-studio-root')) &&
          !html.includes('<div id="root">')
        ) {
          if (window.location.pathname !== '/wappypodcast.html') {
            setIframeSrc('/wappypodcast.html');
          } else {
            document.open();
            document.write(html);
            document.close();
          }
        } else {
          // Fallback a /assets/wappypodcast.html servido estáticamente
          fetch('/assets/wappypodcast.html', { cache: 'no-store' })
            .then((r) => (r.ok ? r.text() : ''))
            .then((assetHtml) => {
              if (cancelled || !assetHtml) return;
              document.open();
              document.write(assetHtml);
              document.close();
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#0e1300]">
      <iframe
        src={iframeSrc}
        title="WAPPY Podcast IA · Estudio de Podcasts y Cápsulas de Audio a 2 Voces 24kHz"
        className="h-full w-full border-0"
        allow="microphone; autoplay; clipboard-write; fullscreen"
      />
    </div>
  );
}
