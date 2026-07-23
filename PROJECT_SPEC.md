# Varnarc Project Specification

**Brand:** Varnarc Platform  
**Repo:** https://github.com/varnarc25-spec/varnarc_web.git  
**Status:** Phase 1 — Foundation (v1.x release prep)

## Purpose

Build a modular, cloud-native, SEO-oriented platform with:

- Public website (`apps/web`)
- Permissioned admin (`apps/admin`)
- REST API (`apps/api`)
- Shared packages for UI, auth, database, types, validation, hooks, utils, config

## Locked technology

Next.js (App Router), NestJS, Prisma, Neon PostgreSQL, Auth0, Tailwind + shadcn/ui, TanStack Query, Cloudinary, Resend, Docker, Google Cloud Run, GitHub Actions, pnpm, Turborepo.

## Phase 1 deliverables

- [x] Monorepo structure
- [x] Auth0 end-to-end (login, sync, RBAC APIs, admin UI)
- [x] Prisma Phase 1 + Auth0 RBAC schema migrated on Neon `varnarc_db`
- [x] Admin shell + public shell + profile
- [x] Docker + GitHub Actions + Cloud Run
- [x] CMS, media, themes, homepage builder
- [x] Advertisement system, search, SEO, analytics, notifications
- [x] Settings, API console, deployment, testing, performance, security
- [x] Coding standards, Cursor prompts, roadmap tracking
- [ ] v1 production release (content go-live, final ops sign-off)

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) and admin `/roadmap` for phase status.

## Source of truth

- `AI_RULES.md`
- `docs/*`
- This file

Expand each document in `/docs` during implementation. Do not redesign the architecture without updating `docs/01-Architecture.md`.
