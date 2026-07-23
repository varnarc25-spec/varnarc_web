'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function GoogleAdsenseScript({ client }: { client: string }) {
  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

type GoogleAdsenseUnitProps = {
  client: string;
  slot: string;
  format?: string;
  className?: string;
};

/**
 * Renders a single AdSense ad unit. Requires GoogleAdsenseScript in the document once per page.
 */
export function GoogleAdsenseUnit({
  client,
  slot,
  format = 'auto',
  className = '',
}: GoogleAdsenseUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense may not be ready yet on first paint
    }
  }, [client, slot]);

  return (
    <aside
      className={`min-h-[90px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}
      aria-label="Advertisement"
      data-adsense-slot={slot}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
