# Feature module prompt (full spec)

Use this 13-section structure for any new platform module.

---

## Context

Varnarc Platform monorepo. See `cursor/CONTEXT.md`.

**Module:** [MODULE NAME]  
**Spec:** `varnarc-project-docs/docs/XX-[Module].md`  
**Existing implementation:** `project/docs/XX-[Module]-IMPLEMENTATION.md`

## Objective

[One paragraph describing what to build and why.]

## Functional requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Technical requirements

- NestJS module in `apps/api/src/modules/`
- Zod schemas in `packages/validation/src/`
- Repository in `packages/database/` if new tables
- RBAC permissions in `packages/auth` + seed
- Admin pages under `apps/admin/src/app/`
- Follow `templates/nest-module/` and `templates/next-admin-page.tsx`

## Database impact

- [ ] New tables / columns (migration name: `YYYYMMDD_description`)
- [ ] Or: no schema changes

## API changes

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/v1/...` | `...` |

## UI changes

- Admin: `/...`
- Web: `/...` (if public)

## Validation rules

- Zod schemas: `...`
- File upload rules (if applicable)

## Security requirements

- Auth0 JWT + `@RequirePermissions()`
- Rate limiting on write endpoints
- Audit log for mutations

## Performance considerations

- Cursor pagination on lists
- Redis cache for read-heavy endpoints (if applicable)
- Indexes on filter/sort columns

## Testing requirements

- Vitest unit tests for service
- Validation schema tests
- Playwright smoke if new public routes

## Documentation updates

- `docs/XX-IMPLEMENTATION.md`
- `apps/api/src/modules/.../README.md`
- `.env.example` if new env vars

## Acceptance criteria

- [ ] Required scope from spec implemented
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] Implementation doc status table updated
