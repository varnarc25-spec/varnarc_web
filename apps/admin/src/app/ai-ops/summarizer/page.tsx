import { PageHeader } from '@varnarc/ui';
import { AiOpsNav } from '@/components/ai-ops/ai-ops-nav';
import { AiSummarizerPanel } from '@/components/ai-summarizer-panel';
import { AiBatchSummarizer } from '@/components/ai-batch-summarizer';
import { AiEditorialPipeline } from '@/components/ai-editorial-pipeline';

export default function AiOpsSummarizerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Summarizer"
        description="Condense long content — single document, batch runs, or enrich draft articles."
      />
      <AiOpsNav active="/ai-ops/summarizer" />
      <AiSummarizerPanel />
      <AiBatchSummarizer />
      <AiEditorialPipeline />
    </div>
  );
}
