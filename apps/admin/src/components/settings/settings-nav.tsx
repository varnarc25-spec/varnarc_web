import Link from 'next/link';

const groups = [
  {
    label: 'General',
    links: [
      { href: '/settings', label: 'Overview' },
      { href: '/settings/general', label: 'Site settings' },
      { href: '/themes', label: 'Themes & branding' },
    ],
  },
  {
    label: 'Communication',
    links: [
      { href: '/settings/contact', label: 'Contact email' },
      { href: '/settings/contact-messages', label: 'Contact inbox' },
      { href: '/notifications/providers', label: 'Notifications' },
    ],
  },
  {
    label: 'Integrations',
    links: [
      { href: '/settings/adsense', label: 'Google AdSense' },
      { href: '/settings/gcs', label: 'Cloud Storage' },
      { href: '/analytics/integrations', label: 'Analytics' },
      { href: '/seo/integrations', label: 'SEO integrations' },
      { href: '/seo/robots', label: 'SEO robots' },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/settings/maintenance', label: 'Maintenance' },
      { href: '/settings/security', label: 'Security' },
      { href: '/settings/features', label: 'Feature flags' },
      { href: '/settings/advanced', label: 'Advanced' },
    ],
  },
];

export function SettingsNav({ active }: { active?: string }) {
  return (
    <nav
      aria-label="Settings sections"
      className="grid gap-4 rounded-xl border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {groups.map((group) => (
        <div
          key={group.label}
          className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--varnarc-subtle)]">
            {group.label}
          </p>
          <div className="grid gap-1.5">
            {group.links.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--varnarc-brand)] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-[var(--varnarc-brand)] bg-[var(--varnarc-brand)] text-white shadow-sm'
                      : 'border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] text-[var(--varnarc-subtle)] hover:border-[var(--varnarc-brand)] hover:bg-[var(--varnarc-muted)] hover:text-[var(--varnarc-brand)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
