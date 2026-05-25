const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);
const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm"]);

export class ValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function assertProjectName(value: unknown) {
  if (typeof value !== "string") {
    throw new ValidationError("Project name is required.");
  }

  const name = value.trim();
  if (name.length < 1 || name.length > 80) {
    throw new ValidationError("Project name must be 1-80 characters.");
  }

  return name;
}

export function assertClipTitle(value: unknown) {
  if (typeof value !== "string") {
    throw new ValidationError("Clip title is required.");
  }

  const title = value.trim();
  if (title.length < 1 || title.length > 80) {
    throw new ValidationError("Clip title must be 1-80 characters.");
  }

  return title;
}

export function assertFiniteSeconds(value: unknown, label: string) {
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new ValidationError(`${label} must be a positive number.`);
  }

  return seconds;
}

export function assertClipDuration(value: unknown, videoDuration: number) {
  const duration = assertFiniteSeconds(value, "Clip duration");
  if (duration < 1) {
    throw new ValidationError("Clip duration must be at least 1 second.");
  }

  if (duration > videoDuration) {
    throw new ValidationError("Clip duration cannot exceed the video duration.");
  }

  return duration;
}

export function assertVideoFile(file: File | null) {
  if (!file) {
    throw new ValidationError("Video file is required.");
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (
    !ALLOWED_VIDEO_MIME_TYPES.has(file.type) ||
    !ALLOWED_VIDEO_EXTENSIONS.has(extension)
  ) {
    throw new ValidationError("Upload an mp4, mov, or webm video.");
  }

  const maxSizeBytes = 1024 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxSizeBytes) {
    throw new ValidationError("Video must be between 1 byte and 1 GB.");
  }

  return file;
}

export function getVideoExtension(fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    throw new ValidationError("Unsupported video extension.");
  }

  return extension;
}
