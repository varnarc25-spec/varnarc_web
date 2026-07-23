# IAM and secrets

## Service accounts

| Account | Purpose |
|---------|---------|
| `varnarc-deploy@…` | CI/CD — push images, deploy Cloud Run, read secrets |
| Cloud Run runtime SA (default compute) | Access Secret Manager secrets mounted on services |

Create deploy SA: `./deploy/gcp/setup-project.sh`

## Deploy SA roles

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`

## Workload Identity (GitHub Actions)

Run `./deploy/gcp/setup-workload-identity.sh` with `GITHUB_REPO=org/repo`.

Adds `roles/iam.workloadIdentityUser` so GitHub Actions can impersonate the deploy SA without JSON keys.

## Secret Manager

### Create secrets

1. Copy `secrets.env.example` → `secrets.env` (gitignored)
2. Fill values
3. Run `./deploy/gcp/setup-secrets.sh`

### Secret → Cloud Run mapping

| Secret | Services |
|--------|----------|
| `DATABASE_URL` | api |
| `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` | api |
| `REDIS_URL` | api |
| `AUTH0_SECRET`, `AUTH0_CLIENT_SECRET` | web, admin |

Non-secret config (public URLs) uses `--set-env-vars` in `scripts/gcp/cloud-run-deploy.sh`. Set `NEXT_PUBLIC_*` at **Docker build time** for web/admin images.

### Runtime SA access

Grant the Cloud Run service account `secretAccessor` on each secret:

```bash
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Or use a dedicated runtime SA per service (recommended for production).

## GitHub repository secrets

| Secret | Required |
|--------|----------|
| `GCP_PROJECT_ID` | Yes (for deploy) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Yes |
| `GCP_SERVICE_ACCOUNT` | Yes |
| `DATABASE_URL` | Yes (migrate job) |
| `SMOKE_TEST_API_URL` | Optional |
| `SMOKE_TEST_WEB_URL` | Optional |
| `SMOKE_TEST_ADMIN_URL` | Optional |

Never store application secrets in GitHub if using Secret Manager for runtime — use Secret Manager as source of truth and WIF for deploy auth only.

## Environment isolation

| Environment | GCP project | Cloud Run suffix |
|-------------|-------------|------------------|
| Staging | `varnarc-staging` (recommended) | `-staging` |
| Production | `varnarc-prod` | (none) |

Use separate Neon branches and Auth0 tenants per environment when possible.
