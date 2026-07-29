import { NextResponse } from "next/server";
import { listActiveBanners } from "@/server/banner-repo";

export const runtime = "nodejs";

/** Public — active banners for the home-page carousel. */
export async function GET() {
  return NextResponse.json({ ok: true, banners: await listActiveBanners() });
}
