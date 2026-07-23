import type { RoleSlug } from '@varnarc/types';

export { isAuth0Configured, AUTH0_CALLBACK_PATH, AUTH0_LOGIN_PATH, AUTH0_LOGOUT_PATH } from './auth0-env';

/** Granular permissions — stored in DB, checked by NestJS guards. */
export const PERMISSIONS = {
  // Content
  ARTICLE_CREATE: 'article.create',
  ARTICLE_EDIT: 'article.edit',
  ARTICLE_PUBLISH: 'article.publish',
  ARTICLE_REVIEW: 'article.review',
  ARTICLE_DELETE: 'article.delete',
  // Pages
  PAGE_VIEW: 'page.view',
  PAGE_CREATE: 'page.create',
  PAGE_EDIT: 'page.edit',
  PAGE_PUBLISH: 'page.publish',
  PAGE_REVIEW: 'page.review',
  PAGE_DELETE: 'page.delete',
  // Media
  MEDIA_VIEW: 'media.view',
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_EDIT: 'media.edit',
  MEDIA_DELETE: 'media.delete',
  /** @deprecated Prefer media.view; still granted to existing roles */
  MEDIA_READ: 'media.read',
  // Users
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  // Roles
  ROLE_VIEW: 'role.view',
  ROLE_MANAGE: 'role.manage',
  // Ads / builders / theme / analytics / settings
  ADVERTISEMENT_VIEW: 'advertisement.view',
  ADVERTISEMENT_CREATE: 'advertisement.create',
  ADVERTISEMENT_EDIT: 'advertisement.edit',
  ADVERTISEMENT_PUBLISH: 'advertisement.publish',
  ADVERTISEMENT_DELETE: 'advertisement.delete',
  /** @deprecated Prefer granular advertisement.* permissions; still granted to admins */
  ADVERTISEMENT_MANAGE: 'advertisement.manage',
  HOMEPAGE_MANAGE: 'homepage.manage',
  THEME_VIEW: 'theme.view',
  THEME_EDIT: 'theme.edit',
  THEME_PUBLISH: 'theme.publish',
  /** @deprecated Prefer theme.view / theme.edit / theme.publish; still granted to admins */
  THEME_MANAGE: 'theme.manage',
  // Calculators
  CALCULATOR_VIEW: 'calculator.view',
  CALCULATOR_CREATE: 'calculator.create',
  CALCULATOR_EDIT: 'calculator.edit',
  CALCULATOR_PUBLISH: 'calculator.publish',
  CALCULATOR_DELETE: 'calculator.delete',
  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_CREATE: 'finance.create',
  FINANCE_EDIT: 'finance.edit',
  FINANCE_PUBLISH: 'finance.publish',
  FINANCE_DELETE: 'finance.delete',
  // Construction
  CONSTRUCTION_VIEW: 'construction.view',
  CONSTRUCTION_CREATE: 'construction.create',
  CONSTRUCTION_EDIT: 'construction.edit',
  CONSTRUCTION_PUBLISH: 'construction.publish',
  CONSTRUCTION_DELETE: 'construction.delete',
  // Automobile
  AUTOMOBILE_VIEW: 'automobile.view',
  AUTOMOBILE_CREATE: 'automobile.create',
  AUTOMOBILE_EDIT: 'automobile.edit',
  AUTOMOBILE_PUBLISH: 'automobile.publish',
  AUTOMOBILE_DELETE: 'automobile.delete',
  // Reviews
  REVIEW_VIEW: 'review.view',
  REVIEW_CREATE: 'review.create',
  REVIEW_EDIT: 'review.edit',
  REVIEW_PUBLISH: 'review.publish',
  REVIEW_DELETE: 'review.delete',
  REVIEW_MODERATE: 'review.moderate',
  // Comparison
  COMPARISON_VIEW: 'comparison.view',
  COMPARISON_CREATE: 'comparison.create',
  COMPARISON_EDIT: 'comparison.edit',
  COMPARISON_PUBLISH: 'comparison.publish',
  COMPARISON_DELETE: 'comparison.delete',
  // Directory
  DIRECTORY_VIEW: 'directory.view',
  DIRECTORY_CREATE: 'directory.create',
  DIRECTORY_EDIT: 'directory.edit',
  DIRECTORY_PUBLISH: 'directory.publish',
  DIRECTORY_DELETE: 'directory.delete',
  DIRECTORY_VERIFY: 'directory.verify',
  // AI Tools catalog
  AI_TOOLS_VIEW: 'ai-tools.view',
  AI_TOOLS_CREATE: 'ai-tools.create',
  AI_TOOLS_EDIT: 'ai-tools.edit',
  AI_TOOLS_PUBLISH: 'ai-tools.publish',
  AI_TOOLS_DELETE: 'ai-tools.delete',
  AI_OPS_VIEW: 'ai.ops.view',
  AI_OPS_MANAGE: 'ai.ops.manage',
  // Search
  SEARCH_VIEW: 'search.view',
  SEARCH_REINDEX: 'search.reindex',
  SEARCH_ANALYTICS: 'search.analytics',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_ADMIN: 'analytics.admin',
  SEO_VIEW: 'seo.view',
  SEO_EDIT: 'seo.edit',
  SEO_AUDIT: 'seo.audit',
  SEO_REDIRECTS: 'seo.redirects',
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  AUDIT_VIEW: 'audit.view',
  SECURITY_VIEW: 'security.view',
  SECURITY_MANAGE: 'security.manage',
  SETTINGS_MANAGE: 'settings.manage',
  API_VIEW: 'api.view',
  API_MANAGE: 'api.manage',
  PREMIUM_VIEW: 'premium.view',
  PREMIUM_MANAGE: 'premium.manage',
  MENU_MANAGE: 'menu.manage',
  REPORTS_EXPORT: 'reports.export',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_DEFINITIONS: Record<
  RoleSlug,
  { name: string; description: string; permissions: Permission[] }
> = {
  super_admin: {
    name: 'Super Administrator',
    description: 'Full platform access',
    permissions: Object.values(PERMISSIONS),
  },
  admin: {
    name: 'Administrator',
    description: 'Administrative access excluding destructive platform ops reserved for super admin',
    permissions: Object.values(PERMISSIONS),
  },
  editor: {
    name: 'Editor',
    description: 'Content and media editing',
    permissions: [
      PERMISSIONS.ARTICLE_CREATE,
      PERMISSIONS.ARTICLE_EDIT,
      PERMISSIONS.ARTICLE_PUBLISH,
      PERMISSIONS.PAGE_VIEW,
      PERMISSIONS.PAGE_CREATE,
      PERMISSIONS.PAGE_EDIT,
      PERMISSIONS.PAGE_PUBLISH,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_EDIT,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.MENU_MANAGE,
      PERMISSIONS.THEME_VIEW,
      PERMISSIONS.THEME_EDIT,
      PERMISSIONS.THEME_PUBLISH,
      PERMISSIONS.THEME_MANAGE,
      PERMISSIONS.HOMEPAGE_MANAGE,
      PERMISSIONS.CALCULATOR_VIEW,
      PERMISSIONS.CALCULATOR_CREATE,
      PERMISSIONS.CALCULATOR_EDIT,
      PERMISSIONS.CALCULATOR_PUBLISH,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_CREATE,
      PERMISSIONS.FINANCE_EDIT,
      PERMISSIONS.FINANCE_PUBLISH,
      PERMISSIONS.CONSTRUCTION_VIEW,
      PERMISSIONS.CONSTRUCTION_CREATE,
      PERMISSIONS.CONSTRUCTION_EDIT,
      PERMISSIONS.CONSTRUCTION_PUBLISH,
      PERMISSIONS.AUTOMOBILE_VIEW,
      PERMISSIONS.AUTOMOBILE_CREATE,
      PERMISSIONS.AUTOMOBILE_EDIT,
      PERMISSIONS.AUTOMOBILE_PUBLISH,
      PERMISSIONS.REVIEW_VIEW,
      PERMISSIONS.REVIEW_CREATE,
      PERMISSIONS.REVIEW_EDIT,
      PERMISSIONS.REVIEW_PUBLISH,
      PERMISSIONS.COMPARISON_VIEW,
      PERMISSIONS.COMPARISON_CREATE,
      PERMISSIONS.COMPARISON_EDIT,
      PERMISSIONS.COMPARISON_PUBLISH,
      PERMISSIONS.DIRECTORY_VIEW,
      PERMISSIONS.DIRECTORY_CREATE,
      PERMISSIONS.DIRECTORY_EDIT,
      PERMISSIONS.DIRECTORY_PUBLISH,
      PERMISSIONS.DIRECTORY_VERIFY,
      PERMISSIONS.AI_TOOLS_VIEW,
      PERMISSIONS.AI_TOOLS_CREATE,
      PERMISSIONS.AI_TOOLS_EDIT,
      PERMISSIONS.AI_TOOLS_PUBLISH,
      PERMISSIONS.AI_OPS_VIEW,
      PERMISSIONS.AI_OPS_MANAGE,
      PERMISSIONS.SEARCH_VIEW,
      PERMISSIONS.SEARCH_ANALYTICS,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.SEO_VIEW,
      PERMISSIONS.SEO_EDIT,
      PERMISSIONS.SEO_AUDIT,
      PERMISSIONS.SEO_REDIRECTS,
      PERMISSIONS.NOTIFICATIONS_VIEW,
      PERMISSIONS.NOTIFICATIONS_MANAGE,
    ],
  },
  author: {
    name: 'Author',
    description: 'Create and edit own content',
    permissions: [
      PERMISSIONS.ARTICLE_CREATE,
      PERMISSIONS.ARTICLE_EDIT,
      PERMISSIONS.PAGE_VIEW,
      PERMISSIONS.PAGE_CREATE,
      PERMISSIONS.PAGE_EDIT,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_READ,
    ],
  },
  reviewer: {
    name: 'Reviewer',
    description: 'Review and approve content without publishing',
    permissions: [
      PERMISSIONS.ARTICLE_EDIT,
      PERMISSIONS.ARTICLE_REVIEW,
      PERMISSIONS.PAGE_VIEW,
      PERMISSIONS.PAGE_EDIT,
      PERMISSIONS.PAGE_REVIEW,
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_READ,
    ],
  },
  moderator: {
    name: 'Moderator',
    description: 'Moderation and limited user visibility',
    permissions: [
      PERMISSIONS.MEDIA_VIEW,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REVIEW_VIEW,
      PERMISSIONS.REVIEW_MODERATE,
    ],
  },
  premium_user: {
    name: 'Premium User',
    description: 'Registered user with premium features',
    permissions: [],
  },
  user: {
    name: 'Registered User',
    description: 'Default authenticated user',
    permissions: [],
  },
  guest: {
    name: 'Guest',
    description: 'Unauthenticated visitor (no DB role assignment)',
    permissions: [],
  },
};

/** @deprecated Use ROLE_DEFINITIONS */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleSlug, Permission[]> = Object.fromEntries(
  Object.entries(ROLE_DEFINITIONS).map(([slug, def]) => [slug, def.permissions]),
) as Record<RoleSlug, Permission[]>;

export function hasPermission(
  granted: readonly string[],
  required: Permission | Permission[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  const hasManageAds = granted.includes(PERMISSIONS.ADVERTISEMENT_MANAGE);
  const hasManageTheme = granted.includes(PERMISSIONS.THEME_MANAGE);
  const hasMediaRead = granted.includes(PERMISSIONS.MEDIA_READ);
  const hasMediaView = granted.includes(PERMISSIONS.MEDIA_VIEW);
  const hasMediaUpload = granted.includes(PERMISSIONS.MEDIA_UPLOAD);
  return needed.every((p) => {
    if (granted.includes(p)) return true;
    if (hasManageAds && p.startsWith('advertisement.')) return true;
    if (hasManageTheme && p.startsWith('theme.')) return true;
    if (p === PERMISSIONS.MEDIA_VIEW && hasMediaRead) return true;
    if (p === PERMISSIONS.MEDIA_READ && hasMediaView) return true;
    if (p === PERMISSIONS.MEDIA_EDIT && hasMediaUpload) return true;
    return false;
  });
}

export function hasAnyRole(userRoles: readonly string[], allowed: readonly RoleSlug[]): boolean {
  return allowed.some((role) => userRoles.includes(role));
}

export function isAdminRole(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ['super_admin', 'admin']);
}

export const AUTH_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH0_NOT_CONFIGURED: 'AUTH0_NOT_CONFIGURED',
} as const;
