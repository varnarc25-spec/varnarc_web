'use client';

import { useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

export default function NotificationBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');
  const [audience, setAudience] = useState<'all' | 'role' | 'users'>('all');
  const [roleSlug, setRoleSlug] = useState('user');
  const [userIds, setUserIds] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    setMessage(null);
    const payload = {
      title,
      body,
      channel: 'IN_APP' as const,
      audience,
      templateSlug: templateSlug.trim() || undefined,
      roleSlug: audience === 'role' ? roleSlug : undefined,
      userIds:
        audience === 'users'
          ? userIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    };
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as {
      error?: { message?: string };
      data?: { recipientCount?: number };
    };
    if (!res.ok) {
      setMessage(json.error?.message || 'Broadcast failed');
      return;
    }
    setMessage(`Sent to ${json.data?.recipientCount ?? 0} users.`);
    setTitle('');
    setBody('');
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Broadcast notification" description="Send an in-app notification to users." />
      <div className="max-w-xl space-y-4 rounded-lg border border-[var(--varnarc-border)] p-4">
        <label className="block text-sm">
          Audience
          <select className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
            <option value="all">All active users</option>
            <option value="role">By role</option>
            <option value="users">Specific user IDs</option>
          </select>
        </label>
        {audience === 'role' ? (
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="role slug (e.g. user)" value={roleSlug} onChange={(e) => setRoleSlug(e.target.value)} />
        ) : null}
        {audience === 'users' ? (
          <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="comma-separated user UUIDs" value={userIds} onChange={(e) => setUserIds(e.target.value)} />
        ) : null}
        <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="Template slug (optional)" value={templateSlug} onChange={(e) => setTemplateSlug(e.target.value)} />
        <input className="h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="min-h-28 w-full rounded-md border border-[var(--varnarc-border)] p-3" placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="button" onClick={() => void send()}>Send broadcast</Button>
        {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      </div>
    </div>
  );
}
