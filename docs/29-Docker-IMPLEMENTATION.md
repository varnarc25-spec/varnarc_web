# Implementation status — 29 Docker Module

## Required scope (delivered)

| Area | Status |
|------|--------|
| Multi-stage Dockerfiles (api, web, admin) | Done |
| Non-root `varnarc` user in runtime images | Done |
| `HEALTHCHECK` in all app images | Done |
| `.dockerignore` for smaller, safer builds | Done |
| Docker Compose full stack (api, web, admin, redis) | Done |
| Compose profile `local-db` (PostgreSQL) | Done |
| Compose profile `tools` (MailHog, pgAdmin) | Done |
| Isolated networks (`varnarc_internal`, `varnarc_public`) | Done |
| Redis persistent volume | Done |
| Infra-only compose for host hot reload | Done — `docker-compose.infra.yml` |
| BuildKit enabled in scripts/CI | Done |
| Prisma generate in API image build | Done |
| Next.js build args for public URLs | Done |
| Trivy security scan in deploy pipeline | Done (non-blocking) |
| Local workflow documentation | Done — `docker/README.md` |
| Validate script | Done — `scripts/docker/validate.sh` |

## Pre-existing (from 28 Deployment)

| Area | Location |
|------|----------|
| Cloud Run deploy guide | `deploy/cloud-run/README.md` |
| GitHub Actions image build + push | `.github/workflows/deploy.yml` |
| Smoke tests | `scripts/deploy/smoke-test.sh` |

## Root scripts

```bash
pnpm docker:up        # Full production-like stack
pnpm docker:down
pnpm docker:infra     # Redis + optional local Postgres for pnpm dev
pnpm docker:validate  # compose config + API image build
```

## Compose profiles

| Profile | Services |
|---------|----------|
| (default) | redis, api, web, admin |
| `local-db` | + postgres |
| `tools` | + mailhog, pgadmin (use with `local-db` for pgAdmin) |

Example:

```bash
docker compose -f docker/docker-compose.yml --profile local-db --profile tools up --build
```

## Image summary

| Image | Base | Port | User |
|-------|------|------|------|
| `Dockerfile.api` | node:20-alpine | 4000 | varnarc |
| `Dockerfile.web` | node:20-alpine | 3000 | varnarc |
| `Dockerfile.admin` | node:20-alpine | 3001 | varnarc |

## Recommended local dev workflow

**Option A — full Docker:** `pnpm docker:up` (uses Neon `DATABASE_URL` from `.env` or local Postgres with `--profile local-db`).

**Option B — hot reload (recommended):**

```bash
pnpm docker:infra          # Redis (+ Postgres if needed)
pnpm dev                   # Turborepo dev on host
```

## Deferred

- Dedicated dev images with bind mounts + hot reload inside containers
- Multi-arch (`linux/arm64`) builds
- `pnpm deploy` pruned production `node_modules` (images still copy full `node_modules` for reliability)
- Read-only root filesystem
- Helm / Kubernetes manifests
- Docker Swarm

## Related docs

- **28 Deployment** — CI/CD, Cloud Run, migrations
- **30 Google Cloud** — GCP project, Artifact Registry, IAM
