#!/usr/bin/env bash
# Print Cloud Run web/admin service config, env checklist, and recent logs.
#
# Usage:
#   export GCP_PROJECT_ID=myweb-503314
#   export GCP_REGION=asia-south1
#   ./scripts/gcp/diagnose-cloud-run-frontend.sh admin
#   ./scripts/gcp/diagnose-cloud-run-frontend.sh web

set -euo pipefail

SERVICE="${1:?Usage: $0 admin|web}"
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-south1}"

case "$SERVICE" in
  admin) SERVICE_NAME="varnarc-admin" ;;
  web) SERVICE_NAME="varnarc-web" ;;
  *)
    echo "Unknown service: $SERVICE (use admin or web)"
    exit 1
    ;;
esac

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

echo "=== Service: $SERVICE_NAME ($GCP_REGION) ==="
gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='yaml(spec.template.spec.containers[0].env,spec.template.spec.containers[0].ports,status.latestReadyRevisionName,status.latestCreatedRevisionName)'

echo ""
echo "=== Recent logs ==="
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=\"$SERVICE_NAME\"" \
  --limit=25 \
  --format='table(timestamp,textPayload)' \
  --freshness=1h 2>/dev/null || echo "(run: gcloud auth login)"

echo ""
echo "=== Required runtime config ($SERVICE) ==="
echo "  Env:    APP_BASE_URL, AUTH0_CLIENT_ID, API_URL, NODE_ENV=production"
echo "  Secrets: AUTH0_SECRET, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN, AUTH0_AUDIENCE"
echo ""
echo "Configure once:"
echo "  ./scripts/gcp/configure-cloud-run-frontend.sh $SERVICE"
