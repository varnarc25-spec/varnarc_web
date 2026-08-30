import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Calculator } from 'lucide-react';
import { cn, cx } from '@/components/construction/styles';

export function ToolCard({
  href,
  label,
  description,
  icon: Icon = Calculator,
  badge,
  className,
}: {
  href: string;
  label: string;
  description?: string | null;
  icon?: LucideIcon;
  badge?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        cx.card,
        'group flex h-full flex-col p-4 transition hover:ring-[#f97316]/40',
        cx.focus,
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8eef5] text-[#f97316]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <h3 className="text-sm font-bold text-[#0b1f3a] group-hover:text-[#f97316]">{label}</h3>
      {description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{description}</p>
      ) : null}
    </Link>
  );
}
