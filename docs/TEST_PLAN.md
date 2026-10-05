# SmartQR — Test Plan (Phase 1)

## Unit Tests (`tests/unit/`)
- `auth-validation.test.ts`: Zod schema validation for register, sign in, forgot password, reset password (complexity, confirmation matching, email formatting).
- `password-security.test.ts`: bcrypt hash/verify round-trip, invalid password rejection, cost factor verification.
- `reset-token.test.ts`: Token generation entropy, SHA-256 hash determinism.

## Integration Tests (`tests/integration/`)
- `auth-flow.test.ts`: Real Prisma + Aiven PostgreSQL integration:
  - User registration creates DB record with hashed password.
  - Duplicate email registration rejected with `EMAIL_ALREADY_EXISTS`.
  - Password verification against stored hash works correctly.
  - Password reset flow: token creation, verification, password update, token expiration / reuse rejection.

## E2E Tests (`tests/e2e/`)
- `auth.spec.ts`:
  1. Unauthenticated visitor to `/dashboard` is redirected to `/login`.
  2. Registration form validation and successful account creation redirecting to `/dashboard`.
  3. Sign in with invalid credentials displays error.
  4. Sign in with demo user succeeds and displays dashboard with user details.
  5. Sign out redirects back to `/login` and revokes dashboard access.
