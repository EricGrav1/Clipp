import { redirect } from "next/navigation";
import { mediaObjectIsAvailable } from "@/lib/media-retention";
import { getSignedMediaUrl } from "@/lib/storage";

function safeDownloadFileName(value: string | null, fallback: string) {
  const candidate = (value || fallback).replace(/[\\/:"*?<>|]+/g, "-").trim();

  return candidate || fallback;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ objectKey: string[] }> },
) {
  const { objectKey } = await params;
  const key = objectKey.join("/");
  const requestUrl = new URL(request.url);
  const fileName = key.split("/").pop() || "clip.mp4";

  if (!(await mediaObjectIsAvailable(key))) {
    return new Response("Temporary media has expired.", { status: 410 });
  }

  redirect(
    await getSignedMediaUrl(
      key,
      requestUrl.searchParams.get("download") === "1"
        ? {
            downloadFileName: safeDownloadFileName(
              requestUrl.searchParams.get("filename"),
              fileName,
            ),
          }
        : undefined,
    ),
  );
}
