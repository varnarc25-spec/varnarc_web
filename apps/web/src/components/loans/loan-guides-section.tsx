import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { LoanGuideCardModel } from '@/lib/loan-guides';
import { financeGuidesPath } from '@/lib/finance-routes';
import { LoanSectionHeader } from '@/components/loans/loan-section-header';
import { LoanIllustrationFrame } from '@/components/loans/loan-illustration-frame';

export function LoanGuidesSection({
  guides,
  title = 'Latest Loan Guides',
  description = 'Practical explainers on loans, EMI, eligibility, and credit.',
  actionLabel = 'View All Loan Guides →',
}: {
  guides: LoanGuideCardModel[];
  title?: string;
  description?: string;
  actionLabel?: string;
}) {
  if (!guides.length) return null;

  return (
    <section id="loan-guides-heading" aria-labelledby="loan-guides-title">
      <LoanSectionHeader
        id="loan-guides-title"
        title={title}
        description={description}
        action={{ href: financeGuidesPath(), label: actionLabel }}
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const updated = formatDate(guide.updatedAt);

          return (
            <li key={guide.id} className="min-w-0">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 transition hover:ring-[#0b1f3a]/25 hover:shadow-[0_6px_20px_rgba(11,31,58,0.06)] motion-reduce:transition-none">
                <Link
                  href={guide.href}
                  className="relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f97316]"
                >
                  <LoanIllustrationFrame
                    src={guide.imageUrl}
                    alt={`${guide.title} cover`}
                    aspect="16/10"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    objectFit="contain"
                    className="rounded-none"
                    imgClassName="p-3 sm:p-4"
                    hoverScale
                    width={480}
                    height={300}
                  />
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#f97316]">
                    {guide.categoryLabel}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-[#0b1f3a]">
                    <Link href={guide.href} className="hover:text-[#f97316]">
                      {guide.title}
                    </Link>
                  </h3>
                  {guide.excerpt ? (
                    <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600">
                      {guide.excerpt}
                    </p>
                  ) : (
                    <span className="flex-1" />
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {updated ? (
                      <time dateTime={guide.updatedAt ?? undefined}>Updated {updated}</time>
                    ) : null}
                    {updated && guide.readingTimeMinutes != null ? (
                      <span aria-hidden>·</span>
                    ) : null}
                    {guide.readingTimeMinutes != null ? (
                      <span>{guide.readingTimeMinutes} min read</span>
                    ) : null}
                  </div>

                  <Link
                    href={guide.href}
                    className="group/link mt-3 inline-flex w-fit items-center text-xs font-semibold text-[#0b1f3a] hover:text-[#f97316]"
                  >
                    Read Guide
                    <span
                      className="ml-1 inline-block transition-transform group-hover/link:translate-x-0.5 motion-reduce:transform-none"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
