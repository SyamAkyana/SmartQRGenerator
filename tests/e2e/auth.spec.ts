import { test, expect } from "@playwright/test";

test.describe("Authentication Flow & Acceptance Tests (Phase 1)", () => {
  const password = "E2ePassword123!";

  test("1. Unauthenticated user cannot access dashboard and is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Verify redirect to login page
    await expect(page).toHaveURL(/\/login/);
    // CardTitle renders as <div data-slot="card-title">, not a heading — use data-slot locator
    await expect(page.locator('[data-slot="card-title"]', { hasText: /sign in/i })).toBeVisible();
  });

  test("2. User registers and is redirected to dashboard", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@smartqr.example`;
    await page.goto("/register");
    await expect(page.locator('[data-slot="card-title"]', { hasText: /create an account/i })).toBeVisible();

    await page.getByLabel(/full name/i).fill("E2E Test User");
    await page.getByLabel(/^email$/i).fill(uniqueEmail);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);

    await page.getByRole("button", { name: /create account/i }).click();

    // Verify redirected to dashboard and sees their name
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /welcome back, E2E Test User/i })).toBeVisible();
    await expect(page.getByText(/smartqr workspace active/i)).toBeVisible();
  });

  test("3. User can log in with demo account and sign out", async ({ page }) => {
    await page.goto("/login");

    // Attempt login with wrong password first
    await page.getByLabel(/email/i).fill("demo@smartqr.example");
    await page.getByLabel(/password/i).fill("WrongPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Login with correct demo credentials
    // React 19's useActionState resets uncontrolled form fields after the action
    // completes — must re-fill email and password before submitting again.
    await page.getByLabel(/email/i).fill("demo@smartqr.example");
    await page.getByLabel(/password/i).fill("DemoPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /welcome back, Demo User/i })).toBeVisible();

    // Sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Attempt to access dashboard again - should be rejected
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});