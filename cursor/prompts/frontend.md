# Frontend prompt

Generate production-ready Next.js App Router code for: **[FEATURE DESCRIPTION]**

## Context

App: `apps/web` (public) or `apps/admin` (dashboard).  
UI: `@varnarc/ui`, Tailwind. Data: `apiServerFetch` (server) or TanStack Query (client).

## Requirements

- Server Components by default
- `'use client'` only for forms, modals, interactive widgets
- Typed props; no `any`
- Loading, empty, and error UI states
- Semantic HTML; keyboard navigation; ARIA where needed
- Use existing layout and navigation patterns
- Security headers already configured via `withSecurityHeaders()`

## Performance

- Dynamic import for heavy client components
- Avoid unnecessary client bundles
- Use Next.js `Image` where appropriate (or `<img>` for external CDN URLs)

## Tests

- Vitest for utilities
- Playwright e2e for critical paths (if new routes)

## Do not

- Put business logic in components — use hooks or server-side fetch
- Hardcode API URLs — use `NEXT_PUBLIC_API_URL`

## Verify

`pnpm lint && pnpm typecheck && pnpm --filter @varnarc/web test`
