#!/usr/bin/env bash
# Logical backup of the VPS Postgres container. Does not touch Neon.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker/docker-compose.vps.yml --env-file .env.production)
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/varnarc-${STAMP}.sql.gz"

echo "Writing $FILE"
"${COMPOSE[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' | gzip > "$FILE"
echo "Done. Keep this file off the VPS as well (copy to object storage)."
