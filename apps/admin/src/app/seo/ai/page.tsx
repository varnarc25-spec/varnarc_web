import { PageHeader } from '@varnarc/ui';
import { AiSeoAssistant } from '@/components/ai-seo-assistant';

export default function SeoAiPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI SEO assistant"
        description="Generate meta titles, descriptions, keywords, and optimization tips from page content."
      />
      <AiSeoAssistant />
    </div>
  );
}
