# SmartQR — Architecture Documentation

## System Overview

SmartQR is built as a monolithic Next.js application (App Router) backed by PostgreSQL and Prisma ORM.

```
Web Client (Desktop / Mobile)
        |
        v
Next.js 16 (App Router)
  ├── UI & Server Components
  ├── Server Actions (Auth, QR Management)
  ├── Route Handlers (/api/auth, /api/qr, /api/files)
  └── Auth.js v5 (Credentials Provider, JWT Session Strategy)
        |
  +-----+-----+
  |           |
  v           v
PostgreSQL   File Storage (LocalStorageProvider -> Cloud in future)
(Aiven)
```

## Phase 1 Components

- **`auth.ts`**: Root Auth.js configuration with Credentials provider and JWT callbacks.
- **`proxy.ts`**: Next.js 16 session keep-alive and route matcher.
- **`lib/security/password.ts`**: bcryptjs wrapper (cost factor 12).
- **`lib/validation/auth.ts`**: Zod schemas for register, sign in, forgot password, reset password.
- **`lib/auth/register.ts`**: User registration service with duplicate checking.
- **`lib/auth/password-reset.ts`**: Cryptographic password reset token generator & verifier with hashed storage.
- **`app/actions/auth.ts`**: Server Actions for authentication flows.
- **`app/dashboard/layout.tsx`**: Server-side layout guard redirecting unauthenticated visitors to `/login`.
