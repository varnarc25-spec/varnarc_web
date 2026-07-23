import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import { SECURITY_RATE_LIMITS, secretHealthStatus } from '@varnarc/config';
import { isAuth0Configured } from '@varnarc/auth';
import { securitySettingsSchema } from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { SETTINGS_KEYS } from '../settings/settings.service';
import { Auth0ManagementService } from './auth0-management.service';

@Injectable()
export class SecurityConfigService implements OnModuleInit {
  private rateLimitPerMinute: number = SECURITY_RATE_LIMITS.global;
  private corsOrigins: string[] = [];

  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async onModuleInit() {
    await this.refresh();
  }

  async refresh() {
    const row = await this.repos.settings.findByKey(SETTINGS_KEYS.security);
    const parsed = securitySettingsSchema.safeParse(row?.value ?? {});
    const settings = parsed.success ? parsed.data : securitySettingsSchema.parse({});

    this.rateLimitPerMinute = settings.rateLimitPerMinute;
    const envOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_ADMIN_URL,
    ].filter((value): value is string => Boolean(value?.trim()));

    const configured = [...settings.corsOrigins, ...settings.allowedOrigins, ...envOrigins];
    this.corsOrigins = [...new Set(configured.map((origin) => origin.trim()).filter(Boolean))];
  }

  getRateLimitPerMinute() {
    return this.rateLimitPerMinute;
  }

  getCorsOrigins() {
    if (!this.corsOrigins.length) {
      return [
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001',
      ];
    }
    return this.corsOrigins;
  }

  isRedisConfigured() {
    return Boolean(process.env.REDIS_URL?.trim());
  }
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly auth0Management: Auth0ManagementService,
    private readonly securityConfig: SecurityConfigService,
  ) {}

  async overview() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [eventSummary, recentLogins, failedEvents] = await Promise.all([
      this.repos.securityEvents.summary(since),
      this.repos.users.listRecentLogins(10),
      this.repos.securityEvents.list({ limit: 5, eventType: 'auth.failure' }),
    ]);

    return {
      auth0: {
        configured: isAuth0Configured(),
        sessionRevocation: this.auth0Management.isConfigured(),
      },
      rateLimit: {
        perMinute: this.securityConfig.getRateLimitPerMinute(),
        storage: this.securityConfig.isRedisConfigured() ? 'redis' : 'memory',
      },
      corsOrigins: this.securityConfig.getCorsOrigins(),
      secrets: secretHealthStatus(),
      events24h: eventSummary,
      recentLogins,
      recentFailedAuth: failedEvents.items,
    };
  }

  listEvents(query: Parameters<Repositories['securityEvents']['list']>[0]) {
    return this.repos.securityEvents.list(query);
  }

  listAuditLogs(query: Parameters<Repositories['auditLogs']['list']>[0]) {
    return this.repos.auditLogs.list(query);
  }

  async listSessions(userId?: string) {
    if (userId) {
      const user = await this.repos.users.findById(userId);
      if (!user) return { sessions: [], source: 'login_history' as const };

      const history = await this.repos.users.listLoginHistory(userId, 1, 25);
      return {
        source: 'login_history' as const,
        sessions: history.rows,
      };
    }

    const rows = await this.repos.users.listRecentLogins(25);
    return {
      source: 'login_history' as const,
      sessions: rows,
    };
  }

  async revokeSessions(input: {
    userId?: string;
    auth0UserId?: string;
    reason?: string;
    actorId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    let auth0UserId = input.auth0UserId;
    let userId = input.userId;

    if (userId && !auth0UserId) {
      const user = await this.repos.users.findById(userId);
      auth0UserId = user?.auth0UserId ?? undefined;
    }

    if (auth0UserId && !userId) {
      const user = await this.repos.users.findByAuth0UserId(auth0UserId);
      userId = user?.id;
    }

    const revoked = auth0UserId
      ? await this.auth0Management.revokeUserSessions(auth0UserId)
      : { revoked: false, reason: 'Auth0 not configured or user not linked' };

    await this.repos.auditLogs.create({
      userId: input.actorId,
      action: 'security.revoke_sessions',
      entity: 'user',
      entityId: userId ?? auth0UserId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: { reason: input.reason ?? null, auth0Revoked: revoked.revoked },
    });

    if (userId || auth0UserId) {
      await this.repos.securityEvents.create({
        eventType: 'session.revoked',
        severity: 'medium',
        description: input.reason ?? 'Sessions revoked by administrator',
        userId: userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: { auth0UserId, revoked: revoked.revoked },
      });
    }

    return {
      userId: userId ?? null,
      auth0UserId: auth0UserId ?? null,
      ...revoked,
    };
  }
}
