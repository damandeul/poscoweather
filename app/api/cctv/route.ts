import { NextRequest, NextResponse } from "next/server";
import { SITES, SiteId, haversineKm } from "@/lib/sites";

export const dynamic = "force-dynamic";

interface ItsCctvItem {
  cctvname: string;
  cctvurl: string;
  cctvformat: string;
  cctvtype: string;
  coordx: string | number;
  coordy: string | number;
  roadsectionid?: string;
}

export interface CctvCamera {
  id: string;
  name: string;
  url: string;
  format: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

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

  const { bbox } = site;
  // 국가교통정보센터(ITS) 오픈API — 고속도로+국도 실시간 스트리밍(HLS) CCTV
  const results = await Promise.all(
    (["ex", "its"] as const).map(async (type) => {
      const url =
        "https://openapi.its.go.kr:9443/cctvInfo?" +
        new URLSearchParams({
          apiKey,
          type,
          cctvType: "1",
          minX: String(bbox.minX),
          maxX: String(bbox.maxX),
          minY: String(bbox.minY),
          maxY: String(bbox.maxY),
          getType: "json",
        });
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const json = await res.json();
        const data = json?.response?.data;
        if (!data) return [];
        return (Array.isArray(data) ? data : [data]) as ItsCctvItem[];
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const cameras: CctvCamera[] = results
    .flat()
    .filter((item) => item.cctvurl && !seen.has(item.cctvurl) && seen.add(item.cctvurl))
    .map((item, i) => {
      const lat = Number(item.coordy);
      const lon = Number(item.coordx);
      return {
        id: `${i}-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        name: item.cctvname,
        url: item.cctvurl,
        format: item.cctvformat ?? "HLS",
        lat,
        lon,
        distanceKm: haversineKm(site.lat, site.lon, lat, lon),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({ configured: true, cameras });
}
