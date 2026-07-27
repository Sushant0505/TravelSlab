import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSubscriptions, setSubscriptions } from "@/server/notify-repo";
import { getSession } from "@/lib/auth";
import { SLABS } from "@/lib/slabs";

export const runtime = "nodejs";

async function requireAgencyId(): Promise<string | null> {
  const session = await getSession();
  return session?.role === "AGENCY" ? session.id : null;
}

// Which budget slabs this agency wants lead alerts for.
export async function GET() {
  const id = await requireAgencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    slabs: SLABS.map((s) => ({ id: s.id, label: s.label, price: s.leadPrice })),
    subscribed: await getSubscriptions(id),
  });
}

const slabEnum = z.enum([
  "s0_5k",
  "s5_10k",
  "s10_20k",
  "s20_50k",
  "s50_100k",
  "s100k_plus",
]);
const schema = z.object({ slabs: z.array(slabEnum) });

export async function POST(req: NextRequest) {
  const id = await requireAgencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const subscribed = await setSubscriptions(id, parsed.data.slabs);
  return NextResponse.json({ ok: true, subscribed });
}
