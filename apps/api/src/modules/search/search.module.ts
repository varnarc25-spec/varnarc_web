import { Module } from '@nestjs/common';
import { REPOS } from '../../database/database.module';
import type { Repositories } from '@varnarc/database';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchAiService } from './search-ai.service';
import { SearchIndexerService } from './search-indexer.service';
import { SearchCacheService } from './search-cache.service';
import { PostgresFtsSearchAdapter } from './postgres-fts.adapter';
import { SEARCH_ENGINE_ADAPTER } from './search-engine.adapter';
import {
  DualWriteSearchAdapter,
  OpenSearchSearchAdapter,
} from './opensearch.adapter';
import {
  getOpenSearchConfig,
  isOpenSearchReadEnabled,
  OpenSearchClient,
  OPENSEARCH_CLIENT,
  resolvedSearchEngine,
} from './opensearch.client';
import { OpenSearchQueryService } from './opensearch.query';
import { OpenSearchBootstrapService } from './opensearch.bootstrap';
import { getOpenSearchEnv } from '@varnarc/config';

const osConfig = getOpenSearchConfig();
const openSearchProviders = osConfig
  ? [
      { provide: OPENSEARCH_CLIENT, useValue: new OpenSearchClient(osConfig) },
      OpenSearchQueryService,
    ]
  : [];

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    SearchAiService,
    SearchIndexerService,
    SearchCacheService,
    PostgresFtsSearchAdapter,
    OpenSearchBootstrapService,
    ...openSearchProviders,
    {
      provide: SEARCH_ENGINE_ADAPTER,
      useFactory: (
        _repos: Repositories,
        postgres: PostgresFtsSearchAdapter,
        osClient?: OpenSearchClient,
      ) => {
        if (!osClient) return postgres;
        const openSearch = new OpenSearchSearchAdapter(osClient);
        const osEnv = getOpenSearchEnv();
        if (resolvedSearchEngine() === 'opensearch' && osEnv && !osEnv.dualWrite) {
          return openSearch;
        }
        return new DualWriteSearchAdapter(postgres, openSearch);
      },
      inject: [REPOS, PostgresFtsSearchAdapter, { token: OPENSEARCH_CLIENT, optional: true }],
    },
  ],
  exports: [
    SearchService,
    SearchIndexerService,
    SearchCacheService,
    SEARCH_ENGINE_ADAPTER,
    ...(isOpenSearchReadEnabled() ? [OpenSearchQueryService] : []),
  ],
})
export class SearchModule {}
