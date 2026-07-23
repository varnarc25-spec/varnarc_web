import { proxyAnalytics } from '@/lib/analytics-proxy';

export async function GET(req: Request) {
  return proxyAnalytics('/analytics/integrations', 'GET', undefined, req);
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyAnalytics('/analytics/integrations', 'PUT', body, req);
}
