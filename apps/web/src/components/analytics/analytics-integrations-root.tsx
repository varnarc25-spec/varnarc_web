import Script from 'next/script';
import { apiPublicFetch } from '@/services/api-client';
import { AnalyticsIntegrationsScripts } from './analytics-integrations-scripts';

type PublicIntegrations = {
  googleAnalyticsId?: string | null;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
};

function safeGaId(value: string | null | undefined): string | null {
  const id = value?.trim() ?? '';
  return /^G-[A-Z0-9]+$/i.test(id) || /^UA-\d+-\d+$/i.test(id) ? id : null;
}

export async function AnalyticsIntegrationsRoot() {
  let data: PublicIntegrations | null = null;
  try {
    const result = await apiPublicFetch<PublicIntegrations>('/analytics/integrations/public', {
      cache: 'no-store',
    });
    data = result.data;
  } catch {
    return null;
  }

  const gaId = safeGaId(data?.googleAnalyticsId);
  const hasOther = Boolean(data?.microsoftClarityId?.trim() || data?.plausibleDomain?.trim());
  if (!gaId && !hasOther) return null;

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
              gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      ) : null}
      {data ? <AnalyticsIntegrationsScripts config={data} /> : null}
    </>
  );
}
