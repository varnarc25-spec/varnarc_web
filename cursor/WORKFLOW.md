# AI implementation workflow

Every Cursor task should follow these steps.

## 1. Analyze

- Read the module spec in `varnarc-project-docs/docs/`
- Check `project/docs/*-IMPLEMENTATION.md` for current status
- Grep the codebase for existing patterns (controllers, repos, admin pages)
- Identify impacted apps and packages

## 2. Plan

- List files to create or modify
- Note DB migration needs
- Note new permissions for `packages/auth` + seed

## 3. Implement

Order of operations:

1. `packages/validation` — Zod schemas
2. `packages/database` — Prisma + repository
3. `apps/api` — module, service, controller
4. `apps/admin` — pages + BFF routes
5. `apps/web` — public UI (if applicable)
6. `packages/types` / `packages/config` — shared constants

## 4. Test

- Unit tests for services and validation
- Integration test for critical API paths
- Playwright smoke if user-facing routes change

## 5. Document

- `docs/XX-Module-IMPLEMENTATION.md` — status table
- Module `README.md` in API folder
- `.env.example` for new env vars

## 6. Verify

```bash
cd project
pnpm lint
pnpm typecheck
pnpm test
```

## 7. Summarize

Report: what changed, how to test manually, env vars, migration commands.
