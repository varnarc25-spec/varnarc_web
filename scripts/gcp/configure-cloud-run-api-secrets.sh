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
DEFAULT_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CONFIGURED_SA="$(gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)"
if [[ -n "$CONFIGURED_SA" ]]; then
  RUNTIME_SA="$CONFIGURED_SA"
else
  RUNTIME_SA="$DEFAULT_SA"
fi

REQUIRED_SECRETS=(DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE)
# Bind only secrets that exist (e.g. DATABASE_URL only until Auth0 is added).
AVAILABLE_SECRETS=()
MISSING=()
for name in "${REQUIRED_SECRETS[@]}"; do
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    AVAILABLE_SECRETS+=("$name")
  else
    MISSING+=("$name")
  fi
done

if ((${#AVAILABLE_SECRETS[@]} == 0)); then
  echo "No secrets found in Secret Manager."
  echo "Create them first:"
  echo "  cp deploy/gcp/secrets.env.example deploy/gcp/secrets.env"
  echo "  # fill values, then:"
  echo "  ./deploy/gcp/setup-secrets.sh"
  exit 1
fi

if ((${#MISSING[@]})); then
  echo "Note: optional secrets not in Secret Manager yet: ${MISSING[*]}"
fi

echo "Granting secretAccessor to Cloud Run runtime SA: $RUNTIME_SA"
for name in "${AVAILABLE_SECRETS[@]}"; do
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  echo "  OK $name"
done

SECRET_BINDINGS=""
for name in "${AVAILABLE_SECRETS[@]}"; do
  if [[ -n "$SECRET_BINDINGS" ]]; then
    SECRET_BINDINGS+=","
  fi
  SECRET_BINDINGS+="${name}=${name}:latest"
done

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
