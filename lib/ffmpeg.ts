import { spawn } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import ffmpegStaticPath from "ffmpeg-static";

type RenderClipInput = {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
  watermark?: {
    enabled: boolean;
    text: string;
  };
};

type RenderClipResult = {
  previewReady: boolean;
  warning: string | null;
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

function resolveFfprobeBinary(ffmpegBinary: string) {
  const candidates = [
    process.env.FFPROBE_PATH,
    path.join(path.dirname(ffmpegBinary), "ffprobe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
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

type SourceCodecs = {
  audioCodec: string | null;
  videoCodec: string | null;
};

function probeSourceCodecs(ffprobeBinary: string, inputPath: string) {
  return new Promise<SourceCodecs>((resolve, reject) => {
    const ffprobe = spawn(ffprobeBinary, [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_type,codec_name",
      "-of",
      "json",
      inputPath,
    ]);

    let output = "";
    let probeError = "";

    ffprobe.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    ffprobe.stderr.on("data", (chunk) => {
      probeError += chunk.toString();
    });
    ffprobe.on("error", reject);
    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(probeError.trim() || `ffprobe exited with code ${code}.`));
        return;
      }

      try {
        const payload = JSON.parse(output) as {
          streams?: Array<{ codec_name?: string; codec_type?: string }>;
        };
        const streams = payload.streams ?? [];

        resolve({
          audioCodec:
            streams.find((stream) => stream.codec_type === "audio")?.codec_name ??
            null,
          videoCodec:
            streams.find((stream) => stream.codec_type === "video")?.codec_name ??
            null,
        });
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Could not parse ffprobe codec output."),
        );
      }
    });
  });
}

function canStreamCopyForBrowserPreview(codecs: SourceCodecs) {
  return codecs.videoCodec === "h264" && (!codecs.audioCodec || codecs.audioCodec === "aac");
}

function transcodeThreadCount() {
  const configuredThreads = Number(process.env.FFMPEG_THREADS);

  if (Number.isInteger(configuredThreads) && configuredThreads >= 0) {
    return String(configuredThreads);
  }

  return "0";
}

function escapeDrawtextText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\s+/g, " ")
    .trim();
}

function videoFilter(input: RenderClipInput) {
  const filters = ["scale='min(1080,iw)':-2"];

  if (input.watermark?.enabled) {
    const text = escapeDrawtextText(input.watermark.text) || "Clip Farmer";
    filters.push(
      [
        `drawtext=text='${text}'`,
        "x=w-tw-24",
        "y=h-th-24",
        "fontsize=h/36",
        "fontcolor=white@0.82",
        "box=1",
        "boxcolor=black@0.38",
        "boxborderw=12",
      ].join(":"),
    );
  }

  return filters.join(",");
}

function fastCopyArgs(input: RenderClipInput) {
  return [
    ...baseClipArgs(input),
    "-c",
    "copy",
    "-avoid_negative_ts",
    "make_zero",
    "-movflags",
    "+faststart",
    input.outputPath,
  ];
}

function transcodeArgs(input: RenderClipInput) {
  return [
    ...baseClipArgs(input),
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-vf",
    videoFilter(input),
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "23",
    "-maxrate",
    "6M",
    "-bufsize",
    "12M",
    "-threads",
    transcodeThreadCount(),
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    input.outputPath,
  ];
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

export async function renderClip(input: RenderClipInput): Promise<RenderClipResult> {
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

  const ffprobeBinary = resolveFfprobeBinary(ffmpegBinary);

  try {
    mkdirSync(path.dirname(outputPath), { recursive: true });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not create clip output directory: ${error.message}`
        : "Could not create clip output directory.",
    );
  }

  if (input.watermark?.enabled) {
    await runFfmpeg(ffmpegBinary, transcodeArgs(input));
    return { previewReady: true, warning: null };
  }

  if (ffprobeBinary) {
    const codecs = await probeSourceCodecs(ffprobeBinary, input.inputPath).catch((error) => {
      console.warn("[ffmpeg] source codec probe failed; falling back to transcode", error);
      return null;
    });

    if (codecs && canStreamCopyForBrowserPreview(codecs)) {
      try {
        await runFfmpeg(ffmpegBinary, fastCopyArgs(input));
        return { previewReady: true, warning: null };
      } catch (error) {
        console.warn("[ffmpeg] fast stream copy failed; falling back to transcode", error);
      }
    }
  }

  try {
    await runFfmpeg(ffmpegBinary, transcodeArgs(input));
    return { previewReady: true, warning: null };
  } catch (transcodeError) {
    console.warn("[ffmpeg] browser-safe transcode failed; trying downloadable fast copy", transcodeError);

    await runFfmpeg(ffmpegBinary, fastCopyArgs(input));
    return {
      previewReady: false,
      warning:
        "Preview unavailable for this source codec. Download the harvested clip instead.",
    };
  }
}
