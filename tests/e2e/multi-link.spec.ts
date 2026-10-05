import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "demo@smartqr.example";
const DEMO_PASSWORD = "DemoPassword123!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsDemoUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function createMultiLinkQr(page: Page, name = "Test Multi-Link"): Promise<string> {
  await page.goto("/dashboard/qr");
  await page.getByRole("button", { name: /create.*qr/i }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  // Click the Type selector (shadcn Select doesn't forward id → use aria-haspopup)
  await page.locator("button[aria-haspopup='listbox']").click();
  await page.getByRole("option", { name: "Multi-Link" }).click();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: /create/i }).click();
  // Wait for navigation to detail page
  await page.waitForURL(/\/dashboard\/qr\/[A-Za-z0-9_-]+/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10000 });
  // Wait for the client editor (not just the SSR heading) before returning
  await expect(page.getByRole("button", { name: /add link/i })).toBeVisible({ timeout: 10000 });
  return name;
}

// ---------------------------------------------------------------------------
// Test 1 — create MULTI_LINK QR and verify editor loads
// ---------------------------------------------------------------------------
test("create MULTI_LINK QR and open links editor", async ({ page }) => {
  await loginAsDemoUser(page);
  await createMultiLinkQr(page);

  // The MultiLinkEditor renders inside the <main> with a <form>-like structure
  // Confirm the editor's link section heading is visible
  await expect(page.getByText("Links (0)")).toBeVisible();
  await expect(page.getByRole("button", { name: /add link/i })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 2 — edit page metadata (title, description, theme)
// ---------------------------------------------------------------------------
test("edit page metadata (title, description, theme)", async ({ page }) => {
  await loginAsDemoUser(page);
  await createMultiLinkQr(page, "Meta Test QR");

  // Fill page title (placeholder "My Links")
  await page.getByPlaceholder("My Links").fill("My Public Title");

  // Fill description
  await page.getByPlaceholder("Add a short description...").fill(
    "A short description of the landing page"
  );

  // Select Dark theme (button group, not a select dropdown)
  await page.getByRole("button", { name: "Dark" }).click();

  // Save — button text changes: "Save" → "Saving..." → "Saved!"
  await page.getByRole("button", { name: /save/i }).click();

  // Wait for "Saved!" (final state after save completes)
  await expect(page.getByText("Saved!")).toBeVisible({ timeout: 8000 });
  // The title field should retain the value
  await expect(page.getByPlaceholder("My Links")).toHaveValue("My Public Title");
});

// ---------------------------------------------------------------------------
// Test 3 — add links to a MULTI_LINK QR
// ---------------------------------------------------------------------------
test("add links to a MULTI_LINK QR", async ({ page }) => {
  await loginAsDemoUser(page);
  await createMultiLinkQr(page, "Links Test QR");

  // Click "Add Link" button
  await page.getByRole("button", { name: /add link/i }).click();

  // Wait for link form inputs to appear
  await page.waitForSelector('input[placeholder="Link label"]', { timeout: 5000 });

  // Fill link fields
  await page.getByPlaceholder("Link label").fill("GitHub");
  await page.getByPlaceholder("https://example.com").fill("https://github.com");

  // Save
  await page.getByRole("button", { name: /save/i }).click();

  // Wait for "Saved!" feedback
  await expect(page.getByText("Saved!")).toBeVisible({ timeout: 8000 });

  // Label/URL live in inputs, not as text nodes
  await expect(page.getByPlaceholder("Link label")).toHaveValue("GitHub");
  await expect(page.getByPlaceholder("https://example.com")).toHaveValue("https://github.com");
});

// ---------------------------------------------------------------------------
// Test 4 — public page renders with theme and links (uses direct navigation)
// ---------------------------------------------------------------------------
test("public page renders with theme and links", async ({ page }) => {
  await loginAsDemoUser(page);
  await createMultiLinkQr(page, "Public Page Test");

  // Add a link so the public page has content to verify
  await page.getByRole("button", { name: /add link/i }).click();
  await page.waitForSelector('input[placeholder="Link label"]', { timeout: 5000 });
  await page.getByPlaceholder("Link label").fill("Example Site");
  await page.getByPlaceholder("https://example.com").fill("https://example.com");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Saved!")).toBeVisible({ timeout: 8000 });

  // Extract shortCode from current URL (route is /dashboard/qr/:id where id = shortCode)
  const url = page.url();
  const shortCode = url.split("/").pop()!;

  // Navigate directly to public page
  await page.goto(`/q/${shortCode}`);
  await page.waitForSelector("body", { timeout: 10000 });

  // Verify content
  await expect(page.getByText("Public Page Test")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("Example Site")).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 5 — disabled links are not shown on public page
// ---------------------------------------------------------------------------
test("disabled links are not shown on public page", async ({ page }) => {
  await loginAsDemoUser(page);
  await createMultiLinkQr(page, "Disabled Links Test");

  // Add first link (enabled by default)
  await page.getByRole("button", { name: /add link/i }).click();
  await page.waitForSelector('input[placeholder="Link label"]', { timeout: 5000 });
  await page.getByPlaceholder("Link label").fill("Enabled Link");
  await page.getByPlaceholder("https://example.com").fill("https://enabled.example.com");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Saved!")).toBeVisible({ timeout: 8000 });

  // Add second link and disable it (use .last() — two rows share placeholders)
  await page.getByRole("button", { name: /add link/i }).click();
  await expect(page.getByPlaceholder("Link label")).toHaveCount(2, { timeout: 5000 });
  await page.getByPlaceholder("Link label").last().fill("Disabled Link");
  await page.getByPlaceholder("https://example.com").last().fill("https://disabled.example.com");

  // Uncheck the "Enabled" checkbox
  await page.locator('input[type="checkbox"]').last().uncheck();
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Saved!")).toBeVisible({ timeout: 8000 });

  // Extract shortCode and navigate to public page
  const url = page.url();
  const shortCode = url.split("/").pop()!;
  await page.goto(`/q/${shortCode}`);
  await page.waitForSelector("body", { timeout: 10000 });

  // Enabled link should appear as a link, disabled link should not
  await expect(page.locator("a", { hasText: "Enabled Link" })).toBeVisible({ timeout: 5000 });
  // Use a link selector so we match only the link, not the page heading "Disabled Links Test"
  await expect(page.locator("a", { hasText: "Disabled Link" })).not.toBeVisible({ timeout: 3000 });
});