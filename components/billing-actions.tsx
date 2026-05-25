"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  children = "Start subscription",
  className,
  interval = "monthly",
}: {
  children?: string;
  className?: string;
  interval?: "monthly" | "yearly";
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
      const payload = await response.json();

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
      const payload = await response.json();

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
