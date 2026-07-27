import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  listAgencyNotifications,
  unreadAgency,
  markRead,
  markAllReadAgency,
} from "@/server/notify-repo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

async function requireAgencyId(): Promise<string | null> {
  const session = await getSession();
  return session?.role === "AGENCY" ? session.id : null;
}

export async function GET() {
  const id = await requireAgencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [unread, notifications] = await Promise.all([
    unreadAgency(id),
    listAgencyNotifications(id),
  ]);
  return NextResponse.json({ ok: true, unread, notifications });
}

const schema = z.object({
  action: z.enum(["read", "readAll"]),
  id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const agencyId = await requireAgencyId();
  if (!agencyId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  if (parsed.data.action === "readAll") await markAllReadAgency(agencyId);
  else if (parsed.data.id) await markRead(parsed.data.id);

  return NextResponse.json({ ok: true, unread: await unreadAgency(agencyId) });
}
