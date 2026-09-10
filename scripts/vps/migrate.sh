#!/usr/bin/env bash
# Apply Prisma migrations using DATABASE_URL from .env.production.
# Run from the cloned monorepo on the VPS. Does not modify Neon unless
# DATABASE_URL still points at Neon.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.production
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is empty" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required on the VPS for migrations (corepack enable && corepack prepare pnpm@9.6.0 --activate)." >&2
  exit 1
fi

echo "Applying prisma migrate deploy (target host is taken from DATABASE_URL; values are not printed)."
pnpm --filter @varnarc/database migrate:deploy
echo "Migrations complete."
