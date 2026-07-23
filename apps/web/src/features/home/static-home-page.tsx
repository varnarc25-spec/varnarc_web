'use client';

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

/** Static homepage — same visual design as the CMS classic layout (demo / fallback). */
export function StaticHomePage() {
  return (
    <main className="w-full bg-white">
      <ClassicHeroSection popularTerms={mapTrendingTerms()} />
      <ClassicCalculatorsSection title="Popular Calculators & Tools" tiles={mapCalculatorTiles([])} />
      <ClassicCategoriesSection title="Explore by Category" />
      <ClassicArticlesSection title="Trending Articles" articles={mapArticleCards([])} />
      <ClassicAiToolsSection title="Smart AI Tools" tiles={mapAiToolTiles()} />
      <ClassicTripleColumnSection
        comparisons={mapComparisonCards([])}
        reviews={mapReviewCards([])}
      />
      <ClassicTrustNewsletterSection />
    </main>
  );
}
