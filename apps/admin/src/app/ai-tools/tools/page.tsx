import { Badge, Card, CardDescription, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { AiToolsCsvToolbar, AiToolsListSearch } from '@/components/ai-tools-admin-toolbar';
import { AiToolCreateForm } from '@/components/ai-tools-forms';
import { AiToolsAdminTable } from '@/components/ai-tools-admin-table';
import { apiServerFetch } from '@/lib/api';

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured?: boolean;
  sponsored?: boolean;
  pricingModel?: string;
  viewCount?: number;
  category?: { name: string } | null;
};

export default async function AiToolsListAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ limit: '50' });
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);

  const result = await apiServerFetch<ToolRow[]>(`/ai-tools/admin?${qs.toString()}`);
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="AI tools"
        description="Create, publish, feature, sponsor, bulk-manage, and export AI tools."
        actions={<Badge>{rows.length} loaded</Badge>}
      />

      <AiToolsListSearch defaultSearch={params.search} defaultStatus={params.status} />
      <AiToolsCsvToolbar />
      <AiToolCreateForm />

      {result.error ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load tools</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AiToolsAdminTable rows={rows} />
      )}
    </div>
  );
}
