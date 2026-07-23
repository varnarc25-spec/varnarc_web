import type { PrismaClient } from '@prisma/client';
import { UserRepository, RoleRepository, PermissionRepository, AuditLogRepository } from './identity/user.repository';
import { SecurityEventRepository } from './security/security.repository';
import {
  ArticleRepository,
  CategoryRepository,
  PageRepository,
  MenuRepository,
  TagRepository,
  CommentRepository,
} from './cms/cms.repository';
import { MediaAssetRepository, MediaFolderRepository, MediaAlbumRepository, MediaUsageRepository } from './media/media.repository';
import {
  AdCampaignRepository,
  AdPlacementRepository,
  AdvertisementRepository,
  SponsorRepository,
} from './ads/ads.repository';
import {
  CalculatorRepository,
  CalculatorCategoryRepository,
  SavedCalculationRepository,
} from './calculators/calculator.repository';
import {
  FinanceCategoryRepository,
  BankRepository,
  LoanRepository,
  CreditCardRepository,
  InsuranceProductRepository,
  InvestmentProductRepository,
  InterestRateRepository,
  FinanceGuideRepository,
} from './finance/finance.repository';
import {
  ConstructionCategoryRepository,
  ConstructionBrandRepository,
  ConstructionMaterialRepository,
  CostTemplateRepository,
  ConstructionProjectRepository,
  ConstructionChecklistRepository,
  ConstructionComparisonRepository,
} from './construction/construction.repository';
import {
  AutomobileManufacturerRepository,
  AutomobileVehicleRepository,
  AutomobileMaintenanceRepository,
} from './automobile/automobile.repository';
import {
  ProductRepository,
  ReviewRepository,
  UserReviewRepository,
} from './reviews/reviews.repository';
import {
  ComparisonRepository,
  ComparisonTemplateRepository,
} from './comparison/comparison.repository';
import {
  BusinessRepository,
  BusinessCategoryRepository,
  LeadRequestRepository,
  DirectoryEventRepository,
} from './directory/directory.repository';
import {
  AiCategoryRepository,
  AiToolRepository,
  AiToolBookmarkRepository,
  AiToolEventRepository,
  AiToolRecentlyViewedRepository,
  AiCategoryFollowRepository,
} from './ai-tools/ai-tools.repository';
import {
  SearchIndexRepository,
  SearchQueryRepository,
  SearchResultClickRepository,
  PopularSearchRepository,
} from './search/search.repository';
import {
  AnalyticsEventRepository,
  AnalyticsSessionRepository,
  AnalyticsAggregateRepository,
  TrafficSourceRepository,
  SystemMetricRepository,
  AffiliateConversionRepository,
  AnalyticsSavedReportRepository,
  PageViewRepository,
} from './analytics/analytics.repository';
import {
  SettingRepository,
  ThemeRepository,
  FeatureFlagRepository,
  HomepageLayoutRepository,
  WidgetRepository,
} from './settings/settings.repository';
import {
  SeoMetadataRepository,
  SeoRedirectRepository,
  SeoAuditRepository,
  SeoSitemapRepository,
} from './seo/seo.repository';
import {
  NotificationRepository,
  NotificationTemplateRepository,
  UserNotificationRepository,
} from './notifications/notifications.repository';
import {
  BookmarkRepository,
  UserActivityRepository,
  UserContentSubscriptionRepository,
  UserPreferenceRepository,
} from './user-module/user-module.repository';
import { AiJobRepository, AiModelRepository, AiPromptRepository } from './ai/ai.repository';
import { PlanRepository, SubscriptionRepository, InvoiceRepository, PaymentRepository } from './premium/premium.repository';
import {
  ApiKeyRepository,
  ApiRequestLogRepository,
  WebhookDeliveryRepository,
  WebhookEndpointRepository,
} from './api/api.repository';
import { NewsletterSubscriberRepository, NewsletterTemplateRepository, NewsletterCampaignRepository } from './newsletter/newsletter.repository';

export * from './base.repository';
export * from './identity/user.repository';
export * from './cms/cms.repository';
export * from './media/media.repository';
export * from './ads/ads.repository';
export * from './calculators/calculator.repository';
export * from './finance/finance.repository';
export * from './construction/construction.repository';
export * from './automobile/automobile.repository';
export * from './comparison/comparison.repository';
export * from './reviews/reviews.repository';
export * from './directory/directory.repository';
export * from './ai-tools/ai-tools.repository';
export * from './search/search.repository';
export * from './analytics/analytics.repository';
export * from './settings/settings.repository';
export * from './seo/seo.repository';
export * from './notifications/notifications.repository';
export * from './user-module/user-module.repository';
export * from './ai/ai.repository';
export * from './premium/premium.repository';
export * from './api/api.repository';
export * from './newsletter/newsletter.repository';
export * from './security/security.repository';

/** Convenience factory that wires every domain repository to one Prisma client. */
export function createRepositories(db: PrismaClient) {
  return {
    users: new UserRepository(db),
    roles: new RoleRepository(db),
    permissions: new PermissionRepository(db),
    auditLogs: new AuditLogRepository(db),
    securityEvents: new SecurityEventRepository(db),
    articles: new ArticleRepository(db),
    categories: new CategoryRepository(db),
    pages: new PageRepository(db),
    menus: new MenuRepository(db),
    tags: new TagRepository(db),
    comments: new CommentRepository(db),
    seo: new SeoMetadataRepository(db),
    seoRedirects: new SeoRedirectRepository(db),
    seoAudits: new SeoAuditRepository(db),
    seoSitemap: new SeoSitemapRepository(db),
    notificationTemplates: new NotificationTemplateRepository(db),
    notifications: new NotificationRepository(db),
    userNotifications: new UserNotificationRepository(db),
    userPreferences: new UserPreferenceRepository(db),
    bookmarks: new BookmarkRepository(db),
    userActivity: new UserActivityRepository(db),
    userContentSubscriptions: new UserContentSubscriptionRepository(db),
    mediaAssets: new MediaAssetRepository(db),
    mediaFolders: new MediaFolderRepository(db),
    mediaAlbums: new MediaAlbumRepository(db),
    mediaUsage: new MediaUsageRepository(db),
    adCampaigns: new AdCampaignRepository(db),
    advertisements: new AdvertisementRepository(db),
    adPlacements: new AdPlacementRepository(db),
    sponsors: new SponsorRepository(db),
    calculators: new CalculatorRepository(db),
    calculatorCategories: new CalculatorCategoryRepository(db),
    savedCalculations: new SavedCalculationRepository(db),
    financeCategories: new FinanceCategoryRepository(db),
    banks: new BankRepository(db),
    loans: new LoanRepository(db),
    creditCards: new CreditCardRepository(db),
    insuranceProducts: new InsuranceProductRepository(db),
    investmentProducts: new InvestmentProductRepository(db),
    interestRates: new InterestRateRepository(db),
    financeGuides: new FinanceGuideRepository(db),
    constructionCategories: new ConstructionCategoryRepository(db),
    constructionBrands: new ConstructionBrandRepository(db),
    constructionMaterials: new ConstructionMaterialRepository(db),
    costTemplates: new CostTemplateRepository(db),
    constructionProjects: new ConstructionProjectRepository(db),
    constructionChecklists: new ConstructionChecklistRepository(db),
    constructionComparisons: new ConstructionComparisonRepository(db),
    automobileManufacturers: new AutomobileManufacturerRepository(db),
    automobileVehicles: new AutomobileVehicleRepository(db),
    automobileMaintenance: new AutomobileMaintenanceRepository(db),
    products: new ProductRepository(db),
    reviews: new ReviewRepository(db),
    userReviews: new UserReviewRepository(db),
    comparisons: new ComparisonRepository(db),
    comparisonTemplates: new ComparisonTemplateRepository(db),
    businesses: new BusinessRepository(db),
    businessCategories: new BusinessCategoryRepository(db),
    leadRequests: new LeadRequestRepository(db),
    directoryEvents: new DirectoryEventRepository(db),
    aiCategories: new AiCategoryRepository(db),
    aiTools: new AiToolRepository(db),
    aiToolBookmarks: new AiToolBookmarkRepository(db),
    aiToolEvents: new AiToolEventRepository(db),
    aiToolRecentlyViewed: new AiToolRecentlyViewedRepository(db),
    aiCategoryFollows: new AiCategoryFollowRepository(db),
    searchIndex: new SearchIndexRepository(db),
    searchQueries: new SearchQueryRepository(db),
    searchResultClicks: new SearchResultClickRepository(db),
    popularSearches: new PopularSearchRepository(db),
    analyticsEvents: new AnalyticsEventRepository(db),
    analyticsSessions: new AnalyticsSessionRepository(db),
    analyticsAggregates: new AnalyticsAggregateRepository(db),
    trafficSources: new TrafficSourceRepository(db),
    systemMetrics: new SystemMetricRepository(db),
    affiliateConversions: new AffiliateConversionRepository(db),
    analyticsSavedReports: new AnalyticsSavedReportRepository(db),
    pageViews: new PageViewRepository(db),
    settings: new SettingRepository(db),
    themes: new ThemeRepository(db),
    featureFlags: new FeatureFlagRepository(db),
    homepageLayouts: new HomepageLayoutRepository(db),
    widgets: new WidgetRepository(db),
    aiJobs: new AiJobRepository(db),
    aiPrompts: new AiPromptRepository(db),
    aiModels: new AiModelRepository(db),
    plans: new PlanRepository(db),
    subscriptions: new SubscriptionRepository(db),
    invoices: new InvoiceRepository(db),
    payments: new PaymentRepository(db),
    apiRequestLogs: new ApiRequestLogRepository(db),
    apiKeys: new ApiKeyRepository(db),
    webhookEndpoints: new WebhookEndpointRepository(db),
    webhookDeliveries: new WebhookDeliveryRepository(db),
    newsletterSubscribers: new NewsletterSubscriberRepository(db),
    newsletterTemplates: new NewsletterTemplateRepository(db),
    newsletterCampaigns: new NewsletterCampaignRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
