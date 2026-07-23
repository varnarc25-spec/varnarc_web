# Changelog

## 0.1.0 — 2026-07-16

### Added

- Turborepo + pnpm monorepo scaffold
- Apps: `@varnarc/web`, `@varnarc/admin`, `@varnarc/api`
- Packages: ui, auth, database, types, validation, hooks, utils, config
- Prisma Phase 1 schema + Auth0 RBAC models (users, roles, permissions, login_history, audit_logs)
- NestJS Auth0 JWT guards, `/api/v1/auth/*` endpoints, RBAC decorators
- Next.js Auth0 client + middleware structure for web and admin
- Docker and GitHub Actions skeletons
- Architecture docs and `AI_RULES.md`
