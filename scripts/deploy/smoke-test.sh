#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000/api/v1}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
ADMIN_URL="${ADMIN_URL:-http://localhost:3001}"

echo "Smoke testing API at $API_URL"

curl -fsS "$API_URL/health" | head -c 200
echo ""
curl -fsS "$API_URL/version" | head -c 200
echo ""
curl -fsS "$API_URL/status" | head -c 400
echo ""
curl -fsS "$API_URL/ready" | head -c 400
echo ""

echo "Smoke testing web at $WEB_URL"
curl -fsS -o /dev/null -w "web %{http_code}\n" "$WEB_URL"

echo "Smoke testing admin at $ADMIN_URL"
curl -fsS -o /dev/null -w "admin %{http_code}\n" "$ADMIN_URL"

echo "Smoke tests passed."
