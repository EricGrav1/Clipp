import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { getSocialConnections, SOCIAL_PLATFORMS } from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await requireUserAccount();
    const connections = await getSocialConnections(account);

    return NextResponse.json({
      connections,
      platforms: SOCIAL_PLATFORMS,
    });
  } catch (error) {
    return jsonError(error);
  }
}
