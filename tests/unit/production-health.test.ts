import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { prisma } from "@/lib/db/prisma";
import { storage } from "@/lib/storage";

describe("Production Health Check API", () => {
  it("returns 200 and healthy status when database and storage are operational", async () => {
    // Mock healthy dependencies
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([{ "?column?": 1 }]);
    vi.spyOn(storage, "exists").mockResolvedValueOnce(false);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("healthy");
    expect(json.checks.database).toBe("connected");
    expect(json.checks.storage).toBe("accessible");
    expect(json.timestamp).toBeTruthy();
    expect(json.version).toBeTruthy();
  });

  it("returns 503 and unhealthy status when database check fails", async () => {
    // Mock database failure
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("Connection refused"));
    vi.spyOn(storage, "exists").mockResolvedValueOnce(false);

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe("unhealthy");
    expect(json.checks.database).toBe("disconnected");
    expect(json.checks.storage).toBe("accessible");
  });

  it("returns 503 and unhealthy status when storage check fails", async () => {
    // Mock storage failure
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([{ "?column?": 1 }]);
    vi.spyOn(storage, "exists").mockRejectedValueOnce(new Error("Disk error"));

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe("unhealthy");
    expect(json.checks.database).toBe("connected");
    expect(json.checks.storage).toBe("inaccessible");
  });
});
