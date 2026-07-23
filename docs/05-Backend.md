# 05 - Backend Architecture

## Purpose

This document defines the backend architecture for the **Varnarc Platform**.

The backend is responsible for providing secure, scalable, modular, and high-performance APIs that power the public website, admin dashboard, CMS, homepage builder, calculator engine, advertisement system, AI tools, analytics, search, notifications, and future mobile applications.

The backend must follow enterprise architecture principles, support high concurrency, and be designed for long-term maintainability.

---

# Objectives

The backend must:

* Be modular and domain-driven.
* Follow Clean Architecture and SOLID principles.
* Expose REST APIs for all platform functionality.
* Support future GraphQL integration without architectural changes.
* Use TypeScript across the entire backend.
* Be cloud-native and containerized.
* Be optimized for high read traffic.
* Support future microservice extraction if required.

---

# Technology Stack

Framework

* NestJS

Language

* TypeScript (Strict Mode)

ORM

* Prisma

Database

* Neon PostgreSQL

Authentication

* Auth0

Validation

* class-validator
* class-transformer

Documentation

* Swagger / OpenAPI

Caching

* Redis (future)
* NestJS Cache Manager

Queue Processing

* BullMQ (future)

File Storage

* Cloudinary

Email

* Resend

Logging

* NestJS Logger
* Structured JSON logging

Monitoring

* Google Cloud Logging

Deployment

* Docker
* Google Cloud Run

---

# Backend Architecture

The backend follows a layered architecture.

```text
Request
    │
    ▼
Controller
    │
    ▼
Validation
    │
    ▼
Authentication Guard
    │
    ▼
Authorization Guard
    │
    ▼
Service Layer
    │
    ▼
Repository Layer
    │
    ▼
Prisma ORM
    │
    ▼
PostgreSQL
```

Business logic must never exist inside controllers.

Controllers are responsible only for:

* Request parsing
* Validation
* Authentication
* Calling services
* Returning responses

---

# Project Structure

```text
apps/api/

src/

app.module.ts

common/
    config/
    constants/
    decorators/
    dto/
    exceptions/
    filters/
    guards/
    interceptors/
    middleware/
    pipes/
    utils/
    validation/

modules/

auth/
users/
roles/
permissions/

cms/
articles/
categories/
tags/

homepage/
theme/

media/

advertisements/

calculator/

finance/

construction/

automobile/

reviews/

comparison/

directory/

ai/

analytics/

search/

notifications/

newsletter/

settings/

seo/

database/

main.ts
```

Each module must be self-contained.

---

# Module Responsibilities

Authentication

* User synchronization
* JWT validation
* Role loading
* Permission loading

Users

* User management
* Profiles
* Preferences

CMS

* Articles
* Categories
* Tags
* Drafts
* Scheduling
* SEO

Homepage Builder

* Layouts
* Sections
* Widgets

Theme Builder

* Colors
* Typography
* Branding

Advertisement Engine

* Campaigns
* Placements
* Click tracking
* Impressions

Calculator Engine

* Dynamic calculators
* Formula execution
* Saved calculations

Finance

* Loans
* EMI
* Interest
* Investment tools

Construction

* Material estimators
* Cost calculators

Automobile

* Brands
* Models
* Specifications

Reviews

* Product reviews
* Ratings
* Pros
* Cons

Comparison Engine

* Dynamic comparison tables

Directory

* Businesses
* Categories
* Reviews

AI

* Prompt management
* Content generation
* Usage tracking

Analytics

* Page views
* Search queries
* Click events

Notifications

* Email
* In-app
* Push (future)

Settings

* Global configuration
* SEO defaults
* Theme settings

---

# API Design Standards

All APIs must use:

* REST conventions
* Resource-based URLs
* Versioning

Example

/api/v1/articles

/api/v1/categories

/api/v1/users

/api/v1/calculators

/api/v1/reviews

/api/v1/dashboard

---

# Standard API Response

Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Failure

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed."
  }
}
```

---

# Validation

Every request must be validated.

Use:

* DTOs
* Validation Pipes
* class-validator
* class-transformer

Validate:

* UUIDs
* Emails
* Slugs
* URLs
* Enums
* Required fields
* Numeric ranges

---

# Error Handling

Implement global exception filters.

Handle:

* Validation errors
* Database errors
* Authentication failures
* Authorization failures
* Missing resources
* Duplicate resources
* External API failures
* Rate limit violations

All errors must be logged.

---

# Repository Pattern

Every module must contain:

Controller

↓

Service

↓

Repository

↓

Prisma

Repositories must contain only database operations.

Business logic belongs in Services.

---

# Authentication

Use Auth0.

Never implement password authentication.

JWT validation must occur before business logic.

---

# Authorization

Implement RBAC.

Permissions must be verified using reusable guards.

No controller should manually check permissions.

---

# Caching

Cache:

* Homepage
* Categories
* Articles
* Tags
* Settings
* Advertisement placements

Use Redis in production.

---

# Pagination

Every listing endpoint must support:

* Cursor pagination
* Page size
* Sorting
* Filtering
* Search

Maximum page size:

100

---

# Search

Support:

* Full-text search
* Category filters
* Tag filters
* Author filters
* Date filters

Prepare for Meilisearch integration.

---

# Logging

Every request must log:

* User
* IP
* Endpoint
* Method
* Duration
* Status

Administrative actions must generate audit logs.

---

# Security

Implement:

* HTTPS only
* CORS
* Helmet
* Rate limiting
* Input validation
* SQL injection prevention through Prisma
* XSS protection
* CSP headers
* Secure cookies
* Request size limits

Never expose stack traces in production.

---

# Performance

Use:

* Connection pooling
* Database indexes
* Compression
* Lazy loading
* Streaming for large exports
* Async processing
* CDN for media
* Cache headers

---

# Testing

Unit Tests

* Services
* Repositories
* Utilities

Integration Tests

* Controllers
* Database

End-to-End Tests

* Authentication
* CMS
* Calculators
* Reviews
* Admin

Target coverage:

80%+

---

# Deployment

Containerized using Docker.

Deploy to Google Cloud Run.

Environment variables managed securely.

Support:

* Development
* Staging
* Production

---

# Future Architecture

Prepare for:

* GraphQL
* WebSockets
* Event-driven architecture
* Microservices
* Mobile APIs
* Public developer APIs
* Plugin system
* Multi-tenancy
* Background workers

The architecture should support these features without requiring major refactoring.

---

# Cursor Implementation Prompt

Implement the complete backend architecture for the Varnarc Platform using NestJS, Prisma ORM, PostgreSQL (Neon), Auth0, and TypeScript.

Requirements:

* Create a modular backend following Clean Architecture and SOLID principles.
* Organize all functionality into feature-based NestJS modules.
* Implement Controllers, Services, Repositories, DTOs, Guards, Interceptors, Filters, and Validation Pipes.
* Integrate Prisma for all database access.
* Implement Auth0 authentication and RBAC-based authorization.
* Create versioned REST APIs with standardized request and response formats.
* Implement global exception handling, structured logging, request validation, caching, cursor-based pagination, filtering, sorting, and search.
* Build modules for Users, Roles, Permissions, CMS, Homepage Builder, Theme Builder, Media Library, Advertisement Engine, Calculator Engine, Finance, Construction, Automobile, Reviews, Comparison, Directory, AI Tools, Analytics, Notifications, Newsletter, SEO, and Settings.
* Prepare the backend for Redis, Meilisearch, background jobs, GraphQL, and WebSocket integration without architectural changes.
* Generate Swagger documentation, comprehensive unit and integration tests, and production-ready Docker support.
* Ensure the codebase is secure, scalable, maintainable, and fully documented.

---

# Acceptance Criteria

✅ Modular NestJS architecture implemented.

✅ Clean Architecture and SOLID principles followed.

✅ Prisma integrated with PostgreSQL.

✅ Auth0 authentication implemented.

✅ RBAC authorization implemented.

✅ Standardized REST APIs created.

✅ Global validation and error handling configured.

✅ Logging and audit mechanisms implemented.

✅ Caching and pagination supported.

✅ Swagger documentation generated.

✅ Unit and integration tests created.

✅ Docker-ready deployment.

✅ Architecture prepared for future expansion.

✅ Complete backend documentation maintained.
