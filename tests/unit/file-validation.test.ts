import { describe, it, expect } from "vitest";
import { sniffMimeType, sanitizeFilename } from "@/lib/file/service";

// ---------------------------------------------------------------------------
// sniffMimeType — magic-byte verification
// ---------------------------------------------------------------------------

describe("sniffMimeType", () => {
  const buf = (hex: string) => Buffer.from(hex, "hex");

  it("detects PDF", () => {
    expect(sniffMimeType(buf("25504446"), "application/octet-stream")).toBe("application/pdf");
  });

  it("detects PNG", () => {
    expect(sniffMimeType(buf("89504e470d0a1a0a"), "application/octet-stream")).toBe("image/png");
  });

  it("detects JPEG", () => {
    expect(sniffMimeType(buf("ffd8ff"), "application/octet-stream")).toBe("image/jpeg");
  });

  it("detects GIF", () => {
    expect(sniffMimeType(buf("474946383961"), "application/octet-stream")).toBe("image/gif");
  });

  it("detects WebP", () => {
    // RIFF....WEBP
    const webp = Buffer.concat([buf("52494646"), Buffer.alloc(4), buf("57454250")]);
    expect(sniffMimeType(webp, "application/octet-stream")).toBe("image/webp");
  });

  it("detects ZIP-based OOXML and falls back to supplied type", () => {
    // ZIP signature + supplied application/vnd... for docx
    const zip = buf("504b030400000000");
    const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    expect(sniffMimeType(zip, mime)).toBe(mime);
  });

  it("passes through text/plain for small buffers", () => {
    expect(sniffMimeType(buf("48656c6c6f"), "text/plain")).toBe("text/plain");
  });

  it("returns supplied type when magic bytes don't match any known signature", () => {
    const unknown = buf("0102030405060708");
    expect(sniffMimeType(unknown, "audio/mpeg")).toBe("audio/mpeg");
  });
});

// ---------------------------------------------------------------------------
// sanitizeFilename
// ---------------------------------------------------------------------------

describe("sanitizeFilename", () => {
  it("strips path components", () => {
    expect(sanitizeFilename("../../../etc/passwd.txt")).toBe("passwd.txt");
  });

  it("removes unsafe characters", () => {
    expect(sanitizeFilename("hello world (1) [copy].pdf")).toBe("hello_world_1_copy.pdf");
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeFilename("a___b.pdf")).toBe("a_b.pdf");
  });

  it("returns 'upload' when name becomes empty after sanitization", () => {
    expect(sanitizeFilename("../../../")).toBe("upload");
  });

  it("caps length at 128 chars total", () => {
    const long = "a".repeat(200) + ".pdf";
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(128);
  });

  it("preserves basic extension structure", () => {
    const result = sanitizeFilename("document_v2_final.pdf");
    expect(result).toBe("document_v2_final.pdf");
  });
});
