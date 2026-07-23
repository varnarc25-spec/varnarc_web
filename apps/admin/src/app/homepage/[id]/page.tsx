import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { HomepageBuilderEditor } from '@/components/homepage-builder-editor';

type WidgetRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

type LayoutDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isDefault: boolean;
  sections: Array<{
    id: string;
    name: string;
    sortOrder: number;
    settings: unknown;
    widgetInstances: Array<{
      id: string;
      sortOrder: number;
      settings: unknown;
      widget: { id: string; slug: string; name: string };
    }>;
  }>;
};

export default async function HomepageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [layoutRes, widgetsRes, categoriesRes] = await Promise.all([
    apiServerFetch<LayoutDetail>(`/homepage/${id}`),
    apiServerFetch<WidgetRow[]>('/homepage/widgets'),
    apiServerFetch<CategoryRow[]>('/categories?limit=100'),
  ]);

  const layout = layoutRes.data;
  const widgets = Array.isArray(widgetsRes.data) ? widgetsRes.data : [];
  const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={layout?.name ?? 'Homepage layout'}
        description={
          layout
            ? `Edit sections for /${layout.slug}. Published default layouts power the public homepage.`
            : 'Layout editor'
        }
        actions={
          <Link href="/homepage" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← All layouts
          </Link>
        }
      />

      {layoutRes.error || !layout ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load layout</CardTitle>
            <CardDescription>{layoutRes.error || 'Layout not found.'}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <HomepageBuilderEditor layout={layout} widgets={widgets} categories={categories} />
      )}
    </div>
  );
}
