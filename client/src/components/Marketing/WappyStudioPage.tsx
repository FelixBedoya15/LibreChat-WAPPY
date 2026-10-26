import React, { useEffect, useState } from 'react';

export default function WappyStudioPage() {
  const [iframeSrc, setIframeSrc] = useState<string>('/assets/wappystudio.html');

  useEffect(() => {
    let cancelled = false;
    // Check if /wappystudio.html is served as the standalone studio file (not the SPA index.html)
    fetch('/wappystudio.html', { cache: 'no-store' })
      .then((res) => (res.ok ? res.text() : ''))
      .then((html) => {
        if (cancelled) return;
        if (html && html.includes('WAPPY STUDIO') && !html.includes('<div id="root">')) {
          if (window.location.pathname !== '/wappystudio.html') {
            setIframeSrc('/wappystudio.html');
          } else {
            document.open();
            document.write(html);
            document.close();
          }
        } else {
          // Fallback to /assets/wappystudio.html which is always served statically
          fetch('/assets/wappystudio.html', { cache: 'no-store' })
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
        title="WAPPY Studio IA · Voz Neural 24kHz y Video HTML/GSAP"
        className="h-full w-full border-0"
        allow="microphone; autoplay; clipboard-write; fullscreen"
      />
    </div>
  );
}
