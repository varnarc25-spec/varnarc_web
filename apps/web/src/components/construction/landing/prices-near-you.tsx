import Link from 'next/link';
import { ConstructionSection } from '@/components/construction/construction-section';
import { cn, cx } from '@/components/construction/styles';

export function ConstructionPricesNearYou({
  materials,
}: {
  materials: Array<{
    id: string;
    name: string;
    href: string;
    priceLabel?: string | null;
    meta?: string | null;
  }>;
}) {
  return (
    <ConstructionSection
      id="prices-near-you"
      title="Construction prices near you"
      description="Indicative material prices to orient your budget — always verify locally."
      action={{ href: '/construction/prices', label: 'Open prices hub →' }}
    >
      {materials.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <li key={m.id}>
              <Link
                href={m.href}
                className={cn(
                  cx.card,
                  'flex h-full flex-col p-4 transition hover:ring-[#f97316]/40',
                  cx.focus,
                )}
              >
                <h3 className="text-sm font-bold text-[#0b1f3a]">{m.name}</h3>
                {m.meta ? <p className="mt-1 text-xs text-slate-500">{m.meta}</p> : null}
                {m.priceLabel ? (
                  <p className="mt-auto pt-3 text-sm font-semibold tabular-nums text-[#0b1f3a]">
                    {m.priceLabel}
                  </p>
                ) : (
                  <p className="mt-auto pt-3 text-xs text-slate-500">View details</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">
          Reliable city prices appear in the{' '}
          <Link href="/construction/prices" className={cx.link}>
            prices hub
          </Link>{' '}
          when LIVE or recently verified observations are published. Until then,{' '}
          <Link href="/construction/suppliers" className={cx.link}>
            find suppliers
          </Link>{' '}
          or{' '}
          <Link href="/construction/materials" className={cx.link}>
            browse materials
          </Link>
          .
        </p>
      )}
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
        Prices shown are approximate and may vary by brand, grade and city. Pair this list with the{' '}
        <Link href="/construction/estimate" className={cx.link}>
          cost estimator
        </Link>{' '}
        and{' '}
        <Link href="/construction/suppliers" className={cx.link}>
          supplier directory
        </Link>{' '}
        for a fuller local picture.
      </p>
    </ConstructionSection>
  );
}
