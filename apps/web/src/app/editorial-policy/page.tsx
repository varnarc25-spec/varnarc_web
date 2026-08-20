import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata: Metadata = {
  title: 'Editorial Policy',
  description:
    'How Varnarc creates, reviews, and maintains accurate and trustworthy content across finance, home, automobile, and solar categories.',
  alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Editorial Policy' }]} />

      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Editorial Policy
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
        Varnarc publishes calculators, comparisons, guides, reviews, and tools that help people make
        important decisions about money, homes, vehicles, and energy. Because our content influences
        real-world choices, we hold ourselves to high standards of accuracy, independence, and
        transparency. This policy explains how we create, review, and maintain content across the
        platform.
      </p>

      <div className="mt-10 max-w-3xl space-y-10">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Our Editorial Standards</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Three principles guide every piece of content we publish:
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Independence.</strong> Editorial decisions are made
              by our editorial team, not by advertisers, partners, or commercial relationships. If a
              page includes sponsored content or affiliate links, that relationship is disclosed
              clearly.
            </li>
            <li>
              <strong className="text-slate-950">Accuracy.</strong> We use primary and authoritative
              sources, verify claims before publishing, and correct errors promptly when they are
              identified. Financial figures, rates, and regulatory references are cross-checked
              against official sources.
            </li>
            <li>
              <strong className="text-slate-950">Transparency.</strong> We disclose our data
              sources, methodology, assumptions, and limitations. Readers should always understand
              where information comes from and what its boundaries are.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Content Creation Process</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Every piece of editorial content on Varnarc follows a structured process:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Research.</strong> Writers begin by consulting
              primary sources — regulatory databases, government publications, official rate sheets,
              and industry reports. We supplement primary research with expert interviews and field
              data where relevant.
            </li>
            <li>
              <strong className="text-slate-950">Writing.</strong> Content is drafted with clarity
              as the priority. We avoid jargon when simpler language will do, and provide
              definitions and context when technical terms are necessary.
            </li>
            <li>
              <strong className="text-slate-950">Review.</strong> A second team member reviews the
              content for accuracy, completeness, tone, and alignment with our editorial standards
              before publication.
            </li>
            <li>
              <strong className="text-slate-950">Fact-checking.</strong> Key claims, statistics,
              rates, and regulatory references are verified independently. Financial content
              undergoes additional review (see Financial Content Standards below).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Author &amp; Reviewer Guidelines</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Content contributors are selected based on subject-matter knowledge and writing clarity.
            Authors working on financial, legal, or technical topics are expected to have relevant
            education, industry experience, or demonstrated expertise in the subject area.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            All contributors are required to disclose potential conflicts of interest. Author
            profiles are published on our{' '}
            <Link href="/authors" className="font-medium text-blue-600 hover:underline">
              authors page
            </Link>{' '}
            with biographical information, credentials, and areas of expertise.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Sources &amp; Citations</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            We prioritize primary and authoritative sources. For financial content published on
            Varnarc, common sources include:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>Reserve Bank of India (RBI) — monetary policy, base rates, regulatory circulars</li>
            <li>
              Securities and Exchange Board of India (SEBI) — mutual fund regulations, market data
            </li>
            <li>
              Government of India publications — Income Tax Department, GST Council, Ministry of
              Finance
            </li>
            <li>Association of Mutual Funds in India (AMFI) — NAV data, scheme information</li>
            <li>
              Insurance Regulatory and Development Authority (IRDAI) — insurance product data,
              guidelines
            </li>
            <li>Bank and NBFC official websites — interest rates, product terms</li>
            <li>
              Industry bodies, CPWD rate analysis, MNRE data, and manufacturer specifications for
              non-financial categories
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            When we reference third-party data or research, we identify the source. If data is
            estimated, projected, or based on assumptions, we state that clearly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Financial Content Standards (YMYL)</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Content related to personal finance, loans, investments, insurance, and taxes falls
            under "Your Money or Your Life" (YMYL) standards. This content can directly affect
            readers' financial well-being, so we apply additional safeguards:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              Financial articles are reviewed by a team member with relevant finance knowledge
              before publication.
            </li>
            <li>
              Rates, fees, and regulatory details are verified against official sources and include
              the date of last verification.
            </li>
            <li>
              All financial content includes a standard disclaimer: Varnarc provides general
              information and tools, not personalized financial, tax, or legal advice. Readers
              should consult a qualified professional for decisions specific to their situation.
            </li>
            <li>
              We do not recommend specific financial products for individual users. Comparisons
              present factual criteria and let readers evaluate options based on their own needs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Calculator &amp; Tool Methodology</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Our calculators use standard, published formulas and official data sources. For each
            calculator, we document:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>The formula or method used, with references</li>
            <li>Data sources for rates, costs, and default values</li>
            <li>
              Known limitations — for example, that results are estimates and may not account for
              every individual variable
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Full methodology details are available on our{' '}
            <Link href="/methodology" className="font-medium text-blue-600 hover:underline">
              Methodology
            </Link>{' '}
            page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Comparison &amp; Review Standards</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            When Varnarc compares products, services, or providers:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              Comparison criteria are disclosed so readers understand what is being evaluated and
              why.
            </li>
            <li>
              Ranking or ordering is based on editorial criteria — not on payment or commercial
              relationships. If a listing is sponsored or promoted, it is labeled as such.
            </li>
            <li>
              Product data is sourced from official manufacturer, provider, or regulatory sources
              and is updated regularly.
            </li>
            <li>
              Reviews reflect honest assessment based on stated criteria, not influenced by
              advertising or partnership arrangements.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Corrections &amp; Updates</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            We are committed to correcting errors promptly and transparently. When a factual error,
            outdated figure, or calculation mistake is identified, we investigate and publish a
            correction with a note explaining what changed and when.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Our full process for handling corrections is described in our{' '}
            <Link href="/corrections" className="font-medium text-blue-600 hover:underline">
              Corrections Policy
            </Link>
            . If you spot an error, please{' '}
            <Link
              href="/contact?type=correction"
              className="font-medium text-blue-600 hover:underline"
            >
              report it here
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Questions about our editorial standards or content? Reach our editorial team at{' '}
            <a
              href="mailto:editorial@varnarc.com"
              className="font-medium text-blue-600 hover:underline"
            >
              editorial@varnarc.com
            </a>{' '}
            or through our{' '}
            <Link href="/contact" className="font-medium text-blue-600 hover:underline">
              contact form
            </Link>
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
