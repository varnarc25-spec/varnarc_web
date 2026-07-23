'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, PageHeader } from '@varnarc/ui';

type Template = {
  id: string;
  slug: string;
  name: string;
  subject: string;
};

export default function NewsletterTemplatesPage() {
  const [items, setItems] = useState<Template[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  async function load() {
    const res = await fetch('/api/admin/newsletter/templates?limit=50');
    const json = (await res.json()) as { data?: Template[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTemplate() {
    setMessage(null);
    const res = await fetch('/api/admin/newsletter/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, subject, bodyHtml }),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Create failed');
      return;
    }
    setSlug('');
    setName('');
    setSubject('');
    setBodyHtml('');
    setMessage('Template created.');
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/newsletter/templates/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Newsletter templates"
        description="HTML email templates with {{email}}, {{unsubscribeUrl}}, and {{siteUrl}} placeholders."
        actions={
          <Link href="/notifications/campaigns" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            Campaigns →
          </Link>
        }
      />
      <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] p-4 md:grid-cols-2">
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 md:col-span-2" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="min-h-40 rounded-md border border-[var(--varnarc-border)] p-3 font-mono text-xs md:col-span-2" placeholder="HTML body" value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} />
        <Button type="button" onClick={() => void createTemplate()}>Create template</Button>
      </div>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      <div className="overflow-auto rounded-lg border border-[var(--varnarc-border)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--varnarc-border)] bg-[var(--varnarc-surface)]">
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Subject</th>
              <th className="px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-[var(--varnarc-border)]">
                <td className="px-3 py-2 font-mono text-xs">{row.slug}</td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.subject}</td>
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
