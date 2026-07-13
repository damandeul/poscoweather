"use client";

import { useEffect, useRef, useState } from "react";
import { SITES, SiteId } from "@/lib/sites";
import { fetchCctvCameras, type CctvCamera } from "@/lib/cctv";
import { VideoIcon } from "./icons";

interface CctvResponse {
  configured: boolean;
  cameras: CctvCamera[];
}

// 서버(Vercel 등 클라우드)에서는 ITS API가 IP 차단으로 실패할 수 있어,
// 브라우저(한국 IP)에서 직접 호출하는 폴백용 공개 키.
const PUBLIC_ITS_KEY = process.env.NEXT_PUBLIC_ITS_API_KEY;

export default function CctvPanel({ siteId }: { siteId: SiteId }) {
  const [data, setData] = useState<CctvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CctvCamera | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  // 사이트 전환 시 Dashboard에서 key={siteId}로 리마운트되므로 상태 초기화가 필요 없다
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let result: CctvResponse | null = null;
      try {
        const r = await fetch(`/api/cctv?site=${siteId}`);
        if (r.ok) result = (await r.json()) as CctvResponse;
      } catch {
        // 서버 라우트 실패 — 아래 브라우저 직접 호출 폴백으로 진행
      }

      // 서버가 ITS에 접근하지 못한 경우(클라우드 IP 차단) 브라우저에서 직접 조회
      if ((!result || result.cameras.length === 0) && PUBLIC_ITS_KEY) {
        const cameras = await fetchCctvCameras(SITES[siteId], PUBLIC_ITS_KEY);
        if (cameras.length > 0 || !result) {
          result = { configured: true, cameras };
        }
      }

      if (cancelled) return;
      if (!result) {
        setError("서버 및 ITS API 모두 응답하지 않습니다.");
        return;
      }
      setData(result);
      if (result.cameras.length > 0) setSelected(result.cameras[0]);
    };

    load().catch((e) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // HLS 재생
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected) return;
    setPlayError(null);

    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    const start = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selected.url;
        video.play().catch(() => {});
        return;
      }
      const { default: Hls } = await import("hls.js");
      if (cancelled) return;
      if (!Hls.isSupported()) {
        setPlayError("이 브라우저는 HLS 재생을 지원하지 않습니다.");
        return;
      }
      hls = new Hls({ maxBufferLength: 10 });
      hls.loadSource(selected.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_ev, d) => {
        if (d.fatal) {
          setPlayError(
            "스트림을 불러오지 못했습니다. 다른 카메라를 선택해 보세요."
          );
          hls?.destroy();
        }
      });
    };
    start();

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [selected]);

  return (
    <div className="glass flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-ink-2">
          <VideoIcon className="h-4 w-4 text-muted" />
          주변 CCTV
        </h3>
        {data?.configured && (
          <span className="tnum text-[11px] text-muted">
            {data.cameras.length}대 · 가까운 순
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-st-serious">
          CCTV 목록을 불러오지 못했습니다: {error}
        </p>
      )}

      {data && !data.configured && (
        <div className="glass-inset p-4 text-sm leading-relaxed text-ink-2">
          <p className="font-semibold tracking-tight text-foreground">
            CCTV 연동에는 무료 API 키가 필요합니다
          </p>
          <ol className="mt-2.5 list-decimal space-y-1.5 pl-5">
            <li>
              <a
                href="https://www.its.go.kr/opendata/"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2 transition-colors hover:text-foreground"
              >
                국가교통정보센터 오픈데이터
              </a>
              에서 회원가입 후 <b>오픈API 인증키</b>를 신청합니다 (즉시 발급).
            </li>
            <li>
              프로젝트 루트의{" "}
              <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              파일에{" "}
              <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs">
                ITS_API_KEY=발급받은키
              </code>{" "}
              를 저장합니다.
            </li>
            <li>서버를 재시작하면 제철소 주변 도로 CCTV가 표시됩니다.</li>
          </ol>
        </div>
      )}

      {data?.configured && data.cameras.length === 0 && (
        <p className="text-sm text-muted">
          검색 범위 내 CCTV가 없습니다. API 키가 유효한지 확인해 주세요.
        </p>
      )}

      {selected && (
        <div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-hairline bg-black shadow-[0_16px_40px_-16px_rgba(4,12,28,0.7)]">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              muted
              playsInline
              controls
            />
            {playError && (
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-st-warning">
                {playError}
              </p>
            )}
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-white backdrop-blur-sm">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-st-critical" />
              LIVE
            </span>
          </div>
          <p className="mt-2.5 text-sm font-semibold tracking-tight">
            {selected.name}
          </p>
          <p className="tnum text-[11px] text-muted">
            제철소에서 약 {selected.distanceKm.toFixed(1)} km
          </p>
        </div>
      )}

      {data && data.cameras.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {data.cameras.map((cam) => (
            <li key={cam.id}>
              <button
                onClick={() => setSelected(cam)}
                className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-300 ${
                  selected?.id === cam.id
                    ? "bg-accent/12 font-medium text-foreground"
                    : "text-ink-2 hover:bg-white/5 hover:text-foreground active:scale-[0.99]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{cam.name}</span>
                <span className="tnum shrink-0 text-[11px] text-muted">
                  {cam.distanceKm.toFixed(1)} km
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!data && !error && (
        <p className="animate-pulse text-sm text-muted">CCTV 목록 조회 중…</p>
      )}
    </div>
  );
}
