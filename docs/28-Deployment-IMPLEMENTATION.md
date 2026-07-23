# Implementation status — 28 Deployment Module

Deployment is **infrastructure and operations**, not a runtime feature module. Required scope is delivered via Docker, GitHub Actions, health probes, scripts, and admin visibility.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Multi-environment strategy documented | Done — `deploy/environments.md` |
| Docker Compose local stack (api, web, admin, redis) | Done |
| Production Dockerfiles (api, web, admin) | Pre-existing, healthchecks added |
| GitHub Actions CI (`ci.yml`) | Pre-existing |
| GitHub Actions deploy pipeline (`deploy.yml`) | Done — migrate, build, push, Cloud Run, smoke |
| Prisma migrate deploy script | Done — `scripts/deploy/migrate.sh` |
| Smoke test script | Done — `scripts/deploy/smoke-test.sh` |
| Cloud Run deploy guide | Done — `deploy/cloud-run/README.md` |
| Startup env validation (API) | Done — `apps/api/src/config/startup-env.ts` |
| Deep readiness (`/ready`) — DB + Redis ping | Done |
| Liveness (`/health`) | Done |
| Admin system pages (`/system/status`, `/system/health`, `/system/version`) | Done |
| Rollback procedures documented | Done — Cloud Run revision traffic |

## Operational endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Liveness |
| `GET /api/v1/ready` | Readiness (503 if DB/Redis down) |
| `GET /api/v1/status` | Ops summary + 24h API metrics |
| `GET /api/v1/version` | Version metadata |

## Key paths

| Area | Path |
|------|------|
| Docker Compose | `docker/docker-compose.yml` |
| Dockerfiles | `docker/Dockerfile.*` |
| CI | `.github/workflows/ci.yml` |
| CD | `.github/workflows/deploy.yml` |
| Deploy scripts | `scripts/deploy/` |
| Cloud Run docs | `deploy/cloud-run/README.md` |
| Health service | `apps/api/src/health/` |
| Admin system UI | `apps/admin/src/app/system/` |

## Root scripts

```bash
pnpm docker:up          # Build and run full stack
pnpm docker:down
pnpm deploy:migrate     # prisma migrate deploy
pnpm deploy:smoke       # curl health/status/version/ready
```

## GitHub secrets (when enabling GCP deploy)

| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | Artifact Registry + Cloud Run |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | OIDC |
| `GCP_SERVICE_ACCOUNT` | Deploy identity |
| `DATABASE_URL` | Migration job |
| `SMOKE_TEST_API_URL` | Optional post-deploy smoke |

Without GCP secrets, the pipeline still **builds images** and skips push/deploy gracefully.

## Deployment flow

```
PR → CI (typecheck, build, tests)
     ↓
merge to develop/main
     ↓
migrate deploy (Neon)
     ↓
docker build (api, web, admin)
     ↓
push to Artifact Registry (if configured)
     ↓
gcloud run deploy (staging suffix on develop)
     ↓
smoke tests (if URLs configured)
```

## Deferred

- Terraform / IaC modules
- Blue/green and canary releases
- OpenTelemetry / Prometheus / Grafana stack deployment
- Automated Neon backups configuration
- Kubernetes manifests
- Structured JSON logging driver (app still uses Nest Logger)
- Cloudinary connectivity probe in `/ready`

## Related docs

- **29 Docker** — container details (image hardening, multi-stage builds)
- **30 Google Cloud** — GCP project setup, IAM, Secret Manager
