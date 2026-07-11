import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬 개발 머신의 .next 폴더가 OS 수준 잠금으로 접근 불가하여 출력 폴더를 변경.
  // Vercel 빌드는 기본 .next 경로를 요구하므로 로컬에서만 적용한다.
  distDir: process.env.VERCEL ? undefined : ".next-out",
};

export default nextConfig;
