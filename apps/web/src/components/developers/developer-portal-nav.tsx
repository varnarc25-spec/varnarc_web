import type { ReactNode } from 'react';
import Link from 'next/link';

const links = [
  { href: '/developers', label: 'Overview', exact: true },
  { href: '/developers/docs', label: 'Getting started' },
  { href: '/developers/docs/authentication', label: 'Authentication' },
  { href: '/developers/docs/webhooks', label: 'Webhooks' },
  { href: '/developers/docs/sdk', label: 'TypeScript SDK' },
];

export function DeveloperPortalNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {links.map((link) => {
        const isActive = link.exact
          ? active === link.href
          : active === link.href || active.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? 'bg-[var(--varnarc-brand)] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DeveloperDocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-[#0b1f3a]">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}
