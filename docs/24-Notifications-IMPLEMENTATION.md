# Implementation status — 24 Notifications

Aligned with `varnarc-project-docs/docs/24-Notifications.md` (Auth0 + `/api/v1` + Nest RBAC).

## Delivered (required scope)

| Area | Status |
|------|--------|
| Prisma models (`Notification`, `NotificationTemplate`, `UserNotification`) | Done (pre-existing) |
| Repository layer | Done |
| Validation (Zod) | Done |
| RBAC: `notifications.view`, `notifications.manage` | Done |
| User inbox API (list, unread count, mark read, mark all read) | Done |
| Template CRUD | Done |
| Admin broadcast (all / role / user IDs) | Done |
| Provider settings stub (SMTP/SendGrid/SES/Resend flags) | Done |
| Default template seeds | Done |
| Admin UI (dashboard, templates, broadcast, providers) | Done |
| Web notification center + header bell + BFF routes | Done |
| `NotificationsService.sendToUsers()` for cross-module use | Done |
| Audit logging on admin mutations | Done |

## Key paths

| Area | Path |
|------|------|
| API module | `apps/api/src/modules/notifications/` |
| Repository | `packages/database/src/repositories/notifications/` |
| Validation | `packages/validation/src/notifications.ts` |
| Admin | `apps/admin/src/app/notifications/` |
| Web client | `apps/web/src/lib/notifications-client.ts` |
| Web BFF | `apps/web/src/app/api/notifications/` |

## Ops

No new migration required — tables exist in `20260716190000_full_domain_schema`.

Run seed to load default templates:

```bash
pnpm db:seed
```

## Future (not required for acceptance)

- User notification preferences (`notification_settings` JSONB on User)
- Email delivery worker (BullMQ + provider SDKs)
- Push notifications + device tokens
- Real-time SSE/WebSocket updates
- Cross-module event triggers (review approved, lead created)
- Webhook: `Notification Delivered`
- Advanced segmentation and delivery analytics
