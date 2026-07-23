import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--varnarc-subtle)]">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-[var(--varnarc-ink)] hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? 'text-[var(--varnarc-ink)]' : undefined} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
