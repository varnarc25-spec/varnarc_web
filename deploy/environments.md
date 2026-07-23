# Environment configuration

Secrets are never committed. Use `.env` locally and GCP Secret Manager / GitHub Actions secrets in cloud.

## Variable priority

1. Environment variables (runtime)
2. Settings module (database-backed, admin UI)
3. Application defaults

## Local development

Copy `.env.example` to `.env` and fill required values. Run:

```bash
pnpm install
pnpm db:migrate   # or ./scripts/deploy/migrate.sh with migrate:deploy
pnpm db:seed
pnpm dev
```

Optional Docker stack:

```bash
pnpm docker:up
```

## Staging

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon staging branch |
| `AUTH0_DOMAIN` | Yes | Staging tenant |
| `AUTH0_AUDIENCE` | Yes | API identifier |
| `AUTH0_CLIENT_ID` / `SECRET` | Yes | Per app (web, admin) |
| `REDIS_URL` | Recommended | Memorystore or Upstash |
| `NEXT_PUBLIC_*_URL` | Yes | Staging URLs |
| `APP_VERSION` | Optional | Set in CI (`git sha`) |

## Production

Same as staging with production Auth0 apps, Neon main branch, and stricter secret rotation.

## CI/CD secrets (GitHub)

| Secret | Purpose |
|--------|---------|
| `GCP_PROJECT_ID` | GCP project |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | OIDC auth |
| `GCP_SERVICE_ACCOUNT` | Deploy SA |
| `DATABASE_URL` | Migrate job (staging/prod env) |

## Health checks

Cloud Run should use:

- **Startup / readiness:** `GET /api/v1/ready` (503 if DB/Redis down)
- **Liveness:** `GET /api/v1/health`
