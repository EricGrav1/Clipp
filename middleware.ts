import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isPrintableAscii(value: string) {
  return /^[\x20-\x7E]+$/.test(value);
}

function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();

  return Boolean(
    publishableKey?.startsWith("pk_") &&
      secretKey?.startsWith("sk_") &&
      isPrintableAscii(publishableKey) &&
      isPrintableAscii(secretKey),
  );
}

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/account(.*)",
  "/onboarding(.*)",
  "/schedule(.*)",
  "/projects(.*)",
]);

const middleware = isClerkConfigured()
  ? clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    })
  : function missingClerkMiddleware(request: NextRequest) {
      if (process.env.NODE_ENV === "production" && isProtectedRoute(request)) {
        return NextResponse.redirect(new URL("/?auth=configuration", request.url));
      }

      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
