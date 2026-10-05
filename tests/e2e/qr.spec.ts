import { test, expect } from "@playwright/test";

/**
 * Phase 2 E2E Tests: QR Code Management
 * Requires the demo user to be seeded (demo@smartqr.example / DemoPassword123!)
 * and /dashboard/qr page to be implemented.
 */
test.describe("QR Code Management (Phase 2)", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as demo user before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("demo@smartqr.example");
    await page.getByLabel(/password/i).fill("DemoPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("QR Codes nav link navigates to /dashboard/qr", async ({ page }) => {
    await page.getByRole("link", { name: "QR Codes", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/qr/);
  });

  test("QR list page shows seeded QR codes in a table", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Wait for the table to load
    await expect(page.getByRole("heading", { name: /qr codes/i })).toBeVisible();

    // Should show the table header
    await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /type/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /short code/i })).toBeVisible();

    // Table rows should be present
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("Header has a 'Create QR Code' button that opens the dialog", async ({ page }) => {
    await page.goto("/dashboard/qr");
    await page.getByRole("button", { name: /create qr code/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /create qr code/i })).toBeVisible();
  });

  test("Create QR dialog accepts name and type and creates a new QR", async ({ page }) => {
    await page.goto("/dashboard/qr");

    const qrName = `E2E Test QR ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/name/i).fill(qrName);
    await page.getByRole("button", { name: /create qr code/i }).last().click();

    // Dialog should close and new QR should appear in the table
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.getByText(qrName)).toBeVisible();
  });

  test("Create QR with empty name shows validation error", async ({ page }) => {
    await page.goto("/dashboard/qr");
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByRole("button", { name: /create qr code/i }).last().click();

    // Browser validation should prevent submission (name is required)
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("Edit button opens edit dialog with QR name pre-filled", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Create a known QR to edit
    const targetName = `Edit Target QR ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(targetName);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(targetName)).toBeVisible();

    const targetRow = page.locator("table tbody tr", { hasText: targetName });
    await targetRow.getByTitle(/edit/i).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /edit qr code/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toHaveValue(targetName);
  });

  test("Editing a QR name and saving updates the table", async ({ page }) => {
    await page.goto("/dashboard/qr");

    const initialName = `Edit Save Target ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(initialName);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(initialName)).toBeVisible();

    const targetRow = page.locator("table tbody tr", { hasText: initialName });
    await targetRow.getByTitle(/edit/i).click();

    const updatedName = `Updated Name ${Date.now()}`;
    await page.getByLabel(/name/i).fill(updatedName);
    await page.getByRole("button", { name: /save changes/i }).click();

    // Dialog should close and name should update
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("table").getByText(updatedName)).toBeVisible();
  });

  test("Delete button shows confirmation dialog", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // First create a test QR to delete
    const deleteTarget = `QR To Delete ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(deleteTarget);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(deleteTarget)).toBeVisible();

    // Click delete on that row
    const row = page.locator("table tbody tr", { hasText: deleteTarget });
    await row.getByTitle(/delete/i).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /delete qr code/i })).toBeVisible();
    // Scoped to dialog to avoid matching table row too
    await expect(page.getByRole("dialog").getByText(deleteTarget)).toBeVisible();
    await expect(page.getByRole("button", { name: /delete qr code/i })).toBeVisible();
  });

  test("Confirming delete removes QR from the table", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Create a test QR to delete
    const deleteTarget = `QR To Delete Confirm ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(deleteTarget);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(deleteTarget)).toBeVisible();

    // Delete it
    const row = page.locator("table tbody tr", { hasText: deleteTarget });
    await row.getByTitle(/delete/i).click();
    await page.getByRole("button", { name: /delete qr code/i }).click();

    // Should be removed from table — scoped to table to avoid dialog match
    await expect(page.locator("table").getByText(deleteTarget)).not.toBeVisible();
  });

  test("Disable button changes QR status to disabled", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Create a dedicated QR to disable
    const toggleTarget = `Toggle Disable ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(toggleTarget);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(toggleTarget)).toBeVisible();

    const row = page.locator("table tbody tr", { hasText: toggleTarget });
    await row.getByTitle(/disable qr/i).click();

    // Status badge should now show "Disabled"
    await expect(row.getByText("Disabled")).toBeVisible();
  });

  test("Enable button re-activates a disabled QR", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Create a QR, disable it, then re-enable
    const toggleTarget = `Toggle Enable ${Date.now()}`;
    await page.getByRole("button", { name: /create qr code/i }).click();
    await page.getByLabel(/name/i).fill(toggleTarget);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.locator("table").getByText(toggleTarget)).toBeVisible();

    const row = page.locator("table tbody tr", { hasText: toggleTarget });
    await row.getByTitle(/disable qr/i).click();
    await expect(row.getByText("Disabled")).toBeVisible();

    await row.getByTitle(/enable qr/i).click();
    await expect(row.getByText("Active")).toBeVisible({ timeout: 10000 });
  });

  test("Duplicate button creates a copy of the QR", async ({ page }) => {
    await page.goto("/dashboard/qr");

    // Wait for the table to be fully loaded
    await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();

    // Remember how many QRs there are
    const countBefore = await page.locator("table tbody tr").count();

    // Click duplicate on first row
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.getByTitle(/duplicate/i).click();

    // Wait for the optimistic state update to re-render the table
    await page.waitForFunction(
      (before) => document.querySelectorAll("table tbody tr").length === before + 1,
      countBefore,
      { timeout: 5000 }
    );

    // The duplicated row should contain "(Copy)"
    await expect(page.locator("table tbody tr").filter({ hasText: "(Copy)" }).first()).toBeVisible();
  });

  test("Unauthenticated user cannot access /dashboard/qr (redirects to login)", async ({ page }) => {
    // Sign out first
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard/qr");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Dashboard home shows live QR count", async ({ page }) => {
    await page.goto("/dashboard");

    // Should show the Total QR Codes card with a numerical count
    const qrCard = page.locator(".border-neutral-200", { hasText: "Total QR Codes" });
    await expect(qrCard).toBeVisible();
    await expect(qrCard.locator(".text-2xl")).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // Phase 5: File Storage — "Authenticated user uploads a safe file.
  //             QR points to the file. File can be accessed.
  //             Unauthorized users cannot manage another user's file."
  // -----------------------------------------------------------------------
  test("Files page is accessible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Files", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/files/);
    await expect(page.getByRole("heading", { name: /files/i }).first()).toBeVisible();
  });

  test("Upload a PDF and see it appear in the files list", async ({ page }) => {
    await page.goto("/dashboard/files");
    await page.waitForLoadState("networkidle");

    // Clear any pre-existing files from prior test runs
    const listRes = await page.request.get("/api/file");
    if (listRes.ok()) {
      const data = await listRes.json();
      for (const f of (data?.data?.files ?? [])) {
        await page.request.delete(`/api/file/${f.id}`);
      }
    }

    // Upload via page.request API context (carries auth cookies, bypasses React UI timing)
    await page.request.fetch("/api/file", {
      method: "POST",
      multipart: {
        file: {
          name: "smartqr-test.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n%test"),
        },
        name: "smartqr-test.pdf",
      },
    });

    // Reload so server-side props re-fetch the file list
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("smartqr-test.pdf").first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "application/pdf" }).first()).toBeVisible();
  });

  test("Create a FILE QR and download the linked file when logged in", async ({ page }) => {
    // 1. Upload a file via browser-side fetch (avoids UI race conditions)
    await page.goto("/dashboard/files");
    await page.waitForLoadState("networkidle");

    // Clear pre-existing files
    const listRes = await page.request.get("/api/file");
    if (listRes.ok()) {
      const data = await listRes.json();
      for (const f of (data?.data?.files ?? [])) {
        await page.request.delete(`/api/file/${f.id}`);
      }
    }

    // Upload via page.request API context (carries auth cookies, bypasses React UI timing)
    const uploadRes = await page.request.fetch("/api/file", {
      method: "POST",
      multipart: {
        file: {
          name: "download-test.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n%download-test"),
        },
        name: "download-test.pdf",
      },
    });
    const uploadData = await uploadRes.json();
    const fileId = uploadData?.data?.file?.id;

    expect(fileId).toBeTruthy();

    // 2. Reload the files page to verify the file is listed
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("download-test.pdf").first()).toBeVisible({ timeout: 10000 });

    // 3. Create a FILE QR with the fileId
    const qrName = `Phase5 File QR ${Date.now()}`;
    const createRes = await page.request.post("/api/qr", {
      data: { name: qrName, type: "FILE", data: { fileId } },
    });
    expect(createRes.ok()).toBeTruthy();
    const createData = await createRes.json();
    const qrId = createData.data.qr.id;
    const shortCode = createData.data.qr.shortCode;

    // 4. Scan the FILE QR — it redirects to /api/file/:id and triggers download
    const scanPage = await page.context().newPage();
    const downloadPromise = scanPage.waitForEvent("download", { timeout: 10000 });
    // Fire-and-forget: download intercepts the navigation so goto() can't await it
    scanPage.goto(`/q/${shortCode}`).catch(() => {});
    const download = await downloadPromise;

    // Verify the downloaded filename
    expect(download.suggestedFilename()).toBe("download-test.pdf");
    await scanPage.close();
  });

  test("Unauthenticated user is blocked from /api/file endpoint", async ({ request }) => {
    // Use an unauthenticated request context
    const unauthRes = await request.get("/api/file");
    expect(unauthRes.status()).toBe(401);
  });
});

test.describe("Destination Change (Phase 4)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("demo@smartqr.example");
    await page.getByLabel(/password/i).fill("DemoPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("Changing destination via API keeps the same shortCode", async ({ page }) => {
    // 1. Create a URL QR via UI
    const qrName = `Phase4 Dest Change ${Date.now()}`;
    await page.goto("/dashboard/qr");
    await page.getByRole("button", { name: /create qr code/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel(/name/i).fill(qrName);
    await page.getByRole("button", { name: /create qr code/i }).last().click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("table").getByText(qrName)).toBeVisible();

    // 2. Read the shortCode from the table row
    const row = page.locator("table tbody tr", { hasText: qrName });
    const shortCodeEl = row.locator(".font-mono.text-xs");
    await expect(shortCodeEl).toBeVisible();
    const shortCode = (await shortCodeEl.textContent())?.trim();
    expect(shortCode).toBeTruthy();

    // 3. Set the initial destination via API — page.request shares the logged-in
    //    browser context's cookies, so the session is carried over.
    //    (The create dialog doesn't collect a URL yet, so data comes from the API.)
    const listRes = await page.request.get("/api/qr");
    const listData = await listRes.json();
    const qrRecord = listData.data.qrCodes.find((q: { name: string }) => q.name === qrName);
    expect(qrRecord).toBeTruthy();

    const putRes = await page.request.put(`/api/qr/${qrRecord.id}`, {
      data: { name: qrName, data: { url: "https://example.com" } },
    });
    expect(putRes.ok()).toBeTruthy();

    // 4. Navigate to /q/:shortCode → should redirect to the first destination
    const page1 = await page.context().newPage();
    await page1.goto(`/q/${shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(page1).toHaveURL(/example\.com/, { timeout: 8000 });
    await page1.close();

    // 5. Change the destination via API — same shortCode, new data
    const putRes2 = await page.request.put(`/api/qr/${qrRecord.id}`, {
      data: { name: qrName, data: { url: "https://httpbin.org/get" } },
    });
    expect(putRes2.ok()).toBeTruthy();

    // 6. Navigate to the SAME shortCode → should now redirect to the NEW destination
    const page2 = await page.context().newPage();
    await page2.goto(`/q/${shortCode}`, { waitUntil: "domcontentloaded" });
    await expect(page2).toHaveURL(/httpbin\.org/, { timeout: 8000 });
    await page2.close();

    // 7. Verify the shortCode in the dashboard table is UNCHANGED
    await page.reload();
    const updatedRow = page.locator("table tbody tr", { hasText: qrName });
    const updatedShortCodeEl = updatedRow.locator(".font-mono.text-xs");
    await expect(updatedShortCodeEl).toHaveText(shortCode!);
  });
});