# Monitoring and logging

## Cloud Logging

Cloud Run automatically ships **stdout/stderr** to Cloud Logging.

```bash
gcloud logging read 'resource.labels.service_name="varnarc-api"' --limit=20
```

## Automated alerts

Run once per project:

```bash
export GCP_PROJECT_ID=your-project
export API_HOST=api.yourdomain.com
export WEB_HOST=www.yourdomain.com
export ALERT_EMAIL=ops@yourdomain.com
bash deploy/gcp/setup-alerts.sh
```

Creates uptime checks and alert policies for 5xx rate, latency, and instance saturation.

## Prometheus + Grafana

Scrape endpoint (production requires token):

```bash
curl -H "Authorization: Bearer $PROMETHEUS_SCRAPE_TOKEN" \
  https://api.yourdomain.com/api/v1/metrics/prometheus
```

Import dashboard: `deploy/observability/grafana-varnarc-api.json`

## Application endpoints

| Endpoint | Use |
|----------|-----|
| `/api/v1/health` | Liveness |
| `/api/v1/ready` | Readiness (DB + Redis) |
| `/api/v1/status` | Ops summary |
| `/api/v1/metrics` | JSON metrics (RBAC) |
| `/api/v1/metrics/prometheus` | Prometheus scrape |

Admin: `/system/health`, `/system/performance`, `/system/metrics`

## OpenTelemetry

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway.example.com/v1/traces
```

Traces export before Nest bootstrap (`apps/api/src/observability/otel.ts`).

## Core Web Vitals RUM

Web posts to `POST /api/v1/analytics/vitals`. Aggregates on `/system/performance`.

## Lighthouse CI

GitHub Actions job `lighthouse-web` — local: `pnpm lighthouse:ci`
