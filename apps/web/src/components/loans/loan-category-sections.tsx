import Link from 'next/link';
import type { LoanCategorySection } from '@/lib/loan-category-page';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { ContextualLinkList } from '@/components/loans/contextual-link-list';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';

export function LoanCategoryEducation({
  categoryName,
  sections,
}: {
  categoryName: string;
  sections: LoanCategorySection[];
}) {
  if (!sections.length) return null;

  return (
    <section
      id="category-education"
      aria-labelledby="category-education-heading"
      className="full-bleed bg-[var(--varnarc-bg,#f7f8fb)]"
    >
      <div className="site-container px-4 py-10 sm:py-12 lg:py-16">
        <LoanSectionHeader
          id="category-education-heading"
          eyebrow="Learn"
          title={`Understanding ${categoryName}`}
          description="Educational overview only — not personalised advice or a credit offer. Confirm final terms with the lender."
        />

        <div className="grid gap-3 lg:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.key}
              id={`education-${section.key}`}
              className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80"
            >
              <h3 className="text-base font-bold tracking-tight text-[#0b1f3a]">{section.title}</h3>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-600">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LoanCategoryStatsBar({
  stats,
}: {
  stats: Array<{ key: string; label: string; value: string }>;
}) {
  if (!stats.length) return null;

  return (
    <section
      aria-label="Category summary from listed products"
      className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
    >
      {stats.map((stat) => (
        <div key={stat.key} className="rounded-xl bg-[#f8fafc] px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {stat.label}
          </p>
          <p className="mt-1 text-sm font-extrabold tabular-nums text-[#0b1f3a]">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}

export function LoanCategoryRelatedCalculators({
  links,
  categoryName,
}: {
  links: ContextualLink[];
  categoryName: string;
}) {
  if (!links.length) return null;

  return (
    <section id="related-calculators" aria-labelledby="category-related-calculators-heading">
      <LoanSectionHeader
        id="category-related-calculators-heading"
        title="Related calculators"
        description={`Tools for ${categoryName.toLowerCase()} planning. Estimates only — not lender approvals.`}
        action={{ href: '/calculators', label: 'Browse all calculators →' }}
      />
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#0b1f3a] transition hover:bg-white hover:text-[#f97316] hover:ring-1 hover:ring-slate-200/80"
            >
              <span>{link.label}</span>
              <span
                className="inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <ContextualLinkList
          links={[{ label: 'Browse all calculators', href: '/calculators' }]}
          label="More tools"
        />
      </div>
    </section>
  );
}
