import { proxyNotifications } from '@/lib/notifications-proxy';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyNotifications(`/templates/${id}`, 'DELETE');
}
