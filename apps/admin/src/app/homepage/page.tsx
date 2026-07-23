import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import {
  HomepageCreateForm,
  HomepageLayoutActions,
  type HomepageLayoutRow,
} from '@/components/homepage-layout-list';

export default async function HomepageAdminPage() {
  const result = await apiServerFetch<HomepageLayoutRow[]>('/homepage?limit=50');
  const layouts = Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage builder"
        description="Configure the public homepage from CMS sections and widgets. The default published layout is served at /."
        actions={<Badge>{layouts.length} layouts</Badge>}
      />

      <HomepageCreateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load layouts</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {layouts.map((layout) => (
            <Card key={layout.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>{layout.name}</CardTitle>
                    <CardDescription>
                      /{layout.slug} · {layout.status}
                      {layout.publishedAt
                        ? ` · published ${new Date(layout.publishedAt).toLocaleDateString()}`
                        : ''}
                    </CardDescription>
                  </div>
                  <HomepageLayoutActions layout={layout} />
                </div>
              </CardHeader>
            </Card>
          ))}
          {!layouts.length ? (
            <p className="text-sm text-[var(--varnarc-subtle)]">
              No layouts yet. Run the database seed or create one above.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
