import { describe, it, expect } from "vitest";
import { createQrSchema, updateQrSchema, qrTypesSchema, qrStatusesSchema } from "@/lib/qr/types";

describe("QR Type Schema", () => {
  it.each([
    "URL", "MAP", "PHONE", "EMAIL", "CONTACT",
    "WHATSAPP", "WIFI", "TEXT", "FILE", "MULTI_LINK",
  ])("accepts valid type '%s'", (type) => {
    expect(qrTypesSchema.parse(type)).toBe(type);
  });

  it("rejects invalid QR type", () => {
    const result = qrTypesSchema.safeParse("INVALID_TYPE");
    expect(result.success).toBe(false);
  });
});

describe("QR Status Schema", () => {
  it.each(["ACTIVE", "DISABLED", "EXPIRED", "DELETED"])("accepts valid status '%s'", (status) => {
    expect(qrStatusesSchema.parse(status)).toBe(status);
  });

  it("rejects invalid status", () => {
    const result = qrStatusesSchema.safeParse("UNKNOWN");
    expect(result.success).toBe(false);
  });
});

describe("Create QR Schema", () => {
  it("accepts minimal valid input (name only)", () => {
    const result = createQrSchema.safeParse({ name: "My QR" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My QR");
      expect(result.data.type).toBe("URL"); // default
    }
  });

  it("accepts fully-specified input", () => {
    const result = createQrSchema.safeParse({
      name: "My QR",
      type: "WHATSAPP",
      data: { phone: "+1234567890" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My QR");
      expect(result.data.type).toBe("WHATSAPP");
      expect(result.data.data).toEqual({ phone: "+1234567890" });
    }
  });

  it("rejects empty name", () => {
    const result = createQrSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = createQrSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = createQrSchema.safeParse({ name: "A".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createQrSchema.safeParse({ name: "Test", type: "BOGUS" });
    expect(result.success).toBe(false);
  });

  it("trims leading/trailing whitespace from name", () => {
    const result = createQrSchema.safeParse({ name: "  My QR  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My QR");
    }
  });
});

describe("Update QR Schema", () => {
  it("accepts empty object (no updates)", () => {
    const result = updateQrSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial update with name only", () => {
    const result = updateQrSchema.safeParse({ name: "Updated Name" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Updated Name");
    }
  });

  it("accepts partial update with type only", () => {
    const result = updateQrSchema.safeParse({ type: "WIFI" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("WIFI");
    }
  });

  it("accepts full update with all fields", () => {
    const result = updateQrSchema.safeParse({
      name: "Updated QR",
      type: "MAP",
      data: { latitude: 37.7749, longitude: -122.4194 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type in partial update", () => {
    const result = updateQrSchema.safeParse({ type: "FAKE" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string as name", () => {
    const result = updateQrSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});