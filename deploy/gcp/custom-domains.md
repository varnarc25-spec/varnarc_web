# Custom domains and SSL

Cloud Run provides **managed SSL** when you map a custom domain.

## Domain layout (example)

| Host                | Service                                     |
| ------------------- | ------------------------------------------- |
| `varnarc.com`       | `varnarc-web`                               |
| `www.varnarc.com`   | `varnarc-web` (301 → `https://varnarc.com`) |
| `api.varnarc.com`   | `varnarc-api`                               |
| `admin.varnarc.com` | `varnarc-admin`                             |

## Map domain (Cloud Run)

```bash
gcloud run domain-mappings create \
  --service varnarc-api \
  --domain api.varnarc.com \
  --region us-central1
```

Repeat for web, admin, and **www.varnarc.com** (same `varnarc-web` service). Follow the DNS records shown in the command output.

Canonical public URL is **`https://varnarc.com`** (no www). After `www` is mapped to Cloud Run, the web app issues a **301** to the apex host so PageRank is not split. Without a Cloud Run domain mapping + DNS for `www`, Google Hosting may serve a 404 instead of that redirect.

## DNS providers

Works with Cloud DNS, Cloudflare, or GoDaddy:

1. Create the DNS records Cloud Run provides (usually CNAME or A/AAAA for verified domain)
2. Wait for certificate provisioning (can take up to 24h)
3. HTTPS is enforced automatically

## Update application URLs

After mapping:

- Rebuild web/admin images with correct `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ADMIN_URL`
- Update Auth0 callback/logout URLs for each host
- Set `SMOKE_TEST_*_URL` GitHub secrets to HTTPS URLs

## Optional load balancer + CDN

For global CDN or Cloud Armor, place an external HTTPS load balancer in front of Cloud Run (future). Single-region Cloud Run custom domains are sufficient for initial production.
