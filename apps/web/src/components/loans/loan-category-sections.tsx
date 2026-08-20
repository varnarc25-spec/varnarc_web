import Link from 'next/link';
import type { LoanCategorySection } from '@/lib/loan-category-page';
import type { ContextualLink } from '@/lib/loan-contextual-links';
import { ContextualLinkList } from '@/components/loans/contextual-link-list';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';

function ProseBody({ body }: { body: string }) {
  return <p className="max-w-prose text-sm leading-relaxed text-slate-600">{body}</p>;
}

function StepperVisual({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li
          key={step}
          className="relative rounded-xl bg-[#f8fafc] px-3.5 py-3 ring-1 ring-slate-200/70"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">
            {index + 1}
          </span>
          <p className="mt-2 text-sm font-semibold leading-snug text-[#0b1f3a]">{step}</p>
        </li>
      ))}
    </ol>
  );
}

function FactorCards({ factors }: { factors: Array<{ title: string; detail: string }> }) {
  return (
    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {factors.map((factor) => (
        <li
          key={factor.title}
          className="rounded-xl bg-[#f8fafc] px-3.5 py-3 ring-1 ring-slate-200/70"
        >
          <p className="text-sm font-bold text-[#0b1f3a]">{factor.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{factor.detail}</p>
        </li>
      ))}
    </ul>
  );
}

function CompareTable({
  headers,
  rows,
}: {
  headers: [string, string];
  rows: Array<{ label: string; left: string; right: string }>;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200/80">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-[#0b1f3a] text-white">
          <tr>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">
              Factor
            </th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">
              {headers[0]}
            </th>
            <th scope="col" className="px-3.5 py-2.5 font-semibold">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-200/80 bg-white odd:bg-[#f8fafc]">
              <th scope="row" className="px-3.5 py-2.5 font-semibold text-[#0b1f3a]">
                {row.label}
              </th>
              <td className="px-3.5 py-2.5 text-slate-600">{row.left}</td>
              <td className="px-3.5 py-2.5 text-slate-600">{row.right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 rounded-xl bg-[#f8fafc] px-3.5 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200/70"
        >
          <span className="mt-0.5 text-[#f97316]" aria-hidden>
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-slate-200/70">
        <p className="text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">Advantages</p>
        <ul className="mt-2 space-y-1.5">
          {pros.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-700">
              <span className="text-[#f97316]" aria-hidden>
                +
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-slate-200/70">
        <p className="text-xs font-bold uppercase tracking-wide text-[#0b1f3a]">Considerations</p>
        <ul className="mt-2 space-y-1.5">
          {cons.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-700">
              <span className="text-slate-400" aria-hidden>
                –
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EducationBlock({ section }: { section: LoanCategorySection }) {
  const layout = section.layout ?? 'prose';

  return (
    <article
      id={`education-${section.key}`}
      className={
        layout === 'prose'
          ? 'rounded-2xl bg-white p-5 ring-1 ring-slate-200/80'
          : 'rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 lg:col-span-2'
      }
    >
      <h3 className="text-base font-bold tracking-tight text-[#0b1f3a]">{section.title}</h3>
      <div className="mt-2">
        <ProseBody body={section.body} />
      </div>
      {layout === 'stepper' && section.steps?.length ? (
        <StepperVisual steps={section.steps} />
      ) : null}
      {layout === 'factor-cards' && section.factors?.length ? (
        <FactorCards factors={section.factors} />
      ) : null}
      {layout === 'compare-table' && section.compareHeaders && section.compareRows?.length ? (
        <CompareTable headers={section.compareHeaders} rows={section.compareRows} />
      ) : null}
      {layout === 'checklist' && section.checklist?.length ? (
        <Checklist items={section.checklist} />
      ) : null}
      {layout === 'pros-cons' && (section.pros?.length || section.cons?.length) ? (
        <ProsCons pros={section.pros ?? []} cons={section.cons ?? []} />
      ) : null}
    </article>
  );
}

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
            <EducationBlock key={section.key} section={section} />
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
