import { redirect } from "next/navigation";
import { getSignedMediaUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ objectKey: string[] }> },
) {
  const { objectKey } = await params;
  redirect(await getSignedMediaUrl(objectKey.join("/")));
}
