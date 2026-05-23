import { spawn } from "node:child_process";

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
    const ffmpeg = spawn("ffmpeg", [
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
            ? "FFmpeg is not installed or not available on PATH."
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
