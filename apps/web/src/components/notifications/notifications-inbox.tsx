'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';
import type { InboxItem } from '@/lib/notifications-client';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notifications-client';

export function NotificationsInbox({ initialItems }: { initialItems: InboxItem[] }) {
  const [items, setItems] = useState(initialItems);

  async function markRead(id: string) {
    await markNotificationRead(id);
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, readAt: new Date().toISOString() } : row)));
  }

  async function markAll() {
    await markAllNotificationsRead();
    const now = new Date().toISOString();
    setItems((prev) => prev.map((row) => ({ ...row, readAt: row.readAt ?? now })));
  }

  if (!items.length) {
    return <p className="text-sm text-[var(--varnarc-subtle)]">You&apos;re all caught up.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => void markAll()}>
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-[var(--varnarc-border)] rounded-lg border border-[var(--varnarc-border)]">
        {items.map((row) => (
          <li key={row.id} className={`p-4 ${row.readAt ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-[var(--varnarc-ink)]">{row.notification.title}</p>
                <p className="mt-1 text-sm text-[var(--varnarc-subtle)]">{row.notification.body}</p>
                <p className="mt-2 text-xs text-[var(--varnarc-subtle)]">
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
              {!row.readAt ? (
                <Button type="button" variant="ghost" onClick={() => void markRead(row.id)}>
                  Mark read
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
