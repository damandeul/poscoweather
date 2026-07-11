import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* 레이더(RainViewer)·위성(NICT 히마와리) 프레임 목록 — 모두 무료 공개 소스 */

export interface RadarFrame {
  time: number; // unix seconds
  path: string;
}

export interface SatelliteFrame {
  time: number; // unix ms (UTC)
  url: string;
}

const SAT_BASE = "https://himawari8-dl.nict.go.jp/himawari8/img/D531106";
const SAT_STEP_MS = 10 * 60 * 1000;
const SAT_FRAMES = 8;

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

/** 한반도가 담긴 히마와리 풀디스크 4분할(4d) 타일 (1,0) */
function satUrl(t: Date): string {
  const y = t.getUTCFullYear();
  const m = pad(t.getUTCMonth() + 1);
  const d = pad(t.getUTCDate());
  const hms = `${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
  return `${SAT_BASE}/4d/550/${y}/${m}/${d}/${hms}_1_0.png`;
}

export async function GET() {
  const [radar, satellite] = await Promise.all([
    (async (): Promise<{ host: string; frames: RadarFrame[] } | null> => {
      try {
        const res = await fetch(
          "https://api.rainviewer.com/public/weather-maps.json",
          { next: { revalidate: 120 } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        const past = (json?.radar?.past ?? []) as RadarFrame[];
        if (past.length === 0) return null;
        return {
          host: json.host ?? "https://tilecache.rainviewer.com",
          frames: past.slice(-8).map((f) => ({ time: f.time, path: f.path })),
        };
      } catch {
        return null;
      }
    })(),
    (async (): Promise<{ frames: SatelliteFrame[] } | null> => {
      try {
        const res = await fetch(
          "https://himawari8.nict.go.jp/img/D531106/latest.json",
          { next: { revalidate: 120 } }
        );
        if (!res.ok) return null;
        const json = await res.json();
        // "2026-07-11 10:20:00" (UTC)
        const latest = new Date(`${String(json.date).replace(" ", "T")}Z`);
        if (Number.isNaN(latest.getTime())) return null;
        const frames: SatelliteFrame[] = [];
        for (let i = SAT_FRAMES - 1; i >= 0; i--) {
          const t = new Date(latest.getTime() - i * SAT_STEP_MS);
          frames.push({ time: t.getTime(), url: satUrl(t) });
        }
        return { frames };
      } catch {
        return null;
      }
    })(),
  ]);

  return NextResponse.json(
    { radar, satellite },
    { headers: { "Cache-Control": "public, s-maxage=120, max-age=60" } }
  );
}
