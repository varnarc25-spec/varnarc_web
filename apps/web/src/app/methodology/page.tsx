import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How Varnarc researches, calculates, compares, and reviews products and services across finance, construction, automobile, and solar.',
  alternates: { canonical: '/methodology' },
};

export default function MethodologyPage() {
  return (
    <main className="site-container py-12 sm:py-16">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />

      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Our Methodology
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
        Varnarc provides calculators, comparisons, reviews, and research tools across finance, home
        &amp; construction, automobile, and solar categories. This page explains how we source data,
        build calculators, conduct comparisons, and evaluate products and services — so you can
        understand exactly what our numbers and recommendations are based on.
      </p>

      <div className="mt-10 max-w-3xl space-y-10">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Calculator Methodology</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Our calculators use standard, widely-accepted formulas sourced from financial textbooks,
            regulatory guidelines, and industry practice. For example, EMI (Equated Monthly
            Instalment) calculators use the standard reducing-balance formula:
          </p>
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-mono text-sm text-slate-800">
              EMI = P × r × (1 + r)<sup>n</sup> / ((1 + r)<sup>n</sup> − 1)
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Where P = principal, r = monthly interest rate, n = number of monthly instalments
            </p>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Default values for interest rates are sourced from RBI publications and major bank rate
            sheets. Each calculator page discloses the formula, data sources, and assumptions used.
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            <strong className="text-slate-950">Limitations:</strong> Calculator results are
            estimates based on the inputs provided and standard formulas. Actual amounts may vary
            based on lender-specific terms, processing fees, prepayment conditions, tax
            implications, and other factors not captured by the tool. We recommend verifying results
            with your bank or financial institution before making decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Comparison Methodology</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Varnarc comparisons present products, services, and providers side-by-side using a
            consistent set of criteria. Our approach:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Criteria selection.</strong> For each comparison
              category, we identify the factors that matter most to consumers — such as interest
              rates, fees, features, coverage, eligibility, and customer experience.
            </li>
            <li>
              <strong className="text-slate-950">Data collection.</strong> Product data is gathered
              from official provider websites, published rate cards, regulatory filings, and
              manufacturer specifications.
            </li>
            <li>
              <strong className="text-slate-950">Presentation.</strong> Data is presented factually
              so readers can evaluate options based on their own priorities. We do not rank products
              based on commercial relationships.
            </li>
            <li>
              <strong className="text-slate-950">Update frequency.</strong> Comparison data is
              reviewed periodically and updated when providers change their offerings. Pages display
              the date of last review.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Review Methodology</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            When Varnarc reviews a product or service, we follow a structured evaluation process:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Evaluation criteria.</strong> Each review category
              has a defined set of criteria (e.g., for a credit card: annual fee, reward rate,
              welcome benefits, acceptance network, customer service quality).
            </li>
            <li>
              <strong className="text-slate-950">Scoring.</strong> Where applicable, products are
              scored against each criterion using a consistent scale. The scoring methodology is
              disclosed on the review page.
            </li>
            <li>
              <strong className="text-slate-950">Testing &amp; research.</strong> Reviews draw on
              hands-on evaluation where possible, supplemented by official specifications, published
              user feedback, and expert analysis.
            </li>
            <li>
              <strong className="text-slate-950">Editorial independence.</strong> Review conclusions
              are based on merit, not on advertising or partnership arrangements. Sponsored
              relationships are disclosed separately.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Product Data</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Product information across Varnarc is sourced from official channels and verified
            through a multi-step process:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              Primary sources: manufacturer websites, official product documentation, regulatory
              filings
            </li>
            <li>Secondary verification: cross-referencing against multiple independent sources</li>
            <li>
              Update cycle: data is refreshed on a regular schedule and when significant changes are
              identified
            </li>
            <li>Date labeling: product data pages include the date of last verification</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Financial Data Sources</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            For financial content, we rely on authoritative Indian regulatory and industry sources:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">RBI</strong> — repo rate, bank rate, MCLR
              benchmarks, monetary policy statements, regulatory circulars
            </li>
            <li>
              <strong className="text-slate-950">SEBI</strong> — mutual fund categorization, market
              regulations, disclosure requirements
            </li>
            <li>
              <strong className="text-slate-950">AMFI</strong> — NAV data, scheme details, industry
              AUM statistics
            </li>
            <li>
              <strong className="text-slate-950">IRDAI</strong> — insurance product approvals, claim
              settlement data, regulatory guidelines
            </li>
            <li>
              <strong className="text-slate-950">Bank &amp; NBFC websites</strong> — current
              interest rates, product terms, fee schedules
            </li>
            <li>
              <strong className="text-slate-950">Income Tax Department</strong> — tax slabs,
              exemptions, deduction limits, filing guidelines
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Construction Data Sources</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Home and construction tools on Varnarc draw from:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">CPWD</strong> (Central Public Works Department) —
              Delhi Schedule of Rates, plinth area rates, standard specifications
            </li>
            <li>
              <strong className="text-slate-950">State PWD rate analyses</strong> — state-level
              construction cost benchmarks
            </li>
            <li>
              <strong className="text-slate-950">Market surveys</strong> — current material prices
              (cement, steel, sand, aggregate) from supplier networks and industry publications
            </li>
            <li>
              <strong className="text-slate-950">IS codes</strong> — Bureau of Indian Standards
              construction specifications where relevant
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Automobile Data Sources</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Vehicle-related content and tools use:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Manufacturer data</strong> — official
              specifications, pricing, variant details from OEM websites and press releases
            </li>
            <li>
              <strong className="text-slate-950">Dealer verification</strong> — on-road pricing,
              availability, and accessory details confirmed through dealer networks where possible
            </li>
            <li>
              <strong className="text-slate-950">Regulatory data</strong> — RTO fee schedules,
              insurance premium structures, emission norms
            </li>
            <li>
              <strong className="text-slate-950">Industry reports</strong> — SIAM and FADA data for
              market trends and sales figures
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Solar &amp; Energy Data Sources</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Solar calculators and content are built on:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">MNRE</strong> (Ministry of New and Renewable
              Energy) — subsidy schemes, benchmark costs, technical specifications
            </li>
            <li>
              <strong className="text-slate-950">State nodal agencies</strong> — state-specific
              subsidies, net metering policies, approval processes
            </li>
            <li>
              <strong className="text-slate-950">Installer &amp; manufacturer data</strong> — panel
              specifications, inverter ratings, installation cost benchmarks from verified industry
              sources
            </li>
            <li>
              <strong className="text-slate-950">Solar irradiance data</strong> — NASA POWER
              database and ISRO-published solar radiation maps for location-specific generation
              estimates
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Limitations &amp; Disclaimers</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            All tools, calculators, comparisons, and editorial content on Varnarc are provided for
            informational purposes. Important limitations:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              Results from calculators and tools are <strong>indicative estimates</strong>, not
              guaranteed figures. Actual values depend on provider-specific terms and individual
              circumstances.
            </li>
            <li>
              Product data, rates, and prices are subject to change. Always verify current
              information directly with the provider before making a decision.
            </li>
            <li>
              Varnarc does not provide personalized financial, tax, legal, or investment advice.
              Content is general in nature and should not replace consultation with a qualified
              professional.
            </li>
            <li>Past performance data, where referenced, does not guarantee future results.</li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            For full details, see our{' '}
            <Link href="/disclaimer" className="font-medium text-blue-600 hover:underline">
              Disclaimer
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Updates</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Data across Varnarc is refreshed on a regular schedule that varies by category:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong className="text-slate-950">Interest rates &amp; financial data:</strong>{' '}
              Updated when RBI policy changes or banks revise rates, and reviewed at least monthly.
            </li>
            <li>
              <strong className="text-slate-950">Product specifications &amp; pricing:</strong>{' '}
              Reviewed quarterly or when manufacturers announce changes.
            </li>
            <li>
              <strong className="text-slate-950">Construction costs:</strong> Updated quarterly
              based on market surveys and CPWD revisions.
            </li>
            <li>
              <strong className="text-slate-950">Solar subsidy &amp; policy data:</strong> Updated
              when MNRE or state agencies announce changes.
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Each page displays its last-reviewed date. If you notice outdated information, please{' '}
            <Link
              href="/contact?type=correction"
              className="font-medium text-blue-600 hover:underline"
            >
              let us know
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
