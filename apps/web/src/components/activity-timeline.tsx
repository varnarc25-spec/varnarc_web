'use client';

import Link from 'next/link';

const LABELS: Record<string, string> = {
  'bookmark.created': 'Saved a bookmark',
  'avatar.updated': 'Updated profile photo',
  'profile.updated': 'Updated profile',
};

function formatActivityType(type: string) {
  return LABELS[type] ?? type.replace(/\./g, ' · ').replace(/_/g, ' ');
}

export type ActivityItem = {
  id: string;
  activityType: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  createdAt: string;
  title?: string | null;
  href?: string | null;
  subtitle?: string | null;
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-[var(--varnarc-subtle)]">No recent activity yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-[var(--varnarc-border)] pl-6">
      {items.map((row) => (
        <li key={row.id} className="relative pb-8 last:pb-0">
          <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--varnarc-surface)] bg-[#f97316]" />
          <p className="font-medium text-[var(--varnarc-ink)]">{formatActivityType(row.activityType)}</p>
          {row.title ? (
            row.href ? (
              <Link href={row.href} className="mt-0.5 block text-sm text-[#f97316] hover:underline">
                {row.title}
              </Link>
            ) : (
              <p className="mt-0.5 text-sm text-[var(--varnarc-ink)]">{row.title}</p>
            )
          ) : row.entityType ? (
            <p className="mt-0.5 text-sm text-[var(--varnarc-subtle)]">
              {row.entityType}
              {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ''}
            </p>
          ) : null}
          {row.subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--varnarc-subtle)]">{row.subtitle}</p>
          ) : null}
          <time className="mt-1 block text-xs text-[var(--varnarc-subtle)]">
            {new Date(row.createdAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  );
}
