export type FutureFeaturePriority = 'low' | 'medium' | 'high';
export type FutureFeatureStatus = 'backlog' | 'planned' | 'in_research' | 'deferred';

export interface FutureFeatureModule {
  id: string;
  number: number;
  name: string;
  specRef: string;
}

export interface FutureFeature {
  id: string;
  moduleId: string;
  category: string;
  title: string;
  priority: FutureFeaturePriority;
  status: FutureFeatureStatus;
  phase?: number;
  notes?: string;
}

export const FUTURE_FEATURES_LAST_UPDATED = '2026-07-23';

export const FUTURE_FEATURE_MODULES: FutureFeatureModule[] = [
  { id: 'auth', number: 4, name: 'Authentication', specRef: '04-Authentication' },
  { id: 'cms', number: 8, name: 'CMS', specRef: '08-CMS' },
  { id: 'ads', number: 10, name: 'Advertisement System', specRef: '10-Advertisement-System' },
  { id: 'theme', number: 11, name: 'Theme Builder', specRef: '11-Theme-Builder' },
  { id: 'media', number: 12, name: 'Media Library', specRef: '12-Media-Library' },
  { id: 'finance', number: 14, name: 'Finance', specRef: '14-Finance-Module' },
  { id: 'construction', number: 15, name: 'Construction', specRef: '15-Construction-Module' },
  { id: 'automobile', number: 16, name: 'Automobile', specRef: '16-Automobile-Module' },
  { id: 'reviews', number: 17, name: 'Reviews', specRef: '17-Reviews' },
  { id: 'comparison', number: 18, name: 'Comparison', specRef: '18-Comparison' },
  { id: 'directory', number: 19, name: 'Directory', specRef: '19-Directory' },
  { id: 'ai-tools', number: 20, name: 'AI Tools', specRef: '20-AI-Tools' },
  { id: 'search', number: 21, name: 'Search', specRef: '21-Search' },
  { id: 'analytics', number: 22, name: 'Analytics', specRef: '22-Analytics' },
  { id: 'seo', number: 23, name: 'SEO', specRef: '23-SEO' },
  { id: 'notifications', number: 24, name: 'Notifications', specRef: '24-Notifications' },
  { id: 'users', number: 25, name: 'User Module', specRef: '25-User-Module' },
  { id: 'settings', number: 26, name: 'Settings', specRef: '26-Settings' },
  { id: 'api', number: 27, name: 'API', specRef: '27-API' },
  { id: 'deployment', number: 28, name: 'Deployment', specRef: '28-Deployment' },
  { id: 'docker', number: 29, name: 'Docker', specRef: '29-Docker' },
  { id: 'gcp', number: 30, name: 'Google Cloud', specRef: '30-Google-Cloud' },
  { id: 'testing', number: 31, name: 'Testing', specRef: '31-Testing' },
  { id: 'performance', number: 32, name: 'Performance', specRef: '32-Performance' },
  { id: 'security', number: 33, name: 'Security', specRef: '33-Security' },
  { id: 'platform', number: 37, name: 'Platform-wide', specRef: '37-Future-Features' },
];

export const FUTURE_FEATURES: FutureFeature[] = [
  // 04 Authentication
  { id: 'auth-orgs', moduleId: 'auth', category: 'Enterprise', title: 'Organizations', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'auth-teams', moduleId: 'auth', category: 'Enterprise', title: 'Teams', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'auth-premium', moduleId: 'auth', category: 'Monetization', title: 'Premium subscriptions', priority: 'medium', status: 'backlog', phase: 6 },
  { id: 'auth-api-keys', moduleId: 'auth', category: 'API', title: 'API keys', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'auth-oauth-clients', moduleId: 'auth', category: 'API', title: 'OAuth client applications', priority: 'low', status: 'backlog', phase: 9 },
  { id: 'auth-mobile', moduleId: 'auth', category: 'Mobile', title: 'Mobile authentication', priority: 'medium', status: 'backlog', phase: 8 },
  { id: 'auth-websockets', moduleId: 'auth', category: 'Realtime', title: 'WebSockets', priority: 'low', status: 'backlog' },
  { id: 'auth-enterprise-sso', moduleId: 'auth', category: 'Enterprise', title: 'Enterprise SSO', priority: 'high', status: 'backlog', phase: 9 },
  { id: 'auth-mfa', moduleId: 'auth', category: 'Security', title: 'MFA', priority: 'high', status: 'backlog' },
  { id: 'auth-passwordless', moduleId: 'auth', category: 'Security', title: 'Passwordless authentication', priority: 'medium', status: 'backlog' },

  // 08 CMS
  { id: 'cms-multilingual', moduleId: 'cms', category: 'Content', title: 'Multilingual content', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'cms-page-builder', moduleId: 'cms', category: 'Content', title: 'Drag-and-drop page builder', priority: 'medium', status: 'backlog' },
  {
    id: 'cms-notion-block-editor',
    moduleId: 'cms',
    category: 'Editor',
    title: 'Notion-style block editor',
    priority: 'low',
    status: 'deferred',
    notes: 'TipTap rich editor satisfies Sprint 2; future: slash menu, block drag handles, embed blocks',
  },
  { id: 'cms-form-builder', moduleId: 'cms', category: 'Content', title: 'Form builder', priority: 'medium', status: 'backlog' },
  { id: 'cms-plugins', moduleId: 'cms', category: 'Content', title: 'Plugin-based content types', priority: 'low', status: 'backlog' },
  { id: 'cms-headless', moduleId: 'cms', category: 'Integrations', title: 'Headless CMS integrations', priority: 'low', status: 'backlog' },
  { id: 'cms-contributor-role', moduleId: 'cms', category: 'Workflow', title: 'Dedicated Contributor role', priority: 'medium', status: 'backlog', phase: 5 },
  { id: 'cms-reviewer-role', moduleId: 'cms', category: 'Workflow', title: 'Dedicated Reviewer role', priority: 'medium', status: 'backlog', phase: 5 },
  { id: 'cms-approval-chains', moduleId: 'cms', category: 'Workflow', title: 'Formal workflow approval chains', priority: 'medium', status: 'backlog' },
  { id: 'cms-campaigns', moduleId: 'cms', category: 'Workflow', title: 'Scheduled campaigns', priority: 'low', status: 'backlog' },
  { id: 'cms-fts-index', moduleId: 'cms', category: 'Search', title: 'Dedicated full-text search index', priority: 'medium', status: 'backlog' },
  { id: 'cms-redis-cache', moduleId: 'cms', category: 'Performance', title: 'Redis-backed cache / search', priority: 'medium', status: 'backlog' },
  { id: 'cms-ai-drafting', moduleId: 'cms', category: 'AI', title: 'AI-assisted drafting and SEO suggestions', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'cms-personalization', moduleId: 'cms', category: 'Analytics', title: 'Content personalization', priority: 'low', status: 'backlog' },
  { id: 'cms-version-diff', moduleId: 'cms', category: 'Editor', title: 'Version comparison UI', priority: 'low', status: 'backlog' },

  // 10 Advertisement System
  { id: 'ads-gam', moduleId: 'ads', category: 'Networks', title: 'Google Ad Manager', priority: 'medium', status: 'backlog' },
  { id: 'ads-video', moduleId: 'ads', category: 'Formats', title: 'Video advertisements', priority: 'medium', status: 'backlog' },
  { id: 'ads-cpm-reporting', moduleId: 'ads', category: 'Reporting', title: 'CPM/CPC automated reporting', priority: 'medium', status: 'backlog' },
  { id: 'ads-forecasting', moduleId: 'ads', category: 'Reporting', title: 'Revenue forecasting', priority: 'low', status: 'backlog' },
  { id: 'ads-self-service', moduleId: 'ads', category: 'Portal', title: 'Advertiser self-service portal', priority: 'medium', status: 'backlog', phase: 7 },
  { id: 'ads-payments', moduleId: 'ads', category: 'Monetization', title: 'Payment integration', priority: 'medium', status: 'backlog', phase: 7 },
  { id: 'ads-ab-testing', moduleId: 'ads', category: 'Optimization', title: 'A/B testing', priority: 'medium', status: 'backlog' },
  { id: 'ads-ai-optimization', moduleId: 'ads', category: 'AI', title: 'AI-based ad optimization', priority: 'low', status: 'backlog', phase: 4 },
  { id: 'ads-geo-targeting', moduleId: 'ads', category: 'Targeting', title: 'Country and language targeting', priority: 'medium', status: 'backlog' },
  { id: 'ads-budget-enforcement', moduleId: 'ads', category: 'Ops', title: 'Campaign budget enforcement', priority: 'medium', status: 'backlog' },

  // 11 Theme Builder
  { id: 'theme-white-label', moduleId: 'theme', category: 'Enterprise', title: 'White-label deployments', priority: 'high', status: 'backlog', phase: 9 },
  { id: 'theme-marketplace', moduleId: 'theme', category: 'Marketplace', title: 'Theme marketplace', priority: 'medium', status: 'backlog' },
  { id: 'theme-visual-editor', moduleId: 'theme', category: 'Editor', title: 'Visual theme editor', priority: 'medium', status: 'backlog' },
  { id: 'theme-scheduled', moduleId: 'theme', category: 'Ops', title: 'Scheduled theme activation', priority: 'low', status: 'backlog' },

  // 12 Media Library
  { id: 'media-ai-metadata', moduleId: 'media', category: 'AI', title: 'AI-generated metadata', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'media-ocr', moduleId: 'media', category: 'AI', title: 'OCR', priority: 'low', status: 'backlog' },
  { id: 'media-duplicates', moduleId: 'media', category: 'Quality', title: 'Duplicate detection', priority: 'medium', status: 'backlog' },
  { id: 'media-approval', moduleId: 'media', category: 'Workflow', title: 'Asset approval workflow', priority: 'medium', status: 'backlog' },
  { id: 'media-transcoding', moduleId: 'media', category: 'Video', title: 'Video transcoding', priority: 'medium', status: 'backlog' },
  { id: 'media-s3', moduleId: 'media', category: 'Storage', title: 'S3-compatible external storage', priority: 'low', status: 'backlog' },
  { id: 'media-multi-tenant', moduleId: 'media', category: 'Enterprise', title: 'Multi-tenant media libraries', priority: 'medium', status: 'backlog', phase: 9 },

  // 14 Finance
  { id: 'finance-live-rates', moduleId: 'finance', category: 'Data', title: 'Live interest rate feeds', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'finance-eligibility', moduleId: 'finance', category: 'API', title: 'Loan eligibility APIs', priority: 'medium', status: 'backlog' },
  { id: 'finance-credit', moduleId: 'finance', category: 'API', title: 'Credit score integration', priority: 'medium', status: 'backlog' },
  { id: 'finance-marketplace', moduleId: 'finance', category: 'Marketplace', title: 'Financial calculators marketplace', priority: 'medium', status: 'backlog', phase: 3 },
  { id: 'finance-portfolios', moduleId: 'finance', category: 'User', title: 'User portfolios and goal planning', priority: 'low', status: 'backlog', phase: 5 },

  // 15 Construction
  { id: 'construction-live-prices', moduleId: 'construction', category: 'Data', title: 'Live regional material prices', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'construction-supplier-inventory', moduleId: 'construction', category: 'Integrations', title: 'Supplier inventory integration', priority: 'medium', status: 'backlog' },
  { id: 'construction-ai-estimate', moduleId: 'construction', category: 'AI', title: 'AI project estimation', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'construction-ar', moduleId: 'construction', category: 'Visualization', title: 'AR room and material previews', priority: 'low', status: 'backlog' },
  { id: 'construction-marketplace', moduleId: 'construction', category: 'Marketplace', title: 'Construction marketplace', priority: 'medium', status: 'backlog', phase: 7 },

  // 16 Automobile
  { id: 'auto-live-pricing', moduleId: 'automobile', category: 'Data', title: 'Live vehicle pricing', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'auto-inventory', moduleId: 'automobile', category: 'Data', title: 'Real-time inventory feeds', priority: 'medium', status: 'backlog' },
  { id: 'auto-ev-charging', moduleId: 'automobile', category: 'Integrations', title: 'EV charging network integration', priority: 'low', status: 'backlog' },
  { id: 'auto-vin', moduleId: 'automobile', category: 'Data', title: 'VIN decoding', priority: 'medium', status: 'backlog' },
  { id: 'auto-marketplace', moduleId: 'automobile', category: 'Marketplace', title: 'Used vehicle marketplace', priority: 'medium', status: 'backlog', phase: 7 },
  { id: 'auto-ai-recommend', moduleId: 'automobile', category: 'AI', title: 'AI vehicle recommendation engine', priority: 'medium', status: 'backlog', phase: 4 },

  // 17 Reviews
  { id: 'reviews-ai-summary', moduleId: 'reviews', category: 'AI', title: 'AI-generated review summaries', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'reviews-sentiment', moduleId: 'reviews', category: 'AI', title: 'Sentiment analysis', priority: 'low', status: 'backlog', phase: 4 },
  { id: 'reviews-verified', moduleId: 'reviews', category: 'Trust', title: 'Verified purchase integrations', priority: 'medium', status: 'backlog' },
  { id: 'reviews-video', moduleId: 'reviews', category: 'Media', title: 'Video reviews', priority: 'low', status: 'backlog' },
  { id: 'reviews-reputation', moduleId: 'reviews', category: 'Community', title: 'Reviewer reputation system', priority: 'medium', status: 'backlog', phase: 5 },
  { id: 'reviews-qa', moduleId: 'reviews', category: 'Community', title: 'Community Q&A', priority: 'medium', status: 'backlog', phase: 5 },

  // 18 Comparison
  { id: 'comparison-ai-summary', moduleId: 'comparison', category: 'AI', title: 'AI-generated comparison summaries', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'comparison-live-pricing', moduleId: 'comparison', category: 'Data', title: 'Live pricing integration', priority: 'high', status: 'backlog' },
  { id: 'comparison-user-built', moduleId: 'comparison', category: 'User', title: 'User-selected custom comparisons', priority: 'medium', status: 'backlog', phase: 3 },
  { id: 'comparison-saved', moduleId: 'comparison', category: 'User', title: 'Saved comparison lists', priority: 'medium', status: 'backlog', phase: 3 },
  { id: 'comparison-voting', moduleId: 'comparison', category: 'Community', title: 'Community voting', priority: 'low', status: 'backlog', phase: 5 },

  // 19 Directory
  { id: 'directory-claim', moduleId: 'directory', category: 'Workflow', title: 'Claim listing workflow', priority: 'high', status: 'backlog', phase: 7 },
  { id: 'directory-subscriptions', moduleId: 'directory', category: 'Monetization', title: 'Paid subscriptions', priority: 'medium', status: 'backlog', phase: 6 },
  { id: 'directory-booking', moduleId: 'directory', category: 'Services', title: 'Booking and appointments', priority: 'medium', status: 'backlog', phase: 7 },
  { id: 'directory-messaging', moduleId: 'directory', category: 'Realtime', title: 'Instant messaging', priority: 'low', status: 'backlog' },
  { id: 'directory-marketplace', moduleId: 'directory', category: 'Marketplace', title: 'Marketplace functionality', priority: 'medium', status: 'backlog', phase: 7 },

  // 20 AI Tools
  { id: 'ai-tools-status', moduleId: 'ai-tools', category: 'Monitoring', title: 'Live API status monitoring', priority: 'medium', status: 'backlog' },
  { id: 'ai-tools-marketplace', moduleId: 'ai-tools', category: 'Marketplace', title: 'AI marketplace', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'ai-tools-prompt-market', moduleId: 'ai-tools', category: 'Marketplace', title: 'Prompt marketplace', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'ai-tools-workflow', moduleId: 'ai-tools', category: 'Productivity', title: 'AI workflow builder', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'ai-tools-mcp', moduleId: 'ai-tools', category: 'Catalog', title: 'MCP server catalog', priority: 'low', status: 'backlog', phase: 4 },
  { id: 'ai-tools-playgrounds', moduleId: 'ai-tools', category: 'UX', title: 'Embedded AI playgrounds', priority: 'medium', status: 'backlog', phase: 4 },

  // 21 Search
  { id: 'search-semantic', moduleId: 'search', category: 'AI', title: 'AI-powered semantic search', priority: 'high', status: 'backlog', phase: 4 },
  { id: 'search-nl', moduleId: 'search', category: 'AI', title: 'Natural language queries', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'search-voice', moduleId: 'search', category: 'UX', title: 'Voice search', priority: 'low', status: 'backlog' },
  { id: 'search-image', moduleId: 'search', category: 'UX', title: 'Image search', priority: 'low', status: 'backlog' },
  { id: 'search-multilingual', moduleId: 'search', category: 'i18n', title: 'Multilingual search', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'search-federated', moduleId: 'search', category: 'Integrations', title: 'Federated search across partner APIs', priority: 'low', status: 'backlog' },

  // 22 Analytics
  { id: 'analytics-ai-insights', moduleId: 'analytics', category: 'AI', title: 'AI-generated insights', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'analytics-cohorts', moduleId: 'analytics', category: 'Advanced', title: 'Cohort and funnel analysis', priority: 'medium', status: 'backlog' },
  { id: 'analytics-heatmaps', moduleId: 'analytics', category: 'Visualization', title: 'Heatmaps and session replay', priority: 'low', status: 'backlog' },
  { id: 'analytics-warehouse', moduleId: 'analytics', category: 'Data platform', title: 'Data warehouse / BigQuery export', priority: 'medium', status: 'backlog' },
  { id: 'analytics-scheduled-reports', moduleId: 'analytics', category: 'Reporting', title: 'Scheduled recurring report delivery', priority: 'medium', status: 'backlog' },

  // 23 SEO
  { id: 'seo-ai-metadata', moduleId: 'seo', category: 'AI', title: 'AI-generated metadata', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'seo-hreflang', moduleId: 'seo', category: 'i18n', title: 'Multilingual SEO / hreflang', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'seo-indexnow', moduleId: 'seo', category: 'Technical', title: 'IndexNow support', priority: 'medium', status: 'backlog' },
  { id: 'seo-cwv-monitor', moduleId: 'seo', category: 'Technical', title: 'Core Web Vitals monitoring', priority: 'medium', status: 'backlog' },
  { id: 'seo-gsc-sync', moduleId: 'seo', category: 'Integrations', title: 'Live Google Search Console API sync', priority: 'medium', status: 'backlog' },

  // 24 Notifications
  { id: 'notif-preferences', moduleId: 'notifications', category: 'User', title: 'Per-user channel preferences', priority: 'medium', status: 'backlog', phase: 5 },
  { id: 'notif-bullmq', moduleId: 'notifications', category: 'Infrastructure', title: 'Async email queue (BullMQ + Redis)', priority: 'medium', status: 'backlog' },
  { id: 'notif-push', moduleId: 'notifications', category: 'Mobile', title: 'Push notifications (FCM)', priority: 'high', status: 'backlog', phase: 8 },
  { id: 'notif-realtime', moduleId: 'notifications', category: 'Realtime', title: 'Real-time delivery (SSE/WebSocket)', priority: 'medium', status: 'backlog' },
  { id: 'notif-webhooks', moduleId: 'notifications', category: 'Integrations', title: 'Delivery webhooks and analytics', priority: 'low', status: 'backlog' },

  // 25 Users
  { id: 'users-premium', moduleId: 'users', category: 'Monetization', title: 'Premium memberships', priority: 'high', status: 'backlog', phase: 6 },
  { id: 'users-badges', moduleId: 'users', category: 'Community', title: 'User badges and gamification', priority: 'medium', status: 'backlog', phase: 5 },
  { id: 'users-following', moduleId: 'users', category: 'Community', title: 'Social following', priority: 'low', status: 'backlog', phase: 5 },
  { id: 'users-orgs', moduleId: 'users', category: 'Enterprise', title: 'Multi-organization support', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'users-workspaces', moduleId: 'users', category: 'Enterprise', title: 'Team workspaces', priority: 'medium', status: 'backlog', phase: 9 },

  // 26 Settings
  { id: 'settings-plugins', moduleId: 'settings', category: 'Extensibility', title: 'Plugin configuration', priority: 'low', status: 'backlog' },
  { id: 'settings-tenant', moduleId: 'settings', category: 'Enterprise', title: 'Tenant-specific settings', priority: 'high', status: 'backlog', phase: 9 },
  { id: 'settings-remote', moduleId: 'settings', category: 'Ops', title: 'Remote configuration', priority: 'medium', status: 'backlog' },
  { id: 'settings-ab', moduleId: 'settings', category: 'Experimentation', title: 'Dynamic A/B testing', priority: 'medium', status: 'backlog' },
  { id: 'settings-rollout', moduleId: 'settings', category: 'Ops', title: 'Live feature rollout', priority: 'medium', status: 'backlog' },

  // 27 API
  { id: 'api-graphql', moduleId: 'api', category: 'Protocol', title: 'GraphQL API', priority: 'low', status: 'backlog' },
  { id: 'api-dev-portal', moduleId: 'api', category: 'Developer', title: 'Developer portal', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'api-marketplace', moduleId: 'api', category: 'Monetization', title: 'API marketplace and monetization', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'api-sdks', moduleId: 'api', category: 'Developer', title: 'SDK generation', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'api-websockets', moduleId: 'api', category: 'Realtime', title: 'WebSocket events', priority: 'medium', status: 'backlog' },
  { id: 'api-quotas', moduleId: 'api', category: 'Enterprise', title: 'API quotas and usage billing', priority: 'medium', status: 'backlog', phase: 9 },

  // 28 Deployment
  { id: 'deploy-k8s', moduleId: 'deployment', category: 'Infrastructure', title: 'Kubernetes', priority: 'medium', status: 'backlog' },
  { id: 'deploy-multi-region', moduleId: 'deployment', category: 'Infrastructure', title: 'Multi-region deployment', priority: 'high', status: 'backlog' },
  { id: 'deploy-iac', moduleId: 'deployment', category: 'Infrastructure', title: 'Infrastructure as Code', priority: 'medium', status: 'backlog' },
  { id: 'deploy-progressive', moduleId: 'deployment', category: 'Delivery', title: 'Progressive delivery', priority: 'low', status: 'backlog' },
  { id: 'deploy-chaos', moduleId: 'deployment', category: 'Reliability', title: 'Chaos testing', priority: 'low', status: 'backlog' },

  // 29 Docker
  { id: 'docker-helm', moduleId: 'docker', category: 'Orchestration', title: 'Helm charts', priority: 'medium', status: 'backlog' },
  { id: 'docker-multi-arch', moduleId: 'docker', category: 'Build', title: 'Multi-architecture / ARM images', priority: 'medium', status: 'backlog' },
  { id: 'docker-buildkit', moduleId: 'docker', category: 'Build', title: 'Remote BuildKit / distributed builds', priority: 'low', status: 'backlog' },

  // 30 Google Cloud
  { id: 'gcp-gke', moduleId: 'gcp', category: 'Infrastructure', title: 'GKE (Kubernetes)', priority: 'medium', status: 'backlog' },
  { id: 'gcp-terraform', moduleId: 'gcp', category: 'Infrastructure', title: 'Terraform', priority: 'medium', status: 'backlog' },
  { id: 'gcp-armor', moduleId: 'gcp', category: 'Security', title: 'Cloud Armor', priority: 'medium', status: 'backlog' },
  { id: 'gcp-vertex', moduleId: 'gcp', category: 'AI', title: 'Vertex AI integration', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'gcp-bigquery', moduleId: 'gcp', category: 'Analytics', title: 'BigQuery analytics pipeline', priority: 'medium', status: 'backlog' },

  // 31 Testing
  { id: 'test-visual', moduleId: 'testing', category: 'Quality', title: 'Visual regression testing', priority: 'medium', status: 'backlog' },
  { id: 'test-chaos', moduleId: 'testing', category: 'Reliability', title: 'Chaos engineering', priority: 'low', status: 'backlog' },
  { id: 'test-load-scale', moduleId: 'testing', category: 'Performance', title: 'Load testing at scale', priority: 'medium', status: 'backlog' },
  { id: 'test-contract', moduleId: 'testing', category: 'API', title: 'Contract testing', priority: 'medium', status: 'backlog' },
  { id: 'test-ai-gen', moduleId: 'testing', category: 'AI', title: 'AI-assisted test generation', priority: 'low', status: 'backlog' },

  // 32 Performance
  { id: 'perf-edge-render', moduleId: 'performance', category: 'Edge', title: 'Edge rendering', priority: 'medium', status: 'backlog' },
  { id: 'perf-prefetch', moduleId: 'performance', category: 'UX', title: 'Predictive prefetching', priority: 'low', status: 'backlog' },
  { id: 'perf-budgets', moduleId: 'performance', category: 'Governance', title: 'Automated performance budgets', priority: 'medium', status: 'backlog' },
  { id: 'perf-tuning-ai', moduleId: 'performance', category: 'AI', title: 'Automatic tuning recommendations', priority: 'low', status: 'backlog' },

  // 33 Security
  { id: 'sec-abac', moduleId: 'security', category: 'Authorization', title: 'Attribute-Based Access Control (ABAC)', priority: 'medium', status: 'backlog', phase: 9 },
  { id: 'sec-webauthn', moduleId: 'security', category: 'Authentication', title: 'WebAuthn / passkeys', priority: 'high', status: 'backlog' },
  { id: 'sec-risk-auth', moduleId: 'security', category: 'Authentication', title: 'Risk-based authentication', priority: 'medium', status: 'backlog' },
  { id: 'sec-threat-detect', moduleId: 'security', category: 'Monitoring', title: 'Automated threat detection', priority: 'medium', status: 'backlog' },
  { id: 'sec-tenant-isolation', moduleId: 'security', category: 'Enterprise', title: 'Multi-tenant security isolation', priority: 'high', status: 'backlog', phase: 9 },

  // Platform-wide (master planning + roadmap themes)
  { id: 'platform-i18n', moduleId: 'platform', category: 'i18n', title: 'Multi-language content platform', priority: 'high', status: 'backlog', phase: 2 },
  { id: 'platform-mobile', moduleId: 'platform', category: 'Mobile', title: 'Native Android and iOS apps', priority: 'high', status: 'backlog', phase: 8 },
  { id: 'platform-calc-marketplace', moduleId: 'platform', category: 'Marketplace', title: 'Third-party calculator marketplace', priority: 'medium', status: 'backlog', phase: 3 },
  { id: 'platform-newsletter', moduleId: 'platform', category: 'Engagement', title: 'Newsletter product', priority: 'medium', status: 'backlog', phase: 2 },
  { id: 'platform-subscriptions', moduleId: 'platform', category: 'Monetization', title: 'Subscription billing platform', priority: 'high', status: 'backlog', phase: 6 },
  { id: 'platform-courses', moduleId: 'platform', category: 'Monetization', title: 'Courses and digital downloads', priority: 'medium', status: 'backlog', phase: 6 },
  { id: 'platform-vector-db', moduleId: 'platform', category: 'Data', title: 'Vector database for RAG', priority: 'medium', status: 'backlog', phase: 4 },
  { id: 'platform-admin-prompts', moduleId: 'platform', category: 'Developer', title: 'Admin developer prompts UI', priority: 'low', status: 'deferred', notes: 'Spec 35 — future' },
];

export function getFutureFeatureModule(moduleId: string): FutureFeatureModule | undefined {
  return FUTURE_FEATURE_MODULES.find((module) => module.id === moduleId);
}

export function getFeaturesByModule(moduleId: string): FutureFeature[] {
  return FUTURE_FEATURES.filter((feature) => feature.moduleId === moduleId);
}

export function groupFeaturesByModule(): Array<{
  module: FutureFeatureModule;
  features: FutureFeature[];
}> {
  return FUTURE_FEATURE_MODULES.map((module) => ({
    module,
    features: getFeaturesByModule(module.id),
  })).filter((group) => group.features.length > 0);
}

export function countFutureFeatures(): {
  total: number;
  byStatus: Record<FutureFeatureStatus, number>;
  byPriority: Record<FutureFeaturePriority, number>;
} {
  const byStatus: Record<FutureFeatureStatus, number> = {
    backlog: 0,
    planned: 0,
    in_research: 0,
    deferred: 0,
  };
  const byPriority: Record<FutureFeaturePriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  for (const feature of FUTURE_FEATURES) {
    byStatus[feature.status] += 1;
    byPriority[feature.priority] += 1;
  }

  return { total: FUTURE_FEATURES.length, byStatus, byPriority };
}

export function getFeaturesByPhase(phase: number): FutureFeature[] {
  return FUTURE_FEATURES.filter((feature) => feature.phase === phase);
}
