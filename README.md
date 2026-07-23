# Varnarc Platform

Content-driven platform for Finance, Home, Construction, Automobiles, AI Tools, Reviews, Comparisons, Business Directories, and Dynamic Calculators.

## Stack

| Layer | Choice |
|-------|--------|
| Apps | Next.js 15 (`web`, `admin`), NestJS (`api`) |
| Data | Neon PostgreSQL + Prisma |
| Auth | Auth0 |
| UI | Tailwind CSS + shadcn/ui |
| Client data | TanStack Query |
| Media / Email | Cloudinary / Resend |
| Monorepo | pnpm + Turborepo |
| Deploy | Docker → Google Cloud Run |

## Repository layout

```text
apps/web          Public website
apps/admin        Admin dashboard
apps/api          NestJS REST API
packages/*        Shared libraries (@varnarc/*)
docs/             Architecture & module specs
cursor/           Cursor prompt library & AI workflow
.cursor/rules/    Auto-applied Cursor rules
prisma/           Schema mirror / ops notes
docker/           Container definitions
.github/          CI/CD workflows
```

## Getting started

```bash
cd project
pnpm install
cp .env.example .env

# Terminal A — API
pnpm dev:api

# Terminal B — Public site
pnpm dev:web

# Terminal C — Admin
pnpm dev:admin
```

Defaults:

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000/api/v1

## Documentation

Start with:

1. [`AI_RULES.md`](./AI_RULES.md)
2. [`cursor/README.md`](./cursor/README.md) — AI prompt templates
3. [`AGENTS.md`](./AGENTS.md) — agent entry point
4. [`docs/01-Architecture.md`](./docs/01-Architecture.md)
5. [`PROJECT_SPEC.md`](./PROJECT_SPEC.md)
6. [`docs/ROADMAP.md`](./docs/ROADMAP.md) — development phases & release strategy
7. [`docs/FUTURE-FEATURES.md`](./docs/FUTURE-FEATURES.md) — deferred backlog across modules

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in parallel |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint workspace |
| `pnpm typecheck` | TypeScript checks |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:seed` | Seed roles / permissions |

## GitHub

https://github.com/varnarc25-spec/varnarc_web.git

## Phase 1 scope

Foundation and content expansion complete. See [`docs/ROADMAP.md`](./docs/ROADMAP.md) for v3+ utility and AI phases.
