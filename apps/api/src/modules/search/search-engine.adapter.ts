import type { SearchIndexUpsertInput } from '@varnarc/database';

/** Abstraction for future Meilisearch / OpenSearch / Elasticsearch adapters. */
export interface SearchEngineAdapter {
  readonly name: string;
  upsert(doc: SearchIndexUpsertInput): Promise<void>;
  remove(entityType: string, entityId: string): Promise<void>;
  clearModule?(entityTypes: string[]): Promise<void>;
}

export const SEARCH_ENGINE_ADAPTER = Symbol('SEARCH_ENGINE_ADAPTER');
