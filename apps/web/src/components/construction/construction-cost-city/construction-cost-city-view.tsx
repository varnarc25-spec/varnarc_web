import Link from 'next/link';
import type { ConstructionCostCityLanding } from '@varnarc/validation';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { cn, cx } from '@/components/construction/styles';

function money(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00.000Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ConstructionCostCityView({ landing }: { landing: ConstructionCostCityLanding }) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">{landing.editorialIntro}</p>
        <p className="text-xs text-slate-500">
          Local rate update: {formatDate(landing.localRateUpdatedAt)}
          {landing.localRateUpdateSource === 'material_observations'
            ? ' (from latest local material observations)'
            : ' (editorial stamp)'}
          {' · '}
          Location multiplier ×{landing.locationMultiplier} vs national base ₹
          {landing.nationalBaseRatePerSqft.toLocaleString('en-IN')}/sq ft
        </p>
      </section>

      <section className={cn(cx.card, 'grid gap-4 p-4 sm:grid-cols-3 sm:p-5')}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Indicative mid total
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-[#0b1f3a]">
            {money(landing.indicativeRange.mid)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Reference {landing.referenceAreaSqft.toLocaleString('en-IN')} sq ft · 2 floors ·
            standard quality
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Likely range
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-800">
            {money(landing.indicativeRange.low)} – {money(landing.indicativeRange.high)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Cost per sq ft
            {landing.costPerSqftReliable ? '' : ' (limited data)'}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-800">
            {money(landing.costPerSqft)}
            <span className="text-sm font-semibold text-slate-500"> / sq ft</span>
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={landing.calculatorHref} className={cx.primaryBtn}>
          Open calculator prefilled for {landing.city.name}
        </Link>
        <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
          Full cost calculator
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Construction quality scenarios</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {landing.qualityScenarios.map((s) => (
            <div key={s.quality} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-[#0b1f3a]">{s.label}</p>
              <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">
                {money(s.estimatedTotal)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {money(s.costPerSqft)}/sq ft · range {money(s.rangeLow)} – {money(s.rangeHigh)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Material-cost overview</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Material</th>
                <th className="px-3 py-2 font-semibold">Current (local)</th>
                <th className="px-3 py-2 font-semibold">Freshness</th>
                <th className="px-3 py-2 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody>
              {landing.materialOverview.map((m) => (
                <tr key={m.materialKey} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{m.label}</td>
                  <td className="px-3 py-2 tabular-nums text-slate-700">
                    {m.currentPrice != null ? `${money(m.currentPrice)} / ${m.unit}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {m.freshnessLabel ?? 'No current observation'}
                    {m.ageDays != null ? ` · ${m.ageDays}d` : ''}
                  </td>
                  <td className="px-3 py-2">
                    <Link href={m.href} className="font-semibold text-[#f97316]">
                      Prices
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Labour assumptions</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.labourAssumptions}</p>
        <p className="text-sm leading-relaxed text-slate-700">{landing.marketNotes}</p>
      </section>

      {landing.historicalTrend.available ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f3a]">
            Historical trend ({landing.historicalTrend.materialLabel})
          </h2>
          <p className="text-xs text-slate-500">{landing.historicalTrend.note}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {landing.historicalTrend.changes.map((c) => (
              <div key={c.key} className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {c.label}
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-slate-800">
                  {c.available && c.percent != null
                    ? `${c.percent > 0 ? '+' : ''}${c.percent}%`
                    : 'No data'}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-1">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Historical trend</h2>
          <p className="text-sm text-slate-600">{landing.historicalTrend.note}</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0b1f3a]">Methodology</h2>
        <p className="text-sm leading-relaxed text-slate-700">{landing.methodology}</p>
        <p className="text-xs text-slate-500">{landing.qualification}</p>
      </section>

      {landing.relatedMaterialPriceHrefs.length ? (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related local material prices</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.relatedMaterialPriceHrefs.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={cx.secondaryBtn}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {landing.relatedCityHrefs.length ? (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related city pages</h2>
          <ul className="flex flex-wrap gap-2">
            {landing.relatedCityHrefs.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={cx.secondaryBtn}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConstructionFAQ faqs={landing.faqs.map((f, i) => ({ id: `faq-${i}`, ...f }))} />
    </div>
  );
}
