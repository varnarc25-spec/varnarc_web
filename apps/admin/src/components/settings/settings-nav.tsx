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
      className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--varnarc-subtle)]">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.links.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--varnarc-brand)] font-medium text-white'
                      : 'text-[var(--varnarc-subtle)] hover:bg-[var(--varnarc-muted)] hover:text-[var(--varnarc-brand)]'
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
