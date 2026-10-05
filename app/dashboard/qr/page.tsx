import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listQrCodes, countQrCodes } from "@/lib/qr/service";
import { prisma } from "@/lib/db/prisma";
import { QrList } from "./components/qr-list";
import type { QRCodeRecord } from "@/lib/qr/service";

export default async function QRPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const [qrs, total] = await Promise.all([
    listQrCodes(userId),
    countQrCodes(userId),
  ]);

  // Attach scan counts to each QR
  let qrsWithScans: QRCodeRecord[] = qrs;
  if (qrs.length > 0) {
    const scanCounts = await prisma.scanEvent.groupBy({
      by: ["qrCodeId"],
      where: { qrCodeId: { in: qrs.map((qr) => qr.id) } },
      _count: { qrCodeId: true },
    });
    const scanMap = new Map(scanCounts.map((s) => [s.qrCodeId, Number(s._count.qrCodeId)]));
    qrsWithScans = qrs.map((qr) => ({
      ...qr,
      scanCount: scanMap.get(qr.id) ?? 0,
    }));
  }

  return (
    <QrList
      initialQrs={qrsWithScans}
      totalCount={total}
    />
  );
}