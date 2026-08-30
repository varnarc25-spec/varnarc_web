import { describe, expect, it, vi, beforeEach } from 'vitest';

const trackAnalyticsEvent = vi.fn();

vi.mock('@/lib/analytics-client', () => ({
  trackAnalyticsEvent: (...args: unknown[]) => trackAnalyticsEvent(...args),
  getAnalyticsSessionId: () => 'test-session',
}));

import {
  CONSTRUCTION_ANALYTICS_EVENTS,
  categorizeConstructionResultRange,
  queryLengthBucket,
  resolveConstructionLocationLevel,
  sanitizeConstructionAnalyticsMetadata,
  trackCalculatorCompleted,
  trackConstructionEvent,
  trackSearchPerformed,
} from '@/lib/construction/analytics';

describe('construction analytics catalog', () => {
  it('includes all required event names', () => {
    const required = [
      'construction_page_view',
      'construction_category_view',
      'calculator_started',
      'calculator_completed',
      'calculator_error',
      'calculator_reset',
      'calculation_shared',
      'calculation_saved',
      'calculation_added_to_project',
      'project_created',
      'project_updated',
      'boq_generated',
      'comparison_started',
      'comparison_completed',
      'price_viewed',
      'price_location_changed',
      'search_performed',
      'search_result_clicked',
      'construction_search_no_result',
      'guide_clicked',
      'supplier_clicked',
    ];
    expect(CONSTRUCTION_ANALYTICS_EVENTS).toContain('intent_card_clicked');
    expect(CONSTRUCTION_ANALYTICS_EVENTS).toContain('landing_cta_clicked');
    for (const event of required) {
      expect(CONSTRUCTION_ANALYTICS_EVENTS).toContain(event);
    }
  });
});

describe('sanitizeConstructionAnalyticsMetadata', () => {
  it('strips sensitive keys and nested payloads', () => {
    const cleaned = sanitizeConstructionAnalyticsMetadata({
      calculator_type: 'cement',
      email: 'a@b.com',
      totalCost: 1250000,
      notes: 'private',
      region: 'Hyderabad',
      logged_in: true,
      query: 'cement bags',
      inputs: { length: 10 },
    });
    expect(cleaned).toEqual({
      calculator_type: 'cement',
      logged_in: true,
    });
  });

  it('allows small counts but drops large raw money-like numbers', () => {
    const cleaned = sanitizeConstructionAnalyticsMetadata({
      comparison_item_count: 3,
      amount: 999999,
      mystery_number: 250000,
    });
    expect(cleaned.comparison_item_count).toBe(3);
    expect(cleaned.amount).toBeUndefined();
    expect(cleaned.mystery_number).toBeUndefined();
  });
});

describe('range and location helpers', () => {
  it('categorizes cost ranges without exposing exact values', () => {
    expect(categorizeConstructionResultRange(100_000)).toBe('low');
    expect(categorizeConstructionResultRange(1_000_000)).toBe('mid');
    expect(categorizeConstructionResultRange(10_000_000)).toBe('high');
    expect(categorizeConstructionResultRange(null)).toBe('unknown');
  });

  it('resolves location level only', () => {
    expect(resolveConstructionLocationLevel({ hasCity: true })).toBe('city');
    expect(resolveConstructionLocationLevel({ hasState: true })).toBe('state');
    expect(resolveConstructionLocationLevel({ hasNational: true })).toBe('national');
    expect(resolveConstructionLocationLevel()).toBe('unknown');
  });

  it('buckets query length without keeping the query', () => {
    expect(queryLengthBucket('')).toBe('empty');
    expect(queryLengthBucket('ab')).toBe('short');
    expect(queryLengthBucket('cement paint')).toBe('medium');
    expect(queryLengthBucket('a'.repeat(30))).toBe('long');
  });
});

describe('trackConstructionEvent', () => {
  beforeEach(() => {
    trackAnalyticsEvent.mockClear();
  });

  it('emits custom events with construction_event name', () => {
    trackConstructionEvent('guide_clicked', {
      metadata: { guide_key: 'cement-basics', email: 'leak@x.com' },
    });
    expect(trackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'custom',
        entityType: 'construction',
        metadata: expect.objectContaining({
          construction_event: 'guide_clicked',
          vertical: 'construction',
          guide_key: 'cement-basics',
        }),
      }),
    );
    const meta = trackAnalyticsEvent.mock.calls[0][0].metadata;
    expect(meta.email).toBeUndefined();
  });

  it('calculator_completed only sends safe metadata fields', () => {
    trackCalculatorCompleted({
      calculator_type: 'cost_estimator',
      unit: 'sqft',
      location_level: 'state',
      result_range_category: 'mid',
      logged_in: true,
    });
    const meta = trackAnalyticsEvent.mock.calls[0][0].metadata;
    expect(meta).toEqual({
      construction_event: 'calculator_completed',
      vertical: 'construction',
      calculator_type: 'cost_estimator',
      unit: 'sqft',
      location_level: 'state',
      result_range_category: 'mid',
      logged_in: true,
    });
  });

  it('search_performed never includes the raw query', () => {
    trackSearchPerformed({
      surface: 'materials',
      query_length_bucket: 'medium',
      result_count_bucket: 'few',
    });
    const meta = trackAnalyticsEvent.mock.calls[0][0].metadata;
    expect(meta.query).toBeUndefined();
    expect(meta.query_length_bucket).toBe('medium');
  });
});
