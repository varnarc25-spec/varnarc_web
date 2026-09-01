import Link from 'next/link';

const LINKS = [
  { href: '/finance/rates', label: 'Published interest rates' },
  { href: '/methodology', label: 'How we calculate' },
  { href: '/editorial-policy', label: 'Editorial policy' },
] as const;

/**
 * Trust panel for hub heroes. Never shows invented portfolio, EMI, or return figures.
 */
export function HubHeroOverview({ title = 'Rates & tools' }: { title?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-[#0b1f3a]">{title}</div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          From admin data
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Figures on Varnarc come from the admin catalog (interest rates, loans, and calculators). We
        do not show sample net worth, EMI, or return percentages as if they were yours.
      </p>
      <ul className="mt-4 space-y-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm font-medium text-blue-700 hover:underline">
              {link.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
