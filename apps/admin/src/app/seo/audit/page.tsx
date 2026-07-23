'use client';

import { useEffect, useState } from 'react';
import { Button, PageHeader } from '@varnarc/ui';

type AuditIssue = {
  id: string;
  entityType: string | null;
  entityId: string | null;
  issueType: string;
  severity: string;
  message: string;
  resolved: boolean;
};

export default function SeoAuditPage() {
  const [items, setItems] = useState<AuditIssue[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/seo/audit');
    const json = (await res.json()) as { data?: AuditIssue[] };
    setItems(json.data ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function runAudit() {
    setMessage(null);
    const res = await fetch('/api/admin/seo/audit', { method: 'POST' });
    if (!res.ok) {
      setMessage('Audit failed');
      return;
    }
    setMessage('Audit completed.');
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="SEO Audit" description="Detect missing metadata, duplicates, and redirect issues." />
      <Button type="button" onClick={() => void runAudit()}>
        Run audit
      </Button>
      {message ? <p className="text-sm text-[var(--varnarc-subtle)]">{message}</p> : null}
      <ul className="space-y-2">
        {items.map((issue) => (
          <li
            key={issue.id}
            className="rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-3 text-sm"
          >
            <span className="font-medium uppercase text-[var(--varnarc-subtle)]">{issue.severity}</span>
            <span className="mx-2">·</span>
            <span>{issue.message}</span>
          </li>
        ))}
        {!items.length ? <p className="text-sm text-[var(--varnarc-subtle)]">No open issues.</p> : null}
      </ul>
    </div>
  );
}
