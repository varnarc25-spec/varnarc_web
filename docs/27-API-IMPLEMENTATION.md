# Implementation status — 27 API Module

The API module is primarily **cross-cutting infrastructure** across the NestJS app. This pass formalizes platform endpoints, observability, and the admin API console.

## Required scope (delivered)

| Area | Status |
|------|--------|
| `GET /api/v1/version` | Done |
| `GET /api/v1/status` | Done |
| `GET /api/v1/health`, `GET /api/v1/ready` (pre-existing) | Done |
| Swagger at `/api/v1/docs` | Done |
| Standard `{ success, data, meta }` envelope + error shape | Done |
| `meta.timestamp` + `meta.requestId` on responses | Done |
| `x-request-id` middleware | Done |
| Persisted `api_request_logs` | Done |
| API keys (hashed storage, one-time reveal on create) | Done |
| Webhooks (CRUD, HMAC signature, test delivery, delivery log) | Done |
| Admin API console (`/api`, `/api/logs`, `/api/keys`, `/api/webhooks`, `/api/rate-limits`) | Done |
| Permissions `api.view`, `api.manage` | Done |
| Global rate limiting (Throttler 120/min) | Pre-existing |

## Pre-existing (unchanged)

| Area | Location |
|------|----------|
| Auth0 JWT + RBAC guards | `apps/api/src/auth/` |
| Zod validation pipe | `apps/api/src/common/zod-validation.pipe.ts` |
| Feature module controllers | `apps/api/src/modules/*` |
| Redis/memory cache | `apps/api/src/cache/` |
| Helmet + CORS | `apps/api/src/main.ts` |

## Migration

`20260722140000_api_module`

Tables: `api_request_logs`, `api_keys`, `webhook_endpoints`, `webhook_deliveries`.

## Platform API endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/version` | Public | Version metadata |
| GET | `/status` | Public | Runtime status + 24h log summary |
| GET | `/developers` | Public | Developer portal metadata (docs URLs, SDK, webhooks) |
| GET | `/platform/overview` | `api.view` | Admin dashboard |
| GET | `/platform/logs` | `api.view` | Cursor-paginated request logs |
| POST | `/platform/logs/prune` | `api.manage` | Delete logs older than 14 days |
| GET/POST | `/platform/keys` | view / manage | API key CRUD |
| PUT/DELETE | `/platform/keys/:id` | `api.manage` | Update / revoke |
| GET/POST | `/platform/webhooks` | view / manage | Webhook endpoints |
| PUT/DELETE | `/platform/webhooks/:id` | `api.manage` | Update / delete |
| POST | `/platform/webhooks/:id/test` | `api.manage` | Test delivery |
| GET | `/platform/webhooks/:id/deliveries` | `api.view` | Delivery history |
| GET | `/platform/rate-limits` | `api.view` | Throttler config |

## Webhook dispatch (for other modules)

```typescript
// Inject PlatformApiService
await platformApiService.dispatchEvent('lead.created', { leadId, businessId });
```

Supported events: `article.published`, `review.approved`, `user.registered`, `lead.created`, `notification.delivered`.

## Key paths

| Area | Path |
|------|------|
| Platform service | `apps/api/src/modules/platform-api/platform-api.service.ts` |
| Request ID middleware | `apps/api/src/common/middleware/request-id.middleware.ts` |
| Logging interceptor | `apps/api/src/common/interceptors/logging.interceptor.ts` |
| Repositories | `packages/database/src/repositories/api/` |
| Validation | `packages/validation/src/api.ts` |
| Admin console | `apps/admin/src/app/api/` |
| Developer portal | `apps/web/src/app/developers/` |
| TypeScript SDK | `packages/sdk/` (`@varnarc/sdk`) |

## Deferred

- API key authentication guard (keys can be issued; route enforcement pending)
- BullMQ webhook retries
- `api_rate_limits` table (Throttler uses in-memory/Redis store)
- Import/export of OpenAPI spec from admin
- ETag / HTTP cache headers middleware
- Automatic webhook triggers from CMS/reviews/directory (call `dispatchEvent` when needed)

## Apply migration

```bash
cd project
set -a && source .env && set +a
pnpm --filter @varnarc/database migrate:deploy
pnpm db:seed   # seeds api.view / api.manage permissions
```
