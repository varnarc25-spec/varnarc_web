# Implementation status — 25 User Module

## Notifications status (prerequisite)

Required notifications scope is **complete**. Deferred: email queue, push, user notification preferences wiring (partially addressed via user preferences below).

## Delivered in this pass

| Area | Status |
|------|--------|
| Extended `users` profile fields | Done |
| `user_preferences` table + API | Done |
| Unified `bookmarks` with collections | Done |
| `user_activity` tracking + API | Done |
| `user_content_subscriptions` + API | Done |
| `GET/PUT /users/me` (+ legacy `PUT /users/me/profile`) | Done |
| `POST /users/me/avatar` | Done |
| `GET/PUT /users/me/preferences` | Done |
| `GET/POST/DELETE /users/me/bookmarks` | Done |
| `GET /users/me/activity` | Done |
| `GET/PUT /users/me/subscriptions` | Done |
| Admin activity + subscriptions dashboards | Done |
| Web: full profile form + enriched bookmarks (titles/links) | Done |
| Web: preferences, bookmarks, activity, subscriptions pages | Done |
| Auth0 sync + RBAC (pre-existing) | Done |
| Admin users/roles/permissions (pre-existing) | Done |

## Migration

`20260722120000_user_module`

## Key paths

| Area | Path |
|------|------|
| API | `apps/api/src/users/` |
| Profile service | `apps/api/src/users/user-profile.service.ts` |
| Repositories | `packages/database/src/repositories/user-module/` |
| Validation | `packages/validation/src/users.ts` |

## Future

- Redis profile caching
- Cursor pagination on admin user list
- Background Auth0 reconciliation
- Cross-module auto-activity (page views, searches)
- `user.manage` permission alias
- Admin bulk actions / impersonation
- Premium billing subscriptions UI (separate from content subscriptions)
