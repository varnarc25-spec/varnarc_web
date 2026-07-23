#!/usr/bin/env bash
# Grant Secret Manager access to the Cloud Run runtime service account.
# Use when you see: Permission denied on secret ... for Revision service account
#
# Usage:
#   export GCP_PROJECT_ID=myweb-503314
#   ./scripts/gcp/grant-secret-accessor.sh DATABASE_URL
#   ./scripts/gcp/grant-secret-accessor.sh DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-varnarc-api}"

if (($# < 1)); then
  echo "Usage: $0 SECRET_NAME [SECRET_NAME ...]"
  echo "Example: $0 DATABASE_URL"
  exit 1
fi

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')"
DEFAULT_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Use the SA configured on the service, or the project default compute SA.
CONFIGURED_SA="$(gcloud run services describe "$SERVICE_NAME" \
  --region="$GCP_REGION" \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || true)"

if [[ -n "$CONFIGURED_SA" ]]; then
  RUNTIME_SA="$CONFIGURED_SA"
else
  RUNTIME_SA="$DEFAULT_SA"
fi

echo "Project:        $GCP_PROJECT_ID ($PROJECT_NUMBER)"
echo "Cloud Run:      $SERVICE_NAME ($GCP_REGION)"
echo "Runtime SA:     $RUNTIME_SA"
echo ""

for SECRET in "$@"; do
  if ! gcloud secrets describe "$SECRET" >/dev/null 2>&1; then
    echo "ERROR: Secret '$SECRET' does not exist in project $GCP_PROJECT_ID"
    exit 1
  fi

  echo "Granting roles/secretmanager.secretAccessor on $SECRET ..."
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

  if gcloud secrets get-iam-policy "$SECRET" --format=json \
    | grep -q "${RUNTIME_SA}"; then
    echo "  Verified: $RUNTIME_SA can access $SECRET"
  else
    echo "  WARNING: binding may not have applied — check IAM in console"
  fi
  echo ""
done

echo "Wait 30–60 seconds for IAM to propagate, then update Cloud Run:"
echo "  gcloud run services update $SERVICE_NAME --region=$GCP_REGION \\"
echo "    --set-secrets=DATABASE_URL=DATABASE_URL:latest"
