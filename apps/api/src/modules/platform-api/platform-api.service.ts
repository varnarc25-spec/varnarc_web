import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { Repositories } from '@varnarc/database';
import { generateApiKey } from '@varnarc/database';
import type {
  ApiLogListQuery,
  CreateApiKeyInput,
  CreateWebhookInput,
  UpdateApiKeyInput,
  UpdateWebhookInput,
  WebhookTestInput,
} from '@varnarc/validation';
import { API_VERSION, WEBHOOK_EVENTS } from '@varnarc/validation';
import { getPublicConfig } from '@varnarc/config';
import { REPOS } from '../../database/database.module';
import { HealthService } from '../../health/health.service';

const LOG_RETENTION_DAYS = 14;

@Injectable()
export class PlatformApiService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly healthService: HealthService,
  ) {}

  version() {
    return {
      version: API_VERSION,
      apiPrefix: '/api/v1',
      environment: process.env.NODE_ENV ?? 'development',
      node: process.version,
    };
  }

  developers() {
    const config = getPublicConfig();
    const apiOrigin = config.apiUrl.replace(/\/api\/v1\/?$/, '');

    return {
      version: API_VERSION,
      apiPrefix: '/api/v1',
      portalUrl: `${config.appUrl}/developers`,
      docs: {
        swagger: `${apiOrigin}/api/v1/docs`,
        openapiJson: `${apiOrigin}/api/v1/docs-json`,
        gettingStarted: `${config.appUrl}/developers/docs`,
        authentication: `${config.appUrl}/developers/docs/authentication`,
        webhooks: `${config.appUrl}/developers/docs/webhooks`,
        sdk: `${config.appUrl}/developers/docs/sdk`,
      },
      sdk: {
        package: '@varnarc/sdk',
        install: 'pnpm add @varnarc/sdk',
        workspacePath: 'packages/sdk',
      },
      authentication: {
        methods: ['bearer_jwt', 'api_key'] as const,
        bearerHeader: 'Authorization',
        apiKeyHeader: 'X-Api-Key',
        note: 'Most read endpoints are public. Write operations and admin routes require Auth0 JWT or a platform API key issued by an administrator.',
      },
      rateLimits: this.rateLimits(),
      webhooks: {
        events: [...WEBHOOK_EVENTS],
        signatureHeader: 'X-Varnarc-Signature',
        eventHeader: 'X-Varnarc-Event',
        algorithm: 'sha256',
      },
      publicModules: [
        { id: 'search', path: '/search', description: 'Full-text search and autocomplete' },
        { id: 'articles', path: '/cms/articles', description: 'Published articles and guides' },
        { id: 'calculators', path: '/calculators', description: 'Calculator catalog and execution' },
        { id: 'directory', path: '/directory', description: 'Business directory listings' },
        { id: 'reviews', path: '/reviews', description: 'Product and service reviews' },
        { id: 'finance', path: '/finance', description: 'Finance products and rate data' },
      ],
    };
  }

  async status() {
    const readiness = await this.healthService.getReadiness();
    const hasRedis = Boolean(process.env.REDIS_URL?.trim());
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logSummary = await this.repos.apiRequestLogs.summary(since).catch(() => ({
      total: 0,
      errors: 0,
      avgDurationMs: 0,
    }));

    return {
      service: 'varnarc-api',
      status: readiness.status,
      timestamp: new Date().toISOString(),
      database: readiness.database,
      cache: hasRedis ? readiness.redis : 'memory',
      auth0: readiness.auth0,
      environment: readiness.environment,
      throttler: { ttlMs: 60_000, limit: 120 },
      docsUrl: '/api/v1/docs',
      last24h: logSummary,
    };
  }

  async overview() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [logSummary, keysPage, webhooksPage] = await Promise.all([
      this.repos.apiRequestLogs.summary(since),
      this.repos.apiKeys.list({ limit: 100 }),
      this.repos.webhookEndpoints.list({ limit: 100 }),
    ]);

    return {
      version: this.version(),
      status: await this.status(),
      counts: {
        apiKeys: keysPage.items.length,
        webhooks: webhooksPage.items.length,
      },
      last24h: logSummary,
    };
  }

  listLogs(query: ApiLogListQuery) {
    return this.repos.apiRequestLogs.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      statusCode: query.statusCode,
      path: query.path,
    });
  }

  async pruneLogs() {
    const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.repos.apiRequestLogs.pruneOlderThan(cutoff);
    return { deleted: result.count, olderThan: cutoff.toISOString() };
  }

  listKeys(query: { cursor?: string; limit?: number; direction?: 'asc' | 'desc' }) {
    return this.repos.apiKeys.list(query);
  }

  async createKey(input: CreateApiKeyInput, actorId: string) {
    const generated = generateApiKey();
    const row = await this.repos.apiKeys.create({
      name: input.name,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      scopes: input.scopes,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: actorId,
    });

    await this.repos.auditLogs
      .create({
        action: 'api.key.create',
        entity: 'api_key',
        entityId: row.id,
        userId: actorId,
        newValue: { name: row.name, keyPrefix: row.keyPrefix, scopes: row.scopes } as never,
      })
      .catch(() => undefined);

    return {
      ...row,
      key: generated.raw,
    };
  }

  async updateKey(id: string, input: UpdateApiKeyInput, actorId: string) {
    const existing = await this.repos.apiKeys.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found.' },
      });
    }

    const row = await this.repos.apiKeys.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.scopes !== undefined ? { scopes: input.scopes } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.expiresAt !== undefined
        ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
        : {}),
    });

    await this.repos.auditLogs
      .create({
        action: 'api.key.update',
        entity: 'api_key',
        entityId: id,
        userId: actorId,
        newValue: input as never,
      })
      .catch(() => undefined);

    return row;
  }

  async revokeKey(id: string, actorId: string) {
    const existing = await this.repos.apiKeys.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found.' },
      });
    }

    await this.repos.apiKeys.softDelete(id);
    await this.repos.auditLogs
      .create({
        action: 'api.key.revoke',
        entity: 'api_key',
        entityId: id,
        userId: actorId,
      })
      .catch(() => undefined);

    return { revoked: true };
  }

  listWebhooks(query: { cursor?: string; limit?: number; direction?: 'asc' | 'desc' }) {
    return this.repos.webhookEndpoints.list(query);
  }

  async createWebhook(input: CreateWebhookInput, actorId: string) {
    const row = await this.repos.webhookEndpoints.create({
      name: input.name,
      url: input.url,
      secret: input.secret ?? null,
      events: input.events,
      enabled: input.enabled,
      createdBy: actorId,
    });

    await this.repos.auditLogs
      .create({
        action: 'api.webhook.create',
        entity: 'webhook_endpoint',
        entityId: row.id,
        userId: actorId,
        newValue: { name: row.name, url: row.url, events: row.events } as never,
      })
      .catch(() => undefined);

    return row;
  }

  async updateWebhook(id: string, input: UpdateWebhookInput, actorId: string) {
    const existing = await this.repos.webhookEndpoints.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Webhook not found.' },
      });
    }

    const row = await this.repos.webhookEndpoints.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.secret !== undefined ? { secret: input.secret } : {}),
      ...(input.events !== undefined ? { events: input.events } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    });

    await this.repos.auditLogs
      .create({
        action: 'api.webhook.update',
        entity: 'webhook_endpoint',
        entityId: id,
        userId: actorId,
        newValue: input as never,
      })
      .catch(() => undefined);

    return row;
  }

  async deleteWebhook(id: string, actorId: string) {
    const existing = await this.repos.webhookEndpoints.findById(id);
    if (!existing) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Webhook not found.' },
      });
    }

    await this.repos.webhookEndpoints.softDelete(id);
    await this.repos.auditLogs
      .create({
        action: 'api.webhook.delete',
        entity: 'webhook_endpoint',
        entityId: id,
        userId: actorId,
      })
      .catch(() => undefined);

    return { deleted: true };
  }

  listWebhookDeliveries(endpointId: string, query: { cursor?: string; limit?: number }) {
    return this.repos.webhookDeliveries.listForEndpoint(endpointId, query);
  }

  async testWebhook(id: string, input: WebhookTestInput) {
    const endpoint = await this.repos.webhookEndpoints.findById(id);
    if (!endpoint) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Webhook not found.' },
      });
    }

    return this.deliver(endpoint.id, endpoint.url, endpoint.secret, input.event, input.payload ?? {
      test: true,
      timestamp: new Date().toISOString(),
    });
  }

  async dispatchEvent(event: string, payload: Record<string, unknown>) {
    const endpoints = await this.repos.webhookEndpoints.listEnabledForEvent(event);
    const results = [];

    for (const endpoint of endpoints) {
      results.push(
        await this.deliver(endpoint.id, endpoint.url, endpoint.secret, event, payload),
      );
    }

    return results;
  }

  private async deliver(
    endpointId: string,
    url: string,
    secret: string | null,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Varnarc-Event': event,
    };

    if (secret) {
      const signature = createHmac('sha256', secret).update(body).digest('hex');
      headers['X-Varnarc-Signature'] = `sha256=${signature}`;
    }

    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const success = res.ok;
      const delivery = await this.repos.webhookDeliveries.create({
        endpointId,
        event,
        payload: payload as never,
        statusCode: res.status,
        success,
        errorMessage: success ? null : `HTTP ${res.status}`,
      });
      return { endpointId, success, statusCode: res.status, deliveryId: delivery.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delivery failed';
      const delivery = await this.repos.webhookDeliveries.create({
        endpointId,
        event,
        payload: payload as never,
        success: false,
        errorMessage: message,
      });
      return { endpointId, success: false, errorMessage: message, deliveryId: delivery.id };
    }
  }

  rateLimits() {
    return {
      global: { ttlMs: 60_000, limit: 120 },
      storage: process.env.REDIS_URL ? 'redis' : 'memory',
      notes: 'Per-route overrides can be added with @Throttle() decorators.',
    };
  }

  recordRequestLog(data: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    errorMessage?: string | null;
  }) {
    return this.repos.apiRequestLogs.create(data).catch(() => undefined);
  }
}
