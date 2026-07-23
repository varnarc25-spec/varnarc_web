# GCP External HTTPS Load Balancer + Cloud CDN

Use when you need Cloud Armor, single GCP bill, or no Cloudflare.

## Architecture

```
Internet → Global HTTPS LB → Cloud CDN (web only) → Serverless NEG → Cloud Run
                         → API NEG (no CDN) → varnarc-api
                         → Admin NEG (no CDN) → varnarc-admin
```

## Steps (high level)

1. **Reserve static IP** — `gcloud compute addresses create varnarc-lb-ip --global`
2. **Serverless NEGs** (per region/service):

```bash
gcloud compute network-endpoint-groups create varnarc-web-neg \
  --region=asia-southeast1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=varnarc-web
```

3. **Backend services** — enable CDN only on web backend:

```bash
gcloud compute backend-services create varnarc-web-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
```

4. **URL map** — host rules to backends (`varnarc.com` → web, `api.` → api).
5. **Managed SSL** — `gcloud compute ssl-certificates create` for all hostnames.
6. **Forwarding rule** — HTTPS proxy + global forwarding rule to reserved IP.
7. **DNS** — A record to LB IP (replace per-service Cloud Run domain mappings).

## Cloud Armor (optional)

Attach security policy to backend service for rate limiting / geo block — see module 33 Security.

## Cache invalidation

```bash
gcloud compute url-maps invalidate-cdn-cache varnarc-url-map \
  --path "/_next/static/*"
```

## Cost note

LB + CDN has baseline cost vs Cloudflare free tier. Prefer Cloudflare until traffic justifies GCP LB.
