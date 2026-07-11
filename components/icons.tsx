/* 일관된 1.5px 스트로크 아이콘 세트 — 이모지 대신 사용 */

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/* ---------- 날씨 ---------- */

export const SunIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Base>
);

export const MoonIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Base>
);

export const CloudIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </Base>
);

export const CloudSunIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128" />
    <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
  </Base>
);

export const CloudMoonIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M10.083 9A6.002 6.002 0 0 1 16 4a4.243 4.243 0 0 0 6 6c0 2.22-1.206 4.16-3 5.197" />
    <path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z" />
  </Base>
);

export const CloudFogIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 17H7M17 21H9" />
  </Base>
);

export const CloudDrizzleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" />
  </Base>
);

export const CloudRainIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6M8 14v6M12 16v6" />
  </Base>
);

export const CloudSnowIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01" />
  </Base>
);

export const CloudLightningIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
    <path d="m13 12-3 5h4l-3 5" />
  </Base>
);

/* WMO 코드 → 아이콘 */
export function WeatherIcon({
  code,
  isDay = true,
  ...props
}: { code: number; isDay?: boolean } & IconProps) {
  if (code <= 1) return isDay ? <SunIcon {...props} /> : <MoonIcon {...props} />;
  if (code === 2)
    return isDay ? <CloudSunIcon {...props} /> : <CloudMoonIcon {...props} />;
  if (code === 3) return <CloudIcon {...props} />;
  if (code === 45 || code === 48) return <CloudFogIcon {...props} />;
  if (code >= 51 && code <= 57) return <CloudDrizzleIcon {...props} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRainIcon {...props} />;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return <CloudSnowIcon {...props} />;
  if (code >= 95) return <CloudLightningIcon {...props} />;
  return <CloudIcon {...props} />;
}

/* ---------- UI ---------- */

export const WindIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2" />
  </Base>
);

export const GustIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8h10a3 3 0 1 0-3-3M2 12h16.5a3.5 3.5 0 1 1-3.5 3.5M4 16h6a3 3 0 1 1-3 3" />
  </Base>
);

export const DropletIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />
  </Base>
);

export const RainDropsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05Z" />
    <path d="M12.56 6.6A11 11 0 0 0 14.5 2.04 4.35 4.35 0 0 0 16 5.03a4.35 4.35 0 0 1 1.5 3.11 3.35 3.35 0 0 1-6.7 0" />
    <path d="M18 21c1.7 0 3-1.37 3-3.04 0-.87-.43-1.7-1.29-2.4S18.22 14 18 12.9c-.22 1.1-.86 2.13-1.71 2.83S15 17.1 15 17.96c0 1.67 1.3 3.04 3 3.04Z" />
  </Base>
);

export const GaugeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 14 4-4" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
  </Base>
);

export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const SunriseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2v4M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0" />
  </Base>
);

export const WavesIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </Base>
);

export const ThermometerIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </Base>
);

export const VideoIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </Base>
);

export const AlertIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Base>
);

export const MapPinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Base>
);

export const LeafIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </Base>
);

export const UmbrellaIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M22 12a10.06 10.06 0 0 0-20 0Z" />
    <path d="M12 12v8a2 2 0 0 0 4 0M12 2v1" />
  </Base>
);

export const MountainIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m8 3 4 8 5-5 5 15H2L8 3Z" />
  </Base>
);

export const FishIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15.5 12c0 3.2-3.3 5.5-7 5.5-2.5 0-6-2.6-6-5.5s3.5-5.5 6-5.5c3.7 0 7 2.3 7 5.5Z" />
    <path d="m15.5 12 6-4.5-1.7 4.5 1.7 4.5-6-4.5Z" />
    <path d="M6 10.5h.01" />
  </Base>
);

export const LightbulbIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4.1 12.66c.66.48 1.1 1.24 1.1 2.06V18h6v-1.28c0-.82.44-1.58 1.1-2.06A7 7 0 0 0 12 2Z" />
  </Base>
);

export const RadarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34M4 6h.01M2.29 9.62a10 10 0 1 0 19.02-1.27M16.24 7.76a6 6 0 1 0-8.01 8.91M12 18h.01M17.99 11.66a6 6 0 0 1-2.22 4.75" />
    <circle cx="12" cy="12" r="2" />
    <path d="m13.41 10.59 5.66-5.66" />
  </Base>
);

export const SatelliteIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M13 7 9 3 5 7l4 4M17 11l-4 4 4 4 4-4-4-4M8 12l4 4M16 8l-1.5 1.5" />
    <path d="M17 21a4 4 0 0 0 4-4" />
  </Base>
);

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 4 14 8-14 8V4Z" />
  </Base>
);

export const PauseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 4h3v16H7zM14 4h3v16h-3z" />
  </Base>
);

/* 풍향 화살표 — deg 방향에서 불어오는 바람을 나타냄 (화살표는 바람이 가는 방향) */
export function WindArrowIcon({
  deg,
  ...props
}: { deg: number } & IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      />
      <g transform={`rotate(${deg + 180} 12 12)`}>
        <path
          d="M12 5v11M12 5l-3.2 3.6M12 5l3.2 3.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
