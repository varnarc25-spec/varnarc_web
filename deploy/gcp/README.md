# Google Cloud Platform — Varnarc

GCP hosts **Cloud Run** services; Neon, Auth0, Cloudinary, and managed Redis stay external.

## Architecture

```
Users → (optional CDN/LB) → Cloud Run (web, admin, api)
                              ↓
                    Neon · Redis · Auth0 · Cloudinary
                              ↓
                    Cloud Logging · Cloud Monitoring
```

## Quick start (one-time project setup)

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=asia-southeast1
chmod +x deploy/gcp/*.sh scripts/gcp/*.sh
./deploy/gcp/setup-project.sh
./deploy/gcp/setup-workload-identity.sh   # GitHub Actions OIDC
./deploy/gcp/setup-secrets.sh             # from deploy/gcp/secrets.env (not committed)
```

## Deploy manually

```bash
export GCP_PROJECT_ID=your-project-id
export IMAGE_TAG=latest
./scripts/gcp/deploy-all.sh
```

## GitHub Actions

Configure repository secrets (see [iam-and-secrets.md](./iam-and-secrets.md)):

| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | Project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name |
| `GCP_SERVICE_ACCOUNT` | Deploy SA email |
| `DATABASE_URL` | Prisma migrate in CI |
| `SMOKE_TEST_*_URL` | Post-deploy smoke |

Workflow: `.github/workflows/deploy.yml` builds images, pushes to Artifact Registry, deploys Cloud Run with health probes and Secret Manager bindings.

## Documentation index

| Doc | Topic |
|-----|--------|
| [iam-and-secrets.md](./iam-and-secrets.md) | IAM roles, Secret Manager, GitHub secrets |
| [custom-domains.md](./custom-domains.md) | DNS + managed SSL on Cloud Run |
| [monitoring.md](./monitoring.md) | Logging, metrics, alerts |
| [disaster-recovery.md](./disaster-recovery.md) | DR runbook |
| [neon-redis.md](./neon-redis.md) | External data services |
| [opensearch.md](./opensearch.md) | Production search (OpenSearch) |
| [adsense-sync.md](./adsense-sync.md) | AdSense API revenue sync |
| [catalog-import.md](./catalog-import.md) | Large-scale catalog CSV import |
| [cost-optimization.md](./cost-optimization.md) | Scaling and cost controls |

## Cloud Run services

| Service | Image | Port | Secrets (typical) |
|---------|-------|------|-------------------|
| `varnarc-api` | `api` | 4000 | `DATABASE_URL`, Auth0, `REDIS_URL` |
| `varnarc-web` | `web` | 3000 | Auth0 client (runtime) |
| `varnarc-admin` | `admin` | 3001 | Auth0 client (runtime) |

Staging services use suffix `-staging` (branch `develop`).

## Related

- [../cloud-run/README.md](../cloud-run/README.md) — image build reference
- [../../docker/README.md](../../docker/README.md) — local containers
- [../../docs/28-Deployment-IMPLEMENTATION.md](../../docs/28-Deployment-IMPLEMENTATION.md) — CI/CD overview
