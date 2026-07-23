import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@varnarc/ui';
import { AiToolEditForm } from '@/components/ai-tools-forms';
import { apiServerFetch } from '@/lib/api';

type AiTool = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  pricingModel?: string | null;
  pricingDetails?: string | null;
  monthlyPrice?: string | null;
  annualPrice?: string | null;
  website?: string | null;
  documentation?: string | null;
  affiliateUrl?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  freePlan?: boolean;
  freeTrial?: boolean;
  apiAvailable?: boolean;
  categoryId?: string | null;
  companyId?: string | null;
  features?: Array<{ name: string }>;
  integrations?: Array<{ name: string }>;
  screenshots?: Array<{ url?: string | null }>;
  faqs?: Array<{ question: string; answer: string }> | null;
};

export default async function AiToolEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, categoriesResult, companiesResult] = await Promise.all([
    apiServerFetch<AiTool>(`/ai-tools/${id}`),
    apiServerFetch<Array<{ id: string; name: string; children?: Array<{ id: string; name: string }> }>>(
      '/ai-tools/categories?limit=100',
    ),
    apiServerFetch<Array<{ id: string; name: string }>>('/directory/listings/admin?limit=100'),
  ]);
  if (result.error || !result.data) notFound();

  const categoriesRaw = Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const categories = categoriesRaw.flatMap((c) => [
    { id: c.id, name: c.name },
    ...(c.children ?? []).map((ch) => ({ id: ch.id, name: `${c.name} › ${ch.name}` })),
  ]);
  const companies = Array.isArray(companiesResult.data) ? companiesResult.data : [];

  return (
    <div>
      <PageHeader
        title={`Edit: ${result.data.name}`}
        description="Update tool details, Directory company link, features, and SEO."
        actions={
          <Link href="/ai-tools/tools" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            ← Back to tools
          </Link>
        }
      />
      <AiToolEditForm tool={result.data} categories={categories} companies={companies} />
    </div>
  );
}
