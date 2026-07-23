import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { SettingsNav } from '@/components/settings/settings-nav';

type MaintenanceStatus = {
  active?: boolean;
  message?: string | null;
  readOnly?: boolean;
};

export default async function SettingsHubPage() {
  const [maintenanceResult, flagsResult] = await Promise.all([
    apiServerFetch<MaintenanceStatus>('/settings/maintenance/status'),
    apiServerFetch<unknown[]>('/settings/feature-flags?limit=50'),
  ]);

  const maintenance = maintenanceResult.data;
  const flagCount = Array.isArray(flagsResult.data) ? flagsResult.data.length : 0;

  const categories = [
    { href: '/settings/general', title: 'General', description: 'Site name, contact info, locale, and branding URLs.' },
    { href: '/settings/maintenance', title: 'Maintenance', description: 'Maintenance mode, scheduled windows, and bypass rules.' },
    { href: '/settings/security', title: 'Security', description: 'Rate limits, CORS, CSP, and password policies.' },
    { href: '/settings/features', title: 'Feature flags', description: 'Enable or disable platform features at runtime.' },
    { href: '/settings/advanced', title: 'Advanced', description: 'Raw JSON setting upsert for power users.' },
  ];

  const moduleLinks = [
    { href: '/analytics/integrations', title: 'Analytics', description: 'GA, Clarity, Plausible, and telemetry toggles.' },
    { href: '/seo/integrations', title: 'SEO integrations', description: 'Search Console and webmaster verification.' },
    { href: '/seo/robots', title: 'Robots.txt', description: 'Crawl rules for production robots.txt.' },
    { href: '/notifications/providers', title: 'Notifications', description: 'Email, SMS, and push provider configuration.' },
    { href: '/themes', title: 'Themes', description: 'Visual branding, tokens, and default theme.' },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Central configuration hub for platform-wide and module-specific settings."
      />
      <SettingsNav active="/settings" />

      {maintenance?.active ? (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance mode is active</CardTitle>
            <CardDescription>{maintenance.message ?? 'The public site may be unavailable.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Platform settings</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:border-[var(--varnarc-brand)]">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Module settings</h2>
        <p className="text-sm text-[var(--varnarc-subtle)]">
          Domain-specific configuration lives with each module. Use these links instead of duplicating keys here.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {moduleLinks.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:border-[var(--varnarc-brand)]">
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Feature flags</CardDescription>
            <CardTitle className="text-3xl">{flagCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Maintenance status</CardDescription>
            <CardTitle className="text-3xl">{maintenance?.active ? 'Active' : 'Off'}</CardTitle>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
