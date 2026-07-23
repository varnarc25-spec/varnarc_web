'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type Template = {
  id: string;
  slug: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
};

export default function NotificationTemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  async function load() {
    const res = await fetch('/api/admin/notifications/templates');
    const json = (await res.json()) as { data?: Template[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTemplate() {
    setMessage(null);
    const res = await fetch('/api/admin/notifications/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, subject: subject || null, body, channel: 'IN_APP' }),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Create failed');
      return;
    }
    setSlug('');
    setName('');
    setSubject('');
    setBody('');
    setMessage('Template created.');
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/notifications/templates/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Notification templates" description="Reusable templates with {{variable}} placeholders." />
      <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] p-4 md:grid-cols-2">
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 md:col-span-2" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="min-h-24 rounded-md border border-[var(--varnarc-border)] p-3 md:col-span-2" placeholder="Body with {{name}} variables" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="button" onClick={() => void createTemplate()}>Create template</Button>
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Channel</th>
              <th className="px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-3 py-2 font-mono text-xs">{row.slug}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.channel}</td>
                <td className="px-3 py-2 text-right">
                  <Button type="button" variant="ghost" onClick={() => void remove(row.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
