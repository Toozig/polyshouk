import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/polyshouk",
});
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@polyshouk.com" },
    update: {},
    create: {
      name: "מנהל",
      email: "admin@polyshouk.com",
      passwordHash,
      role: "ADMIN",
      balance: 999999,
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);

  const inviteCodes = ["WELCOME1", "WELCOME2", "WELCOME3", "WELCOME4", "WELCOME5"];

  for (const code of inviteCodes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        createdById: admin.id,
      },
    });
  }

  console.log(`✅ Created ${inviteCodes.length} invite codes`);

  const event1 = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      title: "מי יזכה בבחירות 2026?",
      description:
        "בחירות לכנסת ה-26 נערכות בשנת 2026. איזו מפלגה תרכוש את מספר המושבים הגבוה ביותר?",
      category: "פוליטיקה",
      closesAt: new Date("2026-11-01T20:00:00Z"),
      status: "OPEN",
      createdById: admin.id,
      outcomes: {
        create: [
          { label: "הליכוד" },
          { label: "מחנה המדינה" },
          { label: "המחנה הממלכתי" },
        ],
      },
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: "seed-event-2" },
    update: {},
    create: {
      id: "seed-event-2",
      title: "האם ישראל תזכה באירוויזיון 2027?",
      description:
        "ישראל מתמודדת בתחרות האירוויזיון 2027 שתיערך באירופה. האם נזכה?",
      category: "בידור",
      closesAt: new Date("2027-05-15T22:00:00Z"),
      status: "OPEN",
      createdById: admin.id,
      outcomes: {
        create: [{ label: "כן, נזכה!" }, { label: "לא, לא נזכה" }],
      },
    },
  });

  console.log(`✅ Created events: "${event1.title}", "${event2.title}"`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
