#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export DOCKER_BUILDKIT=1
COMPOSE_FILE="docker/docker-compose.yml"

echo "Validating Compose configuration..."
docker compose -f "$COMPOSE_FILE" config >/dev/null
docker compose -f docker/docker-compose.infra.yml config >/dev/null

echo "Building API image..."
docker build -f docker/Dockerfile.api -t varnarc-api:validate .

echo "Docker validation passed."
