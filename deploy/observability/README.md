# Observability — OpenTelemetry, Prometheus, Grafana

## Prometheus scrape

Cloud Run / internal network:

```
GET /api/v1/metrics/prometheus
Authorization: Bearer $PROMETHEUS_SCRAPE_TOKEN
```

Set in Secret Manager:

| Variable | Purpose |
|----------|---------|
| `PROMETHEUS_ENABLED` | `true` to expose histograms (auto on in production) |
| `PROMETHEUS_SCRAPE_TOKEN` | Bearer token for scrape endpoint (required in production) |

Metrics exported:

- `varnarc_http_request_duration_seconds` (histogram)
- `varnarc_http_requests_total` (counter)
- Node.js default metrics (`varnarc_*` prefix)

## Grafana

Import `deploy/observability/grafana-varnarc-api.json` and point the Prometheus datasource at your scraper target.

Suggested alerts:

- p95 latency &gt; 500ms for 5m
- error rate &gt; 1% (from JSON `/metrics` or log-based metric)

## OpenTelemetry

Enable tracing to Grafana Cloud, Honeycomb, or GCP via OTLP:

```bash
OTEL_ENABLED=true
OTEL_SERVICE_NAME=varnarc-api
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway.example.com/v1/traces
```

Bootstrap runs in `apps/api/src/main.ts` before Nest starts (`apps/api/src/observability/otel.ts`).

Toggle flags in admin **Analytics → Integrations** (`openTelemetryEnabled`, `prometheusEnabled`) document intent; env vars control runtime.

## Core Web Vitals (RUM)

Web app posts to `POST /api/v1/analytics/vitals` (public, throttled). Samples land in `system_metrics` as `web_vitals.lcp`, `web_vitals.inp`, etc.

View aggregates on admin **System → Performance**.

## Lighthouse CI

```bash
pnpm --filter @varnarc/web build
pnpm lighthouse:ci
```

GitHub Actions job `lighthouse-web` uploads `.lighthouseci/` artifacts.
