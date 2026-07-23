# Backend prompt

Generate production-ready NestJS code for: **[FEATURE DESCRIPTION]**

## Context

Varnarc API (`apps/api`). Auth0 + RBAC. Repositories via `REPOS` inject token.

## Requirements

- Create `modules/<feature>/` with module, controller, service
- Zod schemas in `@varnarc/validation`; `ZodValidationPipe` on inputs
- `@RequirePermissions(PERMISSIONS.XXX)` on protected routes
- Return `ok()` / `okCursor()` from `common/utils/response`
- Business logic in service; database via `repos.*` repositories only
- Register in `app.module.ts`; `@ApiTags` on controller
- Vitest tests in `apps/api/test/<feature>.service.spec.ts`
- Module README with endpoint table

## Do not

- Access Prisma directly from controller or service (use repositories)
- Skip validation or RBAC
- Generate placeholder implementations

## Verify

`pnpm lint && pnpm typecheck && pnpm test`
