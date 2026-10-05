import { NextResponse } from "next/server";
import { getPublicQr } from "@/lib/qr/public";
import { buildVCard } from "@/lib/qr/resolve";
import type { ContactData } from "@/lib/qr/resolve";

/** GET /q/:shortCode/contact.vcf — vCard download for CONTACT QRs (spec §10.5). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  const lookup = await getPublicQr(shortCode);

  if (lookup.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (lookup.qr.type !== "CONTACT") {
    return NextResponse.json({ error: "Not a contact QR" }, { status: 404 });
  }

  const vcf = buildVCard(lookup.qr.data as ContactData);
  const fileName = [lookup.qr.data.firstName, lookup.qr.data.lastName]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64) || "contact";

  return new NextResponse(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}.vcf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}