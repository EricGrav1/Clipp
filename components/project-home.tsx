"use client";

import { Film, FolderPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type ProjectCard = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  video: { originalName: string; url: string } | null;
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
          name: name.trim() || `Project ${projects.length + 1}`,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create project.");
      }

      router.push(`/projects/${payload.project.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create project.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Edit-bay top rail */}
        <div className="flex animate-fade-in items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-2.5 w-2.5 animate-rec-pulse place-items-center rounded-full bg-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.32em] text-foreground/80">
              Clipper Studio
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              / Edit Bay
            </span>
          </div>
          <ThemeToggle />
        </div>

        <header className="flex animate-fade-in-up flex-col gap-7 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">
              [ Projects ]
            </p>
            <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl">
              Cut the take.
              <br />
              <span className="text-primary">Render</span> the clip.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              One source video per project. Mark a precise in-point, set a
              duration, and render. No timelines to babysit.
            </p>
          </div>
          <div className="w-full max-w-md rounded-lg border border-border bg-card/80 p-3 shadow-panel backdrop-blur reg-frame relative">
            <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              New project
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Project name"
                placeholder="Untitled reel"
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
                <FolderPlus className="h-4 w-4" />
                {isCreating ? "Creating" : "Create"}
              </Button>
            </div>
            {error ? (
              <p className="mt-2 animate-fade-in font-mono text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </header>

        {projects.length === 0 ? (
          <section className="reg-frame relative grid min-h-[420px] animate-fade-in place-items-center rounded-lg border border-dashed border-border bg-card/40 text-center">
            <div className="max-w-md px-6">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg border border-primary/30 bg-brand-soft shadow-lamp">
                <Film className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                No reels yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Spin up a project, drop in a source video, and start pulling
                clips into a reusable workspace.
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                className="group relative animate-fade-in-up overflow-hidden rounded-lg border border-border bg-card p-4 transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
              >
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Reel {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="truncate font-display text-lg font-bold uppercase tracking-tight text-foreground">
                      {project.name}
                    </h2>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {project.video?.originalName ?? "— no source —"}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-card-2 transition group-hover:border-primary/50">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                  <Badge tone={project.video ? "success" : "neutral"}>
                    {project.video ? "Loaded" : "Empty"}
                  </Badge>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {String(project._count.clips).padStart(2, "0")} clips
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
