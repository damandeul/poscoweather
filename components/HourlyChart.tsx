"use client";

import { useMemo, useRef, useState } from "react";
import { HourPoint } from "@/lib/weather";

const W = 720;
const TEMP_H = 150;
const POP_H = 84;
const PAD_X = 34;
const PAD_TOP = 22;
const PAD_BOTTOM = 20;

function hourLabel(iso: string): string {
  return `${Number(iso.slice(11, 13))}시`;
}

/** 24시간 기온 라인 + 강수확률 바 — 축이 다르므로 두 개의 소형 차트로 분리 */
export default function HourlyChart({ hours }: { hours: HourPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const tempRef = useRef<SVGSVGElement>(null);

  const n = hours.length;
  const x = (i: number) => PAD_X + (i * (W - PAD_X * 2)) / Math.max(n - 1, 1);

  const { tMin, tMax, tempPath, tempArea, minIdx, maxIdx } = useMemo(() => {
    const temps = hours.map((h) => h.temp);
    const lo = Math.min(...temps);
    const hi = Math.max(...temps);
    const span = Math.max(hi - lo, 2);
    const plotH = TEMP_H - PAD_TOP - PAD_BOTTOM;
    const y = (t: number) => PAD_TOP + ((hi - t) / span) * plotH;
    const pts = temps.map((t, i) => `${x(i).toFixed(1)},${y(t).toFixed(1)}`);
    return {
      tMin: lo,
      tMax: hi,
      tempY: y,
      tempPath: `M${pts.join(" L")}`,
      tempArea: `M${pts.join(" L")} L${x(n - 1).toFixed(1)},${TEMP_H - PAD_BOTTOM} L${PAD_X},${TEMP_H - PAD_BOTTOM} Z`,
      minIdx: temps.indexOf(lo),
      maxIdx: temps.indexOf(hi),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  const tempY = (t: number) => {
    const span = Math.max(tMax - tMin, 2);
    return PAD_TOP + ((tMax - t) / span) * (TEMP_H - PAD_TOP - PAD_BOTTOM);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD_X) / (W - PAD_X * 2)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const h = hover !== null ? hours[hover] : null;

  return (
    <div className="relative">
      {/* 기온 (°C) */}
      <p className="mb-1 text-xs text-muted">
        기온 <span className="text-s-blue">—</span> (°C)
      </p>
      <svg
        ref={tempRef}
        viewBox={`0 0 ${W} ${TEMP_H}`}
        className="w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="24시간 기온 추이"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + f * (TEMP_H - PAD_TOP - PAD_BOTTOM)}
            y2={PAD_TOP + f * (TEMP_H - PAD_TOP - PAD_BOTTOM)}
            stroke="var(--grid)"
            strokeWidth="1"
          />
        ))}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={TEMP_H - PAD_BOTTOM}
          y2={TEMP_H - PAD_BOTTOM}
          stroke="var(--baseline)"
          strokeWidth="1"
        />
        <path d={tempArea} fill="var(--s-blue)" opacity="0.12" />
        <path
          d={tempPath}
          fill="none"
          stroke="var(--s-blue)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 최고/최저만 직접 라벨 */}
        {[maxIdx, minIdx].map((i, k) => (
          <g key={k}>
            <circle
              cx={x(i)}
              cy={tempY(hours[i].temp)}
              r="4"
              fill="var(--s-blue)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
            <text
              x={x(i)}
              y={tempY(hours[i].temp) + (k === 0 ? -9 : 16)}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink-2)"
              className="tnum"
            >
              {hours[i].temp.toFixed(1)}°
            </text>
          </g>
        ))}
        {/* 시간 라벨 */}
        {hours.map((p, i) =>
          i % 3 === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={TEMP_H - 5}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
              className="tnum"
            >
              {hourLabel(p.time)}
            </text>
          ) : null
        )}
        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD_TOP - 6}
              y2={TEMP_H - PAD_BOTTOM}
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hover)}
              cy={tempY(hours[hover].temp)}
              r="4.5"
              fill="var(--s-blue)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* 강수확률 (%) */}
      <p className="mb-1 mt-2 text-xs text-muted">
        강수확률 <span className="text-s-aqua">▪</span> (%)
      </p>
      <svg
        viewBox={`0 0 ${W} ${POP_H}`}
        className="w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="24시간 강수확률"
      >
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={POP_H - 16}
          y2={POP_H - 16}
          stroke="var(--baseline)"
          strokeWidth="1"
        />
        {hours.map((p, i) => {
          const bw = Math.max(((W - PAD_X * 2) / n) * 0.62, 4);
          const bh = Math.max((p.pop / 100) * (POP_H - 26), p.pop > 0 ? 2 : 0);
          return (
            <rect
              key={i}
              x={x(i) - bw / 2}
              y={POP_H - 16 - bh}
              width={bw}
              height={bh}
              rx="2"
              fill="var(--s-aqua)"
              opacity={hover === null || hover === i ? 1 : 0.45}
            />
          );
        })}
        {hours.map((p, i) =>
          i % 3 === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={POP_H - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--muted)"
              className="tnum"
            >
              {hourLabel(p.time)}
            </text>
          ) : null
        )}
      </svg>

      {/* 툴팁 */}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-lg border border-hairline bg-[#17171b]/95 px-3 py-2 text-xs shadow-[0_12px_28px_-8px_rgba(4,12,28,0.6)] backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max((x(hover) / W) * 100, 8), 78)}%`,
          }}
        >
          <p className="font-medium">{hourLabel(h.time)}</p>
          <p className="tnum mt-1 text-ink-2">기온 {h.temp.toFixed(1)}°C</p>
          <p className="tnum text-ink-2">
            강수 {h.pop}% · {h.precip.toFixed(1)}mm
          </p>
          <p className="tnum text-ink-2">
            바람 {h.wind.toFixed(1)}m/s · 습도 {h.humidity}%
          </p>
        </div>
      )}
    </div>
  );
}
