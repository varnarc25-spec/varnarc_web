# Incident Response Runbook

Operational procedures for security incidents on the Varnarc platform.

## Severity levels

| Level | Examples | Response time |
|-------|----------|---------------|
| Critical | Credential leak, data breach, mass unauthorized access | Immediate |
| High | API abuse, privilege escalation, secret exposure in logs | < 1 hour |
| Medium | Elevated failed logins, rate-limit storms, permission probe | < 4 hours |
| Low | Single failed admin login, scanner noise | Next business day |

## 1. Credential compromise

1. Rotate affected secrets in Google Secret Manager (`deploy/gcp/setup-secrets.sh`).
2. Revoke user sessions: Admin → **Security → Sessions** or `POST /api/v1/security/revoke-sessions`.
3. Review **Security events** and **Audit logs** for the affected user.
4. Force Auth0 password reset if end-user credentials are involved.
5. Document in incident log; schedule post-incident review.

## 2. API abuse / rate-limit violations

1. Check **Security events** (`rate_limit.exceeded`) and Cloud Monitoring alerts.
2. Identify source IP / user from `api_request_logs` and security event metadata.
3. Tighten `RATE_LIMIT_PER_MINUTE` or settings security `rateLimitPerMinute`.
4. Consider Cloud Armor rules on the load balancer (`deploy/cdn/gcp-load-balancer.md`).
5. Block abusive API keys via **API console** if applicable.

## 3. Unauthorized access attempt

1. Filter security events: `auth.failure`, `permission.denied`.
2. Correlate with audit logs and login history.
3. Revoke sessions if a valid session was obtained improperly.
4. Review RBAC assignments for affected users.

## 4. Secret leakage

1. **Immediately** rotate the leaked secret in Secret Manager.
2. Redeploy API / web / admin with updated secrets.
3. Scan git history; never commit `.env` files.
4. Review CI logs and build artifacts for exposure.

## 5. Data breach suspicion

1. Contain: disable affected accounts, revoke sessions.
2. Preserve audit logs and security events (immutable DB records).
3. Notify legal / compliance per GDPR/CCPA requirements.
4. Export affected user data scope from audit metadata.

## 6. Service outage (security-related)

1. Check `/api/v1/health` and `/api/v1/status`.
2. Review startup env validation errors (`validateStartupEnv`).
3. Verify Auth0, Redis, and database connectivity.
4. Roll back deployment if a security middleware change caused failures.

## Monitoring integration

- GCP alerts: `deploy/gcp/setup-alerts.sh` (`pnpm gcp:alerts`)
- Security events API: `GET /api/v1/security/events`
- Prometheus: `GET /metrics/prometheus` (token in production)

## Post-incident

- Root cause analysis within 5 business days
- Update this runbook if gaps are found
- Add regression tests or alerts for repeat scenarios
