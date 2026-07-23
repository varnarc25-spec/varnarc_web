import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { Repositories } from '@varnarc/database';
import type { SearchAiQueryInput } from '@varnarc/validation';
import { searchEntityTypes } from '@varnarc/validation';
import { REPOS } from '../../database/database.module';
import { isLlmConfigured, llmChatCompletion, parseJsonResponse } from '../ai/llm.client';
import { SearchService } from './search.service';

type ParsedAiSearch = {
  keywords?: string;
  entityType?: string;
  category?: string;
  location?: string;
  sort?: string;
};

@Injectable()
export class SearchAiService {
  constructor(
    @Inject(REPOS) private readonly repos: Repositories,
    private readonly searchService: SearchService,
  ) {}

  private async ensureEnabled() {
    const flag = await this.repos.featureFlags.findByKey('search.ai.enabled');
    if (!flag?.enabled) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'FEATURE_DISABLED', message: 'AI search is not enabled.' },
      });
    }
    if (!isLlmConfigured()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AI_NOT_CONFIGURED', message: 'AI search requires OPENAI_API_KEY.' },
      });
    }
  }

  async run(input: SearchAiQueryInput, userId?: string | null) {
    await this.ensureEnabled();

    const raw = await llmChatCompletion(
      [
        {
          role: 'system',
          content:
            'You translate natural-language search queries into structured filters for Varnarc, an India-focused finance and home tools portal. Return valid JSON only.',
        },
        {
          role: 'user',
          content: [
            `User query: ${input.q}`,
            '',
            `Allowed entity types: ${searchEntityTypes.join(', ')}`,
            '',
            'Return JSON:',
            '{',
            '  "keywords": string (main search terms, no filler words),',
            '  "entityType": string | null (one allowed type or null),',
            '  "category": string | null,',
            '  "location": string | null (Indian city/state if mentioned),',
            '  "sort": "relevance" | "newest" | "highest_rated" | null',
            '}',
          ].join('\n'),
        },
      ],
      { json: true, maxTokens: 400 },
    );

    const parsed = parseJsonResponse<ParsedAiSearch>(raw);
    const keywords = parsed.keywords?.trim() || input.q;
    const entityType =
      parsed.entityType &&
      (searchEntityTypes as readonly string[]).includes(parsed.entityType.toUpperCase())
        ? parsed.entityType.toUpperCase()
        : undefined;

    const result = await this.searchService.search(
      {
        q: keywords,
        entityType: entityType as (typeof searchEntityTypes)[number] | undefined,
        category: parsed.category ?? undefined,
        location: parsed.location ?? undefined,
        sort: (parsed.sort as 'relevance' | 'newest' | 'highest_rated') ?? 'relevance',
        limit: input.limit,
        cursor: input.cursor,
      },
      { userId, track: true },
    );

    return {
      ...result,
      ai: {
        originalQuery: input.q,
        interpreted: {
          keywords,
          entityType: entityType ?? null,
          category: parsed.category ?? null,
          location: parsed.location ?? null,
          sort: parsed.sort ?? 'relevance',
        },
      },
    };
  }
}
