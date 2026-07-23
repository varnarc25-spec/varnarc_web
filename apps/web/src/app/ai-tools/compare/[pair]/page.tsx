import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentLayout } from '@/components/layout/content-layout';
import { AiCompareWidget } from '@/components/ai-tools/ai-compare-widget';
import { type AiCompareResponse, type AiToolDetail } from '@/components/ai-tools/types';
import { apiPublicFetch } from '@/services/api-client';

type Props = {
  params: Promise<{ pair: string }>;
};

function parsePair(pair: string): string[] {
  return decodeURIComponent(pair)
    .split(/-vs-/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const slugs = parsePair(pair);
  const title =
    slugs.length >= 2
      ? `${slugs.map((s) => s.replace(/-/g, ' ')).join(' vs ')} — Compare`
      : 'Compare AI Tools';
  return {
    title,
    description: `Side-by-side comparison of ${slugs.join(' vs ') || 'AI tools'}.`,
    alternates: { canonical: `/ai-tools/compare/${pair}` },
  };
}

export const revalidate = 60;

export default async function AiToolsComparePairPage({ params }: Props) {
  const { pair } = await params;
  const slugs = parsePair(pair);

  let tools: AiToolDetail[] = [];
  if (slugs.length >= 2) {
    const result = await apiPublicFetch<AiCompareResponse>(
      `/ai-tools/compare?slugs=${encodeURIComponent(slugs.join(','))}`,
      { next: { revalidate: 60 } },
    ).catch(() => ({ data: { slugs, tools: [] } as AiCompareResponse }));
    tools = result.data?.tools ?? [];
  }

  const title =
    tools.length >= 2
      ? `${tools.map((t) => t.name).join(' vs ')}`
      : slugs.length >= 2
        ? slugs.join(' vs ')
        : 'Compare AI Tools';

  return (
    <ContentLayout
      title={title}
      description="Side-by-side comparison of features, pricing, and integrations."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: 'Compare', href: '/ai-tools/compare' },
        { label: title },
      ]}
    >
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href="/ai-tools/compare" className="text-[var(--varnarc-brand)] hover:underline">
          ← Custom compare
        </Link>
      </div>
      <AiCompareWidget initialSlugs={slugs} initialTools={tools} />
    </ContentLayout>
  );
}
