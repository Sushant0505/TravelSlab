import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  listAdminNotifications,
  unreadAdmin,
  markRead,
  markAllReadAdmin,
} from "@/server/notify-repo";

export const runtime = "nodejs";

export async function GET() {
  const [unread, notifications] = await Promise.all([
    unreadAdmin(),
    listAdminNotifications(),
  ]);
  return NextResponse.json({ ok: true, unread, notifications });
}

const schema = z.object({
  action: z.enum(["read", "readAll"]),
  id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  if (parsed.data.action === "readAll") await markAllReadAdmin();
  else if (parsed.data.id) await markRead(parsed.data.id);

  return NextResponse.json({ ok: true, unread: await unreadAdmin() });
}
