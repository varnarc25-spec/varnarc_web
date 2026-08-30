import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionFAQ } from '@/components/construction/construction-faq';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { ConstructionSection } from '@/components/construction/construction-section';
import { CompareCostPlanner } from '@/components/construction/compare-hub/compare-cost-planner';
import {
  COMPARE_ATTRIBUTE_LABELS,
  COMPARE_HUB_QUALIFICATION,
  type EditorialComparison,
} from '@/lib/construction/compare-hub/catalog';
import { constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { cn, cx } from '@/components/construction/styles';

function SideColumn({ side }: { side: EditorialComparison['left'] }) {
  return (
    <div className={cn(cx.card, 'space-y-4 p-4 sm:p-5')}>
      <div>
        <h3 className="text-lg font-bold text-[#0b1f3a]">{side.name}</h3>
        {side.materialHref ? (
          <Link href={side.materialHref} className={cn(cx.link, 'mt-1 inline-block')}>
            Material guide
          </Link>
        ) : null}
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
          Best suited for
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
          {side.bestSuitedFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Advantages</h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
          {side.advantages.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Limitations
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
          {side.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cost implications
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{side.costImplications}</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Things to verify
        </h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-700">
          {side.thingsToVerify.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EditorialCompareView({ page }: { page: EditorialComparison }) {
  const path = `/construction/compare/${page.slug}`;

  return (
    <ContentLayout
      title={page.title}
      description={page.shortSummary}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Compare', href: '/construction/compare' },
        { label: page.title },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Compare', path: '/construction/compare' },
          { name: page.title, path },
        ])}
        faqs={page.faqs}
      />

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-600">
        {COMPARE_HUB_QUALIFICATION}
      </p>

      <ConstructionSection title="Overview">
        <p className="text-sm leading-relaxed text-slate-700">{page.overview}</p>
      </ConstructionSection>

      <ConstructionSection title="Attribute comparison">
        <p className="mb-3 text-sm text-slate-600">
          Attributes are descriptive trade-offs — not scores or winners.
        </p>
        <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200/80">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-3 py-3 font-semibold text-slate-600 sm:px-4">Attribute</th>
                <th className="px-3 py-3 font-semibold text-[#0b1f3a] sm:px-4">{page.leftName}</th>
                <th className="px-3 py-3 font-semibold text-[#0b1f3a] sm:px-4">{page.rightName}</th>
              </tr>
            </thead>
            <tbody>
              {page.attributes.map((row) => (
                <tr key={row.key} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3 font-medium text-slate-600 sm:px-4">
                    {COMPARE_ATTRIBUTE_LABELS[row.key]}
                    {row.note ? (
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {row.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-slate-700 sm:px-4">{row.left}</td>
                  <td className="px-3 py-3 text-slate-700 sm:px-4">{row.right}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConstructionSection>

      <ConstructionSection title="Best suited for, advantages & limitations">
        <div className="grid gap-4 lg:grid-cols-2">
          <SideColumn side={page.left} />
          <SideColumn side={page.right} />
        </div>
      </ConstructionSection>

      <ConstructionSection title="Shared things to verify">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
          {page.sharedThingsToVerify.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Project-specific cost comparison">
        <CompareCostPlanner
          leftName={page.leftName}
          rightName={page.rightName}
          model={page.costModel}
        />
      </ConstructionSection>

      <ConstructionFAQ
        faqs={page.faqs.map((f, i) => ({
          id: `${page.slug}-faq-${i}`,
          question: f.question,
          answer: f.answer,
        }))}
      />

      <ConstructionSection title="Related tools & guides">
        <ul className="flex flex-wrap gap-2">
          {page.relatedLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={cx.secondaryBtn}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </ConstructionSection>

      <ConstructionSection title="Methodology & data sources">
        <p className="text-sm leading-relaxed text-slate-700">{page.methodology}</p>
        <Link href="/construction/compare" className={cn(cx.link, 'mt-3 inline-block')}>
          ← All editorial comparisons
        </Link>
      </ConstructionSection>
    </ContentLayout>
  );
}
