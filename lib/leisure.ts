import { SiteWeather } from "./weather";

/* 등산·바다낚시 적합도 지수 — 현재 관측값 + 12시간 예보 기반 자체 판정 */

export interface LeisureIndex {
  grade: 0 | 1 | 2 | 3; // 좋음 / 보통 / 주의 / 부적합
  label: string;
  score: number;
  reasons: string[]; // 감점 요인 (좋음이면 비어 있음)
  stats: { label: string; value: string }[];
}

const GRADE_LABEL = ["좋음", "보통", "주의", "부적합"] as const;

function toGrade(score: number): 0 | 1 | 2 | 3 {
  if (score >= 75) return 0;
  if (score >= 50) return 1;
  if (score >= 25) return 2;
  return 3;
}

function maxPop12h(w: SiteWeather): number {
  return Math.max(0, ...w.hourly.slice(0, 12).map((h) => h.pop));
}

export function hikingIndex(w: SiteWeather): LeisureIndex {
  const c = w.current;
  const pop = maxPop12h(w);
  let score = 100;
  const reasons: string[] = [];
  const hit = (penalty: number, reason: string) => {
    score -= penalty;
    reasons.push(reason);
  };

  if ([95, 96, 99].includes(c.code)) hit(50, "뇌우 — 능선·정상 위험");
  if (c.gust >= 20) hit(40, "매우 강한 돌풍");
  else if (c.gust >= 14) hit(25, "강한 돌풍");
  else if (c.wind >= 9) hit(10, "다소 강한 바람");

  if (c.precip >= 5) hit(40, "강한 비 — 등산로 미끄러움");
  else if (c.precip > 0) hit(20, "비 내리는 중");
  else if (pop >= 60) hit(20, `강수확률 ${pop}%`);
  else if (pop >= 30) hit(10, `강수확률 ${pop}%`);

  if ([71, 73, 75, 77, 85, 86].includes(c.code)) hit(30, "강설 — 아이젠 필요");
  if (c.feels >= 33) hit(30, "폭염 체감 — 온열질환 주의");
  else if (c.feels >= 31) hit(15, "무더위 체감");
  if (c.feels <= -10) hit(30, "혹한 체감");
  if (c.visibility !== null && c.visibility < 1000) hit(25, "시정 불량 — 길 잃기 쉬움");
  if ((w.air?.uv ?? 0) >= 8) hit(10, "자외선 매우 높음");

  score = Math.max(score, 0);
  const grade = toGrade(score);
  const sunset = w.daily[0]?.sunset.slice(11, 16) ?? "—";

  return {
    grade,
    label: GRADE_LABEL[grade],
    score,
    reasons: reasons.slice(0, 3),
    stats: [
      { label: "체감온도", value: `${c.feels.toFixed(1)}°` },
      { label: "돌풍", value: `${c.gust.toFixed(1)} m/s` },
      { label: "강수확률(12h)", value: `${pop}%` },
      { label: "일몰", value: sunset },
    ],
  };
}

export function fishingIndex(w: SiteWeather): LeisureIndex {
  const c = w.current;
  const wave = w.marine?.waveHeight ?? null;
  const pop = maxPop12h(w);
  let score = 100;
  const reasons: string[] = [];
  const hit = (penalty: number, reason: string) => {
    score -= penalty;
    reasons.push(reason);
  };

  if ([95, 96, 99].includes(c.code)) hit(60, "뇌우 — 낚싯대는 피뢰침");
  if (wave !== null) {
    if (wave >= 2.5) hit(50, "높은 파고 — 갯바위 접근 금지");
    else if (wave >= 1.5) hit(25, "파고 주의");
    else if (wave >= 1) hit(10, "파고 다소 높음");
  }
  if (c.gust >= 14) hit(30, "강한 돌풍 — 채비 조작 곤란");
  else if (c.wind >= 9) hit(20, "강한 바람");
  else if (c.wind >= 6) hit(10, "바람 다소 강함");

  if (c.precip >= 5) hit(30, "강한 비");
  else if (c.precip > 0) hit(15, "비 내리는 중");
  else if (pop >= 60) hit(10, `강수확률 ${pop}%`);

  if (c.visibility !== null && c.visibility < 1000) hit(20, "시정 불량");

  score = Math.max(score, 0);
  const grade = toGrade(score);

  return {
    grade,
    label: GRADE_LABEL[grade],
    score,
    reasons: reasons.slice(0, 3),
    stats: [
      { label: "파고", value: wave !== null ? `${wave.toFixed(1)} m` : "—" },
      {
        label: "수온",
        value:
          w.marine?.sst != null ? `${w.marine.sst.toFixed(1)}°` : "—",
      },
      { label: "바람", value: `${c.wind.toFixed(1)} m/s` },
      { label: "물때", value: tideLabel(new Date(w.fetchedAt)) },
    ],
  };
}

/* ---------- 월령·물때 ---------- */

const SYNODIC = 29.530588853; // 삭망월 (일)
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC 신월

export function moonAge(date: Date): number {
  const days = (date.getTime() - NEW_MOON_EPOCH) / 86_400_000;
  return ((days % SYNODIC) + SYNODIC) % SYNODIC;
}

export function moonPhaseName(age: number): string {
  if (age < 1.85 || age >= 27.68) return "삭 (신월)";
  if (age < 5.54) return "초승달";
  if (age < 9.23) return "상현달";
  if (age < 12.91) return "차오르는 달";
  if (age < 16.61) return "보름달";
  if (age < 20.3) return "기우는 달";
  if (age < 23.99) return "하현달";
  return "그믐달";
}

/** 사리(대조)·조금(소조) — 신월·보름 부근이 사리, 상현·하현 부근이 조금 */
export function tideLabel(date: Date): string {
  const age = moonAge(date);
  const half = SYNODIC / 2; // 14.77
  const quarter = SYNODIC / 4; // 7.38
  const near = (target: number) =>
    Math.abs(age - target) <= 2 ||
    Math.abs(age - target - SYNODIC) <= 2 ||
    Math.abs(age - target + SYNODIC) <= 2;
  if (near(0) || near(half)) return "사리";
  if (near(quarter) || near(quarter * 3)) return "조금";
  return "중물";
}
