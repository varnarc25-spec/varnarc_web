import { PERMISSIONS, type Permission } from '@varnarc/auth';

export type AdminNavItem = {
  href: string;
  label: string;
  permission: Permission | null;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ href: '/', label: 'Dashboard', permission: null }],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { href: '/cms', label: 'CMS', permission: PERMISSIONS.PAGE_VIEW },
      { href: '/pages', label: 'Pages', permission: PERMISSIONS.PAGE_VIEW },
      { href: '/articles', label: 'Articles', permission: PERMISSIONS.ARTICLE_EDIT },
      { href: '/articles/comments', label: 'Comments', permission: PERMISSIONS.ARTICLE_EDIT },
      { href: '/categories', label: 'Categories', permission: PERMISSIONS.ARTICLE_EDIT },
      { href: '/tags', label: 'Tags', permission: PERMISSIONS.ARTICLE_EDIT },
      { href: '/media', label: 'Media', permission: PERMISSIONS.MEDIA_VIEW },
      { href: '/menus', label: 'Menus', permission: PERMISSIONS.MENU_MANAGE },
      { href: '/homepage', label: 'Homepage', permission: PERMISSIONS.HOMEPAGE_MANAGE },
    ],
  },
  {
    id: 'users',
    label: 'Users & access',
    items: [
      { href: '/users', label: 'Users', permission: PERMISSIONS.USER_VIEW },
      { href: '/users/activity', label: 'User activity', permission: PERMISSIONS.USER_VIEW },
      { href: '/users/subscriptions', label: 'Subscriptions', permission: PERMISSIONS.USER_VIEW },
      { href: '/roles', label: 'Roles', permission: PERMISSIONS.ROLE_VIEW },
      { href: '/permissions', label: 'Permissions', permission: PERMISSIONS.ROLE_VIEW },
      { href: '/security', label: 'Security', permission: PERMISSIONS.SECURITY_VIEW },
      { href: '/audit', label: 'Audit logs', permission: PERMISSIONS.AUDIT_VIEW },
    ],
  },
  {
    id: 'calculators',
    label: 'Calculators',
    items: [{ href: '/calculators', label: 'All calculators', permission: PERMISSIONS.CALCULATOR_VIEW }],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { href: '/finance', label: 'Overview', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/finance/affiliates', label: 'Affiliates', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/finance/comparisons', label: 'Comparisons', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/finance/faqs', label: 'FAQs', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/finance/glossary', label: 'Glossary', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/finance/feeds', label: 'Rate feeds', permission: PERMISSIONS.FINANCE_VIEW },
    ],
  },
  {
    id: 'construction',
    label: 'Construction',
    items: [
      { href: '/construction', label: 'Overview', permission: PERMISSIONS.CONSTRUCTION_VIEW },
      { href: '/construction/categories', label: 'Categories', permission: PERMISSIONS.CONSTRUCTION_VIEW },
      { href: '/construction/checklists', label: 'Checklists', permission: PERMISSIONS.CONSTRUCTION_VIEW },
      { href: '/construction/suppliers', label: 'Suppliers', permission: PERMISSIONS.CONSTRUCTION_VIEW },
      { href: '/construction/faqs', label: 'FAQs', permission: PERMISSIONS.CONSTRUCTION_VIEW },
      { href: '/construction/guides', label: 'Guides', permission: PERMISSIONS.CONSTRUCTION_VIEW },
    ],
  },
  {
    id: 'automobile',
    label: 'Automobile',
    items: [
      { href: '/automobile', label: 'Overview', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/manufacturers', label: 'Manufacturers', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/vehicles', label: 'Vehicles', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/maintenance', label: 'Maintenance', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/dealers', label: 'Dealers', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/faqs', label: 'FAQs', permission: PERMISSIONS.AUTOMOBILE_VIEW },
      { href: '/automobile/guides', label: 'Guides', permission: PERMISSIONS.AUTOMOBILE_VIEW },
    ],
  },
  {
    id: 'reviews',
    label: 'Reviews',
    items: [
      { href: '/reviews', label: 'Overview', permission: PERMISSIONS.REVIEW_VIEW },
      { href: '/reviews/list', label: 'Editor', permission: PERMISSIONS.REVIEW_VIEW },
      { href: '/reviews/moderation', label: 'Moderation', permission: PERMISSIONS.REVIEW_MODERATE },
      { href: '/reviews/analytics', label: 'Analytics', permission: PERMISSIONS.REVIEW_VIEW },
    ],
  },
  {
    id: 'comparisons',
    label: 'Comparisons',
    items: [
      { href: '/comparisons', label: 'Overview', permission: PERMISSIONS.COMPARISON_VIEW },
      { href: '/comparisons/list', label: 'Editor', permission: PERMISSIONS.COMPARISON_VIEW },
      { href: '/comparisons/templates', label: 'Templates', permission: PERMISSIONS.COMPARISON_VIEW },
      { href: '/comparisons/analytics', label: 'Analytics', permission: PERMISSIONS.COMPARISON_VIEW },
    ],
  },
  {
    id: 'directory',
    label: 'Directory',
    items: [
      { href: '/directory', label: 'Overview', permission: PERMISSIONS.DIRECTORY_VIEW },
      { href: '/directory/listings', label: 'Listings', permission: PERMISSIONS.DIRECTORY_VIEW },
      { href: '/directory/verification', label: 'Verification', permission: PERMISSIONS.DIRECTORY_VERIFY },
      { href: '/directory/categories', label: 'Categories', permission: PERMISSIONS.DIRECTORY_VIEW },
      { href: '/directory/leads', label: 'Leads', permission: PERMISSIONS.DIRECTORY_VIEW },
      { href: '/directory/analytics', label: 'Analytics', permission: PERMISSIONS.DIRECTORY_VIEW },
    ],
  },
  {
    id: 'ai-ops',
    label: 'AI Operations',
    items: [
      { href: '/ai-ops', label: 'Overview', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/settings', label: 'Settings', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/models', label: 'Models', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/prompts', label: 'Prompts', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/jobs', label: 'Jobs', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/summarizer', label: 'Summarizer', permission: PERMISSIONS.AI_OPS_VIEW },
      { href: '/ai-ops/test', label: 'Test console', permission: PERMISSIONS.AI_OPS_MANAGE },
    ],
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    items: [
      { href: '/ai-tools', label: 'Overview', permission: PERMISSIONS.AI_TOOLS_VIEW },
      { href: '/ai-tools/tools', label: 'Catalog', permission: PERMISSIONS.AI_TOOLS_VIEW },
      { href: '/ai-tools/categories', label: 'Categories', permission: PERMISSIONS.AI_TOOLS_VIEW },
      { href: '/ai-tools/features', label: 'Features', permission: PERMISSIONS.AI_TOOLS_VIEW },
      { href: '/ai-tools/bookmarks', label: 'Bookmarks', permission: PERMISSIONS.AI_TOOLS_VIEW },
      { href: '/ai-tools/analytics', label: 'Analytics', permission: PERMISSIONS.AI_TOOLS_VIEW },
    ],
  },
  {
    id: 'search',
    label: 'Search',
    items: [
      { href: '/search', label: 'Overview', permission: PERMISSIONS.SEARCH_VIEW },
      { href: '/search/index', label: 'Index', permission: PERMISSIONS.SEARCH_VIEW },
      { href: '/search/analytics', label: 'Analytics', permission: PERMISSIONS.SEARCH_ANALYTICS },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { href: '/analytics', label: 'Overview', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/content', label: 'Content', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/ads', label: 'Ads', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/search', label: 'Search', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/users', label: 'Users', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/system', label: 'System', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/reports', label: 'Reports', permission: PERMISSIONS.ANALYTICS_VIEW },
      { href: '/analytics/integrations', label: 'Integrations', permission: PERMISSIONS.ANALYTICS_ADMIN },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    items: [
      { href: '/seo', label: 'Overview', permission: PERMISSIONS.SEO_VIEW },
      { href: '/seo/metadata', label: 'Metadata', permission: PERMISSIONS.SEO_VIEW },
      { href: '/seo/ai', label: 'AI assistant', permission: PERMISSIONS.SEO_VIEW },
      { href: '/seo/redirects', label: 'Redirects', permission: PERMISSIONS.SEO_REDIRECTS },
      { href: '/seo/sitemaps', label: 'Sitemaps', permission: PERMISSIONS.SEO_VIEW },
      { href: '/seo/audit', label: 'Audit', permission: PERMISSIONS.SEO_AUDIT },
      { href: '/seo/analytics', label: 'Analytics', permission: PERMISSIONS.SEO_VIEW },
      { href: '/seo/integrations', label: 'Integrations', permission: PERMISSIONS.SEO_EDIT },
      { href: '/seo/robots', label: 'Robots', permission: PERMISSIONS.SEO_EDIT },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    items: [
      { href: '/notifications', label: 'Overview', permission: PERMISSIONS.NOTIFICATIONS_VIEW },
      { href: '/notifications/subscribers', label: 'Subscribers', permission: PERMISSIONS.NOTIFICATIONS_VIEW },
      { href: '/notifications/templates', label: 'Templates', permission: PERMISSIONS.NOTIFICATIONS_VIEW },
      { href: '/notifications/broadcast', label: 'Broadcast', permission: PERMISSIONS.NOTIFICATIONS_MANAGE },
    ],
  },
  {
    id: 'ads',
    label: 'Advertisements',
    items: [
      { href: '/advertisements', label: 'Overview', permission: PERMISSIONS.ADVERTISEMENT_VIEW },
      { href: '/advertisements/campaigns', label: 'Campaigns', permission: PERMISSIONS.ADVERTISEMENT_VIEW },
      { href: '/advertisements/placements', label: 'Placements', permission: PERMISSIONS.ADVERTISEMENT_VIEW },
      { href: '/advertisements/analytics', label: 'Analytics', permission: PERMISSIONS.ADVERTISEMENT_VIEW },
    ],
  },
  {
    id: 'themes',
    label: 'Themes',
    items: [
      { href: '/themes', label: 'Overview', permission: PERMISSIONS.THEME_VIEW },
      { href: '/themes/presets', label: 'Presets', permission: PERMISSIONS.THEME_VIEW },
      { href: '/themes/assets', label: 'Assets', permission: PERMISSIONS.THEME_VIEW },
      { href: '/themes/marketplace', label: 'Marketplace', permission: PERMISSIONS.THEME_VIEW },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    items: [
      { href: '/system', label: 'Overview', permission: PERMISSIONS.API_VIEW },
      { href: '/system/status', label: 'Status', permission: PERMISSIONS.API_VIEW },
      { href: '/system/health', label: 'Health', permission: PERMISSIONS.API_VIEW },
      { href: '/system/version', label: 'Version', permission: PERMISSIONS.API_VIEW },
      { href: '/system/performance', label: 'Performance', permission: PERMISSIONS.API_VIEW },
      { href: '/system/cache', label: 'Cache', permission: PERMISSIONS.API_VIEW },
      { href: '/system/metrics', label: 'Metrics', permission: PERMISSIONS.API_VIEW },
      { href: '/system/queues', label: 'Queues', permission: PERMISSIONS.API_VIEW },
      { href: '/system/tests', label: 'Tests', permission: PERMISSIONS.API_VIEW },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      { href: '/settings', label: 'Settings', permission: PERMISSIONS.SETTINGS_MANAGE },
      { href: '/premium', label: 'Premium billing', permission: PERMISSIONS.PREMIUM_VIEW },
      { href: '/catalog-ops', label: 'Catalog ops', permission: PERMISSIONS.FINANCE_VIEW },
      { href: '/api', label: 'API console', permission: PERMISSIONS.API_VIEW },
      { href: '/roadmap', label: 'Roadmap', permission: PERMISSIONS.API_VIEW },
    ],
  },
];
