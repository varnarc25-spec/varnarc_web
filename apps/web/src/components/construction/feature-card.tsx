import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Layers } from 'lucide-react';
import { cn, cx } from '@/components/construction/styles';

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon = Layers,
  bullets,
  className,
}: {
  title: string;
  description?: string | null;
  href?: string;
  icon?: LucideIcon;
  bullets?: string[];
  className?: string;
}) {
  const body = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8eef5] text-[#0b1f3a]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-3 text-sm font-bold text-[#0b1f3a]">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {bullets?.length ? (
        <ul className="mt-3 space-y-1.5">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2 text-xs text-slate-600">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#f97316]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
        {body}
      </Link>
    );
  }

  return <div className={cn(cx.card, 'h-full p-4', className)}>{body}</div>;
}
