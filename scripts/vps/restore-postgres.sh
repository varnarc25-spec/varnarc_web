#!/usr/bin/env bash
# Restore a gzip SQL dump into the VPS Postgres container.
# DESTRUCTIVE for objects in the target database. Does not modify Neon.
# Usage: bash scripts/vps/restore-postgres.sh backups/varnarc-YYYYMMDD.sql.gz
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FILE="${1:-}"
if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: $0 path/to/backup.sql.gz" >&2
  exit 1
fi

COMPOSE=(docker compose -f docker/docker-compose.vps.yml --env-file .env.production)

echo "Restoring $FILE into the postgres service (existing objects may be overwritten)."
gunzip -c "$FILE" | "${COMPOSE[@]}" exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
echo "Restore finished. Restart API if it was running during restore:"
echo "  ${COMPOSE[*]} restart api"
