# Documentation prompt

Update documentation for: **[CHANGE / MODULE]**

## Update when behavior changes

| Audience | Location |
|----------|----------|
| Module spec status | `varnarc-project-docs/docs/XX-*.md` |
| Implementation status | `project/docs/XX-*-IMPLEMENTATION.md` |
| API module | `apps/api/src/modules/<feature>/README.md` |
| Env vars | `project/.env.example` |
| Ops / deploy | `deploy/`, `docker/README.md` |
| User-visible changes | `CHANGELOG.md` |
| Contributors | `CONTRIBUTING.md`, `cursor/README.md` |

## Format

- Status tables: Done / Partial / Deferred
- Endpoint tables: Method, Path, Permission
- Commands block for verify steps
- Link related implementation docs

## Do not

- Create unsolicited markdown files
- Duplicate content — link to canonical docs

## TSDoc

Add TSDoc on exported functions in `packages/*` when behavior is non-obvious.
