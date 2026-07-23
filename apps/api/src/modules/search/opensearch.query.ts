import { Injectable, Logger, Inject } from '@nestjs/common';
import type { SearchQueryInput } from '@varnarc/validation';
import type { SearchHit, SearchPage } from '@varnarc/database';
import { OpenSearchClient, OPENSEARCH_CLIENT } from './opensearch.client';

@Injectable()
export class OpenSearchQueryService {
  private readonly logger = new Logger(OpenSearchQueryService.name);

  constructor(@Inject(OPENSEARCH_CLIENT) private readonly client: OpenSearchClient) {}

  async search(query: SearchQueryInput & { entityTypes?: string[] }): Promise<SearchPage> {
    const q = query.q?.trim();
    const limit = Math.min(query.limit ?? 20, 50);
    const must: Record<string, unknown>[] = [{ term: { status: 'PUBLISHED' } }];

    if (query.entityTypes?.length) {
      must.push({ terms: { entityType: query.entityTypes } });
    }
    if (query.category) must.push({ term: { category: query.category } });
    if (query.location) must.push({ term: { location: query.location } });
    if (query.brand) must.push({ term: { brand: query.brand } });
    if (query.featured) must.push({ term: { featured: true } });

    const body: Record<string, unknown> = {
      size: limit + 1,
      query: q
        ? {
            bool: {
              must,
              should: [
                { multi_match: { query: q, fields: ['title^3', 'summary^2', 'content', 'keywords'] } },
              ],
              minimum_should_match: 1,
            },
          }
        : { bool: { must } },
      sort: [{ _score: 'desc' }, { publishedAt: 'desc' }],
    };

    if (query.cursor) {
      try {
        const offset = Number(Buffer.from(query.cursor, 'base64url').toString('utf8'));
        if (!Number.isNaN(offset)) body.from = offset;
      } catch {
        // ignore bad cursor
      }
    }

    const started = Date.now();
    const result = await this.client.search(body);
    const hits = result.hits?.hits ?? [];
    const latencyMs = Date.now() - started;
    if (latencyMs > 150) {
      this.logger.warn(`OpenSearch slow query ${latencyMs}ms q=${q?.slice(0, 40) ?? ''}`);
    }

    const items = hits.slice(0, limit).map((hit, i) => this.mapHit(hit._source, hit._score ?? 0, i));
    const hasMore = hits.length > limit;
    const nextOffset =
      typeof body.from === 'number' ? (body.from as number) + limit : hits.length > 0 ? limit : 0;
    const nextCursor = hasMore
      ? Buffer.from(String(nextOffset), 'utf8').toString('base64url')
      : null;

    return { items, nextCursor, hasMore };
  }

  async facets(query: { q?: string; entityTypes?: string[] }) {
    const must: Record<string, unknown>[] = [{ term: { status: 'PUBLISHED' } }];
    if (query.entityTypes?.length) {
      must.push({ terms: { entityType: query.entityTypes } });
    }

    const body = {
      size: 0,
      query: query.q?.trim()
        ? {
            bool: {
              must,
              should: [{ multi_match: { query: query.q, fields: ['title', 'summary', 'content'] } }],
              minimum_should_match: 1,
            },
          }
        : { bool: { must } },
      aggs: {
        by_type: { terms: { field: 'entityType', size: 20 } },
        by_category: { terms: { field: 'category', size: 20 } },
      },
    };

    const result = await this.client.search(body) as {
      aggregations?: {
        by_type?: { buckets: Array<{ key: string; doc_count: number }> };
        by_category?: { buckets: Array<{ key: string; doc_count: number }> };
      };
    };

    return {
      entityTypes: (result.aggregations?.by_type?.buckets ?? []).map((b) => ({
        entityType: b.key,
        count: b.doc_count,
      })),
      categories: (result.aggregations?.by_category?.buckets ?? [])
        .filter((b) => b.key)
        .map((b) => ({
          category: b.key,
          count: b.doc_count,
        })),
    };
  }

  private mapHit(source: Record<string, unknown>, score: number, index: number): SearchHit {
    return {
      id: String(source.entityId ?? index),
      entity_type: source.entityType as SearchHit['entity_type'],
      entity_id: String(source.entityId ?? ''),
      title: String(source.title ?? ''),
      summary: (source.summary as string) ?? null,
      slug: String(source.slug ?? ''),
      url: String(source.url ?? ''),
      thumbnail: (source.thumbnail as string) ?? null,
      category: (source.category as string) ?? null,
      location: (source.location as string) ?? null,
      author: (source.author as string) ?? null,
      brand: (source.brand as string) ?? null,
      tags: (source.tags as string) ?? null,
      language: String(source.language ?? 'en'),
      status: (source.status as SearchHit['status']) ?? 'PUBLISHED',
      featured: Boolean(source.featured),
      sponsored: Boolean(source.sponsored),
      verified: Boolean(source.verified),
      rating: (source.rating as number) ?? null,
      view_count: Number(source.viewCount ?? 0),
      published_at: source.publishedAt ? new Date(String(source.publishedAt)) : null,
      created_at: new Date(),
      seo_title: null,
      seo_description: null,
      rank: score,
      headline: null,
    };
  }
}
