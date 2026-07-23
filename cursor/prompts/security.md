# Security prompt

Harden or implement security for: **[FEATURE / AREA]**

## Always include

- Auth0 JWT validation (`JwtAuthGuard`)
- RBAC (`@RequirePermissions`, permissions in `packages/auth`)
- Zod input validation on body, query, params
- Rate limiting (`@Throttle` or global throttler) on auth, upload, search, AI endpoints
- Audit logging (`auditLogs` repository) for admin mutations
- Security events (`SecurityEventsService`) for auth failures and permission denials
- Secure headers (Helmet API, `withSecurityHeaders` Next.js)
- File upload: MIME allowlist, size limits, magic-byte check (`validateFileSignature`)
- No secrets in code — env vars + GCP Secret Manager in production

## Reference

- `docs/33-Security-IMPLEMENTATION.md`
- `apps/api/src/modules/security/`
- `deploy/security/incident-response.md`

## Verify

Security-sensitive changes need explicit test cases for forbidden/unauthorized access.
