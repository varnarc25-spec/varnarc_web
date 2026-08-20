import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata: Metadata = {
  title: 'Corrections Policy',
  description:
    'How Varnarc handles errors, corrections, and content updates to maintain accuracy across all published content.',
  alternates: { canonical: '/corrections' },
};

export default function CorrectionsPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Corrections Policy' }]} />

      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Corrections Policy
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
        Accuracy is fundamental to Varnarc's mission. Despite careful research, review, and
        fact-checking, errors can occur — rates change, policies are updated, and data can be
        entered incorrectly. When that happens, we are committed to correcting the record promptly
        and transparently. This policy explains how we handle corrections across all Varnarc
        content.
      </p>

      <div className="mt-10 max-w-3xl space-y-10">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Reporting an Error</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            If you find an error on Varnarc — whether it's an incorrect interest rate, an outdated
            policy detail, a broken calculator, or a factual mistake — we want to know about it. You
            can report errors through:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Correction form:</strong>{' '}
              <Link
                href="/contact?type=correction"
                className="font-medium text-blue-600 hover:underline"
              >
                Submit a correction report
              </Link>{' '}
              — the fastest way to reach our editorial team with specific details about the error.
            </li>
            <li>
              <strong className="text-slate-950">Email:</strong>{' '}
              <a
                href="mailto:editorial@varnarc.com"
                className="font-medium text-blue-600 hover:underline"
              >
                editorial@varnarc.com
              </a>{' '}
              — include the page URL and a description of the issue.
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Helpful details to include: the URL of the page, what the error is, what the correct
            information should be (if known), and any supporting source or reference.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">How We Handle Corrections</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            When a potential error is reported or identified internally, we follow a consistent
            process:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Investigation.</strong> A member of our editorial
              team reviews the reported issue, verifies the current content against authoritative
              sources, and determines whether a correction is needed.
            </li>
            <li>
              <strong className="text-slate-950">Correction.</strong> If the error is confirmed, the
              content is updated with accurate information. The correction is made as quickly as
              possible — financial content corrections are prioritized.
            </li>
            <li>
              <strong className="text-slate-950">Transparency.</strong> A correction notice is added
              to the page indicating what was changed and when (see Correction Notices below).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Types of Corrections</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            We distinguish between different types of content issues:
          </p>
          <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Factual errors.</strong> Incorrect statements of
              fact — for example, a wrong regulatory requirement, an incorrect eligibility
              criterion, or a misattributed statistic. These are corrected immediately with a
              correction notice.
            </li>
            <li>
              <strong className="text-slate-950">Outdated data.</strong> Rates, prices, or policy
              details that were accurate at the time of publication but have since changed. These
              are updated with fresh data and the "last updated" date is revised.
            </li>
            <li>
              <strong className="text-slate-950">Calculation errors.</strong> Mistakes in calculator
              formulas, incorrect default values, or computational bugs. These are treated as
              high-priority fixes, especially for financial calculators.
            </li>
            <li>
              <strong className="text-slate-950">Editorial updates.</strong> Minor improvements to
              clarity, grammar, formatting, or structure that do not change the substance of the
              content. These do not require a correction notice but are reflected in the page's
              update date.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Correction Notices</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            When a substantive correction is made, we add a visible notice to the affected page that
            includes:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>The date the correction was made</li>
            <li>A brief description of what was corrected</li>
            <li>
              The reason for the correction (e.g., factual error, updated data, calculation fix)
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Correction notices remain on the page permanently so readers can see the content's
            revision history. For routine data updates (e.g., monthly rate changes), the "last
            updated" date is refreshed without a separate correction notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Financial Content Corrections</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Errors in financial content — including loan calculators, investment tools, tax guides,
            and insurance comparisons — receive priority handling because of their potential impact
            on readers' financial decisions:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>Reported errors in financial content are reviewed within one business day.</li>
            <li>
              If a calculator or tool is producing materially incorrect results, it may be
              temporarily taken offline while the fix is implemented.
            </li>
            <li>
              Corrections to financial content are reviewed by a team member with relevant finance
              knowledge before publication.
            </li>
            <li>
              Correction notices on financial pages include additional context about the potential
              impact of the error.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Timeline</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            We aim to handle corrections within the following timeframes:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Acknowledgment:</strong> Within 1 business day of
              receiving a correction report.
            </li>
            <li>
              <strong className="text-slate-950">Financial content corrections:</strong>{' '}
              Investigated and corrected within 1–2 business days.
            </li>
            <li>
              <strong className="text-slate-950">General content corrections:</strong> Investigated
              and corrected within 3–5 business days.
            </li>
            <li>
              <strong className="text-slate-950">Data refreshes:</strong> Handled on the regular
              update cycle for the relevant category (see our{' '}
              <Link
                href="/methodology#updates"
                className="font-medium text-blue-600 hover:underline"
              >
                Methodology
              </Link>{' '}
              page).
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Complex issues that require research or external verification may take longer. In such
            cases, we will acknowledge the report and provide an estimated timeline.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            To report an error or ask about a correction, use our{' '}
            <Link
              href="/contact?type=correction"
              className="font-medium text-blue-600 hover:underline"
            >
              correction report form
            </Link>{' '}
            or email{' '}
            <a
              href="mailto:editorial@varnarc.com"
              className="font-medium text-blue-600 hover:underline"
            >
              editorial@varnarc.com
            </a>
            .
          </p>
        </section>

        <p className="border-t border-slate-100 pt-6 text-xs text-slate-400">
          Last updated: August 2026
        </p>
      </div>
    </main>
  );
}
