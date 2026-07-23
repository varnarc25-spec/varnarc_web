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

function renderNewsletterHtml(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
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
}
