import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
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

function runFfmpeg(ffmpegBinary: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(ffmpegBinary, args);

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

    ffmpeg.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const usefulError = stderr.split("\n").slice(-40).join("\n").trim();
      const exitReason =
        code === null
          ? `FFmpeg was terminated by signal ${signal ?? "unknown"}.`
          : `FFmpeg exited with code ${code}.`;
      reject(
        new Error(
          usefulError
            ? `${exitReason}\n\nFFmpeg stderr:\n${usefulError}`
            : `${exitReason} Command: ${ffmpegBinary} ${args.join(" ")}`,
        ),
      );
    });
  });
}

function baseClipArgs({
  inputPath,
  startTime,
  duration,
}: RenderClipInput) {
  return [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-ss",
    startTime.toFixed(3),
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-dn",
    "-sn",
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-t",
    duration.toFixed(3),
  ];
}

export async function renderClip(input: RenderClipInput) {
  const ffmpegBinary = resolveFfmpegBinary();
  const { outputPath } = input;

  if (!ffmpegBinary) {
    throw new Error(
      `FFmpeg binary was not found at runtime. Checked FFMPEG_PATH, ${path.join(
        process.cwd(),
        "node_modules",
        "ffmpeg-static",
        "ffmpeg",
      )}, and ffmpeg-static export ${ffmpegStaticPath ?? "null"}.`,
    );
  }

  try {
    mkdirSync(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not create clip output directory: ${error.message}`
        : "Could not create clip output directory.",
    );
  }

  try {
    await runFfmpeg(ffmpegBinary, [
      ...baseClipArgs(input),
      "-c",
      "copy",
      "-avoid_negative_ts",
      "make_zero",
      "-movflags",
      "+faststart",
      outputPath,
    ]);
    return;
  } catch (error) {
    console.warn("[ffmpeg] fast stream copy failed; falling back to transcode", error);
  }

  await runFfmpeg(ffmpegBinary, [
    ...baseClipArgs(input),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-vf",
    "scale='min(1080,iw)':-2",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "23",
    "-maxrate",
    "6M",
    "-bufsize",
    "12M",
    "-threads",
    "1",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}
