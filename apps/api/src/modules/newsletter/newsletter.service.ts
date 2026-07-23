import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CreateNewsletterCampaignInput,
  CreateNewsletterTemplateInput,
  NewsletterCampaignListQuery,
  NewsletterSubscriberListQuery,
  NewsletterSubscribeInput,
  NewsletterTemplateListQuery,
  NewsletterUnsubscribeInput,
  SendNewsletterCampaignInput,
  UpdateNewsletterCampaignInput,
  UpdateNewsletterTemplateInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { NewsletterEmailService } from './newsletter-email.service';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

@Injectable()
export class NewsletterService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly email: NewsletterEmailService,
  ) {}

  private async audit(
    action: string,
    entityId: string | null,
    actorId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    await this.repos.auditLogs
      .create({
        action,
        entity: 'newsletter',
        entityId,
        userId: actorId ?? null,
        newValue: metadata as never,
      })
      .catch(() => undefined);
  }

  async status() {
    const [summary, templateCount, campaignStats] = await Promise.all([
      this.repos.newsletterSubscribers.summary(),
      this.repos.newsletterTemplates.count(),
      this.repos.newsletterCampaigns.countByStatus(),
    ]);
    return {
      module: 'newsletter',
      status: 'ready',
      deliveryMode: this.email.deliveryMode,
      ...summary,
      templateCount,
      campaigns: Object.fromEntries(campaignStats.map((row) => [row.status, row._count._all])),
    };
  }

  async subscribe(input: NewsletterSubscribeInput, userId?: string | null) {
    const email = normalizeEmail(input.email);
    const existing = await this.repos.newsletterSubscribers.findByEmailIncludingDeleted(email);
    const now = new Date();

    let subscriber;
    if (existing) {
      subscriber = await this.repos.newsletterSubscribers.update(existing.id, {
        status: 'subscribed',
        subscribedAt: now,
        unsubscribedAt: null,
        deletedAt: null,
      });
    } else {
      subscriber = await this.repos.newsletterSubscribers.create({
        email,
        status: 'subscribed',
        subscribedAt: now,
      });
    }

    if (userId) {
      await this.repos.userPreferences
        .upsert(userId, { newsletterOptIn: true })
        .catch(() => undefined);
    }

    return {
      id: subscriber.id,
      email: subscriber.email,
      status: subscriber.status,
      subscribedAt: subscriber.subscribedAt,
      alreadySubscribed: existing?.status === 'subscribed' && !existing.deletedAt,
      source: input.source ?? null,
    };
  }

  async unsubscribe(input: NewsletterUnsubscribeInput, userId?: string | null) {
    const email = normalizeEmail(input.email);
    const existing = await this.repos.newsletterSubscribers.findByEmail(email);

    if (!existing) {
      return {
        email,
        status: 'unsubscribed' as const,
        found: false,
      };
    }

    const subscriber = await this.repos.newsletterSubscribers.update(existing.id, {
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
    });

    if (userId) {
      await this.repos.userPreferences
        .upsert(userId, { newsletterOptIn: false })
        .catch(() => undefined);
    }

    return {
      id: subscriber.id,
      email: subscriber.email,
      status: subscriber.status,
      unsubscribedAt: subscriber.unsubscribedAt,
      found: true,
    };
  }

  async listSubscribers(query: NewsletterSubscriberListQuery) {
    return this.repos.newsletterSubscribers.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status,
      search: query.search,
    });
  }

  async dashboard() {
    const [summary, templateCount, campaignStats] = await Promise.all([
      this.repos.newsletterSubscribers.summary(),
      this.repos.newsletterTemplates.count(),
      this.repos.newsletterCampaigns.countByStatus(),
    ]);
    return {
      ...summary,
      templateCount,
      campaigns: Object.fromEntries(campaignStats.map((row) => [row.status, row._count._all])),
      deliveryMode: this.email.deliveryMode,
    };
  }

  // --- Templates ---

  listTemplates(query: NewsletterTemplateListQuery) {
    return this.repos.newsletterTemplates.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      search: query.search,
    });
  }

  async getTemplate(id: string) {
    const row = await this.repos.newsletterTemplates.findById(id);
    if (!row) throw new NotFoundException('Template not found');
    return row;
  }

  async createTemplate(input: CreateNewsletterTemplateInput, actorId?: string | null) {
    const existing = await this.repos.newsletterTemplates.findBySlug(input.slug);
    if (existing) throw new BadRequestException('Template slug already exists');
    const row = await this.repos.newsletterTemplates.create({
      ...input,
      createdBy: actorId ?? undefined,
      updatedBy: actorId ?? undefined,
    });
    await this.audit('newsletter.template.create', row.id, actorId, { slug: row.slug });
    return row;
  }

  async updateTemplate(id: string, input: UpdateNewsletterTemplateInput, actorId?: string | null) {
    const existing = await this.getTemplate(id);
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.newsletterTemplates.findBySlug(input.slug);
      if (clash) throw new BadRequestException('Template slug already exists');
    }
    const row = await this.repos.newsletterTemplates.update(id, {
      ...input,
      updatedBy: actorId ?? undefined,
    });
    await this.audit('newsletter.template.update', id, actorId);
    return row;
  }

  async deleteTemplate(id: string, actorId?: string | null) {
    await this.getTemplate(id);
    await this.repos.newsletterTemplates.softDelete(id, actorId);
    await this.audit('newsletter.template.delete', id, actorId);
    return { ok: true };
  }

  // --- Campaigns ---

  listCampaigns(query: NewsletterCampaignListQuery) {
    return this.repos.newsletterCampaigns.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status,
    });
  }

  async getCampaign(id: string) {
    const row = await this.repos.newsletterCampaigns.findById(id);
    if (!row) throw new NotFoundException('Campaign not found');
    return row;
  }

  async createCampaign(input: CreateNewsletterCampaignInput, actorId?: string | null) {
    const existing = await this.repos.newsletterCampaigns.findBySlug(input.slug);
    if (existing) throw new BadRequestException('Campaign slug already exists');
    if (input.templateId) {
      const template = await this.repos.newsletterTemplates.findById(input.templateId);
      if (!template) throw new NotFoundException('Template not found');
    }

    const status = input.scheduledAt ? 'SCHEDULED' : 'DRAFT';
    const row = await this.repos.newsletterCampaigns.create({
      name: input.name,
      slug: input.slug,
      status,
      scheduledAt: input.scheduledAt ?? undefined,
      createdBy: actorId ?? undefined,
      updatedBy: actorId ?? undefined,
      ...(input.templateId ? { template: { connect: { id: input.templateId } } } : {}),
    });
    await this.audit('newsletter.campaign.create', row.id, actorId, { slug: row.slug });
    return row;
  }

  async updateCampaign(id: string, input: UpdateNewsletterCampaignInput, actorId?: string | null) {
    const existing = await this.getCampaign(id);
    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException('Published campaigns cannot be edited');
    }
    if (input.slug && input.slug !== existing.slug) {
      const clash = await this.repos.newsletterCampaigns.findBySlug(input.slug);
      if (clash) throw new BadRequestException('Campaign slug already exists');
    }
    if (input.templateId) {
      const template = await this.repos.newsletterTemplates.findById(input.templateId);
      if (!template) throw new NotFoundException('Template not found');
    }

    const row = await this.repos.newsletterCampaigns.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.templateId !== undefined
        ? input.templateId
          ? { template: { connect: { id: input.templateId } } }
          : { template: { disconnect: true } }
        : {}),
      ...(input.scheduledAt !== undefined
        ? {
            scheduledAt: input.scheduledAt,
            status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          }
        : {}),
      updatedBy: actorId ?? undefined,
    });
    await this.audit('newsletter.campaign.update', id, actorId);
    return row;
  }

  async deleteCampaign(id: string, actorId?: string | null) {
    const existing = await this.getCampaign(id);
    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException('Published campaigns cannot be deleted');
    }
    await this.repos.newsletterCampaigns.softDelete(id, actorId);
    await this.audit('newsletter.campaign.delete', id, actorId);
    return { ok: true };
  }

  async sendCampaign(id: string, input: SendNewsletterCampaignInput, actorId?: string | null) {
    const campaign = await this.getCampaign(id);
    if (campaign.status === 'PUBLISHED') {
      throw new BadRequestException('Campaign was already sent');
    }
    if (!campaign.template) {
      throw new BadRequestException('Campaign requires a template before sending');
    }

    const recipients = await this.repos.newsletterSubscribers.listSubscribedEmails();
    if (!recipients.length) {
      throw new BadRequestException('No subscribed recipients');
    }

    const result = await this.email.sendBatch(
      recipients,
      campaign.template.subject,
      campaign.template.bodyHtml,
      { dryRun: input.dryRun },
    );

    if (!input.dryRun) {
      await this.repos.newsletterCampaigns.markSent(id, actorId);
    }

    await this.audit('newsletter.campaign.send', id, actorId, {
      recipientCount: result.recipientCount,
      sent: result.sent,
      failed: result.failed,
      deliveryMode: result.deliveryMode,
      dryRun: input.dryRun,
    });

    return {
      campaignId: id,
      ...result,
    };
  }

  async processScheduled(actorId?: string | null) {
    const due = await this.repos.newsletterCampaigns.listDueScheduled();
    const results = [];
    for (const campaign of due) {
      try {
        const result = await this.sendCampaign(campaign.id, { dryRun: false }, actorId);
        results.push({ ok: true, ...result });
      } catch (error) {
        results.push({
          campaignId: campaign.id,
          ok: false,
          error: error instanceof Error ? error.message : 'Send failed',
        });
      }
    }
    return { processed: results.length, results };
  }
}
