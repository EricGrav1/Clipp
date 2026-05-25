"use client";

import {
  ExternalLink,
  Loader2,
  PlugZap,
  RefreshCw,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SocialConnectionDTO } from "@/lib/social";

const PLATFORM_LABELS: Record<string, string> = {
  bluesky: "Bluesky",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  reddit: "Reddit",
  threads: "Threads",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};

export function SocialAccountsPanel({
  initialConnections,
}: {
  initialConnections: SocialConnectionDTO[];
}) {
  const [connections, setConnections] = useState(initialConnections);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const primaryConnection = connections[0] ?? null;
  const platforms = primaryConnection?.connectedPlatforms ?? [];

  async function refreshAccounts() {
    setError("");
    setMessage("");
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/social/accounts");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not refresh social accounts.");
      }

      setConnections(payload.connections ?? []);
      setMessage("Social accounts refreshed.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not refresh social accounts.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function connectAccounts() {
    setError("");
    setMessage("");
    setIsConnecting(true);

    try {
      const response = await fetch("/api/social/connect", { method: "POST" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start social connection.");
      }

      if (payload.connection) {
        setConnections([payload.connection]);
      }

      if (typeof payload.url === "string") {
        if (payload.url.startsWith("/")) {
          setMessage("Demo social accounts connected for local development.");
          await refreshAccounts();
          return;
        }

        window.open(payload.url, "_blank", "noopener,noreferrer");
        setMessage("Finish connecting accounts in the new tab, then refresh this panel.");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not start social connection.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("social")) {
      refreshAccounts();
    }
  }, []);

  return (
    <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-6 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <Sprout className="h-3.5 w-3.5" />
            Social rows
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Connected channels
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Link the channels Clip Farmer can schedule harvested clips to. Posting
            happens through a provider-managed authorization page.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={isRefreshing}
            onClick={refreshAccounts}
            variant="secondary"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            disabled={isConnecting}
            onClick={connectAccounts}
            variant="primary"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="h-4 w-4" />
            )}
            Connect Social Accounts
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-card-2 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Ayrshare profile
          </p>
          <Badge tone={platforms.length > 0 ? "success" : "neutral"}>
            {platforms.length > 0 ? "connected" : "not linked"}
          </Badge>
        </div>

        {platforms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex h-8 items-center rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary"
              >
                {PLATFORM_LABELS[platform] ?? platform}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">
              No social accounts connected yet.
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Connect accounts here first, then schedule from any ready clip in a
              project.
            </p>
          </div>
        )}

        {primaryConnection?.isConfigured === false ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            Local demo mode is active until Ayrshare environment variables are set.
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs font-semibold text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}
