import { apiPublicFetch } from '@/services/api-client';
import { AnalyticsIntegrationsScripts } from './analytics-integrations-scripts';

type PublicIntegrations = {
  googleAnalyticsId?: string | null;
  microsoftClarityId?: string | null;
  plausibleDomain?: string | null;
};

export async function AnalyticsIntegrationsRoot() {
  try {
    const { data } = await apiPublicFetch<PublicIntegrations>('/analytics/integrations/public', {
      next: { revalidate: 300 },
    });
    if (!data) return null;
    const hasAny = data.googleAnalyticsId || data.microsoftClarityId || data.plausibleDomain;
    if (!hasAny) return null;
    return <AnalyticsIntegrationsScripts config={data} />;
  } catch {
    return null;
  }
}
