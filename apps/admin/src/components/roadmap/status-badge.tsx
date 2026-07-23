import { Badge } from '@varnarc/ui';
import type { RoadmapItemStatus, RoadmapPhaseStatus } from '@varnarc/config';

const itemStyles: Record<RoadmapItemStatus, string> = {
  complete: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-900',
  planned: 'bg-slate-100 text-slate-700',
  deferred: 'bg-rose-100 text-rose-800',
};

const phaseStyles: Record<RoadmapPhaseStatus, string> = {
  complete: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-amber-100 text-amber-900',
  planned: 'bg-slate-100 text-slate-700',
};

export function ItemStatusBadge({ status }: { status: RoadmapItemStatus }) {
  return <Badge className={itemStyles[status]}>{status.replace('_', ' ')}</Badge>;
}

export function PhaseStatusBadge({ status }: { status: RoadmapPhaseStatus }) {
  return <Badge className={phaseStyles[status]}>{status.replace('_', ' ')}</Badge>;
}
