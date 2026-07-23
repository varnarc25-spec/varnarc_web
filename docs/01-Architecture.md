# 01 - System Architecture

## Purpose

The purpose of this document is to define the overall architecture of the **Varnarc Platform**, ensuring that every module follows a consistent, scalable, secure, and maintainable design.

Varnarc is a content-driven platform focused on Finance, Home, Construction, Automobiles, AI Tools, Reviews, Comparisons, Business Directories, and Dynamic Calculators.

The platform must support high traffic, modular development, and continuous feature expansion without requiring architectural redesign.

This document acts as the primary reference for all future development.

---

# System Goals

The platform must:

* Be modular
* Be scalable
* Be cloud native
* Be SEO optimized
* Support millions of visitors
* Support multiple administrators
* Support future mobile applications
* Support third-party integrations
* Be deployable using Docker
* Run on Google Cloud Run
* Use Neon PostgreSQL
* Use Auth0 for authentication

---

# High-Level Architecture

The application shall be implemented as a **pnpm monorepo**.

Repository Structure:

```text
varnarc/

apps/
    web/
    admin/
    api/

packages/
    ui/
    auth/
    database/
    types/
    validation/
    hooks/
    utils/
    config/

docs/

docker/

prisma/

.github/
```

Each application is independently deployable while sharing common packages.

---

# Technology Stack

Frontend

* Next.js (Latest App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query

Backend

* NestJS
* TypeScript
* Prisma ORM

Database

* Neon PostgreSQL

Authentication

* Auth0

Storage

* Cloudinary

Email

* Resend

Deployment

* Docker
* Google Cloud Run

CI/CD

* GitHub Actions

Monitoring

* Google Cloud Logging

---

# Architectural Principles

The platform shall follow:

* Clean Architecture
* SOLID Principles
* Feature-Based Folder Structure
* Repository Pattern
* Service Layer
* Dependency Injection
* Domain Separation
* Shared UI Components
* Strict TypeScript
* Reusable Business Logic

No module shall directly depend on another module's internal implementation.

Communication must occur through well-defined interfaces.

---

# System Modules

Core Modules include:

* Authentication
* User Management
* Roles & Permissions
* CMS
* Articles
* Categories
* Tags
* Homepage Builder
* Landing Page Builder
* Theme Builder
* Advertisement Manager
* Calculator Engine
* Reviews
* Comparisons
* Business Directory
* AI Tools
* Search
* Notifications
* Analytics
* SEO
* Media Library
* Settings

Each module must be independently maintainable.

---

# Public Website

The public application provides:

* Homepage
* Articles
* Categories
* Search
* Reviews
* Comparisons
* Directories
* Calculators
* AI Tools
* User Profiles
* Saved Calculations
* Newsletter
* Contact Pages

The public website must never expose administrative functionality.

---

# Admin Application

The admin application provides:

* Dashboard
* CMS
* Articles
* Categories
* Reviews
* Directory
* Calculator Builder
* Homepage Builder
* Theme Builder
* Advertisement Management
* Media Library
* Analytics
* User Management
* Roles
* Permissions
* System Settings

Every admin feature must be permission protected.

---

# API

The backend shall expose REST APIs.

All APIs must support:

* Pagination
* Filtering
* Sorting
* Validation
* Versioning
* Error Handling
* Rate Limiting
* Logging

Every API response must follow a consistent response format.

---

# Database

The database shall use PostgreSQL.

Requirements:

* UUID primary keys
* Soft deletes
* Audit fields
* Normalized schema
* Indexed search columns
* Transactions where required

Passwords must never be stored.

Authentication is delegated to Auth0.

---

# UI Architecture

The frontend shall use reusable UI components.

No duplicated UI code.

The design system shall include:

* Buttons
* Cards
* Tables
* Forms
* Dialogs
* Drawers
* Charts
* Badges
* Breadcrumbs
* Data Grids
* Editors
* Uploaders

Dark Mode and Light Mode must be supported.

---

# Security Requirements

The platform must implement:

* Auth0 Authentication
* Role-Based Access Control (RBAC)
* Permission-Based Authorization
* HTTPS
* Secure Cookies
* Input Validation
* Rate Limiting
* CSP Headers
* XSS Protection
* SQL Injection Protection
* Audit Logs

---

# Performance Requirements

The application must support:

* Server-Side Rendering
* Static Generation where appropriate
* Incremental Static Regeneration
* Image Optimization
* Lazy Loading
* API Pagination
* CDN Integration
* Browser Caching
* Compression

---

# Logging

Every request shall be logged.

Important actions shall generate audit records.

Errors shall be centralized.

Logs must be production ready.

---

# Deployment Architecture

GitHub

↓

GitHub Actions

↓

Docker Build

↓

Google Cloud Run

↓

Neon PostgreSQL

↓

Cloudinary

↓

Resend

↓

Cloudflare CDN

---

# Development Standards

Developers must:

* Never hardcode business data.
* Build reusable modules.
* Keep business logic out of UI components.
* Use dependency injection.
* Write maintainable TypeScript.
* Follow repository and service patterns.
* Document public APIs.
* Write tests for business logic.

---

# Cursor Implementation Prompt

Read this document and all related documentation in the `/docs` directory before generating or modifying code.

Preserve the existing architecture.

Do not introduce new frameworks or libraries unless explicitly requested.

Follow Clean Architecture, SOLID principles, and feature-based organization.

Generate production-ready code only.

Avoid placeholder implementations.

Use strict TypeScript, reusable components, dependency injection, and proper validation.

If a requested feature affects the database, API, frontend, admin panel, or shared packages, update all relevant layers while maintaining consistency.

Do not break backward compatibility unless instructed.

Document any architectural decisions or assumptions in the relevant documentation.

---

# Acceptance Criteria

The architecture is considered complete when:

* The repository follows the defined monorepo structure.
* All modules adhere to the architectural principles.
* Shared packages are used consistently.
* Authentication and authorization are centralized.
* The system is cloud-ready.
* Code is modular and testable.
* Documentation reflects the implemented architecture.
* Future modules can be added without restructuring the project.


## Acceptance Criteria
- Feature complete
- Tested
- Documented

