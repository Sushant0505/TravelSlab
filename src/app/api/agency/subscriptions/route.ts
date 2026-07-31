import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSubscriptions, setSubscriptions } from "@/server/notify-repo";
import { getSession } from "@/lib/auth";
import { listSlabTiers } from "@/server/tier-repo";

export const runtime = "nodejs";

async function requireAgencyId(): Promise<string | null> {
  const session = await getSession();
  return session?.role === "AGENCY" ? session.id : null;
}

// Which budget slab tiers this agency wants lead alerts for (admin-managed).
export async function GET() {
  const id = await requireAgencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tiers = await listSlabTiers();
  return NextResponse.json({
    ok: true,
    slabs: tiers.map((t) => ({ id: t.id, label: t.label, price: t.leadPrice })),
    subscribed: await getSubscriptions(id),
  });
}

// Accept any current tier id — ranges are admin-defined, not a fixed enum.
const schema = z.object({ slabs: z.array(z.string().min(1)).max(50) });

export async function POST(req: NextRequest) {
  const id = await requireAgencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  // Only persist ids that are real tiers today.
  const valid = new Set((await listSlabTiers()).map((t) => t.id));
  const tierIds = parsed.data.slabs.filter((s) => valid.has(s));
  const subscribed = await setSubscriptions(id, tierIds);
  return NextResponse.json({ ok: true, subscribed });
}
