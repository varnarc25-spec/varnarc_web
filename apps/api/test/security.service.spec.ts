import { describe, expect, it, vi } from 'vitest';
import { SecurityService } from '../src/modules/security/security.service';
import { SecurityConfigService } from '../src/modules/security/security.service';
import { Auth0ManagementService } from '../src/modules/security/auth0-management.service';

describe('SecurityService', () => {
  const repos = {
    securityEvents: {
      summary: vi.fn().mockResolvedValue({ total: 2, bySeverity: {}, topEventTypes: [] }),
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn(),
    },
    users: {
      listRecentLogins: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findByAuth0UserId: vi.fn(),
      listLoginHistory: vi.fn(),
    },
    auditLogs: {
      create: vi.fn(),
      list: vi.fn(),
    },
  };

  const auth0Management = {
    isConfigured: () => false,
    revokeUserSessions: vi.fn(),
  } as unknown as Auth0ManagementService;

  const securityConfig = {
    getRateLimitPerMinute: () => 120,
    getCorsOrigins: () => ['http://localhost:3000'],
    isRedisConfigured: () => false,
  } as SecurityConfigService;

  it('returns security overview', async () => {
    const service = new SecurityService(repos as never, auth0Management, securityConfig);
    const overview = await service.overview();
    expect(overview.rateLimit.perMinute).toBe(120);
    expect(overview.events24h.total).toBe(2);
  });
});
