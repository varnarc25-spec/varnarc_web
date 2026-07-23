import type { ReactNode } from 'react';
import type {
  ArticleListItem,
  BusinessListItem,
  CalculatorListItem,
  ComparisonListItem,
  HomepageLayout,
  ReviewListItem,
  TrendingSearchItem,
} from '@/services/content';
import {
  mapAiToolTiles,
  mapArticleCards,
  mapCalculatorTiles,
  mapComparisonCards,
  mapReviewCards,
  mapTrendingTerms,
} from '@/features/home/classic-home-mappers';
import {
  ClassicAiToolsSection,
  ClassicArticlesSection,
  ClassicCalculatorsSection,
  ClassicCategoriesSection,
  ClassicHeroSection,
  ClassicTripleColumnSection,
  ClassicTrustNewsletterSection,
} from '@/features/home/classic-home-sections';

export type ClassicHomeData = {
  articles: ArticleListItem[];
  featuredArticles?: ArticleListItem[];
  articlesByCategory?: Record<string, ArticleListItem[]>;
  calculators: CalculatorListItem[];
  reviews: ReviewListItem[];
  comparisons: ComparisonListItem[];
  businesses: BusinessListItem[];
  trending?: TrendingSearchItem[];
};

export function isClassicHomeLayout(layout: HomepageLayout | null | undefined): boolean {
  if (!layout?.sections?.length) return false;
  for (const section of layout.sections) {
    for (const instance of section.widgetInstances) {
      const settings = (instance.settings || {}) as { variant?: string };
      if (instance.widget.slug === 'hero' && settings.variant === 'classic') return true;
      if (
        ['categories', 'ai-tools', 'homepage-columns', 'trust-newsletter'].includes(instance.widget.slug)
      ) {
        return true;
      }
    }
  }
  return false;
}

function resolveArticles(
  data: ClassicHomeData,
  settings: { source?: string; categoryId?: string; limit?: number },
) {
  const limit = Number(settings.limit ?? 5);
  const source = settings.source ?? 'latest';
  let list = data.articles;
  if (source === 'featured' && data.featuredArticles?.length) {
    list = data.featuredArticles;
  } else if (source === 'category' && settings.categoryId) {
    list = data.articlesByCategory?.[settings.categoryId] ?? data.articles;
  }
  return mapArticleCards(list, limit);
}

export function renderClassicHomeSection(
  section: HomepageLayout['sections'][number],
  data: ClassicHomeData,
): ReactNode {
  const widgets = [...section.widgetInstances].sort((a, b) => a.sortOrder - b.sortOrder);
  const widget = widgets[0];
  if (!widget) return null;

  const slug = widget.widget.slug;
  const settings = (widget.settings || {}) as Record<string, unknown>;
  const title = section.name;

  if (slug === 'hero') {
    return <ClassicHeroSection key={section.id} popularTerms={mapTrendingTerms(data.trending)} />;
  }

  if (slug === 'calculators') {
    const limit = Number(settings.limit ?? 10);
    return (
      <ClassicCalculatorsSection
        key={section.id}
        title={title}
        tiles={mapCalculatorTiles(data.calculators, limit)}
      />
    );
  }

  if (slug === 'categories') {
    return <ClassicCategoriesSection key={section.id} title={title} />;
  }

  if (slug === 'articles') {
    return (
      <ClassicArticlesSection
        key={section.id}
        title={title}
        articles={resolveArticles(data, settings as { source?: string; categoryId?: string; limit?: number })}
      />
    );
  }

  if (slug === 'ai-tools') {
    return <ClassicAiToolsSection key={section.id} title={title} tiles={mapAiToolTiles()} />;
  }

  if (slug === 'homepage-columns') {
    const comparisonLimit = Number(settings.comparisonLimit ?? 2);
    const reviewLimit = Number(settings.reviewLimit ?? 4);
    return (
      <ClassicTripleColumnSection
        key={section.id}
        comparisons={mapComparisonCards(data.comparisons, comparisonLimit)}
        reviews={mapReviewCards(data.reviews, reviewLimit)}
      />
    );
  }

  if (slug === 'trust-newsletter' || slug === 'newsletter') {
    return <ClassicTrustNewsletterSection key={section.id} />;
  }

  if (slug === 'reviews') {
    const limit = Number(settings.limit ?? 4);
    return (
      <ClassicTripleColumnSection
        key={section.id}
        comparisons={mapComparisonCards(data.comparisons, 2)}
        reviews={mapReviewCards(data.reviews, limit)}
      />
    );
  }

  return null;
}

export function ClassicHomeLayoutView({
  layout,
  data,
}: {
  layout: HomepageLayout;
  data: ClassicHomeData;
}) {
  const sections = [...layout.sections].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <main className="w-full bg-white">
      {sections.map((section) => renderClassicHomeSection(section, data))}
    </main>
  );
}
