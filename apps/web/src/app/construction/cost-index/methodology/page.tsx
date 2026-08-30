import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import { fetchVcciMethodology } from '@/lib/construction/vcci/api';
import {
  VCCI_METHODOLOGY_SECTIONS,
  VCCI_METHODOLOGY_VERSION,
  VCCI_NAME,
  VCCI_SHORT_NAME,
} from '@varnarc/validation';
import { buildConstructionPageMetadata, constructionHubBreadcrumbs } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

export async function generateMetadata() {
  return buildConstructionPageMetadata('cost-index-methodology');
}

export const revalidate = 300;

export default async function VcciMethodologyPage() {
  const remote = await fetchVcciMethodology();
  const sections = remote?.sections?.length ? remote.sections : [...VCCI_METHODOLOGY_SECTIONS];
  const components = remote?.components ?? [];
  const weights = remote?.activeMethodology?.weights;

  return (
    <ContentLayout
      title={`${VCCI_SHORT_NAME} methodology`}
      description={`Technical methodology for the ${VCCI_NAME}: baseline, weights, sources, update cadence and limitations.`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Cost index', href: '/construction/cost-index' },
        { label: 'Methodology' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Cost index', path: '/construction/cost-index' },
          { name: 'Methodology', path: '/construction/cost-index/methodology' },
        ])}
      />

      <p className="mb-6 text-sm text-slate-600">
        Framework version <strong>{remote?.frameworkVersion ?? VCCI_METHODOLOGY_VERSION}</strong>
        {remote?.activeMethodology
          ? ` · active DB methodology ${remote.activeMethodology.version}`
          : ' · methodology definition from framework defaults'}
        . Numeric index values are published separately only when quality gates pass.
      </p>

      <div className="mx-auto max-w-3xl">
        <nav
          aria-label="On this page"
          className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On this page</p>
          <ol className="mt-2 columns-1 gap-x-6 space-y-1.5 text-sm sm:columns-2">
            {sections.map((section) => (
              <li key={section.id} className="break-inside-avoid">
                <a href={`#${section.id}`} className="font-medium text-[#f97316] hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-2">
              <h2 className="text-lg font-extrabold text-[#0b1f3a]">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        {components.length ? (
          <section id="component-table" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">Component catalogue</h2>
            <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Component</th>
                    <th className="px-3 py-2">Default weight</th>
                    <th className="px-3 py-2">Source hint</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((c) => (
                    <tr key={c.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-[#0b1f3a]">{c.label}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {((weights?.[c.key] ?? c.defaultWeight) * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-2 text-slate-600">{c.sourceHint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
          <Link href="/construction/cost-index" className={cx.primaryBtn}>
            Cost index hub
          </Link>
          <Link href="/construction/prices" className={cx.secondaryBtn}>
            Prices hub
          </Link>
          <Link href="/construction/estimate" className={cx.secondaryBtn}>
            Cost estimator
          </Link>
        </div>
      </div>
    </ContentLayout>
  );
}
