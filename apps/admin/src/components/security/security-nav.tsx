import Link from 'next/link';

const links = [
  { href: '/security', label: 'Overview' },
  { href: '/security/audit', label: 'Audit logs' },
  { href: '/security/events', label: 'Security events' },
  { href: '/security/sessions', label: 'Sessions' },
];

export function SecurityNav({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            active === link.href
              ? 'font-medium text-[var(--varnarc-brand)]'
              : 'text-[var(--varnarc-subtle)] hover:text-[var(--varnarc-brand)] hover:underline'
          }
        >
          {link.label}
        </Link>
      ))}
      <Link href="/settings/security" className="text-[var(--varnarc-brand)] hover:underline">
        Security settings
      </Link>
    </div>
  );
}
