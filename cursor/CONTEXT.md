# Reusable prompt variables

Copy this block into any Cursor prompt for consistent context.

```text
Project Name: Varnarc Platform
Architecture: pnpm + Turborepo monorepo
Frontend: Next.js 15 App Router, React 19, Tailwind CSS, @varnarc/ui
Backend: NestJS 11, apps/api
Database: Neon PostgreSQL, Prisma, @varnarc/database repositories
Authentication: Auth0 JWT + RBAC (packages/auth)
Cache: Redis (cache-manager + optional rate limiting)
Media: Google Cloud Storage (apps/api media module)
Search: Postgres FTS (default) or OpenSearch (optional)
Background jobs: BullMQ
Hosting: Google Cloud Run
Observability: OpenTelemetry, Prometheus, Grafana, GCP Monitoring
CI/CD: GitHub Actions (lint, typecheck, test, build, Trivy)
Validation: Zod (@varnarc/validation) + NestJS ValidationPipe
Testing: Vitest (unit), Playwright (e2e), k6 (load)
API prefix: /api/v1
Docs: project/docs/, varnarc-project-docs/docs/
AI rules: project/AI_RULES.md
Coding standards: project/docs/34-Coding-Standards-IMPLEMENTATION.md
```
