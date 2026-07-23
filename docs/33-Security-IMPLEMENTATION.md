# Implementation status — 33 Security Module

Security foundation: API module, security events, audit extensions, Redis rate limiting, Security Center admin UI, and CI hardening.

## Required scope (delivered)

| Area | Status |
|------|--------|
| Auth0 JWT + RBAC guards | Done (existing) |
| `GET /api/v1/security/overview` | Done |
| `GET /api/v1/security/audit-logs` | Done |
| `GET /api/v1/security/events` | Done |
| `GET /api/v1/security/sessions` | Done |
| `POST /api/v1/security/revoke-sessions` | Done — Auth0 Management API when configured |
| `security_events` table + repository | Done |
| Extended `audit_logs` (ip, user_agent, metadata) | Done |
| Async security event logging | Done — `SecurityEventsService` |
| 401/403/429 → security events | Done — `HttpExceptionFilter` |
| Redis-backed rate limiting | Done — `RedisThrottlerStorage` when `REDIS_URL` set |
| Dynamic CORS from settings | Done — `SecurityConfigService` |
| Next.js security headers (HSTS, CSP helpers, X-Frame-Options) | Done — `withSecurityHeaders()` |
| File upload magic-byte validation | Done — `validateFileSignature()` |
| Admin Security Center | Done — `/security`, `/security/audit`, `/security/events`, `/security/sessions` |
| Permissions `security.view`, `security.manage` | Done |
| CI: blocking `pnpm audit` + Trivy API image scan | Done |
| Incident response runbook | Done — `deploy/security/incident-response.md` |

## Key paths

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/security/` | Security module (controller, services) |
| `apps/api/src/security/redis-throttler.storage.ts` | Redis rate limit storage |
| `packages/database/src/repositories/security/` | `SecurityEventRepository` |
| `packages/config/src/security.ts` | Rate limits, secret health helpers |
| `packages/config/src/next-security.ts` | Next.js security headers |
| `packages/validation/src/security.ts` | Security API schemas |
| `apps/admin/src/app/security/` | Security Center UI |

## Environment

```env
# Rate limiting (fallback when settings DB unavailable at boot)
RATE_LIMIT_PER_MINUTE=120
REDIS_URL=redis://...

# Auth0 session revocation (optional)
AUTH0_MANAGEMENT_CLIENT_ID=
AUTH0_MANAGEMENT_CLIENT_SECRET=
```

## Commands

```bash
# Security overview (authenticated, security.view)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/v1/security/overview

# Revoke sessions (security.manage)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"userId":"<uuid>","reason":"compromised account"}' \
  http://localhost:4000/api/v1/security/revoke-sessions
```

## Deferred (full spec / future)

| Topic | Notes |
|-------|-------|
| Cloud Armor / WAF | Documented in `deploy/cdn/gcp-load-balancer.md`; ties to GCP provisioning |
| Malware scanning on uploads | Future hook after GCS upload |
| WebAuthn / passkeys | Auth0 feature; no architectural change needed |
| ABAC / policy engine | RBAC sufficient for current scope |
| SIEM integration | Security events table ready for export |
| Runtime CSP from settings DB | Headers applied via Next.js; API CSP from Helmet in production |

## Related

- Spec: `varnarc-project-docs/docs/33-Security.md`
- Performance observability: `docs/32-Performance-IMPLEMENTATION.md`
- GCP secrets: `docs/30-Google-Cloud-IMPLEMENTATION.md`
- Incident response: `deploy/security/incident-response.md`
