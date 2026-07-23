import { Badge, PageHeader } from '@varnarc/ui';
import { AiFeatureManager } from '@/components/ai-feature-manager';
import { apiServerFetch } from '@/lib/api';

type FeatureRow = { name: string; toolCount: number };

export default async function AiToolsFeaturesAdminPage() {
  const result = await apiServerFetch<FeatureRow[]>('/ai-tools/admin/features');
  const rows = Array.isArray(result.data) ? result.data : [];

  return (
    <div>
      <PageHeader
        title="Feature manager"
        description="Rename or remove structured features across the AI tools catalog."
        actions={<Badge>{rows.length} features</Badge>}
      />
      <AiFeatureManager initial={rows} />
    </div>
  );
}
