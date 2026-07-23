import { proxyNotifications } from '@/lib/notifications-proxy';

export async function GET(req: Request) {
  return proxyNotifications('/templates', 'GET', undefined, req);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyNotifications('/templates', 'POST', body);
}
