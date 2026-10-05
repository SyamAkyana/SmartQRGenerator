import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
  resetRateLimitStore,
  RATE_LIMIT_TIERS,
} from "@/lib/security/rate-limit";

describe("Rate Limiting Engine", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("checkRateLimit", () => {
    it("allows requests within the limit", async () => {
      const result = await checkRateLimit("test:user:123", 5, 60000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("blocks requests exceeding the limit", async () => {
      const identifier = "test:user:456";

      // Consume all tokens
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(identifier, 5, 60000);
      }

      // 6th request should be blocked
      const result = await checkRateLimit(identifier, 5, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after the window expires", async () => {
      const identifier = "test:user:789";
      const windowMs = 100; // 100ms window for fast test

      // Consume all tokens
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(identifier, 3, windowMs);
      }

      // Should be blocked immediately
      let result = await checkRateLimit(identifier, 3, windowMs);
      expect(result.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

      // Should allow again
      result = await checkRateLimit(identifier, 3, windowMs);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("tracks different identifiers independently", async () => {
      await checkRateLimit("user:alice", 2, 60000);
      await checkRateLimit("user:alice", 2, 60000);

      // Alice exhausted her limit
      const aliceResult = await checkRateLimit("user:alice", 2, 60000);
      expect(aliceResult.success).toBe(false);

      // Bob still has tokens
      const bobResult = await checkRateLimit("user:bob", 2, 60000);
      expect(bobResult.success).toBe(true);
    });

    it("implements sliding window correctly", async () => {
      const identifier = "test:sliding";
      const windowMs = 1000;

      // Make 3 requests at t=0
      await checkRateLimit(identifier, 5, windowMs);
      await checkRateLimit(identifier, 5, windowMs);
      await checkRateLimit(identifier, 5, windowMs);

      // Wait 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Make 2 more requests at t=600ms (should succeed, total 5 in window)
      let result = await checkRateLimit(identifier, 5, windowMs);
      expect(result.success).toBe(true);
      result = await checkRateLimit(identifier, 5, windowMs);
      expect(result.success).toBe(true);

      // 6th request should fail (5 requests in last 1000ms)
      result = await checkRateLimit(identifier, 5, windowMs);
      expect(result.success).toBe(false);

      // Wait another 500ms (t=1100ms, first 3 requests should have expired)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should succeed again (only 2 requests in last 1000ms)
      result = await checkRateLimit(identifier, 5, windowMs);
      expect(result.success).toBe(true);
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "203.0.113.5, 198.51.100.178");
      const ip = getClientIp(headers);
      expect(ip).toBe("203.0.113.5");
    });

    it("extracts IP from x-real-ip header", () => {
      const headers = new Headers();
      headers.set("x-real-ip", "198.51.100.42");
      const ip = getClientIp(headers);
      expect(ip).toBe("198.51.100.42");
    });

    it("prefers x-forwarded-for over x-real-ip", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "203.0.113.10");
      headers.set("x-real-ip", "198.51.100.20");
      const ip = getClientIp(headers);
      expect(ip).toBe("203.0.113.10");
    });

    it("returns localhost when no headers present", () => {
      const headers = new Headers();
      const ip = getClientIp(headers);
      expect(ip).toBe("127.0.0.1");
    });

    it("handles plain object headers", () => {
      const headers = { "x-forwarded-for": "192.0.2.1" };
      const ip = getClientIp(headers);
      expect(ip).toBe("192.0.2.1");
    });

    it("handles array values in plain object", () => {
      const headers = { "x-forwarded-for": ["192.0.2.1", "198.51.100.1"] };
      const ip = getClientIp(headers);
      expect(ip).toBe("192.0.2.1");
    });
  });

  describe("rateLimitResponse", () => {
    it("returns HTTP 429 with correct headers", () => {
      const resetAt = Date.now() + 60000; // 60 seconds from now
      const response = rateLimitResponse(resetAt, 10, 0);

      expect(response.status).toBe(429);

      const retryAfter = response.headers.get("Retry-After");
      expect(retryAfter).toBeTruthy();
      expect(parseInt(retryAfter!)).toBeGreaterThan(0);
      expect(parseInt(retryAfter!)).toBeLessThanOrEqual(60);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
    });

    it("includes custom error message", async () => {
      const resetAt = Date.now() + 30000;
      const response = rateLimitResponse(resetAt, 5, 0, "Custom rate limit message");

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(body.error.message).toBe("Custom rate limit message");
    });
  });

  describe("RATE_LIMIT_TIERS", () => {
    it("defines AUTH tier correctly", () => {
      expect(RATE_LIMIT_TIERS.AUTH.limit).toBe(10);
      expect(RATE_LIMIT_TIERS.AUTH.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it("defines QR_MUTATION tier correctly", () => {
      expect(RATE_LIMIT_TIERS.QR_MUTATION.limit).toBe(60);
      expect(RATE_LIMIT_TIERS.QR_MUTATION.windowMs).toBe(60 * 1000); // 1 minute
    });

    it("defines FILE_UPLOAD tier correctly", () => {
      expect(RATE_LIMIT_TIERS.FILE_UPLOAD.limit).toBe(20);
      expect(RATE_LIMIT_TIERS.FILE_UPLOAD.windowMs).toBe(60 * 1000); // 1 minute
    });

    it("defines PUBLIC_SCAN tier correctly", () => {
      expect(RATE_LIMIT_TIERS.PUBLIC_SCAN.limit).toBe(120);
      expect(RATE_LIMIT_TIERS.PUBLIC_SCAN.windowMs).toBe(60 * 1000); // 1 minute
    });
  });
});
