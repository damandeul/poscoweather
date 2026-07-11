"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE_LIST, SITES, SiteId } from "@/lib/sites";
import { SiteWeather, fetchSiteWeather, wmoText } from "@/lib/weather";
import WeatherSection from "./WeatherSection";
import CctvPanel from "./CctvPanel";
import { RefreshIcon, WeatherIcon } from "./icons";

const REFRESH_MS = 120_000; // 2분마다 자동 갱신

type WeatherMap = Partial<Record<SiteId, SiteWeather>>;

function kstClock(d: Date): string {
  return d.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Dashboard() {
  const [active, setActive] = useState<SiteId>("gwangyang");
  const [weather, setWeather] = useState<WeatherMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        SITE_LIST.map((s) => fetchSiteWeather(s))
      );
      setWeather({
        gwangyang: results[0],
        pohang: results[1],
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    queueMicrotask(() => setNow(new Date()));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeWeather = weather[active];

  return (
    <div className="min-h-[100dvh]">
      {/* 스티키 글래스 헤더 */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-350 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M4 19h16M6 19V9l6-4 6 4v10M10 19v-5h4v5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-[15px] font-bold leading-tight tracking-tight">
                POSCO 기상 모니터링
              </h1>
              <p className="text-[11px] leading-tight text-muted">
                광양 · 포항 제철소 실시간 관제
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-right">
              <p
                className="tnum text-base font-semibold leading-tight tracking-tight"
                suppressHydrationWarning
              >
                {now ? kstClock(now) : "--:--:--"}
                <span className="ml-1 text-[10px] font-normal text-muted">
                  KST
                </span>
              </p>
              <p
                className="tnum text-[10px] leading-tight text-muted"
                suppressHydrationWarning
              >
                {lastUpdated
                  ? `갱신 ${kstClock(lastUpdated)} · 2분 간격`
                  : "갱신 대기 중"}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              aria-label="새로고침"
              className="pressable grid h-9 w-9 place-items-center rounded-xl border border-hairline bg-white/5 text-ink-2 hover:border-accent/40 hover:text-foreground disabled:opacity-40"
            >
              <RefreshIcon
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6">
        {/* 제철소 선택 카드 */}
        <div
          className="reveal mb-5 grid grid-cols-2 gap-2.5"
          style={{ "--i": 0 } as React.CSSProperties}
        >
          {SITE_LIST.map((site) => {
            const w = weather[site.id];
            const isActive = active === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setActive(site.id)}
                aria-pressed={isActive}
                className={`pressable flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left sm:px-5 ${
                  isActive
                    ? "border-accent/50 bg-accent/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_28px_-10px_rgba(57,135,229,0.35)]"
                    : "border-hairline bg-white/3 hover:bg-white/6"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {site.name}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {w ? wmoText(w.current.code) : site.region}
                  </p>
                </div>
                {w && (
                  <p className="tnum flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
                    <WeatherIcon
                      code={w.current.code}
                      isDay={w.current.isDay}
                      className={`h-6 w-6 ${isActive ? "text-accent" : "text-muted"}`}
                    />
                    {w.current.temp.toFixed(1)}°
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mb-5 rounded-2xl border border-st-serious/40 bg-st-serious/5 px-4 py-3 text-sm text-st-serious">
            기상 데이터를 불러오지 못했습니다: {error} — 잠시 후 자동으로
            재시도합니다.
          </p>
        )}

        {activeWeather ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <WeatherSection site={SITES[active]} weather={activeWeather} />
            <div
              className="reveal xl:sticky xl:top-20 xl:self-start"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              <CctvPanel key={active} siteId={active} />
            </div>
          </div>
        ) : (
          !error && (
            <div className="glass animate-pulse p-12 text-center text-sm text-muted">
              기상 데이터 불러오는 중…
            </div>
          )
        )}
      </main>

      <footer className="mx-auto w-full max-w-350 px-4 pb-8 pt-2 sm:px-6">
        <p className="text-[11px] leading-relaxed text-muted">
          기상 데이터: Open-Meteo (KMA 모델 포함) · 레이더: RainViewer · 위성:
          NICT Himawari · CCTV: 국가교통정보센터(ITS) 오픈API · 본 대시보드의
          경고·지수 표시는 자체 판정 기준으로, 기상청 공식 특보를 대체하지
          않습니다.
        </p>
      </footer>
    </div>
  );
}
