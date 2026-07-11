"use client";

import { Site } from "@/lib/sites";
import {
  SiteWeather,
  WeatherAlert,
  computeAlerts,
  pm10Grade,
  pm25Grade,
  uvGrade,
  windDirText,
  wmoIcon,
  wmoText,
  Grade,
} from "@/lib/weather";
import HourlyChart from "./HourlyChart";

const ALERT_COLOR: Record<WeatherAlert["level"], string> = {
  warning: "text-st-warning border-st-warning/50",
  serious: "text-st-serious border-st-serious/50",
  critical: "text-st-critical border-st-critical/60",
};

const GRADE_COLOR = [
  "text-st-good",
  "text-ink-2",
  "text-st-serious",
  "text-st-critical",
];

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span className={`text-xs font-medium ${GRADE_COLOR[grade.level]}`}>
      {grade.level >= 2 ? "⚠ " : ""}
      {grade.label}
    </span>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="tnum mt-0.5 text-base font-semibold">{value}</p>
      {sub && <p className="tnum text-[11px] text-ink-2">{sub}</p>}
    </div>
  );
}

function dayLabel(iso: string, i: number): string {
  if (i === 0) return "오늘";
  if (i === 1) return "내일";
  const d = new Date(`${iso}T00:00:00+09:00`);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()] + "요일";
}

export default function WeatherSection({
  site,
  weather,
}: {
  site: Site;
  weather: SiteWeather;
}) {
  const c = weather.current;
  const alerts = computeAlerts(weather);
  const air = weather.air;
  const marine = weather.marine;

  return (
    <div className="flex flex-col gap-4">
      {/* 현재 상태 헤더 */}
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{site.name}</h2>
            <p className="text-xs text-muted">
              {site.region} · {site.lat.toFixed(3)}°N {site.lon.toFixed(3)}°E
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-5xl" aria-hidden>
                {wmoIcon(c.code, c.isDay)}
              </span>
              <div>
                <p className="tnum text-4xl font-bold leading-none">
                  {c.temp.toFixed(1)}°
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {wmoText(c.code)} · 체감{" "}
                  <span className="tnum">{c.feels.toFixed(1)}°</span>
                </p>
              </div>
            </div>
          </div>
          {/* 경고 배지 */}
          <div className="flex max-w-70 flex-wrap justify-end gap-1.5">
            {alerts.length === 0 ? (
              <span className="rounded-full border border-st-good/50 px-2.5 py-1 text-xs text-st-good">
                ✓ 특이사항 없음
              </span>
            ) : (
              alerts.map((a) => (
                <span
                  key={a.label}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${ALERT_COLOR[a.level]}`}
                >
                  ⚠ {a.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 상세 타일 */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile
            label="바람"
            value={`${c.wind.toFixed(1)} m/s`}
            sub={`${windDirText(c.windDir)}풍 (${Math.round(c.windDir)}°)`}
          />
          <Tile label="돌풍" value={`${c.gust.toFixed(1)} m/s`} />
          <Tile label="습도" value={`${c.humidity}%`} />
          <Tile
            label="강수 (1h)"
            value={`${c.precip.toFixed(1)} mm`}
            sub={c.snow > 0 ? `적설 ${c.snow.toFixed(1)} cm` : undefined}
          />
          <Tile label="해면기압" value={`${c.pressure.toFixed(1)} hPa`} />
          <Tile label="운량" value={`${c.cloud}%`} />
          <Tile
            label="시정"
            value={
              c.visibility === null
                ? "—"
                : c.visibility >= 10000
                  ? "10 km+"
                  : `${(c.visibility / 1000).toFixed(1)} km`
            }
          />
          <Tile
            label="일출 / 일몰"
            value={`${weather.daily[0]?.sunrise.slice(11, 16) ?? "—"} / ${weather.daily[0]?.sunset.slice(11, 16) ?? "—"}`}
          />
        </div>
      </div>

      {/* 대기질 + 해양 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface p-4">
          <h3 className="text-sm font-semibold">대기질</h3>
          {air ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                <p className="text-[11px] text-muted">초미세먼지 PM2.5</p>
                <p className="tnum text-base font-semibold">
                  {air.pm25?.toFixed(0) ?? "—"}{" "}
                  <span className="text-[11px] font-normal text-muted">
                    µg/m³
                  </span>
                </p>
                {air.pm25 != null && <GradeBadge grade={pm25Grade(air.pm25)} />}
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                <p className="text-[11px] text-muted">미세먼지 PM10</p>
                <p className="tnum text-base font-semibold">
                  {air.pm10?.toFixed(0) ?? "—"}{" "}
                  <span className="text-[11px] font-normal text-muted">
                    µg/m³
                  </span>
                </p>
                {air.pm10 != null && <GradeBadge grade={pm10Grade(air.pm10)} />}
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2.5">
                <p className="text-[11px] text-muted">자외선 지수</p>
                <p className="tnum text-base font-semibold">
                  {air.uv?.toFixed(1) ?? "—"}
                </p>
                {air.uv != null && <GradeBadge grade={uvGrade(air.uv)} />}
              </div>
              <Tile label="이산화질소 NO₂" value={`${air.no2?.toFixed(0) ?? "—"} µg/m³`} />
              <Tile label="아황산가스 SO₂" value={`${air.so2?.toFixed(0) ?? "—"} µg/m³`} />
              <Tile label="오존 O₃" value={`${air.o3?.toFixed(0) ?? "—"} µg/m³`} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">대기질 데이터 없음</p>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-4">
          <h3 className="text-sm font-semibold">해양 상태 (연안)</h3>
          {marine && marine.waveHeight != null ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Tile label="파고" value={`${marine.waveHeight.toFixed(1)} m`} />
              <Tile
                label="파향"
                value={
                  marine.waveDir != null
                    ? `${windDirText(marine.waveDir)} (${Math.round(marine.waveDir)}°)`
                    : "—"
                }
              />
              <Tile
                label="파주기"
                value={
                  marine.wavePeriod != null
                    ? `${marine.wavePeriod.toFixed(1)} s`
                    : "—"
                }
              />
              <Tile
                label="해수면 온도"
                value={
                  marine.sst != null ? `${marine.sst.toFixed(1)} °C` : "—"
                }
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">해양 데이터 없음</p>
          )}
        </div>
      </div>

      {/* 24시간 예보 차트 */}
      <div className="rounded-xl border border-hairline bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">24시간 예보</h3>
        <HourlyChart hours={weather.hourly} />
      </div>

      {/* 일별 예보 */}
      <div className="rounded-xl border border-hairline bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold">일별 예보</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weather.daily.map((d, i) => (
            <div
              key={d.date}
              className="rounded-lg bg-surface-2 px-3 py-2.5 text-center"
            >
              <p className="text-xs text-muted">{dayLabel(d.date, i)}</p>
              <p className="my-1 text-2xl" aria-hidden>
                {wmoIcon(d.code)}
              </p>
              <p className="text-[11px] text-ink-2">{wmoText(d.code)}</p>
              <p className="tnum mt-1 text-sm">
                <span className="font-semibold">{d.tmax.toFixed(0)}°</span>
                <span className="text-muted"> / {d.tmin.toFixed(0)}°</span>
              </p>
              <p className="tnum text-[11px] text-s-aqua">강수 {d.pop}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
