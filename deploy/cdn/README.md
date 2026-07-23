# Edge CDN

## Option A — Cloudflare (recommended first)

1. Add site to Cloudflare; point DNS (proxied).
2. **Cache rules** (Rules → Cache Rules):

| URL | Action |
|-----|--------|
| `*varnarc.com/_next/static/*` | Cache Everything, Edge TTL 1 year |
| `*varnarc.com/fonts/*` | Cache Everything |
| `*api.varnarc.com/*` | Bypass |
| `*admin.varnarc.com/*` | Bypass |

3. Speed → Optimization: Brotli, HTTP/3, Early Hints.
4. On deploy: purge `/_next/static/*` via Cloudflare API or dashboard.

Env (optional purge on deploy):

```bash
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=
```

Script: `scripts/cdn/cloudflare-purge.sh`

## Option B — GCP External HTTPS LB + Cloud CDN

See `deploy/cdn/gcp-load-balancer.md` for serverless NEG + URL map setup.

## Application headers

Web app sets CDN-friendly headers via `apps/web/next.config.ts` (`headers()`).

Public API responses for SEO (`robots.txt`, sitemaps) use short `s-maxage` where safe.

## What not to cache

- `/api/*`, Auth0 callbacks, admin app, personalized/user routes
- HTML with session cookies unless using ISR + `s-maxage` deliberately
