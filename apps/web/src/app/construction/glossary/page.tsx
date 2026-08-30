import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { ConstructionSeo } from '@/components/construction/construction-seo';
import {
  CONSTRUCTION_GLOSSARY_METHODOLOGY,
  CONSTRUCTION_GLOSSARY_QUALIFICATION,
  listConstructionGlossaryByCategory,
  listIndexableConstructionGlossaryTerms,
} from '@varnarc/validation';
import { constructionHubBreadcrumbs, resolveConstructionIndexing } from '@/lib/construction/seo';
import { cx } from '@/components/construction/styles';

export async function generateMetadata(): Promise<Metadata> {
  const indexing = resolveConstructionIndexing({
    pathname: '/construction/glossary',
  });
  const title = 'Construction Glossary — BOQ, RCC, Carpet Area & More | Varnarc';
  const description =
    'Construction terms explained with definitions, technical notes, examples, units and links to calculators — not thin dictionary stubs.';
  return {
    title,
    description,
    alternates: { canonical: indexing.canonicalUrl },
    robots: indexing.robots,
    openGraph: {
      title,
      description,
      url: indexing.canonicalUrl,
      type: 'website',
    },
  };
}

export const revalidate = 3600;

export default function ConstructionGlossaryHubPage() {
  const groups = listConstructionGlossaryByCategory();
  const all = listIndexableConstructionGlossaryTerms();

  return (
    <ContentLayout
      title="Construction glossary"
      description={CONSTRUCTION_GLOSSARY_QUALIFICATION}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Construction', href: '/construction' },
        { label: 'Glossary' },
      ]}
    >
      <ConstructionSeo
        breadcrumbs={constructionHubBreadcrumbs([
          { name: 'Glossary', path: '/construction/glossary' },
        ])}
        itemList={{
          name: 'Construction glossary',
          path: '/construction/glossary',
          items: all.map((t) => ({
            name: t.term,
            path: `/construction/glossary/${t.slug}`,
          })),
        }}
      />

      <section className="space-y-3">
        <p className="text-sm leading-relaxed text-slate-700">
          Look up common construction terms — from BOQ and RCC to carpet area and FSI — with enough
          depth to understand the idea and a clear next action (calculator, material page or related
          term).
        </p>
        <p className="text-xs text-slate-500">{CONSTRUCTION_GLOSSARY_METHODOLOGY}</p>
      </section>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Jump to category">
        {groups.map((g) => (
          <a key={g.category} href={`#${g.category}`} className={cx.secondaryBtn}>
            {g.label}
          </a>
        ))}
      </nav>

      <div className="mt-10 space-y-10">
        {groups.map((g) => (
          <section key={g.category} id={g.category} className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-bold text-[#0b1f3a]">{g.label}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.terms.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/construction/glossary/${t.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#f97316]/40"
                  >
                    <p className="font-bold text-[#0b1f3a]">{t.term}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {t.simpleDefinition}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#f97316]">Read more →</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/construction/faqs" className={cx.secondaryBtn}>
          Construction FAQs
        </Link>
        <Link href="/construction/calc" className={cx.secondaryBtn}>
          Calculation landings
        </Link>
        <Link href="/construction" className={cx.secondaryBtn}>
          Construction hub
        </Link>
      </div>
    </ContentLayout>
  );
}
