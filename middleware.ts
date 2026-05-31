import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  getClerkEnvironmentIssue,
  hasValidClerkEnvironment,
} from "@/lib/env";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/account(.*)",
  "/onboarding(.*)",
  "/schedule(.*)",
  "/projects(.*)",
]);

function missingClerkMiddleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && isProtectedRoute(request)) {
    return NextResponse.redirect(new URL("/?auth=configuration", request.url));
  }

  return NextResponse.next();
}

const protectedClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!hasValidClerkEnvironment()) {
    return missingClerkMiddleware(request);
  }

  try {
    return await protectedClerkMiddleware(request, event);
  } catch (error) {
    console.error("Clerk middleware failed", {
      issue: getClerkEnvironmentIssue() ?? "Clerk rejected the configured keys.",
      message: error instanceof Error ? error.message : "Unknown Clerk error",
    });

    return missingClerkMiddleware(request);
  }
}

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
