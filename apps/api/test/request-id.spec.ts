import { describe, expect, it } from 'vitest';
import { shouldPersistApiLog } from '../src/common/middleware/request-id.middleware';

describe('shouldPersistApiLog', () => {
  it('skips health and docs paths', () => {
    expect(shouldPersistApiLog('/api/v1/health')).toBe(false);
    expect(shouldPersistApiLog('/api/v1/docs')).toBe(false);
    expect(shouldPersistApiLog('/api/v1/metrics')).toBe(false);
    expect(shouldPersistApiLog('/api/v1/metrics/prometheus')).toBe(false);
    expect(shouldPersistApiLog('/api/v1/articles')).toBe(true);
  });
});
