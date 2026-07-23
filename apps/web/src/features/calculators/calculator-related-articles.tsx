'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArticleThumbnail } from '@/components/articles/article-thumbnail';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  category?: {
    name: string;
    slug: string;
    parent?: { name: string; slug: string } | null;
  } | null;
};

type RelatedArticlesSettings = {
  topicField?: string;
  topicCategorySlugs?: Record<string, string>;
};

const LOAN_TYPE_LABELS: Record<string, string> = {
  home: 'Home loans',
  personal: 'Personal loans',
  car: 'Car loans',
  education: 'Education loans',
};

function categoryLabel(article: RelatedArticle): string | null {
  if (!article.category) return null;
  if (article.category.parent) {
    return `${article.category.parent.name} › ${article.category.name}`;
  }
  return article.category.name;
}

function RelatedArticleRow({ article }: { article: RelatedArticle }) {
  return (
    <li>
      <Link
        href={`/articles/${article.slug}`}
        className="flex gap-3 rounded-lg border border-transparent p-1 transition hover:border-slate-200 hover:bg-slate-50"
      >
        <ArticleThumbnail
          title={article.title}
          imageUrl={article.featuredImageUrl}
          category={article.category}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#f97316] hover:underline">{article.title}</p>
          {categoryLabel(article) ? (
            <p className="mt-0.5 text-xs text-slate-500">{categoryLabel(article)}</p>
          ) : null}
          {article.excerpt ? (
            <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{article.excerpt}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function CalculatorRelatedArticles({
  calculatorId,
  initialArticles,
  relatedArticlesSettings,
  topicField,
  defaultTopic = 'home',
}: {
  calculatorId: string;
  initialArticles: RelatedArticle[];
  relatedArticlesSettings?: RelatedArticlesSettings | null;
  topicField?: string;
  defaultTopic?: string;
}) {
  const activeTopicField = topicField ?? relatedArticlesSettings?.topicField;
  const [topic, setTopic] = useState(defaultTopic);
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);

  const fetchArticles = useCallback(
    async (nextTopic?: string) => {
      setLoading(true);
      try {
        const qs = nextTopic ? `?topic=${encodeURIComponent(nextTopic)}` : '';
        const res = await fetch(`${apiUrl}/calculators/${calculatorId}/related-articles${qs}`, {
          cache: 'no-store',
        });
        const json = (await res.json()) as { data?: RelatedArticle[] };
        setArticles(Array.isArray(json.data) ? json.data : []);
      } catch {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [calculatorId],
  );

  useEffect(() => {
    function onTopicChange(e: Event) {
      const detail = (e as CustomEvent<{ key: string; value: string }>).detail;
      if (!activeTopicField || detail.key !== activeTopicField) return;
      setTopic(detail.value);
      void fetchArticles(detail.value);
    }
    window.addEventListener('calculator-field-change', onTopicChange);
    return () => window.removeEventListener('calculator-field-change', onTopicChange);
  }, [activeTopicField, fetchArticles]);

  if (!articles.length && !loading) return null;

  const topicLabel =
    activeTopicField && topic
      ? LOAN_TYPE_LABELS[topic] ?? relatedArticlesSettings?.topicCategorySlugs?.[topic]?.replace(/-/g, ' ')
      : null;

  const grouped = articles.reduce<Record<string, RelatedArticle[]>>((acc, article) => {
    const key = categoryLabel(article) ?? 'Articles';
    acc[key] = acc[key] ?? [];
    acc[key].push(article);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);
  const showGroups = groupKeys.length > 1;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#0b1f3a]">Related articles</h2>
          {topicLabel ? (
            <p className="mt-1 text-sm text-slate-600">
              Showing guides for <span className="font-medium text-[#0b1f3a]">{topicLabel}</span>
            </p>
          ) : null}
        </div>
        {loading ? <span className="text-xs text-slate-500">Updating…</span> : null}
      </div>

      {showGroups ? (
        <div className="space-y-6">
          {groupKeys.map((group) => (
            <div key={group}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{group}</h3>
              <ul className="space-y-2">
                {grouped[group]!.map((article) => (
                  <RelatedArticleRow key={article.slug} article={article} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {articles.map((article) => (
            <RelatedArticleRow key={article.slug} article={article} />
          ))}
        </ul>
      )}
    </section>
  );
}
