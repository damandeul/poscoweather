import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* 레이더(RainViewer)·위성(기상청 천리안 GK2A 주야간 합성) 프레임 목록 — 모두 무료 공개 소스 */

export interface RadarFrame {
  time: number; // unix seconds
  path: string;
}

export interface SatelliteFrame {
  time: number; // unix ms (UTC)
  url: string;
}

const SAT_STEP_MS = 10 * 60 * 1000;
const SAT_FRAMES = 8;

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}

/** 천리안 GK2A 주야간 합성(한반도 2km) — 10분 간격, 약 4분 지연 게시 */
function gk2aUrl(t: Date): string {
  const y = t.getUTCFullYear();
  const m = pad(t.getUTCMonth() + 1);
  const d = pad(t.getUTCDate());
  const h = pad(t.getUTCHours());
  const min = pad(t.getUTCMinutes());
  return `https://nmsc.kma.go.kr/IMG/GK2A/AMI/PRIMARY/L1B/COMPLETE/KO/${y}${m}/${d}/${h}/gk2a_ami_le1b_rgb-daynight_ko020lc_${y}${m}${d}${h}${min}.srv.png`;
}

function floorTo10Min(ms: number): Date {
  return new Date(Math.floor(ms / SAT_STEP_MS) * SAT_STEP_MS);
}

/** 최신 프레임 시각 탐색 — 없는 시각은 200 + text/html 을 반환하므로 Content-Type으로 판별 */
async function findLatestGk2a(): Promise<Date | null> {
  let t = floorTo10Min(Date.now());
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(gk2aUrl(t), {
        method: "HEAD",
        next: { revalidate: 120 },
      });
      if (res.ok && res.headers.get("content-type")?.includes("image")) {
        return t;
      }
    } catch {
      /* 다음 후보 시각으로 */
    }
    t = new Date(t.getTime() - SAT_STEP_MS);
  }
  return null;
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
      const latest = await findLatestGk2a();
      if (!latest) return null;
      const frames: SatelliteFrame[] = [];
      for (let i = SAT_FRAMES - 1; i >= 0; i--) {
        const t = new Date(latest.getTime() - i * SAT_STEP_MS);
        frames.push({ time: t.getTime(), url: gk2aUrl(t) });
      }
      return { frames };
    })(),
  ]);

  return NextResponse.json(
    { radar, satellite },
    { headers: { "Cache-Control": "public, s-maxage=120, max-age=60" } }
  );
}
