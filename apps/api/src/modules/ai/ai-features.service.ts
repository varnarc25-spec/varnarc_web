import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type {
  CalculatorAssistInput,
  EditorialEnrichInput,
  GenerateImageMetadataInput,
  GenerateAiSeoInput,
  SummarizeBatchInput,
  SummarizeContentInput,
} from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { parseJsonResponse } from './llm.client';
import { LlmProviderService } from './llm-provider.service';
import { AiService } from './ai.service';

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class AiFeaturesService {
  constructor(
    private readonly aiOps: AiService,
    private readonly llm: LlmProviderService,
    @Inject(REPOS) private readonly repos: Repositories,
  ) {}

  async status() {
    const dailyLimit = Number(process.env.AI_DAILY_JOB_LIMIT ?? 0) || null;
    return {
      configured: await this.llm.isConfigured(),
      features: [
        'summarize',
        'summarize-batch',
        'seo',
        'image-metadata',
        'calculator-assist',
        'editorial-enrich',
      ],
      dailyLimit,
    };
  }

  private async ensureConfigured() {
    if (!(await this.llm.isConfigured())) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'Configure an enabled AI provider and its API key environment variable.',
        },
      });
    }
  }

  private async ensureQuota() {
    const limit = Number(process.env.AI_DAILY_JOB_LIMIT ?? 0);
    if (!limit) return;
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const today = await this.repos.aiJobs.countSince(dayStart);
    if (today >= limit) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AI_QUOTA_EXCEEDED',
          message: `Daily AI job limit reached (${limit}). Try again tomorrow or raise AI_DAILY_JOB_LIMIT.`,
        },
      });
    }
  }

  private async withJobLog<T>(
    userId: string | null,
    feature: string,
    input: unknown,
    fn: () => Promise<T>,
  ): Promise<T> {
    await this.ensureConfigured();
    await this.ensureQuota();
    try {
      const result = await fn();
      void this.aiOps.logFeatureJob(userId, feature, input, result).catch(() => undefined);
      return result;
    } catch (err) {
      void this.aiOps
        .logFeatureJob(
          userId,
          feature,
          input,
          null,
          err instanceof Error ? err.message : 'AI failed',
        )
        .catch(() => undefined);
      throw err;
    }
  }

  summarize(input: SummarizeContentInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'ai.summarize', input, () => this.runSummarize(input));
  }

  summarizeBatch(input: SummarizeBatchInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'ai.summarize-batch', input, async () => {
      const results = [];
      for (const item of input.items) {
        const summary = await this.runSummarize({
          text: item.text,
          style: input.style,
          maxSentences: input.maxSentences,
        });
        results.push({
          id: item.id ?? null,
          label: item.label ?? null,
          ...summary,
        });
      }
      return { processed: results.length, results };
    });
  }

  async enrichDraftArticles(input: EditorialEnrichInput, userId: string) {
    return this.withJobLog(userId, 'ai.editorial-enrich', input, async () => {
      const page = await this.repos.articles.list({
        status: 'DRAFT',
        limit: input.limit,
      });
      const enriched = [];

      for (const row of page.items ?? []) {
        const article = await this.repos.articles.findById(row.id);
        if (!article) continue;

        const plain = stripHtml(article.content || '');
        if (plain.length < 40) {
          enriched.push({
            id: article.id,
            title: article.title,
            skipped: true,
            reason: 'content_too_short',
          });
          continue;
        }

        const existingSeo = await this.repos.seo.findByEntity('article', article.id);
        const summary = await this.runSummarize({ text: plain, style: 'brief', maxSentences: 3 });
        const seo = await this.runSeo({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          entityType: 'article',
          path: `/articles/${article.slug}`,
          locale: 'en-IN',
        });

        await this.repos.articles.update(article.id, {
          excerpt: article.excerpt || summary.summary,
          updatedBy: userId,
        });

        if (!existingSeo?.title || !existingSeo?.description) {
          await this.repos.seo.upsert('article', article.id, {
            title: existingSeo?.title || seo.title,
            description: existingSeo?.description || seo.description,
            metaKeywords: seo.metaKeywords ?? undefined,
          });
        }

        enriched.push({
          id: article.id,
          title: article.title,
          skipped: false,
          excerpt: summary.summary,
          seoTitle: seo.title,
        });
      }

      return { processed: enriched.filter((row) => !row.skipped).length, enriched };
    });
  }

  generateSeo(input: GenerateAiSeoInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'ai.seo', input, () => this.runSeo(input));
  }

  generateImageMetadata(input: GenerateImageMetadataInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'ai.image-metadata', input, () =>
      this.runImageMetadata(input),
    );
  }

  calculatorAssist(input: CalculatorAssistInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'ai.calculator-assist', input, () =>
      this.runCalculatorAssist(input),
    );
  }

  private async runSummarize(input: SummarizeContentInput) {
    const text = stripHtml(input.text).slice(0, 12000);
    const styleGuide =
      input.style === 'bullets'
        ? `Return JSON: { "summary": string (markdown bullet list, ${input.maxSentences} bullets max) }`
        : input.style === 'paragraph'
          ? 'Return JSON: { "summary": string (one cohesive paragraph) }'
          : `Return JSON: { "summary": string (${input.maxSentences} sentences max) }`;

    const raw = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You summarize content for Varnarc, an India-focused finance and home tools portal. Be factual and concise. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [`Summarize this text for Indian readers:`, '', text, '', styleGuide].join('\n'),
        },
      ],
      { json: true, maxTokens: 1200 },
    );

    const parsed = parseJsonResponse<{ summary?: string }>(raw);
    if (!parsed.summary?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_INVALID_RESPONSE', message: 'Summary missing from AI response.' },
      });
    }
    return { summary: parsed.summary.trim(), style: input.style };
  }

  private async runSeo(input: GenerateAiSeoInput) {
    const body = stripHtml(input.content || input.excerpt || '').slice(0, 8000);
    const raw = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You are an SEO specialist for Varnarc India. Write click-worthy but accurate metadata. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [
            `Entity type: ${input.entityType}`,
            input.path ? `URL path: ${input.path}` : '',
            `Locale: ${input.locale}`,
            `Title: ${input.title}`,
            input.excerpt ? `Excerpt: ${input.excerpt}` : '',
            body ? `Content:\n${body}` : '',
            '',
            'Return JSON:',
            '{',
            '  "title": string (SEO title under 60 chars),',
            '  "description": string (meta description under 155 chars),',
            '  "metaKeywords": string (comma-separated),',
            '  "ogTitle": string (optional),',
            '  "ogDescription": string (optional),',
            '  "suggestions": string[] (3 actionable SEO tips)',
            '}',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      { json: true, maxTokens: 1500 },
    );

    const parsed = parseJsonResponse<{
      title?: string;
      description?: string;
      metaKeywords?: string;
      ogTitle?: string;
      ogDescription?: string;
      suggestions?: string[];
    }>(raw);

    if (!parsed.title?.trim() || !parsed.description?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_INVALID_RESPONSE', message: 'SEO title or description missing.' },
      });
    }

    return {
      title: parsed.title.trim(),
      description: parsed.description.trim(),
      metaKeywords: parsed.metaKeywords?.trim() || null,
      ogTitle: parsed.ogTitle?.trim() || parsed.title.trim(),
      ogDescription: parsed.ogDescription?.trim() || parsed.description.trim(),
      suggestions: parsed.suggestions ?? [],
    };
  }

  private async runImageMetadata(input: GenerateImageMetadataInput) {
    const context = stripHtml(input.content || '').slice(0, 8000);
    const raw = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You write accessible image metadata for Varnarc, an India-focused finance and home tools portal. Base metadata only on the supplied context. Do not keyword-stuff or invent visual details. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [
            `Entity type: ${input.entityType}`,
            `Locale: ${input.locale}`,
            `Page title: ${input.title}`,
            input.imageUrl ? `Image URL: ${input.imageUrl}` : '',
            context ? `Page context:\n${context}` : '',
            '',
            'Return JSON:',
            '{',
            '  "alt": string (concise accessible image description, under 150 characters),',
            '  "title": string (editorial image title, under 100 characters),',
            '  "description": string (one factual sentence describing the image purpose, under 300 characters)',
            '}',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      { json: true, maxTokens: 700 },
    );

    const parsed = parseJsonResponse<{ alt?: string; title?: string; description?: string }>(raw);
    if (!parsed.alt?.trim() || !parsed.title?.trim() || !parsed.description?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_INVALID_RESPONSE', message: 'Image metadata is incomplete.' },
      });
    }

    return {
      alt: parsed.alt.trim().slice(0, 300),
      title: parsed.title.trim().slice(0, 200),
      description: parsed.description.trim().slice(0, 2000),
    };
  }

  private async runCalculatorAssist(input: CalculatorAssistInput) {
    const history = (input.messages ?? []).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const raw = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You explain calculator results in plain language for Indian users. Support follow-up questions using prior context. Do not invent rates or regulations. Return valid JSON only.',
        },
        ...history,
        {
          role: 'user',
          content: [
            `Calculator: ${input.calculatorName}`,
            input.calculatorSlug ? `Slug: ${input.calculatorSlug}` : '',
            `Inputs: ${JSON.stringify(input.inputs)}`,
            `Outputs: ${JSON.stringify(input.outputs)}`,
            input.question ? `User question: ${input.question}` : 'Explain these results.',
            '',
            'Return JSON:',
            '{',
            '  "summary": string (2-4 sentences answering the user),',
            '  "insights": string[] (2-4 practical insights),',
            '  "nextSteps": string[] (2-3 suggested next actions)',
            '}',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      { json: true, maxTokens: 1500 },
    );

    const parsed = parseJsonResponse<{
      summary?: string;
      insights?: string[];
      nextSteps?: string[];
    }>(raw);

    if (!parsed.summary?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_INVALID_RESPONSE', message: 'Calculator explanation missing.' },
      });
    }

    return {
      summary: parsed.summary.trim(),
      insights: parsed.insights ?? [],
      nextSteps: parsed.nextSteps ?? [],
    };
  }
}
