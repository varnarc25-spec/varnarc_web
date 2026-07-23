import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { AiAffiliateCta } from '@/components/ai-tools/ai-affiliate-cta';
import { AiBookmarkButton } from '@/components/ai-tools/ai-bookmark-button';
import { AiToolCard } from '@/components/ai-tools/ai-tool-card';
import { AiToolGallery } from '@/components/ai-tools/ai-tool-gallery';
import {
  formatPricingModel,
  unwrapList,
  type AiCategory,
  type AiRelatedResponse,
  type AiToolDetail,
  type AiToolListItem,
} from '@/components/ai-tools/types';
import { breadcrumbJsonLd, faqJsonLd, productJsonLd, softwareApplicationJsonLd } from '@/components/seo/json-ld';
import { buildSeoMetadata } from '@/lib/seo-metadata';
import { AiFollowCategoryButton } from '@/components/ai-tools/ai-follow-category-button';
import { UserReviewWidget } from '@/components/reviews/user-review-widget';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import { getApiAccessToken } from '@/lib/api';
import { RecordContentView } from '@/components/record-content-view';

type Props = { params: Promise<{ slug: string }> };

type Faq = { question: string; answer: string };

function parseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Faq =>
      typeof item === 'object' &&
      item !== null &&
      'question' in item &&
      'answer' in item &&
      typeof (item as Faq).question === 'string' &&
      typeof (item as Faq).answer === 'string',
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data } = await apiPublicFetch<AiToolDetail>(`/ai-tools/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    return buildSeoMetadata({
      entityType: 'ai_tool',
      entityId: data.id,
      path: `/ai-tools/${data.slug}`,
      title: data.seoTitle || data.name,
      description: data.seoDescription || data.shortDescription || data.description,
      image: data.coverImageUrl || data.logoUrl,
    });
  } catch {
    try {
      const { data: category } = await apiPublicFetch<AiCategory>(`/ai-tools/categories/slug/${slug}`, {
        next: { revalidate: 60 },
      });
      return {
        title: `${category.name} AI Tools`,
        description: category.description || `Browse ${category.name} AI tools.`,
        alternates: { canonical: `/ai-tools/${category.slug}` },
      };
    } catch {
      return { title: 'AI Tool' };
    }
  }
}

export default async function AiToolDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    const { data } = await apiPublicFetch<AiToolDetail>(`/ai-tools/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    void fetch(`${apiUrl}/ai-tools/${data.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'VIEW' }),
    }).catch(() => undefined);

    const relatedResult = await apiPublicFetch<AiRelatedResponse>(`/ai-tools/slug/${slug}/related`, {
      next: { revalidate: 60 },
    }).catch(() => ({ data: {} as AiRelatedResponse }));

    const related = relatedResult.data ?? {};
    const faqs = parseFaqs(data.faqs);
    const ratingSummary = related.ratingSummary;
    const avgRating = ratingSummary?.averageRating != null ? Number(ratingSummary.averageRating) : null;
    const totalRatings = ratingSummary?.totalRatings ?? 0;
    const platforms = Array.isArray(data.platforms) ? data.platforms : [];

    const structuredData = softwareApplicationJsonLd({
      name: data.name,
      description: data.shortDescription || data.description,
      url: `/ai-tools/${data.slug}`,
      applicationCategory: data.category?.name,
      operatingSystem: platforms.length ? platforms.join(', ') : undefined,
      image: data.coverImageUrl || data.logoUrl,
      offers: {
        price: data.monthlyPrice ?? (data.pricingModel === 'FREE' ? 0 : undefined),
        description: formatPricingModel(data.pricingModel) || data.pricingDetails,
      },
      aggregateRating:
        avgRating != null && totalRatings > 0
          ? { ratingValue: avgRating, reviewCount: totalRatings }
          : undefined,
    });

    const breadcrumbLd = breadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'AI Tools', url: '/ai-tools' },
      ...(data.category
        ? [{ name: data.category.name, url: `/ai-tools/${data.category.slug}` }]
        : []),
      { name: data.name, url: `/ai-tools/${data.slug}` },
    ]);

    const productLd = productJsonLd({
      name: data.name,
      description: data.shortDescription || data.description,
      url: `/ai-tools/${data.slug}`,
      image: data.coverImageUrl || data.logoUrl,
      brand: data.company?.name || data.name,
      offers: {
        price: data.monthlyPrice ?? (data.pricingModel === 'FREE' ? 0 : undefined),
        url: data.affiliateUrl || data.website || `/ai-tools/${data.slug}`,
      },
      aggregateRating:
        avgRating != null && totalRatings > 0
          ? { ratingValue: avgRating, reviewCount: totalRatings }
          : undefined,
    });

    return (
      <main className="site-container py-12">
        <RecordContentView
          entityType="ai_tool"
          entityId={data.id}
          metadata={{ slug: data.slug, title: data.name }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        {faqs.length ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
        ) : null}

        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'AI Tools', href: '/ai-tools' },
            ...(data.category
              ? [{ label: data.category.name, href: `/ai-tools/${data.category.slug}` }]
              : []),
            { label: data.name },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt=""
              className="h-12 w-12 rounded-md border border-[var(--varnarc-border)] object-cover"
            />
          ) : null}
          <h1 className="text-3xl font-semibold text-[var(--varnarc-ink)]">{data.name}</h1>
          {data.featured ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">Featured</span>
          ) : null}
          {data.sponsored ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">Sponsored</span>
          ) : null}
          {data.pricingModel ? (
            <span className="rounded bg-[var(--varnarc-muted)] px-2 py-0.5 text-xs">
              {formatPricingModel(data.pricingModel)}
            </span>
          ) : null}
        </div>

        {avgRating != null && totalRatings > 0 ? (
          <p className="mt-2 text-sm text-amber-600">
            {avgRating.toFixed(1)} / 5 · {totalRatings} review{totalRatings === 1 ? '' : 's'}
          </p>
        ) : null}

        {data.shortDescription || data.description ? (
          <p className="mt-4 text-[var(--varnarc-subtle)]">{data.shortDescription || data.description}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AiAffiliateCta toolId={data.id} affiliateUrl={data.affiliateUrl} website={data.website} />
          {data.documentation ? (
            <a
              href={data.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--varnarc-brand)] hover:underline"
            >
              Documentation
            </a>
          ) : null}
          <Link href="/ai-tools/bookmarks" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            My bookmarks
          </Link>
        </div>

        <div className="mt-8">
          <AiToolGallery
            logoUrl={data.logoUrl}
            coverImageUrl={data.coverImageUrl}
            screenshots={data.screenshots}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_280px]">
          <div className="space-y-10">
            {data.description && data.shortDescription ? (
              <section>
                <h2 className="font-semibold">About</h2>
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)] whitespace-pre-wrap">{data.description}</p>
              </section>
            ) : null}

            {(data.features ?? []).length ? (
              <section>
                <h2 className="font-semibold">Features</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {data.features!.map((f) => (
                    <li key={f.id ?? f.name}>{f.name}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(data.integrations ?? []).length ? (
              <section>
                <h2 className="font-semibold">Integrations</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {data.integrations!.map((i) => (
                    <li key={i.id ?? i.name}>{i.name}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h2 className="font-semibold">Pricing</h2>
              <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--varnarc-border)]">
                <table className="min-w-full text-left text-sm">
                  <tbody>
                    <tr className="border-b border-[var(--varnarc-border)]">
                      <th className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">Model</th>
                      <td className="px-3 py-2">{formatPricingModel(data.pricingModel) || '—'}</td>
                    </tr>
                    <tr className="border-b border-[var(--varnarc-border)]">
                      <th className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">Monthly</th>
                      <td className="px-3 py-2">{data.monthlyPrice || '—'}</td>
                    </tr>
                    <tr className="border-b border-[var(--varnarc-border)]">
                      <th className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">Annual</th>
                      <td className="px-3 py-2">{data.annualPrice || '—'}</td>
                    </tr>
                    <tr className="border-b border-[var(--varnarc-border)]">
                      <th className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">Free plan</th>
                      <td className="px-3 py-2">{data.freePlan ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 font-medium text-[var(--varnarc-subtle)]">Free trial</th>
                      <td className="px-3 py-2">{data.freeTrial ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {data.pricingDetails ? (
                <p className="mt-2 text-sm text-[var(--varnarc-subtle)]">{data.pricingDetails}</p>
              ) : null}
            </section>

            {faqs.length ? (
              <section>
                <h2 className="font-semibold">FAQs</h2>
                <dl className="mt-3 space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.question}>
                      <dt className="font-medium">{faq.question}</dt>
                      <dd className="mt-1 text-sm text-[var(--varnarc-subtle)]">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {(related.comparisons ?? []).length ? (
              <section>
                <h2 className="font-semibold">Comparisons</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.comparisons!.map((c) => (
                    <li key={c.id}>
                      <Link href={`/compare/${c.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(related.relatedInCategory ?? []).length ? (
              <section>
                <h2 className="font-semibold">Related tools</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {related.relatedInCategory!.map((t) => (
                    <AiToolCard
                      key={t.id}
                      name={t.name}
                      slug={t.slug}
                      description={t.shortDescription || t.description}
                      pricingModel={t.pricingModel}
                      freePlan={t.freePlan}
                      featured={t.featured}
                      sponsored={t.sponsored}
                      logoUrl={t.logoUrl}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <UserReviewWidget
              entityType="ai_tool"
              entityId={data.id}
              initialReviews={related.userReviews ?? []}
              averageRating={avgRating}
              totalRatings={totalRatings}
            />

            {(related.editorialReviews ?? []).length ? (
              <section>
                <h2 className="font-semibold">Editorial reviews</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.editorialReviews!.map((r) => (
                    <li key={r.id}>
                      <Link href={`/reviews/${r.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                        {r.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="space-y-2 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 text-sm">
              <h3 className="font-semibold">Quick facts</h3>
              {data.category ? (
                <p>
                  Category:{' '}
                  <Link
                    href={`/ai-tools/${data.category.slug}`}
                    className="text-[var(--varnarc-brand)] hover:underline"
                  >
                    {data.category.name}
                  </Link>
                </p>
              ) : null}
              <p>API: {data.apiAvailable ? 'Available' : 'Not listed'}</p>
              {platforms.length ? <p>Platforms: {platforms.join(', ')}</p> : null}
              {data.company ? (
                <p>
                  Company:{' '}
                  <Link href={`/directory/${data.company.slug}`} className="text-[var(--varnarc-brand)] hover:underline">
                    {data.company.name}
                  </Link>
                </p>
              ) : null}
            </div>
            <AiBookmarkButton toolId={data.id} />
            <AiAffiliateCta toolId={data.id} affiliateUrl={data.affiliateUrl} website={data.website} />
          </aside>
        </div>
      </main>
    );
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 404) throw e;
  }

  try {
    const { data: category } = await apiPublicFetch<AiCategory>(`/ai-tools/categories/slug/${slug}`, {
      next: { revalidate: 60 },
    });

    const { data: listings } = await apiPublicFetch<AiToolListItem[]>(
      `/ai-tools?category=${encodeURIComponent(slug)}&limit=24`,
      { next: { revalidate: 60 } },
    ).catch(() => ({ data: [] as AiToolListItem[] }));

    const tools = unwrapList(listings);

    let initialFollowing = false;
    try {
      const token = await getApiAccessToken();
      if (token) {
        const followsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/ai-tools/me/follows`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (followsRes.ok) {
          const json = (await followsRes.json()) as {
            data?: Array<{ categoryId?: string; category?: { id?: string } }>;
          };
          const rows = Array.isArray(json.data) ? json.data : [];
          initialFollowing = rows.some((r) => r.categoryId === category.id || r.category?.id === category.id);
        }
      }
    } catch {
      initialFollowing = false;
    }

    return (
      <main className="site-container py-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'AI Tools', href: '/ai-tools' },
            { label: category.name },
          ]}
        />
        <h1 className="mt-4 text-3xl font-semibold">{category.name}</h1>
        {category.description ? (
          <p className="mt-3 text-[var(--varnarc-subtle)]">{category.description}</p>
        ) : null}
        <div className="mt-4">
          <AiFollowCategoryButton categoryId={category.id} initialFollowing={initialFollowing} />
        </div>

        {(category.children ?? []).length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {category.children!.map((c) => (
              <Link
                key={c.id}
                href={`/ai-tools/${c.slug}`}
                className="rounded-md border border-[var(--varnarc-border)] px-3 py-1.5 text-sm hover:bg-[var(--varnarc-muted)]"
              >
                {c.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <AiToolCard
              key={t.id}
              name={t.name}
              slug={t.slug}
              description={t.shortDescription || t.description}
              pricingModel={t.pricingModel}
              freePlan={t.freePlan}
              featured={t.featured}
              sponsored={t.sponsored}
              logoUrl={t.logoUrl}
            />
          ))}
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
