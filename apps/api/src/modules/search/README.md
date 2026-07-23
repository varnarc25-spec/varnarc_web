# Search Module

Unified PostgreSQL full-text search across CMS, Finance, Construction, Automobile, Directory, AI Tools, Calculators, Reviews, Comparisons, Guides, and Media.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/search` | Public | Full-text search + facets + cursor pagination |
| GET | `/api/v1/search/autocomplete` | Public | Titles/keywords/categories/trending |
| GET | `/api/v1/search/suggestions` | Public | Popular / trending / related |
| GET | `/api/v1/search/popular` | Public | Popular keywords |
| GET | `/api/v1/search/trending` | Public | Trending keywords |
| GET | `/api/v1/search/recent` | Auth | User recent searches |
| POST | `/api/v1/search/click` | Public | Track result click |
| GET | `/api/v1/search/analytics` | `search.analytics` | Analytics + most-clicked |
| GET | `/api/v1/search/index` | `search.view` | Index health |
| POST | `/api/v1/search/reindex` | `search.reindex` | Sync or `{ "async": true }` background job |
| GET | `/api/v1/search/reindex/:jobId` | `search.reindex` | Poll background job |
| POST | `/api/v1/search/cache/clear` | `search.reindex` | Clear autocomplete cache |

## Engine

- Adapter: `SEARCH_ENGINE_ADAPTER` — production defaults to OpenSearch reads when `NODE_ENV=production` and `OPENSEARCH_URL` is set
- **OpenSearch**: dual-write to Postgres + OpenSearch by default; reads from OpenSearch when resolved engine is `opensearch`
- Env: `OPENSEARCH_URL`, `OPENSEARCH_INDEX`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`
- Ops: [deploy/gcp/opensearch.md](../../../deploy/gcp/opensearch.md)
- Tuning: `OPENSEARCH_SHARDS`, `OPENSEARCH_REPLICAS`, `OPENSEARCH_REFRESH_INTERVAL`, `OPENSEARCH_TIMEOUT_MS`
- Table: `search_index` with `tsvector` + GIN (Postgres path)
- Filters: type, category, location, author, tags, rating, price, brand, vehicle/fuel/loan/material type, featured/sponsored/verified, date range
- Cache: Redis when `REDIS_URL` is set, otherwise in-memory Nest cache
- Incremental indexing via `SearchIndexerService` on CMS / AI Tools / Directory / Calculator publish/update/delete

## Permissions

- `search.view`
- `search.reindex`
- `search.analytics`
