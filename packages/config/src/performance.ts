/** Platform performance targets (module 32). */
export const PERFORMANCE_TARGETS = {
  web: {
    fcpMs: 1800,
    lcpMs: 2500,
    inpMs: 200,
    cls: 0.1,
    ttfbMs: 300,
  },
  api: {
    avgResponseMs: 200,
    p95ResponseMs: 500,
    errorRate: 0.01,
  },
  search: {
    avgQueryMs: 150,
  },
  admin: {
    dashboardLoadMs: 2000,
  },
} as const;

export type LatencyEvaluation = {
  metric: string;
  value: number;
  target: number;
  unit: 'ms' | 'ratio';
  status: 'ok' | 'warn' | 'critical';
};

export function evaluateLatency(
  metric: string,
  value: number,
  target: number,
  unit: 'ms' | 'ratio' = 'ms',
): LatencyEvaluation {
  const ratio = unit === 'ratio' ? value / target : value / target;
  let status: LatencyEvaluation['status'] = 'ok';
  if (ratio > 1.5) status = 'critical';
  else if (ratio > 1) status = 'warn';
  return { metric, value, target, unit, status };
}
