import Link from 'next/link';

const links = [
  { href: '/api', label: 'Overview' },
  { href: '/api/logs', label: 'Request logs' },
  { href: '/api/keys', label: 'API keys' },
  { href: '/api/webhooks', label: 'Webhooks' },
  { href: '/api/rate-limits', label: 'Rate limits' },
];

export function ApiConsoleNav({ active }: { active?: string }) {
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
      <a
        href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:4000'}/api/v1/docs`}
        target="_blank"
        rel="noreferrer"
        className="text-[var(--varnarc-brand)] hover:underline"
      >
        OpenAPI docs
      </a>
    </div>
  );
}
