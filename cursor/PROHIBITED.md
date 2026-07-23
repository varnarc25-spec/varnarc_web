# Prohibited AI output

Cursor must **never** generate:

| Category | Examples |
|----------|----------|
| Secrets | API keys, passwords, tokens in source or commits |
| SQL injection risk | Raw SQL string concatenation |
| Security bypass | Disabled guards, `@Public()` on admin routes without justification |
| Placeholders | `// TODO implement`, `throw new Error('not implemented')` on core paths |
| Mock production logic | Fake data returned from services in production code paths |
| Debug noise | `console.log` in API services (use `Logger`) |
| Dead code | Large blocks of commented-out code |
| Architecture violations | Prisma in controllers; business logic only in React components |
| Duplicate packages | Copy-pasting validation/types that belong in `@varnarc/*` |
| Framework swaps | NextAuth instead of Auth0, MongoDB instead of Postgres |

When unsure, prefer **extending existing modules** over creating parallel implementations.
