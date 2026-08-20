import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { LOAN_METHODOLOGY_SECTIONS } from '@/lib/loan-methodology-content';
import { buildFinancePageMetadata, getFinancePageContent } from '@/lib/finance-page-seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildFinancePageMetadata('loans-methodology');
}

export const revalidate = 60;

export default async function LoanMethodologyPage() {
  const page = await getFinancePageContent('loans-methodology');

  return (
    <ContentLayout
      title={page.h1}
      description={page.intro}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Finance', href: '/finance' },
        { label: 'Loans', href: '/finance/loans' },
        { label: 'Methodology' },
      ]}
    >
      <div className="mx-auto max-w-3xl">
        <nav
          aria-label="On this page"
          className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On this page</p>
          <ol className="mt-2 columns-1 gap-x-6 space-y-1.5 text-sm sm:columns-2">
            {LOAN_METHODOLOGY_SECTIONS.map((section) => (
              <li key={section.id} className="break-inside-avoid">
                <a href={`#${section.id}`} className="font-medium text-blue-700 hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          {LOAN_METHODOLOGY_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-2">
              <h2 className="text-lg font-extrabold text-[#0b1f3a]">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
          <Link
            href="/finance/compare?type=loans"
            className="inline-flex rounded-lg bg-[#0b1f3a] px-4 py-2 text-sm font-semibold hover:bg-[#122b4a]"
            style={{ color: '#ffffff' }}
          >
            Compare Loans
          </Link>
          <Link
            href="/calculators/emi"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
          >
            EMI Calculator
          </Link>
          <Link
            href="/finance/guides"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0b1f3a] hover:border-[#f97316]"
          >
            Loan Guides
          </Link>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Related:{' '}
          <Link href="/finance/loans" className="font-semibold text-blue-700 hover:underline">
            Loans hub
          </Link>
          {' · '}
          <Link href="/disclaimer" className="font-semibold text-blue-700 hover:underline">
            Disclaimer
          </Link>
          {' · '}
          <Link href="/contact" className="font-semibold text-blue-700 hover:underline">
            Contact
          </Link>
        </p>
      </div>
    </ContentLayout>
  );
}
