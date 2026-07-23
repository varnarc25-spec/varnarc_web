# Notifications API

In-app notifications, templates, broadcasts, and provider settings.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/status` | Public |
| GET | `/me` | User |
| GET | `/me/unread-count` | User |
| PATCH | `/me/read-all` | User |
| PATCH | `/me/:id/read` | User |
| GET | `/dashboard` | `notifications.view` |
| GET | `/templates` | `notifications.view` |
| POST | `/templates` | `notifications.manage` |
| PUT | `/templates/:id` | `notifications.manage` |
| DELETE | `/templates/:id` | `notifications.manage` |
| GET | `/` | `notifications.view` |
| POST | `/broadcast` | `notifications.manage` |
| GET/PUT | `/providers/settings` | `notifications.manage` |

## Internal API

`NotificationsService.sendToUsers()` is exported for other modules to deliver in-app notifications.
