#!/usr/bin/env bash
# Create or update Secret Manager secrets from deploy/gcp/secrets.env
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
SECRETS_FILE="${SECRETS_FILE:-deploy/gcp/secrets.env}"

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Copy deploy/gcp/secrets.env.example to deploy/gcp/secrets.env and fill values."
  exit 1
fi

gcloud config set project "$GCP_PROJECT_ID"

# shellcheck disable=SC1090
set -a && source "$SECRETS_FILE" && set +a

declare -A SECRETS=(
  [DATABASE_URL]="${DATABASE_URL:-}"
  [AUTH0_DOMAIN]="${AUTH0_DOMAIN:-}"
  [AUTH0_AUDIENCE]="${AUTH0_AUDIENCE:-}"
  [AUTH0_CLIENT_SECRET]="${AUTH0_CLIENT_SECRET:-}"
  [AUTH0_SECRET]="${AUTH0_SECRET:-}"
  [REDIS_URL]="${REDIS_URL:-}"
  [OPENSEARCH_URL]="${OPENSEARCH_URL:-}"
  [OPENSEARCH_USERNAME]="${OPENSEARCH_USERNAME:-}"
  [OPENSEARCH_PASSWORD]="${OPENSEARCH_PASSWORD:-}"
  [ADSENSE_OAUTH_CLIENT_ID]="${ADSENSE_OAUTH_CLIENT_ID:-}"
  [ADSENSE_OAUTH_CLIENT_SECRET]="${ADSENSE_OAUTH_CLIENT_SECRET:-}"
  [ADSENSE_OAUTH_REFRESH_TOKEN]="${ADSENSE_OAUTH_REFRESH_TOKEN:-}"
  [GCS_BUCKET]="${GCS_BUCKET:-}"
  [GCS_CLIENT_EMAIL]="${GCS_CLIENT_EMAIL:-}"
  [GCS_PRIVATE_KEY]="${GCS_PRIVATE_KEY:-}"
)

for name in "${!SECRETS[@]}"; do
  value="${SECRETS[$name]}"
  [[ -n "$value" ]] || continue

  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=-
    echo "Updated secret: $name"
  else
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=-
    echo "Created secret: $name"
  fi
done

echo "Secrets synced."
