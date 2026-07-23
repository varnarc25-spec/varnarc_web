import { Inject, Injectable } from '@nestjs/common';
import type { Repositories, SearchIndexUpsertInput } from '@varnarc/database';
import { REPOS } from '../../database/database.module';
import type { SearchEngineAdapter } from './search-engine.adapter';

@Injectable()
export class PostgresFtsSearchAdapter implements SearchEngineAdapter {
  readonly name = 'postgres-fts';

  constructor(@Inject(REPOS) private readonly repos: Repositories) {}

  async upsert(doc: SearchIndexUpsertInput): Promise<void> {
    await this.repos.searchIndex.upsert(doc);
  }

  async remove(entityType: string, entityId: string): Promise<void> {
    await this.repos.searchIndex.remove(entityType as never, entityId);
  }

  async clearModule(entityTypes: string[]): Promise<void> {
    await this.repos.searchIndex.clearModule(entityTypes as never);
  }
}
