#!/usr/bin/env bash
# One-time setup: bind Secret Manager secrets to the varnarc-api Cloud Run service.
# Run AFTER ./deploy/gcp/setup-secrets.sh has created secrets in GCP.
#
# Usage:
#   export GCP_PROJECT_ID=myweb-503314
#   export GCP_REGION=asia-south1
#   ./scripts/gcp/configure-cloud-run-api-secrets.sh

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-varnarc-api}"

gcloud config set project "$GCP_PROJECT_ID"

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

REQUIRED_SECRETS=(DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE)
MISSING=()
for name in "${REQUIRED_SECRETS[@]}"; do
  if ! gcloud secrets describe "$name" >/dev/null 2>&1; then
    MISSING+=("$name")
  fi
done

if ((${#MISSING[@]})); then
  echo "Missing secrets in Secret Manager: ${MISSING[*]}"
  echo "Create them first:"
  echo "  cp deploy/gcp/secrets.env.example deploy/gcp/secrets.env"
  echo "  # fill values, then:"
  echo "  ./deploy/gcp/setup-secrets.sh"
  exit 1
fi

echo "Granting secretAccessor to Cloud Run runtime SA: $RUNTIME_SA"
for name in "${REQUIRED_SECRETS[@]}"; do
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
  echo "  OK $name"
done

SECRET_BINDINGS="DATABASE_URL=DATABASE_URL:latest,AUTH0_DOMAIN=AUTH0_DOMAIN:latest,AUTH0_AUDIENCE=AUTH0_AUDIENCE:latest"

echo "Updating Cloud Run service: $SERVICE_NAME ($GCP_REGION)"
gcloud run services update "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --set-secrets="$SECRET_BINDINGS" \
  --set-env-vars="NODE_ENV=production,SEARCH_ENGINE=postgres-fts" \
  --memory=1Gi \
  --cpu=1 \
  --startup-probe=type=http,path=/api/v1/health,port=8080,initialDelaySeconds=15,periodSeconds=10,failureThreshold=12 \
  --quiet

echo ""
echo "Done. Service $SERVICE_NAME now has required secrets."
echo "Redeploy from Cloud Run or push to GitHub to roll a new revision."
echo ""
echo "Verify logs after deploy:"
echo "  gcloud logging read 'resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\"' --limit=10 --format='value(textPayload)'"
