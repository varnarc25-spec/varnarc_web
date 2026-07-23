# Admin prompt

Generate production-ready admin functionality for: **[FEATURE DESCRIPTION]**

## Context

`apps/admin` — Auth0-protected. Server pages with `apiServerFetch`. BFF routes under `app/api/admin/`.

## Requirements

- List page with filters, cursor or offset pagination
- Create/edit forms with Zod validation (client + API)
- RBAC: hide nav items via `hasPermission()` in `admin-shell.tsx`
- Permission constants in `@varnarc/auth`; seed in `packages/database`
- BFF proxy route pattern (see `lib/*-api-proxy.ts`)
- Audit-sensitive actions logged via API
- Toast/feedback on mutations

## UI patterns

- `PageHeader`, `Card`, tables from `@varnarc/ui`
- Follow existing module pages (e.g. `/security`, `/system/performance`)

## Tests

- Typecheck admin app
- Manual test checklist in PR

## Verify

`pnpm --filter @varnarc/admin typecheck && pnpm lint`
