# Neon PostgreSQL and Redis

## Neon (production database)

- No Cloud SQL required
- Use connection pooling URL for serverless (Cloud Run): Neon **pooled** connection string
- Run migrations before deploy: `pnpm deploy:migrate` or CI migrate job
- Branches: `main` (prod), `staging` (staging)

### CI migration

`.github/workflows/deploy.yml` runs `prisma migrate deploy` with `DATABASE_URL` from GitHub secrets (staging/production environments).

### Connection limits

Cloud Run scales horizontally — use Neon's pooler and set reasonable `max-instances` on API service.

## Redis (cache + BullMQ)

Options:

| Provider | Notes |
|----------|-------|
| Memorystore for Redis | VPC — needs Serverless VPC connector for Cloud Run |
| Upstash | HTTPS/Redis URL friendly for Cloud Run |
| Redis Cloud | Managed, external URL |

Set `REDIS_URL` in Secret Manager. API uses Redis for cache and optional BullMQ analytics queue.

Without Redis, API uses in-memory cache (`/ready` reports `redis: memory`).

## Cloudinary

Media remains external — no GCS required unless using `GCS_*` for Media Library. Configure in admin / env as documented in Media module.

## Auth0

Separate applications:

- Web (Regular Web App)
- Admin (Regular Web App)
- API (Machine-to-Machine or API identifier as audience)

Callback URLs must match Cloud Run custom domains after DNS cutover.
