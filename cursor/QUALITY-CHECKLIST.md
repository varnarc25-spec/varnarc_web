# Prompt quality checklist

Generated code must satisfy all items before merge.

## Build & CI

- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero errors (warnings acceptable)
- [ ] `pnpm test` — all pass
- [ ] `pnpm build` — succeeds for affected apps

## Architecture

- [ ] Matches monorepo layout (`apps/`, `packages/`)
- [ ] No Prisma in controllers
- [ ] Shared logic in packages, not duplicated
- [ ] API uses standard response envelope

## Code quality

- [ ] TypeScript strict; minimal `any`
- [ ] Naming conventions (see `docs/34-Coding-Standards-IMPLEMENTATION.md`)
- [ ] No placeholder or mock business logic
- [ ] No commented-out code or debug `console.log`

## Security

- [ ] RBAC on protected routes
- [ ] Zod validation on inputs
- [ ] No secrets in source
- [ ] Audit log for sensitive admin actions

## UX (if UI)

- [ ] Loading, error, and empty states
- [ ] Accessible markup
- [ ] Server Components unless client interactivity required

## Documentation

- [ ] Implementation doc updated
- [ ] API endpoints documented in module README
- [ ] `CHANGELOG.md` for user-visible changes
