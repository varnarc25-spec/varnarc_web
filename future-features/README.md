# Future features maintenance

## Source of truth

1. **Structured data:** `packages/config/src/future-features.ts`
2. **Summary doc:** `docs/FUTURE-FEATURES.md`
3. **Module specs:** `varnarc-project-docs/docs/{NN}-*.md` — each module's `# Future Features` section
4. **Admin UI:** `/roadmap/backlog`

## When to update

- A module spec gains or changes its Future Features section → sync items into config
- An item moves from backlog to active development → update `roadmap.ts`, set status to `planned` or remove from backlog
- Platform-wide initiative identified → add under `moduleId: 'platform'`

## Checklist (per module release)

- [ ] Module spec Future Features section is current
- [ ] Matching entries in `future-features.ts`
- [ ] `FUTURE_FEATURES_LAST_UPDATED` bumped
- [ ] No duplicate tracking in roadmap phase items (cross-link via `phase` field)
- [ ] Admin `/roadmap/backlog` spot-checked

## Field reference

```typescript
{
  id: 'unique-kebab-id',
  moduleId: 'cms',           // matches FUTURE_FEATURE_MODULES.id
  category: 'AI',            // grouping within module
  title: 'Feature name',
  priority: 'low' | 'medium' | 'high',
  status: 'backlog' | 'planned' | 'in_research' | 'deferred',
  phase: 4,                  // optional roadmap phase link
  notes: 'optional context',
}
```

## No database / API

This module intentionally has no Prisma schema or REST endpoints. Static config keeps the backlog version-controlled and reviewable in PRs.
