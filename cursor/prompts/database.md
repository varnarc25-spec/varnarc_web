# Database prompt

Generate production-ready Prisma schema and repository code for: **[FEATURE DESCRIPTION]**

## Requirements

- Add models to `packages/database/prisma/schema.prisma`
- UUID `@id @default(uuid()) @db.Uuid`
- `snake_case` column names via `@map`
- Foreign keys with appropriate `onDelete`
- Indexes on filter/join columns
- `deletedAt` for soft-delete entities
- `createdAt` / `updatedAt` audit fields
- Migration SQL in `prisma/migrations/YYYYMMDD_name/`
- Repository class extending `BaseRepository`
- Register in `createRepositories()` in `repositories/index.ts`
- Cursor pagination via `paginateWithCursor`
- Zod schemas in `@varnarc/validation`
- Seed data in `packages/database/src/seed.ts` if reference data

## Commands

```bash
cd packages/database
pnpm exec prisma migrate dev --name <name>
pnpm exec prisma generate
```

## Do not

- Edit already-applied migrations
- Use auto-increment integer PKs for domain entities
- Raw SQL unless justified and documented

## Verify

`pnpm --filter @varnarc/database typecheck`
