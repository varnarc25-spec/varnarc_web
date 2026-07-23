export type InboxItem = {
  id: string;
  readAt: string | null;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    body: string;
    channel: string;
    metadata?: unknown;
    createdAt: string;
  };
};

export async function fetchUnreadCount() {
  const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
  if (!res.ok) return 0;
  const json = (await res.json()) as { data?: { count?: number } };
  return json.data?.count ?? 0;
}

export async function fetchInbox(params?: { unreadOnly?: boolean; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.unreadOnly) qs.set('unreadOnly', 'true');
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  const res = await fetch(`/api/notifications${suffix}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: InboxItem[] };
  return json.data ?? [];
}

export async function markNotificationRead(id: string) {
  await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  await fetch('/api/notifications/read-all', { method: 'PATCH' });
}
