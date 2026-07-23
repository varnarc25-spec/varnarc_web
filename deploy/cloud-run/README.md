# Google Cloud Run deployment

Deploy three services from the monorepo Docker images:

| Service | Image | Port | Dockerfile |
|---------|-------|------|------------|
| `varnarc-api` | API | 4000 | `docker/Dockerfile.api` |
| `varnarc-web` | Public site | 3000 | `docker/Dockerfile.web` |
| `varnarc-admin` | Admin portal | 3001 | `docker/Dockerfile.admin` |

## Deploy from Source (Cloud Run console / GitHub)

### Why every Git push shows the same PORT=8080 error

| What happens on each push | What does NOT happen |
|---------------------------|----------------------|
| Cloud Build builds a new Docker image | Secrets are **not** added from Git |
| Cloud Run deploys that image as a new revision | `DATABASE_URL` / Auth0 are **not** in the repo |
| Container must bind to `PORT=8080` to pass deploy | Pushing code does **not** configure Secret Manager |

**Git deploy only updates the image.** Secrets must be configured **once** on the Cloud Run service (console or `configure-cloud-run-api-secrets.sh`).

This repository is a **pnpm + Turborepo monorepo**. Workspace root files (`package.json`, `pnpm-lock.yaml`, etc.) live at the **repository root**, not inside `docker/`.

### Diagnosing build context

If Cloud Build logs show `Sending build context to Docker daemon ~18kB`, Cloud Run is using **`docker/` as the build context** (not the repo root). The Dockerfiles auto-fetch the full repo from GitHub in that case.

### Recommended Cloud Run settings

| Setting | Value |
|---------|-------|
| **Repository** | `varnarc25-spec/varnarc_web` |
| **Source location / Dockerfile** | `Dockerfile` |
| **Build context directory** | `/` (repository root) |
| **Port** | `3000` |

### If you must keep `docker/Dockerfile.web`

Set **Build context directory** to `/` (repo root), not `docker/`. The Dockerfile path and build context are separate fields in the Cloud Run build configuration.

All three service Dockerfiles (`docker/Dockerfile.web`, `docker/Dockerfile.api`, `docker/Dockerfile.admin`) auto-fetch the full repo when Cloud Run uses `docker/` as build context.

For **api** or **admin** via Cloud Build trigger, use `cloudbuild.yaml` with substitutions:

```bash
# API
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _SERVICE_NAME=api,_DOCKERFILE=docker/Dockerfile.api,_REGION=asia-southeast1

# Admin
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _SERVICE_NAME=admin,_DOCKERFILE=docker/Dockerfile.admin,_REGION=asia-southeast1
```

### API service (Cloud Run source deploy)

Cloud Run injects `PORT=8080` by default. The API listens on `PORT` first (then `API_PORT`, then `4000`).

| Setting | Value |
|---------|-------|
| **Container port** | `8080` (default) or `4000` if you set `API_PORT=4000` and `--port 4000` |
| **Dockerfile** | `docker/Dockerfile.api` |

If you use port `4000`, set **Container port** to `4000` in Cloud Run and add env `API_PORT=4000`.

### API startup failure after successful build

If the image builds but deploy fails with *"failed to start and listen on PORT=8080"*, the container is usually **crashing before `listen()`** — not a port bug.

In production the API **requires** these env vars (see `apps/api/src/config/startup-env.ts`):

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `AUTH0_DOMAIN` | Yes (prod) | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | Yes (prod) | API audience identifier |
| `OPENSEARCH_URL` | Yes (prod default) | Unless you set `SEARCH_ENGINE=postgres-fts` |

**Minimum to get API running without OpenSearch:**

1. Create secrets in Secret Manager (`./deploy/gcp/setup-secrets.sh`)
2. In Cloud Run → **varnarc-api** → **Edit & deploy** → **Variables & secrets**:

| Type | Name | Value |
|------|------|-------|
| Secret | `DATABASE_URL` | `DATABASE_URL:latest` |
| Secret | `AUTH0_DOMAIN` | `AUTH0_DOMAIN:latest` |
| Secret | `AUTH0_AUDIENCE` | `AUTH0_AUDIENCE:latest` |
| Env var | `NODE_ENV` | `production` |
| Env var | `SEARCH_ENGINE` | `postgres-fts` |

3. Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor` on each secret.

**gcloud example** (replace region/project):

```bash
export PROJECT_ID=myweb-503314
export REGION=asia-south1
export RUNTIME_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

for s in DATABASE_URL AUTH0_DOMAIN AUTH0_AUDIENCE; do
  gcloud secrets add-iam-policy-binding "$s" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor"
done

gcloud run services update varnarc-api \
  --region="$REGION" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,AUTH0_DOMAIN=AUTH0_DOMAIN:latest,AUTH0_AUDIENCE=AUTH0_AUDIENCE:latest" \
  --set-env-vars="NODE_ENV=production,SEARCH_ENGINE=postgres-fts"
```

Check logs for the real error:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="varnarc-api"' \
  --limit=20 --format='value(textPayload)'
```

Look for `[startup] Fatal error:` or `Missing required environment variables`.

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
