import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  GenerateArticleDraftInput,
  GenerateArticleImageInput,
  ImproveArticleInput,
  SuggestRelatedArticlesInput,
} from '@varnarc/validation';
import {
  getLlmConfig,
  isLlmConfigured,
  llmChatCompletion,
  llmImageGeneration,
  parseJsonResponse,
} from '../../ai/llm.client';
import { AiService } from '../../ai/ai.service';
import { MediaService } from '../../media/media.service';

const VERTICAL_GUIDANCE: Record<string, string> = {
  finance: 'personal finance, loans, tax, insurance, and investments in India',
  construction: 'home construction, materials, interiors, and renovation in India',
  automobile: 'cars, maintenance, buying guides, and ownership costs in India',
  solar: 'rooftop solar, inverters, subsidies, and energy savings in India',
  general: 'practical how-to guides for Indian readers',
};

type DraftResponse = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo?: {
    title?: string;
    description?: string;
    metaKeywords?: string;
  };
  suggestedRelatedTopics?: string[];
};

@Injectable()
export class ArticleAiService {
  constructor(
    private readonly aiOps: AiService,
    private readonly media: MediaService,
  ) {}

  configured() {
    try {
      const cfg = getLlmConfig();
      return {
        configured: cfg.configured,
        provider: cfg.provider,
        imageModel: cfg.imageModel,
        imageGeneration: cfg.configured,
      };
    } catch {
      return {
        configured: false,
        provider: 'openai-compatible',
        imageModel: 'gpt-image-1',
        imageGeneration: false,
      };
    }
  }

  private async withJobLog<T>(
    userId: string | null,
    feature: string,
    input: unknown,
    fn: () => Promise<T>,
  ): Promise<T> {
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

  generateDraft(input: GenerateArticleDraftInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'article.generate-draft', input, () =>
      this.runGenerateDraft(input),
    );
  }

  improve(input: ImproveArticleInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, `article.improve.${input.mode}`, input, () =>
      this.runImprove(input),
    );
  }

  suggestRelated(input: SuggestRelatedArticlesInput, userId?: string | null) {
    return this.withJobLog(userId ?? null, 'article.suggest-related', input, () =>
      this.runSuggestRelated(input),
    );
  }

  generateImage(input: GenerateArticleImageInput, userId: string) {
    return this.withJobLog(
      userId,
      'article.generate-image',
      { title: input.title, vertical: input.vertical },
      () => this.runGenerateImage(input, userId),
    );
  }

  private buildEditorialImagePrompt(input: GenerateArticleImageInput): string {
    const vertical = VERTICAL_GUIDANCE[input.vertical] ?? VERTICAL_GUIDANCE.general;
    const topic = input.title.trim();
    const excerpt = input.excerpt?.trim();
    const styleHint = input.styleHint?.trim();

    return [
      'Create a premium financial editorial illustration for Varnarc, a financial education website.',
      `Article topic: ${topic}.`,
      excerpt ? `Context: ${excerpt}` : '',
      `Vertical context: ${vertical}.`,
      styleHint ? `Additional style hint: ${styleHint}` : '',
      '',
      'Visual style:',
      '- modern finance editorial illustration',
      '- professional, minimal, credible',
      '- clean geometric forms with subtle depth',
      '- navy-led palette (#0b1f3a) with restrained orange accents (#f97316)',
      '- soft neutral background',
      '- suitable for a financial education website',
      '',
      'Represent the topic conceptually rather than literally showing money.',
      'Composition must remain clear at article-card thumbnail size.',
      'Aspect ratio feel: wide 16:9 landscape framing.',
      '',
      'Avoid: bank logos, company trademarks, readable UI text, currency-note replicas,',
      'generic smiling stock-photo people, piles of cash, exaggerated coins, watermarks.',
      'No text inside the image.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async runGenerateImage(input: GenerateArticleImageInput, userId: string) {
    if (!isLlmConfigured()) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'AI is not configured. Set OPENAI_API_KEY to generate article images.',
        },
      });
    }

    const prompt = this.buildEditorialImagePrompt(input);
    const generated = await llmImageGeneration(prompt, { size: '1536x1024' });

    const ext =
      generated.mimeType === 'image/jpeg'
        ? 'jpg'
        : generated.mimeType === 'image/webp'
          ? 'webp'
          : 'png';
    const safeSlug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'article';

    const file = {
      fieldname: 'file',
      originalname: `ai-${safeSlug}-${Date.now()}.${ext}`,
      encoding: '7bit',
      mimetype: generated.mimeType,
      size: generated.buffer.length,
      buffer: generated.buffer,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as never,
    } as Express.Multer.File;

    const asset = await this.media.uploadFile(file, userId, {
      alt: `AI editorial illustration for: ${input.title.trim().slice(0, 120)}`,
    });

    return {
      id: asset.id,
      url: asset.secureUrl || asset.url,
      secureUrl: asset.secureUrl || asset.url,
      alt: asset.alt,
      publicId: asset.publicId,
      prompt,
      revisedPrompt: generated.revisedPrompt ?? null,
    };
  }

  private async runGenerateDraft(input: GenerateArticleDraftInput) {
    const vertical = VERTICAL_GUIDANCE[input.vertical] ?? VERTICAL_GUIDANCE.general;
    const system = [
      'You are an expert SEO content writer for Varnarc, a finance and home tools portal for India.',
      'Write factual, helpful articles. Do not invent specific interest rates, prices, or legal claims.',
      'Use markdown with ## headings, bullet lists, and short paragraphs.',
      'Return valid JSON only.',
    ].join(' ');

    const user = [
      `Topic: ${input.topic}`,
      `Vertical: ${input.vertical} (${vertical})`,
      `Tone: ${input.tone}`,
      `Audience: ${input.audience}`,
      input.categoryHint ? `Category hint: ${input.categoryHint}` : '',
      '',
      'Return JSON with keys:',
      '- title (string, compelling, under 80 chars)',
      '- slug (kebab-case, lowercase, no special chars)',
      '- excerpt (string, 1-2 sentences, under 200 chars)',
      '- content (markdown body, 600-1200 words, include Overview, key sections, and Bottom line)',
      '- seo: { title, description (under 155 chars), metaKeywords (comma-separated) }',
      '- suggestedRelatedTopics: array of 3-5 follow-up article ideas',
    ]
      .filter(Boolean)
      .join('\n');

    const raw = await llmChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { json: true, maxTokens: 5000 },
    );

    const parsed = parseJsonResponse<DraftResponse>(raw);
    return this.normalizeDraft(parsed);
  }

  private async runImprove(input: ImproveArticleInput) {
    const modeInstructions: Record<ImproveArticleInput['mode'], string> = {
      expand:
        'Expand the article with more practical detail, examples, and subsections. Return full improved content.',
      simplify: 'Simplify language for beginners. Shorten sentences. Return full improved content.',
      seo: 'Return only SEO metadata — do not rewrite the full article body.',
      excerpt: 'Return only a compelling excerpt/summary — do not rewrite the full article body.',
    };

    const system = [
      'You are an editor for Varnarc India-focused content.',
      modeInstructions[input.mode],
      'Return valid JSON only.',
    ].join(' ');

    const user = [
      `Title: ${input.title}`,
      '',
      'Content:',
      input.content.slice(0, 12000),
      '',
      input.mode === 'seo'
        ? 'Return JSON: { seo: { title, description, metaKeywords } }'
        : input.mode === 'excerpt'
          ? 'Return JSON: { excerpt: string }'
          : 'Return JSON: { content: string (full markdown), excerpt?: string }',
    ].join('\n');

    const raw = await llmChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { json: true, maxTokens: 5000 },
    );

    return parseJsonResponse<{
      content?: string;
      excerpt?: string;
      seo?: { title?: string; description?: string; metaKeywords?: string };
    }>(raw);
  }

  private async runSuggestRelated(input: SuggestRelatedArticlesInput) {
    const system =
      'Suggest related article topics for internal linking on a finance/home portal. Return valid JSON only.';
    const user = [
      `Title: ${input.title}`,
      'Content excerpt:',
      input.content.slice(0, 4000),
      '',
      `Return JSON: { topics: string[] } with exactly ${input.limit} concise article titles.`,
    ].join('\n');

    const raw = await llmChatCompletion(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { json: true, maxTokens: 800 },
    );

    const parsed = parseJsonResponse<{ topics?: string[] }>(raw);
    return { topics: (parsed.topics ?? []).slice(0, input.limit) };
  }

  private normalizeDraft(parsed: DraftResponse) {
    if (!parsed.title?.trim() || !parsed.content?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_INVALID_RESPONSE', message: 'AI response missing title or content.' },
      });
    }

    const slug =
      parsed.slug?.trim() ||
      parsed.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return {
      title: parsed.title.trim(),
      slug,
      excerpt: parsed.excerpt?.trim() || null,
      content: parsed.content.trim(),
      seo: parsed.seo ?? null,
      suggestedRelatedTopics: parsed.suggestedRelatedTopics ?? [],
    };
  }
}
