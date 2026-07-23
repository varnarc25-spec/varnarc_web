import Link from 'next/link';

const links = [
  { href: '/system', label: 'Overview' },
  { href: '/system/status', label: 'Status' },
  { href: '/system/health', label: 'Health' },
  { href: '/system/version', label: 'Version' },
  { href: '/system/performance', label: 'Performance' },
  { href: '/system/cache', label: 'Cache' },
  { href: '/system/metrics', label: 'Metrics' },
  { href: '/system/queues', label: 'Queues' },
  { href: '/system/tests', label: 'Tests' },
];

export function SystemNav({ active }: { active?: string }) {
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
      <Link href="/api" className="text-[var(--varnarc-brand)] hover:underline">
        API console
      </Link>
    </div>
  );
}
