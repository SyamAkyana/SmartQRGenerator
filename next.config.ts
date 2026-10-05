import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self' https:;",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;",
      "style-src 'self' 'unsafe-inline' https:;",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' data: https:;",
      "connect-src 'self' https:;",
      "frame-ancestors 'none';",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
    ].join(" "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
