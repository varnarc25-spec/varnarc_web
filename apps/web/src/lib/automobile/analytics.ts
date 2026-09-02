import { trackAnalyticsEvent } from '@/lib/analytics-client';

export function trackAutomobileEvent(
  event:
    | 'automobile_filter_used'
    | 'vehicle_search'
    | 'vehicle_view'
    | 'vehicle_compare_added'
    | 'vehicle_compare_started'
    | 'onroad_price_started'
    | 'emi_calculator_started'
    | 'car_finder_started'
    | 'car_finder_completed',
  metadata?: Record<string, unknown>,
) {
  trackAnalyticsEvent({
    eventType: 'custom',
    entityType: 'automobile',
    metadata: { automobile_event: event, ...metadata },
  });
}
