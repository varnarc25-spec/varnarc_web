#!/usr/bin/env bash
# Configure Auth0 env + secrets on varnarc-web and varnarc-admin (production).
# Run after: gcloud auth login
#
# Usage:
#   export GCP_PROJECT_ID=myweb-503314
#   export AUTH0_CLIENT_ID=your-auth0-client-id
#   ./scripts/gcp/fix-production-auth.sh

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${AUTH0_CLIENT_ID:?Set AUTH0_CLIENT_ID}"

export GCP_REGION="${GCP_REGION:-us-central1}"
export API_URL="${API_URL:-https://api.varnarc.com/api/v1}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "=== Configuring varnarc-web ==="
export APP_BASE_URL="${WEB_APP_BASE_URL:-https://varnarc.com}"
./scripts/gcp/configure-cloud-run-frontend.sh web

echo ""
echo "=== Configuring varnarc-admin ==="
export APP_BASE_URL="${ADMIN_APP_BASE_URL:-https://admin.varnarc.com}"
./scripts/gcp/configure-cloud-run-frontend.sh admin

echo ""
echo "Done. Verify:"
echo "  curl -sI https://varnarc.com/auth/login | head -5"
echo "  curl -s https://varnarc.com/ | tr ',' '\\n' | grep authConfigured"
