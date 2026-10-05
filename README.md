# SmartQR — One QR. Everything connected.

SmartQR is a full-featured web application for creating, managing, customizing, and sharing dynamic QR codes for businesses and individuals.

---

## MVP Implementation Status

- [x] **Phase 0 — Foundation**: Next.js 16, TypeScript strict, Tailwind 4, shadcn/ui, Prisma 6, PostgreSQL, Vitest, Playwright.
- [x] **Phase 1 — Authentication**: User registration, login, logout, bcrypt hashing (cost factor 12), JWT session management (Auth.js v5), password reset architecture, protected dashboard routes.
- [x] **Phase 2 — QR Core**: Dynamic QR model, short code generation, QR CRUD, duplicate, enable/disable toggle, pagination, search, dashboard overview.
- [x] **Phase 3 — QR Type Engine**: Modular payload engine supporting all 9 QR types (URL, Google Maps, Phone, Email, vCard, WhatsApp, Wi-Fi, Plain Text, File).
- [x] **Phase 4 — Dynamic QR Resolver**: Public `/q/[shortCode]` redirection engine, mobile landing page components, dynamic vCard download endpoint `/q/[shortCode]/contact.vcf`.
- [x] **Phase 5 — File Storage**: Pluggable storage architecture, magic-byte MIME sniffing, 10MB payload limit, UUID obfuscation, public logo routing.
- [x] **Phase 6 — Multi-Link Landing Pages**: Interactive multi-link pages, link reordering, customizable themes, social icon badges, dynamic editor.
- [x] **Phase 7 — QR Customization**: Real-time canvas styling (dots, corners, gradients), logo embedding, PNG & SVG export dialogs.
- [x] **Phase 8 — Analytics**: Privacy-preserving scan logging (anonymized IP hashing, User-Agent device classification, referrers), real-time scan metrics, interactive charts.
- [x] **Phase 9 — Security & Hardening**: Sliding-window rate limiting engine, HTTP security headers (CSP, HSTS, X-Frame-Options, nosniff), IDOR/authorization checks, URL & XSS hardening, file path traversal defense.
- [x] **Phase 10 — Production**: Multi-stage Docker containerization, health check endpoint (`/api/health`), global error boundaries (`app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`), deployment guide (`docs/DEPLOYMENT.md`), and pre-flight checklist (`docs/PRODUCTION_CHECKLIST.md`).

---

## Prerequisites

- Node.js >= 20.x (v22 recommended)
- npm >= 10
- PostgreSQL database (local or hosted like Aiven / Neon / Supabase)

---

## Getting Started

1. **Clone repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure `DATABASE_URL` and `AUTH_SECRET` (generate with `openssl rand -base64 32`).

3. **Sync database and seed demo data:**
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Default demo credentials: `demo@smartqr.example` / `DemoPassword123!`

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server |
| `npm run build` | Builds production Next.js bundle |
| `npm run start` | Runs production server |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Runs TypeScript strict type checking (`tsc --noEmit`) |
| `npm run format` | Formats codebase with Prettier |
| `npm test` | Runs 300+ unit & integration tests with Vitest |
| `npm run test:e2e` | Runs end-to-end security and functional tests with Playwright |
| `npm run db:push` | Pushes Prisma schema to database |
| `npm run db:migrate` | Creates and applies Prisma migrations |
| `npm run db:seed` | Seeds database with demo records |

---

## Production Deployment & Docker

For complete production setup, Docker containerization, reverse proxy configs, and cloud deployment guides:
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Security Specification](docs/SECURITY_SPECIFICATION.md)

---

## Architecture & Security Highlights

- **Authentication:** Auth.js v5 (NextAuth) using Credentials provider and encrypted JWT sessions.
- **Password Security:** Salted bcrypt hashing with cost factor 12.
- **Rate Limiting:** Sliding-window rate limiter protecting auth, QR mutations, file uploads, and public QR scans.
- **Security Headers:** Strict Content-Security-Policy (CSP), HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff.
- **Data Protection:** Strict IDOR prevention verifying user ownership across all database mutations and queries.
- **Observability:** Production health check endpoint at `/api/health` verifying database and storage subsystem status.
