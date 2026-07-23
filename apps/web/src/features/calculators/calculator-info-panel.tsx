import Link from 'next/link';
import type { RelatedArticle } from '@/features/calculators/calculator-related-articles';

const CALCULATOR_TIPS: Record<string, string[]> = {
  loan: [
    'Select a loan type to see guides tailored for home, personal, car, or education loans.',
    'Processing fees, insurance, and GST are not included in this EMI estimate.',
    'A longer tenure lowers EMI but increases total interest paid.',
    'Compare offers from multiple lenders before you apply.',
  ],
  emi: [
    'EMI stays fixed for flat-rate loans; reducing-balance loans may vary slightly.',
    'Prepaying principal early can significantly cut total interest.',
  ],
  sip: [
    'SIP returns are illustrative — actual mutual fund returns vary with market conditions.',
    'Start early to benefit from compounding over longer horizons.',
  ],
};

type FaqItem = { q: string; a: string };

export function CalculatorInfoPanel({
  name,
  slug,
  description,
  faq,
  relatedCalculators,
  relatedArticles,
}: {
  name: string;
  slug: string;
  description?: string | null;
  faq: FaqItem[];
  relatedCalculators: Array<{ name: string; slug: string }>;
  relatedArticles: RelatedArticle[];
}) {
  const tips = CALCULATOR_TIPS[slug] ?? [
    'Enter your details and click Calculate for instant results.',
    'Save or share your result when you are signed in.',
  ];
  const articlePreview = relatedArticles.slice(0, 4);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-bold text-[#0b1f3a]">About this calculator</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {description || `Use the ${name} to plan your finances with quick, transparent estimates.`}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#0b1f3a]">Good to know</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]" aria-hidden />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {faq.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-[#0b1f3a]">Common questions</h2>
          <dl className="mt-3 space-y-4">
            {faq.slice(0, 4).map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-semibold text-[#0b1f3a]">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#0b1f3a]">How to use</h2>
        <ol className="mt-3 space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">
              1
            </span>
            <span>Enter loan amount, rate, and tenure (and loan type if applicable).</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">
              2
            </span>
            <span>Click Calculate to see EMI, total payment, and interest breakdown.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b1f3a] text-xs font-bold text-white">
              3
            </span>
            <span>Read related guides below to make an informed borrowing decision.</span>
          </li>
        </ol>
      </section>

      {relatedCalculators.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-[#0b1f3a]">Related calculators</h2>
          <ul className="mt-3 space-y-2">
            {relatedCalculators.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/calculators/${c.slug}`}
                  className="text-sm font-medium text-[#f97316] hover:underline"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {articlePreview.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-[#0b1f3a]">Recommended guides</h2>
          <ul className="mt-3 space-y-3">
            {articlePreview.map((article) => (
              <li key={article.slug}>
                <Link href={`/articles/${article.slug}`} className="group block">
                  <p className="text-sm font-medium text-[#0b1f3a] group-hover:text-[#f97316]">
                    {article.title}
                  </p>
                  {article.excerpt ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{article.excerpt}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
