import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { CreatePromptForm } from '@/components/ai-ops/ai-ops-forms';

type Prompt = { id: string; slug: string; name: string; template: string; model?: { name: string } | null };
type Model = { id: string; slug: string; name: string };

export default async function AiOpsPromptsPage() {
  const [promptsRes, modelsRes] = await Promise.all([
    apiServerFetch<Prompt[]>('/ai/prompts?limit=50'),
    apiServerFetch<Model[]>('/ai/models?limit=50'),
  ]);
  const prompts = promptsRes.data ?? [];
  const models = modelsRes.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Prompt library" description="Reusable prompt templates with {{variable}} interpolation." />
      <AiOpsNav active="/ai-ops/prompts" />

      <Card>
        <CardHeader>
          <CardTitle>Add prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePromptForm models={models} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {prompts.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
              <p className="text-sm text-[var(--varnarc-subtle)]">
                {p.slug}
                {p.model?.name ? ` · ${p.model.name}` : ''}
              </p>
            </CardHeader>
            <CardContent>
              <pre className="max-h-40 overflow-auto rounded bg-[var(--varnarc-muted)] p-3 text-xs whitespace-pre-wrap">
                {p.template}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
