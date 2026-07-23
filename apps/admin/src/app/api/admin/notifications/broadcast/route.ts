import { proxyNotifications } from '@/lib/notifications-proxy';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyNotifications('/broadcast', 'POST', body);
}
