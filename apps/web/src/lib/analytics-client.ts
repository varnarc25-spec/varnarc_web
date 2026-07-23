const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const SESSION_KEY = 'vn_analytics_session';

export type AnalyticsEventType =
  | 'page_view'
  | 'search'
  | 'click'
  | 'scroll'
  | 'download'
  | 'share'
  | 'bookmark'
  | 'contact_form'
  | 'lead_request'
  | 'affiliate_click'
  | 'advertisement_click'
  | 'advertisement_impression'
  | 'calculator_usage'
  | 'tool_view'
  | 'listing_view'
  | 'phone_click'
  | 'whatsapp_click'
  | 'website_click'
  | 'review_read'
  | 'rating_submit'
  | 'comparison_view'
  | 'custom';

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return `s_${Date.now()}`;
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function trackAnalyticsEvent(payload: {
  eventType: AnalyticsEventType;
  entityType?: string;
  entityId?: string;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  source?: string;
  medium?: string;
  campaign?: string;
}) {
  const body = {
    ...payload,
    sessionId: getAnalyticsSessionId(),
    path: payload.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    referrer:
      payload.referrer ?? (typeof document !== 'undefined' ? document.referrer || undefined : undefined),
  };

  void fetch(`${apiUrl}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}
