# SmartQR — Complete AI-Agent Development Specification

**Document version:** 1.0  
**Product:** SmartQR  
**Status:** MVP Development Specification  
**Primary goal:** Provide an implementation-ready specification that can be handed to an AI coding agent and executed phase-by-phase.

---

# 1. Product Overview

## 1.1 Vision

SmartQR is a web application for creating, managing, customizing, and sharing QR codes for practical business and personal use cases.

The product should go beyond a basic QR generator by supporting **dynamic QR codes**. A dynamic QR code points to a permanent SmartQR URL, allowing the destination/content to be changed later without reprinting the QR code.

Example:

```text
Printed QR
    |
    v
https://smartqr.example/q/A7K92P
    |
    v
SmartQR Resolver
    |
    +--> Website redirect
    +--> Google Maps
    +--> Phone
    +--> Email
    +--> Contact
    +--> WhatsApp
    +--> Wi-Fi
    +--> File
    +--> Multi-link landing page
```

## 1.2 Product positioning

Suggested positioning:

> **One QR. Everything connected.**

The MVP should have two conceptual experiences:

### Quick QR
For users who need a simple QR code quickly.

### Smart QR
For users who need editable destinations, hosted files, landing pages, branding, and analytics.

---

# 2. MVP Scope

## 2.1 Included

The MVP must support:

1. User registration/login/logout
2. Dashboard
3. QR CRUD
4. Dynamic QR URLs
5. URL QR
6. Google Maps QR
7. Phone QR
8. Email QR
9. Contact/vCard QR
10. WhatsApp QR
11. Wi-Fi QR
12. Text QR
13. File QR
14. Multi-link QR
15. Local/server file storage
16. QR customization
17. PNG export
18. SVG export
19. QR enable/disable
20. QR duplication
21. Basic scan analytics
22. Mobile-friendly landing pages
23. Input validation
24. File validation
25. Authorization/ownership checks
26. Automated tests
27. Production deployment documentation

## 2.2 Explicitly out of MVP

Do not implement these until MVP is stable:

- Google Drive
- Dropbox
- OneDrive
- Amazon S3 integration
- Custom domains
- Team accounts
- White labeling
- Billing/subscriptions
- Advanced analytics
- API marketplace
- AI-generated landing pages
- Bulk QR generation
- Enterprise administration
- Payment QR integrations
- App deep-linking
- SMS provider integrations

The architecture must allow these to be added later.

---

# 3. Product Principles

The AI agent MUST follow these principles:

1. Dynamic QR codes use permanent SmartQR URLs.
2. Public QR URLs must never expose internal database IDs.
3. QR business logic must be modular by QR type.
4. Storage must use an abstraction/interface.
5. Authenticated database access must verify ownership.
6. All user input must be validated server-side.
7. File uploads must be validated and secured.
8. The UI must be mobile-first.
9. Every meaningful feature must have tests.
10. Avoid unnecessary dependencies.
11. Prefer simple, maintainable architecture over premature microservices.
12. Do not introduce cloud-specific assumptions into core business logic.

---

# 4. Recommended Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

## Backend

Use Next.js server-side functionality for the MVP:

- Route Handlers
- Server Actions where appropriate
- Server Components
- Server-side services

Do not create a separate backend service unless a demonstrated requirement appears.

## Database

- PostgreSQL
- Prisma ORM

## Authentication

Use a mature authentication solution compatible with Next.js. Auth.js is the preferred starting point.

Passwords must be hashed using a modern password hashing algorithm supported by the selected authentication implementation.

## QR generation

Use a mature QR-code library with support for PNG/SVG generation.

## Testing

- Vitest or Jest for unit/integration tests
- Playwright for end-to-end tests

## Formatting/linting

- ESLint
- Prettier
- TypeScript strict mode

---

# 5. System Architecture

```text
                         +----------------------+
                         |      Web Browser     |
                         | Desktop / Mobile     |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |       Next.js        |
                         |                      |
                         | UI                   |
                         | Server Components    |
                         | API Route Handlers   |
                         | Authentication       |
                         +----------+-----------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
              v                     v                     v
       +-------------+       +-------------+       +-------------+
       | PostgreSQL  |       | QR Service  |       | File Service|
       |             |       |             |       |             |
       +-------------+       +-------------+       +------+------+
                                                        |
                                              +---------+---------+
                                              |                   |
                                              v                   v
                                        Local Storage        Future Cloud
                                                           Storage Providers
```

---

# 6. Recommended Project Structure

```text
smartqr/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── qr/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── files/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── q/
│   │   └── [shortCode]/
│   │
│   ├── file/
│   │   └── [shortCode]/
│   │
│   ├── api/
│   │   ├── qr/
│   │   ├── files/
│   │   └── analytics/
│   │
│   ├── page.tsx
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── qr/
│   │   ├── QRTypeSelector.tsx
│   │   ├── QRForm.tsx
│   │   ├── QRPreview.tsx
│   │   ├── QRCustomizer.tsx
│   │   └── QRDownload.tsx
│   ├── dashboard/
│   ├── landing/
│   └── forms/
│
├── lib/
│   ├── auth/
│   ├── qr/
│   │   ├── types.ts
│   │   ├── generator.ts
│   │   ├── resolver.ts
│   │   ├── validators.ts
│   │   ├── payloads/
│   │   └── resolvers/
│   ├── storage/
│   │   ├── interface.ts
│   │   ├── local.ts
│   │   └── factory.ts
│   ├── analytics/
│   ├── security/
│   ├── db/
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── docs/
├── .env.example
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

# 7. Core Domain Model

## 7.1 User

Fields:

```text
id
name
email
passwordHash / auth-provider data
avatarUrl
createdAt
updatedAt
```

## 7.2 QRCode

Fields:

```text
id
userId
shortCode
name
type
data
status
isDynamic
createdAt
updatedAt
deletedAt
```

Recommended enum:

```text
QRType:
URL
MAP
PHONE
EMAIL
CONTACT
WHATSAPP
WIFI
TEXT
FILE
MULTI_LINK
```

Recommended status:

```text
ACTIVE
DISABLED
EXPIRED
DELETED
```

## 7.3 QRDesign

Fields:

```text
id
qrCodeId
foregroundColor
backgroundColor
dotStyle
cornerStyle
eyeStyle
frameStyle
frameText
logoFileId
errorCorrectionLevel
createdAt
updatedAt
```

## 7.4 File

Fields:

```text
id
userId
qrCodeId
originalName
storedName
mimeType
size
storageProvider
storageKey
downloadCount
createdAt
updatedAt
deletedAt
```

## 7.5 Scan

Fields:

```text
id
qrCodeId
timestamp
ipHash
userAgent
deviceType
browser
os
country
city
referrer
```

Do not store raw IP addresses indefinitely.

## 7.6 MultiLinkPage

Fields:

```text
id
qrCodeId
title
description
logoFileId
theme
createdAt
updatedAt
```

## 7.7 MultiLinkItem

Fields:

```text
id
pageId
label
icon
url
sortOrder
enabled
createdAt
updatedAt
```

---

# 8. Prisma Schema Requirements

The exact implementation may vary, but the schema must enforce:

- User-to-QR ownership
- Unique shortCode
- QR-to-design one-to-one
- User-to-file ownership
- Optional QR-to-file relationship
- QR-to-scan relationship
- MultiLink page-to-items relationship
- Soft deletion where appropriate
- Indexes for frequent lookups

Required indexes:

```text
QRCode.shortCode UNIQUE
QRCode.userId
QRCode.type
QRCode.status
File.userId
File.qrCodeId
Scan.qrCodeId
Scan.timestamp
```

Use foreign keys and cascading behavior deliberately. Do not blindly use cascade deletes where historical analytics should remain.

---

# 9. QR Architecture

## 9.1 QR type interface

Use a modular interface.

Conceptually:

```typescript
interface QRTypeHandler<TData> {
  type: QRType;
  schema: ZodSchema<TData>;
  generatePayload(data: TData): string;
  validate(data: TData): ValidationResult;
}
```

For dynamic QR resolution:

```typescript
interface QRResolver {
  canResolve(type: QRType): boolean;
  resolve(qr: QRCode): Promise<Response>;
}
```

Each QR type must have its own implementation.

---

# 10. QR Types

## 10.1 URL

Input:

```text
URL
```

Validation:

- Must be a valid URL
- Support http/https
- Reject dangerous protocols

Dynamic behavior:

```text
/q/A7K92P
   |
   +--> 302 --> destination URL
```

## 10.2 Google Maps

Input:

```text
label
latitude
longitude
optional place query
```

Store coordinates as structured data.

Do not depend only on a generated Google Maps URL.

## 10.3 Phone

Input:

```text
phone number
```

Generate:

```text
tel:+968XXXXXXXX
```

Validate according to international number conventions where practical.

## 10.4 Email

Input:

```text
email
subject
body
```

Generate a properly URL-encoded mailto URI.

## 10.5 Contact

Input:

```text
firstName
lastName
organization
jobTitle
phone
email
website
street
city
state
postalCode
country
```

Generate vCard 3.0 or a compatible modern vCard format.

Also provide a downloadable `.vcf`.

## 10.6 WhatsApp

Input:

```text
phone
optional message
```

Generate an HTTPS WhatsApp URL.

Validate phone data and encode message safely.

## 10.7 Wi-Fi

Input:

```text
SSID
password
security
hidden
```

Support:

```text
WPA
WEP
nopass
```

Generate a standard Wi-Fi QR payload.

## 10.8 Text

Input:

```text
text
```

Generate QR payload containing the text.

## 10.9 File

Input:

```text
uploaded file
```

QR points to SmartQR rather than directly to a filesystem URL.

## 10.10 Multi-Link

QR points to:

```text
/q/A7K92P
```

The resolver renders a mobile landing page.

---

# 11. Dynamic QR Resolution

Public route:

```text
GET /q/:shortCode
```

Algorithm:

```text
1. Validate shortCode format
2. Find QR by shortCode
3. If missing -> 404
4. Check status
5. Check expiration/access rules
6. Record analytics
7. Resolve based on QR type
8. Redirect or render content
```

Pseudo-code:

```typescript
async function resolveQRCode(shortCode: string) {
  const qr = await qrRepository.findByShortCode(shortCode);

  if (!qr) {
    return notFound();
  }

  if (qr.status !== "ACTIVE") {
    return renderInactivePage();
  }

  await analyticsService.recordScan(qr);

  return qrResolver.resolve(qr);
}
```

---

# 12. Short Code Requirements

Short codes must:

- Be cryptographically random
- Be unique
- Not expose database sequence values
- Have enough entropy
- Be URL-safe
- Be reasonably short

Example:

```text
A7K92P
X82KD9
M5P2Q8
```

Public QR:

```text
https://YOUR_DOMAIN/q/A7K92P
```

Never:

```text
/q/123
/q/124
```

---

# 13. Storage Architecture

Create an abstraction:

```typescript
interface StorageProvider {
  upload(input: UploadInput): Promise<StoredFile>;
  download(key: string): Promise<ReadableStream | Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
}
```

MVP implementation:

```text
LocalStorageProvider
```

Future:

```text
S3StorageProvider
GoogleDriveProvider
DropboxProvider
OneDriveProvider
```

Application/business logic must never directly call `fs` or a cloud SDK.

It must call:

```text
StorageProvider
```

---

# 14. Local File Storage

Recommended:

```text
/storage/
    users/
        {userId}/
            {randomStorageKey}
```

Do not use the original filename as the physical filename.

Example:

```text
Original:
restaurant-menu.pdf

Stored:
7c6b1c4f-9d9d-4a4a-9c6c.pdf
```

Metadata stores the original filename.

---

# 15. File Upload Security

MVP must implement:

- Maximum file size
- MIME allowlist
- Extension validation
- Filename sanitization
- Random storage names
- Authentication for uploads
- Ownership checks
- No executable files
- No direct filesystem path exposure
- Rate limiting
- Error handling
- Optional antivirus integration point

Suggested initial safe formats:

```text
PDF
PNG
JPG/JPEG
WEBP
TXT
DOCX
XLSX
PPTX
```

The exact list may be adjusted based on deployment requirements.

Do not permit:

```text
exe
bat
cmd
sh
ps1
dll
so
msi
```

and other executable formats.

---

# 16. File Serving

Do not expose:

```text
/uploads/file.pdf
```

Instead use:

```text
/file/:shortCode
```

or resolve through:

```text
/q/:shortCode
```

The server controls access.

---

# 17. Multi-Link Landing Page

A Multi-Link QR should render a mobile-first page.

Example:

```text
+--------------------------+
|          LOGO            |
|                          |
|      ABC RESTAURANT      |
|  Authentic Indian Food   |
|                          |
| +----------------------+ |
| | 🍽️ View Menu         | |
| +----------------------+ |
|                          |
| +----------------------+ |
| | 📍 Find Us            | |
| +----------------------+ |
|                          |
| +----------------------+ |
| | 📞 Call               | |
| +----------------------+ |
|                          |
| +----------------------+ |
| | 💬 WhatsApp           | |
| +----------------------+ |
|                          |
| +----------------------+ |
| | ⭐ Google Reviews     | |
| +----------------------+ |
+--------------------------+
```

Users can:

- Add links
- Edit links
- Delete links
- Reorder links
- Enable/disable links
- Change title
- Change description
- Upload logo
- Select theme

---

# 18. Dashboard UX

Main navigation:

```text
Dashboard
QR Codes
Files
Analytics
Settings
```

Dashboard cards:

```text
Total QR Codes
Active QR Codes
Total Scans
Files Stored
```

QR table:

```text
Name
Type
Status
Scans
Updated
Actions
```

Actions:

```text
Edit
Duplicate
Download
Analytics
Disable
Delete
```

---

# 19. Create QR UX

Use a three-step wizard.

## Step 1

Select QR type.

Cards:

```text
Website
Location
Phone
Email
Contact
WhatsApp
Wi-Fi
Text
File
Multi-Link
```

## Step 2

Show a type-specific form.

## Step 3

Show:

```text
Live Preview
Customization
Save
```

---

# 20. QR Customization

MVP:

- Foreground color
- Background color
- Dot style
- Corner style
- Eye style
- Frame
- Frame text
- Logo
- Error correction

Default to a high error-correction level when a logo is used.

The UI must warn users if color contrast or customization risks scan reliability.

---

# 21. Export

MVP formats:

```text
PNG
SVG
```

Later:

```text
PDF
EPS
```

Download names should be sanitized:

```text
restaurant-menu-qr.png
```

---

# 22. Analytics

Record:

```text
timestamp
device type
browser
OS
country
city where reliable
referrer
```

Dashboard metrics:

```text
Total scans
Today
Last 7 days
Last 30 days
Scans by day
Device breakdown
Browser breakdown
OS breakdown
```

Avoid collecting unnecessary personal data.

---

# 23. Analytics Privacy

Do not retain raw IP addresses indefinitely.

Preferred approach:

```text
incoming IP
    |
    v
one-way hash / privacy-preserving processing
    |
    v
stored analytics
```

Document the analytics behavior in the privacy policy.

---

# 24. Authentication

Required:

```text
Register
Login
Logout
Forgot Password
Reset Password
```

Optional after MVP:

```text
Google OAuth
Apple OAuth
```

Protected routes:

```text
/dashboard/*
/api/qr/*
/api/files/*
/api/analytics/*
```

Public:

```text
/q/*
```

---

# 25. Authorization

Every authenticated resource operation must verify:

```text
resource.userId === currentUser.id
```

Never trust a client-provided:

```text
userId
```

Never authorize based solely on:

```text
resource ID
```

Use server-side session identity.

---

# 26. API Specification

## QR APIs

```text
GET    /api/qr
POST   /api/qr
GET    /api/qr/:id
PUT    /api/qr/:id
DELETE /api/qr/:id
POST   /api/qr/:id/duplicate
POST   /api/qr/:id/enable
POST   /api/qr/:id/disable
GET    /api/qr/:id/analytics
```

## File APIs

```text
POST   /api/files
GET    /api/files
GET    /api/files/:id
DELETE /api/files/:id
```

## Public APIs/routes

```text
GET /q/:shortCode
GET /file/:shortCode
```

---

# 27. API Response Convention

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid URL"
  }
}
```

Do not leak:

- stack traces
- database errors
- filesystem paths
- secrets
- internal implementation details

---

# 28. Validation

Use Zod schemas.

Every QR type must have a schema.

Example:

```typescript
const UrlQRSchema = z.object({
  url: z.url().refine(
    value => ["http:", "https:"].includes(new URL(value).protocol)
  )
});
```

The exact syntax may depend on the Zod version selected.

Validation must occur:

1. Client side for UX
2. Server side for security

Client validation never replaces server validation.

---

# 29. URL Security

Allowed destination protocols should be explicitly controlled.

For URL QR:

```text
https
http
```

Reject:

```text
javascript:
data:
file:
vbscript:
```

For type-specific protocols:

```text
tel:
mailto:
```

are generated by the appropriate QR handler.

Never allow arbitrary protocol injection.

---

# 30. Rate Limiting

Apply rate limiting to:

- Login
- Registration
- Password reset
- QR creation
- File upload
- Public QR resolution where abuse becomes relevant

The implementation may initially use an in-memory strategy for local development, but production must use a distributed or managed mechanism appropriate to the deployment environment.

---

# 31. Error Pages

Implement:

```text
404
QR not found
QR disabled
QR expired
File not found
File unavailable
Upload failed
Unauthorized
Forbidden
Generic server error
```

Public QR errors should be friendly and branded.

---

# 32. Mobile Requirements

Most QR scans will originate from phones.

Therefore:

- Landing pages must be mobile-first
- Buttons must be large enough for touch
- File previews must work on mobile where supported
- QR management may be responsive rather than identical to desktop
- No horizontal scrolling
- Fast initial rendering

Test at minimum:

```text
iOS Safari
Android Chrome
Desktop Chrome
Desktop Edge/Firefox
```

---

# 33. Accessibility

Implement:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Labels for form controls
- Error messages associated with fields
- Sufficient contrast
- Alt text for logos/images
- Accessible buttons
- ARIA only where necessary

---

# 34. SEO

Public landing pages should support:

- Page title
- Description
- Open Graph metadata
- Mobile-friendly layout

Dashboard pages should generally not be indexed.

---

# 35. Testing Plan

## Unit tests

Test:

```text
short-code generator
URL validation
Map data validation
Phone validation
Email validation
vCard generator
Wi-Fi payload generator
WhatsApp URL generator
QR payload generation
QR design validation
storage provider
```

## Integration tests

Test:

```text
create QR
read QR
update QR
delete QR
duplicate QR
enable QR
disable QR
upload file
delete file
resolve QR
record scan
```

## E2E tests

### Test 1 — Registration

```text
Open site
Register
Login
Dashboard appears
```

### Test 2 — URL QR

```text
Login
Create URL QR
Save
Open public QR
Verify redirect
```

### Test 3 — Editable QR

```text
Create URL QR
Open QR -> destination A
Edit destination -> B
Open same QR
Verify destination B
```

### Test 4 — File QR

```text
Upload PDF
Create File QR
Open public QR
Verify file access
```

### Test 5 — Multi-Link

```text
Create page
Add three links
Open public QR
Verify all links
Reorder
Verify new order
```

### Test 6 — Authorization

```text
User A creates QR
User B attempts to edit QR
Request must fail
```

---

# 36. Security Test Cases

The AI agent must test:

```text
Unauthorized QR edit
Unauthorized file delete
Unauthorized analytics access
Invalid short code
SQL injection attempts
XSS payloads
Malicious URLs
Path traversal
Executable file upload
Oversized upload
Invalid MIME
Duplicate short code
Rate-limit behavior
Expired/disabled QR
```

---

# 37. Environment Configuration

Create `.env.example`:

```env
DATABASE_URL=

AUTH_SECRET=

APP_URL=http://localhost:3000

STORAGE_PROVIDER=local

LOCAL_STORAGE_PATH=./storage

MAX_FILE_SIZE_MB=10

ANALYTICS_ENABLED=true
```

Never commit actual credentials.

---

# 38. Local Development

Provide:

```text
docker-compose.yml
```

for PostgreSQL.

Expected setup:

```text
git clone
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

Document the process in README.md.

---

# 39. Development Scripts

Expected:

```text
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run format
npm run db:migrate
npm run db:generate
npm run db:seed
```

If a chosen tool does not support one of these directly, create an equivalent script.

---

# 40. Seed Data

Create development seed data:

```text
Demo User
Demo URL QR
Demo Map QR
Demo Contact QR
Demo Multi-Link QR
```

Never seed production credentials or secrets.

---

# 41. MVP Development Phases

## Phase 0 — Foundation

Tasks:

- Initialize repository
- Configure Next.js
- Configure TypeScript strict mode
- Configure Tailwind
- Configure shadcn/ui
- Configure Prisma
- Configure PostgreSQL
- Add ESLint
- Add Prettier
- Add environment configuration
- Add Docker Compose
- Create README
- Create AGENTS.md
- Create test framework

Acceptance:

```text
Application runs locally.
Database connects.
TypeScript passes.
Lint passes.
Test framework runs.
```

---

## Phase 1 — Authentication

Tasks:

- User model
- Auth configuration
- Registration
- Login
- Logout
- Password reset architecture
- Protected routes
- Session handling

Acceptance:

```text
Unauthenticated user cannot access dashboard.
Authenticated user can access dashboard.
```

---

## Phase 2 — QR Core

Tasks:

- QRCode model
- QRDesign model
- short-code generation
- QR CRUD
- dashboard list
- create QR UI
- edit QR UI
- delete/soft delete
- duplicate
- enable/disable

Acceptance:

```text
User can create and manage a QR record.
```

---

## Phase 3 — QR Type Engine

Implement:

```text
URL
PHONE
EMAIL
MAP
WHATSAPP
CONTACT
WIFI
TEXT
```

Each must contain:

```text
schema
form
payload generator
preview
tests
```

Acceptance:

```text
Every supported QR produces a scannable QR payload.
```

---

## Phase 4 — Dynamic QR Resolver

Tasks:

- /q/:shortCode
- lookup
- status handling
- type resolver
- redirects
- landing-page rendering hooks
- scan recording hook

Acceptance:

```text
QR remains unchanged when destination changes.
```

---

## Phase 5 — File Storage

Tasks:

- StorageProvider interface
- LocalStorageProvider
- upload endpoint
- file metadata
- file listing
- deletion
- secure file access
- file QR type

Acceptance:

```text
Authenticated user uploads a safe file.
QR points to the file.
File can be accessed.
Unauthorized users cannot manage another user's file.
```

---

## Phase 6 — Multi-Link

Tasks:

- landing page model
- link items
- editor
- reorder
- enable/disable
- public mobile page
- theme
- logo

Acceptance:

```text
User can create a QR that opens a useful mobile landing page.
```

---

## Phase 7 — Customization

Tasks:

- color
- shape
- eye style
- dot style
- frame
- logo
- live preview
- PNG export
- SVG export

Acceptance:

```text
Customized QR remains scannable.
```

---

## Phase 8 — Analytics

Tasks:

- scan table
- scan event
- device parsing
- browser parsing
- OS parsing
- optional geo enrichment
- dashboard metrics
- daily chart

Acceptance:

```text
Scanning a dynamic QR creates an analytics event.
```

---

## Phase 9 — Security & Hardening

Tasks:

- ownership checks
- validation audit
- upload security audit
- URL security audit
- rate limiting
- CSRF/session review
- security headers
- error handling
- logging
- dependency audit

Acceptance:

```text
Security test suite passes.
```

---

## Phase 10 — Production

Tasks:

- production environment
- database migration
- HTTPS
- domain
- storage configuration
- backups
- logging
- monitoring
- smoke tests
- mobile testing
- deployment documentation

Acceptance:

```text
A real user can register, create, publish, scan, edit, and manage QR codes.
```

---

# 42. AI Agent Execution Rules

The AI coding agent MUST:

1. Read `AGENTS.md` before making changes.
2. Read relevant documentation before implementing a feature.
3. Inspect existing code before creating new files.
4. Avoid unnecessary rewrites.
5. Make small, coherent changes.
6. Run type checking after meaningful changes.
7. Run tests after meaningful changes.
8. Fix failures rather than ignoring them.
9. Update documentation when architecture changes.
10. Never hardcode credentials.
11. Never weaken security to make a test pass.
12. Never silently remove existing functionality.
13. Ask for clarification only when a requirement is genuinely ambiguous.
14. Prefer existing dependencies/components.
15. Keep business logic out of UI components.
16. Keep storage provider details out of business logic.
17. Keep QR type logic modular.
18. Verify authorization for every protected operation.

---

# 43. AI Agent Prompt — Initial Project

Use this prompt with the coding agent:

```text
You are the lead software engineer for SmartQR.

Read AGENTS.md and all documentation under /docs before coding.

Your task is to build the SmartQR MVP according to the specification.

Do not attempt to build the entire product in one step.

First:
1. Inspect the repository.
2. Identify the current state.
3. Create a concise implementation plan for Phase 0.
4. Implement only Phase 0.
5. Run typecheck, lint and tests.
6. Fix all errors.
7. Summarize files changed and commands executed.

Do not implement future phases unless explicitly instructed.
Do not introduce unnecessary dependencies.
Do not weaken security for convenience.
```

---

# 44. AI Agent Prompt — Phase 1

```text
Implement Phase 1: Authentication.

Read:
- AGENTS.md
- PRODUCT_REQUIREMENTS.md
- ARCHITECTURE.md
- DATABASE_SCHEMA.md
- SECURITY_SPECIFICATION.md

Implement:
- User model
- Registration
- Login
- Logout
- Session management
- Protected dashboard
- Password reset architecture

Requirements:
- Server-side validation
- Secure password handling
- Proper authorization
- No credential leakage

Run:
- typecheck
- lint
- unit tests
- integration tests

Fix all failures.

Do not implement QR functionality yet.
```

---

# 45. AI Agent Prompt — Phase 2

```text
Implement Phase 2: QR Core.

Implement:
- QRCode model
- QRDesign model
- secure short-code generation
- QR CRUD
- dashboard
- create/edit/delete
- duplicate
- enable/disable

Use the architecture in the specification.

Requirements:
- Every QR belongs to the authenticated user.
- No internal database IDs in public QR URLs.
- Validate all input.
- Use soft deletion where specified.

Add unit and integration tests.

Run typecheck, lint and tests.
Fix all failures before finishing.
```

---

# 46. AI Agent Prompt — Phase 3

```text
Implement Phase 3: QR Type Engine.

Implement these QR types:
- URL
- PHONE
- EMAIL
- MAP
- WHATSAPP
- CONTACT
- WIFI
- TEXT

For every type implement:
1. Zod schema
2. UI form
3. payload generator
4. preview
5. server validation
6. unit tests

Use a modular handler architecture.
Do not create one giant conditional function.

Run all tests.
```

---

# 47. AI Agent Prompt — Phase 4

```text
Implement Phase 4: Dynamic QR Resolution.

Create:
GET /q/:shortCode

Implement:
- secure short-code lookup
- active/disabled handling
- type resolution
- redirects
- landing-page hooks
- analytics hook

Requirements:
- Public URLs contain only shortCode.
- Never expose database IDs.
- Validate redirect destinations.
- Do not allow javascript:, data:, file:, vbscript: or equivalent dangerous schemes.
- Keep resolver architecture extensible.

Add E2E tests proving a QR destination can be changed without changing the QR shortCode.
```

---

# 48. AI Agent Prompt — Phase 5

```text
Implement Phase 5: File Storage.

Create:
StorageProvider interface
LocalStorageProvider

Implement:
- secure upload
- file metadata
- listing
- deletion
- file access
- File QR type

Security:
- MIME validation
- extension validation
- maximum size
- randomized physical filenames
- no executable uploads
- path traversal protection
- authorization
- rate limiting where configured

Business logic must not directly depend on filesystem APIs.

Add integration and E2E tests.
```

---

# 49. AI Agent Prompt — Phase 6

```text
Implement Phase 6: Multi-Link Landing Pages.

Implement:
- landing page model
- link items
- CRUD
- ordering
- enable/disable
- title
- description
- logo
- mobile-first public page
- basic themes

The public page must be fast, accessible and responsive.

Add E2E tests for:
- create page
- add links
- reorder links
- disable link
- public rendering
```

---

# 50. AI Agent Prompt — Phase 7

```text
Implement Phase 7: QR Customization.

Implement:
- foreground color
- background color
- dot style
- corner style
- eye style
- frame
- frame text
- logo
- error correction
- PNG export
- SVG export

Provide live preview.

Ensure generated QR remains scannable.

Add tests for payload integrity and export functionality.
```

---

# 51. AI Agent Prompt — Phase 8

```text
Implement Phase 8: Analytics.

Track:
- timestamp
- device
- browser
- OS
- country/city where reliable
- referrer

Implement:
- scan recording
- dashboard totals
- daily chart
- device breakdown
- browser breakdown

Avoid unnecessary personal data.
Do not retain raw IP addresses indefinitely.

Add tests proving:
- scan creates an event
- analytics are scoped to QR owner
- public QR resolution still works if analytics fails
```

---

# 52. AI Agent Prompt — Phase 9

```text
Perform a full SmartQR security hardening pass.

Audit:
- authentication
- authorization
- IDOR
- XSS
- CSRF
- SSRF
- open redirects
- path traversal
- file upload security
- SQL injection
- input validation
- rate limiting
- security headers
- secret handling
- error leakage

Do not change product behavior unnecessarily.

Create or update security tests.

Run:
- typecheck
- lint
- unit tests
- integration tests
- E2E tests
- dependency audit if supported

Fix every confirmed issue.
```

---

# 53. AI Agent Prompt — Phase 10

```text
Prepare SmartQR for production.

Verify:
- build
- database migrations
- environment variables
- HTTPS assumptions
- file storage
- logging
- error handling
- backups
- monitoring
- mobile behavior
- QR scanning
- public routes
- authentication
- authorization

Create:
DEPLOYMENT.md
PRODUCTION_CHECKLIST.md

Do not deploy until all MVP acceptance criteria pass.
```

---

# 54. Definition of Done

A feature is NOT complete when the UI appears to work.

A feature is complete only when:

```text
Implementation
   +
Validation
   +
Authorization
   +
Error handling
   +
Unit tests
   +
Integration tests where appropriate
   +
E2E tests where appropriate
   +
Documentation
   +
Typecheck
   +
Lint
```

all pass.

---

# 55. MVP Acceptance Checklist

## Authentication

- [ ] Registration
- [ ] Login
- [ ] Logout
- [ ] Protected routes
- [ ] Password reset architecture

## QR Types

- [ ] URL
- [ ] Map
- [ ] Phone
- [ ] Email
- [ ] Contact
- [ ] WhatsApp
- [ ] Wi-Fi
- [ ] Text
- [ ] File
- [ ] Multi-Link

## QR Management

- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Duplicate
- [ ] Enable
- [ ] Disable
- [ ] Permanent short code

## Storage

- [ ] Local provider
- [ ] Upload
- [ ] Download
- [ ] Delete
- [ ] MIME validation
- [ ] Size validation
- [ ] Secure naming

## Design

- [ ] Color
- [ ] Shape
- [ ] Logo
- [ ] Frame
- [ ] PNG
- [ ] SVG

## Analytics

- [ ] Total scans
- [ ] Daily scans
- [ ] Device
- [ ] Browser
- [ ] OS

## Security

- [ ] Authorization
- [ ] Input validation
- [ ] Open redirect protection
- [ ] File security
- [ ] Rate limiting
- [ ] Secure sessions
- [ ] No secrets in source

## UX

- [ ] Responsive
- [ ] Mobile-first landing pages
- [ ] Accessible forms
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

# 56. Future Storage Architecture

The MVP should make these possible without changing QR business logic:

```text
StorageProvider
    |
    +-- LocalStorageProvider
    |
    +-- S3StorageProvider
    |
    +-- GoogleDriveProvider
    |
    +-- DropboxProvider
    |
    +-- OneDriveProvider
```

Database example:

```text
storageProvider = GOOGLE_DRIVE
storageKey = provider-specific-file-id
```

The QR resolver should only ask the storage abstraction for the required resource.

---

# 57. Future Product Roadmap

## V2

- Google Drive
- Dropbox
- OneDrive
- S3
- QR expiration
- Password protection
- Advanced analytics
- Templates
- Restaurant menu builder
- Digital business card builder
- Social QR types
- Event QR

## V3

- Custom domains
- Team accounts
- RBAC
- API
- Webhooks
- Bulk QR generation
- CSV import
- White labeling
- Billing
- Enterprise features

---

# 58. Recommended First Market

A strong initial use case is restaurants and small businesses.

Restaurant example:

```text
ABC RESTAURANT

[QR]

Scan

+----------------------+
| 🍽️ View Menu         |
+----------------------+
| 📍 Find Us            |
+----------------------+
| 📞 Call               |
+----------------------+
| 💬 WhatsApp           |
+----------------------+
| ⭐ Review             |
+----------------------+
| 🌐 Website            |
+----------------------+
```

The restaurant can change its menu without reprinting the QR.

This demonstrates the strongest value proposition of the product.

---

# 59. Important Architectural Decisions

## Decision 1

Use a monolithic Next.js application for MVP rather than microservices.

Reason:

- Faster development
- Easier AI-agent implementation
- Lower operational complexity
- Easier deployment

## Decision 2

Use PostgreSQL.

Reason:

- Strong relational model
- Good indexing
- Reliable transactions
- Prisma support

## Decision 3

Use JSON for QR-type-specific data.

Reason:

- Different QR types have different fields
- Avoid excessive tables
- Easy to add types

However, frequently queried fields should remain relational/indexed when needed.

## Decision 4

Use storage abstraction.

Reason:

- Local MVP
- Cloud storage later
- Prevent vendor lock-in

## Decision 5

Use permanent dynamic QR URLs.

Reason:

- Destination can change
- Analytics
- File replacement
- Landing pages
- Future monetization

---

# 60. Product Evolution

The product should evolve from:

```text
QR Generator
```

to:

```text
Smart QR Platform
```

and eventually:

```text
Digital Business Interaction Platform
```

Possible long-term architecture:

```text
                         SmartQR Platform
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
        QR Generator       Landing Pages       File Hosting
             |                  |                  |
             +------------------+------------------+
                                |
                                v
                           Analytics
                                |
                                v
                       Business Management
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
          Menus             Contacts           Reviews
             |
             v
          Events
```

---

# 61. Final AI-Agent Instruction

The coding agent should treat this document as the source of truth for MVP implementation.

When requirements conflict:

1. Security requirements win.
2. Explicit user requirements win over assumptions.
3. Existing architecture wins over unnecessary rewrites.
4. MVP scope wins over future features.
5. Maintainability wins over cleverness.

The agent must never silently expand MVP scope.

Before declaring the project complete, it must produce:

```text
1. README.md
2. AGENTS.md
3. Database schema
4. API documentation
5. Security documentation
6. Test suite
7. Deployment documentation
8. MVP acceptance report
```

The final report should include:

```text
Implemented features
Known limitations
Tests executed
Test results
Environment requirements
Deployment steps
Future recommendations
```

---

# 62. Suggested Repository Documentation

Create these files:

```text
docs/
├── PRODUCT_REQUIREMENTS.md
├── MVP_SCOPE.md
├── ARCHITECTURE.md
├── DATABASE_SCHEMA.md
├── API_SPECIFICATION.md
├── QR_TYPES.md
├── STORAGE_ARCHITECTURE.md
├── UI_UX_SPECIFICATION.md
├── SECURITY_SPECIFICATION.md
├── ANALYTICS_SPECIFICATION.md
├── TEST_PLAN.md
├── DEVELOPMENT_PLAN.md
└── DEPLOYMENT.md
```

This structure gives an AI coding agent enough context to work incrementally without needing the entire product explained again in every prompt.

---

# 63. MVP Success Definition

SmartQR MVP is successful when a new user can:

```text
Visit SmartQR
    ↓
Create account
    ↓
Login
    ↓
Create a QR
    ↓
Choose a type
    ↓
Enter information
    ↓
Customize it
    ↓
Save it
    ↓
Download it
    ↓
Print/share it
    ↓
Someone scans it
    ↓
Destination works
    ↓
User can later edit destination
    ↓
Same printed QR continues working
    ↓
User can see scan statistics
```

That is the complete MVP loop.

---

# 64. Recommended Implementation Order

```text
PHASE 0
Foundation
   ↓
PHASE 1
Authentication
   ↓
PHASE 2
QR Core
   ↓
PHASE 3
QR Types
   ↓
PHASE 4
Dynamic Resolver
   ↓
PHASE 5
File Storage
   ↓
PHASE 6
Multi-Link
   ↓
PHASE 7
Customization
   ↓
PHASE 8
Analytics
   ↓
PHASE 9
Security
   ↓
PHASE 10
Production
```

Do not skip directly from Phase 0 to production.

Each phase must pass its acceptance criteria before proceeding.
