#!/usr/bin/env bash
set -euo pipefail
curl -sf "http://localhost:4000/api/v1/health" | head -c 200
echo
