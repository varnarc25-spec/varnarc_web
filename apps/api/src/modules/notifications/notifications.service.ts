import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  BroadcastNotificationInput,
  CreateNotificationTemplateInput,
  NotificationListQuery,
  NotificationProvidersInput,
  NotificationTemplateListQuery,
  UpdateNotificationTemplateInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';

const PROVIDERS_KEY = 'notifications.providers';

const DEFAULT_PROVIDERS: NotificationProvidersInput = {
  emailProvider: 'none',
  smtpHost: null,
  smtpPort: null,
  smtpUser: null,
  sendgridApiKeySet: false,
  sesRegion: null,
  resendApiKeySet: false,
  pushProvider: 'none',
  queueEnabled: false,
};

function renderTemplate(template: string, vars: Record<string, string> = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

function sliceCursor<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  private async audit(
    action: string,
    entityId: string | null,
    actorId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await this.repos.auditLogs
      .create({
        action,
        entity: 'notification',
        entityId,
        userId: actorId ?? null,
        newValue: metadata as never,
      })
      .catch(() => undefined);
  }

  async dashboard() {
    const summary = await this.repos.notifications.summary();
    return {
      ...summary,
      providers: await this.getProviders(),
    };
  }

  // --- User inbox ---

  async listMine(userId: string, query: NotificationListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.userNotifications.listForUser(userId, {
      unreadOnly: query.unreadOnly,
      cursor: query.cursor,
      limit,
    });
    const page = sliceCursor(rows, limit);
    return {
      items: page.items.map((row) => ({
        id: row.id,
        readAt: row.readAt,
        createdAt: row.createdAt,
        notification: row.notification,
      })),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  unreadCount(userId: string) {
    return this.repos.userNotifications.unreadCount(userId);
  }

  async markRead(userId: string, userNotificationId: string) {
    const row = await this.repos.userNotifications.findForUser(userId, userNotificationId);
    if (!row) throw new NotFoundException('Notification not found');
    await this.repos.userNotifications.markRead(userId, userNotificationId);
    return { ok: true };
  }

  async markAllRead(userId: string) {
    const result = await this.repos.userNotifications.markAllRead(userId);
    return { updated: result.count };
  }

  // --- Templates ---

  async listTemplates(query: NotificationTemplateListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.notificationTemplates.list({
      search: query.search,
      channel: query.channel,
      cursor: query.cursor,
      limit,
    });
    return sliceCursor(rows, limit);
  }

  async createTemplate(input: CreateNotificationTemplateInput, actorId?: string | null) {
    const existing = await this.repos.notificationTemplates.findBySlug(input.slug);
    if (existing) throw new BadRequestException('Template slug already exists');
    const row = await this.repos.notificationTemplates.create({
      ...input,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    });
    await this.audit('notification.template.create', row.id, actorId, { slug: row.slug });
    return row;
  }

  async updateTemplate(id: string, input: UpdateNotificationTemplateInput, actorId?: string | null) {
    const existing = await this.repos.notificationTemplates.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.notificationTemplates.findBySlug(input.slug);
      if (clash) throw new BadRequestException('Template slug already exists');
    }
    const row = await this.repos.notificationTemplates.update(id, {
      ...input,
      updatedBy: actorId ?? undefined,
    });
    await this.audit('notification.template.update', id, actorId);
    return row;
  }

  async deleteTemplate(id: string, actorId?: string | null) {
    const existing = await this.repos.notificationTemplates.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    await this.repos.notificationTemplates.softDelete(id, actorId);
    await this.audit('notification.template.delete', id, actorId);
    return { ok: true };
  }

  // --- Admin list + broadcast ---

  async listAll(query: NotificationListQuery) {
    const limit = query.limit ?? 25;
    const rows = await this.repos.notifications.list({ cursor: query.cursor, limit });
    return sliceCursor(rows, limit);
  }

  async resolveAudience(input: BroadcastNotificationInput): Promise<string[]> {
    if (input.audience === 'users') {
      if (!input.userIds?.length) throw new BadRequestException('userIds required for users audience');
      return input.userIds;
    }
    if (input.audience === 'role') {
      if (!input.roleSlug) throw new BadRequestException('roleSlug required for role audience');
      const role = await this.repos.roles.findBySlug(input.roleSlug);
      if (!role) throw new NotFoundException('Role not found');
      return this.repos.notifications.listUserIdsByRole(role.id);
    }
    return this.repos.notifications.listActiveUserIds();
  }

  async broadcast(input: BroadcastNotificationInput, actorId?: string | null) {
    let title = input.title;
    let body = input.body;
    let templateId: string | null = null;

    if (input.templateSlug) {
      const template = await this.repos.notificationTemplates.findBySlug(input.templateSlug);
      if (!template) throw new NotFoundException('Template not found');
      templateId = template.id;
      const vars = input.variables ?? {};
      title = renderTemplate(template.subject || template.name, vars) || title;
      body = renderTemplate(template.body, vars);
    }

    const userIds = await this.resolveAudience(input);
    if (!userIds.length) throw new BadRequestException('No recipients matched audience');

    const notification = await this.repos.notifications.createForUsers({
      userIds,
      channel: input.channel,
      title,
      body,
      templateId,
      metadata: (input.metadata as never) ?? { audience: input.audience },
    });

    if (!notification) throw new BadRequestException('Failed to create notification');

    await this.audit('notification.broadcast', notification.id, actorId, {
      audience: input.audience,
      recipientCount: userIds.length,
      channel: input.channel,
    });

    return { notification, recipientCount: userIds.length };
  }

  /** Internal helper for other modules */
  async sendToUsers(params: {
    userIds: string[];
    title: string;
    body: string;
    channel?: 'IN_APP' | 'EMAIL' | 'PUSH';
    templateSlug?: string;
    variables?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }) {
    let title = params.title;
    let body = params.body;
    let templateId: string | null = null;

    if (params.templateSlug) {
      const template = await this.repos.notificationTemplates.findBySlug(params.templateSlug);
      if (template) {
        templateId = template.id;
        const vars = params.variables ?? {};
        title = renderTemplate(template.subject || template.name, vars) || title;
        body = renderTemplate(template.body, vars);
      }
    }

    return this.repos.notifications.createForUsers({
      userIds: params.userIds,
      channel: params.channel ?? 'IN_APP',
      title,
      body,
      templateId,
      metadata: params.metadata as never,
    });
  }

  // --- Provider settings (stub) ---

  async getProviders(): Promise<NotificationProvidersInput> {
    const row = await this.repos.settings.findByKey(PROVIDERS_KEY);
    if (!row?.value || typeof row.value !== 'object') return DEFAULT_PROVIDERS;
    return { ...DEFAULT_PROVIDERS, ...(row.value as NotificationProvidersInput) };
  }

  async setProviders(input: NotificationProvidersInput, actorId?: string | null) {
    const sanitized = {
      ...input,
      sendgridApiKeySet: input.sendgridApiKeySet ?? false,
      resendApiKeySet: input.resendApiKeySet ?? false,
    };
    await this.repos.settings.upsert(PROVIDERS_KEY, sanitized, 'notifications', actorId);
    await this.audit('notification.providers.update', null, actorId);
    return sanitized;
  }
}
