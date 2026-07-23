import { proxyAnalytics } from '@/lib/analytics-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyAnalytics('/analytics/system/metrics', 'POST', body, req);
}
