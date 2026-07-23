import { proxyNotifications } from '@/lib/notifications-proxy';

export async function GET() {
  return proxyNotifications('/providers/settings', 'GET');
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyNotifications('/providers/settings', 'PUT', body);
}
