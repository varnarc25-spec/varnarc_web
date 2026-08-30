/**
 * Construction analytics — centralized helpers on top of `trackAnalyticsEvent`.
 *
 * All events go through `trackConstructionEvent` so payloads stay consistent and
 * sanitized (no PII, uploads, exact money, or private project content).
 *
 * @see ./ANALYTICS.md
 */

import { trackAnalyticsEvent } from '@/lib/analytics-client';

export const CONSTRUCTION_ANALYTICS_EVENTS = [
  'construction_page_view',
  'construction_category_view',
  'calculator_started',
  'calculator_completed',
  'calculator_error',
  'calculator_reset',
  'reverse_calculator_started',
  'reverse_calculator_completed',
  'reverse_calculator_error',
  'calculation_shared',
  'calculation_saved',
  'calculation_added_to_project',
  'project_created',
  'project_updated',
  'boq_generated',
  'comparison_started',
  'comparison_completed',
  'material_selector_started',
  'material_selector_completed',
  'material_selector_result_clicked',
  'price_viewed',
  'price_location_changed',
  'price_position_viewed',
  'search_performed',
  'search_result_clicked',
  'construction_search_no_result',
  'guide_clicked',
  'supplier_clicked',
  'intent_card_clicked',
  'landing_cta_clicked',
  'ask_search_performed',
  'ask_result_clicked',
  'what_next_clicked',
  'related_link_clicked',
] as const;

export type ConstructionAnalyticsEvent = (typeof CONSTRUCTION_ANALYTICS_EVENTS)[number];

export type ConstructionLocationLevel = 'city' | 'state' | 'national' | 'unknown';

/** Coarse buckets only — never send exact totals. */
export type ConstructionResultRangeCategory = 'low' | 'mid' | 'high' | 'unknown';

export type ConstructionCalculatorCompletedMeta = {
  calculator_type: string;
  unit?: string | null;
  location_level?: ConstructionLocationLevel;
  result_range_category?: ConstructionResultRangeCategory;
  logged_in: boolean;
};

type ConstructionEventBase = {
  path?: string;
  entityType?: string;
  /** Only UUID entity ids are sent to the API schema; others stay in metadata. */
  entityId?: string;
};

const SENSITIVE_METADATA_KEYS = new Set([
  'email',
  'phone',
  'name',
  'full_name',
  'fullName',
  'username',
  'user_id',
  'userId',
  'password',
  'token',
  'address',
  'street',
  'pincode',
  'postal',
  'notes',
  'project_name',
  'projectName',
  'title',
  'query',
  'search',
  'q',
  'file',
  'upload',
  'content',
  'document',
  'boq_items',
  'line_items',
  'rooms',
  'inputs',
  'outputs',
  'payload',
  'amount',
  'total',
  'totalCost',
  'price',
  'unitPrice',
  'unit_cost',
  'unitCost',
  'estimatedCost',
  'budget',
  'expense',
  'region',
  'city',
  'state',
  'location',
  'location_name',
  'locationName',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Known construction calculator slugs (CMS /calculators/*). */
export const CONSTRUCTION_CALCULATOR_SLUGS = new Set([
  'construction-cost',
  'cement',
  'concrete',
  'brick',
  'steel',
  'bbs',
  'bar-bending-schedule',
  'boq-generator',
  'timeline-planner',
  'budget-tracker',
  'document-vault',
  'material-selector',
  'paint',
  'tile',
  'flooring',
  'sand',
  'aggregate',
  'plaster',
  'excavation',
  'waterproofing',
]);

export function isConstructionCalculatorSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return CONSTRUCTION_CALCULATOR_SLUGS.has(slug) || slug.startsWith('construction-');
}

export function isConstructionAnalyticsPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/construction' || p.startsWith('/construction/')) return true;
  if (p.startsWith('/calculators/')) {
    const slug = p.slice('/calculators/'.length).split('/')[0];
    return isConstructionCalculatorSlug(slug);
  }
  return false;
}

export function resolveConstructionPageKey(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/construction') return 'hub';
  if (p.startsWith('/calculators/')) {
    return `calculator:${p.slice('/calculators/'.length).split('/')[0] ?? 'unknown'}`;
  }
  const rest = p.replace(/^\/construction\/?/, '');
  if (!rest) return 'hub';
  const [segment, ...tail] = rest.split('/');
  if (!segment || tail.length === 0) return segment || 'hub';
  if (segment === 'materials' && tail[0]) return 'material_detail';
  if (segment === 'brands' && tail[0]) return 'brand_detail';
  if (segment === 'guides' && tail[0]) return 'guide_detail';
  if (segment === 'checklists' && tail[0]) return 'checklist_detail';
  return `${segment}_detail`;
}

/**
 * Map a numeric result into a coarse range category.
 * Thresholds are INR-ish order-of-magnitude buckets for cost tools;
 * quantity tools can pass a custom scale via `scale`.
 */
export function categorizeConstructionResultRange(
  value: number | null | undefined,
  scale: 'cost_inr' | 'quantity' = 'cost_inr',
): ConstructionResultRangeCategory {
  if (value == null || !Number.isFinite(value) || value < 0) return 'unknown';
  if (scale === 'quantity') {
    if (value < 50) return 'low';
    if (value < 500) return 'mid';
    return 'high';
  }
  if (value < 500_000) return 'low';
  if (value < 5_000_000) return 'mid';
  return 'high';
}

/** Infer location granularity without emitting place names. */
export function resolveConstructionLocationLevel(input?: {
  hasCity?: boolean;
  hasState?: boolean;
  hasNational?: boolean;
}): ConstructionLocationLevel {
  if (input?.hasCity) return 'city';
  if (input?.hasState) return 'state';
  if (input?.hasNational) return 'national';
  return 'unknown';
}

export function sanitizeConstructionAnalyticsMetadata(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key)) continue;
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) continue;
    if (value == null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > 120) continue;
      // Block values that look like emails / phones
      if (trimmed.includes('@') || /^\+?\d[\d\s-]{7,}$/.test(trimmed)) continue;
      out[key] = trimmed;
      continue;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue;
      // Reject large financial-looking raw numbers outside allowlisted keys
      if (
        !['item_count', 'result_count', 'comparison_item_count', 'depth_percent'].includes(key) &&
        Math.abs(value) > 10_000
      ) {
        continue;
      }
      out[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      out[key] = value;
      continue;
    }
    // Drop nested objects/arrays (often payloads / uploads)
  }
  return out;
}

function safeEntityId(entityId?: string): string | undefined {
  if (!entityId) return undefined;
  return UUID_RE.test(entityId) ? entityId : undefined;
}

/**
 * Single entry point for Construction product analytics.
 * Emits `eventType: 'custom'` with `construction_event` for funnel reporting.
 */
export function trackConstructionEvent(
  event: ConstructionAnalyticsEvent,
  options?: ConstructionEventBase & {
    metadata?: Record<string, unknown>;
  },
) {
  const sanitized = sanitizeConstructionAnalyticsMetadata(options?.metadata);
  trackAnalyticsEvent({
    eventType: 'custom',
    entityType: options?.entityType ?? 'construction',
    entityId: safeEntityId(options?.entityId),
    path: options?.path,
    metadata: {
      construction_event: event,
      vertical: 'construction',
      ...sanitized,
    },
  });
}

export function trackConstructionPageView(input: {
  page_key: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('construction_page_view', {
    path: input.path,
    metadata: {
      page_key: input.page_key,
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackConstructionCategoryView(input: { category_key: string; path?: string }) {
  trackConstructionEvent('construction_category_view', {
    path: input.path,
    metadata: { category_key: input.category_key },
  });
}

export function trackCalculatorStarted(input: {
  calculator_type: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('calculator_started', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackCalculatorCompleted(
  input: ConstructionCalculatorCompletedMeta & { path?: string },
) {
  trackConstructionEvent('calculator_completed', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      unit: input.unit ?? undefined,
      location_level: input.location_level ?? 'unknown',
      result_range_category: input.result_range_category ?? 'unknown',
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackCalculatorError(input: {
  calculator_type: string;
  error_code?: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('calculator_error', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      error_code: input.error_code ?? 'unknown',
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackCalculatorReset(input: { calculator_type: string; path?: string }) {
  trackConstructionEvent('calculator_reset', {
    path: input.path,
    metadata: { calculator_type: input.calculator_type },
  });
}

/** Independent reverse-mode tracking (do not rely on calculator_completed alone). */
export function trackReverseCalculatorStarted(input: {
  calculator_type: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('reverse_calculator_started', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      calc_mode: 'reverse',
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackReverseCalculatorCompleted(
  input: ConstructionCalculatorCompletedMeta & { path?: string },
) {
  trackConstructionEvent('reverse_calculator_completed', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      calc_mode: 'reverse',
      unit: input.unit ?? undefined,
      location_level: input.location_level ?? 'unknown',
      result_range_category: input.result_range_category ?? 'unknown',
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackReverseCalculatorError(input: {
  calculator_type: string;
  error_code?: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('reverse_calculator_error', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      calc_mode: 'reverse',
      error_code: input.error_code ?? 'unknown',
      logged_in: Boolean(input.logged_in),
    },
  });
}

/**
 * Track completion for either forward or reverse — reverse also emits the
 * independent reverse_* event so usage can be reported separately.
 */
export function trackCalculatorModeCompleted(input: {
  mode: 'forward' | 'reverse';
  calculator_type: string;
  unit?: string | null;
  location_level?: ConstructionLocationLevel;
  result_range_category?: ConstructionResultRangeCategory;
  logged_in?: boolean;
  path?: string;
}) {
  const payload = {
    calculator_type: input.calculator_type,
    unit: input.unit,
    location_level: input.location_level,
    result_range_category: input.result_range_category,
    logged_in: Boolean(input.logged_in),
    path: input.path,
  };
  if (input.mode === 'reverse') {
    trackReverseCalculatorCompleted(payload);
  } else {
    trackCalculatorCompleted(payload);
  }
}

export function trackCalculatorModeError(input: {
  mode: 'forward' | 'reverse';
  calculator_type: string;
  error_code?: string;
  path?: string;
  logged_in?: boolean;
}) {
  if (input.mode === 'reverse') {
    trackReverseCalculatorError(input);
  } else {
    trackCalculatorError(input);
  }
}

export function trackCalculationShared(input: {
  calculator_type: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('calculation_shared', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackCalculationSaved(input: {
  calculator_type: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('calculation_saved', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackCalculationAddedToProject(input: {
  calculator_type: string;
  path?: string;
  logged_in?: boolean;
}) {
  trackConstructionEvent('calculation_added_to_project', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      logged_in: Boolean(input.logged_in),
    },
  });
}

export function trackProjectCreated(input?: { path?: string; logged_in?: boolean }) {
  trackConstructionEvent('project_created', {
    path: input?.path,
    metadata: { logged_in: Boolean(input?.logged_in ?? true) },
  });
}

export function trackProjectUpdated(input?: { path?: string; logged_in?: boolean }) {
  trackConstructionEvent('project_updated', {
    path: input?.path,
    metadata: { logged_in: Boolean(input?.logged_in ?? true) },
  });
}

export function trackBoqGenerated(input?: {
  path?: string;
  logged_in?: boolean;
  item_count_bucket?: 'none' | 'few' | 'many';
}) {
  trackConstructionEvent('boq_generated', {
    path: input?.path,
    metadata: {
      logged_in: Boolean(input?.logged_in),
      item_count_bucket: input?.item_count_bucket ?? 'unknown',
    },
  });
}

export function trackComparisonStarted(input?: { path?: string; comparison_item_count?: number }) {
  trackConstructionEvent('comparison_started', {
    path: input?.path,
    metadata: {
      comparison_item_count:
        input?.comparison_item_count != null && input.comparison_item_count <= 10
          ? input.comparison_item_count
          : undefined,
    },
  });
}

export function trackComparisonCompleted(input?: {
  path?: string;
  comparison_item_count?: number;
  logged_in?: boolean;
}) {
  trackConstructionEvent('comparison_completed', {
    path: input?.path,
    metadata: {
      comparison_item_count:
        input?.comparison_item_count != null && input.comparison_item_count <= 10
          ? input.comparison_item_count
          : undefined,
      logged_in: Boolean(input?.logged_in),
    },
  });
}

export function trackMaterialSelectorStarted(input?: { path?: string; task_id?: string }) {
  trackConstructionEvent('material_selector_started', {
    path: input?.path ?? '/construction/material-selector',
    metadata: {
      task_id: input?.task_id?.slice(0, 40),
    },
  });
}

export function trackMaterialSelectorCompleted(input: {
  path?: string;
  task_id: string;
  answer_keys?: string[];
  result_count?: number;
}) {
  trackConstructionEvent('material_selector_completed', {
    path: input.path ?? '/construction/material-selector',
    metadata: {
      task_id: input.task_id.slice(0, 40),
      answer_keys: (input.answer_keys ?? []).slice(0, 12).map((k) => k.slice(0, 48)),
      result_count:
        input.result_count != null && input.result_count <= 20 ? input.result_count : undefined,
    },
  });
}

export function trackMaterialSelectorResultClicked(input: {
  path?: string;
  task_id?: string;
  suggestion_id?: string;
  target_type: 'calculator' | 'material' | 'comparison';
  target_path?: string;
}) {
  trackConstructionEvent('material_selector_result_clicked', {
    path: input.path ?? '/construction/material-selector',
    metadata: {
      task_id: input.task_id?.slice(0, 40),
      suggestion_id: input.suggestion_id?.slice(0, 48),
      target_type: input.target_type,
      target_path: input.target_path?.slice(0, 120),
    },
  });
}

export function trackPriceViewed(input: {
  material_key?: string;
  location_level?: ConstructionLocationLevel;
  path?: string;
}) {
  trackConstructionEvent('price_viewed', {
    path: input.path,
    metadata: {
      material_key: input.material_key,
      location_level: input.location_level ?? 'unknown',
    },
  });
}

export function trackPricePositionViewed(input: {
  material_key?: string;
  location_level?: ConstructionLocationLevel;
  position_band?: string;
  path?: string;
}) {
  trackConstructionEvent('price_position_viewed', {
    path: input.path ?? '/construction/price-position',
    metadata: {
      material_key: input.material_key,
      location_level: input.location_level ?? 'unknown',
      position_band: input.position_band?.slice(0, 24),
    },
  });
}

export function trackPriceLocationChanged(input: {
  location_level: ConstructionLocationLevel;
  path?: string;
}) {
  trackConstructionEvent('price_location_changed', {
    path: input.path,
    metadata: { location_level: input.location_level },
  });
}

/** Search query text is never sent to generic analytics — only length bucket + surface.
 *  A separate privacy-safe opportunity log stores scrubbed query text server-side.
 */
export function trackSearchPerformed(input: {
  surface: string;
  query_length_bucket: 'empty' | 'short' | 'medium' | 'long';
  result_count_bucket?: 'none' | 'few' | 'many';
  path?: string;
}) {
  trackConstructionEvent('search_performed', {
    path: input.path,
    metadata: {
      surface: input.surface,
      query_length_bucket: input.query_length_bucket,
      result_count_bucket: input.result_count_bucket,
    },
  });
}

/**
 * Privacy-safe opportunity log: sends query to BFF which scrubs PII and hashes.
 * Do not include user identifiers.
 */
export function logConstructionSearchOpportunity(input: {
  query: string;
  surface: string;
  resultCount: number;
  path?: string;
  clicked?: boolean;
}) {
  if (typeof window === 'undefined') return;
  const q = input.query.trim();
  if (!q) return;
  void fetch('/api/construction/search-opportunities/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: q.slice(0, 200),
      surface: input.surface,
      resultCount: input.resultCount,
      clicked: Boolean(input.clicked),
      path: input.path,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function logConstructionSearchOpportunityClick(input: { query: string; surface?: string }) {
  if (typeof window === 'undefined') return;
  const q = input.query.trim();
  if (!q) return;
  void fetch('/api/construction/search-opportunities/events/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: q.slice(0, 200),
      surface: input.surface,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

export function trackSearchResultClicked(input: {
  surface: string;
  result_type: string;
  path?: string;
}) {
  trackConstructionEvent('search_result_clicked', {
    path: input.path,
    metadata: {
      surface: input.surface,
      result_type: input.result_type,
    },
  });
}

export function trackConstructionSearchNoResult(input: {
  surface: string;
  query_length_bucket: 'empty' | 'short' | 'medium' | 'long';
  path?: string;
}) {
  trackConstructionEvent('construction_search_no_result', {
    path: input.path,
    metadata: {
      surface: input.surface,
      query_length_bucket: input.query_length_bucket,
    },
  });
}

export function trackGuideClicked(input: { guide_key?: string; path?: string }) {
  trackConstructionEvent('guide_clicked', {
    path: input.path,
    metadata: { guide_key: input.guide_key },
  });
}

export function trackSupplierClicked(input: { supplier_key?: string; path?: string }) {
  trackConstructionEvent('supplier_clicked', {
    path: input.path,
    metadata: { supplier_key: input.supplier_key },
  });
}

export function trackIntentCardClicked(input: {
  intent_key: string;
  path?: string;
  action?: 'select' | 'next_action';
  next_action_key?: string;
}) {
  trackConstructionEvent('intent_card_clicked', {
    path: input.path,
    metadata: {
      intent_key: input.intent_key,
      action: input.action ?? 'select',
      next_action_key: input.next_action_key,
    },
  });
}

export function trackLandingCtaClicked(input: {
  cta_key: string;
  surface?: string;
  path?: string;
}) {
  trackConstructionEvent('landing_cta_clicked', {
    path: input.path,
    metadata: {
      cta_key: input.cta_key,
      surface: input.surface ?? 'landing',
    },
  });
}

/** Smart "What next?" recommendation clicks on calculator results. */
export function trackWhatNextClicked(input: {
  calculator_type: string;
  action_id: string;
  path?: string;
  logged_in?: boolean;
  has_projects?: boolean;
}) {
  trackConstructionEvent('what_next_clicked', {
    path: input.path,
    metadata: {
      calculator_type: input.calculator_type,
      action_id: input.action_id,
      logged_in: Boolean(input.logged_in),
      has_projects: Boolean(input.has_projects),
    },
  });
}

/** Controlled internal-link recommendation CTR (no PII). */
export function trackRelatedLinkClicked(input: {
  source_entity_id: string;
  target_entity_id?: string;
  relation?: string;
  href: string;
  surface?: string;
}) {
  trackConstructionEvent('related_link_clicked', {
    path: input.href,
    metadata: {
      source_entity_id: input.source_entity_id.slice(0, 80),
      target_entity_id: input.target_entity_id?.slice(0, 80),
      relation: input.relation?.slice(0, 40),
      surface: input.surface?.slice(0, 40) ?? 'construction',
    },
  });
}

/** Ask Varnarc Construction — never includes raw query text. */
export function trackAskSearchPerformed(input: {
  intent: string;
  category: string;
  result_count_bucket: 'none' | 'few' | 'many';
  auto_routed: boolean;
  query_length_bucket: 'empty' | 'short' | 'medium' | 'long';
  path?: string;
}) {
  trackConstructionEvent('ask_search_performed', {
    path: input.path,
    metadata: {
      intent: input.intent,
      category: input.category,
      result_count_bucket: input.result_count_bucket,
      auto_routed: input.auto_routed,
      query_length_bucket: input.query_length_bucket,
    },
  });
}

export function trackAskResultClicked(input: {
  intent: string;
  result_type: string;
  path?: string;
}) {
  trackConstructionEvent('ask_result_clicked', {
    path: input.path,
    metadata: {
      intent: input.intent,
      result_type: input.result_type,
    },
  });
}

export function queryLengthBucket(query: string | null | undefined) {
  const len = query?.trim().length ?? 0;
  if (len === 0) return 'empty' as const;
  if (len <= 3) return 'short' as const;
  if (len <= 20) return 'medium' as const;
  return 'long' as const;
}

export function resultCountBucket(count: number | null | undefined) {
  if (count == null || count <= 0) return 'none' as const;
  if (count <= 5) return 'few' as const;
  return 'many' as const;
}
