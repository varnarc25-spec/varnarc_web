# Code templates

Copy-paste starters for new Varnarc modules. Replace `Example` / `example` placeholders.

## NestJS feature module

```bash
cp -r templates/nest-module apps/api/src/modules/my-feature
# Rename files and replace Example → MyFeature
```

| File | Purpose |
|------|---------|
| `example.module.ts` | NestJS module wiring |
| `example.controller.ts` | Thin HTTP layer, Zod validation |
| `example.service.ts` | Business logic |
| `example.service.spec.ts` | Unit test stub |

## Validation schema

See `templates/validation-schema.ts` for Zod patterns used with `ZodValidationPipe`.

## Next.js admin page

See `templates/next-admin-page.tsx` for server-component list pages with `apiServerFetch`.

## Module README

Use `templates/MODULE_README.md` when adding a new API module.

## Conventions

- Files: `kebab-case` folders, `PascalCase.tsx` components, `*.service.ts` / `*.controller.ts`
- API routes: kebab-case (`/api/v1/my-resource`)
- DB: snake_case columns (Prisma `@map`)
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`)

Full standards: `docs/34-Coding-Standards-IMPLEMENTATION.md`
