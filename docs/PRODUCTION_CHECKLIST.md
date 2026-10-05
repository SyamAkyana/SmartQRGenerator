# SmartQR — Production Launch Readiness Checklist

Use this comprehensive checklist before releasing SmartQR to staging or production environments.

---

## 1. Environment & Configuration
- [x] `.env.production` populated with real secrets (never default demo secrets).
- [x] `AUTH_SECRET` generated using cryptographically secure random bytes (`openssl rand -base64 32`).
- [x] `DATABASE_URL` configured with SSL connection parameters (`?sslmode=require`).
- [x] `APP_URL` and `AUTH_URL` match canonical production domain (`https://...`).
- [x] `AUTH_TRUST_HOST=true` configured behind reverse proxies / edge routers.
- [x] `NODE_ENV=production` set across all runner processes.

---

## 2. Database & Data Persistence
- [x] Production database initialized with Prisma migrations (`npx prisma migrate deploy`).
- [x] Foreign keys, indexes on `userId`, `shortCode`, and `qrCodeId` verified in PostgreSQL.
- [x] Backup strategy scheduled (automated pg_dump or managed DB snapshot).
- [x] Connection pooling enabled for high concurrency scenarios.

---

## 3. Security & Hardening (Phase 9 Compliance)
- [x] **Rate Limiting Engine**:
  - `AUTH`: 10 requests / 15 minutes per IP.
  - `QR_MUTATION`: 60 requests / 1 minute.
  - `FILE_UPLOAD`: 20 requests / 1 minute.
  - `PUBLIC_SCAN`: 120 requests / 1 minute.
- [x] **HTTP Security Headers**:
  - `Content-Security-Policy` (CSP) configured.
  - `Strict-Transport-Security` (HSTS) with `preload` and `includeSubDomains`.
  - `X-Frame-Options: DENY` (anti-clickjacking).
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` camera/mic/geo restrictions.
- [x] **IDOR & Authorization**: All QR CRUD, file queries, and multi-link operations enforce user ownership.
- [x] **URL & XSS Defense**: Strict protocol allowlist (`http:`, `https:`, `mailto:`, `tel:`, `geo:`), blocking `javascript:`, `data:`, and control characters.
- [x] **File Upload Security**: Magic byte MIME sniffing, 10MB payload limit, and path traversal blocking.

---

## 4. Storage & Static Assets
- [x] Persistent storage directory configured (`./storage`) with write permissions for the app runner.
- [x] Anonymous access restrictions in place — only uploaded logos mapped to active QR codes or multi-link pages are served publicly (`/api/file/[id]`).
- [x] Stored files named with UUID v4 to prevent file enumeration and overwrite attacks.

---

## 5. QR Core & Functional Verification
- [x] **QR Code Types (All 9 types supported)**:
  1. Website URL
  2. Google Maps / Geolocation
  3. Phone Call
  4. Email Address
  5. Contact vCard (`.vcf`)
  6. WhatsApp Direct Message
  7. Wi-Fi Network Credentials
  8. Plain Text Note
  9. Hosted File & Multi-Link Landing Pages
- [x] **Dynamic QR Resolution**: `/q/[shortCode]` resolves active destinations and redirects accurately.
- [x] **QR Lifecycle Controls**: Enable, disable, duplicate, and delete QR codes.
- [x] **Customization & Export**: Color picker, dots/corners styling, logo embedding, and PNG / SVG downloads.
- [x] **Scan Analytics**: Real-time scan logging, unique device counts, referrers, and daily scan charts.

---

## 6. Error Handling & Monitoring
- [x] Production Health Check endpoint active at `/api/health` (returns 200 on healthy DB/storage, 503 on failure).
- [x] Custom 404 page created (`app/not-found.tsx`).
- [x] Client error boundary created (`app/error.tsx`).
- [x] Global application error boundary created (`app/global-error.tsx`).
- [x] Health check integrated with uptime monitor (e.g. Better Uptime / Datadog / Pingdom).

---

## 7. Build & Quality Assurance
- [x] TypeScript strict typechecking passes with zero errors (`npm run typecheck`).
- [x] Complete Vitest unit & integration test suite passes (`npm test`).
- [x] Playwright E2E security and functional test suites verified.
- [x] Next.js production build (`npm run build`) builds cleanly with zero compilation errors.
