import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 기본 .next 폴더가 OS 수준 잠금으로 접근 불가하여 출력 폴더를 변경
  distDir: ".next-out",
};

export default nextConfig;
