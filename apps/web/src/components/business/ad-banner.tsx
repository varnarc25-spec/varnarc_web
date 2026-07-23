import { AdCreative } from '@/components/business/ad-creative';
import { GoogleAdsenseUnit } from '@/components/business/google-adsense';
import { fetchAdsForPlacement } from '@/lib/ads';
import { getAdsenseClient, getAdsenseSlotForPlacement } from '@/lib/adsense-config';

type AdBannerProps = {
  slot: string;
  className?: string;
  pageType?: string;
  categoryId?: string;
  articleId?: string;
};

/**
 * Fetches and renders an advertisement for a named placement slug.
 * Falls back to an empty accessible shell when no active creative is available.
 */
export async function AdBanner({
  slot,
  className = '',
  pageType,
  categoryId,
  articleId,
}: AdBannerProps) {
  const result = await fetchAdsForPlacement(slot, {
    pageType,
    categoryId,
    articleId,
    limit: 1,
  });
  const ad = result.data?.ads?.[0];

  if (!ad) {
    const client = getAdsenseClient();
    const adsenseSlot = getAdsenseSlotForPlacement(slot);
    if (client && adsenseSlot) {
      return <GoogleAdsenseUnit client={client} slot={adsenseSlot} className={className} />;
    }

    return (
      <aside
        className={`flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center ${className}`}
        data-ad-slot={slot}
        aria-label="Advertisement"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advertisement</p>
          <p className="mt-1 text-[11px] text-slate-400">Slot: {slot}</p>
        </div>
      </aside>
    );
  }

  return <AdCreative ad={ad} className={className} />;
}
