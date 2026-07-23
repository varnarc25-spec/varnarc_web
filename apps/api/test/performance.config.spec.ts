import { describe, expect, it, vi } from 'vitest';
import { evaluateLatency, PERFORMANCE_TARGETS } from '@varnarc/config';

describe('evaluateLatency', () => {
  it('marks ok when under target', () => {
    expect(evaluateLatency('api.avg_ms', 100, 200).status).toBe('ok');
  });

  it('marks warn when slightly over target', () => {
    expect(evaluateLatency('api.avg_ms', 250, 200).status).toBe('warn');
  });

  it('marks critical when far over target', () => {
    expect(evaluateLatency('api.avg_ms', 400, 200).status).toBe('critical');
  });
});

describe('PERFORMANCE_TARGETS', () => {
  it('defines api budgets', () => {
    expect(PERFORMANCE_TARGETS.api.avgResponseMs).toBe(200);
    expect(PERFORMANCE_TARGETS.api.p95ResponseMs).toBe(500);
  });
});
