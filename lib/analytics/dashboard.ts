/**
 * Dashboard-level analytics: aggregates scan counts across all QR codes
 * belonging to the authenticated user.
 */

import { prisma } from "@/lib/db/prisma";

export interface DashboardStats {
  totalQrCodes: number;
  activeQrCodes: number;
  totalScans: number;
  todayScans: number;
  last7dScans: number;
  storedFiles: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [qrCount, activeCount, fileCount, scanCounts] = await Promise.all([
    prisma.qRCode.count({ where: { userId, deletedAt: null } }),
    prisma.qRCode.count({ where: { userId, deletedAt: null, status: "ACTIVE" } }),
    prisma.storedFile.count({ where: { userId } }),
    // Total + today + last 7d scans across all user's QR codes
    prisma.qRCode.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  if (scanCounts.length === 0) {
    return {
      totalQrCodes: qrCount,
      activeQrCodes: activeCount,
      totalScans: 0,
      todayScans: 0,
      last7dScans: 0,
      storedFiles: fileCount,
    };
  }

  const qrIds = scanCounts.map((qr) => qr.id);

  const [totalScans, todayScans, last7dScans] = await Promise.all([
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds } } }),
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds }, scannedAt: { gte: today } } }),
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds }, scannedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return {
    totalQrCodes: qrCount,
    activeQrCodes: activeCount,
    totalScans,
    todayScans,
    last7dScans,
    storedFiles: fileCount,
  };
}