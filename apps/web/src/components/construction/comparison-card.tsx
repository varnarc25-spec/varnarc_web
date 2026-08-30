import Link from 'next/link';
import { cn, cx } from '@/components/construction/styles';

export function ComparisonCard({
  title,
  href,
  leftLabel,
  rightLabel,
  summary,
  attributes,
  className,
}: {
  title: string;
  href?: string;
  leftLabel: string;
  rightLabel: string;
  summary?: string;
  attributes?: Array<{ label: string; left: string; right: string }>;
  className?: string;
}) {
  const content = (
    <>
      <h3 className="text-sm font-bold text-[#0b1f3a]">{title}</h3>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        <span className="text-[#0b1f3a]">{leftLabel}</span>
        <span className="mx-2 text-slate-300">vs</span>
        <span className="text-[#0b1f3a]">{rightLabel}</span>
      </p>
      {summary ? <p className="mt-2 text-xs leading-relaxed text-slate-600">{summary}</p> : null}
      {attributes?.length ? (
        <dl className="mt-4 space-y-2">
          {attributes.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1fr_1fr] gap-2 border-t border-slate-100 pt-2 text-xs"
            >
              <dt className="font-medium text-slate-500">{row.label}</dt>
              <dd className="tabular-nums text-[#0b1f3a]">{row.left}</dd>
              <dd className="tabular-nums text-[#0b1f3a]">{row.right}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cx.card,
          'block h-full p-4 transition hover:ring-[#f97316]/40',
          cx.focus,
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn(cx.card, 'h-full p-4', className)}>{content}</div>;
}
