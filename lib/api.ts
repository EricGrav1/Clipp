import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/validation";

export function jsonError(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}
