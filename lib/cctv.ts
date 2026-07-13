import { Site, haversineKm } from "@/lib/sites";

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

// 국가교통정보센터(ITS) 오픈API — 고속도로+국도 실시간 스트리밍(HLS) CCTV.
// ITS 서버가 해외·클라우드 IP를 차단하므로 서버(Vercel)에서 실패할 수 있다.
// CORS가 허용되어 있어 브라우저에서 직접 호출하는 폴백이 가능하다.
export async function fetchCctvCameras(
  site: Site,
  apiKey: string
): Promise<CctvCamera[]> {
  const { bbox } = site;
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
        if (!res.ok) {
          console.error(`[cctv] ITS ${type} HTTP ${res.status}`);
          return [];
        }
        const json = await res.json();
        const data = json?.response?.data;
        if (!data) return [];
        return (Array.isArray(data) ? data : [data]) as ItsCctvItem[];
      } catch (e) {
        console.error(`[cctv] ITS ${type} fetch failed:`, e);
        return [];
      }
    })
  );

  const seen = new Set<string>();
  return results
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
}
