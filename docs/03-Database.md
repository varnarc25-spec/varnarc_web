# 03 - Database Architecture

## Purpose
Define the complete database architecture for the Varnarc platform.

The database must support:

- Public Website
- Admin Panel
- CMS
- Homepage Builder
- Theme Builder
- Finance
- Construction
- Automobile
- Reviews
- Comparison Engine
- Business Directory
- AI Tools
- Advertisement Engine
- Analytics
- Notifications
- Search
- User Accounts
- Future Premium Features

The design must support horizontal scaling, modular development, and future expansion without requiring schema redesign.

---

# Database Goals

The database must be:

- Normalized
- Highly indexed
- Secure
- Cloud ready
- Scalable
- Maintainable
- Migration friendly
- Audit friendly
- Multi-language ready
- Multi-theme ready

---

# Database Technology

Database

- PostgreSQL (Neon)

ORM

- Prisma

Migration

- Prisma Migrate

Seeding

- Prisma Seed

UUID Strategy

- UUID v4 for all entities

Soft Delete Strategy

deleted_at

Audit Fields

created_at

updated_at

deleted_at

created_by

updated_by

---

# Domain Architecture

Identity

Users

Roles

Permissions

User Roles

Role Permissions

Sessions

Login History

Audit Logs

CMS

Articles

Article Versions

Categories

Tags

Comments

Pages

SEO Metadata

Homepage Builder

Layouts

Sections

Widgets

Widget Instances

Widget Settings

Theme Builder

Themes

Fonts

Colors

Layouts

CSS Variables

Media

Media

Folders

Albums

Tags

Versions

Advertisement

Campaigns

Advertisements

Placements

Impressions

Clicks

Sponsors

Calculator Engine

Calculators

Fields

Field Types

Formula Engine

Calculation History

Saved Results

Finance

Banks

Loans

Interest Rates

EMI Calculators

Construction

Materials

Estimators

Cost Templates

Automobile

Brands

Models

Variants

Specifications

Reviews

Products

Review Sections

Scores

Pros

Cons

Comparison Engine

Comparisons

Items

Attributes

Directory

Businesses

Locations

Services

Business Categories

Business Reviews

AI

Prompts

AI Models

AI Jobs

Generated Content

Analytics

Page Views

Sessions

Traffic Sources

Search Queries

Click Events

Newsletter

Subscribers

Campaigns

Templates

Notifications

Templates

Notifications

User Notifications

Settings

General

SEO

Email

Ads

Theme

System

Feature Flags

Premium

Plans

Subscriptions

Payments

Invoices

Transactions

Translations

Languages

Translation Keys

Translation Values

---

# Database Standards

Every table shall contain:

id

created_at

updated_at

deleted_at

created_by

updated_by

UUID primary key

Indexes where required

---

# Naming Convention

Tables

snake_case plural

Columns

snake_case

Primary Keys

id

Foreign Keys

entity_id

Indexes

idx_

Unique Constraints

uq_

---

# Relationships

Identity

User

↓

Articles

↓

Media

↓

Reviews

↓

Audit Logs

CMS

Categories

↓

Articles

↓

Tags

↓

SEO

Homepage Builder

Layouts

↓

Sections

↓

Widgets

↓

Widget Instances

Advertisement

Campaign

↓

Advertisements

↓

Clicks

↓

Analytics

---

# Index Strategy

Single Indexes

slug

email

status

published_at

created_at

author_id

category_id

Composite Indexes

(status, published_at)

(category_id, status)

(author_id, published_at)

(slug, status)

Full Text

title

content

excerpt

JSON Indexes

metadata

settings

---

# Constraints

Unique

email

slug

role_name

permission_name

Foreign Keys

CASCADE

RESTRICT

SET NULL

NOT NULL

CHECK constraints

Enum validation

---

# Transactions

Use Prisma Transactions for:

Publishing articles

User creation

Advertisement campaigns

Homepage publishing

Calculator publishing

Media uploads

AI generation

Payments

---

# Performance

Cursor Pagination

Batch Queries

Connection Pooling

Redis Cache

Materialized Views

Lazy Loading

Database Views

Read Optimizations

---

# Backup Strategy

Daily backup

Point-in-time recovery

Migration rollback

Seed restoration

---

# Security

No passwords stored

Auth0 user id

Encrypted secrets

Audit logs

RBAC

Database constraints

SQL Injection prevention

Row ownership

---

# API Impact

Authentication

CMS

Homepage

Advertisements

Analytics

Reviews

Directory

Calculators

AI

Media

Settings

Notifications

Every API shall use Prisma Repository classes.

---

# Future Expansion

The schema shall support without breaking changes:

Marketplace

Forums

Events

Courses

Job Board

API Marketplace

Plugins

Themes

White-label installations

Multi-tenancy

Mobile applications

---

# Cursor Implementation Prompt

Implement the complete database architecture for the Varnarc Platform.

Requirements:

- Use PostgreSQL and Prisma ORM.
- Build a fully normalized schema organized by domain modules.
- Use UUID primary keys for all entities.
- Include audit fields (created_at, updated_at, deleted_at, created_by, updated_by).
- Implement proper foreign keys, indexes, unique constraints, enums, and cascading rules.
- Organize models by feature while maintaining a single Prisma schema.
- Support RBAC with users, roles, permissions, user_roles, and role_permissions.
- Design the database to support CMS, Homepage Builder, Theme Builder, Media Library, Advertisement Engine, Calculator Engine, Reviews, Comparisons, Business Directory, AI Tools, Analytics, Notifications, Newsletter, SEO, and future Premium features.
- Implement Prisma migrations and comprehensive seed scripts.
- Optimize for high-read workloads using indexes and cursor-based pagination.
- Use Prisma transactions for multi-table operations.
- Prepare the schema for future multilingual content, plugins, and multi-tenancy without requiring breaking changes.
- Generate complete Prisma models, repository classes, validation schemas, migration files, and developer documentation.

---

# Acceptance Criteria

✅ Complete normalized schema

✅ Prisma models implemented

✅ All relationships defined

✅ Indexes optimized

✅ RBAC supported

✅ Seed scripts created

✅ Migrations tested

✅ Soft deletes implemented

✅ Audit logging supported

✅ Cursor pagination implemented

✅ Performance optimized

✅ Fully documented