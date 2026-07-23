export type RoadmapItemStatus = 'complete' | 'in_progress' | 'planned' | 'deferred';

export type RoadmapPhaseStatus = 'complete' | 'in_progress' | 'planned';

export interface RoadmapItem {
  id: string;
  label: string;
  status: RoadmapItemStatus;
  moduleRef?: string;
}

export interface RoadmapPhase {
  id: number;
  slug: string;
  title: string;
  objective: string;
  milestone: string;
  status: RoadmapPhaseStatus;
  releaseVersion: string;
  items: RoadmapItem[];
  dependencies?: string[];
}

export interface ReleaseTrack {
  version: string;
  name: string;
  focus: string;
  status: RoadmapPhaseStatus;
  targetPhaseIds: number[];
}

export interface RoadmapKpi {
  id: string;
  category: 'technical' | 'business';
  label: string;
  target: string;
  notes?: string;
}

export interface RoadmapRisk {
  id: string;
  challenge: string;
  mitigation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Workstream {
  id: string;
  label: string;
  status: RoadmapItemStatus;
  moduleRef?: string;
}

export const ROADMAP_VISION = [
  'Knowledge Portal',
  'Finance Hub',
  'Construction Hub',
  'Automobile Hub',
  'Useful Tools & Calculators',
  'Business Directory',
  'Product Reviews',
  'Product Comparisons',
  'AI Productivity Tools',
  'Digital Publishing Platform',
] as const;

export const RELEASE_TRACKS: ReleaseTrack[] = [
  {
    version: 'v1.x',
    name: 'Platform Foundation',
    focus: 'Core architecture, publishing, ops, and quality gates',
    status: 'complete',
    targetPhaseIds: [1],
  },
  {
    version: 'v2.x',
    name: 'Content Expansion',
    focus: 'Vertical content hubs, reviews, comparisons, directory',
    status: 'complete',
    targetPhaseIds: [2],
  },
  {
    version: 'v3.x',
    name: 'AI Platform',
    focus: 'AI-assisted publishing and productivity workflows',
    status: 'planned',
    targetPhaseIds: [3, 4],
  },
  {
    version: 'v4.x',
    name: 'Community & Premium',
    focus: 'Engagement, subscriptions, and monetization',
    status: 'planned',
    targetPhaseIds: [5, 6],
  },
  {
    version: 'v5.x',
    name: 'Enterprise Platform',
    focus: 'Business services, mobile, and enterprise SaaS',
    status: 'planned',
    targetPhaseIds: [7, 8, 9],
  },
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 1,
    slug: 'platform-foundation',
    title: 'Platform Foundation (MVP)',
    objective: 'Establish the core platform architecture and publishing capabilities.',
    milestone: 'Stable production-ready publishing platform.',
    status: 'complete',
    releaseVersion: 'v1.x',
    items: [
      { id: 'monorepo', label: 'Monorepo setup', status: 'complete', moduleRef: 'PROJECT_SPEC' },
      { id: 'web', label: 'Next.js website', status: 'complete', moduleRef: '06-Frontend' },
      { id: 'api', label: 'NestJS API', status: 'complete', moduleRef: '05-Backend' },
      { id: 'database', label: 'PostgreSQL (Neon) + Prisma', status: 'complete', moduleRef: '03-Database' },
      { id: 'auth', label: 'Auth0 authentication', status: 'complete', moduleRef: '05-Backend' },
      { id: 'rbac', label: 'RBAC', status: 'complete', moduleRef: '07-Admin' },
      { id: 'cms', label: 'CMS', status: 'complete', moduleRef: '08-CMS' },
      { id: 'media', label: 'Media library', status: 'complete', moduleRef: '08-CMS' },
      { id: 'themes', label: 'Theme builder', status: 'complete', moduleRef: '07-Admin' },
      { id: 'homepage', label: 'Homepage builder', status: 'complete', moduleRef: '08-CMS' },
      { id: 'ads', label: 'Advertisement system', status: 'complete', moduleRef: '10-Advertisement' },
      { id: 'search', label: 'Search', status: 'complete', moduleRef: '09-Search' },
      { id: 'seo', label: 'SEO', status: 'complete', moduleRef: '23-SEO' },
      { id: 'analytics', label: 'Analytics', status: 'complete', moduleRef: '22-Analytics' },
      { id: 'notifications', label: 'Notifications', status: 'complete', moduleRef: '24-Notifications' },
      { id: 'settings', label: 'Settings', status: 'complete', moduleRef: '26-Settings' },
      { id: 'docker', label: 'Docker', status: 'complete', moduleRef: '29-Docker' },
      { id: 'gcp', label: 'Google Cloud deployment', status: 'complete', moduleRef: '30-Google-Cloud' },
      { id: 'testing', label: 'Testing framework', status: 'complete', moduleRef: '31-Testing' },
      { id: 'security', label: 'Security framework', status: 'complete', moduleRef: '33-Security' },
      { id: 'performance', label: 'Performance optimization', status: 'complete', moduleRef: '32-Performance' },
      { id: 'standards', label: 'Coding standards', status: 'complete', moduleRef: '34-Coding-Standards' },
      { id: 'cursor', label: 'Cursor prompts & AI workflow', status: 'complete', moduleRef: '35-Cursor-Prompts' },
      { id: 'roadmap', label: 'Roadmap & planning', status: 'complete', moduleRef: '36-Roadmap' },
    ],
  },
  {
    id: 2,
    slug: 'content-expansion',
    title: 'Content Expansion',
    objective: 'Grow valuable content and user engagement.',
    milestone: 'A comprehensive content platform with SEO-focused growth.',
    status: 'complete',
    releaseVersion: 'v2.x',
    dependencies: ['platform-foundation'],
    items: [
      { id: 'finance', label: 'Finance hub (articles, calculators, guides)', status: 'complete' },
      { id: 'construction', label: 'Construction hub', status: 'complete' },
      { id: 'automobile', label: 'Automobile hub', status: 'complete' },
      { id: 'reviews', label: 'Product reviews', status: 'complete' },
      { id: 'comparisons', label: 'Product comparisons', status: 'complete' },
      { id: 'directory', label: 'Business directory', status: 'complete' },
      { id: 'newsletter', label: 'Newsletter', status: 'complete' },
    ],
  },
  {
    id: 3,
    slug: 'utility-platform',
    title: 'Utility Platform',
    objective: 'Transform Varnarc into a daily-use utility platform.',
    milestone: 'A large library of interactive tools.',
    status: 'planned',
    releaseVersion: 'v3.x',
    dependencies: ['content-expansion'],
    items: [
      { id: 'calculator-engine', label: 'Calculator engine (EMI, SIP, tax, construction, auto)', status: 'complete' },
      { id: 'tool-marketplace', label: 'Tool marketplace', status: 'planned' },
      { id: 'bookmarking', label: 'Bookmarking', status: 'planned' },
      { id: 'favorites', label: 'Favorites', status: 'planned' },
      { id: 'history', label: 'Usage history', status: 'planned' },
    ],
  },
  {
    id: 4,
    slug: 'ai-platform',
    title: 'AI Platform',
    objective: 'Leverage AI to accelerate content creation and user productivity.',
    milestone: 'Integrated AI-powered publishing workflow.',
    status: 'planned',
    releaseVersion: 'v3.x',
    dependencies: ['utility-platform'],
    items: [
      { id: 'ai-writer', label: 'AI writer & summarizer', status: 'planned' },
      { id: 'ai-seo', label: 'AI SEO assistant', status: 'planned' },
      { id: 'ai-calculator', label: 'AI calculator assistant', status: 'planned' },
      { id: 'ai-search', label: 'AI search', status: 'planned' },
      { id: 'prompt-library', label: 'Prompt library', status: 'in_progress', moduleRef: '35-Cursor-Prompts' },
      { id: 'model-mgmt', label: 'Model management', status: 'planned' },
    ],
  },
  {
    id: 5,
    slug: 'community',
    title: 'Community',
    objective: 'Increase engagement through user participation.',
    milestone: 'An active contributor community.',
    status: 'planned',
    releaseVersion: 'v4.x',
    items: [
      { id: 'profiles', label: 'Public profiles', status: 'planned' },
      { id: 'comments', label: 'Comments & ratings', status: 'planned' },
      { id: 'submissions', label: 'Content submissions', status: 'planned' },
      { id: 'gamification', label: 'Gamification', status: 'planned' },
    ],
  },
  {
    id: 6,
    slug: 'premium',
    title: 'Premium Platform',
    objective: 'Introduce monetization beyond advertising.',
    milestone: 'Recurring subscription revenue.',
    status: 'planned',
    releaseVersion: 'v4.x',
    items: [
      { id: 'subscriptions', label: 'Subscriptions', status: 'planned' },
      { id: 'premium-content', label: 'Premium articles & calculators', status: 'planned' },
      { id: 'downloads', label: 'Digital downloads & courses', status: 'planned' },
      { id: 'affiliate-dash', label: 'Affiliate dashboards', status: 'planned' },
    ],
  },
  {
    id: 7,
    slug: 'business',
    title: 'Business Platform',
    objective: 'Expand into business services.',
    milestone: 'Business ecosystem.',
    status: 'planned',
    releaseVersion: 'v5.x',
    items: [
      { id: 'business-profiles', label: 'Business profiles & sponsored listings', status: 'planned' },
      { id: 'lead-gen', label: 'Lead generation', status: 'planned' },
      { id: 'ad-portal', label: 'Advertising portal', status: 'planned' },
      { id: 'partner-dash', label: 'Partner dashboard', status: 'planned' },
    ],
  },
  {
    id: 8,
    slug: 'mobile',
    title: 'Mobile Platform',
    objective: 'Provide native mobile experiences.',
    milestone: 'Cross-platform user experience.',
    status: 'planned',
    releaseVersion: 'v5.x',
    items: [
      { id: 'android', label: 'Android app', status: 'planned' },
      { id: 'ios', label: 'iOS app', status: 'planned' },
      { id: 'offline', label: 'Offline reading', status: 'planned' },
      { id: 'push', label: 'Push notifications', status: 'planned' },
    ],
  },
  {
    id: 9,
    slug: 'enterprise',
    title: 'Enterprise Platform',
    objective: 'Support enterprise customers.',
    milestone: 'Enterprise-ready SaaS offering.',
    status: 'planned',
    releaseVersion: 'v5.x',
    items: [
      { id: 'multi-tenancy', label: 'Multi-tenancy', status: 'planned' },
      { id: 'org-mgmt', label: 'Organization management', status: 'planned' },
      { id: 'enterprise-sso', label: 'Enterprise SSO', status: 'planned' },
      { id: 'api-access', label: 'API access & white-label', status: 'planned' },
      { id: 'audit-compliance', label: 'Audit compliance', status: 'planned' },
    ],
  },
];

export const CROSS_CUTTING_WORKSTREAMS: Workstream[] = [
  { id: 'security', label: 'Security', status: 'complete', moduleRef: '33-Security' },
  { id: 'testing', label: 'Testing', status: 'complete', moduleRef: '31-Testing' },
  { id: 'performance', label: 'Performance', status: 'complete', moduleRef: '32-Performance' },
  { id: 'accessibility', label: 'Accessibility', status: 'in_progress' },
  { id: 'seo', label: 'SEO', status: 'complete', moduleRef: '23-SEO' },
  { id: 'documentation', label: 'Documentation', status: 'in_progress' },
  { id: 'cicd', label: 'CI/CD', status: 'complete', moduleRef: '28-Deployment' },
  { id: 'monitoring', label: 'Monitoring', status: 'in_progress', moduleRef: '30-Google-Cloud' },
  { id: 'cost', label: 'Cost optimization', status: 'in_progress' },
];

export const ROADMAP_KPIS: RoadmapKpi[] = [
  { id: 'uptime', category: 'technical', label: 'Uptime', target: '> 99.9%' },
  { id: 'api-latency', category: 'technical', label: 'API latency (p95)', target: '< 200 ms' },
  { id: 'cwv', category: 'technical', label: 'Core Web Vitals', target: 'Pass' },
  { id: 'coverage', category: 'technical', label: 'Test coverage', target: '> 90%', notes: 'Expand incrementally per module' },
  { id: 'visitors', category: 'business', label: 'Monthly visitors', target: 'Track post-launch' },
  { id: 'organic', category: 'business', label: 'Organic traffic', target: 'Grow MoM' },
  { id: 'newsletter', category: 'business', label: 'Newsletter subscribers', target: 'Grow MoM' },
  { id: 'returning', category: 'business', label: 'Returning users', target: 'Increase' },
  { id: 'revenue', category: 'business', label: 'Revenue', target: 'Ads + future premium' },
  { id: 'conversion', category: 'business', label: 'Conversion rate', target: 'Optimize per funnel' },
];

export const ROADMAP_RISKS: RoadmapRisk[] = [
  {
    id: 'seo-algo',
    challenge: 'SEO algorithm changes',
    mitigation: 'Diversified traffic sources and quality content',
    severity: 'medium',
  },
  {
    id: 'ai-cost',
    challenge: 'AI provider costs',
    mitigation: 'Caching, model routing, and cost monitoring',
    severity: 'medium',
  },
  {
    id: 'scaling',
    challenge: 'Infrastructure scaling',
    mitigation: 'Cloud Run autoscaling, CDN, read replicas when needed',
    severity: 'medium',
  },
  {
    id: 'third-party',
    challenge: 'Third-party service outages',
    mitigation: 'Graceful degradation and backup providers',
    severity: 'medium',
  },
  {
    id: 'content-quality',
    challenge: 'Content quality at scale',
    mitigation: 'Editorial workflows, moderation, and analytics feedback',
    severity: 'low',
  },
  {
    id: 'security',
    challenge: 'Security threats',
    mitigation: 'Security module, audits, automated scanning in CI',
    severity: 'high',
  },
];

export const ROADMAP_LAST_UPDATED = '2026-07-22';

export function countItemsByStatus(items: RoadmapItem[]): Record<RoadmapItemStatus, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { complete: 0, in_progress: 0, planned: 0, deferred: 0 },
  );
}

export function phaseProgressPercent(phase: RoadmapPhase): number {
  if (phase.items.length === 0) return 0;
  const weights: Record<RoadmapItemStatus, number> = {
    complete: 1,
    in_progress: 0.5,
    planned: 0,
    deferred: 0,
  };
  const total = phase.items.reduce((sum, item) => sum + weights[item.status], 0);
  return Math.round((total / phase.items.length) * 100);
}

export function getPhaseById(id: number): RoadmapPhase | undefined {
  return ROADMAP_PHASES.find((phase) => phase.id === id);
}

export function getReleaseForPhase(phaseId: number): ReleaseTrack | undefined {
  return RELEASE_TRACKS.find((release) => release.targetPhaseIds.includes(phaseId));
}

export function getAllMilestones(): Array<{ phase: RoadmapPhase; progress: number }> {
  return ROADMAP_PHASES.map((phase) => ({
    phase,
    progress: phaseProgressPercent(phase),
  }));
}
