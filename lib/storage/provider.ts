// lib/storage/provider.ts
// Abstract storage interface — business logic never calls fs directly (spec §14).

export interface StorageProvider {
  /**
   * Store a file and return its storageKey (physical filename).
   * @param userId   owning user (for directory layout)
   * @param buffer   raw file bytes
   * @param ext      derived file extension (e.g. "pdf") — from MIME sniffing, not user input
   */
  store(userId: string, buffer: Buffer, ext: string): Promise<string>;

  /** Read a stored file by its key. Returns null if not found. */
  retrieve(storageKey: string): Promise<Buffer | null>;

  /** Check if a storage key exists without reading its contents. */
  exists(storageKey: string): Promise<boolean>;

  /** Delete a stored file by its key. No-op if the file doesn't exist. */
  delete(storageKey: string): Promise<void>;

  /** Return the absolute filesystem path for serving via a ReadStream. */
  getPath(storageKey: string): string;
}
