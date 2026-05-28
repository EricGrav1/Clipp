"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import { CreditCard, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

async function readJsonPayload(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<{ error?: string; url?: string }>;
  }

  const text = await response.text().catch(() => "");
  throw new Error(text.includes("<!DOCTYPE") ? fallback : text || fallback);
}

export function CheckoutStart({ interval }: { interval: "monthly" | "yearly" }) {
  const isClerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (isClerkEnabled) {
    return <ClerkCheckoutStart interval={interval} />;
  }

  return <CheckoutRedirector interval={interval} />;
}

function ClerkCheckoutStart({ interval }: { interval: "monthly" | "yearly" }) {
  const { isLoaded, isSignedIn } = useUser();
  const checkoutPath = `/checkout?interval=${interval}`;

  if (!isLoaded) {
    return <CheckoutShell detail="Checking your account..." />;
  }

  if (!isSignedIn) {
    return (
      <CheckoutShell
        action={
          <SignUpButton
            fallbackRedirectUrl={checkoutPath}
            forceRedirectUrl={checkoutPath}
            mode="modal"
            signInFallbackRedirectUrl={checkoutPath}
            signInForceRedirectUrl={checkoutPath}
          >
            <Button variant="primary">
              <CreditCard className="h-4 w-4" />
              Create account
            </Button>
          </SignUpButton>
        }
        detail="Create your account first, then checkout will open automatically."
        showSpinner={false}
        title="Create your Clip Farmer account."
      />
    );
  }

  return <CheckoutRedirector interval={interval} />;
}

function CheckoutRedirector({ interval }: { interval: "monthly" | "yearly" }) {
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    async function startCheckout() {
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
          caughtError instanceof Error
            ? caughtError.message
            : "Could not start checkout.",
        );
      }
    }

    void startCheckout();
  }, [interval]);

  const planLabel = useMemo(
    () => (interval === "yearly" ? "yearly" : "monthly"),
    [interval],
  );

  return (
    <CheckoutShell
      action={
        error ? (
          <Button onClick={() => window.location.reload()} variant="primary">
            Try again
          </Button>
        ) : null
      }
      detail={
        error ||
        `Opening Stripe Checkout for the ${planLabel} Clip Farmer plan...`
      }
      showSpinner={!error}
      title={error ? "Checkout needs attention." : "Taking you to checkout."}
    />
  );
}

function CheckoutShell({
  action,
  detail,
  showSpinner = true,
  title = "Taking you to checkout.",
}: {
  action?: ReactNode;
  detail: string;
  showSpinner?: boolean;
  title?: string;
}) {
  return (
    <section className="w-full max-w-xl rounded-[1.5rem] border border-border bg-card p-8 shadow-panel">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
        Checkout
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="mt-4 leading-7 text-muted-foreground">{detail}</p>
      <div className="mt-6 flex items-center gap-3">
        {showSpinner ? (
          <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : null}
        {action}
      </div>
    </section>
  );
}
