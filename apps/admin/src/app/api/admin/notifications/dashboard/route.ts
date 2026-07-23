import { proxyNotifications } from '@/lib/notifications-proxy';

export async function GET() {
  return proxyNotifications('/dashboard', 'GET');
}
