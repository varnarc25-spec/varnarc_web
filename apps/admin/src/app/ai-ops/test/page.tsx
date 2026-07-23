import { Card, CardContent, CardHeader, CardTitle, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { PromptTestConsole } from '@/components/ai-ops/ai-ops-forms';

type Prompt = { id: string; slug: string; name: string };
type Model = { id: string; slug: string; name: string };

export default async function AiOpsTestPage() {
  const [promptsRes, modelsRes] = await Promise.all([
    apiServerFetch<Prompt[]>('/ai/prompts?limit=50'),
    apiServerFetch<Model[]>('/ai/models?limit=50'),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Prompt test console" description="Run any prompt template against the configured LLM provider." />
      <AiOpsNav active="/ai-ops/test" />

      <Card>
        <CardHeader>
          <CardTitle>Run prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptTestConsole prompts={promptsRes.data ?? []} models={modelsRes.data ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
