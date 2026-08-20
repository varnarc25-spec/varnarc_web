import { Injectable, Logger } from '@nestjs/common';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type SendResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

export type NewsletterStatusChange = 'subscribed' | 'unsubscribed';

function renderNewsletterHtml(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

@Injectable()
export class NewsletterEmailService {
  private readonly logger = new Logger(NewsletterEmailService.name);

  get deliveryMode(): 'resend' | 'stub' {
    return process.env.RESEND_API_KEY?.trim() ? 'resend' : 'stub';
  }

  get fromAddress() {
    return (
      process.env.NEWSLETTER_FROM_EMAIL?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      'Varnarc <onboarding@resend.dev>'
    );
  }

  get publicWebUrl() {
    return process.env.PUBLIC_WEB_URL?.trim() || 'http://localhost:3000';
  }

  get adminNotifyEmail() {
    return (
      process.env.NEWSLETTER_ADMIN_EMAIL?.trim() ||
      process.env.CONTACT_TO_EMAIL?.trim() ||
      process.env.CONTACT_EMAIL?.trim() ||
      process.env.RESEND_TO_EMAIL?.trim() ||
      null
    );
  }

  renderTemplate(bodyHtml: string, email: string) {
    const unsubscribeUrl = `${this.publicWebUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    return renderNewsletterHtml(bodyHtml, {
      email,
      unsubscribeUrl,
      siteUrl: this.publicWebUrl,
      year: String(new Date().getFullYear()),
    });
  }

  async sendOne(input: SendEmailInput): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      this.logger.debug(`[stub] newsletter to ${input.to}: ${input.subject}`);
      return { ok: true, id: `stub-${Date.now()}` };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [input.to],
          subject: input.subject,
          html: input.html,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) {
        return { ok: false, error: json.message || `Resend error (${res.status})` };
      }
      return { ok: true, id: json.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed';
      return { ok: false, error: message };
    }
  }

  async sendBatch(
    recipients: Array<{ email: string }>,
    subject: string,
    bodyHtml: string,
    options?: { dryRun?: boolean },
  ) {
    if (options?.dryRun) {
      return {
        deliveryMode: this.deliveryMode,
        recipientCount: recipients.length,
        sent: recipients.length,
        failed: 0,
        failures: [] as Array<{ email: string; error: string }>,
        dryRun: true,
      };
    }

    let sent = 0;
    let failed = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const recipient of recipients) {
      const html = this.renderTemplate(bodyHtml, recipient.email);
      const result = await this.sendOne({
        to: recipient.email,
        subject,
        html,
      });
      if (result.ok) {
        sent += 1;
      } else {
        failed += 1;
        failures.push({ email: recipient.email, error: result.error || 'Unknown error' });
      }
    }

    return {
      deliveryMode: this.deliveryMode,
      recipientCount: recipients.length,
      sent,
      failed,
      failures,
      dryRun: false,
    };
  }

  async notifyStatusChange(input: {
    email: string;
    status: NewsletterStatusChange;
    source?: string | null;
    reason?: string | null;
    triggeredBy?: 'user' | 'admin';
  }) {
    const unsubscribeUrl = `${this.publicWebUrl}/newsletter/unsubscribe?email=${encodeURIComponent(input.email)}`;
    const manageUrl = `${this.publicWebUrl}/newsletter`;
    const statusLabel = input.status === 'subscribed' ? 'subscribed' : 'unsubscribed';
    const safeEmail = escapeHtml(input.email);
    const safeSource = input.source ? escapeHtml(input.source) : null;
    const safeReason = input.reason ? escapeHtml(input.reason) : null;

    const userSubject =
      input.status === 'subscribed'
        ? 'You are subscribed to the Varnarc newsletter'
        : 'You have been unsubscribed from the Varnarc newsletter';

    const userHtml =
      input.status === 'subscribed'
        ? `<p>Hi,</p>
<p>Your email <strong>${safeEmail}</strong> is now subscribed to Varnarc product updates and guides.</p>
<p><a href="${manageUrl}">Manage preferences</a> · <a href="${unsubscribeUrl}">Unsubscribe</a></p>
<p>— Varnarc</p>`
        : `<p>Hi,</p>
<p>Your email <strong>${safeEmail}</strong> has been unsubscribed from the Varnarc newsletter.</p>
${safeReason ? `<p>Reason: ${safeReason}</p>` : ''}
<p>You can subscribe again anytime at <a href="${manageUrl}">${this.publicWebUrl}/newsletter</a>.</p>
<p>— Varnarc</p>`;

    const userResult = await this.sendOne({
      to: input.email,
      subject: userSubject,
      html: userHtml,
    });

    let adminResult: SendResult | null = null;
    const adminTo = this.adminNotifyEmail;
    if (adminTo) {
      const adminSubject = `[Newsletter] ${statusLabel}: ${input.email}`;
      const adminHtml = `<p>Newsletter status update</p>
<ul>
  <li><strong>Email:</strong> ${safeEmail}</li>
  <li><strong>Status:</strong> ${statusLabel}</li>
  <li><strong>Triggered by:</strong> ${input.triggeredBy ?? 'user'}</li>
  ${safeSource ? `<li><strong>Source:</strong> ${safeSource}</li>` : ''}
  ${safeReason ? `<li><strong>Reason:</strong> ${safeReason}</li>` : ''}
</ul>`;
      adminResult = await this.sendOne({
        to: adminTo,
        subject: adminSubject,
        html: adminHtml,
      });
    } else {
      this.logger.debug(
        'No NEWSLETTER_ADMIN_EMAIL / CONTACT_TO_EMAIL configured; skipping admin notify',
      );
    }

    return {
      deliveryMode: this.deliveryMode,
      user: userResult,
      admin: adminResult,
    };
  }
}
