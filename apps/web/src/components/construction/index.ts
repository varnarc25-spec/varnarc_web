export type {
  ConstructionCrumb,
  ConstructionLinkItem,
  ConstructionFaqItem,
  ConstructionMetric,
  ConstructionBreakdownRow,
  ConstructionAssumption,
  UnitOption,
} from './types';
export { cx, cn } from './styles';

export { ConstructionPageShell } from './construction-page-shell';
export { ConstructionHero } from './construction-hero';
export { ConstructionBreadcrumbs } from './construction-breadcrumbs';
export { ConstructionSection } from './construction-section';
export { ToolCard } from './tool-card';
export { MaterialCard } from './material-card';
export { FeatureCard } from './feature-card';
export { ResultCard, MetricCard } from './result-card';
export { ComparisonCard } from './comparison-card';
export { ConstructionFAQ } from './construction-faq';
export { EmptyState } from './empty-state';
export { LoadingState } from './loading-state';
export { ErrorState } from './error-state';
export { StickyMobileCTA } from './sticky-mobile-cta';
export { RelatedTools } from './related-tools';
export { RelatedGuides } from './related-guides';
export { RelatedMaterials } from './related-materials';
export { RelatedComparisons } from './related-comparisons';
export { RelatedCityPages } from './related-city-pages';
export {
  RelatedCalculatorLinks,
  ConstructionRelatedLinks,
  ConstructionInlineRelatedLinks,
} from './construction-related-links';
export {
  ConstructionRelatedSection,
  ConstructionRelatedInlineChips,
  ConstructionRelatedScope,
} from './construction-related-section';
export { ConstructionSeo } from './construction-seo';
export { ConstructionAnalyticsBeacon } from './construction-analytics-beacon';
export { ConstructionSearchAnalytics } from './construction-search-analytics';
export { ConstructionCompareAnalytics } from './construction-compare-analytics';
export { ConstructionTrackLink } from './construction-track-link';
export { ConstructionLandingPage } from './landing/landing-page';
export { ConstructionIntentNavigator } from './landing/intent-navigator';
export { AskConstructionSearch } from './ask/ask-construction-search';
export { AffiliateCta } from './affiliate-cta';

export {
  CalculatorShell,
  CalculatorForm,
  CalculatorInput,
  CalculatorSelect,
  UnitSelector,
  CalculationResult,
  CalculationBreakdown,
  AssumptionPanel,
  MethodologyPanel,
} from './calculator';

/** Back-compat: chip RelatedCalculators with `links` prop */
export { MaterialCard as ConstructionMaterialCard } from './material-card';
export { RelatedCalculators } from './related-calculators-compat';
export { ConstructionDetailSection } from './construction-detail-section';
