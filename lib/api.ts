import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/validation";

export function jsonError(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error && error.name === "StripeConnectionError") {
    console.error("Stripe connection failed", {
      message: error.message,
      name: error.name,
    });

    return NextResponse.json(
      {
        error:
          "Stripe could not be reached from the server. Try again in a minute.",
      },
      { status: 502 },
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
