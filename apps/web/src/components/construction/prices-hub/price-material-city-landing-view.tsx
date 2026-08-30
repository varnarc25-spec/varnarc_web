import Link from 'next/link';
import type { PriceLandingPayload } from '@/lib/construction/prices-hub/api';
import { PriceHistoryPanel } from '@/components/construction/prices-hub/price-history-panel';
import { PricePositionEmbed } from '@/components/construction/price-position/price-position-embed';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { cn, cx } from '@/components/construction/styles';

function money(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00.000Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PriceMaterialCityLandingView({ landing }: { landing: PriceLandingPayload }) {
  const { seo, current, material, city } = landing;
  if (!seo) return null;

  const currency = current?.currency ?? 'INR';

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">{seo.editorialIntro}</p>
        <p className="text-sm leading-relaxed text-slate-700">{seo.localMarketNote}</p>
        <p className="text-xs text-slate-500">{seo.qualification}</p>
      </section>

      <section className={cn(cx.card, 'grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5')}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Current / reference
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
            {current ? money(current.price, currency) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {current ? `${current.freshnessLabel}` : 'No reliable current observation'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Unit</p>
          <p className="mt-1 text-lg font-bold text-slate-800">{seo.unit ?? material.unitHint}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Observed range
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-800">
            {seo.priceRange
              ? `${money(seo.priceRange.low, currency)} – ${money(seo.priceRange.high, currency)}`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across recorded observations</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Last updated
          </p>
          <p className="mt-1 text-lg font-bold text-slate-800">
            {seo.lastUpdatedIso ? formatDate(seo.lastUpdatedIso) : '—'}
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={seo.calculatorHref} className={cx.primaryBtn}>
          {seo.calculatorLabel}
        </Link>
        <Link
          href={`/construction/price-position?material=${material.key}&location=${city.slug}`}
          className={cx.secondaryBtn}
        >
          Price position
        </Link>
        <Link
          href={`/construction/prices?material=${material.key}&location=${city.slug}`}
          className={cx.secondaryBtn}
        >
          Prices hub filter
        </Link>
      </div>

      <PriceHistoryPanel
        current={landing.current}
        history={landing.history}
        changes={landing.changes ?? []}
        materialLabel={material.label}
        cityName={city.name}
      />

      <PricePositionEmbed
        materialKey={material.key}
        citySlug={city.slug}
        materialLabel={material.label}
        cityName={city.name}
        history={landing.history}
      />

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Calculation example</h2>
        <p className="text-sm leading-relaxed text-slate-700">{seo.calculationExample}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Methodology</h2>
        <p className="text-sm leading-relaxed text-slate-700">{seo.methodology}</p>
      </section>

      {(seo.relatedCityHrefs.length > 0 || seo.relatedMaterialHrefs.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related pages</h2>
          {seo.relatedMaterialHrefs.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Other materials in {city.name}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {seo.relatedMaterialHrefs.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className={cx.secondaryBtn}>
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {seo.relatedCityHrefs.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {material.label} in nearby / related cities
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {seo.relatedCityHrefs.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href} className={cx.secondaryBtn}>
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}

      <ConstructionFAQ
        title={`${material.label} prices in ${city.name} — FAQs`}
        faqs={seo.faqs.map((f, i) => ({ id: `faq-${i}`, ...f }))}
      />
    </div>
  );
}
