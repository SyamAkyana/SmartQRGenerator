// lib/storage/local.ts
// Local filesystem implementation of StorageProvider.
// Layout: storage/{userId}/{uuid}.{ext}
// Physical filenames are UUID v4 — zero information leakage (spec §14).

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageProvider } from "./provider";

const STORAGE_DIR = path.join(process.cwd(), "storage");

export class LocalStorageProvider implements StorageProvider {
  /**
   * Store a file on disk. Returns a storageKey of the form
   * `{userId}/{uuid}.{ext}` (relative to STORAGE_DIR).
   */
  async store(userId: string, buffer: Buffer, ext: string): Promise<string> {
    const userDir = path.join(STORAGE_DIR, userId);
    fs.mkdirSync(userDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const storageKey = `${userId}/${filename}`;
    const filePath = path.join(STORAGE_DIR, storageKey);

    fs.writeFileSync(filePath, buffer);
    return storageKey;
  }

  async retrieve(storageKey: string): Promise<Buffer | null> {
    const filePath = path.join(STORAGE_DIR, storageKey);
    try {
      return fs.readFileSync(filePath);
    } catch {
      return null;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    return fs.existsSync(path.join(STORAGE_DIR, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(STORAGE_DIR, storageKey);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File already gone — no-op
    }
  }

  /**
   * Return absolute filesystem path for serving via ReadStream.
   * The key is always under STORAGE_DIR — never exposes arbitrary paths.
   */
  getPath(storageKey: string): string {
    return path.join(STORAGE_DIR, storageKey);
  }
}
