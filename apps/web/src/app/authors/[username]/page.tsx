import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentLayout } from '@/components/layout/content-layout';
import { apiPublicFetch, ApiError } from '@/services/api-client';
import { SubscribeButton } from '@/components/subscribe-button';
import { formatDate } from '@/lib/format';

type AuthorProfile = {
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  socialLinks: unknown;
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: string | null;
    readingTimeMinutes: number | null;
  }>;
};

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const { data } = await apiPublicFetch<AuthorProfile>(`/users/profile/${username}`, {
      next: { revalidate: 300 },
    });
    return {
      title: data.displayName || username,
      description: data.bio || `Articles by ${data.displayName || username} on Varnarc.`,
      alternates: { canonical: `/authors/${username}` },
    };
  } catch {
    return { title: 'Author' };
  }
}

export default async function AuthorProfilePage({ params }: Props) {
  const { username } = await params;

  try {
    const { data } = await apiPublicFetch<AuthorProfile>(`/users/profile/${username}`, {
      next: { revalidate: 300 },
    });

    return (
      <ContentLayout
        title={data.displayName || username}
        description={data.bio || 'Contributor on Varnarc.'}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Authors', href: '/articles' },
          { label: data.displayName || username },
        ]}
      >
        {data.website ? (
          <p className="mb-6 text-sm">
            <a href={data.website} className="text-[var(--varnarc-brand)] hover:underline" rel="noreferrer" target="_blank">
              Website
            </a>
          </p>
        ) : null}

        <div className="mb-8">
          <SubscribeButton
            subscriptionType="author"
            target={username}
            label={`Follow ${data.displayName || username}`}
          />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-[var(--varnarc-ink)]">Articles</h2>
          {data.articles.length ? (
            <ul className="mt-4 space-y-4">
              {data.articles.map((article) => (
                <li key={article.id} className="rounded-xl border border-slate-200 p-4">
                  <Link href={`/articles/${article.slug}`} className="font-semibold text-[#0b1f3a] hover:underline">
                    {article.title}
                  </Link>
                  {article.excerpt ? <p className="mt-1 text-sm text-slate-500">{article.excerpt}</p> : null}
                  <p className="mt-2 text-xs text-slate-400">
                    {[article.publishedAt ? formatDate(article.publishedAt) : null, article.readingTimeMinutes ? `${article.readingTimeMinutes} min read` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No published articles yet.</p>
          )}
        </section>
      </ContentLayout>
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
