import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@varnarc/auth';
import type { CurrentUser } from '@varnarc/types';
import {
  searchAutocompleteSchema,
  searchAiQuerySchema,
  searchClickSchema,
  searchQuerySchema,
  searchReindexSchema,
  searchSuggestionsSchema,
} from '@varnarc/validation';
import { z } from 'zod';
import { CurrentUserDecorator } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ok } from '../../common/utils/response';
import { SearchService } from './search.service';
import { SearchAiService } from './search-ai.service';

const limitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly service: SearchService,
    private readonly searchAiService: SearchAiService,
  ) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Search module health' })
  async status() {
    return ok({
      module: 'search',
      status: 'ready',
      ...(await this.service.indexHealth()),
    });
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Unified full-text search' })
  async search(
    @Query(new ZodValidationPipe(searchQuerySchema)) query: z.infer<typeof searchQuerySchema>,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.service.search(query, { userId: user?.id, track: true }));
  }

  @Public()
  @Post('ai')
  @ApiOperation({ summary: 'Natural-language search (AI query rewrite)' })
  async aiSearch(
    @Body(new ZodValidationPipe(searchAiQuerySchema)) body: z.infer<typeof searchAiQuerySchema>,
    @CurrentUserDecorator() user?: CurrentUser,
  ) {
    return ok(await this.searchAiService.run(body, user?.id));
  }

  @Public()
  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  async autocomplete(
    @Query(new ZodValidationPipe(searchAutocompleteSchema))
    query: z.infer<typeof searchAutocompleteSchema>,
  ) {
    return ok(await this.service.autocomplete(query));
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Popular, trending, and related suggestions' })
  async suggestions(
    @Query(new ZodValidationPipe(searchSuggestionsSchema))
    query: z.infer<typeof searchSuggestionsSchema>,
  ) {
    return ok(await this.service.suggestions(query.q, query.limit));
  }

  @Public()
  @Get('popular')
  @ApiOperation({ summary: 'Popular searches' })
  async popular(@Query(new ZodValidationPipe(limitSchema)) query: z.infer<typeof limitSchema>) {
    return ok(await this.service.popular(query.limit));
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Trending searches' })
  async trending(@Query(new ZodValidationPipe(limitSchema)) query: z.infer<typeof limitSchema>) {
    return ok(await this.service.trending(query.limit));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Recent searches for the current user' })
  async recent(
    @CurrentUserDecorator() user: CurrentUser,
    @Query(new ZodValidationPipe(limitSchema)) query: z.infer<typeof limitSchema>,
  ) {
    return ok(await this.service.recent(user.id, query.limit));
  }

  @Public()
  @Post('click')
  @ApiOperation({ summary: 'Track search result click' })
  async click(@Body(new ZodValidationPipe(searchClickSchema)) body: z.infer<typeof searchClickSchema>) {
    return ok(await this.service.trackClick(body));
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.SEARCH_ANALYTICS)
  @ApiOperation({ summary: 'Search analytics dashboard data' })
  async analytics() {
    return ok(await this.service.analytics());
  }

  @Get('index')
  @RequirePermissions(PERMISSIONS.SEARCH_VIEW)
  @ApiOperation({ summary: 'Search index health' })
  async index() {
    return ok(await this.service.indexHealth());
  }

  @Post('reindex')
  @RequirePermissions(PERMISSIONS.SEARCH_REINDEX)
  @ApiOperation({ summary: 'Reindex search content by module (sync or async)' })
  async reindex(
    @Body(new ZodValidationPipe(searchReindexSchema)) body: z.infer<typeof searchReindexSchema>,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return ok(await this.service.reindex(body, user.id));
  }

  @Get('reindex/:jobId')
  @RequirePermissions(PERMISSIONS.SEARCH_REINDEX)
  @ApiOperation({ summary: 'Poll background reindex job status' })
  async reindexJob(@Param('jobId') jobId: string) {
    const job = this.service.getReindexJob(jobId);
    return ok(job ?? { status: 'not_found', id: jobId });
  }

  @Post('cache/clear')
  @RequirePermissions(PERMISSIONS.SEARCH_REINDEX)
  @ApiOperation({ summary: 'Clear search caches' })
  async clearCache(@CurrentUserDecorator() user: CurrentUser) {
    void user;
    return ok(await this.service.clearCache());
  }
}
