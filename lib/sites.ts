export type SiteId = "gwangyang" | "pohang";

export interface Site {
  id: SiteId;
  name: string;
  region: string;
  lat: number;
  lon: number;
  /** CCTV 검색 범위 (경위도 bounding box) */
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
}

export const SITES: Record<SiteId, Site> = {
  gwangyang: {
    id: "gwangyang",
    name: "광양제철소",
    region: "전남 광양시 금호동",
    lat: 34.94,
    lon: 127.752,
    bbox: { minX: 127.6, maxX: 127.9, minY: 34.84, maxY: 35.04 },
  },
  pohang: {
    id: "pohang",
    name: "포항제철소",
    region: "경북 포항시 남구 괴동동",
    lat: 36.008,
    lon: 129.378,
    bbox: { minX: 129.26, maxX: 129.5, minY: 35.92, maxY: 36.1 },
  },
};

export const SITE_LIST: Site[] = [SITES.gwangyang, SITES.pohang];

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
