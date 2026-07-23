# Multi-region cache invalidation

## Modes

| Setup | Invalidation channel | When to use |
|-------|---------------------|-------------|
| **Global Redis** (Upstash Global) | Redis pub/sub `varnarc:cache:invalidate` | Simplest multi-region |
| **Regional Redis** | GCP Pub/Sub topic + per-region subscription | Data residency / regional Redis |
| **Single region** | Local clear only | Default dev/staging |

## Bootstrap Pub/Sub

```bash
export GCP_PROJECT_ID=your-project
./deploy/gcp/setup-pubsub-cache.sh
```

## Environment (each API region)

```bash
REDIS_URL=redis://...                    # global or regional
GCP_PROJECT_ID=your-project
CACHE_PUBSUB_TOPIC=varnarc-cache-invalidate
CACHE_PUBSUB_SUBSCRIPTION=varnarc-cache-invalidate-sub
CACHE_INVALIDATION_SUBSCRIBE=true        # set false on one-shot workers if needed
APP_REGION=asia-southeast1               # optional metadata
```

## How it works

1. Admin or CMS calls `POST /api/v1/performance/cache/clear` (or publish from CMS on save — future hook).
2. API clears **local** Redis keys for the scope.
3. `CacheInvalidationService` publishes prefixes to Redis channel and/or Pub/Sub.
4. All subscribed API instances in other regions receive the message and clear matching keys.

## Global Redis (recommended first)

Use **Upstash Global** or Redis Cloud Active-Active with a single `REDIS_URL` on all Cloud Run regions. Invalidation via Redis pub/sub is sufficient; Pub/Sub optional.

## CDN layer

Pair with edge CDN (`deploy/cdn/README.md`) for public static assets — CDN purge is separate from API cache invalidation.
