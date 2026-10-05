import { test, expect } from "@playwright/test";

test.describe("Homepage & Instant Static QR Generator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders homepage hero, badges, and interactive generator for guest visitors", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Instant Free QR Codes");
    await expect(page.getByText("Instant Free Generator")).toBeVisible();
    await expect(page.getByText("Zero Sign-Up Required for Static QRs")).toBeVisible();

    // Verify nav links in header banner
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Free Sign Up" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
  });

  test("generates and switches between static QR tabs without logging in", async ({ page }) => {
    const generator = page.locator("#generator");

    // 1. URL tab (default)
    const urlInput = generator.locator("#url-input");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("https://mycoffee.com");

    // 2. Switch to Wi-Fi tab
    await generator.getByRole("button", { name: "Wi-Fi" }).click();
    await expect(generator.getByText("Wi-Fi Network Configuration")).toBeVisible();
    await generator.locator("#wifi-ssid").fill("Guest-Coffee-Net");
    await generator.locator("#wifi-password").fill("SuperSecret123");

    // 3. Switch to vCard tab
    await generator.getByRole("button", { name: "vCard Contact" }).click();
    await expect(generator.getByText("Digital Business Card (vCard)")).toBeVisible();
    await generator.locator("#vc-first").fill("Sarah");
    await generator.locator("#vc-last").fill("Connor");
    await generator.locator("#vc-phone").fill("+15559876543");

    // 4. Switch to Phone tab
    await generator.getByRole("button", { name: "Phone", exact: true }).click();
    await expect(generator.getByText("Direct Phone Call Dialing")).toBeVisible();
    await generator.locator("#phone-input").fill("+15551112222");

    // 5. Switch to SMS tab
    await generator.getByRole("button", { name: "SMS" }).click();
    await expect(generator.getByText("Direct SMS Message")).toBeVisible();

    // 6. Switch to Email tab
    await generator.getByRole("button", { name: "Email" }).click();
    await expect(generator.getByText("Instant Email Draft")).toBeVisible();

    // 7. Switch to Text / Note tab
    await generator.getByRole("button", { name: "Text / Note" }).click();
    await expect(generator.getByText("Plain Text, Address, or Promo Code")).toBeVisible();
  });

  test("triggers Pro Feature Modal when clicking dynamic feature buttons", async ({ page }) => {
    // Click on "Dynamic URL" pro button
    const dynamicBtn = page.getByRole("button", { name: "Dynamic URL" });
    if (await dynamicBtn.isVisible()) {
      await dynamicBtn.click();

      // Modal should appear
      await expect(page.getByText("Dynamic Pro Feature")).toBeVisible();
      await expect(page.getByText("Included with your free account:")).toBeVisible();

      const modal = page.locator(".fixed.inset-0");
      await expect(modal.getByRole("link", { name: "Create Free Account" })).toBeVisible();
      await expect(modal.getByRole("link", { name: "Sign In" })).toBeVisible();

      // Dismiss modal
      await modal.getByText("Or continue with Free Static QR").click();
      await expect(page.getByText("Dynamic Pro Feature")).not.toBeVisible();
    }
  });

  test("customizes color palette, scannability indicator, and download buttons", async ({ page }) => {
    // Check scannability badge
    await expect(page.getByText("100% Scannable")).toBeVisible();

    // Switch to Indigo palette
    await page.getByRole("button", { name: "Indigo" }).click();

    // Check download buttons
    await expect(page.getByRole("button", { name: "PNG (1024px)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vector SVG" })).toBeVisible();
  });

  test("displays comparison table, use cases, and FAQ", async ({ page }) => {
    // Comparison Table
    await expect(page.getByText("Static vs Dynamic QR Codes")).toBeVisible();
    await expect(page.getByText("Free Static QR", { exact: true })).toBeVisible();
    await expect(page.getByText("Dynamic Pro", { exact: true })).toBeVisible();

    // Use cases
    await expect(page.getByText("Built for Every Industry & Workflow")).toBeVisible();
    await expect(page.getByText("Contactless Menus & Guest Wi-Fi")).toBeVisible();

    // FAQ
    await expect(page.getByText("Frequently Asked Questions")).toBeVisible();
    await expect(page.getByText("Can I use the QR generator for free without signing up?")).toBeVisible();
  });
});
