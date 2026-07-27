import { PrismaClient } from "@prisma/client";
import { SLABS, assignSlab } from "../src/lib/slabs";
import { DEMO_AGENCY_EMAIL, ADMIN_EMAIL, ADMIN_NAME } from "../src/lib/session";

const prisma = new PrismaClient();

// Deterministic RNG so re-seeding produces stable demo data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, a: T[]): T {
  return a[Math.floor(rng() * a.length)];
}

const AGENCY_NAMES = [
  "Wanderly Travels", "BlueSky Holidays", "Peak & Coast", "Nomad Trails",
  "Sunrise Getaways", "Voyage Craft", "Himalaya Routes", "Coral Coast Tours",
  "Metro Journeys", "Elephant Route", "Zenith Vacations", "Compass Cabs & Tours",
];
const OWNERS = ["Rahul Mehta", "Sneha Kapoor", "Imran Ali", "Divya Nair", "Karan Shah", "Pooja Rao"];
const AGENCY_STATUSES = ["APPROVED", "APPROVED", "APPROVED", "PENDING", "SUSPENDED", "BLOCKED"] as const;

const FIRST = ["Ananya", "Rohan", "Priya", "Arjun", "Neha", "Vikram", "Sara", "Kabir", "Isha", "Dev", "Meera", "Aditya"];
const LAST = ["Sharma", "Iyer", "Nair", "Gupta", "Reddy", "Khan", "Bose", "Menon", "Rao", "Verma"];
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];
const DESTS = ["Goa", "Bali", "Dubai", "Thailand", "Kashmir", "Leh Ladakh", "Andaman", "Kerala", "Vietnam", "Meghalaya", "Arunachal Pradesh"];
const TYPES = ["Backpacking", "Family", "Honeymoon", "Group / Friends", "Solo", "Luxury"];

async function main() {
  // --- Admin-editable slab pricing ------------------------------------------
  for (const slab of SLABS) {
    await prisma.slabPricing.upsert({
      where: { slab: slab.id as never },
      update: { leadPrice: slab.leadPrice },
      create: { slab: slab.id as never, leadPrice: slab.leadPrice },
    });
  }

  // --- Default admin --------------------------------------------------------
  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, passwordHash: "REPLACE_WITH_HASH" },
  });

  // --- Wipe existing demo data (FK-safe order) ------------------------------
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.agency.deleteMany();

  // --- Agencies -------------------------------------------------------------
  const rngA = mulberry32(7);
  const agencyIds: string[] = [];
  const approvedAgencyIds: string[] = [];
  let demoAgencyId = "";
  for (let i = 0; i < AGENCY_NAMES.length; i++) {
    const name = AGENCY_NAMES[i];
    const email = `${name.toLowerCase().replace(/[^a-z]/g, "")}@travel.in`;
    // Keep the demo agency APPROVED so the demo login works.
    const status =
      email === DEMO_AGENCY_EMAIL ? "APPROVED" : pick(rngA, [...AGENCY_STATUSES]);
    const a = await prisma.agency.create({
      data: {
        name,
        ownerName: pick(rngA, OWNERS),
        email,
        phone: `98${(10000000 + Math.floor(rngA() * 89999999)).toString().slice(0, 8)}`,
        gstNumber: `2${(2 + i).toString()}ABCDE${1000 + i}F1Z5`,
        passwordHash: "", // demo uses a shared password; replace with a real hash
        status: status as never,
      },
    });
    agencyIds.push(a.id);
    if (email === DEMO_AGENCY_EMAIL) demoAgencyId = a.id;
    if (status === "APPROVED") approvedAgencyIds.push(a.id);
  }

  // --- Travelers ------------------------------------------------------------
  const rngT = mulberry32(11);
  const travelerIds: string[] = [];
  for (let i = 0; i < 26; i++) {
    const first = pick(rngT, FIRST);
    const last = pick(rngT, LAST);
    const flagged = rngT() > 0.85;
    const t = await prisma.traveler.create({
      data: {
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
        mobile: `9${(700000000 + Math.floor(rngT() * 99999999)).toString().slice(0, 9)}`,
        status: (flagged && rngT() > 0.5 ? "BLOCKED" : "ACTIVE") as never,
        blockedUntil: flagged ? new Date(Date.now() + 3 * 86_400_000) : null,
      },
    });
    travelerIds.push(t.id);
  }

  // --- Leads (non-exclusive: a lead may be unlocked by several agencies) -----
  const rng = mulberry32(42);
  let unlocks = 0;
  let purchasedLeads = 0;
  let invoiceSeq = 0;
  for (let i = 0; i < 48; i++) {
    const travelers = 1 + Math.floor(rng() * 6);
    const perHead = 3000 + Math.floor(rng() * 90000);
    const budget = perHead * travelers;
    const slab = assignSlab(perHead);
    const daysOut = 10 + Math.floor(rng() * 150);
    const createdHrsAgo = Math.floor(rng() * 120);
    const otpVerified = rng() > 0.25;

    // Only admin moderation hides a lead; otherwise it stays available to all.
    const roll = rng();
    let status: string;
    if (roll > 0.95) status = "FRAUD";
    else if (roll > 0.9) status = "HIDDEN";
    else status = otpVerified ? "AVAILABLE" : "NEW";

    const lead = await prisma.lead.create({
      data: {
        reference: `TS-${(i * 7 + 100).toString(36).toUpperCase().padStart(4, "0")}`,
        status: status as never,
        destination: pick(rng, DESTS),
        departureCity: pick(rng, CITIES),
        travelers,
        budget,
        perHead,
        travelDate: new Date(Date.now() + daysOut * 86_400_000),
        tripType: pick(rng, TYPES),
        preferences: "Demo lead generated by seed.",
        slab: slab.id as never,
        price: slab.leadPrice,
        leadScore: Math.min(100, 40 + (otpVerified ? 25 : 0) + Math.floor(rng() * 30)),
        otpVerified,
        createdAt: new Date(Date.now() - createdHrsAgo * 3_600_000),
        travelerId: pick(rng, travelerIds),
      },
    });

    // ~half of available leads are already unlocked by 1–3 distinct agencies.
    if (status === "AVAILABLE" && approvedAgencyIds.length && rng() > 0.5) {
      const n = 1 + Math.floor(rng() * Math.min(3, approvedAgencyIds.length));
      const buyers = [...approvedAgencyIds].sort(() => rng() - 0.5).slice(0, n);
      for (const agencyId of buyers) {
        await prisma.purchase.create({
          data: {
            leadId: lead.id,
            agencyId,
            amount: slab.leadPrice,
            invoiceNo: `INV-SEED-${(1000 + invoiceSeq++).toString(36).toUpperCase()}`,
          },
        });
        unlocks += 1;
      }
      purchasedLeads += 1;
    }
  }

  // --- Notification feed ----------------------------------------------------
  const ago = (h: number) => new Date(Date.now() - h * 3_600_000);
  await prisma.notification.createMany({
    data: [
      {
        audience: "ADMIN" as never,
        kind: "AGENCY_REGISTRATION" as never,
        title: "Agency registration",
        body: "BlueSky Holidays applied and is awaiting approval.",
        createdAt: ago(1),
      },
      {
        audience: "ADMIN" as never,
        kind: "SUSPICIOUS" as never,
        title: "Suspicious activity",
        body: "3 leads from the same device fingerprint in 20 minutes.",
        createdAt: ago(3),
      },
      {
        audience: "ADMIN" as never,
        kind: "LEAD_AVAILABLE" as never,
        title: "New lead created",
        body: "Kashmir · ₹5,000 – ₹10,000 (TS-KX21)",
        slab: "s5_10k" as never,
        leadRef: "TS-KX21",
        createdAt: ago(2),
      },
      {
        audience: "ADMIN" as never,
        kind: "LEAD_AVAILABLE" as never,
        title: "New lead created",
        body: "Leh Ladakh · ₹20,000 – ₹50,000 (TS-LD88)",
        slab: "s20_50k" as never,
        leadRef: "TS-LD88",
        createdAt: ago(6),
      },
      // Targeted at the demo agency so its feed isn't empty.
      {
        audience: "AGENCY" as never,
        refId: demoAgencyId,
        kind: "LEAD_AVAILABLE" as never,
        title: "New Kashmir lead in your slab",
        body: "A ₹5,000 – ₹10,000 lead just landed — be first to unlock it.",
        slab: "s5_10k" as never,
        leadRef: "TS-KX21",
        createdAt: ago(2),
      },
      {
        audience: "AGENCY" as never,
        refId: demoAgencyId,
        kind: "LEAD_AVAILABLE" as never,
        title: "New Leh Ladakh lead in your slab",
        body: "A ₹20,000 – ₹50,000 lead just landed — be first to unlock it.",
        slab: "s20_50k" as never,
        leadRef: "TS-LD88",
        createdAt: ago(6),
      },
    ],
  });

  console.log(
    `Seed complete: ${SLABS.length} slab prices, 1 admin, ${AGENCY_NAMES.length} agencies, 26 travelers, 48 leads, ${unlocks} unlocks across ${purchasedLeads} leads, notification feed.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
