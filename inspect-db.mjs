import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

for (const line of readFileSync("c:/tripslab/.env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (m) {
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const db = new PrismaClient();
try {
  const [agencies, travelers, leads, purchases, payments, notifs, otps, admins, banners, tiers] =
    await Promise.all([
      db.agency.count(), db.traveler.count(), db.lead.count(), db.purchase.count(),
      db.payment.count(), db.notification.count(), db.otpCode.count(), db.admin.count(),
      db.banner.count(), db.slabTier.count(),
    ]);
  console.log("COUNTS:", { agencies, travelers, leads, purchases, payments, notifs, otps, admins, banners, tiers });

  const seedAgencies = await db.agency.count({ where: { email: { endsWith: "@travel.in" } } });
  const seedTravelers = await db.traveler.count({ where: { email: { endsWith: "@example.com" } } });
  console.log("SEED-LIKE: agencies@travel.in =", seedAgencies, "| travelers@example.com =", seedTravelers);

  const agencyList = await db.agency.findMany({ select: { name: true, email: true, status: true }, orderBy: { createdAt: "asc" } });
  console.log("AGENCIES:");
  for (const a of agencyList) console.log(`  - ${a.name} | ${a.email} | ${a.status}`);

  const adminList = await db.admin.findMany({ select: { email: true } });
  console.log("ADMINS:", adminList.map((a) => a.email));
} catch (e) {
  console.error("ERROR:", e.message);
} finally {
  await db.$disconnect();
}
