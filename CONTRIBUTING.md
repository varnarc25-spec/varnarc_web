# Contributing to Varnarc

## Before you start

1. Read `AI_RULES.md` and the relevant spec in `varnarc-project-docs/docs/`.
2. Copy environment: `cp .env.example .env`
3. Install: `pnpm install`

## Branch strategy

| Type | Pattern | Base |
|------|---------|------|
| Feature | `feature/<short-name>` | `develop` |
| Bug fix | `bugfix/<short-name>` | `develop` |
| Hotfix | `hotfix/<short-name>` | `main` |

No direct commits to `main`.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add comparison export endpoint
fix: correct rate limit on auth sync
docs: update security runbook
test: add validation schema tests
chore: bump eslint dependencies
```

Enforced by Commitlint via Husky (`commit-msg` hook).

## Development workflow

```bash
pnpm dev              # all apps
pnpm dev:api          # API only
pnpm lint             # ESLint (all packages)
pnpm lint:fix         # auto-fix
pnpm format           # Prettier write
pnpm format:check     # Prettier CI check
pnpm typecheck
pnpm test
```

Pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files).

## Pull requests

Each PR must include:

- Clear description and linked issue
- Test evidence (`pnpm test` output or new tests)
- Screenshots for UI changes
- Documentation updates when behavior changes
- No secrets or `.env` files

Use `docs/CODE_REVIEW_CHECKLIST.md` before requesting review.

## Definition of done

- Matches architecture docs
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck` clean
- Tests for critical business logic
- Shared packages used instead of copy-paste
- `CHANGELOG.md` updated for user-visible changes

## Scaffolding new code

See `templates/README.md` for NestJS module, validation, and admin page starters.

## Cursor / AI development

- Prompt library: [`cursor/README.md`](./cursor/README.md)
- Master prompt: [`cursor/MASTER.md`](./cursor/MASTER.md)
- Workflow: [`cursor/WORKFLOW.md`](./cursor/WORKFLOW.md)
- Implementation guide: [`docs/35-Cursor-Prompts-IMPLEMENTATION.md`](./docs/35-Cursor-Prompts-IMPLEMENTATION.md)

## Coding standards

Full reference: `docs/34-Coding-Standards-IMPLEMENTATION.md`
