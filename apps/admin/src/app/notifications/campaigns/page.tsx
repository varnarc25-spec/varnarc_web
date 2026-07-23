'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, PageHeader } from '@varnarc/ui';
import { DateTimeLocalInput } from '@/components/datetime-local-input';

type Template = { id: string; name: string; slug: string };
type Campaign = {
  id: string;
  name: string;
  slug: string;
  status: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
  template?: Template | null;
};

export default function NewsletterCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  async function load() {
    const [campaignRes, templateRes] = await Promise.all([
      fetch('/api/admin/newsletter/campaigns?limit=50'),
      fetch('/api/admin/newsletter/templates?limit=50'),
    ]);
    const campaignJson = (await campaignRes.json()) as { data?: Campaign[] };
    const templateJson = (await templateRes.json()) as { data?: Template[] };
    setCampaigns(campaignJson.data ?? []);
    setTemplates(templateJson.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCampaign() {
    setMessage(null);
    const res = await fetch('/api/admin/newsletter/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug,
        templateId: templateId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }),
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setMessage(json.error?.message || 'Create failed');
      return;
    }
    setName('');
    setSlug('');
    setTemplateId('');
    setScheduledAt('');
    setMessage('Campaign created.');
    await load();
  }

  async function sendCampaign(id: string, dryRun: boolean) {
    setMessage(null);
    const res = await fetch(`/api/admin/newsletter/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun }),
    });
    const json = (await res.json()) as {
      error?: { message?: string };
      data?: { sent?: number; recipientCount?: number; deliveryMode?: string; dryRun?: boolean };
    };
    if (!res.ok) {
      setMessage(json.error?.message || 'Send failed');
      return;
    }
    const data = json.data;
    setMessage(
      data?.dryRun
        ? `Dry run: would send to ${data.recipientCount ?? 0} subscribers (${data.deliveryMode}).`
        : `Sent to ${data?.sent ?? 0} of ${data?.recipientCount ?? 0} subscribers (${data?.deliveryMode}).`,
    );
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/newsletter/campaigns/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Newsletter campaigns"
        description="Compose campaigns from templates and send to all subscribed emails."
        actions={
          <Link href="/notifications/newsletter-templates" className="text-sm text-[var(--varnarc-brand)] hover:underline">
            Templates →
          </Link>
        }
      />

      <div className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] p-4 md:grid-cols-2">
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="h-10 rounded-md border border-[var(--varnarc-border)] px-3" placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <select className="h-10 rounded-md border border-[var(--varnarc-border)] px-3 md:col-span-2" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">Select template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Schedule (optional)</span>
          <DateTimeLocalInput
            className="mt-1 block h-10 w-full rounded-md border border-[var(--varnarc-border)] px-3"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>
        <Button type="button" onClick={() => void createCampaign()}>Create campaign</Button>
      </div>

      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-lg border border-[var(--varnarc-border)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{campaign.name}</h3>
                <p className="text-sm text-[var(--varnarc-subtle)]">
                  /{campaign.slug} · {campaign.template?.name ?? 'No template'}
                </p>
                {campaign.scheduledAt ? (
                  <p className="text-xs text-[var(--varnarc-subtle)]">
                    Scheduled {new Date(campaign.scheduledAt).toLocaleString()}
                  </p>
                ) : null}
                {campaign.sentAt ? (
                  <p className="text-xs text-[var(--varnarc-subtle)]">
                    Sent {new Date(campaign.sentAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{campaign.status}</Badge>
                {campaign.status !== 'PUBLISHED' ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => void sendCampaign(campaign.id, true)}>
                      Dry run
                    </Button>
                    <Button size="sm" onClick={() => void sendCampaign(campaign.id, false)}>
                      Send now
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void remove(campaign.id)}>
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!campaigns.length ? (
          <p className="text-sm text-[var(--varnarc-subtle)]">No campaigns yet. Create a template first, then a campaign.</p>
        ) : null}
      </div>
    </div>
  );
}
