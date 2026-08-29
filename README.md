# E-Commerce Platform

An Express, EJS, and PostgreSQL university project being prepared as a reproducible software-engineering portfolio repository.

## Verified source baseline

- 21 route declarations across 20 unique HTTP method/path combinations
- 14 active PostgreSQL query calls
- 19 active EJS views covering storefront, administrator, member, and seller workflows
- Parameterized database operations for product discovery, registration, and coupon creation

## Local configuration

Copy `.env.example` to `.env`, replace the example database values, and keep `.env` out of Git. The application currently reads its database configuration from environment variables.

Further architecture, schema, test, and Docker documentation will be added as the original monolith is modularized.

## Current architecture

The active backend is divided into configuration, database, repository, service, HTTP, and process-lifecycle modules under `src/`. The repository layer consolidates the original per-product catalog reads into a single parameterized join across `product`, `product_image`, and `member` while the route contract preserves all 20 unique HTTP method/path combinations.

## Security baseline

- New registrations store salted `scrypt` password hashes instead of plaintext values.
- Successful logins transparently upgrade compatible legacy plaintext records.
- Signed, HTTP-only, same-site session cookies carry only the member id, username, and normalized role.
- Administrator, member, and seller workflows enforce route-level role checks.
- Production startup requires an explicit `SESSION_SECRET`.

Run the dependency-free configuration, security, service, repository, and route-contract tests with:

```bash
npm test
```
