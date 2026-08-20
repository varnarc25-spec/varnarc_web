import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { ReviewViewTracker } from '@/components/reviews/review-view-tracker';
import { RecordContentView } from '@/components/record-content-view';
import { UserReviewWidget } from '@/components/reviews/user-review-widget';
import { ReviewMediaGallery } from '@/components/reviews/review-media-gallery';
import { JsonLd, breadcrumbJsonLd, reviewJsonLd } from '@/components/seo/json-ld';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { apiPublicFetch, ApiError } from '@/services/api-client';

type Props = { params: Promise<{ slug: string }> };

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const recommendationLabels: Record<string, string> = {
  best_overall: 'Best Overall',
  best_budget: 'Best Budget',
  best_premium: 'Best Premium',
  best_performance: 'Best Performance',
  editors_choice: "Editor's Choice",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<{
      id: string;
      title: string;
      summary?: string | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      body?: string | null;
    }>(`/reviews/slug/${slug}`, { cache: 'no-store' });
    return buildSeoMetadata({
      entityType: 'review',
      entityId: data.id,
      path: `/reviews/${slug}`,
      title: data.seoTitle || data.title,
      description: data.seoDescription || data.summary || data.body?.slice(0, 160),
    });
  } catch {
    return { title: 'Review' };
  }
}

export default async function ReviewDetailPage({ params }: Props) {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<{
      id: string;
      title: string;
      summary?: string | null;
      body?: string | null;
      verdict?: string | null;
      recommendation?: string | null;
      overallScore?: number | string | null;
      entityType?: string | null;
      entityId?: string | null;
      publishedAt?: string | null;
      updatedAt?: string | null;
      author?: { displayName?: string | null; username?: string | null } | null;
      product?: { name?: string | null; category?: string | null } | null;
      pros?: Array<{ text: string }>;
      cons?: Array<{ text: string }>;
      scores?: Array<{ label: string; score: number | string; maxScore: number | string }>;
      sections?: Array<{ title: string; body?: string | null }>;
      metadata?: unknown;
    }>(`/reviews/slug/${slug}`, { cache: 'no-store' });

    const url = `${siteUrl}/reviews/${slug}`;
    const score = data.overallScore != null ? Number(data.overallScore) : null;

    let userReviewData: {
      reviews: Array<{
        id: string;
        rating: number | string;
        title?: string | null;
        comment?: string | null;
        user?: { displayName?: string | null; email?: string | null } | null;
      }>;
      summary: { averageRating?: number | string | null; totalRatings?: number };
    } | null = null;

    if (data.entityType && data.entityId) {
      try {
        const entityRes = await apiPublicFetch<{
          reviews: Array<{
            id: string;
            rating: number | string;
            title?: string | null;
            comment?: string | null;
            user?: { displayName?: string | null; email?: string | null } | null;
          }>;
          summary: { averageRating?: number | string | null; totalRatings?: number };
        }>(`/reviews/entity/${data.entityType}/${data.entityId}?limit=10`, { cache: 'no-store' });
        userReviewData = entityRes.data;
      } catch {
        userReviewData = null;
      }
    }

    return (
      <>
        <ReviewViewTracker reviewId={data.id} />
        <RecordContentView
          entityType="review"
          entityId={data.id}
          metadata={{ slug, title: data.title }}
        />
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', url: siteUrl },
              { name: 'Reviews', url: `${siteUrl}/reviews` },
              { name: data.title, url },
            ]),
            reviewJsonLd({ title: data.title, url, score }),
          ]}
        />
        <PageShell
          title={data.title}
          description={
            data.summary ||
            (score != null ? `Varnarc Editorial Rating: ${score.toFixed(1)} / 5` : undefined)
          }
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Reviews', href: '/reviews' },
            { label: data.title },
          ]}
        >
          {data.recommendation ? (
            <span className="mb-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
              {recommendationLabels[data.recommendation] ?? data.recommendation}
            </span>
          ) : null}

          <p className="mb-6 text-sm text-slate-600">
            {score != null ? (
              <span className="mr-3 font-semibold text-slate-900">
                Varnarc Editorial Rating: {score.toFixed(1)} / 5
              </span>
            ) : null}
            Reviewed by{' '}
            {data.author?.username ? (
              <Link
                href={`/authors/${data.author.username}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                {data.author.displayName || data.author.username}
              </Link>
            ) : (
              <Link
                href="/authors/varnarc-editorial"
                className="font-semibold text-blue-700 hover:underline"
              >
                Varnarc Editorial
              </Link>
            )}
            {data.publishedAt
              ? ` · Published ${new Date(data.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : ''}
            {data.updatedAt
              ? ` · Last reviewed ${new Date(data.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : ''}
          </p>

          <ReviewMediaGallery metadata={data.metadata} />

          {data.scores?.length ? (
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.scores.map((s) => (
                <div key={s.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {Number(s.score).toFixed(1)}
                    <span className="text-sm font-normal text-slate-500">
                      {' '}
                      / {Number(s.maxScore)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {data.body ? <MarkdownContent content={data.body} /> : null}

          {data.sections?.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              {section.body ? (
                <div className="mt-3">
                  <MarkdownContent content={section.body} />
                </div>
              ) : null}
            </section>
          ))}

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold text-green-700">Pros</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(data.pros ?? []).map((p, i) => (
                  <li key={`${p.text}-${i}`}>{p.text}</li>
                ))}
                {!data.pros?.length ? <li>No pros listed.</li> : null}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold text-red-700">Cons</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {(data.cons ?? []).map((c, i) => (
                  <li key={`${c.text}-${i}`}>{c.text}</li>
                ))}
                {!data.cons?.length ? <li>No cons listed.</li> : null}
              </ul>
            </div>
          </div>

          {data.verdict ? (
            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Verdict</h2>
              <p className="mt-2 text-slate-700">{data.verdict}</p>
            </div>
          ) : null}

          {data.entityType && data.entityId ? (
            <UserReviewWidget
              entityType={data.entityType}
              entityId={data.entityId}
              initialReviews={userReviewData?.reviews ?? []}
              averageRating={userReviewData?.summary?.averageRating}
              totalRatings={userReviewData?.summary?.totalRatings ?? 0}
            />
          ) : null}

          <div className="mt-10 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
            <p>
              <Link
                href="/reviews#how-varnarc-reviews"
                className="font-semibold text-blue-700 hover:underline"
              >
                How we review
              </Link>
              {' · '}
              <Link
                href={`/contact?type=correction&page=${encodeURIComponent(`/reviews/${slug}`)}`}
                className="font-semibold text-blue-700 hover:underline"
              >
                Report a correction
              </Link>
            </p>
            <p className="text-[13px] leading-6 text-slate-500">
              This review is for general research. Editorial ratings reflect Varnarc&apos;s
              assessment at the time of review and are not a recommendation for every user. Verify
              important details with the manufacturer, provider or other official source.{' '}
              <Link href="/disclaimer" className="font-semibold text-blue-700 hover:underline">
                Disclaimer
              </Link>
            </p>
          </div>
        </PageShell>
      </>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
