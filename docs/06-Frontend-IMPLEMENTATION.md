# Implementation status — remaining architecture gaps

## Completed in this pass

### CMS Tags API + UI
- `GET/POST/DELETE /api/v1/tags`
- `GET /api/v1/tags/slug/:slug`
- `GET /api/v1/tags/slug/:slug/articles` (ArticleTag relation)
- Web `/tags` and `/tags/[slug]` consume live API with fallbacks

### Comparison API + UI
- `GET /api/v1/comparison`, `GET /comparison/slug/:slug`
- `POST /comparison`, `POST /comparison/:id/publish`, `DELETE /comparison/:id`
- Web `/compare` index + `/compare/[slug]` live-first with demo fallback
- Table (`scope=col`) + Recharts score snapshot

### shadcn-style catalog (`@varnarc/ui`)
- Input, Label, Alert, Separator, Skeleton, Tabs, Dialog, Table (+ prior Button/Card/Badge/Shell)

### PWA
- `public/manifest.webmanifest`, `public/sw.js`, production SW registration
- Metadata `manifest` + `appleWebApp` + themeColor

### i18n scaffolding
- `en` / `hi` message catalogs, `I18nProvider`, header locale switch
- Ready for `[locale]` route expansion later

### WCAG quick wins
- Skip-to-content link
- Global focus-visible rings
- Contact form `aria-invalid` / `aria-describedby`
- Table header scopes

### CI / E2E
- GitHub Actions: typecheck, unit tests, build, Playwright e2e (webServer)
- Expanded smoke: home, articles, tags, compare

## Doc note
Many files under `varnarc-project-docs/docs/08+` are empty stubs. Implementation follows filled docs (`01–06`, database/backend schemas) and this status file.
