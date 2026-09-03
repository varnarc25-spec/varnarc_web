import { createHash } from 'crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Repositories } from '@varnarc/database';
import {
  contactDestinationForTopic,
  type CreateContactMessageInput,
  type ContactMessageListQuery,
  type UpdateContactMessageStatusInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { SettingsService } from '../settings/settings.service';

const MIN_FORM_MS = 1800;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly settings: SettingsService,
  ) {}

  private hashIp(ip?: string | null) {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex').slice(0, 32);
  }

  private topicLabel(topic: string) {
    return topic
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  private sanitizeHeader(value: string) {
    return value
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 160);
  }

  async resolveDeliveryConfig(topic: string) {
    const contact = await this.settings.getContactRaw();
    const destination = contactDestinationForTopic(topic);
    const byDestination: Record<string, string | null | undefined> = {
      general: contact.toGeneral,
      editorial: contact.toEditorial,
      business: contact.toBusiness,
      support: contact.toSupport,
      privacy: contact.toPrivacy,
    };

    const to =
      byDestination[destination]?.trim() ||
      contact.toGeneral?.trim() ||
      process.env.CONTACT_TO_EMAIL?.trim() ||
      process.env.CONTACT_EMAIL?.trim() ||
      process.env.RESEND_TO_EMAIL?.trim() ||
      null;

    const from =
      contact.fromEmail?.trim() ||
      process.env.CONTACT_FROM_EMAIL?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'Varnarc <onboarding@resend.dev>';

    const apiKey = process.env.RESEND_API_KEY?.trim() || contact.resendApiKey?.trim() || null;
    const provider = contact.emailProvider ?? 'resend';

    return {
      emailEnabled: contact.emailEnabled !== false,
      provider,
      destination,
      to,
      from,
      apiKey,
      smtp: {
        host: process.env.SMTP_HOST?.trim() || contact.smtpHost?.trim() || null,
        port: Number(process.env.SMTP_PORT || contact.smtpPort || 587),
        secure:
          process.env.SMTP_SECURE !== undefined
            ? process.env.SMTP_SECURE === 'true'
            : (contact.smtpSecure ?? false),
        username: process.env.SMTP_USERNAME?.trim() || contact.smtpUsername?.trim() || null,
        password: process.env.SMTP_PASSWORD?.trim() || contact.smtpPassword?.trim() || null,
      },
    };
  }

  async submit(
    input: CreateContactMessageInput,
    meta?: { ip?: string | null; userAgent?: string | null },
  ) {
    const destination = contactDestinationForTopic(input.topic);
    const isSpam =
      Boolean(input.faxNumber?.trim()) ||
      (typeof input.formStartedAt === 'number' &&
        Number.isFinite(input.formStartedAt) &&
        Date.now() - input.formStartedAt < MIN_FORM_MS);

    const row = await this.repos.contactMessages.create({
      topic: input.topic,
      destination,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      company: input.company ?? null,
      orgWebsite: input.orgWebsite ?? null,
      pageUrl: input.pageUrl ?? null,
      metadata: {
        correctionIssue: input.correctionIssue ?? null,
        supportIssue: input.supportIssue ?? null,
        supportFeature: input.supportFeature ?? null,
      },
      status: isSpam ? 'SPAM' : 'NEW',
      ipHash: this.hashIp(meta?.ip),
      userAgent: meta?.userAgent?.slice(0, 400) ?? null,
    });

    if (isSpam) {
      return { ok: true, id: row.id, stored: true, emailed: false };
    }

    const delivery = await this.resolveDeliveryConfig(input.topic);
    if (!delivery.emailEnabled) {
      return { ok: true, id: row.id, stored: true, emailed: false };
    }

    const providerConfigured =
      delivery.provider === 'smtp' ? Boolean(delivery.smtp.host) : Boolean(delivery.apiKey);
    if (!providerConfigured || !delivery.to) {
      await this.repos.contactMessages.updateStatus(row.id, {
        status: 'FAILED',
        emailError: 'Email is not configured (missing provider credentials or recipient).',
      });
      return {
        ok: false,
        id: row.id,
        stored: true,
        emailed: false,
        error: 'undeliverable',
        message: 'Please try again. If the problem continues, use another available contact route.',
      };
    }

    try {
      const message = {
        from: delivery.from,
        to: delivery.to,
        replyTo: input.email,
        subject: this.sanitizeHeader(
          `[Varnarc contact] ${this.topicLabel(input.topic)}: ${input.subject}`,
        ),
        html: this.buildHtml(input, destination),
        text: this.buildText(input),
      };
      const sent =
        delivery.provider === 'smtp'
          ? await this.sendViaSmtp({ ...message, ...delivery.smtp })
          : await this.sendViaResend({ ...message, apiKey: delivery.apiKey! });

      if (!sent.ok) {
        await this.repos.contactMessages.updateStatus(row.id, {
          status: 'FAILED',
          emailError: sent.error || 'Resend delivery failed',
        });
        return {
          ok: false,
          id: row.id,
          stored: true,
          emailed: false,
          error: 'send_failed',
          message:
            'Please try again. If the problem continues, use another available contact route.',
        };
      }

      await this.repos.contactMessages.updateStatus(row.id, {
        status: 'SENT',
        emailError: null,
        sentAt: new Date(),
      });
      return { ok: true, id: row.id, stored: true, emailed: true };
    } catch (error) {
      this.logger.error('Contact email send failed', error instanceof Error ? error.stack : error);
      await this.repos.contactMessages.updateStatus(row.id, {
        status: 'FAILED',
        emailError: error instanceof Error ? error.message : 'Unknown send error',
      });
      return {
        ok: false,
        id: row.id,
        stored: true,
        emailed: false,
        error: 'send_failed',
        message: 'Please try again. If the problem continues, use another available contact route.',
      };
    }
  }

  private buildHtml(input: CreateContactMessageInput, destination: string) {
    const rows: Array<[string, string | null | undefined]> = [
      ['Topic', this.topicLabel(input.topic)],
      ['Destination', destination],
      ['Name', input.name],
      ['Email', input.email],
      ['Subject', input.subject],
      ['Company', input.company],
      ['Organisation website', input.orgWebsite],
      ['Page URL', input.pageUrl],
      ['Correction issue', input.correctionIssue],
      ['Support issue', input.supportIssue],
      ['Page / feature', input.supportFeature],
    ];
    const meta = rows
      .filter(([, value]) => Boolean(value))
      .map(
        ([label, value]) =>
          `<p><strong>${this.escapeHtml(label)}:</strong> ${this.escapeHtml(value!)}</p>`,
      )
      .join('\n');
    return `${meta}<p><strong>Message:</strong></p><p>${this.escapeHtml(input.message).replaceAll('\n', '<br />')}</p>`;
  }

  private buildText(input: CreateContactMessageInput) {
    return [
      `Topic: ${this.topicLabel(input.topic)}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Subject: ${input.subject}`,
      input.company ? `Company: ${input.company}` : null,
      input.orgWebsite ? `Website: ${input.orgWebsite}` : null,
      input.pageUrl ? `Page URL: ${input.pageUrl}` : null,
      '',
      input.message,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async sendViaResend(input: {
    apiKey: string;
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
  }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false as const, error: body.slice(0, 500) || `HTTP ${res.status}` };
    }
    return { ok: true as const };
  }

  private async sendViaSmtp(input: {
    host: string | null;
    port: number;
    secure: boolean;
    username: string | null;
    password: string | null;
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    html: string;
    text: string;
  }) {
    if (!input.host) return { ok: false as const, error: 'SMTP host is missing' };
    const transporter = nodemailer.createTransport({
      host: input.host,
      port: input.port,
      secure: input.secure,
      auth:
        input.username && input.password
          ? { user: input.username, pass: input.password }
          : undefined,
    });
    try {
      await transporter.sendMail({
        from: input.from,
        to: input.to,
        replyTo: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      return { ok: true as const, error: null };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message.slice(0, 500) : 'SMTP delivery failed',
      };
    }
  }

  list(query: ContactMessageListQuery) {
    return this.repos.contactMessages.list({
      cursor: query.cursor,
      limit: query.limit,
      direction: query.direction,
      status: query.status,
      topic: query.topic,
      search: query.search,
    });
  }

  async getById(id: string) {
    const row = await this.repos.contactMessages.findById(id);
    if (!row) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contact message not found.' },
      });
    }
    return row;
  }

  async updateStatus(id: string, input: UpdateContactMessageStatusInput) {
    await this.getById(id);
    return this.repos.contactMessages.updateStatus(id, { status: input.status });
  }
}
