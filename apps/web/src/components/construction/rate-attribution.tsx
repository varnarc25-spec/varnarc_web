import type { ConstructionRateDisplay } from '@varnarc/validation';
import { cn } from '@/components/construction/styles';

function formatVerified(iso: string | null): string {
  if (!iso) return 'Not verified';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00.000Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ConstructionRateAttribution({
  display,
  className,
}: {
  display: ConstructionRateDisplay;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700',
        className,
      )}
      aria-label="Rate source"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {display.publicLabel}
      </p>
      {display.typicalPrice != null ? (
        <p className="mt-1 font-semibold tabular-nums text-[#0b1f3a]">
          ₹{display.typicalPrice.toLocaleString('en-IN')}
          {display.unit ? ` / ${display.unit}` : ''}
          <span className="ml-2 text-xs font-medium text-slate-500">{display.locationLabel}</span>
        </p>
      ) : (
        <p className="mt-1 font-semibold text-[#0b1f3a]">{display.locationLabel}</p>
      )}
      <ul className="mt-2 space-y-0.5 text-xs text-slate-600">
        <li>Last verified: {formatVerified(display.lastVerifiedAt)}</li>
        {display.sourceName ? (
          <li>
            Source:{' '}
            {display.sourceUrl ? (
              <a href={display.sourceUrl} className="underline" rel="noopener noreferrer">
                {display.sourceName}
              </a>
            ) : (
              display.sourceName
            )}
          </li>
        ) : null}
        {display.fallbackNote ? (
          <li className="font-medium text-amber-800">{display.fallbackNote}</li>
        ) : null}
        <li>{display.localVerificationWarning}</li>
      </ul>
    </aside>
  );
}
