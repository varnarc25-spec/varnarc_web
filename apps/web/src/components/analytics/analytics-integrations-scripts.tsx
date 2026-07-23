'use client';

import Script from 'next/script';

type PublicIntegrations = {
  googleAnalyticsId?: string | null;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
};

export function AnalyticsIntegrationsScripts({ config }: { config: PublicIntegrations }) {
  const gaId = config.googleAnalyticsId?.trim();
  const clarityId = config.microsoftClarityId?.trim();
  const plausibleDomain = config.plausibleDomain?.trim();

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="varnarc-ga" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      ) : null}
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
