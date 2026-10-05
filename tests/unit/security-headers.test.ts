import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

/**
 * Security Headers Unit Tests
 *
 * Verify that `next.config.ts` declares the correct security headers
 * for Content-Security-Policy, HSTS, X-Frame-Options, and related headers.
 */
describe("HTTP Security Headers Configuration", () => {
  // The headers config is returned as an async function from next.config.ts
  const headersConfig = nextConfig.headers?.();

  it("declares security headers for all routes", async () => {
    const headers = await headersConfig;
    expect(headers).toBeDefined();
    expect(headers!.length).toBeGreaterThan(0);

    const securityRoute = headers![0];
    expect(securityRoute.source).toBe("/:path*");
    expect(securityRoute.headers).toBeDefined();
  });

  it("includes Content-Security-Policy header", async () => {
    const headers = await headersConfig;
    const cspHeader = headers![0].headers.find((h) => h.key === "Content-Security-Policy");
    expect(cspHeader).toBeDefined();

    const csp = cspHeader!.value;

    // Core directives
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");   // Clickjacking protection
    expect(csp).toContain("object-src 'none'");          // Plugin execution blocked
    expect(csp).toContain("base-uri 'self'");            // Prevents base tag injection
    expect(csp).toContain("form-action 'self'");         // Form submission restricted

    // Permissive but controlled sources for Next.js
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob: https:");
    expect(csp).toContain("font-src 'self' data:");
    expect(csp).toContain("connect-src 'self' https:");
  });

  it("includes Strict-Transport-Security header", async () => {
    const headers = await headersConfig;
    const hstsHeader = headers![0].headers.find((h) => h.key === "Strict-Transport-Security");
    expect(hstsHeader).toBeDefined();

    const hsts = hstsHeader!.value;
    expect(hsts).toContain("max-age=63072000");   // 2 years
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toContain("preload");
  });

  it("includes X-Frame-Options set to DENY", async () => {
    const headers = await headersConfig;
    const xfoHeader = headers![0].headers.find((h) => h.key === "X-Frame-Options");
    expect(xfoHeader).toBeDefined();
    expect(xfoHeader!.value).toBe("DENY");
  });

  it("includes X-Content-Type-Options set to nosniff", async () => {
    const headers = await headersConfig;
    const xctoHeader = headers![0].headers.find((h) => h.key === "X-Content-Type-Options");
    expect(xctoHeader).toBeDefined();
    expect(xctoHeader!.value).toBe("nosniff");
  });

  it("includes Referrer-Policy with strict-origin-when-cross-origin", async () => {
    const headers = await headersConfig;
    const rpHeader = headers![0].headers.find((h) => h.key === "Referrer-Policy");
    expect(rpHeader).toBeDefined();
    expect(rpHeader!.value).toBe("strict-origin-when-cross-origin");
  });

  it("includes Permissions-Policy header", async () => {
    const headers = await headersConfig;
    const pfHeader = headers![0].headers.find((h) => h.key === "Permissions-Policy");
    expect(pfHeader).toBeDefined();
    expect(pfHeader!.value).toBeTruthy();
  });

  it("includes X-Permitted-Cross-Domain-Policies set to none", async () => {
    const headers = await headersConfig;
    const xcdpHeader = headers![0].headers.find((h) => h.key === "X-Permitted-Cross-Domain-Policies");
    expect(xcdpHeader).toBeDefined();
    expect(xcdpHeader!.value).toBe("none");
  });

  it("CSP blocks frame embedding via frame-ancestors", async () => {
    const headers = await headersConfig;
    const cspHeader = headers![0].headers.find((h) => h.key === "Content-Security-Policy");
    expect(cspHeader!.value).toContain("frame-ancestors 'none'");
  });
});
