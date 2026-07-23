#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SERVICE_SUFFIX="${SERVICE_SUFFIX:-}"

export GCP_PROJECT_ID IMAGE_TAG SERVICE_SUFFIX

for svc in api web admin; do
  bash scripts/gcp/cloud-run-deploy.sh "$svc"
done

echo "All services deployed."
