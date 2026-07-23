'use client';

import { useEffect } from 'react';
import { GoogleAdsenseUnit } from '@/components/business/google-adsense';
import { trackAdEvent, withUtm, type PublicAd } from '@/lib/ads';

export function AdCreative({ ad, className = '' }: { ad: PublicAd; className?: string }) {
  useEffect(() => {
    trackAdEvent('impression', ad.id);
  }, [ad.id]);

  const href = withUtm(ad.targetUrl, ad);

  if (ad.type === 'ADSENSE' || ad.provider === 'GOOGLE_ADSENSE') {
    if (!ad.adsenseClient || !ad.adsenseSlot) {
      return (
        <aside className={className} data-ad-id={ad.id} aria-label="Advertisement">
          <p className="text-xs text-slate-400">AdSense client and slot are required</p>
        </aside>
      );
    }
    return (
      <div className={className} data-ad-id={ad.id}>
        <GoogleAdsenseUnit client={ad.adsenseClient} slot={ad.adsenseSlot} />
      </div>
    );
  }

  if (ad.type === 'HTML' || ad.type === 'CTA' || ad.contentType === 'HTML' || ad.contentType === 'TEXT') {
    return (
      <aside
        className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}
        data-ad-id={ad.id}
        aria-label="Advertisement"
      >
        {ad.htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: ad.htmlContent }} />
        ) : (
          <p className="text-sm font-medium">{ad.name}</p>
        )}
        {href ? (
          <a
            href={href}
            className="mt-3 inline-block text-sm font-semibold text-[#0b1f3a] hover:underline"
            rel="sponsored noopener noreferrer"
            target="_blank"
            onClick={() => trackAdEvent('click', ad.id, { destinationUrl: href })}
          >
            Learn more
          </a>
        ) : null}
      </aside>
    );
  }

  if (ad.creativeUrl) {
    const img = (
      <img
        src={ad.creativeUrl}
        alt={ad.name}
        className="mx-auto max-h-40 w-auto object-contain"
        loading="lazy"
      />
    );
    return (
      <aside
        className={`flex min-h-[90px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 ${className}`}
        data-ad-id={ad.id}
        aria-label="Advertisement"
      >
        {href ? (
          <a
            href={href}
            rel="sponsored noopener noreferrer"
            target="_blank"
            onClick={() => trackAdEvent('click', ad.id, { destinationUrl: href })}
          >
            {img}
          </a>
        ) : (
          img
        )}
      </aside>
    );
  }

  return (
    <aside
      className={`flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center ${className}`}
      data-ad-id={ad.id}
      aria-label="Advertisement"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Advertisement</p>
        <p className="mt-1 text-sm text-slate-500">{ad.name}</p>
      </div>
    </aside>
  );
}
