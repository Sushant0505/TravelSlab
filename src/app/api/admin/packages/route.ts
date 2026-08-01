import { NextRequest, NextResponse } from "next/server";
import {
  adminListPackages,
  adminPackageAction,
  adminSetPackageOrder,
  packageStatusCounts,
  type PackageStatus,
  type AdminPackageAction,
} from "@/server/package-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: PackageStatus[] = ["PENDING", "APPROVED", "REJECTED", "HIDDEN", "PAUSED"];
const ACTIONS: AdminPackageAction[] = [
  "approve",
  "reject",
  "hide",
  "feature",
  "unfeature",
  "popular",
  "unpopular",
];

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get("status");
  const status = STATUSES.includes(statusParam as PackageStatus)
    ? (statusParam as PackageStatus)
    : undefined;
  const [packages, counts] = await Promise.all([
    adminListPackages(status),
    packageStatusCounts(),
  ]);
  return NextResponse.json({ packages, counts });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = body?.id ? String(body.id) : "";
  const action = body?.action as string;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (action === "order") {
    const order = Number(body.order);
    if (!Number.isFinite(order)) return NextResponse.json({ error: "order required" }, { status: 400 });
    const ok = await adminSetPackageOrder(id, order);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!ACTIONS.includes(action as AdminPackageAction)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const res = await adminPackageAction(id, action as AdminPackageAction);
  return res.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: res.error ?? "Failed" }, { status: 404 });
}
