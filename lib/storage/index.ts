// lib/storage/index.ts
// Singleton storage provider — swap LocalStorageProvider → S3 here
// without touching any business logic.

import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";

export const storage: StorageProvider = new LocalStorageProvider();
