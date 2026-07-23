import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { AiUtilitiesPanel } from '@/components/ai-tools/ai-utilities-panel';

export const metadata: Metadata = {
  title: 'AI Utilities',
  description: 'Run free deterministic AI utilities — prompts, SEO helpers, formatters, and more.',
  alternates: { canonical: '/ai-tools/utilities' },
};

export default function AiToolsUtilitiesPage() {
  return (
    <ContentLayout
      title="AI Utilities"
      description="Lightweight helpers for prompts, summaries, SEO copy, JSON, and markdown."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'Utilities' },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools" className="text-[var(--varnarc-brand)] hover:underline">
          ← AI Tools home
        </Link>
        <Link href="/ai-tools/compare" className="text-[var(--varnarc-brand)] hover:underline">
          Compare tools
        </Link>
      </div>
      <AiUtilitiesPanel />
    </ContentLayout>
  );
}
