import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/clips/[clipId]/render": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/projects/[projectId]/clips": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/internal/render-jobs/[jobId]": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
