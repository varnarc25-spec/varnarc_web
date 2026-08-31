'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCmpConsentAllowed } from '@/lib/cmp-consent-client';

type PublicIntegrations = {
  googleAnalyticsId?: string | null;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AnalyticsIntegrationsScripts({ config }: { config: PublicIntegrations }) {
  const analyticsAllowed = useCmpConsentAllowed('analytics');
  const gaId = config.googleAnalyticsId?.trim();
  const clarityId = config.microsoftClarityId?.trim();
  const plausibleDomain = config.plausibleDomain?.trim();

  useEffect(() => {
    if (!gaId || typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
    });
  }, [analyticsAllowed, gaId]);

  if (!analyticsAllowed) return null;

  return (
    <>
      {clarityId ? (
        <Script id="varnarc-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      ) : null}
      {plausibleDomain ? (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
