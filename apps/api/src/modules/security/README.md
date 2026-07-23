# Security module

NestJS security operations: audit logs, security events, session revocation, and platform posture overview.

## Endpoints

| Method | Path | Permission |
|--------|------|------------|
| GET | `/security/overview` | `security.view` |
| GET | `/security/audit-logs` | `security.view` |
| GET | `/security/events` | `security.view` |
| GET | `/security/sessions` | `security.view` |
| POST | `/security/revoke-sessions` | `security.manage` |

Legacy `/audit-logs` remains for backward compatibility.

## Session revocation

Requires Auth0 Management API M2M credentials:

```env
AUTH0_MANAGEMENT_CLIENT_ID=...
AUTH0_MANAGEMENT_CLIENT_SECRET=...
```

Without these, revocation records an audit event but cannot invalidate Auth0 refresh tokens.

## Security events

Recorded asynchronously for:

- `auth.failure` (401)
- `permission.denied` (403)
- `rate_limit.exceeded` (429)
- `session.revoked` (admin action)

See `packages/validation/src/security.ts` for event type constants.
