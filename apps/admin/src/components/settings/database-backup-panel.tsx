'use client';

import { useState } from 'react';
import { Button } from '@varnarc/ui';

export type DatabaseBackupStatus = {
  configured?: boolean;
  host?: string | null;
  port?: number | null;
  database?: string | null;
  ssl?: boolean;
  usesPooler?: boolean;
  providerHint?: 'neon' | 'postgres';
  pgDumpAvailable?: boolean;
};

export function DatabaseBackupPanel({ initial }: { initial: DatabaseBackupStatus }) {
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/database/backup', { cache: 'no-store' });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || type.includes('application/json')) {
        const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(json.error?.message || `Backup failed (${res.status})`);
      }
      const blob = await res.blob();
      const filename =
        res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        'varnarc-backup.sql';
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <dl className="grid gap-3 rounded-lg border border-[var(--varnarc-border)] bg-[var(--varnarc-surface)] p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--varnarc-subtle)]">Host</dt>
          <dd className="font-mono">{initial.host ?? 'Not configured'}</dd>
        </div>
        <div>
          <dt className="text-[var(--varnarc-subtle)]">Database</dt>
          <dd className="font-mono">{initial.database ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[var(--varnarc-subtle)]">Provider</dt>
          <dd>{initial.providerHint === 'neon' ? 'Neon PostgreSQL' : 'PostgreSQL'}</dd>
        </div>
        <div>
          <dt className="text-[var(--varnarc-subtle)]">Dump engine</dt>
          <dd>
            {initial.pgDumpAvailable
              ? 'pg_dump'
              : 'Built-in SQL export (pg_dump not installed on API host)'}
          </dd>
        </div>
      </dl>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="button" onClick={download} disabled={downloading || !initial.configured}>
        {downloading ? 'Creating dump…' : 'Download full SQL backup'}
      </Button>

      <section className="space-y-2 text-sm leading-6 text-[var(--varnarc-subtle)]">
        <h2 className="text-base font-semibold text-[var(--varnarc-ink)]">
          Move Neon → VPS Postgres
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Download the dump here, or run <code className="font-mono">pnpm db:backup</code> locally
            (uses the non-pooler host).
          </li>
          <li>
            On the VPS: create an empty database, apply Prisma migrations, then restore:
            <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--varnarc-border)] bg-[var(--varnarc-muted)] p-3 font-mono text-xs text-[var(--varnarc-ink)]">
              {`createdb varnarc
DATABASE_URL=postgresql://USER:PASS@VPS_HOST:5432/varnarc pnpm --filter @varnarc/database migrate:deploy
pnpm db:restore -- --url=postgresql://USER:PASS@VPS_HOST:5432/varnarc --file=backups/varnarc.sql`}
            </pre>
          </li>
          <li>
            Point API, web, admin, and CI at the VPS URL (no Neon pooler). Restart API and run{' '}
            <code className="font-mono">pnpm db:migrate</code> only if Prisma reports pending
            migrations.
          </li>
        </ol>
      </section>
    </div>
  );
}
