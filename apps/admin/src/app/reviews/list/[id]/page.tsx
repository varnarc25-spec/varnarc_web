import Link from 'next/link';
import { Badge, PageHeader } from '@varnarc/ui';
import { apiServerFetch } from '@/lib/api';
import { ReviewEditForm } from '@/components/review-edit-form';

type ReviewDetail = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body?: string | null;
  verdict?: string | null;
  overallScore?: number | string | null;
  status: string;
  featuredMediaId?: string | null;
  metadata?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export default async function ReviewEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await apiServerFetch<ReviewDetail>(`/reviews/admin/${id}`);

  if (result.error || !result.data) {
    return (
      <div>
        <PageHeader title="Review" description="Unable to load review" />
        <p className="text-sm text-[var(--varnarc-subtle)]">{result.error || 'Not found'}</p>
        <Link href="/reviews/list" className="mt-4 inline-block text-sm text-[var(--varnarc-brand)] hover:underline">
          Back to reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={result.data.title}
        description={`/reviews/${result.data.slug}`}
        actions={<Badge>{result.data.status}</Badge>}
      />
      <ReviewEditForm review={result.data} />
      <Link href="/reviews/list" className="text-sm text-[var(--varnarc-brand)] hover:underline">
        Back to reviews
      </Link>
    </div>
  );
}
