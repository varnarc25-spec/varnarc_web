import { apiPublicFetch } from '@/services/api-client';

export type PublicAd = {
  id: string;
  name: string;
  slug: string;
  type: string;
  provider: string;
  contentType: string;
  creativeUrl: string | null;
  htmlContent: string | null;
  adsenseSlot: string | null;
  adsenseClient: string | null;
  targetUrl: string | null;
  priority: number;
  campaign: {
    id: string;
    name: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
};

export type PlacementPayload = {
  placement: {
    id: string;
    slug: string;
    name: string;
    location: string | null;
    rotationMode: string;
  } | null;
  ads: PublicAd[];
};

export async function fetchAdsForPlacement(
  slug: string,
  options?: {
    pageType?: string;
    categoryId?: string;
    articleId?: string;
    device?: string;
    limit?: number;
  },
) {
  try {
    const qs = new URLSearchParams();
    if (options?.pageType) qs.set('pageType', options.pageType);
    if (options?.categoryId) qs.set('categoryId', options.categoryId);
    if (options?.articleId) qs.set('articleId', options.articleId);
    if (options?.device) qs.set('device', options.device);
    if (options?.limit) qs.set('limit', String(options.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return await apiPublicFetch<PlacementPayload>(
      `/advertisements/placement/${slug}${suffix}`,
      { next: { revalidate: 30 } },
    );
  } catch {
    return { data: { placement: null, ads: [] } as PlacementPayload };
  }
}

export function withUtm(url: string | null, ad: PublicAd): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (ad.campaign.utmSource) u.searchParams.set('utm_source', ad.campaign.utmSource);
    if (ad.campaign.utmMedium) u.searchParams.set('utm_medium', ad.campaign.utmMedium);
    if (ad.campaign.utmCampaign) u.searchParams.set('utm_campaign', ad.campaign.utmCampaign);
    return u.toString();
  } catch {
    return url;
  }
}

export function trackAdEvent(
  kind: 'impression' | 'click',
  adId: string,
  meta?: { pagePath?: string; destinationUrl?: string },
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
  const path = kind === 'impression' ? 'impressions' : 'clicks';
  // Fire-and-forget; never block rendering
  void fetch(`${apiUrl}/advertisements/${adId}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pagePath: meta?.pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      destinationUrl: meta?.destinationUrl,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      device:
        typeof window !== 'undefined' && window.innerWidth < 768
          ? 'mobile'
          : typeof window !== 'undefined' && window.innerWidth < 1024
            ? 'tablet'
            : 'desktop',
    }),
    keepalive: true,
  }).catch(() => undefined);
}
