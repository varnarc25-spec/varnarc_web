import {
  fetchArticles,
  fetchBusinesses,
  fetchCalculators,
  fetchComparisons,
  fetchHomepageDefault,
  fetchReviews,
  fetchTrendingSearches,
} from '@/services/content';
import { HomepageBuilder } from '@/features/home/homepage-builder';
import { StaticHomePage } from '@/features/home/static-home-page';
import { isClassicHomeLayout } from '@/features/home/classic-home-renderer';

export const revalidate = 60;

/**
 * Homepage uses the CMS default layout when configured.
 * Classic-theme layouts render the original marketing design with live API data.
 */
export default async function HomePage() {
  const layoutRes = await fetchHomepageDefault();
  const layout = layoutRes.data;

  if (!layout?.sections?.length) {
    return <StaticHomePage />;
  }

  const categoryIds = new Set<string>();
  let trendingLimit = 8;
  for (const section of layout.sections) {
    for (const instance of section.widgetInstances ?? []) {
      const settings = (instance.settings || {}) as { source?: string; categoryId?: string; limit?: number };
      if (settings.source === 'category' && settings.categoryId) {
        categoryIds.add(settings.categoryId);
      }
      if (instance.widget?.slug === 'trending' && settings.limit) {
        trendingLimit = Math.max(trendingLimit, settings.limit);
      }
      if (instance.widget?.slug === 'hero' && settings.limit) {
        trendingLimit = Math.max(trendingLimit, settings.limit);
      }
    }
  }

  const classic = isClassicHomeLayout(layout);
  const articleLimit = classic ? 12 : 12;

  const [articles, featured, reviews, calculators, businesses, comparisons, trending, ...categoryResults] =
    await Promise.all([
      fetchArticles(articleLimit),
      fetchArticles(articleLimit, { featured: true }),
      fetchReviews(12),
      fetchCalculators(12),
      fetchBusinesses(12),
      fetchComparisons(8),
      fetchTrendingSearches(trendingLimit),
      ...[...categoryIds].map((categoryId) => fetchArticles(articleLimit, { categoryId })),
    ]);

  const articlesByCategory: Record<string, typeof articles.data> = {};
  [...categoryIds].forEach((categoryId, index) => {
    articlesByCategory[categoryId] = categoryResults[index]?.data ?? [];
  });

  return (
    <HomepageBuilder
      data={{
        layout,
        articles: articles.data,
        featuredArticles: featured.data,
        articlesByCategory,
        reviews: reviews.data,
        calculators: calculators.data,
        businesses: businesses.data,
        comparisons: comparisons.data,
        trending: trending.data,
      }}
    />
  );
}
