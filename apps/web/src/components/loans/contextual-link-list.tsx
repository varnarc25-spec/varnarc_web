import Link from 'next/link';
import type { ContextualLink } from '@/lib/loan-contextual-links';

export function ContextualLinkList({
  links,
  label = 'Related',
  className = '',
}: {
  links: ContextualLink[];
  label?: string;
  className?: string;
}) {
  if (!links.length) return null;

  return (
    <nav aria-label={label} className={className}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0b1f3a] transition hover:border-[#f97316]/50 hover:text-[#f97316]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
