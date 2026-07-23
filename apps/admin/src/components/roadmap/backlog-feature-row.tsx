import type { FutureFeature } from '@varnarc/config';
import { Badge } from '@varnarc/ui';

const priorityStyles = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-900',
  high: 'bg-rose-100 text-rose-800',
} as const;

const statusStyles = {
  backlog: 'bg-slate-100 text-slate-600',
  planned: 'bg-blue-100 text-blue-800',
  in_research: 'bg-violet-100 text-violet-800',
  deferred: 'bg-neutral-200 text-neutral-700',
} as const;

export function BacklogFeatureRow({ feature }: { feature: FutureFeature }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm">
      <span>
        <span className="text-[var(--varnarc-subtle)]">{feature.category}</span>
        {' — '}
        {feature.title}
        {feature.phase ? (
          <span className="ml-2 text-xs text-[var(--varnarc-subtle)]">Phase {feature.phase}</span>
        ) : null}
        {feature.notes ? (
          <span className="ml-2 text-xs italic text-[var(--varnarc-subtle)]">{feature.notes}</span>
        ) : null}
      </span>
      <span className="flex items-center gap-2">
        <Badge className={priorityStyles[feature.priority]}>{feature.priority}</Badge>
        <Badge className={statusStyles[feature.status]}>{feature.status.replace('_', ' ')}</Badge>
      </span>
    </li>
  );
}
