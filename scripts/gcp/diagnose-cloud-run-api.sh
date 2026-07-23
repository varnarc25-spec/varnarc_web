#!/usr/bin/env bash
# Print Cloud Run API service config and recent startup logs.
#
# Usage:
#   export GCP_PROJECT_ID=myweb-503314
#   export GCP_REGION=asia-south1
#   ./scripts/gcp/diagnose-cloud-run-api.sh

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-varnarc-api}"

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

echo "=== Service: $SERVICE_NAME ($GCP_REGION) ==="
gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='yaml(spec.template.spec.containers[0].env,spec.template.spec.containers[0].ports,status.latestReadyRevisionName,status.latestCreatedRevisionName)'

echo ""
echo "=== Recent logs (startup errors) ==="
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=\"$SERVICE_NAME\"" \
  --limit=25 \
  --format='table(timestamp,textPayload)' \
  --freshness=1h 2>/dev/null || echo "(run: gcloud auth login)"

echo ""
echo "=== Secret Manager (required) ==="
for s in DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE; do
  if gcloud secrets describe "$s" >/dev/null 2>&1; then
    echo "  OK  $s"
  else
    echo "  MISSING  $s"
  fi
done

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo ""
echo "Runtime SA: $RUNTIME_SA"
echo "If secrets exist but API still fails, run:"
echo "  ./scripts/gcp/configure-cloud-run-api-secrets.sh"
