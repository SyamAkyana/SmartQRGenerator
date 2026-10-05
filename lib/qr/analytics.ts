import { prisma } from "@/lib/db/prisma";
import { subDays } from "date-fns";

export async function getScanStats(qrCodeId: string, days = 30) {
  const since = subDays(new Date(), days);

  const [total, last7d, last30d] = await Promise.all([
    prisma.scanEvent.count({ where: { qrCodeId } }),
    prisma.scanEvent.count({ where: { qrCodeId, scannedAt: { gte: subDays(new Date(), 7) } } }),
    prisma.scanEvent.count({ where: { qrCodeId, scannedAt: { gte: since } } }),
  ]);

  let timeSeries: { date: Date; count: number }[] = [];
  try {
    const rawData = await prisma.$queryRaw<Array<{ date: Date | string; count: bigint | number }>>`
      SELECT DATE("scannedAt") as date, COUNT(*) as count
      FROM "ScanEvent"
      WHERE "qrCodeId" = ${qrCodeId} AND "scannedAt" >= ${since}
      GROUP BY DATE("scannedAt")
      ORDER BY date ASC
    `;
    if (Array.isArray(rawData)) {
      timeSeries = rawData.map((row) => ({
        date: new Date(row.date),
        count: Number(row.count),
      }));
    }
  } catch {
    // In-memory fallback if $queryRaw is not available/fails
    const events =
      (await prisma.scanEvent.findMany({
        where: { qrCodeId, scannedAt: { gte: since } },
        select: { scannedAt: true },
        orderBy: { scannedAt: "asc" },
      })) ?? [];

    const map = new Map<string, number>();
    for (const ev of events) {
      const dayKey = ev.scannedAt.toISOString().slice(0, 10);
      map.set(dayKey, (map.get(dayKey) ?? 0) + 1);
    }

    timeSeries = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, count]) => ({ date: new Date(d), count }));
  }

  return {
    total,
    last7d,
    last30d,
    timeSeries,
  };
}

export async function getScanBreakdown(qrCodeId: string, dimension: "deviceType" | "browser" | "os") {
  const counts = await prisma.scanEvent.groupBy({
    by: [dimension],
    where: { qrCodeId },
    _count: { [dimension]: true },
    orderBy: { _count: { [dimension]: "desc" } },
  });

  const total = counts.reduce((sum, c) => sum + Number(c._count[dimension]), 0);
  return counts.map((c) => ({
    value: c[dimension] ?? "Unknown",
    count: Number(c._count[dimension]),
    percentage: total > 0 ? Math.round((Number(c._count[dimension]) / total) * 100) : 0,
  }));
}

export async function getRecentScans(qrCodeId: string, limit = 20) {
  const scans = await prisma.scanEvent.findMany({
    where: { qrCodeId },
    orderBy: { scannedAt: "desc" },
    take: limit,
    select: {
      id: true,
      scannedAt: true,
      ipAddress: true,
      deviceType: true,
      browser: true,
      os: true,
      referer: true,
    },
  });

  return (scans ?? []).map((s) => ({
    ...s,
    deviceType: s.deviceType ?? "Unknown",
    browser: s.browser ?? "Unknown",
    os: s.os ?? "Unknown",
  }));
}

/** Aggregate statistics across all QR codes owned by a user */
export async function getUserScanStats(userId: string, days = 30) {
  const since = subDays(new Date(), days);

  const userQrs = await prisma.qRCode.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (userQrs.length === 0) {
    return {
      total: 0,
      last7d: 0,
      last30d: 0,
      timeSeries: [],
    };
  }

  const qrIds = userQrs.map((q) => q.id);

  const [total, last7d, last30d] = await Promise.all([
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds } } }),
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds }, scannedAt: { gte: subDays(new Date(), 7) } } }),
    prisma.scanEvent.count({ where: { qrCodeId: { in: qrIds }, scannedAt: { gte: since } } }),
  ]);

  const events = await prisma.scanEvent.findMany({
    where: { qrCodeId: { in: qrIds }, scannedAt: { gte: since } },
    select: { scannedAt: true },
    orderBy: { scannedAt: "asc" },
  });

  const map = new Map<string, number>();
  for (const ev of events) {
    const dayKey = ev.scannedAt.toISOString().slice(0, 10);
    map.set(dayKey, (map.get(dayKey) ?? 0) + 1);
  }

  const timeSeries = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([d, count]) => ({ date: new Date(d), count }));

  return {
    total,
    last7d,
    last30d,
    timeSeries,
  };
}

export async function getUserScanBreakdown(userId: string, dimension: "deviceType" | "browser" | "os") {
  const userQrs = await prisma.qRCode.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (userQrs.length === 0) return [];

  const qrIds = userQrs.map((q) => q.id);

  const counts = await prisma.scanEvent.groupBy({
    by: [dimension],
    where: { qrCodeId: { in: qrIds } },
    _count: { [dimension]: true },
    orderBy: { _count: { [dimension]: "desc" } },
  });

  const total = counts.reduce((sum, c) => sum + Number(c._count[dimension]), 0);
  return counts.map((c) => ({
    value: c[dimension] ?? "Unknown",
    count: Number(c._count[dimension]),
    percentage: total > 0 ? Math.round((Number(c._count[dimension]) / total) * 100) : 0,
  }));
}

export async function getUserRecentScans(userId: string, limit = 15) {
  const userQrs = await prisma.qRCode.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (userQrs.length === 0) return [];

  const qrMap = new Map(userQrs.map((q) => [q.id, q.name]));
  const qrIds = userQrs.map((q) => q.id);

  const scans = await prisma.scanEvent.findMany({
    where: { qrCodeId: { in: qrIds } },
    orderBy: { scannedAt: "desc" },
    take: limit,
    select: {
      id: true,
      qrCodeId: true,
      scannedAt: true,
      ipAddress: true,
      deviceType: true,
      browser: true,
      os: true,
      referer: true,
    },
  });

  return (scans ?? []).map((s) => ({
    ...s,
    deviceType: s.deviceType ?? "Unknown",
    browser: s.browser ?? "Unknown",
    os: s.os ?? "Unknown",
    qrName: qrMap.get(s.qrCodeId) ?? "Unknown QR",
  }));
}

export async function getUserTopQrs(userId: string, limit = 5) {
  const userQrs = await prisma.qRCode.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, type: true, shortCode: true },
  });

  if (userQrs.length === 0) return [];

  const qrIds = userQrs.map((q) => q.id);
  const scanCounts = await prisma.scanEvent.groupBy({
    by: ["qrCodeId"],
    where: { qrCodeId: { in: qrIds } },
    _count: { qrCodeId: true },
    orderBy: { _count: { qrCodeId: "desc" } },
    take: limit,
  });

  const countMap = new Map(scanCounts.map((s) => [s.qrCodeId, Number(s._count.qrCodeId)]));
  const qrMap = new Map(userQrs.map((q) => [q.id, q]));

  // Sort by scans descending
  return userQrs
    .map((q) => ({
      ...q,
      scans: countMap.get(q.id) ?? 0,
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, limit);
}
