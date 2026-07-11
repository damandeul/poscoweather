"use client";

import { useEffect, useRef, useState } from "react";
import { SiteId } from "@/lib/sites";
import type { CctvCamera } from "@/app/api/cctv/route";

interface CctvResponse {
  configured: boolean;
  cameras: CctvCamera[];
}

export default function CctvPanel({ siteId }: { siteId: SiteId }) {
  const [data, setData] = useState<CctvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CctvCamera | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  // 사이트 전환 시 Dashboard에서 key={siteId}로 리마운트되므로 상태 초기화가 필요 없다
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cctv?site=${siteId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: CctvResponse) => {
        if (cancelled) return;
        setData(json);
        if (json.cameras.length > 0) setSelected(json.cameras[0]);
      })
      .catch((e) => !cancelled && setError(String(e)));
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
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">주변 CCTV (국가교통정보센터)</h3>
        {data?.configured && (
          <span className="text-[11px] text-muted">
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
        <div className="rounded-lg bg-surface-2 p-4 text-sm leading-6 text-ink-2">
          <p className="font-medium text-foreground">
            CCTV 연동에는 무료 API 키가 필요합니다
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              <a
                href="https://www.its.go.kr/opendata/"
                target="_blank"
                rel="noreferrer"
                className="text-s-blue underline underline-offset-2"
              >
                국가교통정보센터 오픈데이터 (its.go.kr/opendata)
              </a>
              에서 회원가입 후 <b>오픈API 인증키</b>를 신청합니다 (즉시 발급).
            </li>
            <li>
              프로젝트 루트의 <code className="rounded bg-background px-1.5 py-0.5">.env.local</code>{" "}
              파일에{" "}
              <code className="rounded bg-background px-1.5 py-0.5">
                ITS_API_KEY=발급받은키
              </code>{" "}
              를 저장합니다.
            </li>
            <li>개발 서버를 재시작하면 제철소 주변 도로 CCTV가 표시됩니다.</li>
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
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
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
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-st-critical" />
              LIVE
            </span>
          </div>
          <p className="mt-2 text-sm font-medium">{selected.name}</p>
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
                className={`flex w-full items-baseline justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selected?.id === cam.id
                    ? "bg-s-blue/15 text-foreground"
                    : "text-ink-2 hover:bg-surface-2"
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
