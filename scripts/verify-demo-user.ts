import { prisma } from "../lib/db/prisma";
import { verifyPassword } from "../lib/security/password";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@smartqr.example" },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  if (!user) {
    console.log("❌ USER NOT FOUND");
    process.exit(1);
  }
  console.log("User found:", user.email, "|", user.name, "| ID:", user.id);
  console.log("Hash prefix:", user.passwordHash?.substring(0, 10) + "...");
  const ok = await verifyPassword("DemoPassword123!", user.passwordHash!);
  console.log("Password 'DemoPassword123!' matches:", ok);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
