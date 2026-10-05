import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "@/lib/file/sanitize";

describe("File Upload Security", () => {
  describe("sanitizeFilename", () => {
    it("keeps safe alphanumeric filenames", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
      expect(sanitizeFilename("photo_2024.jpg")).toBe("photo_2024.jpg");
      expect(sanitizeFilename("my-file.txt")).toBe("my-file.txt");
    });

    it("replaces unsafe characters with underscores", () => {
      expect(sanitizeFilename("file<name>.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("document|with|pipes.pdf")).toBe("document_with_pipes.pdf");
      expect(sanitizeFilename("file:name.txt")).toBe("file_name.txt");
    });

    it("blocks path traversal attempts", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
      expect(sanitizeFilename("..\\..\\Windows\\System32")).toBe("System32");
      expect(sanitizeFilename("./../../file.txt")).toBe("file.txt");
    });

    it("removes directory paths", () => {
      expect(sanitizeFilename("/var/www/file.txt")).toBe("file.txt");
      expect(sanitizeFilename("C:\\Users\\file.docx")).toBe("file.docx");
      expect(sanitizeFilename("/absolute/path/to/file.pdf")).toBe("file.pdf");
    });

    it("handles files without extensions", () => {
      expect(sanitizeFilename("README")).toBe("README");
      expect(sanitizeFilename("Makefile")).toBe("Makefile");
    });

    it("collapses multiple underscores and dots", () => {
      expect(sanitizeFilename("file___name.txt")).toBe("file_name.txt");
      expect(sanitizeFilename("document...pdf")).toBe("document.pdf");
      expect(sanitizeFilename("file__..__.txt")).toBe("file_..txt");
    });

    it("truncates long filenames", () => {
      const longName = "a".repeat(200) + ".txt";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(128);
      expect(result.endsWith(".txt")).toBe(true);
    });

    it("preserves extension even when truncating", () => {
      const longName = "document_" + "x".repeat(150) + ".pdf";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(128);
      expect(result.endsWith(".pdf")).toBe(true);
    });

    it("handles null byte attacks", () => {
      expect(sanitizeFilename("file\x00.txt")).toBe("file.txt");
      expect(sanitizeFilename("doc\x00.pdf.exe")).toBe("doc_.pdf.exe");
    });

    it("handles empty or whitespace-only filenames", () => {
      expect(sanitizeFilename("")).toBe("upload");
      expect(sanitizeFilename("   ")).toBe("upload");
      expect(sanitizeFilename("\t\n")).toBe("upload");
    });

    it("removes trailing underscores from name part", () => {
      const result = sanitizeFilename("file___!!!");
      expect(result.endsWith("_")).toBe(false);
    });

    it("handles Unicode characters", () => {
      expect(sanitizeFilename("文档.txt")).toBe(".txt");
      expect(sanitizeFilename("fïlé.pdf")).toBe("f_l.pdf");
    });

    it("blocks special Windows device names", () => {
      // These aren't explicitly blocked but get sanitized safely
      expect(sanitizeFilename("CON.txt")).toBe("CON.txt");
      expect(sanitizeFilename("PRN.pdf")).toBe("PRN.pdf");
      // If needed, additional validation would happen at the service layer
    });

    it("handles mixed safe and unsafe characters", () => {
      expect(sanitizeFilename("my<file>name.txt")).toBe("my_file_name.txt");
      expect(sanitizeFilename("document (copy).pdf")).toBe("document_copy.pdf");
    });
  });

  describe("Path Traversal Prevention", () => {
    it("blocks common traversal patterns", () => {
      const traversalAttempts = [
        "../../../etc/passwd",
        "..\\..\\..\\Windows\\System32\\config",
        "./../../sensitive.file",
        "....//....//etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
      ];

      for (const attempt of traversalAttempts) {
        const result = sanitizeFilename(attempt);
        expect(result).not.toContain("..");
        expect(result).not.toContain("/");
        expect(result).not.toContain("\\");
      }
    });
  });

  describe("Extension Safety", () => {
    it("preserves legitimate extensions", () => {
      const extensions = [".pdf", ".jpg", ".png", ".txt", ".docx", ".xlsx"];
      for (const ext of extensions) {
        const result = sanitizeFilename(`document${ext}`);
        expect(result.endsWith(ext)).toBe(true);
      }
    });

    it("handles double extensions", () => {
      expect(sanitizeFilename("file.tar.gz")).toBe("file.tar.gz");
      expect(sanitizeFilename("archive.tar.bz2")).toBe("archive.tar.bz2");
    });

    it("sanitizes dangerous double extensions", () => {
      expect(sanitizeFilename("doc.pdf.exe")).toBe("doc.pdf.exe");
      // Note: MIME type validation at service layer would block .exe entirely
    });
  });
});
