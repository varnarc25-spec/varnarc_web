#!/usr/bin/env bash
# Purge Cloudflare cache after deploy (optional).
set -euo pipefail

: "${CLOUDFLARE_ZONE_ID:?Set CLOUDFLARE_ZONE_ID}"
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN}"

PATHS="${1:-/_next/static/*}"

curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"files\":[\"https://${WEB_HOST:-varnarc.com}${PATHS}\"]}" | head -c 500

echo ""
echo "Purge requested for ${PATHS}"
