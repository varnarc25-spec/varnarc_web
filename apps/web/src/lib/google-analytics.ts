import { apiPublicFetch } from '@/services/api-client';

export function safeGoogleAnalyticsId(value: string | null | undefined): string | null {
  const id = value?.trim() ?? '';
  return /^G-[A-Z0-9]+$/i.test(id) || /^UA-\d+-\d+$/i.test(id) ? id : null;
}

export async function fetchPublicGoogleAnalyticsId(): Promise<string | null> {
  try {
    const { data } = await apiPublicFetch<{ googleAnalyticsId?: string | null }>(
      '/analytics/integrations/public',
      { cache: 'no-store' },
    );
    return safeGoogleAnalyticsId(data?.googleAnalyticsId);
  } catch {
    return null;
  }
}
