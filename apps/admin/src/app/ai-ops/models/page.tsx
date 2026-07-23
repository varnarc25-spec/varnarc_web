import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { CreateModelForm } from '@/components/ai-ops/ai-ops-forms';

type Model = { id: string; slug: string; name: string; provider: string };

export default async function AiOpsModelsPage() {
  const result = await apiServerFetch<Model[]>('/ai/models?limit=50');
  const models = result.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="AI Models" description="Registry of LLM models available for prompts and jobs." />
      <AiOpsNav active="/ai-ops/models" />

      <Card>
        <CardHeader>
          <CardTitle>Add model</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateModelForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered models ({models.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--varnarc-subtle)]">
                <th className="py-2">Name</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Provider</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-b border-[var(--varnarc-border)]">
                  <td className="py-2 font-medium">{m.name}</td>
                  <td className="py-2 font-mono text-xs">{m.slug}</td>
                  <td className="py-2">{m.provider}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
