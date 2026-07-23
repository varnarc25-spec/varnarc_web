# Disaster recovery

## RTO / RPO targets (guidance)

| Component | RPO | Recovery |
|-----------|-----|----------|
| Cloud Run | Redeploy last image | Minutes — rollback revision |
| Neon PostgreSQL | Neon plan PITR | Restore branch / PITR |
| Redis | Cache only | Rebuild; queue jobs may replay |
| Cloudinary | Provider SLA | Re-upload from backup export |
| Auth0 | Provider SLA | Use Auth0 tenant backup/export |
| Secret Manager | Version history | Roll back secret version |

## Cloud Run failure

1. Check Cloud Run status and recent revisions
2. Roll traffic to last good revision (see `deploy/cloud-run/README.md`)
3. Re-deploy from last known-good image tag in Artifact Registry

## Region failure

- Deploy to secondary region (manual today; multi-region is future)
- Update DNS to point to healthy region
- Neon: create read replica or restore in another region per Neon docs

## Database (Neon)

1. Use Neon dashboard → **Restore** or point-in-time recovery
2. Update `DATABASE_URL` secret if connection string changes
3. Redeploy API or restart Cloud Run to pick up new secret version

Do **not** run `prisma migrate reset` on production.

## Redis outage

- API falls back to in-memory cache when `REDIS_URL` unset; with Redis configured, `/ready` returns 503
- Restore Redis instance; BullMQ queues may need manual replay for critical jobs

## Secret compromise

1. Rotate value in Secret Manager (`gcloud secrets versions add`)
2. Redeploy affected Cloud Run services
3. Rotate Auth0 client secrets / API keys as needed
4. Audit `audit_logs` and `api_request_logs`

## Configuration recovery

- Application code: Git
- Infrastructure scripts: `deploy/gcp/`
- Settings: export from admin Settings module (future import/export)

## Contacts / runbook

Document on-call contacts and escalation outside this repo. Test restore from Neon backup quarterly.
