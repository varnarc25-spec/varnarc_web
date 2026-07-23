#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:?Usage: $0 api|web|admin}"
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
GCP_REGION="${GCP_REGION:-asia-southeast1}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SERVICE_SUFFIX="${SERVICE_SUFFIX:-}"
AR_REPO="${AR_REPO:-varnarc}"

REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
IMAGE="${REGISTRY}/${SERVICE}:${IMAGE_TAG}"
NAME="varnarc-${SERVICE}${SERVICE_SUFFIX}"

case "$SERVICE" in
  api)
    PORT=4000
    WANT_SECRETS=(DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE REDIS_URL OPENSEARCH_URL OPENSEARCH_USERNAME OPENSEARCH_PASSWORD)
    ENV_VARS="NODE_ENV=production,API_PORT=4000,APP_VERSION=${IMAGE_TAG},SEARCH_ENGINE=opensearch,OPENSEARCH_INDEX=varnarc-search,ADSENSE_SYNC_ENABLED=true,ADSENSE_CURRENCY=INR"
    EXTRA=(--cpu=1 --memory=512Mi --min-instances=0 --max-instances=10 --concurrency=80)
    PROBES=(
      --startup-probe=type=http,path=/api/v1/ready,port=4000,initialDelaySeconds=10,periodSeconds=10,failureThreshold=3
      --liveness-probe=type=http,path=/api/v1/health,port=4000,periodSeconds=30
    )
    ;;
  web)
    PORT=3000
    WANT_SECRETS=(AUTH0_SECRET AUTH0_CLIENT_SECRET)
    ENV_VARS="NODE_ENV=production,PORT=3000"
    EXTRA=(--cpu=1 --memory=512Mi --min-instances=0 --max-instances=20 --concurrency=100)
    PROBES=()
    ;;
  admin)
    PORT=3001
    WANT_SECRETS=(AUTH0_SECRET AUTH0_CLIENT_SECRET)
    ENV_VARS="NODE_ENV=production,PORT=3001"
    EXTRA=(--cpu=1 --memory=512Mi --min-instances=0 --max-instances=5 --concurrency=50)
    PROBES=()
    ;;
  *)
    echo "Unknown service: $SERVICE"
    exit 1
    ;;
esac

SECRET_PAIRS=()
for secret_name in "${WANT_SECRETS[@]}"; do
  if gcloud secrets describe "$secret_name" >/dev/null 2>&1; then
    SECRET_PAIRS+=("${secret_name}=${secret_name}:latest")
  fi
done

CMD=(
  gcloud run deploy "$NAME"
  --image "$IMAGE"
  --region "$GCP_REGION"
  --platform managed
  --allow-unauthenticated
  --port "$PORT"
  --set-env-vars "$ENV_VARS"
)

if ((${#SECRET_PAIRS[@]})); then
  IFS=,
  CMD+=(--set-secrets "${SECRET_PAIRS[*]}")
  unset IFS
fi

CMD+=("${EXTRA[@]}" "${PROBES[@]}")

"${CMD[@]}"

echo "Deployed $NAME"
