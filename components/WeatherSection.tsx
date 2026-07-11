"use client";

import { ReactNode } from "react";
import { Site } from "@/lib/sites";
import {
  SiteWeather,
  WeatherAlert,
  computeAlerts,
  pm10Grade,
  pm25Grade,
  uvGrade,
  windDirText,
  wmoText,
  Grade,
} from "@/lib/weather";
import HourlyChart from "./HourlyChart";
import {
  AlertIcon,
  CheckIcon,
  CloudIcon,
  DropletIcon,
  EyeIcon,
  GaugeIcon,
  GustIcon,
  LeafIcon,
  MapPinIcon,
  RainDropsIcon,
  SunriseIcon,
  ThermometerIcon,
  UmbrellaIcon,
  WavesIcon,
  WeatherIcon,
  WindArrowIcon,
  WindIcon,
} from "./icons";

const ALERT_COLOR: Record<WeatherAlert["level"], string> = {
  warning: "text-st-warning border-st-warning/40 bg-st-warning/5",
  serious: "text-st-serious border-st-serious/40 bg-st-serious/5",
  critical: "text-st-critical border-st-critical/50 bg-st-critical/10",
};

const GRADE_COLOR = [
  "text-st-good",
  "text-ink-2",
  "text-st-serious",
  "text-st-critical",
];
const GRADE_BAR = [
  "bg-st-good",
  "bg-ink-2",
  "bg-st-serious",
  "bg-st-critical",
];

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${GRADE_COLOR[grade.level]}`}
    >
      {grade.level >= 2 && <AlertIcon className="h-3 w-3" />}
      {grade.label}
    </span>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  children,
  className = "",
}: {
  icon?: ReactNode;
  label: string;
  value?: string;
  sub?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-inset flex flex-col px-3.5 py-3 ${className}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted">
        {icon}
        {label}
      </p>
      {value && (
        <p className="tnum mt-1.5 text-lg font-semibold leading-none tracking-tight">
          {value}
        </p>
      )}
      {sub && <p className="tnum mt-1 text-[11px] text-ink-2">{sub}</p>}
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink-2">
      <span className="text-muted">{icon}</span>
      {children}
    </h3>
  );
}

function dayLabel(iso: string, i: number): string {
  if (i === 0) return "오늘";
  if (i === 1) return "내일";
  const d = new Date(`${iso}T00:00:00+09:00`);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()] + "요일";
}

/* PM 등급 척도 대비 현재 위치 (0~1) */
function pmRatio(v: number, breaks: number[]): number {
  const max = breaks[breaks.length - 1] * 1.35;
  return Math.min(v / max, 1);
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
  const iconCls = "h-3.5 w-3.5";

  return (
    <div className="flex flex-col gap-4">
      {/* 현재 상태 히어로 — 비대칭 스플릿 */}
      <section className="glass reveal p-6 sm:p-7" style={{ "--i": 0 } as React.CSSProperties}>
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <MapPinIcon className="h-3.5 w-3.5" />
              {site.region} · {site.lat.toFixed(3)}°N {site.lon.toFixed(3)}°E
            </p>
            <div className="mt-4 flex items-end gap-5">
              <p className="tnum text-6xl font-extrabold leading-none tracking-tighter sm:text-7xl">
                {c.temp.toFixed(1)}
                <span className="align-top text-3xl font-medium text-ink-2">
                  °
                </span>
              </p>
              <div className="pb-1.5">
                <p className="text-lg font-semibold tracking-tight">
                  {wmoText(c.code)}
                </p>
                <p className="tnum mt-0.5 text-sm text-muted">
                  체감 {c.feels.toFixed(1)}° · 습도 {c.humidity}%
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <WeatherIcon
              code={c.code}
              isDay={c.isDay}
              className="h-16 w-16 text-ink-2 opacity-90 sm:h-20 sm:w-20"
              strokeWidth={1.2}
            />
            <div className="flex max-w-72 flex-wrap justify-end gap-1.5">
              {alerts.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-st-good/35 bg-st-good/5 px-3 py-1 text-xs font-medium text-st-good">
                  <CheckIcon className="h-3 w-3" />
                  특이사항 없음
                </span>
              ) : (
                alerts.map((a) => (
                  <span
                    key={a.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${ALERT_COLOR[a.level]}`}
                  >
                    <AlertIcon className="h-3 w-3" />
                    {a.label}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 벤토 상세 그리드 — 바람 타일 확장 */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile
            icon={<WindIcon className={iconCls} />}
            label="바람"
            className="col-span-2 row-span-2 justify-between"
          >
            <div className="mt-2 flex items-center gap-4">
              <WindArrowIcon deg={c.windDir} className="h-16 w-16 text-accent" />
              <div>
                <p className="tnum text-2xl font-bold leading-none tracking-tight">
                  {c.wind.toFixed(1)}
                  <span className="ml-1 text-sm font-normal text-muted">
                    m/s
                  </span>
                </p>
                <p className="tnum mt-1.5 text-xs text-ink-2">
                  {windDirText(c.windDir)}풍 ({Math.round(c.windDir)}°)
                </p>
                <p className="tnum mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <GustIcon className="h-3 w-3" />
                  돌풍 {c.gust.toFixed(1)} m/s
                </p>
              </div>
            </div>
          </Tile>
          <Tile
            icon={<ThermometerIcon className={iconCls} />}
            label="체감온도"
            value={`${c.feels.toFixed(1)} °C`}
          />
          <Tile
            icon={<UmbrellaIcon className={iconCls} />}
            label="강수확률"
            value={`${weather.hourly[0]?.pop ?? 0}%`}
          />
          <Tile
            icon={<RainDropsIcon className={iconCls} />}
            label="강수 (1h)"
            value={`${c.precip.toFixed(1)} mm`}
            sub={c.snow > 0 ? `적설 ${c.snow.toFixed(1)} cm` : undefined}
          />
          <Tile
            icon={<GaugeIcon className={iconCls} />}
            label="해면기압"
            value={`${c.pressure.toFixed(1)} hPa`}
          />
          <Tile
            icon={<EyeIcon className={iconCls} />}
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
            icon={<CloudIcon className={iconCls} />}
            label="운량"
            value={`${c.cloud}%`}
          />
          <Tile
            icon={<DropletIcon className={iconCls} />}
            label="습도"
            value={`${c.humidity}%`}
          />
          <Tile
            icon={<SunriseIcon className={iconCls} />}
            label="일출 / 일몰"
            value={`${weather.daily[0]?.sunrise.slice(11, 16) ?? "—"} / ${weather.daily[0]?.sunset.slice(11, 16) ?? "—"}`}
          />
        </div>
      </section>

      {/* 대기질 + 해양 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className="glass reveal p-5"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <SectionTitle icon={<LeafIcon className="h-4 w-4" />}>
            대기질
          </SectionTitle>
          {air ? (
            <div className="mt-4 flex flex-col gap-4">
              {(
                [
                  {
                    label: "초미세먼지 PM2.5",
                    v: air.pm25,
                    grade: air.pm25 != null ? pm25Grade(air.pm25) : null,
                    ratio: air.pm25 != null ? pmRatio(air.pm25, [15, 35, 75]) : 0,
                  },
                  {
                    label: "미세먼지 PM10",
                    v: air.pm10,
                    grade: air.pm10 != null ? pm10Grade(air.pm10) : null,
                    ratio:
                      air.pm10 != null ? pmRatio(air.pm10, [30, 80, 150]) : 0,
                  },
                ] as const
              ).map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs text-muted">{row.label}</p>
                    <p className="tnum text-sm font-semibold">
                      {row.v?.toFixed(0) ?? "—"}
                      <span className="ml-1 text-[10px] font-normal text-muted">
                        µg/m³
                      </span>
                      {row.grade && (
                        <span className="ml-2">
                          <GradeBadge grade={row.grade} />
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${row.grade ? GRADE_BAR[row.grade.level] : "bg-ink-2"}`}
                      style={{ width: `${Math.max(row.ratio * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Tile label="NO₂" value={`${air.no2?.toFixed(0) ?? "—"}`} sub="µg/m³" />
                <Tile label="SO₂" value={`${air.so2?.toFixed(0) ?? "—"}`} sub="µg/m³" />
                <Tile label="O₃" value={`${air.o3?.toFixed(0) ?? "—"}`} sub="µg/m³" />
                <Tile
                  label="자외선"
                  value={air.uv?.toFixed(1) ?? "—"}
                  sub={air.uv != null ? uvGrade(air.uv).label : undefined}
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">대기질 데이터 없음</p>
          )}
        </section>

        <section
          className="glass reveal p-5"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <SectionTitle icon={<WavesIcon className="h-4 w-4" />}>
            해양 상태 (연안)
          </SectionTitle>
          {marine && marine.waveHeight != null ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
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
                value={marine.sst != null ? `${marine.sst.toFixed(1)} °C` : "—"}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">해양 데이터 없음</p>
          )}
        </section>
      </div>

      {/* 24시간 예보 차트 */}
      <section
        className="glass reveal p-5"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        <SectionTitle icon={<GaugeIcon className="h-4 w-4" />}>
          24시간 예보
        </SectionTitle>
        <div className="mt-4">
          <HourlyChart hours={weather.hourly} />
        </div>
      </section>

      {/* 일별 예보 */}
      <section
        className="glass reveal p-5"
        style={{ "--i": 4 } as React.CSSProperties}
      >
        <SectionTitle icon={<SunriseIcon className="h-4 w-4" />}>
          일별 예보
        </SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weather.daily.map((d, i) => (
            <div
              key={d.date}
              className="glass-inset flex flex-col items-center px-3 py-4 text-center"
            >
              <p className="text-xs font-medium text-muted">
                {dayLabel(d.date, i)}
              </p>
              <WeatherIcon
                code={d.code}
                className="my-3 h-8 w-8 text-ink-2"
              />
              <p className="text-[11px] text-ink-2">{wmoText(d.code)}</p>
              <p className="tnum mt-1.5 text-sm tracking-tight">
                <span className="font-semibold">{d.tmax.toFixed(0)}°</span>
                <span className="text-muted"> / {d.tmin.toFixed(0)}°</span>
              </p>
              <p className="tnum mt-0.5 text-[11px] text-s-aqua">
                강수 {d.pop}%
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
