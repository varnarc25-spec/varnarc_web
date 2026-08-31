import { apiPublicFetch } from '@/services/api-client';
import { AnalyticsIntegrationsScripts } from './analytics-integrations-scripts';
import { safeGoogleAnalyticsId } from '@/lib/google-analytics';

type PublicIntegrations = {
  googleAnalyticsId?: string | null;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
};

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

  const gaId = safeGoogleAnalyticsId(data?.googleAnalyticsId);
  const hasOther = Boolean(data?.microsoftClarityId?.trim() || data?.plausibleDomain?.trim());
  if (!gaId && !hasOther) return null;

  return data ? <AnalyticsIntegrationsScripts config={data} /> : null;
}
