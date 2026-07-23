# Implementation status — 32 Performance Module

Performance foundation: targets, API metrics, cache ops, Next.js tuning, admin dashboards, and load-test scripts.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Performance targets & budgets | Done — `packages/config/src/performance.ts` |
| `GET /api/v1/metrics` (RBAC: `api.view`) | Done |
| `GET /api/v1/performance/overview` | Done — P50/P95, top paths, target evaluation |
| `GET /api/v1/performance/cache` | Done |
| `POST /api/v1/performance/cache/clear` | Done — search + platform namespaces |
| API response compression | Done — `compression` in `main.ts` |
| Next.js perf defaults (web + admin) | Done — `withPerformanceDefaults()` |
| P95 latency from `api_request_logs` | Done — repository SQL percentiles |
| Admin `/system/performance`, `/cache`, `/metrics` | Done |
| k6 smoke script | Done — `performance/k6/api-smoke.js` |
| OpenTelemetry OTLP bootstrap | Done — `apps/api/src/observability/otel.ts` |
| Prometheus scrape endpoint | Done — `GET /metrics/prometheus` |
| Grafana dashboard starter | Done — `deploy/observability/grafana-varnarc-api.json` |
| Lighthouse CI gate | Done — `lighthouserc.cjs` + CI job |
| Core Web Vitals RUM | Done — `web-vitals` → `POST /analytics/vitals` |
| Documentation | Done — `performance/README.md`, `deploy/observability/README.md` |

## Key paths

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/performance/` | Performance module |
| `packages/config/src/performance.ts` | Targets & `evaluateLatency()` |
| `packages/config/src/next-performance.ts` | Shared Next.js config |
| `packages/database/src/repositories/api/api.repository.ts` | `latencyStats()`, `topPathsByVolume()` |
| `performance/k6/api-smoke.js` | Load test entry point |

## Commands

```bash
# Metrics (authenticated)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/v1/metrics

# k6
k6 run performance/k6/api-smoke.js
```

## Deferred (full spec)

_None — advanced infra items below are operational runbooks; core code is in repo._

## Advanced operations (runbooks)

| Topic | Doc / script |
|-------|----------------|
| GCP alert automation | `deploy/gcp/setup-alerts.sh`, `pnpm gcp:alerts` |
| Edge CDN | `deploy/cdn/README.md`, `scripts/cdn/cloudflare-purge.sh` |
| OpenSearch search | `SEARCH_ENGINE=opensearch`, `apps/api/src/modules/search/opensearch.*` |
| Multi-region cache | `deploy/gcp/multi-region-cache.md`, `CacheInvalidationService` |

## Future enhancements

- CMS auto-publish cache invalidation hooks on article save
- Terraform for GCP LB + Cloud CDN
- Managed Prometheus / GMP collector sidecar on Cloud Run

## Related

- Spec: `varnarc-project-docs/docs/32-Performance.md`
- Testing: `docs/31-Testing-IMPLEMENTATION.md`
- GCP autoscaling: `docs/30-Google-Cloud-IMPLEMENTATION.md`
