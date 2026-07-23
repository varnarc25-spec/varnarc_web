# Performance — Varnarc Platform

Performance targets, monitoring, caching, and load testing for the monorepo.

## Targets

Defined in `packages/config/src/performance.ts`:

| Surface | Metric | Target |
|---------|--------|--------|
| Web | FCP | &lt; 1.8s |
| Web | LCP | &lt; 2.5s |
| Web | INP | &lt; 200ms |
| Web | CLS | &lt; 0.1 |
| Web | TTFB | &lt; 300ms |
| API | Avg response | &lt; 200ms |
| API | P95 | &lt; 500ms |
| API | Error rate | &lt; 1% |
| Search | Avg query | &lt; 150ms |
| Admin | Dashboard load | &lt; 2s |

## API endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/v1/metrics` | `api.view` | Operational metrics JSON |
| `GET /api/v1/performance/overview` | `api.view` | Targets vs actual + top paths |
| `GET /api/v1/performance/cache` | `api.view` | Cache backend & namespaces |
| `POST /api/v1/performance/cache/clear` | `api.manage` | Invalidate cache |

## Admin UI

- `/system/performance` — latency dashboard
- `/system/cache` — namespaces + clear actions
- `/system/metrics` — metrics snapshot

## Optimizations delivered

- **API:** gzip/brotli via `compression` middleware
- **Next.js (web + admin):** `compress`, AVIF/WebP images, `optimizePackageImports`, remote image patterns (GCS, Cloudinary)
- **Redis caching:** CMS, search, settings, SEO, analytics (existing modules)
- **Request logs:** P50/P95 latency from `api_request_logs`

## Load testing (k6)

```bash
# Install k6: https://k6.io/docs/get-started/installation/
k6 run performance/k6/api-smoke.js
BASE_URL=https://api.example.com k6 run performance/k6/api-smoke.js
```

## Lighthouse / Core Web Vitals

```bash
pnpm --filter @varnarc/web build
pnpm lighthouse:ci
```

RUM: web app reports LCP, INP, CLS, FCP, TTFB via `POST /api/v1/analytics/vitals`.

## Observability

See `deploy/observability/README.md` for Prometheus scrape, OpenTelemetry OTLP, and Grafana import.

## Related

- `docs/32-Performance-IMPLEMENTATION.md`
- `varnarc-project-docs/docs/32-Performance.md`
- Module 31 testing (Playwright a11y/SEO smoke)
- Module 30 GCP (Cloud Run autoscaling, Redis)
