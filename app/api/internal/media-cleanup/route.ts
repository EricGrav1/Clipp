import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { cleanupExpiredMedia } from "@/lib/media-retention";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertAuthorized(request: Request) {
  const secrets = [
    process.env.MEDIA_CLEANUP_SECRET,
    process.env.RENDER_WORKER_SECRET,
    process.env.CRON_SECRET,
  ].filter((secret): secret is string => Boolean(secret));

  if (secrets.length === 0) {
    return;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const workerSecret = request.headers.get("x-render-worker-secret");
  const presentedSecrets = [workerSecret, bearerToken].filter(
    (secret): secret is string => Boolean(secret),
  );

  if (!presentedSecrets.some((secret) => secrets.includes(secret))) {
    throw new ValidationError("Unauthorized media cleanup.", 401);
  }
}

async function runCleanup(request: Request) {
  assertAuthorized(request);

  const result = await cleanupExpiredMedia();

  return NextResponse.json({ ok: true, result });
}

export async function GET(request: Request) {
  try {
    return await runCleanup(request);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    return await runCleanup(request);
  } catch (error) {
    return jsonError(error);
  }
}
