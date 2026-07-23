import { proxyAnalytics } from '@/lib/analytics-proxy';

export async function GET(req: Request) {
  return proxyAnalytics('/analytics/dashboard', 'GET', undefined, req);
}
