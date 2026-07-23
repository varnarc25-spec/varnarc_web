# Cost optimization

## Cloud Run

| Setting | Staging | Production |
|---------|---------|------------|
| `min-instances` | 0 | 0–1 (trade cold start vs cost) |
| `max-instances` | 5 | 10–20 |
| `memory` | 512Mi | 512Mi–1Gi |
| `cpu` | 1 | 1 |
| `concurrency` | 80–100 | Tune per latency |

Start with `min-instances=0` until traffic justifies always-warm instances.

## Artifact Registry

- Retain last N image tags; delete old digests with cleanup policy
- Use commit SHA tags in CI; `latest` only on main if needed

## Neon

- Use appropriate compute tier; scale to zero on dev branches
- Delete unused preview branches

## Redis

- Right-size memory; use TTL-heavy workloads on cache only

## Egress

- Keep Cloud Run, Neon, and Redis in the same region (`asia-southeast1`) when possible
- Use Cloudinary transforms instead of serving large originals

## Monitoring spend

- Set budget alerts in GCP Billing
- Review Cloud Run instance hours monthly
