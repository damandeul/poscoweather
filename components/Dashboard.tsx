"use client";

import { useCallback, useEffect, useState } from "react";
import { SITE_LIST, SITES, SiteId } from "@/lib/sites";
import { SiteWeather, fetchSiteWeather, wmoIcon } from "@/lib/weather";
import WeatherSection from "./WeatherSection";
import CctvPanel from "./CctvPanel";

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
    <div className="mx-auto w-full max-w-350 px-4 py-5 sm:px-6">
      {/* 헤더 */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            POSCO 제철소 기상 모니터링
          </h1>
          <p className="text-xs text-muted">
            Open-Meteo 기상 데이터 · 국가교통정보센터 CCTV · 2분 간격 자동 갱신
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="tnum text-lg font-semibold" suppressHydrationWarning>
              {now ? kstClock(now) : "--:--:--"}
              <span className="ml-1 text-xs font-normal text-muted">KST</span>
            </p>
            <p className="tnum text-[11px] text-muted" suppressHydrationWarning>
              {lastUpdated
                ? `마지막 갱신 ${kstClock(lastUpdated)}`
                : "갱신 대기 중"}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-hairline bg-surface px-3.5 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {loading ? "갱신 중…" : "↻ 새로고침"}
          </button>
        </div>
      </header>

      {/* 제철소 탭 */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {SITE_LIST.map((site) => {
          const w = weather[site.id];
          const isActive = active === site.id;
          return (
            <button
              key={site.id}
              onClick={() => setActive(site.id)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive
                  ? "border-s-blue/60 bg-s-blue/10"
                  : "border-hairline bg-surface hover:bg-surface-2"
              }`}
              aria-pressed={isActive}
            >
              <div>
                <p className="text-sm font-semibold">{site.name}</p>
                <p className="text-[11px] text-muted">{site.region}</p>
              </div>
              {w && (
                <p className="tnum flex items-center gap-1.5 text-lg font-semibold">
                  <span aria-hidden>
                    {wmoIcon(w.current.code, w.current.isDay)}
                  </span>
                  {w.current.temp.toFixed(1)}°
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-st-serious/50 bg-surface px-4 py-3 text-sm text-st-serious">
          기상 데이터를 불러오지 못했습니다: {error} — 잠시 후 자동으로
          재시도합니다.
        </p>
      )}

      {/* 본문 */}
      {activeWeather ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <WeatherSection site={SITES[active]} weather={activeWeather} />
          <div className="xl:sticky xl:top-5 xl:self-start">
            <CctvPanel key={active} siteId={active} />
          </div>
        </div>
      ) : (
        !error && (
          <div className="animate-pulse rounded-xl border border-hairline bg-surface p-10 text-center text-sm text-muted">
            기상 데이터 불러오는 중…
          </div>
        )
      )}
    </div>
  );
}
