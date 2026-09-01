import { apiPublicFetch } from '@/services/api-client';

/** Fallback publisher ID when admin settings are unavailable. */
export const DEFAULT_ADSENSE_CLIENT = 'ca-pub-6274053387170397';

export type AdsensePublicConfig = {
  enabled: boolean;
  client: string | null;
  defaultSlot: string | null;
  slots: Record<string, string>;
};

function envClient(): string | null {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || DEFAULT_ADSENSE_CLIENT;
}

function envSlotForPlacement(placementSlug: string): string | null {
  const envKey = `NEXT_PUBLIC_ADSENSE_SLOT_${placementSlug.toUpperCase().replace(/-/g, '_')}`;
  const specific = process.env[envKey]?.trim();
  if (specific) return specific;
  return process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT?.trim() || null;
}

export async function fetchAdsensePublicConfig(
  init: RequestInit = {},
): Promise<AdsensePublicConfig> {
  try {
    const result = await apiPublicFetch<AdsensePublicConfig>('/settings/adsense/public', {
      next: { revalidate: 60 },
      ...init,
      signal: init.signal ?? AbortSignal.timeout(8_000),
    });
    return {
      enabled: result.data.enabled !== false,
      client: result.data.client?.trim() || null,
      defaultSlot: result.data.defaultSlot?.trim() || null,
      slots: result.data.slots ?? {},
    };
  } catch {
    const client = envClient();
    return {
      enabled: Boolean(client),
      client,
      defaultSlot: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT?.trim() || null,
      slots: {},
    };
  }
}

export function getAdsenseClientFromConfig(config: AdsensePublicConfig): string | null {
  if (!config.enabled) return null;
  return config.client?.trim() || envClient();
}

export function getAdsenseSlotForPlacement(
  placementSlug: string,
  config?: AdsensePublicConfig | null,
): string | null {
  const fromConfig = config?.slots?.[placementSlug]?.trim();
  if (fromConfig) return fromConfig;
  if (config?.defaultSlot?.trim()) return config.defaultSlot.trim();
  return envSlotForPlacement(placementSlug);
}

export function getAdsensePublisherIdFromConfig(config: AdsensePublicConfig): string | null {
  const client = getAdsenseClientFromConfig(config);
  if (!client) return null;
  return client.replace(/^ca-pub-/i, 'pub-');
}
