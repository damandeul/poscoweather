"use client";

import { ReactNode } from "react";
import { SiteWeather } from "@/lib/weather";
import {
  LeisureIndex,
  fishingIndex,
  hikingIndex,
  moonAge,
  moonPhaseName,
} from "@/lib/leisure";
import { FishIcon, MoonIcon, MountainIcon } from "./icons";

const GRADE_STYLE = [
  "border-st-good/40 bg-st-good/10 text-st-good",
  "border-hairline bg-white/6 text-ink-2",
  "border-st-serious/40 bg-st-serious/10 text-st-serious",
  "border-st-critical/50 bg-st-critical/10 text-st-critical",
];

const GRADE_DOT = [
  "bg-st-good",
  "bg-ink-2",
  "bg-st-serious",
  "bg-st-critical",
];

function IndexCard({
  icon,
  title,
  subtitle,
  index,
  extra,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  index: LeisureIndex;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-hairline bg-white/5 text-ink-2">
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">{title}</p>
            <p className="text-[11px] text-muted">{subtitle}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${GRADE_STYLE[index.grade]}`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${GRADE_DOT[index.grade]}`}
          />
          {index.label}
        </span>
      </div>

      {index.reasons.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {index.reasons.map((r) => (
            <li
              key={r}
              className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-ink-2"
            >
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-4 gap-2">
        {index.stats.map((s) => (
          <div key={s.label} className="glass-inset px-2.5 py-2">
            <p className="text-[10px] text-muted">{s.label}</p>
            <p className="tnum mt-0.5 text-[13px] font-semibold tracking-tight">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {extra}
    </div>
  );
}

export default function LeisurePanel({ weather }: { weather: SiteWeather }) {
  const hiking = hikingIndex(weather);
  const fishing = fishingIndex(weather);
  const age = moonAge(new Date(weather.fetchedAt));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="glass reveal p-5" style={{ "--i": 4 } as React.CSSProperties}>
        <IndexCard
          icon={<MountainIcon className="h-4.5 w-4.5" />}
          title="등산 지수"
          subtitle="바람 · 강수 · 체감온도 · 시정 기반"
          index={hiking}
        />
      </section>
      <section className="glass reveal p-5" style={{ "--i": 5 } as React.CSSProperties}>
        <IndexCard
          icon={<FishIcon className="h-4.5 w-4.5" />}
          title="바다낚시 지수"
          subtitle="파고 · 바람 · 강수 · 물때 기반"
          index={fishing}
          extra={
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <MoonIcon className="h-3 w-3" />
              월령 {age.toFixed(1)}일 · {moonPhaseName(age)} — 사리 전후엔 물살이
              빨라 조과 변동이 큽니다
            </p>
          }
        />
      </section>
    </div>
  );
}
