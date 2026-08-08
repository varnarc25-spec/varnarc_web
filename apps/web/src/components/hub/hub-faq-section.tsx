import Link from 'next/link';

export type HubFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function HubFaqSection({
  faqs,
  viewAllHref,
  title = 'Frequently asked questions',
}: {
  faqs: HubFaqItem[];
  viewAllHref?: string;
  title?: string;
}) {
  if (!faqs.length) return null;

  const columns = [faqs.filter((_, i) => i % 2 === 0), faqs.filter((_, i) => i % 2 === 1)];

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-extrabold text-[#0b1f3a] sm:text-2xl">{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm font-semibold text-blue-600 hover:underline">
            View all FAQs →
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="space-y-3">
            {col.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm open:shadow"
              >
                <summary className="cursor-pointer list-none font-semibold text-[#0b1f3a] marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    <span>{faq.question}</span>
                    <span className="text-blue-600 transition group-open:rotate-180">▼</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
