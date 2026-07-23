import type {
  ArticleListItem,
  BusinessListItem,
  CalculatorListItem,
  ComparisonListItem,
  ReviewListItem,
  TrendingSearchItem,
} from '@/services/content';
import {
  aiToolsTiles,
  articles as staticArticles,
  comparisons as staticComparisons,
  popularSearches,
  quickTools,
  reviews as staticReviews,
} from '@/features/home/static-data';

export type ClassicArticleCard = {
  title: string;
  category: string;
  date: string;
  href: string;
  image: string;
};

export type ClassicComparisonCard = {
  title: string;
  href: string;
  leftImage: string;
  rightImage: string;
};

export type ClassicReviewCard = {
  title: string;
  score: number;
  href: string;
  image: string;
};

export type ClassicCalculatorTile = {
  name: string;
  href: string;
  color: string;
  icon: string;
};

function formatArticleDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function mapTrendingTerms(trending?: TrendingSearchItem[]) {
  if (trending?.length) {
    return trending.map((t) => t.keyword);
  }
  return [...popularSearches];
}

export function mapCalculatorTiles(calculators: CalculatorListItem[], limit = 10): ClassicCalculatorTile[] {
  if (!calculators.length) {
    return quickTools.slice(0, limit).map((t) => ({ ...t }));
  }
  return calculators.slice(0, limit).map((c, i) => {
    const template = quickTools[i % quickTools.length]!;
    return {
      name: c.name,
      href: `/calculators/${c.slug}`,
      color: template.color,
      icon: template.icon,
    };
  });
}

export function mapArticleCards(articles: ArticleListItem[], limit = 5): ClassicArticleCard[] {
  if (!articles.length) {
    return staticArticles.slice(0, limit).map((a) => ({ ...a }));
  }
  const placeholders = staticArticles.map((a) => a.image);
  return articles.slice(0, limit).map((a, i) => ({
    title: a.title,
    category: 'Article',
    date: formatArticleDate(a.publishedAt),
    href: `/articles/${a.slug}`,
    image: placeholders[i % placeholders.length]!,
  }));
}

export function mapComparisonCards(comparisons: ComparisonListItem[], limit = 2): ClassicComparisonCard[] {
  if (!comparisons.length) {
    return staticComparisons.slice(0, limit).map((c) => ({
      title: c.title,
      href: c.href,
      leftImage: c.leftImage,
      rightImage: c.rightImage,
    }));
  }
  const placeholders = staticComparisons.map((c) => ({ left: c.leftImage, right: c.rightImage }));
  return comparisons.slice(0, limit).map((c, i) => {
    const ph = placeholders[i % placeholders.length]!;
    return {
      title: c.title,
      href: `/compare/${c.slug}`,
      leftImage: ph.left,
      rightImage: ph.right,
    };
  });
}

export function mapReviewCards(reviews: ReviewListItem[], limit = 4): ClassicReviewCard[] {
  if (!reviews.length) {
    return staticReviews.slice(0, limit).map((r) => ({ ...r }));
  }
  const placeholders = staticReviews.map((r) => r.image);
  return reviews.slice(0, limit).map((r, i) => ({
    title: r.title,
    score: r.overallScore != null ? Number(r.overallScore) : 4.5,
    href: `/reviews/${r.slug}`,
    image: placeholders[i % placeholders.length]!,
  }));
}

export function mapAiToolTiles() {
  return aiToolsTiles.map((t) => ({ ...t }));
}
