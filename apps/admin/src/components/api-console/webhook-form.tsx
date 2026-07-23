'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@varnarc/ui';

const EVENTS = [
  'article.published',
  'review.approved',
  'user.registered',
  'lead.created',
  'notification.delivered',
];

export function WebhookForm({
  initial,
}: {
  initial?: {
    id: string;
    name: string;
    url: string;
    events: string[];
    enabled: boolean;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [events, setEvents] = useState<string[]>(initial?.events ?? ['lead.created']);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [message, setMessage] = useState<string | null>(null);

  function toggleEvent(event: string) {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  }

  async function save() {
    setMessage(null);
    const body = { name, url, events, enabled };
    const endpoint = initial ? `/api/admin/platform/webhooks/${initial.id}` : '/api/admin/platform/webhooks';
    const res = await fetch(endpoint, {
      method: initial ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!res.ok) throw new Error(json.error?.message || 'Save failed');
    setMessage('Saved.');
    router.refresh();
  }

  async function test() {
    if (!initial) return;
    setMessage(null);
    const res = await fetch(`/api/admin/platform/webhooks/${initial.id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: events[0] ?? 'lead.created' }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string }; data?: { success?: boolean } };
    if (!res.ok) throw new Error(json.error?.message || 'Test failed');
    setMessage(json.data?.success ? 'Test delivery succeeded.' : 'Test delivery failed — check delivery logs.');
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4">
      <h3 className="text-sm font-semibold">{initial ? `Edit ${initial.name}` : 'New webhook'}</h3>
      <label className="block text-sm">
        Name
        <input className="mt-1 block h-10 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] px-3" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm">
        URL
        <input className="mt-1 block h-10 w-full max-w-lg rounded-md border border-[var(--varnarc-border)] px-3" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/webhooks/varnarc" />
      </label>
      <div className="space-y-2 text-sm">
        <span className="block text-[var(--varnarc-subtle)]">Events</span>
        <div className="flex flex-wrap gap-3">
          {EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2">
              <input type="checkbox" checked={events.includes(event)} onChange={() => toggleEvent(event)} />
              {event}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Enabled
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={!name || !url || !events.length} onClick={() => void save().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed'))}>
          Save webhook
        </Button>
        {initial ? (
          <Button type="button" variant="secondary" onClick={() => void test().catch((e) => setMessage(e instanceof Error ? e.message : 'Failed'))}>
            Send test
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
    </div>
  );
}
