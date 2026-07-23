const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-green-100 text-green-800',
  up: 'bg-green-100 text-green-800',
  degraded: 'bg-amber-100 text-amber-800',
  down: 'bg-red-100 text-red-800',
  unconfigured: 'bg-slate-100 text-slate-600',
  memory: 'bg-blue-100 text-blue-800',
};

export function DependencyStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {status}
    </span>
  );
}
