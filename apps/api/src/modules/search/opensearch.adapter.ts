import { Injectable } from '@nestjs/common';
import type { SearchIndexUpsertInput } from '@varnarc/database';
import type { SearchEngineAdapter } from './search-engine.adapter';
import { OpenSearchClient } from './opensearch.client';

function toDoc(data: SearchIndexUpsertInput) {
  return {
    entityType: data.entityType,
    entityId: data.entityId,
    title: data.title,
    summary: data.summary ?? null,
    content: data.content ?? null,
    keywords: data.keywords ?? null,
    tags: data.tags ?? null,
    slug: data.slug,
    url: data.url,
    thumbnail: data.thumbnail ?? null,
    category: data.category ?? null,
    location: data.location ?? null,
    author: data.author ?? null,
    brand: data.brand ?? null,
    language: data.language ?? 'en',
    status: data.status ?? 'PUBLISHED',
    featured: data.featured ?? false,
    sponsored: data.sponsored ?? false,
    verified: data.verified ?? false,
    rating: data.rating ?? null,
    viewCount: data.viewCount ?? 0,
    publishedAt: data.publishedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class OpenSearchSearchAdapter implements SearchEngineAdapter {
  readonly name = 'opensearch';
  private ready = false;

  constructor(private readonly client: OpenSearchClient) {}

  private async ensureReady() {
    if (this.ready) return;
    await this.client.ensureIndex();
    this.ready = true;
  }

  async upsert(doc: SearchIndexUpsertInput): Promise<void> {
    await this.ensureReady();
    const id = this.client.docId(doc.entityType, doc.entityId);
    await this.client.indexDocument(id, toDoc(doc));
  }

  async remove(entityType: string, entityId: string): Promise<void> {
    await this.ensureReady();
    await this.client.deleteDocument(this.client.docId(entityType, entityId));
  }

  async clearModule(entityTypes: string[]): Promise<void> {
    await this.ensureReady();
    await this.client.deleteByEntityTypes(entityTypes);
  }
}

/** Writes to Postgres (source of truth) and OpenSearch when configured. */
@Injectable()
export class DualWriteSearchAdapter implements SearchEngineAdapter {
  readonly name = 'dual-write';

  constructor(
    private readonly primary: SearchEngineAdapter,
    private readonly secondary: SearchEngineAdapter,
  ) {}

  async upsert(doc: SearchIndexUpsertInput): Promise<void> {
    await this.primary.upsert(doc);
    try {
      await this.secondary.upsert(doc);
    } catch {
      // Postgres remains authoritative; OpenSearch catches up on reindex
    }
  }

  async remove(entityType: string, entityId: string): Promise<void> {
    await this.primary.remove(entityType, entityId);
    try {
      await this.secondary.remove(entityType, entityId);
    } catch {
      // best effort
    }
  }

  async clearModule(entityTypes: string[]): Promise<void> {
    await this.primary.clearModule?.(entityTypes);
    try {
      await this.secondary.clearModule?.(entityTypes);
    } catch {
      // best effort
    }
  }
}
