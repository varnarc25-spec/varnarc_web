# Varnarc Docker

Container images and Compose stacks for local development, CI, and Cloud Run.

## Quick start (full stack)

From the monorepo root (`project/`):

```bash
cp .env.example .env   # fill DATABASE_URL (Neon) and Auth0
export DOCKER_BUILDKIT=1
pnpm docker:up
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api/v1 |
| Redis | localhost:6379 |

## Compose profiles

### Default — app containers + Redis

```bash
docker compose -f docker/docker-compose.yml up --build
```

### Local PostgreSQL (instead of Neon)

```bash
docker compose -f docker/docker-compose.yml --profile local-db up --build
```

Sets `DATABASE_URL=postgresql://varnarc:varnarc@postgres:5432/varnarc` on the API service.

### Developer tools (MailHog + pgAdmin)

```bash
docker compose -f docker/docker-compose.yml --profile tools up -d
```

### OpenSearch (local production-parity search)

```bash
docker compose -f docker/docker-compose.infra.yml --profile search up -d
```

Set in `.env`: `SEARCH_ENGINE=opensearch`, `OPENSEARCH_URL=http://localhost:9200`, then reindex via admin Search.

| Tool | URL |
|------|-----|
| MailHog UI | http://localhost:8025 |
| pgAdmin | http://localhost:5050 |

## Infra-only (recommended for hot reload)

Run Redis/Postgres in Docker, apps on the host with `pnpm dev`:

```bash
pnpm docker:infra
pnpm dev
```

## Build images manually

```bash
export DOCKER_BUILDKIT=1
docker build -f docker/Dockerfile.api -t varnarc-api:local .
docker build -f docker/Dockerfile.web -t varnarc-web:local .
docker build -f docker/Dockerfile.admin -t varnarc-admin:local .
```

Pass build args for public URLs when building web/admin for non-local targets.

## Security

- Images run as non-root `varnarc` user
- No secrets in images — inject via `.env` or Cloud Run secrets
- `.dockerignore` excludes tests, docs, and `.env`
- CI runs Trivy scan on API image (see `.github/workflows/deploy.yml`)

## Health checks

| Service | Probe |
|---------|--------|
| API | `GET /api/v1/health` |
| Web / Admin | HTTP root |
| Redis | `redis-cli ping` |

Cloud Run should use `/api/v1/ready` for startup probes (see `deploy/cloud-run/README.md`).

## Troubleshooting

**API exits on startup** — check `DATABASE_URL` in `.env`. Production mode requires Auth0 vars.

**Web build fails in Docker** — ensure `NEXT_PUBLIC_*` build args match how browsers reach the API.

**Slow builds** — enable BuildKit: `export DOCKER_BUILDKIT=1`.

**Prisma errors in API container** — rebuild after schema changes; image runs `prisma generate` at build time.

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.api` | NestJS API multi-stage image |
| `Dockerfile.web` | Next.js public site (standalone) |
| `Dockerfile.admin` | Next.js admin (standalone) |
| `docker-compose.yml` | Full stack + optional profiles |
| `docker-compose.infra.yml` | Redis/Postgres only for host dev |
