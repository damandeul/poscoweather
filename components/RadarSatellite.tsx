"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { PauseIcon, PlayIcon, RadarIcon, SatelliteIcon } from "./icons";

interface RadarFrame {
  time: number; // unix seconds
  path: string;
}
interface SatelliteFrame {
  time: number; // unix ms
  url: string;
}
interface ImageryResponse {
  radar: { host: string; frames: RadarFrame[] } | null;
  satellite: { frames: SatelliteFrame[] } | null;
}

const FRAME_INTERVAL_MS = 750;

function kstTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RadarSatellite({
  lat,
  lon,
  siteName,
}: {
  lat: number;
  lon: number;
  siteName: string;
}) {
  const [mode, setMode] = useState<"radar" | "satellite">("radar");
  const [data, setData] = useState<ImageryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);

  const mapRef = useRef<LeafletMap | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const radarLayersRef = useRef<TileLayer[]>([]);

  // 프레임 목록 조회
  useEffect(() => {
    let cancelled = false;
    fetch("/api/imagery")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: ImageryResponse) => {
        if (cancelled) return;
        setData(json);
        setFrameIdx(Math.max((json.radar?.frames.length ?? 1) - 1, 0));
      })
      .catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, []);

  // Leaflet 지도 초기화 (레이더용) — 클라이언트 전용
  useEffect(() => {
    if (!data?.radar || !mapDivRef.current || mapRef.current) return;
    let disposed = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !mapDivRef.current || mapRef.current) return;

      const map = L.map(mapDivRef.current, {
        center: [lat, lon],
        zoom: 8,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix(false);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap © CARTO © RainViewer",
          subdomains: "abcd",
          maxZoom: 10,
        }
      ).addTo(map);

      // 제철소 위치 마커
      L.circleMarker([lat, lon], {
        radius: 7,
        color: "#3987e5",
        weight: 2,
        fillColor: "#3987e5",
        fillOpacity: 0.5,
      }).addTo(map);

      // 레이더 프레임을 전부 레이어로 만들어 opacity로 전환 (부드러운 애니메이션)
      const { host, frames } = data.radar!;
      // RainViewer 512px 타일은 z7까지 제공 — zoomOffset으로 항상 유효 범위만 요청
      radarLayersRef.current = frames.map((f, i) => {
        const layer = L.tileLayer(
          `${host}${f.path}/512/{z}/{x}/{y}/8/1_1.png`,
          {
            opacity: i === frames.length - 1 ? 0.75 : 0,
            tileSize: 512,
            zoomOffset: -1,
            maxNativeZoom: 8,
            maxZoom: 10,
          }
        );
        layer.addTo(map);
        return layer;
      });

      mapRef.current = map;
    })();

    return () => {
      disposed = true;
      radarLayersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // 사이트 전환 시 지도 이동
  useEffect(() => {
    mapRef.current?.setView([lat, lon], mapRef.current.getZoom());
  }, [lat, lon]);

  // 모드 전환 시 지도 크기 재계산 (숨김 → 표시)
  useEffect(() => {
    if (mode === "radar") {
      setTimeout(() => mapRef.current?.invalidateSize(), 60);
    }
  }, [mode]);

  const switchMode = (next: "radar" | "satellite") => {
    setMode(next);
    const frames =
      next === "radar" ? data?.radar?.frames : data?.satellite?.frames;
    setFrameIdx(Math.max((frames?.length ?? 1) - 1, 0));
  };

  // 애니메이션 재생
  useEffect(() => {
    if (!playing || !data) return;
    const count =
      mode === "radar"
        ? (data.radar?.frames.length ?? 0)
        : (data.satellite?.frames.length ?? 0);
    if (count <= 1) return;
    const t = setInterval(
      () => setFrameIdx((i) => (i + 1) % count),
      FRAME_INTERVAL_MS
    );
    return () => clearInterval(t);
  }, [playing, mode, data]);

  // 레이더 프레임 전환 반영
  useEffect(() => {
    if (mode !== "radar") return;
    radarLayersRef.current.forEach((layer, i) =>
      layer.setOpacity(i === frameIdx ? 0.75 : 0)
    );
  }, [frameIdx, mode]);

  const radarFrames = data?.radar?.frames ?? [];
  const satFrames = data?.satellite?.frames ?? [];
  const currentTime =
    mode === "radar"
      ? radarFrames[frameIdx]
        ? kstTime(radarFrames[frameIdx].time * 1000)
        : "—"
      : satFrames[frameIdx]
        ? kstTime(satFrames[frameIdx].time)
        : "—";

  const available =
    mode === "radar" ? radarFrames.length > 0 : satFrames.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 세그먼트 컨트롤 */}
        <div className="flex rounded-xl border border-hairline bg-white/4 p-1">
          {(
            [
              { id: "radar", label: "레이더", icon: <RadarIcon className="h-3.5 w-3.5" /> },
              { id: "satellite", label: "위성", icon: <SatelliteIcon className="h-3.5 w-3.5" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => switchMode(t.id)}
              aria-pressed={mode === t.id}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                mode === t.id
                  ? "bg-accent/15 text-foreground"
                  : "text-muted hover:text-ink-2"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="tnum text-[11px] text-muted" suppressHydrationWarning>
            {currentTime} KST
            {available && (
              <span className="ml-1.5">
                {frameIdx + 1}/
                {mode === "radar" ? radarFrames.length : satFrames.length}
              </span>
            )}
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "일시정지" : "재생"}
            className="pressable grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-white/5 text-ink-2 hover:text-foreground"
          >
            {playing ? (
              <PauseIcon className="h-3 w-3" />
            ) : (
              <PlayIcon className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      <div className="relative mt-3 overflow-hidden rounded-xl border border-hairline bg-black/40">
        {/* 레이더 지도 */}
        <div
          ref={mapDivRef}
          className={`h-90 w-full ${mode === "radar" ? "" : "hidden"}`}
          aria-label={`${siteName} 주변 강수 레이더`}
        />
        {mode === "radar" && !data?.radar && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted">
            {error ? "레이더 데이터를 불러오지 못했습니다" : "레이더 불러오는 중…"}
          </p>
        )}

        {/* 위성 영상 */}
        {mode === "satellite" && (
          <div className="relative grid h-90 w-full place-items-center">
            {satFrames.length > 0 ? (
              <>
                {/* 프레임 전부 렌더 + opacity 전환으로 깜빡임 방지 */}
                {satFrames.map((f, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={f.url}
                    src={f.url}
                    alt={
                      i === frameIdx
                        ? "천리안 GK2A 위성 영상 (한반도, 주야간 합성)"
                        : ""
                    }
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
                    style={{
                      opacity: i === frameIdx ? 1 : 0,
                      // GK2A 한반도(ko020lc) 이미지에서 한반도가 화면 중앙에 오는 크롭
                      objectPosition: "50% 67%",
                    }}
                    loading={i === satFrames.length - 1 ? "eager" : "lazy"}
                  />
                ))}
                <span className="absolute bottom-2 right-2.5 rounded bg-black/55 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                  천리안 GK2A 주야간 합성 · 기상청
                </span>
              </>
            ) : (
              <p className="text-sm text-muted">
                {error
                  ? "위성 데이터를 불러오지 못했습니다"
                  : "위성 영상 불러오는 중…"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
