# Implementation status — 07 Admin Module

## Auth model (divergence from design doc)

`07-Admin.md` describes local JWT admin auth and an `admins` table. Varnarc uses **Auth0 + Nest RBAC** instead:

- Admin portal login/logout via Auth0 (`apps/admin`)
- API authorization via JWT access tokens + permission guards
- Platform users live in `User` / `Role` / `Permission` tables (not a separate `admins` table)
- No local password reset or MFA in-app — those are Auth0 concerns

Public API base remains `/api/v1` (not `/api/admin/*`). Admin UI uses Next.js BFF routes under `/api/admin/*` to proxy authenticated calls.

## Completed

### API
- `GET /api/v1/dashboard/summary` — user metrics + recent audit activity (`analytics.view`)
- `GET /api/v1/audit-logs` — cursor-paginated global audit list with filters (`audit.view`)
- `GET /api/v1/reports/users.csv` — CSV export (`reports.export`)
- Existing: users/roles/permissions CRUD, settings + feature flags, Auth0 `/auth/me`

### Permissions
- `audit.view`
- `reports.export`
- Included in `super_admin` / `admin` role definitions in `@varnarc/auth`

### Admin UI (`apps/admin`)
- Dashboard with live metrics and recent activity
- Users list with search + CSV export link
- Roles / permissions management (existing)
- Audit logs page with entity/action filters
- Settings page: upsert settings + feature flags + reports download
- Sidebar nav: Audit logs entry
- BFF proxies: settings upsert, feature flags, users CSV

### Database helpers
- `UserRepository.countAll` / `countByStatus` / `countLoggedInSince`
- `AuditLogRepository.list` filters + user include; `recent()`

## Acceptance mapping

| Doc criterion | Status |
|---|---|
| Admin login | Auth0 session gate |
| Role-based authorization | Nest `PermissionsGuard` + admin shell filtering |
| Dashboard | Live summary API + UI |
| User CRUD | List/view/status/roles (Auth0-synced; no local password create) |
| Permission management | Roles + permissions pages |
| Audit logging | Write path existing; global list API + UI |
| Reports | Users CSV export |
| API documentation | Swagger tags on new controllers; this status file |

## Follow-ups
- Re-seed permissions after deploy so `audit.view` / `reports.export` exist in DB: `pnpm db:seed`
- Optional: richer report types (PDF/Excel), dashboard charts, MFA policy docs linking to Auth0
- Wire cursor “Load more” on audit UI when datasets grow
