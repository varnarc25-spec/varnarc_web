import Link from 'next/link';

const FINANCE_INTENTS = [
  { label: 'Buy a home', href: '/finance/loans' },
  { label: 'Get a loan', href: '/finance/loans' },
  { label: 'Grow investments', href: '/finance/investments' },
  { label: 'Save tax', href: '/calculators/income-tax' },
  { label: 'Compare cards', href: '/finance/credit-cards' },
] as const;

export function HubIntentSelector({
  title = 'What are you trying to plan?',
  intents = FINANCE_INTENTS,
}: {
  title?: string;
  intents?: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div className="border-b border-slate-200/80 bg-white py-3">
      <div className="site-container px-4">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {intents.map((intent) => (
            <Link
              key={intent.label}
              href={intent.href}
              className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {intent.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
