"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import { CreditCard, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isClerkPublishableKey } from "@/lib/env";

async function readJsonPayload(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<{ error?: string; url?: string }>;
  }

  const text = await response.text().catch(() => "");

  if (text.includes("<!DOCTYPE")) {
    throw new Error(fallback);
  }

  throw new Error(text || fallback);
}

export function CheckoutButton({
  children = "Start subscription",
  className,
  interval = "monthly",
}: {
  children?: ReactNode;
  className?: string;
  interval?: "monthly" | "yearly";
}) {
  const isClerkEnabled = isClerkPublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  if (isClerkEnabled) {
    return (
      <ClerkCheckoutButton className={className} interval={interval}>
        {children}
      </ClerkCheckoutButton>
    );
  }

  return (
    <DirectCheckoutButton className={className} interval={interval}>
      {children}
    </DirectCheckoutButton>
  );
}

function ClerkCheckoutButton({
  children,
  className,
  interval,
}: {
  children: ReactNode;
  className?: string;
  interval: "monthly" | "yearly";
}) {
  const { isLoaded, isSignedIn } = useUser();
  const checkoutPath = `/checkout?interval=${interval}`;

  if (!isLoaded) {
    return (
      <div className={className}>
        <Button disabled variant="primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </Button>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={className}>
        <SignUpButton
          fallbackRedirectUrl={checkoutPath}
          forceRedirectUrl={checkoutPath}
          mode="modal"
          signInFallbackRedirectUrl={checkoutPath}
          signInForceRedirectUrl={checkoutPath}
        >
          <Button variant="primary">
            <CreditCard className="h-4 w-4" />
            {children}
          </Button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <DirectCheckoutButton className={className} interval={interval}>
      {children}
    </DirectCheckoutButton>
  );
}

function DirectCheckoutButton({
  children,
  className,
  interval,
}: {
  children: ReactNode;
  className?: string;
  interval: "monthly" | "yearly";
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const payload = await readJsonPayload(
        response,
        "Checkout hit a server error. Refresh and try again.",
      );

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Could not start checkout.");
      }

      window.location.href = payload.url;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not start checkout.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button disabled={isLoading} onClick={startCheckout} variant="primary">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        {children}
      </Button>
      {error ? (
        <p className="mt-2 max-w-sm font-mono text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await readJsonPayload(
        response,
        "Billing hit a server error. Refresh and try again.",
      );

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Could not open billing portal.");
      }

      window.location.href = payload.url;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not open billing portal.",
      );
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button disabled={isLoading} onClick={openPortal} variant="secondary">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Manage billing
      </Button>
      {error ? (
        <p className="mt-2 max-w-sm font-mono text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
