# Google Cloud Run deployment

Deploy three services from the monorepo Docker images:

| Service | Image | Port | Dockerfile |
|---------|-------|------|------------|
| `varnarc-api` | API | 4000 | `docker/Dockerfile.api` |
| `varnarc-web` | Public site | 3000 | `docker/Dockerfile.web` |
| `varnarc-admin` | Admin portal | 3001 | `docker/Dockerfile.admin` |

## Prerequisites

- GCP project with Artifact Registry and Cloud Run enabled
- GitHub secrets (see `.github/workflows/deploy.yml`)
- Neon `DATABASE_URL` (production/staging)
- Auth0 apps for web + admin + API audience
- Optional: Redis (`REDIS_URL`) for cache and BullMQ

## Build and push images

```bash
export GCP_PROJECT_ID=your-project
export GCP_REGION=asia-southeast1
export REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/varnarc"

gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev"

docker build -f docker/Dockerfile.api -t "${REGISTRY}/api:latest" .
docker build -f docker/Dockerfile.web -t "${REGISTRY}/web:latest" .
docker build -f docker/Dockerfile.admin -t "${REGISTRY}/admin:latest" .

docker push "${REGISTRY}/api:latest"
docker push "${REGISTRY}/web:latest"
docker push "${REGISTRY}/admin:latest"
```

## Run migrations (before or during deploy)

```bash
./scripts/deploy/migrate.sh
```

Or run a one-off Cloud Run job with the API image and command `pnpm --filter @varnarc/database migrate:deploy`.

## Deploy API

```bash
gcloud run deploy varnarc-api \
  --image "${REGISTRY}/api:latest" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 4000 \
  --min-instances 0 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,API_PORT=4000" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,AUTH0_DOMAIN=AUTH0_DOMAIN:latest,AUTH0_AUDIENCE=AUTH0_AUDIENCE:latest" \
  --startup-probe httpGet.path=/api/v1/ready,httpGet.port=4000,initialDelaySeconds=10,periodSeconds=10,failureThreshold=3 \
  --liveness-probe httpGet.path=/api/v1/health,httpGet.port=4000,periodSeconds=30
```

Repeat for `varnarc-web` and `varnarc-admin` with their ports and public URLs in env vars (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, etc.).

## Post-deploy smoke test

```bash
API_URL=https://your-api-url/api/v1 \
WEB_URL=https://your-web-url \
ADMIN_URL=https://your-admin-url \
  ./scripts/deploy/smoke-test.sh
```

## Rollback

```bash
# List revisions
gcloud run revisions list --service varnarc-api --region "${GCP_REGION}"

# Route 100% traffic to a previous revision
gcloud run services update-traffic varnarc-api \
  --region "${GCP_REGION}" \
  --to-revisions REVISION_NAME=100
```

Database rollback: use Neon point-in-time recovery or restore backup; only reverse Prisma migrations when safe.

See `deploy/gcp/README.md` for full GCP setup (IAM, Secret Manager, Workload Identity).

## Environments

| Environment | Branch | Cloud Run suffix | Approval |
|-------------|--------|------------------|----------|
| Staging | `develop` | `-staging` | Automatic on push |
| Production | `main` | (none) | GitHub environment protection |

See `deploy/environments.md` for variable matrix.
