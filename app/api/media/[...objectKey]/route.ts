import { redirect } from "next/navigation";
import { getSignedMediaUrl, getStoredMediaObject } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ objectKey: string[] }> },
) {
  const { objectKey } = await params;
  const key = objectKey.join("/");
  const requestUrl = new URL(request.url);

  if (requestUrl.searchParams.get("download") !== "1") {
    redirect(await getSignedMediaUrl(key));
  }

  const object = await getStoredMediaObject(key);

  if (!object?.Body) {
    return new Response("Media not found.", { status: 404 });
  }

  const fileName = key.split("/").pop() || "clip.mp4";
  const headers = new Headers({
    "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
    "Content-Type": object.ContentType ?? "application/octet-stream",
  });

  if (object.ContentLength) {
    headers.set("Content-Length", String(object.ContentLength));
  }

  return new Response(object.Body.transformToWebStream() as BodyInit, {
    headers,
  });
}
