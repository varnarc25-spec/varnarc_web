# Implementation status — 30 Google Cloud Module

GCP infrastructure is **documentation + automation scripts** integrated with existing Docker and GitHub Actions from modules 28–29.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Cloud Run architecture (web, admin, api) | Done |
| Artifact Registry bootstrap | Done — `setup-project.sh` |
| Secret Manager workflow | Done — `setup-secrets.sh` + `secrets.env.example` |
| Workload Identity for GitHub Actions | Done — `setup-workload-identity.sh` |
| Unified Cloud Run deploy script (secrets, probes, scaling) | Done — `scripts/gcp/cloud-run-deploy.sh` |
| CI uses deploy script + `latest` tags on main | Done — `.github/workflows/deploy.yml` |
| IAM documentation | Done — `deploy/gcp/iam-and-secrets.md` |
| Custom domains + managed SSL | Done — `deploy/gcp/custom-domains.md` |
| Monitoring & alerting guide | Done — `deploy/gcp/monitoring.md` |
| Disaster recovery runbook | Done — `deploy/gcp/disaster-recovery.md` |
| Neon + Redis integration docs | Done — `deploy/gcp/neon-redis.md` |
| Cost optimization | Done — `deploy/gcp/cost-optimization.md` |
| Admin ops pages (from 28) | Done — `/system/*` |
| GCS media integration (app code) | Pre-existing — `gcs-storage.service.ts` |

## Key paths

| Path | Purpose |
|------|---------|
| `deploy/gcp/README.md` | Entry point |
| `deploy/gcp/setup-project.sh` | Enable APIs, AR repo, deploy SA |
| `deploy/gcp/setup-workload-identity.sh` | GitHub OIDC |
| `deploy/gcp/setup-secrets.sh` | Sync Secret Manager |
| `scripts/gcp/cloud-run-deploy.sh` | Per-service deploy |
| `scripts/gcp/deploy-all.sh` | Deploy api + web + admin |

## One-time setup

```bash
export GCP_PROJECT_ID=your-project
export GCP_REGION=asia-southeast1
export GITHUB_REPO=org/varnarc_web

./deploy/gcp/setup-project.sh
./deploy/gcp/setup-workload-identity.sh
cp deploy/gcp/secrets.env.example deploy/gcp/secrets.env
# edit secrets.env
./deploy/gcp/setup-secrets.sh
```

## Deploy

```bash
export GCP_PROJECT_ID=your-project
export IMAGE_TAG=latest
pnpm gcp:deploy
```

Or rely on GitHub Actions `deploy.yml` on push to `main` / `develop`.

## External services (not on GCP)

| Service | Role |
|---------|------|
| Neon | PostgreSQL |
| Auth0 | Authentication |
| Cloudinary / GCS | Media |
| Upstash / Memorystore | Redis |

## Deferred

- Terraform / IaC modules
- GKE migration
- Cloud Armor, Cloud CDN, global LB
- Cloud Scheduler jobs in repo
- Pub/Sub, Cloud Tasks
- Vertex AI / BigQuery
- Automated alert creation via gcloud
- Dedicated Cloud Run runtime service accounts (documented, not scripted per-env)

## Related

- **28 Deployment** — CI/CD, health checks
- **29 Docker** — images consumed by Cloud Run
