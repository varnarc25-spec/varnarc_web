# 06 - Frontend Architecture

## Purpose

This document defines the frontend architecture for the **Varnarc Platform**.

The frontend is responsible for delivering a fast, responsive, SEO-friendly, and accessible experience for visitors while consuming APIs exposed by the backend.

The architecture must support:

* Public Website
* Finance Tools
* Home & Construction
* Automobile
* Reviews
* Comparison Engine
* Business Directory
* AI Tools
* Search
* User Dashboard
* Authentication
* Dynamic CMS Pages
* Homepage Builder
* Advertisement Placements
* Future Progressive Web App (PWA)

The frontend must be reusable, modular, scalable, and optimized for search engines.

---

# Objectives

The frontend must:

* Use modern React architecture.
* Follow component-driven development.
* Be mobile-first and responsive.
* Deliver excellent Core Web Vitals.
* Support Server-Side Rendering (SSR), Static Site Generation (SSG), and Incremental Static Regeneration (ISR).
* Be accessible (WCAG 2.1 AA).
* Support dark mode and light mode.
* Support multilingual expansion.
* Consume versioned REST APIs.

---

# Technology Stack

Framework

* Next.js (Latest Stable)
* App Router

Language

* TypeScript (Strict Mode)

UI Library

* React

Styling

* Tailwind CSS

Component Library

* shadcn/ui

Icons

* Lucide React

State Management

* TanStack Query
* React Context (lightweight shared state)

Forms

* React Hook Form

Validation

* Zod

Tables

* TanStack Table

Charts

* Recharts

Rich Text Rendering

* react-markdown

Theme Management

* next-themes

Notifications

* Sonner

Date Utilities

* date-fns

---

# Project Structure

```text id="rxevv0"
apps/web/

app/
components/
features/
hooks/
lib/
providers/
services/
stores/
styles/
types/
utils/

public/

assets/

middleware.ts
```

Feature-based organization is required.

---

# Page Architecture

Public Pages

* Home
* Articles
* Categories
* Tags
* Reviews
* Comparisons
* Business Directory
* Finance
* Home & Construction
* Automobile
* AI Tools
* Search
* Contact
* Newsletter
* About
* Privacy Policy
* Terms

Authenticated Pages

* Profile
* Saved Calculations
* Bookmarks
* Notification Center

Future Pages

* Premium Dashboard
* User Contributions
* Community

---

# Layout System

Common Layout

* Header
* Navigation
* Breadcrumbs
* Main Content
* Sidebar
* Advertisement Areas
* Related Content
* Footer

Layouts

* Default
* Full Width
* Article
* Calculator
* Directory
* Review
* Comparison
* Landing Page

Layouts must be configurable by the CMS/Homepage Builder.

---

# Component Architecture

Shared Components

* Button
* Card
* Badge
* Alert
* Dialog
* Drawer
* Tabs
* Accordion
* Table
* Data Grid
* Pagination
* Breadcrumb
* Modal
* Tooltip
* Avatar
* Skeleton
* Spinner
* Toast
* Empty State
* Error State

Business Components

* Article Card
* Review Card
* Calculator Widget
* Business Card
* Advertisement Banner
* Category Grid
* Search Box
* AI Tool Card
* Comparison Table
* Newsletter Form
* Rating Display

All components must be reusable and documented.

---

# Homepage Builder Support

The homepage must be driven entirely by backend configuration.

Supported sections:

* Hero Banner
* Featured Articles
* Trending Topics
* Latest News
* Calculators
* Reviews
* Comparisons
* Business Directory
* AI Tools
* Advertisement Blocks
* Newsletter
* Featured Categories
* Custom HTML Sections

No homepage layout should be hardcoded.

---

# Routing

Use the Next.js App Router.

Examples:

* /
* /articles
* /articles/[slug]
* /categories/[slug]
* /reviews/[slug]
* /compare/[slug]
* /directory
* /directory/[slug]
* /calculators/[slug]
* /ai-tools/[slug]
* /search
* /profile

Dynamic routes must support SEO-friendly slugs.

---

# API Integration

Consume backend APIs only.

Use TanStack Query for:

* Caching
* Background refetching
* Pagination
* Infinite scrolling
* Optimistic updates (where applicable)

Do not access the database directly from the frontend.

---

# Authentication

Integrate Auth0.

Support:

* Login
* Logout
* Session Management
* Protected Routes
* User Profile

Public content must remain accessible without authentication unless explicitly restricted.

---

# Forms

Use React Hook Form with Zod validation.

Forms include:

* Contact
* Newsletter
* Search
* User Profile
* Saved Calculations
* Feedback

Validation must occur on both client and server.

---

# SEO

Implement:

* Dynamic Metadata API
* Open Graph
* Twitter Cards
* JSON-LD
* Canonical URLs
* XML Sitemap
* robots.txt
* Breadcrumb Schema
* FAQ Schema
* Review Schema

Each page type must define its own metadata strategy.

---

# Accessibility

Meet WCAG 2.1 AA standards.

Requirements:

* Semantic HTML
* Keyboard navigation
* Focus management
* ARIA labels
* Sufficient color contrast
* Screen reader compatibility
* Accessible forms and error messages

---

# Error Handling

Implement:

* Global Error Boundary
* Not Found Page
* Loading States
* Skeleton Loaders
* Empty States
* Retry Mechanisms for failed API calls

Display user-friendly messages while logging technical details.

---

# Security

Protect against:

* XSS
* CSRF (where applicable)
* Clickjacking
* Unsafe redirects

Do not expose secrets or sensitive data in the frontend.

---

# Performance

Optimize for Core Web Vitals.

Use:

* SSR
* SSG
* ISR
* Image Optimization
* Code Splitting
* Dynamic Imports
* Lazy Loading
* Prefetching
* Font Optimization
* CDN Caching

Target:

* LCP < 2.5 seconds
* CLS < 0.1
* INP < 200 ms

---

# Internationalization

Prepare the architecture for:

* Multiple languages
* Localized routes
* Localized metadata
* Date and number formatting

Initial release may ship in English only.

---

# Testing

Unit Tests

* Components
* Hooks
* Utilities

Integration Tests

* API integration
* Forms
* Navigation

End-to-End Tests

* Authentication
* Search
* Article pages
* Calculators
* Reviews
* User flows

Use Playwright for E2E testing.

---

# Future Enhancements

Design the frontend so it can support:

* Progressive Web App (PWA)
* Offline caching
* Push notifications
* Mobile applications
* Plugin-based widgets
* Theme marketplace
* White-label deployments

No architectural redesign should be required to add these capabilities.

---

# Cursor Implementation Prompt

Implement the complete frontend architecture for the Varnarc Platform using Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, and Zod.

Requirements:

* Build a feature-based Next.js application with reusable UI components.
* Implement responsive layouts, dark/light theme support, and WCAG 2.1 AA accessibility.
* Consume backend APIs exclusively through a centralized API service layer.
* Integrate Auth0 for authentication and protected routes.
* Create reusable layouts for Home, Articles, Reviews, Comparisons, Directory, Calculators, AI Tools, and User Dashboard.
* Implement homepage sections driven by backend configuration rather than hardcoded layouts.
* Use SSR, SSG, and ISR where appropriate for SEO and performance.
* Optimize images, fonts, bundles, and network requests to achieve excellent Core Web Vitals.
* Build standardized loading, error, empty, and success states.
* Prepare the architecture for multilingual support, PWA capabilities, and future mobile applications.
* Document all shared components, layout patterns, routing conventions, and API integration practices.

---

# Acceptance Criteria

✅ Feature-based Next.js architecture implemented.

✅ Reusable component library established.

✅ Responsive layouts for all supported devices.

✅ Auth0 authentication integrated.

✅ Backend API integration completed.

✅ Homepage driven by CMS configuration.

✅ SEO and metadata implemented.

✅ Accessibility requirements met.

✅ Performance optimized for Core Web Vitals.

✅ Standardized loading and error states implemented.

✅ Unit, integration, and end-to-end tests created.

✅ Frontend architecture fully documented.
