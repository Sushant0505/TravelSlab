import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminListUsers, adminUserAction, type UserAction } from "@/server/admin-repo";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, users: await adminListUsers() });
}

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(["block", "unblock"]),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const res = await adminUserAction(parsed.data.id, parsed.data.action as UserAction);
  if (!res.ok) return NextResponse.json(res, { status: 404 });
  return NextResponse.json({ ok: true });
}
