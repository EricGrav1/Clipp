import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/account(.*)",
  "/schedule(.*)",
  "/projects(.*)",
  "/api/projects(.*)",
  "/api/clips(.*)",
  "/api/billing/checkout(.*)",
  "/api/billing/portal(.*)",
  "/api/scheduled-posts(.*)",
  "/api/social/accounts(.*)",
  "/api/social/connect(.*)",
]);

const middleware = isClerkConfigured
  ? clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
})
  : function localDevMiddleware() {
      return NextResponse.next();
    };

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
