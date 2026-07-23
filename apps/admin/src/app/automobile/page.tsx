import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type DashboardData = {
  manufacturersPublished: number;
  vehiclesPublished: number;
  maintenanceSchedules: number;
  faqs: number;
  guides: number;
  comparisons: number;
};

const sections = [
  { href: '/automobile/manufacturers', label: 'Manufacturers' },
  { href: '/automobile/vehicles', label: 'Vehicles' },
  { href: '/automobile/maintenance', label: 'Maintenance' },
  { href: '/automobile/dealers', label: 'Dealers' },
  { href: '/automobile/comparisons', label: 'Comparisons' },
  { href: '/automobile/reports', label: 'Reports' },
  { href: '/automobile/faqs', label: 'FAQs' },
  { href: '/automobile/guides', label: 'Guides' },
];

export default async function AutomobileAdminDashboardPage() {
  const result = await apiServerFetch<DashboardData>('/automobile/dashboard');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Automobile"
        description="Manage manufacturers, vehicles, maintenance, dealers, and guides."
      />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Published manufacturers', value: stats?.manufacturersPublished ?? 0 },
              { label: 'Published vehicles', value: stats?.vehiclesPublished ?? 0 },
              { label: 'Maintenance schedules', value: stats?.maintenanceSchedules ?? 0 },
              { label: 'Guides', value: stats?.guides ?? 0 },
              { label: 'FAQs', value: stats?.faqs ?? 0 },
              { label: 'Comparisons', value: stats?.comparisons ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4"
              >
                <div className="text-xs text-[var(--varnarc-subtle)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 hover:bg-[var(--varnarc-muted)]"
              >
                <div className="font-medium text-[var(--varnarc-brand)]">{section.label}</div>
                <div className="mt-1 text-xs text-[var(--varnarc-subtle)]">Manage {section.label.toLowerCase()}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
