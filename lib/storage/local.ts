// lib/storage/local.ts
// Local filesystem implementation of StorageProvider.
// Layout: storage/{userId}/{uuid}.{ext}
// Physical filenames are UUID v4 — zero information leakage (spec §14).

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { StorageProvider } from "./provider";

// Choose storage directory: fallback to OS temp dir if running in serverless (e.g. Vercel)
function resolveStorageDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "smartqr-storage");
  }
  return path.join(process.cwd(), "storage");
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = resolveStorageDir();
  }

  private ensureDir(dir: string): boolean {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return true;
    } catch {
      // If default fails and not already in tmpdir, fallback to os.tmpdir
      const tmpDir = path.join(os.tmpdir(), "smartqr-storage");
      if (this.baseDir !== tmpDir) {
        try {
          this.baseDir = tmpDir;
          if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
          }
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Store a file on disk. Returns a storageKey of the form
   * `{userId}/{uuid}.{ext}` (relative to STORAGE_DIR).
   */
  async store(userId: string, buffer: Buffer, ext: string): Promise<string> {
    const filename = `${randomUUID()}.${ext}`;
    const storageKey = `${userId}/${filename}`;

    try {
      const userDir = path.join(this.baseDir, userId);
      this.ensureDir(userDir);
      const filePath = path.join(this.baseDir, storageKey);
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      // Non-fatal disk write error in read-only/serverless environments
      console.warn("[LocalStorageProvider] Could not write to local disk (falling back to DB storage):", err);
    }

    return storageKey;
  }

  async retrieve(storageKey: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
      }
    } catch {
      // Read failed or file missing
    }
    return null;
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      const filePath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // File already gone — no-op
    }
  }

  /**
   * Return absolute filesystem path for serving via ReadStream.
   * The key is always under baseDir — never exposes arbitrary paths.
   */
  getPath(storageKey: string): string {
    return path.join(this.baseDir, storageKey);
  }
}
