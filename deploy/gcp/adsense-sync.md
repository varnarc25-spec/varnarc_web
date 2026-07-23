# Google AdSense API sync

Automated revenue import for the **Analytics → Revenue** dashboard using the [AdSense Management API v2](https://developers.google.com/adsense/management/reference/rest).

## Prerequisites

1. Google Cloud project with **AdSense Management API** enabled.
2. OAuth 2.0 client (Desktop or Web) with redirect URI used to obtain a refresh token.
3. OAuth scope: `https://www.googleapis.com/auth/adsense.readonly`

## Obtain a refresh token

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Use the OAuth playground or a one-time script to authorize and capture the **refresh token**.
3. Store credentials in Secret Manager (never commit).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ADSENSE_SYNC_ENABLED` | For scheduler | `true` to run daily sync |
| `ADSENSE_SYNC_INTERVAL_MS` | No | Default `86400000` (24h) |
| `ADSENSE_OAUTH_CLIENT_ID` | Yes | OAuth client ID |
| `ADSENSE_OAUTH_CLIENT_SECRET` | Yes | OAuth client secret |
| `ADSENSE_OAUTH_REFRESH_TOKEN` | Yes | Long-lived refresh token |
| `ADSENSE_ACCOUNT_ID` | No | `accounts/pub-xxx` — auto-detected if omitted |
| `ADSENSE_CURRENCY` | No | Default `INR` |

Add to `deploy/gcp/secrets.env` and run `./deploy/gcp/setup-secrets.sh`.

Cloud Run deploy sets `ADSENSE_SYNC_ENABLED=true` on the API service when secrets are present.

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/adsense/status` | `analytics.view` | Config status |
| POST | `/analytics/adsense/sync` | `analytics.admin` | Pull last 30 days from Google |
| POST | `/analytics/adsense/import` | `analytics.admin` | Manual snapshot (fallback) |

## Admin UI

**Analytics → Revenue** — click **Sync from Google AdSense API** or use manual import as fallback.

## Scheduler

When `ADSENSE_SYNC_ENABLED=true`, the API runs a background job (default every 24h) that calls the same sync logic as the manual button.

## Related

- [../../apps/admin/src/app/analytics/revenue/page.tsx](../../apps/admin/src/app/analytics/revenue/page.tsx)
- [../../apps/api/src/modules/analytics/adsense-api.service.ts](../../apps/api/src/modules/analytics/adsense-api.service.ts)
