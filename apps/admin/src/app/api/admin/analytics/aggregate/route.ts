import { proxyAnalytics } from '@/lib/analytics-proxy';

export async function POST(req: Request) {
  return proxyAnalytics('/analytics/aggregate', 'POST', undefined, req);
}
