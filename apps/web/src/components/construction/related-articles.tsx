import Link from 'next/link';
import { fetchArticlesByTagSlug } from '@/services/content';

export async function RelatedArticles({ limit = 6 }: { limit?: number }) {
  const { data: articles } = await fetchArticlesByTagSlug('construction', limit);

  if (!articles.length) return null;

  return (
    <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0b1f3a]">Related articles</h2>
      <ul className="mt-4 space-y-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/articles/${article.slug}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-[#f97316]"
            >
              <div className="font-semibold text-[#0b1f3a]">{article.title}</div>
              {article.excerpt ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{article.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
