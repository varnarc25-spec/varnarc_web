import Link from 'next/link';

const links = [
  { href: '/settings', label: 'Overview' },
  { href: '/settings/general', label: 'General' },
  { href: '/settings/maintenance', label: 'Maintenance' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/features', label: 'Feature flags' },
  { href: '/settings/advanced', label: 'Advanced' },
];

const external = [
  { href: '/analytics/integrations', label: 'Analytics integrations' },
  { href: '/seo/integrations', label: 'SEO integrations' },
  { href: '/seo/robots', label: 'SEO robots' },
  { href: '/notifications/providers', label: 'Notification providers' },
  { href: '/themes', label: 'Themes & branding' },
];

export function SettingsNav({ active }: { active?: string }) {
  return (
    <div className="space-y-4">
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
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="text-[var(--varnarc-subtle)]">Module settings:</span>
        {external.map((link) => (
          <Link key={link.href} href={link.href} className="text-[var(--varnarc-brand)] hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
