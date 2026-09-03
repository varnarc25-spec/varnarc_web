import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Repositories } from '@varnarc/database';
import {
  aiProvidersSchema,
  type AiProvider,
  type CreateAiProviderInput,
  type UpdateAiProviderInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import {
  LlmProviderError,
  llmChatCompletion,
  llmImageGeneration,
  type LlmChatOptions,
  type LlmImageResult,
  type LlmMessage,
} from './llm.client';

const PROVIDERS_KEY = 'ai.providers';
const FAILURE_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private readonly notifiedFailures = new Map<string, number>();

  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async listProviders() {
    const providers = (await this.loadProviderSetting()) ?? [];
    return providers.map((provider) => ({
      ...provider,
      keyConfigured: Boolean(process.env[provider.apiKeyEnvVar]?.trim()),
    }));
  }

  async isConfigured(): Promise<boolean> {
    const providers = await this.loadProvidersForRequests();
    return providers.some((provider) => Boolean(process.env[provider.apiKeyEnvVar]?.trim()));
  }

  async getConfigSummary() {
    const providers = await this.loadProvidersForRequests();
    const configured = providers.filter((provider) =>
      Boolean(process.env[provider.apiKeyEnvVar]?.trim()),
    );
    const primary = configured[0] ?? providers[0];
    return {
      configured: configured.length > 0,
      provider: primary?.slug ?? 'openai-compatible',
      baseUrl: primary?.baseUrl ?? 'https://api.openai.com/v1',
      defaultModel: primary?.defaultModel ?? 'gpt-4o-mini',
      imageModel: primary?.imageModel ?? null,
      providerCount: providers.length,
    };
  }

  async createProvider(input: CreateAiProviderInput, actorId: string) {
    const providers = await this.loadStoredProviders();
    if (providers.some((provider) => provider.slug === input.slug)) {
      throw new BadRequestException(`AI provider already exists: ${input.slug}`);
    }
    const next = input.isDefault
      ? providers.map((provider) => ({ ...provider, isDefault: false }))
      : providers;
    next.push(input);
    await this.saveProviders(next, actorId);
    return input;
  }

  async updateProvider(slug: string, input: UpdateAiProviderInput, actorId: string) {
    const providers = await this.loadStoredProviders();
    const index = providers.findIndex((provider) => provider.slug === slug);
    if (index < 0) throw new NotFoundException('AI provider not found');
    if (input.isDefault) {
      providers.forEach((provider) => {
        provider.isDefault = false;
      });
    }
    const current = providers[index]!;
    providers[index] = { ...current, ...input, slug: current.slug };
    await this.saveProviders(providers, actorId);
    return providers[index];
  }

  async deleteProvider(slug: string, actorId: string) {
    const providers = await this.loadStoredProviders();
    const next = providers.filter((provider) => provider.slug !== slug);
    if (next.length === providers.length) throw new NotFoundException('AI provider not found');
    await this.saveProviders(next, actorId);
    return { ok: true };
  }

  async setDefaultProvider(slug: string, actorId: string) {
    const providers = await this.loadStoredProviders();
    if (!providers.some((provider) => provider.slug === slug)) {
      throw new NotFoundException('AI provider not found');
    }
    const next = providers.map((provider) => ({
      ...provider,
      isDefault: provider.slug === slug,
    }));
    await this.saveProviders(next, actorId);
    return next.find((provider) => provider.slug === slug)!;
  }

  async chatCompletion(messages: LlmMessage[], options: LlmChatOptions = {}): Promise<string> {
    return this.withFailover('chat', (provider, apiKey) =>
      llmChatCompletion(
        messages,
        { apiKey, baseUrl: provider.baseUrl, model: provider.defaultModel },
        options,
      ),
    );
  }

  async imageGeneration(
    prompt: string,
    options: Parameters<typeof llmImageGeneration>[2] = {},
  ): Promise<LlmImageResult> {
    return this.withFailover(
      'image',
      (provider, apiKey) =>
        llmImageGeneration(
          prompt,
          { apiKey, baseUrl: provider.baseUrl, model: provider.imageModel! },
          options,
        ),
      (provider) => Boolean(provider.imageModel),
    );
  }

  private async withFailover<T>(
    operation: 'chat' | 'image',
    request: (provider: AiProvider, apiKey: string) => Promise<T>,
    supports: (provider: AiProvider) => boolean = () => true,
  ): Promise<T> {
    const providers = (await this.loadProvidersForRequests()).filter(supports);
    const attempts = providers.flatMap((provider) => {
      const apiKey = process.env[provider.apiKeyEnvVar]?.trim();
      return apiKey ? [{ provider, apiKey }] : [];
    });
    if (!attempts.length) {
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: `No configured AI provider supports ${operation}.`,
        },
      });
    }

    let lastError: unknown;
    for (const [index, attempt] of attempts.entries()) {
      try {
        return await request(attempt.provider, attempt.apiKey);
      } catch (error) {
        lastError = error;
        const status = error instanceof LlmProviderError ? error.status : undefined;
        const message = error instanceof Error ? error.message : 'Unknown provider failure';
        void this.notifyFailure(attempt.provider, status, message, index < attempts.length - 1);
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'All AI providers failed';
    throw new ServiceUnavailableException({
      success: false,
      error: { code: 'AI_ALL_PROVIDERS_FAILED', message },
    });
  }

  private async loadStoredProviders(): Promise<AiProvider[]> {
    return (await this.loadProviderSetting()) ?? [];
  }

  private async loadProviderSetting(): Promise<AiProvider[] | null> {
    const row = await this.repos.settings.findByKey(PROVIDERS_KEY).catch(() => null);
    if (!row) return null;
    const parsed = aiProvidersSchema.safeParse(row.value);
    if (!parsed.success) {
      this.logger.error(`Invalid ${PROVIDERS_KEY} setting: ${parsed.error.message}`);
      return [];
    }
    return parsed.data;
  }

  private async loadProvidersForRequests(): Promise<AiProvider[]> {
    const providerSetting = await this.loadProviderSetting();
    const providers =
      providerSetting !== null
        ? providerSetting
        : process.env.OPENAI_API_KEY?.trim()
          ? [
              {
                slug: 'legacy-openai',
                name: 'Legacy OpenAI-compatible provider',
                baseUrl: (process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
                  /\/+$/,
                  '',
                ),
                defaultModel: process.env.AI_DEFAULT_MODEL?.trim() || 'gpt-4o-mini',
                imageModel: process.env.AI_IMAGE_MODEL?.trim() || 'gpt-image-1',
                apiKeyEnvVar: 'OPENAI_API_KEY',
                priority: 0,
                isDefault: true,
                isEnabled: true,
              },
            ]
          : [];
    return providers
      .filter((provider) => provider.isEnabled)
      .sort(
        (left, right) =>
          Number(right.isDefault) - Number(left.isDefault) || left.priority - right.priority,
      );
  }

  private saveProviders(providers: AiProvider[], actorId: string) {
    const validated = aiProvidersSchema.parse(providers);
    return this.repos.settings.upsert(PROVIDERS_KEY, validated as never, 'ai', actorId);
  }

  private async notifyFailure(
    provider: AiProvider,
    status: number | undefined,
    message: string,
    failoverRemains: boolean,
  ) {
    const key = `${provider.slug}:${status ?? 'network'}`;
    const now = Date.now();
    if ((this.notifiedFailures.get(key) ?? 0) > now) return;
    this.notifiedFailures.set(key, now + FAILURE_TTL_MS);

    const contactSetting = await this.repos.settings
      .findByKey('settings.contact')
      .catch(() => null);
    const contact = (contactSetting?.value ?? {}) as {
      emailEnabled?: boolean;
      emailProvider?: 'resend' | 'smtp';
      resendApiKey?: string;
      fromEmail?: string;
      toBusiness?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpSecure?: boolean;
      smtpUsername?: string;
      smtpPassword?: string;
    };
    if (contact.emailEnabled === false) return;
    const from = process.env.EMAIL_FROM?.trim() || contact.fromEmail?.trim();
    const recipient = contact.toBusiness?.trim() || 'business@varnarc.com';
    if (!from) return;
    const safeMessage = message.replace(/[<>]/g, '');
    const subject = `AI provider failure: ${provider.name}`;
    const html = `<p><strong>Provider:</strong> ${provider.name}</p><p><strong>Status:</strong> ${
      status ?? 'network error'
    }</p><p><strong>Message:</strong> ${safeMessage}</p><p><strong>Failover remains:</strong> ${
      failoverRemains ? 'yes' : 'no'
    }</p>`;

    if (contact.emailProvider === 'smtp') {
      const host = process.env.SMTP_HOST?.trim() || contact.smtpHost?.trim();
      if (!host) return;
      await nodemailer
        .createTransport({
          host,
          port: Number(process.env.SMTP_PORT || contact.smtpPort || 587),
          secure:
            process.env.SMTP_SECURE !== undefined
              ? process.env.SMTP_SECURE === 'true'
              : (contact.smtpSecure ?? false),
          auth: {
            user: process.env.SMTP_USERNAME?.trim() || contact.smtpUsername?.trim(),
            pass: process.env.SMTP_PASSWORD?.trim() || contact.smtpPassword?.trim(),
          },
        })
        .sendMail({ from, to: recipient, subject, html })
        .catch((error: unknown) =>
          this.logger.warn(`Failed to send AI provider SMTP alert: ${String(error)}`),
        );
      return;
    }

    const apiKey = process.env.RESEND_API_KEY?.trim() || contact.resendApiKey?.trim();
    if (!apiKey) return;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        html,
      }),
    }).catch((error: unknown) => {
      this.logger.warn(`Failed to send AI provider alert: ${String(error)}`);
      return null;
    });
    if (response && !response.ok) {
      this.logger.warn(`Resend rejected AI provider alert (${response.status})`);
    }
  }
}
