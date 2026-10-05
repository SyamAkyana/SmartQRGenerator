import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "demo@smartqr.example";
const DEMO_PASSWORD = "DemoPassword123!";

async function loginAsDemo(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

test.describe("Phase 9: Security & Hardening E2E Tests", () => {
  test.describe("Security Headers", () => {
    test("verifies HTTP security headers are present on public pages", async ({ page }) => {
      const response = await page.goto("/");
      expect(response).not.toBeNull();
      const headers = response!.headers();

      // Verify CSP header
      expect(headers["content-security-policy"]).toBeTruthy();
      expect(headers["content-security-policy"]).toContain("default-src 'self'");
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");

      // Verify HSTS
      expect(headers["strict-transport-security"]).toBeTruthy();
      expect(headers["strict-transport-security"]).toContain("max-age=");

      // Verify X-Frame-Options
      expect(headers["x-frame-options"]).toBe("DENY");

      // Verify X-Content-Type-Options
      expect(headers["x-content-type-options"]).toBe("nosniff");

      // Verify Referrer-Policy
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

      // Verify Permissions-Policy
      expect(headers["permissions-policy"]).toBeTruthy();
    });

    test("security headers are present on dashboard routes", async ({ page }) => {
      await loginAsDemo(page);
      const response = await page.goto("/dashboard/qr");
      expect(response).not.toBeNull();
      const headers = response!.headers();

      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    });
  });

  test.describe("Authentication Rate Limiting", () => {
    test("displays rate limit message after exceeding login attempts limit", async ({ page }) => {
      await page.goto("/login");

      // Attempt multiple failed logins rapidly until rate limited (limit is 10)
      for (let i = 0; i < 12; i++) {
        await page.getByLabel(/email/i).fill("rate-test@test.local");
        await page.getByLabel(/password/i).fill("WrongPassword123!");
        await page.getByRole("button", { name: /sign in/i }).click();
        await page.waitForTimeout(150);
      }

      // Should display rate limit alert
      await expect(page.getByText(/too many.*attempts/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("URL Input Safety & Validation", () => {
    test("blocks javascript: URL in multi-link item", async ({ page }) => {
      await loginAsDemo(page);
      await page.goto("/dashboard/qr");

      // Create a Multi-Link QR
      await page.getByRole("button", { name: /create.*qr/i }).click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.locator("button[aria-haspopup='listbox']").click();
      await page.getByRole("option", { name: "Multi-Link" }).click();
      const qrName = `Sec-ML-${Date.now()}`;
      await page.getByLabel("Name", { exact: true }).fill(qrName);
      await page.getByRole("button", { name: /create/i }).click();

      // Navigate to Multi-Link editor
      await page.waitForURL(/\/dashboard\/qr\/[A-Za-z0-9_-]+/, { timeout: 15000 });
      await expect(page.getByRole("button", { name: /add link/i })).toBeVisible({ timeout: 10000 });

      // Add a link with javascript: protocol
      await page.getByRole("button", { name: /add link/i }).click();
      await page.waitForSelector('input[placeholder="Link label"]', { timeout: 5000 });
      await page.getByPlaceholder("Link label").fill("Malicious Link");
      await page.getByPlaceholder("https://example.com").fill("javascript:alert('xss')");

      // Attempt to save
      await page.getByRole("button", { name: /save/i }).click();

      // Error message should appear
      await expect(page.getByText(/forbidden protocol|valid URL|failed/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("IDOR Prevention", () => {
    test("prevents accessing another user's QR detail page", async ({ page, context }) => {
      // 1. Login as Demo User (User A) and create a QR
      await loginAsDemo(page);
      await page.goto("/dashboard/qr");

      await page.getByRole("button", { name: /create.*qr/i }).click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      await page.locator("button[aria-haspopup='listbox']").click();
      await page.getByRole("option", { name: "Multi-Link" }).click();
      const uniqueName = `IDOR-Protected-${Date.now()}`;
      await page.getByLabel("Name", { exact: true }).fill(uniqueName);
      await page.getByRole("button", { name: /create/i }).click();

      // Wait for navigation and get QR ID from URL
      await page.waitForURL(/\/dashboard\/qr\/[A-Za-z0-9_-]+/, { timeout: 15000 });
      const currentUrl = page.url();
      const qrId = currentUrl.split("/").pop();
      expect(qrId).toBeTruthy();

      // 2. Open a separate browser context and register User B
      const userBPage = await context.newPage();
      await userBPage.goto("/register");
      const userBEmail = `userb-${Date.now()}@smartqr.test`;
      await userBPage.getByLabel(/full name/i).fill("User B");
      await userBPage.getByLabel(/^email$/i).fill(userBEmail);
      await userBPage.getByLabel(/^password$/i).fill("UserBPassword123!");
      await userBPage.getByLabel(/confirm password/i).fill("UserBPassword123!");
      await userBPage.getByRole("button", { name: /create account/i }).click();
      await expect(userBPage).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // 3. User B tries to navigate directly to User A's QR detail page
      await userBPage.goto(`/dashboard/qr/${qrId}`);

      // 4. Should redirect away to /dashboard/qr and not show User A's QR details
      await expect(userBPage).toHaveURL(/\/dashboard\/qr$/);
      await expect(userBPage.getByText(uniqueName)).not.toBeVisible();
    });
  });
});
