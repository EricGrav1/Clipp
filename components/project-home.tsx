"use client";

import { Film, Sprout, Tractor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BearFarmer } from "@/components/ui/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type ProjectCard = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  video: { originalName: string; url: string | null } | null;
  _count: { clips: number };
};

export function ProjectHome({ projects }: { projects: ProjectCard[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function createProject() {
    setError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || `Field ${projects.length + 1}`,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not plant the field.");
      }

      router.push(`/projects/${payload.project.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not plant the field.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Top rail — wordmark + mascot */}
        <div className="flex animate-fade-in items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BearFarmer size={40} className="animate-bob" />
            <div className="leading-none">
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Clip Farmer
              </span>
              <span className="block text-[11px] font-semibold text-muted-foreground">
                plant a video, harvest the clips
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/account">Account</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Hero */}
        <header className="flex animate-fade-in-up flex-col gap-7 border-b border-border pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Sprout className="h-3.5 w-3.5" />
              The fields
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
              Plant a video.
              <br />
              <span className="text-primary">Harvest</span> the{" "}
              <span className="text-accent">clips</span>.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
              One source video per field. Mark where to start, pick how long, and
              Barnaby pulls a fresh clip — ready to download or share.
            </p>
          </div>

          <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-panel">
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Plant a new field
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Field name"
                placeholder="Name your field…"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createProject();
                  }
                }}
              />
              <Button
                onClick={createProject}
                disabled={isCreating}
                variant="primary"
                className="shrink-0"
              >
                <Sprout className="h-4 w-4" />
                {isCreating ? "Planting" : "Plant"}
              </Button>
            </div>
            {error ? (
              <p className="mt-2 animate-fade-in text-xs font-semibold text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </header>

        {projects.length === 0 ? (
          <section className="grid min-h-[420px] animate-fade-in place-items-center rounded-xl border border-dashed border-border bg-card/50 text-center">
            <div className="max-w-md px-6">
              <BearFarmer size={120} className="mx-auto mb-5 animate-bob" />
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                The farm&apos;s quiet for now
              </h2>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                Plant your first field above, drop in a source video, and start
                harvesting clips into a reusable workspace.
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                className="group relative animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Field {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="truncate font-display text-lg font-bold tracking-tight text-foreground">
                      {project.name}
                    </h2>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {project.video?.originalName ?? "— nothing planted yet —"}
                    </p>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-brand-soft transition group-hover:border-primary/50">
                    {project.video?.url ? (
                      <Film className="h-5 w-5 text-primary" />
                    ) : (
                      <Tractor className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                  <Badge tone={project.video?.url ? "success" : "neutral"}>
                    {project.video?.url
                      ? "Growing"
                      : project.video
                        ? "Expired"
                        : "Fallow"}
                  </Badge>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {project._count.clips}{" "}
                    {project._count.clips === 1 ? "clip" : "clips"} harvested
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
