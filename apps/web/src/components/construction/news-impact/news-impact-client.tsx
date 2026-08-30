'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CONSTRUCTION_NEWS_IMPACT_METHODOLOGY,
  CONSTRUCTION_NEWS_IMPACT_QUALIFICATION,
  buildConstructionNewsImpact,
  listNewsImpactMaterials,
  type ConstructionNewsImpactMeta,
} from '@varnarc/validation';
import {
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  CalculatorShell,
  MethodologyPanel,
} from '@/components/construction/calculator';
import { ConstructionRelatedLinks } from '@/components/construction/construction-related-links';
import { cn, cx } from '@/components/construction/styles';
import { NEWS_IMPACT_FAQS, NEWS_IMPACT_RELATED, NEWS_IMPACT_SEO } from './content';

const DEMO_META: ConstructionNewsImpactMeta = {
  schemaVersion: 1,
  vertical: 'construction',
  reportedNews: {
    articleSlug: 'cement-supply-update-hyderabad',
    articleTitle: 'Cement supply update in Hyderabad (demo)',
    articlePath: '/articles/cement-supply-update-hyderabad',
    publishedAt: '2026-08-15T10:00:00.000Z',
    summary:
      'Demo article metadata. Real articles will carry constructionNewsImpact in CMS metadata.',
  },
  affectedMaterials: [
    { materialKey: 'cement', assumedUnitChangeInr: 15, unit: 'bag' },
    { materialKey: 'steel', assumedUnitChangeInr: 2, unit: 'kg' },
    { materialKey: 'sand', assumedUnitChangeInr: null, unit: 'm3' },
    { materialKey: 'paint', assumedUnitChangeInr: null, unit: 'litre' },
  ],
  doesNotGuaranteePriceMove: true,
};

export function NewsImpactClient() {
  const materials = listNewsImpactMaterials();
  const [cementBags, setCementBags] = useState('620');
  const [steelKg, setSteelKg] = useState('');
  const [bagDelta, setBagDelta] = useState('15');

  const meta = useMemo((): ConstructionNewsImpactMeta => {
    const delta = Number(bagDelta);
    return {
      ...DEMO_META,
      affectedMaterials: DEMO_META.affectedMaterials.map((m) =>
        m.materialKey === 'cement'
          ? {
              ...m,
              assumedUnitChangeInr: Number.isFinite(delta) ? delta : 15,
            }
          : m,
      ),
    };
  }, [bagDelta]);

  const requirements = useMemo(() => {
    const rows: Array<{ nameOrKey: string; quantity: number; unit: string; source: 'manual' }> = [];
    const bags = Number(cementBags);
    if (Number.isFinite(bags) && bags > 0) {
      rows.push({ nameOrKey: 'cement', quantity: bags, unit: 'bag', source: 'manual' });
    }
    const steel = Number(steelKg);
    if (Number.isFinite(steel) && steel > 0) {
      rows.push({ nameOrKey: 'steel', quantity: steel, unit: 'kg', source: 'manual' });
    }
    return rows;
  }, [cementBags, steelKg]);

  const bundle = useMemo(
    () =>
      buildConstructionNewsImpact({
        meta,
        projectRequirements: requirements,
      }),
    [meta, requirements],
  );

  const formNode = (
    <CalculatorForm
      calculatorType="construction_news_impact"
      onSubmit={(e) => e.preventDefault()}
      onReset={() => {
        setCementBags('620');
        setSteelKg('');
        setBagDelta('15');
      }}
      submitLabel="Update scenario"
    >
      <p className="sm:col-span-2 text-sm text-slate-600">
        Demo uses sample article metadata. Enter project quantities to see layer 3 arithmetic —
        leave blank to see the unavailable gate.
      </p>
      <CalculatorInput
        id="ni-cement-qty"
        label="Project cement quantity (bags)"
        type="number"
        min={0}
        value={cementBags}
        onChange={(e) => setCementBags(e.target.value)}
        hint="Required for cement impact"
      />
      <CalculatorInput
        id="ni-cement-delta"
        label="Scenario: ₹ change per bag"
        type="number"
        value={bagDelta}
        onChange={(e) => setBagDelta(e.target.value)}
        hint="Assumption only — not a forecast"
      />
      <CalculatorInput
        id="ni-steel-qty"
        label="Project steel quantity (kg, optional)"
        type="number"
        min={0}
        value={steelKg}
        onChange={(e) => setSteelKg(e.target.value)}
        className="sm:col-span-2"
      />
      <CalculatorSelect
        id="ni-materials-ref"
        label="Taggable materials (reference)"
        value="cement"
        onChange={() => undefined}
        options={materials.map((m) => ({
          value: m.key,
          label: `${m.label} · ${m.unitHint}`,
        }))}
        className="sm:col-span-2"
      />
    </CalculatorForm>
  );

  const resultNode = (
    <div className="space-y-4">
      {/* Layer 1 */}
      <section className={cn(cx.card, 'space-y-3 p-4 sm:p-5')} aria-label="Reported news">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          1 · Reported news
        </p>
        <h3 className="text-base font-bold text-[#0b1f3a]">{bundle.reportedNews.articleTitle}</h3>
        {bundle.reportedNews.summary ? (
          <p className="text-sm text-slate-600">{bundle.reportedNews.summary}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={bundle.reportedNews.articleHref} className={cx.secondaryBtn}>
            Original article
          </Link>
          {bundle.reportedNews.materialPageHrefs.map((m) => (
            <Link key={m.materialKey} href={m.href} className={cx.secondaryBtn}>
              {m.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Layer 2 */}
      <section className={cn(cx.card, 'space-y-3 p-4 sm:p-5')} aria-label="Scenario assumptions">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          2 · Scenario assumption
        </p>
        {bundle.scenarios.length === 0 ? (
          <p className="text-sm text-slate-600">No illustrative unit-price deltas tagged.</p>
        ) : (
          <ul className="space-y-2">
            {bundle.scenarios.map((s) => (
              <li
                key={`${s.materialKey}-${s.assumedUnitChangeInr}`}
                className="rounded-lg bg-amber-50/80 px-3 py-2 text-sm text-slate-800 ring-1 ring-amber-200"
              >
                <p className="font-semibold">{s.label}</p>
                <p className="mt-1 text-xs text-slate-600">{s.disclaimer}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Layer 3 */}
      <section
        className={cn(cx.card, 'space-y-3 p-4 sm:p-5')}
        aria-label="Calculated potential project impact"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          3 · Calculated potential project impact
        </p>
        <ul className="space-y-2">
          {bundle.projectImpacts.map((impact) => (
            <li
              key={impact.materialKey}
              className={cn(
                'rounded-lg px-3 py-2 text-sm ring-1',
                impact.status === 'ok'
                  ? 'bg-slate-50 text-slate-800 ring-slate-200'
                  : 'bg-slate-50 text-slate-600 ring-slate-200',
              )}
            >
              {impact.status === 'ok' ? (
                <>
                  <p className="font-semibold leading-relaxed">{impact.copy}</p>
                  <p className="mt-1 text-xs text-slate-500">{impact.disclaimer}</p>
                </>
              ) : (
                <p>
                  <span className="font-semibold text-slate-800">
                    {impact.materialKey}: unavailable.
                  </span>{' '}
                  {impact.reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">{bundle.qualification}</p>
    </div>
  );

  return (
    <>
      <CalculatorShell
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Construction', href: '/construction' },
          { label: 'News impact' },
        ]}
        title="Construction News Impact"
        description={NEWS_IMPACT_SEO}
        lastUpdated="Aug 2026"
        form={formNode}
        result={resultNode}
        methodology={
          <MethodologyPanel
            title="How layers work"
            formula="potential impact ≈ project quantity × |assumed ₹/unit change|"
            steps={[
              CONSTRUCTION_NEWS_IMPACT_METHODOLOGY,
              CONSTRUCTION_NEWS_IMPACT_QUALIFICATION,
              'Links: original article + /construction/materials/{key} for each affected material.',
            ]}
          />
        }
        faqs={NEWS_IMPACT_FAQS.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }))}
        relatedTools={NEWS_IMPACT_RELATED}
      />
      <div className="site-container pb-12">
        <ConstructionRelatedLinks calculators={NEWS_IMPACT_RELATED} />
      </div>
    </>
  );
}
