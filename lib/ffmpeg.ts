import { spawn } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";
import ffmpegStaticPath from "ffmpeg-static";

type RenderClipInput = {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
};

function resolveFfmpegBinary() {
  const candidates = [
    process.env.FFMPEG_PATH,
    path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg"),
    ffmpegStaticPath,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      try {
        chmodSync(candidate, 0o755);
      } catch {
        // Some hosts mount traced files read-only. Spawn can still work if the
        // executable bit is already preserved.
      }

      return candidate;
    }
  }

  return null;
}

export function renderClip({
  inputPath,
  outputPath,
  startTime,
  duration,
}: RenderClipInput) {
  return new Promise<void>((resolve, reject) => {
    const ffmpegBinary = resolveFfmpegBinary();

    if (!ffmpegBinary) {
      reject(
        new Error(
          `FFmpeg binary was not found at runtime. Checked FFMPEG_PATH, ${path.join(
            process.cwd(),
            "node_modules",
            "ffmpeg-static",
            "ffmpeg",
          )}, and ffmpeg-static export ${ffmpegStaticPath ?? "null"}.`,
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
