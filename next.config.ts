import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 로컬 개발 머신(exFAT)에서 출력 폴더의 types 디렉토리에 OS 수준 유령 잠금이
  // 반복 발생하여 잠기면 폴더명을 바꿔 우회한다 (.gitignore/.eslint는 .next* 전체 무시).
  // Vercel 빌드는 기본 .next 경로를 요구하므로 로컬에서만 적용한다.
  distDir: process.env.VERCEL ? undefined : ".next-local",
};

export default nextConfig;
