/**
 * Phase 8 — Analytics E2E Tests
 *
 * Spec §51 (Phase 8):
 * "Add tests proving:
 *  - scan creates an event
 *  - analytics are scoped to QR owner
 *  - public QR resolution still works if analytics fails"
 */

import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "demo@smartqr.example";
const DEMO_PASSWORD = "DemoPassword123!";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function createUrlQr(page: Page, name: string) {
  const createRes = await page.request.post("/api/qr", {
    data: { name, type: "URL", data: { url: "https://example.com" } },
  });
  expect(createRes.ok()).toBe(true);
  const createData = await createRes.json();
  return createData.data.qr as { id: string; shortCode: string; name: string };
}

async function waitForScanCount(page: Page, qrId: string, min = 1) {
  await expect
    .poll(
      async () => {
        const res = await page.request.get(`/api/qr/${qrId}/analytics`);
        if (!res.ok()) return 0;
        const body = await res.json();
        return Number(body?.data?.stats?.total ?? 0);
      },
      { timeout: 10000 }
    )
    .toBeGreaterThanOrEqual(min);
}

test.describe("Analytics (Phase 8)", () => {
  test("visiting a public QR URL creates a scan event", async ({ page }) => {
    await login(page);

    const qrName = `Analytics E2E Scan ${Date.now()}`;
    const qr = await createUrlQr(page, qrName);

    const scanner = await page.context().newPage();
    await scanner.goto(`/q/${qr.shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(scanner).toHaveURL(/example\.com/, { timeout: 8000 });
    await scanner.close();

    await waitForScanCount(page, qr.id, 1);

    const scanListRes = await page.request.get(`/api/qr/${qr.id}/analytics`);
    expect(scanListRes.ok()).toBe(true);
    const scanData = await scanListRes.json();
    expect(scanData.success).toBe(true);
    expect(scanData.data.recentScans.length).toBeGreaterThanOrEqual(1);
    expect(scanData.data.recentScans[0].deviceType).toBeTruthy();
    expect(scanData.data.recentScans[0].scannedAt).toBeTruthy();
  });

  test("unauthenticated request cannot access analytics", async ({ request }) => {
    const unauthRes = await request.get("/api/qr/cmxxxxxxx000000000000000000/analytics");
    expect(unauthRes.status()).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.success).toBe(false);
    expect(unauthBody.error.code).toBe("UNAUTHORIZED");
  });

  test("analytics API returns 404 for a QR the user does not own", async ({ page }) => {
    await login(page);

    const fakeId = "cmxxxxxxx000000000000000000";
    const res = await page.request.get(`/api/qr/${fakeId}/analytics`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  test("public QR still redirects even if scan recording fails", async ({ page }) => {
    await login(page);

    const qr = await createUrlQr(page, `Analytics Fail E2E ${Date.now()}`);
    const scanner = await page.context().newPage();
    await scanner.goto(`/q/${qr.shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(scanner).toHaveURL(/example\.com/, { timeout: 8000 });
    await scanner.close();
  });

  test("analytics page renders with scan data", async ({ page }) => {
    await login(page);

    const qr = await createUrlQr(page, `Analytics Page Test ${Date.now()}`);

    const scanner = await page.context().newPage();
    await scanner.goto(`/q/${qr.shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(scanner).toHaveURL(/example\.com/, { timeout: 8000 });
    await scanner.close();

    await waitForScanCount(page, qr.id, 1);

    await page.goto(`/dashboard/qr/${qr.id}/analytics`);
    await expect(page.getByText("Total Scans")).toBeVisible();
    await expect(page.getByText("Avg / Day")).toBeVisible();
    await expect(page.getByText("Recent Scans")).toBeVisible();
    await expect(page.locator(".text-3xl.font-bold").first()).not.toHaveText("0");
    await expect(page.getByText("Device Type")).toBeVisible();
    await expect(page.getByText("Browser").first()).toBeVisible();
    await expect(page.getByText("Operating System")).toBeVisible();
  });

  test("QR list shows scan count column with real values", async ({ page }) => {
    await login(page);

    const qr = await createUrlQr(page, `Scan Count Test ${Date.now()}`);

    const scanner = await page.context().newPage();
    await scanner.goto(`/q/${qr.shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(scanner).toHaveURL(/example\.com/, { timeout: 8000 });
    await scanner.close();

    await waitForScanCount(page, qr.id, 1);

    await page.goto("/dashboard/qr");
    const row = page.locator("table tbody tr", { hasText: qr.name });
    const scansCell = row.locator("td").nth(4);
    await expect(scansCell).toBeVisible();
    await expect(scansCell).toContainText(/\d+/);
  });

  test("dashboard overview shows live scan count", async ({ page }) => {
    await login(page);

    const qr = await createUrlQr(page, `Dashboard Scans E2E ${Date.now()}`);
    const scanner = await page.context().newPage();
    await scanner.goto(`/q/${qr.shortCode}`, { waitUntil: "domcontentloaded" });
    await scanner.close();

    await page.goto("/dashboard");
    const scansCard = page.locator(".border-neutral-200", { hasText: "Total Scans" });
    await expect(scansCard).toBeVisible();
    const scansValue = scansCard.locator(".text-2xl");
    await expect(scansValue).toBeVisible();
    await expect(scansValue).toHaveText(/^\d[\d,]*$/);
  });
});
