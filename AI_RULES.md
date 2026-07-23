# AI_RULES.md — Varnarc Platform

Read this file and all relevant documents in `/docs` before making any changes.

**Cursor prompts:** [`cursor/README.md`](./cursor/README.md) · **Master prompt:** [`cursor/MASTER.md`](./cursor/MASTER.md) · **Agent guide:** [`AGENTS.md`](./AGENTS.md)

## Locked stack

- Frontend: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- Backend: NestJS, TypeScript, Prisma
- Database: Neon PostgreSQL
- Auth: Auth0
- Storage: Cloudinary
- Email: Resend
- Deploy: Docker + Google Cloud Run
- CI/CD: GitHub Actions
- Package manager: pnpm
- Monorepo: Turborepo

Do not introduce new frameworks or libraries unless explicitly requested.

## Architecture principles

- Clean Architecture, SOLID, feature-based folders
- Repository + Service layers with dependency injection
- No module may depend on another module's internals — use shared packages / public APIs
- Business logic lives in NestJS services, not React components
- Apps talk to the API; Prisma access is through `@varnarc/database`
- Auth0 is identity; NestJS enforces RBAC / permissions
- Strict TypeScript across all packages

## Naming

- Packages: `@varnarc/<name>`
- API base path: `/api/v1`
- DB: UUID PKs, soft deletes, audit fields (`created_at`, `updated_at`, `deleted_at`)
- Never store passwords — Auth0 owns credentials

## Folder structure

```text
apps/web | apps/admin | apps/api
packages/ui | auth | database | types | validation | hooks | utils | config
docs/ | docker/ | prisma/ | .github/
```

Do not invent parallel app or package trees.

## Cursor rules

1. Preserve the existing architecture
2. Smallest change that meets the request
3. Update docs when behavior or schema changes
4. No drive-by refactors
5. No secrets in git
6. Phase constraint: only implement the requested module
7. Production-ready code — avoid throwaway placeholders for core paths
8. If a change spans DB / API / frontend / admin / packages, update all relevant layers consistently
9. Do not break backward compatibility unless instructed
10. Use domain prompts from `cursor/prompts/` for new features (see `docs/35-Cursor-Prompts-IMPLEMENTATION.md`)

## Do not

- Switch Auth0 → NextAuth without an architecture decision
- Add MongoDB / Firebase as primary database
- Put domain logic only in UI components
- Hardcode business data
- Generate Phase 2+ features (CMS, ads, calculators, reviews) during foundation work unless asked

## Code review checklist

- [ ] Matches `/docs` and this file
- [ ] Shared types/validation used where needed
- [ ] AuthZ checked on admin/API routes
- [ ] Errors follow API envelope
- [ ] Tests for critical business logic
- [ ] CHANGELOG updated for meaningful changes
