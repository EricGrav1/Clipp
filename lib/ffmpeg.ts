import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import ffmpegStaticPath from "ffmpeg-static";

type RenderClipInput = {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
};

export function renderClip({
  inputPath,
  outputPath,
  startTime,
  duration,
}: RenderClipInput) {
  return new Promise<void>((resolve, reject) => {
    const ffmpegBinary = process.env.FFMPEG_PATH || ffmpegStaticPath || "ffmpeg";
    const hasExplicitBinary = Boolean(process.env.FFMPEG_PATH || ffmpegStaticPath);

    if (hasExplicitBinary && !existsSync(ffmpegBinary)) {
      reject(
        new Error(
          `FFmpeg binary was resolved but not found at runtime: ${ffmpegBinary}`,
        ),
      );
      return;
    }

    const ffmpeg = spawn(ffmpegBinary, [
      "-hide_banner",
      "-nostdin",
      "-y",
      "-ss",
      startTime.toFixed(3),
      "-i",
      inputPath,
      "-t",
      duration.toFixed(3),
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (error) => {
      reject(
        new Error(
          error.message.includes("ENOENT")
            ? `FFmpeg binary is not available at runtime. Resolved path: ${ffmpegBinary}`
            : error.message,
        ),
      );
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const usefulError = stderr.split("\n").slice(-8).join("\n").trim();
      reject(new Error(usefulError || `FFmpeg exited with code ${code}.`));
    });
  });
}
