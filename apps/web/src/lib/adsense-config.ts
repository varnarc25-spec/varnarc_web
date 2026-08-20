/** Publisher ID from AdSense (override with NEXT_PUBLIC_ADSENSE_CLIENT). */
export const DEFAULT_ADSENSE_CLIENT = 'ca-pub-6274053387170397';

export function getAdsenseClient(): string | null {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || DEFAULT_ADSENSE_CLIENT;
  return client || null;
}

/** Ad unit slot ID for a named placement slug (e.g. calculator-sidebar). */
export function getAdsenseSlotForPlacement(placementSlug: string): string | null {
  const envKey = `NEXT_PUBLIC_ADSENSE_SLOT_${placementSlug.toUpperCase().replace(/-/g, '_')}`;
  const specific = process.env[envKey]?.trim();
  if (specific) return specific;

  return process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT?.trim() || null;
}

export function isAdsenseConfigured(): boolean {
  return Boolean(getAdsenseClient());
}

/** ca-pub-xxx → pub-xxx for ads.txt */
export function getAdsensePublisherId(): string | null {
  const client = getAdsenseClient();
  if (!client) return null;
  return client.replace(/^ca-pub-/i, 'pub-');
}
