# Phase 3 Plan: QR Design, Public Landing Pages & Analytics

## Context

Phase 1 (Auth ✅) and Phase 2 (QR CRUD ✅) are complete. The Prisma schema already contains stubs for `QRDesign` (unused) and `ScanEvent` (missing). Phase 3 rounds out the product with three value-driving features: design customization, public QR landing pages, and scan tracking.

## 1. QR Design Customization

### Schema additions
```prisma
model ScanEvent {
  id          String   @id @default(cuid())
  qrCodeId    String
  ipAddress   String?
  city        String?
  country     String?
  deviceType  String?  // mobile / desktop / tablet
  browser     String?
  os          String?
  referer     String?
  scannedAt   DateTime @default(now())

  qrCode QRCode @relation(fields: [qrCodeId], references: [id], onDelete: Cascade)

  @@index([qrCodeId])
  @@index([scannedAt])
  @@map("scan_events")
}
```

Extend `QRDesign` fields (already in schema, add Zod validation):
- `foregroundColor` — hex color, e.g. `#1a1a1a`
- `backgroundColor` — hex color, e.g. `#ffffff`
- `dotStyle` — `square | circle | diamond | star | fluid`
- `cornerStyle` — `square | circle | extra-rounded`
- `eyeStyle` — `square | circle | asteroid`
- `frameStyle` — `none | box | banner | pointed | rounded`
- `frameText` — string shown under QR in frame
- `logoFileId` — uploaded logo file reference
- `errorCorrectionLevel` — `L | M | Q | H`

### Design service (`lib/qr/design.ts`)
- `getDesign(qrCodeId)` — fetch or return defaults
- `upsertDesign(qrCodeId, data)` — create or update design
- Zod schema: `designSchema`

### Design picker UI — integrate into Edit QR Dialog
- Color pickers (foreground/background)
- Dot style selector (5 options as visual thumbnails)
- Corner style selector (3 options)
- Eye style selector (3 options)
- Frame style selector (5 options) + text input
- Error correction level selector
- Live QR preview panel (renders actual QR with design options)

### QR Generation service (`lib/qr/generate.ts`)
- Accept `QRCodeRecord` + design options
- Use `qrcode` npm package to generate SVG with custom styles
- Return SVG string

---

## 2. Public QR Landing Page (`/q/[shortCode]`)

### Route: `app/q/[shortCode]/page.tsx`
- Public (no auth required)
- Look up QR by shortCode (active, not deleted)
- If QR type = URL: redirect to target URL (301), record scan event
- If QR type = TEXT: render text content
- If QR type = WIFI: render Wi-Fi credentials with copy button
- For all: record scan event (ip, user-agent, timestamp)

### Record scan before redirect
```ts
async function recordScan(qrId: string, req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  const ip = req.headers.get("x-forwarded-for")
    ?? req.headers.get("x-real-ip")
    ?? null;
  await createScanEvent(qrId, { ip, userAgent: ua });
}
```

Note: Geo-location (city/country) requires an IP geolocation API (e.g. ip-api.com free tier). Defer to Phase 4 unless IP lookup is straightforward.

---

## 3. Analytics Dashboard

### New page: `app/dashboard/qr/[id]/analytics/page.tsx`
- Show scan count over time (7d / 30d / 90d charts)
- Breakdown: device type, browser, OS
- Top countries (if geolocation added)
- Recent scans table

### Service: `lib/qr/analytics.ts`
- `getScanStats(qrCodeId, days)` — count + time series
- `getScanBreakdown(qrCodeId, dimension)` — device, browser, os
- `getRecentScans(qrCodeId, limit)` — last N scan events

### Analytics UI
- Summary cards: total scans, unique visitors, last scan
- Simple bar chart ( recharts or CSS-based)
- Breakdown tables

---

## 4. QR List — add analytics link & design indicator

### QR table column additions
- New column: **Scans** — shows scan count from DB
- New column: **Design** — color dot indicator if customized

### New action in row: "Analytics" button
- Icon: `BarChart3`
- Links to `/dashboard/qr/[id]/analytics`
- Visible always (shows "0 scans" if no data)

---

## 5. Scan recording on public page

### `lib/qr/scan.ts`
```ts
async function recordScan(qrCodeId: string, req: Request): Promise<void> {
  const ua = req.headers.get("user-agent") ?? "";
  const ip = getClientIp(req);
  const { deviceType, browser, os } = parseUserAgent(ua);
  await prisma.scanEvent.create({
    data: { qrCodeId, ipAddress: ip, deviceType, browser, os, scannedAt: new Date() },
  });
}
```

---

## Implementation Order

| Step | File | Work |
|------|------|------|
| 1 | `prisma/schema.prisma` | Add `ScanEvent` model, add missing `Scan` relation |
| 2 | `lib/qr/design.ts` | `getDesign`, `upsertDesign`, Zod schema |
| 3 | `lib/qr/scan.ts` | `recordScan`, `parseUserAgent` |
| 4 | `lib/qr/analytics.ts` | `getScanStats`, `getScanBreakdown`, `getRecentScans` |
| 5 | `app/api/qr/[id]/design/route.ts` | GET/PUT design |
| 6 | `app/q/[shortCode]/page.tsx` | Public landing, redirect, scan recording |
| 7 | `app/dashboard/qr/[id]/analytics/page.tsx` | Analytics UI (server component) |
| 8 | `app/dashboard/qr/[id]/analytics/components/` | Charts, breakdown tables |
| 9 | `lib/qr/generate.ts` | QR SVG generation with design options |
| 10 | `app/dashboard/qr/components/edit-qr-dialog.tsx` | Design picker + live preview |
| 11 | `app/dashboard/qr/components/qr-list.tsx` | Scan count + analytics link column |
| 12 | Unit/integration/E2E tests |

---

## Key Technical Decisions

- **QR generation**: Use `qrcode` npm package (generates SVG strings we can inject into the page). For the design customization, use `qr-code-styling` npm package which supports custom colors, styles, and logo injection natively.
- **Analytics storage**: Simple per-scan row in PostgreSQL. For Phase 3, no aggregation tables — query `scan_events` directly with Prisma's `groupBy` or raw SQL for stats.
- **GeoIP**: Skip for Phase 3 (requires external API). Store raw IP for now.
- **Performance**: The public QR page must respond quickly. Record scan events **after** the redirect using `res.redirect()` + fire-and-forget POST, or use `queueMicrotask` to record after response starts.
- **Dynamic QR**: The QR content itself (`data` field) is already dynamic-capable in Phase 2. No changes needed there.
- **Logo upload**: Phase 3 defers to Phase 4 (file storage needed — S3/Cloudflare R2). Design editor shows logo preview but stores `null` for now.

---

## Success Criteria

- QR codes can be customized with colors and styles from the edit dialog
- Visiting `/q/[shortCode]` shows the QR content and redirects for URL types
- Each public QR visit is recorded as a scan event
- Analytics page shows scan count, time chart, and breakdowns
- All new code has unit tests; E2E tests cover design picker, public redirect, analytics view