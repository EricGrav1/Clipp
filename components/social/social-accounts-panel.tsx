"use client";

import { CalendarPlus, Download, ExternalLink, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PLANNED_CHANNELS = ["TikTok", "Instagram", "YouTube", "LinkedIn"];

export function SocialAccountsPanel() {
  return (
    <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-6 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <Sprout className="h-3.5 w-3.5" />
            Social rows
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight">
            Direct publishing is parked for now
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Ayrshare pricing does not make sense at this stage, so Clip Farmer
            is focused on reliable clipping, downloads, and manual posting until
            the product is profitable.
          </p>
        </div>
        <Badge tone="warning">planned</Badge>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-xl border border-border bg-card-2 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Manual posting workflow
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Harvest", "Create a ready clip from the timestamp you choose."],
              ["Prepare", "Copy your caption and download the MP4 export."],
              ["Post", "Upload directly inside the social platform."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-3"
              >
                <Download className="mb-2 h-4 w-4 text-primary" />
                <p className="font-display text-base font-bold text-foreground">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card-2 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Later publishing targets
          </p>
          <div className="flex flex-wrap gap-2">
            {PLANNED_CHANNELS.map((channel) => (
              <span
                key={channel}
                className="inline-flex h-8 items-center rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary"
              >
                {channel}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            When direct publishing returns, this is where channel authorization,
            scheduling, and publishing status will live.
          </p>
          <Button asChild className="mt-3" size="sm" variant="secondary">
            <a
              href="https://www.tiktok.com/upload"
              rel="noreferrer"
              target="_blank"
            >
              <CalendarPlus className="h-4 w-4" />
              Open TikTok upload
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
