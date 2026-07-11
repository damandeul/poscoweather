import { Site } from "./sites";

/* ---------- 타입 ---------- */

export interface CurrentWeather {
  time: string;
  temp: number;
  feels: number;
  humidity: number;
  precip: number;
  rain: number;
  snow: number;
  code: number;
  cloud: number;
  pressure: number;
  wind: number; // m/s
  windDir: number; // deg
  gust: number; // m/s
  isDay: boolean;
  visibility: number | null; // m
}

export interface HourPoint {
  time: string;
  temp: number;
  pop: number; // 강수확률 %
  precip: number; // mm
  code: number;
  wind: number;
  humidity: number;
}

export interface DayPoint {
  date: string;
  code: number;
  tmax: number;
  tmin: number;
  pop: number;
  sunrise: string;
  sunset: string;
}

export interface AirQuality {
  pm10: number | null;
  pm25: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null;
  uv: number | null;
}

export interface Marine {
  waveHeight: number | null;
  waveDir: number | null;
  wavePeriod: number | null;
  sst: number | null;
}

export interface SiteWeather {
  current: CurrentWeather;
  hourly: HourPoint[];
  daily: DayPoint[];
  air: AirQuality | null;
  marine: Marine | null;
  fetchedAt: number;
}

export type AlertLevel = "warning" | "serious" | "critical";
export interface WeatherAlert {
  level: AlertLevel;
  label: string;
}

/* ---------- 데이터 조회 (Open-Meteo, 키 불필요) ---------- */

export async function fetchSiteWeather(site: Site): Promise<SiteWeather> {
  const base = {
    latitude: String(site.lat),
    longitude: String(site.lon),
    timezone: "Asia/Seoul",
  };

  const forecastUrl =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      ...base,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      hourly:
        "temperature_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,relative_humidity_2m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
      forecast_days: "4",
      wind_speed_unit: "ms",
    });

  const airUrl =
    "https://air-quality-api.open-meteo.com/v1/air-quality?" +
    new URLSearchParams({
      ...base,
      current:
        "pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,uv_index",
    });

  const marineUrl =
    "https://marine-api.open-meteo.com/v1/marine?" +
    new URLSearchParams({
      ...base,
      current: "wave_height,wave_direction,wave_period,sea_surface_temperature",
    });

  const [forecast, air, marine] = await Promise.all([
    fetch(forecastUrl).then((r) => {
      if (!r.ok) throw new Error(`forecast ${r.status}`);
      return r.json();
    }),
    fetch(airUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(marineUrl)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const c = forecast.current;
  const h = forecast.hourly;
  const d = forecast.daily;

  // 현재 시각과 같은 시간대의 hourly 인덱스 (시정 등 current에 없는 값 보완용)
  const nowIso: string = c.time; // "2026-07-11T14:15" 형태
  const hourKey = nowIso.slice(0, 13);
  let idx = (h.time as string[]).findIndex((t) => t.startsWith(hourKey));
  if (idx < 0) idx = 0;

  const current: CurrentWeather = {
    time: c.time,
    temp: c.temperature_2m,
    feels: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    precip: c.precipitation,
    rain: c.rain,
    snow: c.snowfall,
    code: c.weather_code,
    cloud: c.cloud_cover,
    pressure: c.pressure_msl,
    wind: c.wind_speed_10m,
    windDir: c.wind_direction_10m,
    gust: c.wind_gusts_10m,
    isDay: c.is_day === 1,
    visibility: h.visibility?.[idx] ?? null,
  };

  const hourly: HourPoint[] = (h.time as string[])
    .map((t, i) => ({
      time: t,
      temp: h.temperature_2m[i],
      pop: h.precipitation_probability?.[i] ?? 0,
      precip: h.precipitation?.[i] ?? 0,
      code: h.weather_code[i],
      wind: h.wind_speed_10m[i],
      humidity: h.relative_humidity_2m[i],
    }))
    .slice(idx, idx + 24);

  const daily: DayPoint[] = (d.time as string[]).map((t, i) => ({
    date: t,
    code: d.weather_code[i],
    tmax: d.temperature_2m_max[i],
    tmin: d.temperature_2m_min[i],
    pop: d.precipitation_probability_max?.[i] ?? 0,
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
  }));

  const airOut: AirQuality | null = air?.current
    ? {
        pm10: air.current.pm10 ?? null,
        pm25: air.current.pm2_5 ?? null,
        no2: air.current.nitrogen_dioxide ?? null,
        so2: air.current.sulphur_dioxide ?? null,
        o3: air.current.ozone ?? null,
        co: air.current.carbon_monoxide ?? null,
        uv: air.current.uv_index ?? null,
      }
    : null;

  const marineOut: Marine | null = marine?.current
    ? {
        waveHeight: marine.current.wave_height ?? null,
        waveDir: marine.current.wave_direction ?? null,
        wavePeriod: marine.current.wave_period ?? null,
        sst: marine.current.sea_surface_temperature ?? null,
      }
    : null;

  return {
    current,
    hourly,
    daily,
    air: airOut,
    marine: marineOut,
    fetchedAt: Date.now(),
  };
}

/* ---------- 표기 도우미 ---------- */

const WMO: Record<number, { text: string; icon: string; nightIcon?: string }> =
  {
    0: { text: "맑음", icon: "☀️", nightIcon: "🌙" },
    1: { text: "대체로 맑음", icon: "🌤️", nightIcon: "🌙" },
    2: { text: "구름 조금", icon: "⛅", nightIcon: "☁️" },
    3: { text: "흐림", icon: "☁️" },
    45: { text: "안개", icon: "🌫️" },
    48: { text: "착빙성 안개", icon: "🌫️" },
    51: { text: "약한 이슬비", icon: "🌦️" },
    53: { text: "이슬비", icon: "🌦️" },
    55: { text: "강한 이슬비", icon: "🌧️" },
    56: { text: "어는 이슬비", icon: "🌧️" },
    57: { text: "강한 어는 이슬비", icon: "🌧️" },
    61: { text: "약한 비", icon: "🌧️" },
    63: { text: "비", icon: "🌧️" },
    65: { text: "강한 비", icon: "🌧️" },
    66: { text: "어는 비", icon: "🌧️" },
    67: { text: "강한 어는 비", icon: "🌧️" },
    71: { text: "약한 눈", icon: "🌨️" },
    73: { text: "눈", icon: "🌨️" },
    75: { text: "강한 눈", icon: "❄️" },
    77: { text: "싸락눈", icon: "🌨️" },
    80: { text: "약한 소나기", icon: "🌦️" },
    81: { text: "소나기", icon: "🌧️" },
    82: { text: "강한 소나기", icon: "⛈️" },
    85: { text: "소낙눈", icon: "🌨️" },
    86: { text: "강한 소낙눈", icon: "❄️" },
    95: { text: "뇌우", icon: "⛈️" },
    96: { text: "뇌우·우박", icon: "⛈️" },
    99: { text: "강한 뇌우·우박", icon: "⛈️" },
  };

export function wmoText(code: number): string {
  return WMO[code]?.text ?? `코드 ${code}`;
}

export function wmoIcon(code: number, isDay = true): string {
  const w = WMO[code];
  if (!w) return "❓";
  return !isDay && w.nightIcon ? w.nightIcon : w.icon;
}

const DIR16 = [
  "북",
  "북북동",
  "북동",
  "동북동",
  "동",
  "동남동",
  "남동",
  "남남동",
  "남",
  "남남서",
  "남서",
  "서남서",
  "서",
  "서북서",
  "북서",
  "북북서",
];

export function windDirText(deg: number): string {
  return DIR16[Math.round(deg / 22.5) % 16];
}

export type Grade = { label: string; level: 0 | 1 | 2 | 3 }; // 좋음/보통/나쁨/매우나쁨

export function pm25Grade(v: number): Grade {
  if (v <= 15) return { label: "좋음", level: 0 };
  if (v <= 35) return { label: "보통", level: 1 };
  if (v <= 75) return { label: "나쁨", level: 2 };
  return { label: "매우나쁨", level: 3 };
}

export function pm10Grade(v: number): Grade {
  if (v <= 30) return { label: "좋음", level: 0 };
  if (v <= 80) return { label: "보통", level: 1 };
  if (v <= 150) return { label: "나쁨", level: 2 };
  return { label: "매우나쁨", level: 3 };
}

export function uvGrade(v: number): Grade {
  if (v < 3) return { label: "낮음", level: 0 };
  if (v < 6) return { label: "보통", level: 1 };
  if (v < 8) return { label: "높음", level: 2 };
  return { label: "매우높음", level: 3 };
}

/* ---------- 기상 특보성 경고 (현재값 기준 자체 판정) ---------- */

export function computeAlerts(w: SiteWeather): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const c = w.current;

  if (c.gust >= 26 || c.wind >= 21)
    alerts.push({ level: "critical", label: "강풍 경보 수준" });
  else if (c.gust >= 20 || c.wind >= 14)
    alerts.push({ level: "serious", label: "강풍 주의" });

  if (c.precip >= 20) alerts.push({ level: "critical", label: "매우 강한 비" });
  else if (c.precip >= 10) alerts.push({ level: "serious", label: "강한 비" });
  else if (c.precip >= 3) alerts.push({ level: "warning", label: "비 유의" });

  if ([95, 96, 99].includes(c.code))
    alerts.push({ level: "serious", label: "뇌우 활동" });

  if ([71, 73, 75, 77, 85, 86].includes(c.code))
    alerts.push({ level: "warning", label: "강설" });

  if (c.visibility !== null && c.visibility < 500)
    alerts.push({ level: "serious", label: "시정 500m 미만" });
  else if (c.visibility !== null && c.visibility < 1000)
    alerts.push({ level: "warning", label: "시정 불량" });

  if (c.temp >= 35) alerts.push({ level: "serious", label: "폭염 경보 수준" });
  else if (c.temp >= 33) alerts.push({ level: "warning", label: "폭염 주의" });
  if (c.temp <= -12) alerts.push({ level: "serious", label: "한파" });

  if (w.air?.pm25 != null && w.air.pm25 > 75)
    alerts.push({ level: "serious", label: "초미세먼지 매우나쁨" });
  else if (w.air?.pm25 != null && w.air.pm25 > 35)
    alerts.push({ level: "warning", label: "초미세먼지 나쁨" });

  if (w.marine?.waveHeight != null && w.marine.waveHeight >= 3)
    alerts.push({ level: "serious", label: "풍랑 주의" });

  return alerts;
}
