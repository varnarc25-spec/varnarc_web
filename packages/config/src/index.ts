export type AppEnvironment = 'local' | 'staging' | 'production';

export interface VarnarcPublicConfig {
  appUrl: string;
  adminUrl: string;
  apiUrl: string;
  environment: AppEnvironment;
}

export function getPublicConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): VarnarcPublicConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const environment: AppEnvironment =
    nodeEnv === 'production'
      ? env.APP_ENV === 'staging'
        ? 'staging'
        : 'production'
      : 'local';

  return {
    appUrl: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    adminUrl: env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001',
    apiUrl: env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
    environment,
  };
}

export const API_PREFIX = '/api/v1';

export { PERFORMANCE_TARGETS, evaluateLatency, type LatencyEvaluation } from './performance';
export { withPerformanceDefaults } from './next-performance';
export { CDN_CACHE, CDN_HEADER_RULES, getCdnHeaderRules } from './cdn';
export {
  SECURITY_RATE_LIMITS,
  SECRET_ENV_KEYS,
  secretHealthStatus,
} from './security';
export {
  resolveSearchEngine,
  isOpenSearchEngine,
  getOpenSearchEnv,
  type SearchEngineId,
} from './search';
export { withSecurityHeaders, getSecurityHeaders } from './next-security';
export {
  ROADMAP_VISION,
  RELEASE_TRACKS,
  ROADMAP_PHASES,
  CROSS_CUTTING_WORKSTREAMS,
  ROADMAP_KPIS,
  ROADMAP_RISKS,
  ROADMAP_LAST_UPDATED,
  countItemsByStatus,
  phaseProgressPercent,
  getPhaseById,
  getReleaseForPhase,
  getAllMilestones,
  type RoadmapItemStatus,
  type RoadmapPhaseStatus,
  type RoadmapItem,
  type RoadmapPhase,
  type ReleaseTrack,
  type RoadmapKpi,
  type RoadmapRisk,
  type Workstream,
} from './roadmap';
export {
  FUTURE_FEATURES_LAST_UPDATED,
  FUTURE_FEATURE_MODULES,
  FUTURE_FEATURES,
  getFutureFeatureModule,
  getFeaturesByModule,
  groupFeaturesByModule,
  countFutureFeatures,
  getFeaturesByPhase,
  type FutureFeaturePriority,
  type FutureFeatureStatus,
  type FutureFeatureModule,
  type FutureFeature,
} from './future-features';
