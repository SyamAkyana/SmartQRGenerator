import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Production Health Check Endpoint
 * GET /api/health
 *
 * Verifies core service dependencies:
 * - Database connectivity
 * - Local/remote storage accessibility
 *
 * Returns:
 * - 200 OK if all systems are healthy
 * - 503 Service Unavailable if any critical system fails
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let storageStatus: "accessible" | "inaccessible" = "inaccessible";
  let isHealthy = true;

  // 1. Check Database connection
  try {
    // Light query to verify connection pool and responsiveness
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "disconnected";
    isHealthy = false;
    console.error("[Health Check] Database connection failure:", error);
  }

  // 2. Check Storage accessibility
  try {
    // Verify storage provider by querying non-existent sentinel key (should return null/false without error)
    await storage.exists("__health_check_sentinel__");
    storageStatus = "accessible";
  } catch (error) {
    storageStatus = "inaccessible";
    isHealthy = false;
    console.error("[Health Check] Storage provider failure:", error);
  }

  const payload = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp,
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: dbStatus,
      storage: storageStatus,
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
