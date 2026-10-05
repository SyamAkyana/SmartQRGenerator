import { PrismaClient, type Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

// QRType enum values (mirror prisma/schema.prisma)
type SeedQrType =
  | "URL"
  | "MAP"
  | "PHONE"
  | "EMAIL"
  | "CONTACT"
  | "WHATSAPP"
  | "WIFI"
  | "TEXT"
  | "FILE"
  | "MULTI_LINK";

interface SeedQrEntry {
  name: string;
  type: SeedQrType;
  data: Prisma.InputJsonValue;
}

const DEMO_QR_CODES: SeedQrEntry[] = [
  { name: "My Website",     type: "URL",       data: { url: "https://example.com" } },
  { name: "Product Review",  type: "URL",       data: { url: "https://example.com/review" } },
  { name: "WhatsApp Support", type: "WHATSAPP", data: { phone: "+1234567890", message: "Hi! I need support." } },
  { name: "Coffee Shop Menu", type: "MULTI_LINK", data: { title: "Coffee Menu", links: [{ label: "Latte", url: "#" }, { label: "Cappuccino", url: "#" }] } },
  { name: "Office Wi-Fi",    type: "WIFI",      data: { ssid: "Office-5G", password: "SecurePass123!", encryption: "WPA" } },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Demo User (Spec §40)
  const demoEmail = "demo@smartqr.example";
  const demoPassword = "DemoPassword123!";
  const passwordHash = await hash(demoPassword, 12);

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      name: "Demo User",
      passwordHash,
    },
    create: {
      email: demoEmail,
      name: "Demo User",
      passwordHash,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=smartqr-demo",
    },
  });

  console.log(`✅ Demo user seeded: ${demoUser.email} (ID: ${demoUser.id})`);
  console.log("   Credentials for local testing: demo@smartqr.example / DemoPassword123!");

  // Demo QR codes for the demo user
  // Uses (userId + name) as the natural key so re-seeding doesn't duplicate
  let seededCount = 0;
  for (const qr of DEMO_QR_CODES) {
    const existing = await prisma.qRCode.findFirst({
      where: { userId: demoUser.id, name: qr.name },
    });
    if (existing) continue;

    const created = await prisma.qRCode.create({
      data: {
        userId: demoUser.id,
        shortCode: nanoid(7),
        name: qr.name,
        type: qr.type,
        data: qr.data,
        status: "ACTIVE",
        isDynamic: true,
      },
    });
    seededCount += 1;

    // Auto-create MultiLinkPage with demo links for MULTI_LINK type
    if (qr.type === "MULTI_LINK") {
      const page = await prisma.multiLinkPage.create({
        data: {
          qrCodeId: created.id,
          title: "Welcome to Our Menu",
          description: "Browse our selection of coffee, tea, and pastries.",
          theme: "default",
        },
      });
      await prisma.multiLinkItem.createMany({
        data: [
          { pageId: page.id, label: "Coffee Menu", url: "https://example.com/coffee", sortOrder: 0, enabled: true },
          { pageId: page.id, label: "Tea Selection", url: "https://example.com/tea", sortOrder: 1, enabled: true },
          { pageId: page.id, label: "Pastries", url: "https://example.com/pastries", sortOrder: 2, enabled: true },
          { pageId: page.id, label: "Reserve a Table", url: "https://example.com/reserve", sortOrder: 3, enabled: true },
        ],
      });
    }
  }
  console.log(`✅ ${seededCount || 0} demo QR codes seeded (${DEMO_QR_CODES.length} configured)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });