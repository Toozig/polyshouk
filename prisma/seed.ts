import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { defaultBForEvent } from "../lib/market";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/polyshouk",
});
const prisma = new PrismaClient({ adapter });

const SEED_LIQUIDITY_M = 100;

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  const passwordHash = await bcrypt.hash("admin", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash, role: "ADMIN" },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      balance: 999999,
    },
  });

  console.log(`✅ Admin user: ${admin.username}`);

  const inviteCodes = [
    "WELCOME1",
    "WELCOME2",
    "WELCOME3",
    "WELCOME4",
    "WELCOME5",
  ];

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

  const labels1 = ["הליכוד", "מחנה המדינה", "המחנה הממלכתי"];
  const b1 = defaultBForEvent(SEED_LIQUIDITY_M, labels1.length);

  const event1 = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      title: "מי יזכה בבחירות 2026?",
      description:
        "בחירות לכנסת ה-26 נערכות בשנת 2026. איזו מפלגה תרכוס את מספר המושבים הגבוה ביותר?",
      category: "פוליטיקה",
      closesAt: new Date("2026-11-01T20:00:00Z"),
      status: "OPEN",
      createdById: admin.id,
      liquidityM: SEED_LIQUIDITY_M,
      bParameter: b1,
      poolBalance: SEED_LIQUIDITY_M,
      outcomes: {
        create: labels1.map((label) => ({
          label,
          lmsrQ: SEED_LIQUIDITY_M,
        })),
      },
    },
  });

  const labels2 = ["כן, נזכה!", "לא, לא נזכה"];
  const b2 = defaultBForEvent(SEED_LIQUIDITY_M, labels2.length);

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
      liquidityM: SEED_LIQUIDITY_M,
      bParameter: b2,
      poolBalance: SEED_LIQUIDITY_M,
      outcomes: {
        create: labels2.map((label) => ({
          label,
          lmsrQ: SEED_LIQUIDITY_M,
        })),
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
