#!/usr/bin/env bash
# One-time setup: bind Auth0 secrets + public URLs to varnarc-web or varnarc-admin.
# Run AFTER ./deploy/gcp/setup-secrets.sh has created secrets in GCP.
#
# Usage (admin):
#   export GCP_PROJECT_ID=myweb-503314
#   export GCP_REGION=asia-south1
#   export APP_BASE_URL=https://varnarc-admin-414895350436.asia-south1.run.app
#   export API_URL=https://varnarc-api-XXXX.asia-south1.run.app/api/v1
#   export AUTH0_CLIENT_ID=your-admin-auth0-client-id
#   ./scripts/gcp/configure-cloud-run-frontend.sh admin
#
# Usage (web):
#   export APP_BASE_URL=https://varnarc-web-XXXX.asia-south1.run.app
#   export API_URL=https://varnarc-api-XXXX.asia-south1.run.app/api/v1
#   export AUTH0_CLIENT_ID=your-web-auth0-client-id
#   ./scripts/gcp/configure-cloud-run-frontend.sh web

set -euo pipefail

SERVICE="${1:?Usage: $0 admin|web}"
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${APP_BASE_URL:?Set APP_BASE_URL to the Cloud Run service URL (https://...)}"
: "${API_URL:?Set API_URL to the API base (https://.../api/v1)}"
: "${AUTH0_CLIENT_ID:?Set AUTH0_CLIENT_ID for this Auth0 Regular Web Application}"

GCP_REGION="${GCP_REGION:-asia-south1}"
CLIENT_SECRET_SECRET="${CLIENT_SECRET_SECRET:-AUTH0_CLIENT_SECRET}"

case "$SERVICE" in
  admin) SERVICE_NAME="varnarc-admin" ;;
  web) SERVICE_NAME="varnarc-web" ;;
  *)
    echo "Unknown service: $SERVICE (use admin or web)"
    exit 1
    ;;
esac

gcloud config set project "$GCP_PROJECT_ID"

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

REQUIRED_SECRETS=(AUTH0_SECRET AUTH0_CLIENT_SECRET AUTH0_DOMAIN AUTH0_AUDIENCE)
MISSING=()
for name in "${REQUIRED_SECRETS[@]}"; do
  secret_name="$name"
  if [[ "$name" == "AUTH0_CLIENT_SECRET" ]]; then
    secret_name="$CLIENT_SECRET_SECRET"
  fi
  if ! gcloud secrets describe "$secret_name" >/dev/null 2>&1; then
    MISSING+=("$secret_name")
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
for name in AUTH0_SECRET "$CLIENT_SECRET_SECRET" AUTH0_DOMAIN AUTH0_AUDIENCE; do
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
  echo "  OK $name"
done

SECRET_BINDINGS="AUTH0_SECRET=AUTH0_SECRET:latest,AUTH0_CLIENT_SECRET=${CLIENT_SECRET_SECRET}:latest,AUTH0_DOMAIN=AUTH0_DOMAIN:latest,AUTH0_AUDIENCE=AUTH0_AUDIENCE:latest"

ENV_VARS="NODE_ENV=production,APP_BASE_URL=${APP_BASE_URL},API_URL=${API_URL},AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID},NEXT_PUBLIC_AUTH0_CONFIGURED=true"

echo "Updating Cloud Run service: $SERVICE_NAME ($GCP_REGION)"
gcloud run services update "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --port=8080 \
  --set-secrets="$SECRET_BINDINGS" \
  --set-env-vars="$ENV_VARS" \
  --memory=512Mi \
  --cpu=1 \
  --quiet

echo ""
echo "Done. $SERVICE_NAME configured with Auth0 + APP_BASE_URL."
echo ""
echo "Auth0 dashboard — add for this app ($SERVICE):"
echo "  Allowed Callback URLs:  ${APP_BASE_URL}/auth/callback"
echo "  Allowed Logout URLs:    ${APP_BASE_URL}"
echo "  Allowed Web Origins:    ${APP_BASE_URL}"
echo ""
echo "If admin and web use different Auth0 apps, store each client secret separately"
echo "(e.g. AUTH0_ADMIN_CLIENT_SECRET) and run with:"
echo "  CLIENT_SECRET_SECRET=AUTH0_ADMIN_CLIENT_SECRET ./scripts/gcp/configure-cloud-run-frontend.sh admin"
