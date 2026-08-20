'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useCmpConsentAllowed } from '@/lib/cmp-consent-client';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function GoogleAdsenseScript({ client }: { client: string }) {
  const marketingAllowed = useCmpConsentAllowed('marketing');

  if (!marketingAllowed) return null;

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
 * Renders a single AdSense ad unit. The AdSense loader script is included in the root layout.
 */
export function GoogleAdsenseUnit({
  client,
  slot,
  format = 'auto',
  className = '',
}: GoogleAdsenseUnitProps) {
  const marketingAllowed = useCmpConsentAllowed('marketing');
  const pushed = useRef(false);

  useEffect(() => {
    if (!marketingAllowed || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense may not be ready yet on first paint
    }
  }, [client, slot, marketingAllowed]);

  if (!marketingAllowed) {
    return (
      <aside
        className={`min-h-[90px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}
        aria-label="Advertisement"
        data-adsense-slot={slot}
        data-adsense-blocked="cmp-marketing"
      />
    );
  }

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
