import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { processRenderJob } from "@/lib/render-jobs";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const secret = process.env.RENDER_WORKER_SECRET;
    if (secret && request.headers.get("x-render-worker-secret") !== secret) {
      throw new ValidationError("Unauthorized render worker.", 401);
    }

    const { jobId } = await params;
    const job = await processRenderJob(jobId);

    return NextResponse.json({ job });
  } catch (error) {
    return jsonError(error);
  }
}
