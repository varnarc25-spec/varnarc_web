# Code review checklist

Use this list for every pull request.

## Architecture

- [ ] Changes match module docs and monorepo boundaries
- [ ] Controllers are thin; business logic in services
- [ ] Database access via repositories (no Prisma in controllers)
- [ ] Shared code lives in `packages/`, not duplicated across apps

## Code quality

- [ ] TypeScript strict — no unnecessary `any`
- [ ] Naming follows conventions (camelCase, PascalCase, UPPER_SNAKE_CASE)
- [ ] Zod schemas for external input; `ZodValidationPipe` on API
- [ ] Standard API envelope (`success`, `data`, `error`)

## Security

- [ ] Auth guards and permissions on protected routes
- [ ] No secrets, tokens, or PII in logs
- [ ] User input validated and sanitized

## Tests

- [ ] Unit tests for non-trivial logic
- [ ] Existing tests still pass (`pnpm test`)
- [ ] E2E updated if user-facing flows changed

## UI (if applicable)

- [ ] Accessible markup (semantic HTML, labels, keyboard)
- [ ] Server Components by default; `'use client'` only when needed
- [ ] Screenshots attached to PR

## DevOps

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format:check` pass
- [ ] Migrations included for schema changes
- [ ] `.env.example` updated for new variables
- [ ] `CHANGELOG.md` updated for user-visible changes

## Documentation

- [ ] Module README or `docs/*-IMPLEMENTATION.md` updated
- [ ] Public APIs documented (Swagger / module README)
