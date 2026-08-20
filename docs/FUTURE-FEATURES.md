# Future Features Backlog

Central registry of **deferred and out-of-scope** capabilities across all Varnarc modules. These items do not block Phase 1 or current module acceptance criteria.

**Structured source of truth:** `packages/config/src/future-features.ts`  
**Last updated:** 2026-08-20

## Purpose

- Aggregate "Future Features" sections from every module spec (`varnarc-project-docs/docs/*.md`)
- Track platform-wide themes (i18n, mobile, marketplace, enterprise) without duplicating roadmap phases
- Give engineering and product a single backlog view in admin (`/roadmap/backlog`)

## How items enter the backlog

1. Module specs define **Future Features** as explicitly out of scope
2. Items are added to `FUTURE_FEATURES` in config with `moduleId`, `category`, `priority`, `status`, and optional `phase`
3. When an item is scheduled for delivery, promote it to `packages/config/src/roadmap.ts` and update status to `planned`

## Status values

| Status        | Meaning                      |
| ------------- | ---------------------------- |
| `backlog`     | Documented, not scheduled    |
| `planned`     | Scheduled in a roadmap phase |
| `in_research` | Spike or design in progress  |
| `deferred`    | Intentionally postponed      |

## Priority

| Priority | Guidance                               |
| -------- | -------------------------------------- |
| `high`   | Strategic or high user/business impact |
| `medium` | Valuable but not urgent                |
| `low`    | Nice-to-have or experimental           |

## Module coverage

Backlog entries exist for modules: 04, 08, 10–33, and platform-wide themes (37).

Modules without a Future Features section in spec (e.g. 03 Database, 05 Backend) defer to roadmap phases instead.

## Deferred public footer links

As of **2026-08-20**, these links are removed from the public site footer Resources column (`apps/web/src/components/site-footer.tsx`). Do not restore until each product surface is launch-ready.

| Link       | Route         | Tracking IDs                                    | Restore when                                           |
| ---------- | ------------- | ----------------------------------------------- | ------------------------------------------------------ |
| AI Tools   | `/ai-tools`   | `ai-tools-public-nav`, `ai-tools-public-launch` | Catalog UX, SEO, sponsored disclosure, inventory gates |
| Developers | `/developers` | `developers-public-nav`                         | Public developer portal (docs, keys, rate limits)      |
| Premium    | `/premium`    | `premium-public-nav`                            | Membership plans, billing UX, public pricing page      |

**Shared restore checklist**

1. Product sign-off that the destination page is production-ready
2. Re-add the link to `SiteFooter` Resources only after that sign-off
3. Optionally sync CMS menus (`main-header` / `main-footer`) and static nav fallbacks
4. Update this doc and set the matching future-feature item(s) to `planned` or remove when shipped

Routes may remain available for development and admin work without being promoted in chrome.

## Contact form storage & email settings (2026-08-20)

Contact submissions are stored in `contact_messages` **before** email delivery.

| Area                | Location                                     |
| ------------------- | -------------------------------------------- |
| Admin email routing | `/settings/contact`                          |
| Admin inbox         | `/settings/contact-messages`                 |
| Setting key         | `settings.contact`                           |
| API                 | `POST /contact`, `GET/PUT /settings/contact` |

Recipient addresses and optional Resend API key can be edited in admin. Env `RESEND_API_KEY` still takes precedence when set.

## Counts (2026-08-20)

- **~150+** tracked items across **26** module groups
- Majority status: `backlog`
- High-priority themes: multilingual content, live data feeds, semantic search, mobile push, enterprise SSO/tenancy
- Deferred public footer links: AI Tools, Developers, Premium

## Maintenance

See [`future-features/README.md`](../future-features/README.md).

## Related

- Roadmap phases: [`ROADMAP.md`](./ROADMAP.md)
- Implementation: [`37-Future-Features-IMPLEMENTATION.md`](./37-Future-Features-IMPLEMENTATION.md)
- Spec: `varnarc-project-docs/docs/37-Future-Features.md`
