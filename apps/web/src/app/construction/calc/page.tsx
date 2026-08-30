import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  INTENT_CALC_METHODOLOGY,
  INTENT_CALC_QUALIFICATION,
  listIndexableIntentCalcLandings,
  INTENT_CALC_TOPICS,
  INTENT_CALC_AREAS,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

export async function generateMetadata(): Promise<Metadata> {
  const indexing = resolveConstructionIndexing({
    pathname: '/construction/calc',
  });
  const title = 'House Construction Calculations — Cement, Steel & Cost | Varnarc';
  const description =
    'Curated high-intent calculation pages: cement/steel required and construction cost for common house sizes. Validated logic only — no keyword spam.';
  return {
    title,
    description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
  };
}

export const revalidate = 3600;

export default function IntentCalcHubPage() {
  const landings = listIndexableIntentCalcLandings();

  const byTopic = new Map<string, typeof landings>();
  for (const item of landings) {
    const list = byTopic.get(item.topic) ?? [];
    list.push(item);
    byTopic.set(item.topic, list);
  }

  return (
    <ContentLayout
      title="House construction calculations"
      description={INTENT_CALC_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Calculations' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Calculations', path: '/construction/calc' },
        ])}
        itemList={{
          name: 'Calculation landings',
          path: '/construction/calc',
          items: landings.map((l) => ({
            name: `${INTENT_CALC_TOPICS[l.topic].label} · ${INTENT_CALC_AREAS[l.area].label}`,
            path: l.path,
          })),
        }}
      />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">
          These pages answer high-intent questions such as cement or steel required for a specific
          house size, and construction cost for common built-up areas. Every page uses the same
          validated engines as our interactive calculators — we only publish a curated allowlist,
          not combinatorial keyword URLs.
        </p>
        <p className="text-xs text-slate-500">{INTENT_CALC_METHODOLOGY}</p>
      </section>

      <div className="mt-8 space-y-8">
        {[...byTopic.entries()].map(([topic, items]) => (
          <section key={topic} className="space-y-3">
            <h2 className="text-lg font-bold text-[#0b1f3a]">
              {INTENT_CALC_TOPICS[topic as keyof typeof INTENT_CALC_TOPICS].label}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {items.map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className={cx.secondaryBtn}>
                    {INTENT_CALC_AREAS[item.area].label} house
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/construction/cement-calculator" className={cx.primaryBtn}>
          Cement calculator
        </Link>
        <Link href="/construction/steel-calculator" className={cx.secondaryBtn}>
          Steel calculator
        </Link>
        <Link href="/construction/cost-calculator" className={cx.secondaryBtn}>
          Cost calculator
        </Link>
      </div>
    </ContentLayout>
  );
}
