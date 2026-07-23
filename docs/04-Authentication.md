# 04 - Authentication & Authorization

## Purpose

The purpose of this document is to define the authentication and authorization architecture for the **Varnarc Platform**.

Authentication is responsible for verifying a user's identity using **Auth0**. Authorization is responsible for determining what authenticated users are allowed to access based on roles and permissions stored in the Varnarc database.

The authentication system must be secure, scalable, cloud-native, and suitable for public users, administrators, editors, and future premium subscribers.

---

# Objectives

The authentication system must:

* Use Auth0 as the identity provider.
* Never store passwords in the Varnarc database.
* Support secure session management.
* Support social login providers.
* Support Role-Based Access Control (RBAC).
* Support Permission-Based Authorization.
* Protect all administrative routes.
* Protect backend APIs.
* Be extensible for mobile applications and third-party APIs.

---

# Authentication Provider

Identity Provider

* Auth0

Supported Authentication Methods

* Email & Password
* Google
* Microsoft
* GitHub
* Apple (future)
* Passwordless Email (future)

Future Support

* Multi-Factor Authentication (MFA)
* Enterprise SSO
* Magic Links

---

# User Lifecycle

User Registration

1. User registers using Auth0.
2. Auth0 verifies email.
3. Auth0 issues an authenticated identity.
4. Varnarc creates or updates the corresponding user profile.
5. Default role is assigned.
6. User can access public features.

User Login

1. User authenticates with Auth0.
2. Auth0 issues access and ID tokens.
3. Frontend establishes a secure session.
4. Backend validates the token.
5. User profile and permissions are loaded.
6. Authorized resources become available.

---

# Roles

The system supports the following default roles:

* Super Administrator
* Administrator
* Editor
* Author
* Moderator
* Premium User
* Registered User
* Guest

Roles are stored in the application database, not in Auth0.

---

# Permissions

Permissions are granular and assigned to roles.

Examples:

Content

* article.create
* article.edit
* article.publish
* article.delete

Media

* media.upload
* media.delete

Users

* user.view
* user.create
* user.update
* user.delete

Advertisements

* advertisement.manage

Homepage Builder

* homepage.manage

Theme

* theme.manage

Analytics

* analytics.view

Settings

* settings.manage

Permissions should be configurable without changing application code.

---

# Authentication Architecture

```text
Browser

↓

Next.js

↓

Auth0

↓

Secure Session

↓

NestJS API

↓

Authorization Middleware

↓

Prisma

↓

Neon PostgreSQL
```

Auth0 is responsible only for identity verification.

Application-specific authorization is handled by NestJS.

---

# Database Impact

Users

* id
* auth0_user_id
* email
* first_name
* last_name
* display_name
* avatar_url
* phone
* status
* email_verified
* last_login_at
* created_at
* updated_at
* deleted_at

Roles

* id
* name
* description

Permissions

* id
* name
* module
* description

Role Permissions

* role_id
* permission_id

User Roles

* user_id
* role_id

Login History

* user_id
* ip_address
* device
* browser
* operating_system
* country
* login_time

Audit Logs

* user_id
* action
* entity
* entity_id
* old_value
* new_value
* created_at

No password fields shall exist in the application database.

---

# Session Management

Sessions are managed by Auth0.

The application stores only session metadata such as:

* Last login
* Login history
* Device information
* Browser information
* IP address

Future support:

* Active sessions
* Session revocation
* Device management

---

# Protected Routes

Public

* Home
* Articles
* Categories
* Reviews
* Calculators
* Search
* Contact
* Newsletter

Authenticated

* Profile
* Saved Calculations
* Bookmarks
* Dashboard

Administrative

* /admin/**
* /api/admin/**

Only authorized users may access administrative resources.

---

# API Security

Every protected API must:

* Validate Auth0 JWT.
* Load user profile.
* Load assigned roles.
* Load permissions.
* Verify authorization before executing business logic.

Unauthorized access must return:

401 Unauthorized

Forbidden access must return:

403 Forbidden

---

# Middleware

Frontend Middleware

Responsibilities:

* Validate authentication state.
* Redirect unauthenticated users.
* Protect admin pages.
* Refresh sessions where required.

Backend Guards

Responsibilities:

* Validate JWT.
* Load user context.
* Verify permissions.
* Return standardized errors.

---

# API Endpoints

Authentication

GET /api/v1/auth/me

POST /api/v1/auth/sync

POST /api/v1/auth/logout

Users

GET /api/v1/users

GET /api/v1/users/{id}

PUT /api/v1/users/{id}

Roles

GET /api/v1/roles

POST /api/v1/roles

PUT /api/v1/roles/{id}

DELETE /api/v1/roles/{id}

Permissions

GET /api/v1/permissions

User Roles

PUT /api/v1/users/{id}/roles

---

# Admin Functionality

Administrators can:

* View users.
* Search users.
* Assign roles.
* Remove roles.
* Disable accounts.
* Enable accounts.
* View login history.
* View audit logs.
* View active sessions (future).
* Revoke sessions (future).

---

# Public Functionality

Users can:

* Register.
* Login.
* Logout.
* Update profile.
* Change display information.
* View account details.
* Delete account (optional workflow).
* Manage communication preferences.

---

# Validation

Use Zod for frontend validation.

Use NestJS validation pipes for backend validation.

Validate:

* Email addresses
* UUIDs
* Auth0 identifiers
* Phone numbers
* Required fields
* Enum values

Never trust client input.

---

# Error Handling

Handle:

* Invalid tokens
* Expired sessions
* Missing permissions
* Disabled accounts
* Deleted accounts
* Duplicate user synchronization
* Invalid role assignments
* Auth0 service failures

Standard response:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
}
```

---

# Security

Requirements

* HTTPS only
* Secure cookies
* CSP headers
* CSRF protection where applicable
* XSS prevention
* SQL injection prevention
* Rate limiting
* Audit logging
* Account lockout policies (future)
* MFA support (future)

Sensitive information must never be exposed to the client.

---

# Performance

Use caching where appropriate for:

* Role lookups
* Permission lookups
* User profile retrieval

Do not cache authentication tokens.

Authorization should remain lightweight and optimized.

---

# Future Features

Prepare the architecture for:

* Organizations
* Teams
* Premium subscriptions
* API keys
* OAuth client applications
* Mobile authentication
* WebSockets
* Enterprise SSO
* MFA
* Passwordless authentication

No major architectural changes should be required to support these features.

---

# Cursor Implementation Prompt

Implement the complete authentication and authorization system for the Varnarc platform using Auth0, Next.js, NestJS, Prisma, and Neon PostgreSQL.

Requirements:

* Integrate Auth0 for authentication.
* Implement secure login, logout, and user synchronization.
* Create database models for users, roles, permissions, user_roles, role_permissions, login_history, and audit_logs.
* Protect frontend routes with middleware.
* Protect backend APIs with NestJS guards.
* Implement RBAC and permission-based authorization.
* Build reusable authorization decorators and middleware.
* Implement user synchronization between Auth0 and PostgreSQL.
* Use Zod for frontend validation and NestJS validation for backend requests.
* Return standardized API responses.
* Log authentication events and administrative actions.
* Write production-ready, modular, and well-documented code.
* Do not store passwords in the application database.

---

# Acceptance Criteria

✅ Auth0 successfully authenticates users.

✅ User profiles synchronize with PostgreSQL.

✅ Roles and permissions are stored in the application database.

✅ Protected routes enforce authentication.

✅ RBAC is implemented across frontend and backend.

✅ Administrative routes require appropriate permissions.

✅ Audit logs capture authentication and authorization events.

✅ Standardized error responses are returned.

✅ Authentication is fully documented.

✅ The architecture supports future expansion without breaking changes.

---

# Implementation Status (2026-07-16)

Implemented in `project/`:

* Auth0 login/logout via `@auth0/nextjs-auth0` (web + admin)
* JWT validation (JWKS) in NestJS
* User sync, login history, audit logs
* RBAC guards + permission decorators
* APIs: `/auth/*`, `/users/*`, `/roles/*`, `/permissions`
* Admin UI: users, roles, permissions
* Public profile page + profile update
* Bootstrap admin via `BOOTSTRAP_ADMIN_EMAILS`

Required Auth0 dashboard setup:

1. Callback URLs for web/admin
2. API Identifier matching `AUTH0_AUDIENCE`
3. Set `BOOTSTRAP_ADMIN_EMAILS` to your email for first admin access
