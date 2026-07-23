# Analytics Module

Centralized analytics for event collection, dashboards, reports, exports, traffic, search, ads, affiliates, and system metrics.

## Architecture

| Layer | Location |
|-------|----------|
| Prisma models | `packages/database` — `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsAggregate`, `PageView`, `TrafficSource`, `SystemMetric`, `AffiliateConversion`, `AnalyticsSavedReport` |
| Repository | `packages/database/src/repositories/analytics/` |
| Validation | `packages/validation/src/analytics.ts` |
| Permissions | `analytics.view`, `analytics.export`, `analytics.admin` |
| API | `apps/api/src/modules/analytics/` |

### Queue & cache

- **In-memory event queue** (`analytics-queue.ts`): default backend; flushes every **2s** or at **50** events.
- **BullMQ** (`analytics-bullmq.ts`): optional when `REDIS_URL` is set; worker persists batches with concurrency **2**. Falls back to in-memory if Redis/BullMQ unavailable.
- **Dashboard cache**: Nest `CACHE_MANAGER` (Redis when `REDIS_URL` is set, else memory) with **60s** TTL.
- Periodic `aggregateNow()` runs every 5 successful flushes.

Client `sessionId` is treated as `sessionKey` and upserted into `AnalyticsSession`; the DB UUID is stored on events / page views / traffic sources.

## REST API (`/api/v1/analytics`)

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/status` | Module health + queue size + `queueBackend` |
| POST | `/events` | Track single event **or** `{ events: [...] }` batch |
| POST | `/events/batch` | Track batch (`events` array, max 50) |
| GET | `/integrations/public` | Client-safe GA / Clarity / Plausible IDs |

### Authenticated

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/dashboard` | `analytics.view` | Global dashboard (cached 60s) |
| GET | `/reports` | `analytics.view` | Report by `report=` type |
| GET | `/traffic` | `analytics.view` | Traffic sources |
| GET | `/search` | `analytics.view` | Search analytics |
| GET | `/ads` | `analytics.view` | Ad impressions / CTR |
| GET | `/affiliates` | `analytics.view` | Affiliate clicks / revenue |
| GET | `/system` | `analytics.view` | System metrics + health stub |
| GET | `/events` | `analytics.view` | Raw events (cursor) |
| GET | `/export` | `analytics.export` | `{ format, filename, contentType, content }` |
| POST | `/system/metrics` | `analytics.admin` | Record system metric |
| POST | `/aggregate` | `analytics.admin` | Upsert aggregates for period |
| GET/POST/DELETE | `/saved-reports` | `analytics.view` | Saved report CRUD |
| GET/PUT | `/integrations` | `analytics.admin` | Settings key `analytics.integrations` |

### Report types (`?report=`)

`overview` · `content` · `search` · `ads` · `affiliates` · `directory` · `ai-tools` · `calculators` · `users` · `system`

### Export formats (`?format=`)

- `csv` — CSV body
- `excel` — UTF-8 BOM CSV (Excel-compatible)
- `pdf` — minimal valid PDF 1.4 text report

Admin BFF (`/api/admin/analytics/export`) streams the file with `Content-Disposition`.

## Public web beacons

`apps/web/src/lib/analytics-client.ts` posts to `/analytics/events`.

- `AnalyticsPageBeacon` — `page_view` + scroll depth (25/50/75/100%)
- `AnalyticsIntegrationsRoot` — optional GA, Clarity, Plausible from `/integrations/public`
- Search form — `search` events
- Calculator runner — `calculator_usage` on successful calculate

## Siloed sources

Dashboard / reports pull optional module analytics via try/catch:

- `advertisements.analyticsSummary()`
- `popularSearches` / `searchQueries`
- `businesses.analytics()` (directory)
- `aiTools.analyticsSummary()`
- `calculators.analyticsSummary()`
- `reviews.analytics()` / `comparisons.analytics()`
