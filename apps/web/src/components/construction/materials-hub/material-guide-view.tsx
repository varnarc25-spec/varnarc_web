import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionSection } from '@/components/construction/construction-section';
import {
  MATERIAL_HUB_QUALIFICATION,
  relatedMaterialPages,
  type MaterialGuidePage,
} from '@/lib/construction/materials-hub/catalog';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { cn, cx } from '@/components/construction/styles';

export function MaterialGuideView({ page }: { page: MaterialGuidePage }) {
  const related = relatedMaterialPages(page.relatedMaterialSlugs);
  const path = `/construction/materials/${page.slug}`;

  return (
    <ContentLayout
      title={page.name}
      description={page.shortDescription}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Materials', href: '/construction/materials' },
        { label: page.name },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Materials', path: '/construction/materials' },
          { name: page.name, path },
        ])}
        article={{
          title: page.seoTitle || page.name,
          description: page.seoDescription || page.shortDescription,
          path,
        }}
        faqs={page.faqs}
      />

      <p className="mb-6 text-sm text-slate-600">{MATERIAL_HUB_QUALIFICATION}</p>

      <div className="mb-8 flex flex-wrap gap-2">
        {page.calculator ? (
          <Link href={page.calculator.href} className={cx.primaryBtn}>
            {page.calculator.label}
          </Link>
        ) : null}
        {page.priceLink ? (
          <Link href={page.priceLink.href} className={cx.secondaryBtn}>
            {page.priceLink.label}
          </Link>
        ) : null}
        {page.comparisonLinks.slice(0, 2).map((l) => (
          <Link key={l.href} href={l.href} className={cx.secondaryBtn}>
            {l.label}
          </Link>
        ))}
      </div>

      <ConstructionSection title="Overview">
        <p className="text-sm leading-relaxed text-slate-700">{page.overview}</p>
      </ConstructionSection>

      <ConstructionSection title="Common uses">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          {page.commonUses.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Important specifications">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          {page.specifications.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </ConstructionSection>

      {page.calculator ? (
        <ConstructionSection title="Calculator">
          <p className="text-sm text-slate-700">
            Use the dedicated quantity tool for planning estimates. Results are indicative — not a
            substitute for drawings, BOQs or supplier quotes.
          </p>
          <Link href={page.calculator.href} className={cn(cx.primaryBtn, 'mt-4 inline-flex')}>
            Open {page.calculator.label}
          </Link>
        </ConstructionSection>
      ) : null}

      <ConstructionSection title="Current price range">
        {page.priceRange && page.priceRange.reliability !== 'unavailable' ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
              {page.priceRange.reliability === 'indicative' ? 'Indicative' : 'Estimated'} ·{' '}
              {page.priceRange.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{page.priceRange.detail}</p>
            {page.priceLink ? (
              <Link href={page.priceLink.href} className={cn(cx.link, 'mt-3 inline-block')}>
                {page.priceLink.label}
              </Link>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-700">
            No reliable live price feed is published for this material on Varnarc yet. Verify
            current rates with local suppliers.
          </p>
        )}
      </ConstructionSection>

      <ConstructionSection title="Price by location">
        <p className="mb-3 text-sm text-slate-600">
          Location rates move with freight, taxes and local supply. Figures below are planning
          context only — confirm before budgeting.
        </p>
        <ul className="space-y-3">
          {page.priceByLocation.map((row) => (
            <li key={row.location} className={cn(cx.card, 'p-3 sm:p-4')}>
              <p className="font-semibold text-[#0b1f3a]">{row.location}</p>
              <p className="mt-1 text-sm text-slate-700">{row.rangeLabel}</p>
              {row.note ? <p className="mt-1 text-xs text-slate-500">{row.note}</p> : null}
            </li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Types">
        <ul className="space-y-3">
          {page.types.map((t) => (
            <li key={t.name}>
              <p className="font-semibold text-[#0b1f3a]">{t.name}</p>
              <p className="mt-1 text-sm text-slate-700">{t.summary}</p>
            </li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Comparison options">
        <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {page.comparisonLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={cx.secondaryBtn}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Buying considerations">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          {page.buyingConsiderations.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionFAQ
        faqs={page.faqs.map((f, i) => ({
          id: `${page.slug}-faq-${i}`,
          question: f.question,
          answer: f.answer,
        }))}
      />

      {related.length ? (
        <ConstructionSection title="Related materials">
          <ul className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug} className={cn(cx.card, 'p-4')}>
                <Link
                  href={`/construction/materials/${r.slug}`}
                  className="font-semibold text-[#0b1f3a] hover:text-[#f97316]"
                >
                  {r.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.shortDescription}</p>
              </li>
            ))}
          </ul>
        </ConstructionSection>
      ) : null}

      <ConstructionSection title="Methodology & data sources">
        <p className="text-sm leading-relaxed text-slate-700">{page.methodology}</p>
        {page.guideLinks.length ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {page.guideLinks.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className={cx.link}>
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </ConstructionSection>
    </ContentLayout>
  );
}
