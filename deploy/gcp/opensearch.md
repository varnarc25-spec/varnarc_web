# OpenSearch (production search)

Production uses **OpenSearch** for search reads by default. Postgres FTS remains the indexing source of truth via dual-write unless `SEARCH_ENGINE_DUAL_WRITE=false`.

## Resolution rules

| Environment | Default engine | Override |
|-------------|----------------|----------|
| `NODE_ENV=production` | `opensearch` | `SEARCH_ENGINE=postgres-fts` |
| Local / staging | `postgres-fts` | `SEARCH_ENGINE=opensearch` |

Production startup **requires** `OPENSEARCH_URL` when the resolved engine is `opensearch`. Set `SEARCH_ENGINE=postgres-fts` only if you intentionally stay on Postgres FTS in production.

## Managed providers

| Provider | Notes |
|----------|--------|
| [AWS OpenSearch Service](https://aws.amazon.com/opensearch-service/) | Common for multi-AZ; use HTTPS endpoint |
| [Elastic Cloud](https://www.elastic.co/cloud) | OpenSearch-compatible serverless/managed |
| Self-hosted on GKE/VM | Single-node for staging; 3+ data nodes for prod |

## Secret Manager (production)

Add to `deploy/gcp/secrets.env` (see `secrets.env.example`):

```bash
SEARCH_ENGINE=opensearch
OPENSEARCH_URL=https://your-cluster.example.com
OPENSEARCH_INDEX=varnarc-search
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=
```

Sync secrets:

```bash
export GCP_PROJECT_ID=your-project
./deploy/gcp/setup-secrets.sh
```

`scripts/gcp/cloud-run-deploy.sh` sets `SEARCH_ENGINE=opensearch` on the API service and mounts `OPENSEARCH_*` secrets when present.

## Cloud Run checklist

1. Create or provision an OpenSearch cluster (HTTPS, auth recommended).
2. Store `OPENSEARCH_URL` (+ credentials) in Secret Manager.
3. Deploy API — `/api/v1/ready` reports `searchEngine` and `opensearch` status.
4. Run a full reindex from admin **Search → Reindex** (or `POST /api/v1/search/reindex`).
5. Confirm `GET /api/v1/search/index` shows `openSearch.status: up`.

## Local Docker (optional)

```bash
docker compose -f docker/docker-compose.infra.yml --profile search up -d
```

In `.env`:

```bash
SEARCH_ENGINE=opensearch
OPENSEARCH_URL=http://localhost:9200
OPENSEARCH_INDEX=varnarc-search
```

Full stack with OpenSearch:

```bash
docker compose -f docker/docker-compose.yml --profile search up --build
```

## Tuning

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENSEARCH_SHARDS` | `1` | Index shards |
| `OPENSEARCH_REPLICAS` | `1` | Replica count |
| `OPENSEARCH_REFRESH_INTERVAL` | `30s` | Index refresh |
| `OPENSEARCH_TIMEOUT_MS` | `3000` | Client timeout |
| `SEARCH_ENGINE_DUAL_WRITE` | `true` | Postgres + OpenSearch writes; set `false` for OpenSearch-only writes |

## Rollback

Set `SEARCH_ENGINE=postgres-fts` on the API service and redeploy. Postgres `search_index` remains authoritative; no data loss if dual-write was enabled.

## Related

- [neon-redis.md](./neon-redis.md) — other external services
- [../../apps/api/src/modules/search/README.md](../../apps/api/src/modules/search/README.md) — API module
