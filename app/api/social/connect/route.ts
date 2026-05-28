import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { createSocialConnectUrl, toSocialConnectionDTO } from "@/lib/social";

export const runtime = "nodejs";

export async function POST() {
  try {
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const { connection, url } = await createSocialConnectUrl(account);

    return NextResponse.json({
      connection: toSocialConnectionDTO(connection),
      url,
    });
  } catch (error) {
    return jsonError(error);
  }
}
