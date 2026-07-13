import { NextRequest, NextResponse } from "next/server";
import { SITES, SiteId } from "@/lib/sites";
import { fetchCctvCameras } from "@/lib/cctv";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("site") as SiteId | null;
  const site = siteId ? SITES[siteId] : undefined;
  if (!site) {
    return NextResponse.json({ error: "invalid site" }, { status: 400 });
  }

  const apiKey = process.env.ITS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, cameras: [] });
  }

  const cameras = await fetchCctvCameras(site, apiKey);
  return NextResponse.json({ configured: true, cameras });
}
