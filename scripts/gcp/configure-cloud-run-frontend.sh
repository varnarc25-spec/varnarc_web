#!/usr/bin/env bash
# One-time setup: public URLs for varnarc-admin, or Auth0 secrets + URLs for varnarc-web.
# Run AFTER ./deploy/gcp/setup-secrets.sh has created secrets in GCP.
#
# Usage (admin — email/password, no Auth0):
#   export GCP_PROJECT_ID=myweb-503314
#   export GCP_REGION=us-central1
#   export APP_BASE_URL=https://admin.varnarc.com
#   export API_URL=https://api.varnarc.com/api/v1
#   ./scripts/gcp/configure-cloud-run-frontend.sh admin
#
# Usage (web):
#   export APP_BASE_URL=https://varnarc-web-XXXX.us-central1.run.app
#   export API_URL=https://varnarc-api-XXXX.us-central1.run.app/api/v1
#   export AUTH0_CLIENT_ID=your-web-auth0-client-id
#   ./scripts/gcp/configure-cloud-run-frontend.sh web

set -euo pipefail

SERVICE="${1:?Usage: $0 admin|web}"
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"

GCP_REGION="${GCP_REGION:-us-central1}"
API_URL="${API_URL:-https://api.varnarc.com/api/v1}"

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

resolve_secret_name() {
  local primary="$1"
  local fallback="$2"
  if gcloud secrets describe "$primary" >/dev/null 2>&1; then
    echo "$primary"
  elif [[ -n "$fallback" ]] && gcloud secrets describe "$fallback" >/dev/null 2>&1; then
    echo "$fallback"
  else
    echo "$primary"
  fi
}

CLIENT_SECRET_SECRET="${CLIENT_SECRET_SECRET:-$(resolve_secret_name AUTH0_CLIENT_SECRET VARNARC_AUTH0_CLIENT_SECRET)}"
AUDIENCE_SECRET="${AUDIENCE_SECRET:-$(resolve_secret_name AUTH0_AUDIENCE VARNARC_AUTH0_AUDIENCE)}"
CLIENT_ID_SECRET="${CLIENT_ID_SECRET:-$(resolve_secret_name AUTH0_CLIENT_ID VARNARC_AUTH0_CLIENT_ID)}"

case "$SERVICE" in
  admin)
    SERVICE_NAME="varnarc-admin"
    CONTAINER_PORT=3001
    APP_BASE_URL="${APP_BASE_URL:-https://admin.varnarc.com}"
    ;;
  web)
    SERVICE_NAME="varnarc-web"
    CONTAINER_PORT=3000
    APP_BASE_URL="${APP_BASE_URL:-https://varnarc.com}"
    ;;
  *)
    echo "Unknown service: $SERVICE (use admin or web)"
    exit 1
    ;;
esac

if [[ "$SERVICE" == "admin" ]]; then
  echo "Updating Cloud Run service: $SERVICE_NAME ($GCP_REGION) without Auth0"
  gcloud run services update "$SERVICE_NAME" \
    --region="$GCP_REGION" \
    --port="$CONTAINER_PORT" \
    --set-env-vars="NODE_ENV=production,APP_BASE_URL=${APP_BASE_URL},API_URL=${API_URL},NEXT_PUBLIC_API_URL=${API_URL}" \
    --memory=512Mi \
    --cpu=1 \
    --quiet
  echo "Done. $SERVICE_NAME uses in-app email/password via the API."
  echo "Set ADMIN_JWT_SECRET and ADMIN_BOOTSTRAP_PASSWORD on the API service."
  echo "First login: business@varnarc.com (super admin)."
  exit 0
fi

: "${AUTH0_CLIENT_ID:?Set AUTH0_CLIENT_ID for this Auth0 Regular Web Application}"

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

REQUIRED_SECRETS=(AUTH0_SECRET "$CLIENT_SECRET_SECRET" AUTH0_DOMAIN "$AUDIENCE_SECRET")
MISSING=()
for secret_name in "${REQUIRED_SECRETS[@]}"; do
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
for name in AUTH0_SECRET "$CLIENT_SECRET_SECRET" AUTH0_DOMAIN "$AUDIENCE_SECRET"; do
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  echo "  OK $name"
done

SECRET_BINDINGS="AUTH0_SECRET=AUTH0_SECRET:latest,AUTH0_CLIENT_SECRET=${CLIENT_SECRET_SECRET}:latest,AUTH0_DOMAIN=AUTH0_DOMAIN:latest,AUTH0_AUDIENCE=${AUDIENCE_SECRET}:latest"

ENV_VARS="NODE_ENV=production,APP_BASE_URL=${APP_BASE_URL},API_URL=${API_URL},NEXT_PUBLIC_API_URL=${API_URL},NEXT_PUBLIC_AUTH0_CONFIGURED=true"

if gcloud secrets describe "$CLIENT_ID_SECRET" >/dev/null 2>&1; then
  echo "Using AUTH0_CLIENT_ID from Secret Manager ($CLIENT_ID_SECRET)"
  SECRET_BINDINGS="${SECRET_BINDINGS},AUTH0_CLIENT_ID=${CLIENT_ID_SECRET}:latest"
  gcloud secrets add-iam-policy-binding "$CLIENT_ID_SECRET" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  echo "  OK AUTH0_CLIENT_ID"
else
  ENV_VARS="${ENV_VARS},AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}"
fi

echo "Updating Cloud Run service: $SERVICE_NAME ($GCP_REGION)"

# When switching AUTH0_CLIENT_ID from secret → env var, remove the secret binding first.
if ! gcloud secrets describe "$CLIENT_ID_SECRET" >/dev/null 2>&1; then
  CURRENT_CLIENT_ID_TYPE="$(gcloud run services describe "$SERVICE_NAME" \
    --region="$GCP_REGION" \
    --format='value(spec.template.spec.containers[0].env.filter(name=AUTH0_CLIENT_ID).valueFrom.secretKeyRef.name)' 2>/dev/null || true)"
  if [[ -n "$CURRENT_CLIENT_ID_TYPE" ]]; then
    echo "Removing secret binding for AUTH0_CLIENT_ID (will use env var instead)"
    gcloud run services update "$SERVICE_NAME" \
      --region="$GCP_REGION" \
      --remove-secrets=AUTH0_CLIENT_ID \
      --quiet
  fi
fi

gcloud run services update "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --port="$CONTAINER_PORT" \
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
echo "  (Optional wildcard)     ${APP_BASE_URL}/*"
echo "  Allowed Web Origins:    ${APP_BASE_URL}"
echo ""
echo "If admin and web use different Auth0 apps, store each client secret separately"
echo "(e.g. AUTH0_ADMIN_CLIENT_SECRET) and run with:"
echo "  CLIENT_SECRET_SECRET=AUTH0_ADMIN_CLIENT_SECRET ./scripts/gcp/configure-cloud-run-frontend.sh admin"
