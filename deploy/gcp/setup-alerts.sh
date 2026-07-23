#!/usr/bin/env bash
# Create Cloud Monitoring uptime checks and alert policies for Varnarc on GCP.
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"

GCP_REGION="${GCP_REGION:-asia-southeast1}"
API_HOST="${API_HOST:-api.example.com}"
WEB_HOST="${WEB_HOST:-www.example.com}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

echo "Project: $GCP_PROJECT_ID"
gcloud config set project "$GCP_PROJECT_ID" --quiet

gcloud services enable monitoring.googleapis.com --quiet

CHANNEL_ID=""
if [[ -n "$ALERT_EMAIL" ]]; then
  CHANNEL_ID=$(gcloud alpha monitoring channels create \
    --display-name="Varnarc ops email" \
    --type=email \
    --channel-labels=email_address="$ALERT_EMAIL" \
    --format='value(name)' 2>/dev/null || true)
  if [[ -z "$CHANNEL_ID" ]]; then
    CHANNEL_ID=$(gcloud monitoring channels list \
      --filter="displayName='Varnarc ops email'" \
      --format='value(name)' | head -1)
  fi
  echo "Notification channel: ${CHANNEL_ID:-none}"
fi

CHANNEL_FLAG=()
if [[ -n "$CHANNEL_ID" ]]; then
  CHANNEL_FLAG=(--notification-channels="$CHANNEL_ID")
fi

# Uptime: API readiness
if [[ "$API_HOST" != "api.example.com" ]]; then
  gcloud monitoring uptime create varnarc-api-ready \
    --display-name="Varnarc API ready" \
    --resource-type=uptime-url \
    --hostname="$API_HOST" \
    --path="/api/v1/ready" \
    --port=443 \
    --use-ssl 2>/dev/null || echo "Uptime check varnarc-api-ready may already exist"
fi

# Uptime: Web home
if [[ "$WEB_HOST" != "www.example.com" ]]; then
  gcloud monitoring uptime create varnarc-web-home \
    --display-name="Varnarc web home" \
    --resource-type=uptime-url \
    --hostname="$WEB_HOST" \
    --path="/" \
    --port=443 \
    --use-ssl 2>/dev/null || echo "Uptime check varnarc-web-home may already exist"
fi

create_policy() {
  local name="$1"
  local display="$2"
  local filter="$3"
  local threshold="$4"
  local duration="${5:-300s}"

  if gcloud monitoring policies list --filter="displayName='$display'" --format='value(name)' | grep -q .; then
    echo "Policy exists: $display"
    return
  fi

  gcloud monitoring policies create \
    --display-name="$display" \
    --combiner=OR \
    --condition-display-name="$display" \
    --condition-filter="$filter" \
    --condition-threshold-value="$threshold" \
    --condition-threshold-duration="$duration" \
    --condition-threshold-comparison=COMPARISON_GT \
    --aggregation-alignment-period=60s \
    --aggregation-per-series-aligner=ALIGN_RATE \
    "${CHANNEL_FLAG[@]}" \
    --quiet
  echo "Created policy: $display"
}

# Cloud Run 5xx rate for API service
create_policy "varnarc-api-5xx" \
  "Varnarc API 5xx rate high" \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="varnarc-api" AND metric.type="run.googleapis.com/request_count" AND metric.labels.response_code_class="5xx"' \
  "0.01" \
  "300s"

# Cloud Run p95 latency
create_policy "varnarc-api-latency" \
  "Varnarc API p95 latency high" \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="varnarc-api" AND metric.type="run.googleapis.com/request_latencies"' \
  "2000" \
  "600s"

# Instance count at max (adjust max-instances in deploy script to match)
create_policy "varnarc-api-instances" \
  "Varnarc API instances saturated" \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="varnarc-api" AND metric.type="run.googleapis.com/container/instance_count"' \
  "9" \
  "900s"

echo ""
echo "Done. Configure notification channels in Cloud Console → Monitoring → Alerting."
echo "Prometheus scrape: GET https://${API_HOST}/api/v1/metrics/prometheus (Bearer PROMETHEUS_SCRAPE_TOKEN)"
echo "Import Grafana dashboard: deploy/observability/grafana-varnarc-api.json"
