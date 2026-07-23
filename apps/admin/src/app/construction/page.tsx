import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';

type DashboardData = {
  categories: number;
  materialsPublished: number;
  brandsPublished: number;
  costTemplatesPublished: number;
  projectsCount: number;
  guidesPublished?: number;
  faqsPublished?: number;
};

const sections = [
  { href: '/construction/categories', label: 'Categories' },
  { href: '/construction/materials', label: 'Materials' },
  { href: '/construction/brands', label: 'Brands' },
  { href: '/construction/cost-templates', label: 'Cost templates' },
  { href: '/construction/projects', label: 'Projects' },
  { href: '/construction/checklists', label: 'Checklists' },
  { href: '/construction/comparisons', label: 'Comparisons' },
  { href: '/construction/suppliers', label: 'Suppliers' },
  { href: '/construction/reports', label: 'Reports' },
  { href: '/construction/faqs', label: 'FAQs' },
  { href: '/construction/guides', label: 'Guides' },
];

export default async function ConstructionAdminDashboardPage() {
  const result = await apiServerFetch<DashboardData>('/construction/dashboard');
  const stats = result.data;

  return (
    <div>
      <PageHeader
        title="Construction"
        description="Manage materials, brands, cost templates, projects, and guides."
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
              { label: 'Categories', value: stats?.categories ?? 0 },
              { label: 'Published materials', value: stats?.materialsPublished ?? 0 },
              { label: 'Published brands', value: stats?.brandsPublished ?? 0 },
              { label: 'Cost templates', value: stats?.costTemplatesPublished ?? 0 },
              { label: 'User projects', value: stats?.projectsCount ?? 0 },
              { label: 'Guides', value: stats?.guidesPublished ?? 0 },
              { label: 'FAQs', value: stats?.faqsPublished ?? 0 },
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
