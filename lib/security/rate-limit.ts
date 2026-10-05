// lib/security/rate-limit.ts
// In-memory sliding-window rate limiter and HTTP response utilities.

import { NextResponse } from "next/server";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in milliseconds
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/** Pre-configured rate limit tiers */
export const RATE_LIMIT_TIERS = {
  /** Authentication endpoints (login, register, reset): 10 requests per 15 minutes */
  AUTH: { limit: 10, windowMs: 15 * 60 * 1000 },
  /** QR create/update/delete mutations: 60 requests per 1 minute */
  QR_MUTATION: { limit: 60, windowMs: 60 * 1000 },
  /** File uploads: 20 requests per 1 minute */
  FILE_UPLOAD: { limit: 20, windowMs: 60 * 1000 },
  /** Public QR scans & redirects: 120 requests per 1 minute */
  PUBLIC_SCAN: { limit: 120, windowMs: 60 * 1000 },
} as const;

interface WindowRecord {
  timestamps: number[];
}

const store = new Map<string, WindowRecord>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Remove stale entries from memory periodically to prevent unbounded memory growth.
 */
function cleanupStore(now: number, maxWindowMs: number = 15 * 60 * 1000) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    const validTimestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      record.timestamps = validTimestamps;
    }
  }
}

/**
 * Check and consume a rate limit token using a sliding window algorithm.
 *
 * @param identifier Unique key representing the subject (e.g. `auth:ip:1.2.3.4` or `qr:user:123`)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Duration of the sliding window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  cleanupStore(now, windowMs);

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter timestamps within the current sliding window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  const resetAt = record.timestamps.length > 0 ? record.timestamps[0] + windowMs : now + windowMs;

  const effectiveLimit =
    process.env.NODE_ENV === "development" && identifier.startsWith("auth:")
      ? Math.max(limit, 500)
      : limit;

  if (record.timestamps.length >= effectiveLimit) {
    return {
      success: false,
      limit: effectiveLimit,
      remaining: 0,
      resetAt,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, effectiveLimit - record.timestamps.length);

  return {
    success: true,
    limit: effectiveLimit,
    remaining,
    resetAt,
  };
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined>
): string {
  let forwardedFor: string | string[] | undefined;
  let realIp: string | string[] | undefined;

  if (headers instanceof Headers) {
    forwardedFor = headers.get("x-forwarded-for") ?? undefined;
    realIp = headers.get("x-real-ip") ?? undefined;
  } else {
    forwardedFor = headers["x-forwarded-for"];
    realIp = headers["x-real-ip"];
  }

  if (forwardedFor) {
    const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstIp = raw.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  if (realIp) {
    const raw = Array.isArray(realIp) ? realIp[0] : realIp;
    const trimmed = raw.trim();
    if (trimmed) return trimmed;
  }

  return "127.0.0.1";
}

/**
 * Construct an HTTP 429 Too Many Requests response with standard rate limit headers.
 */
export function rateLimitResponse(
  resetAt: number,
  limit: number,
  remaining: number = 0,
  message: string = "Too many requests. Please try again later."
): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

/**
 * Clear all rate limiting state (for testing purposes).
 */
export function resetRateLimitStore(): void {
  store.clear();
  lastCleanup = Date.now();
}
