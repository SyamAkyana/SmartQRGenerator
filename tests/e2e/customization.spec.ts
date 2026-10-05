import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "demo@smartqr.example";
const DEMO_PASSWORD = "DemoPassword123!";

async function loginAsDemoUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function createQr(page: Page, name: string) {
  await page.goto("/dashboard/qr");
  await page.getByRole("button", { name: /create qr code/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel(/name/i).fill(name);
  await page.getByRole("button", { name: /create qr code/i }).last().click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator("table").getByText(name)).toBeVisible();
}

async function openDesignTab(page: Page, qrName: string) {
  const row = page.locator("table tbody tr", { hasText: qrName });
  await row.getByTitle(/edit/i).click();
  await expect(page.getByRole("heading", { name: /edit qr code/i })).toBeVisible();
  await page.getByTestId("design-tab").click();
  await expect(page.getByText(/live preview/i)).toBeVisible();
  await expect(page.getByLabel("Foreground color hex")).toBeVisible();
  await expect(page.getByTestId("save-design-btn")).toBeEnabled({ timeout: 10000 });
}

async function setColorInput(page: Page, which: "Foreground" | "Background", value: string) {
  const hex = page.getByLabel(`${which} color hex`);
  await hex.waitFor({ state: "visible" });
  await hex.fill(value);
  await expect(hex).toHaveValue(value);
}

test.describe("QR Customization & Export (Phase 7)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
  });

  test("customize visual design and save", async ({ page }) => {
    const name = `Design Save ${Date.now()}`;
    await createQr(page, name);
    await openDesignTab(page, name);

    await setColorInput(page, "Foreground", "#1e40af");
    await setColorInput(page, "Background", "#f0f9ff");
    await page.getByTestId("dot-style-circle").click();
    await page.getByTestId("corner-style-extra-rounded").click();
    await page.getByTestId("eye-style-circle").click();

    const saveResponse = page.waitForResponse((res) =>
      res.url().includes("/design") && res.request().method() === "PUT"
    );
    await page.getByTestId("save-design-btn").click();
    const response = await saveResponse;
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Design PUT failed: ${response.status()} ${body}`);
    }
    await expect(page.getByTestId("save-design-btn")).toHaveText(/saved/i, { timeout: 8000 });
  });

  test("design persists after reopening the edit dialog", async ({ page }) => {
    const name = `Design Persist ${Date.now()}`;
    await createQr(page, name);
    await openDesignTab(page, name);

    await setColorInput(page, "Foreground", "#7c3aed");
    await page.getByTestId("dot-style-diamond").click();

    const saveResponse = page.waitForResponse((res) =>
      res.url().includes("/design") && res.request().method() === "PUT"
    );
    await page.getByTestId("save-design-btn").click();
    const response = await saveResponse;
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Design PUT failed: ${response.status()} ${body}`);
    }
    await expect(page.getByTestId("save-design-btn")).toHaveText(/saved/i, { timeout: 8000 });

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("heading", { name: /edit qr code/i })).not.toBeVisible();

    await openDesignTab(page, name);
    await expect(page.getByLabel("Foreground color hex")).toHaveValue("#7c3aed");
    await expect(page.getByTestId("dot-style-diamond")).toHaveClass(/border-blue-500/);
  });

  test("low-contrast colors show a scannability warning", async ({ page }) => {
    const name = `Contrast Warn ${Date.now()}`;
    await createQr(page, name);
    await openDesignTab(page, name);

    await setColorInput(page, "Foreground", "#111111");
    await setColorInput(page, "Background", "#222222");

    const warning = page.getByTestId("contrast-warning");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(/critically low contrast/i);
  });

  test("download dialog exports a PNG with a sanitized filename", async ({ page }) => {
    const name = `Export Menu 2026 ${Date.now()}`;
    await createQr(page, name);

    const row = page.locator("table tbody tr", { hasText: name });
    await row.getByTitle("Download").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /export qr code/i })).toBeVisible();
    await expect(page.getByTestId("format-png")).toBeVisible();
    await expect(page.getByTestId("format-svg")).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
    await page.getByTestId("download-submit-btn").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename().toLowerCase()).toMatch(/-qr\.png$/);
    await expect(page.getByRole("button", { name: /downloaded/i })).toBeVisible({ timeout: 8000 });
  });

  test("select 1-click brand icon and verify EC-H shield", async ({ page }) => {
    const name = `Brand Icon ${Date.now()}`;
    await createQr(page, name);
    await openDesignTab(page, name);

    // Click on WhatsApp icon
    const whatsappBtn = page.getByRole("button", { name: /whatsapp/i });
    await expect(whatsappBtn).toBeVisible();
    await whatsappBtn.click();

    // Verify EC-H shield badge appears
    await expect(page.getByText(/ec-h shield active/i)).toBeVisible();

    // Save design
    const saveResponse = page.waitForResponse((res) =>
      res.url().includes("/design") && res.request().method() === "PUT"
    );
    await page.getByTestId("save-design-btn").click();
    const response = await saveResponse;
    expect(response.ok()).toBe(true);

    const json = await response.json();
    expect(json.data.design.logoFileId).toBe("icon:whatsapp");
    expect(json.data.design.errorCorrectionLevel).toBe("H");
  });

  test("apply 1-click designer preset", async ({ page }) => {
    const name = `Preset Apply ${Date.now()}`;
    await createQr(page, name);
    await openDesignTab(page, name);

    // Click on Emerald Business preset
    const presetBtn = page.getByRole("button", { name: /emerald business/i });
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Verify foreground color and frame changed according to preset
    await expect(page.getByLabel("Foreground color hex")).toHaveValue("#059669");

    // Save design
    const saveResponse = page.waitForResponse((res) =>
      res.url().includes("/design") && res.request().method() === "PUT"
    );
    await page.getByTestId("save-design-btn").click();
    const response = await saveResponse;
    expect(response.ok()).toBe(true);
  });
});
