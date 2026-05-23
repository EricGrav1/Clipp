"use client";

import { Film, FolderPlus, Scissors, Sparkles } from "lucide-react";
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
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <header className="flex animate-fade-in-up flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Scissors className="h-3.5 w-3.5 text-primary" />
              Clipper Studio
            </div>
            <h1 className="max-w-3xl bg-gradient-to-br from-foreground to-foreground/55 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
              Projects built for fast clip extraction.
            </h1>
          </div>
          <div className="w-full max-w-xl rounded-xl border border-border bg-card/80 p-3 shadow-panel backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                aria-label="Project name"
                placeholder="Project name"
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
                {isCreating ? "Creating" : "New Project"}
              </Button>
            </div>
            {error ? (
              <p className="mt-2 animate-fade-in text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </header>

        {projects.length === 0 ? (
          <section className="grid min-h-[420px] animate-fade-in place-items-center rounded-xl border border-dashed border-border bg-card/50 text-center">
            <div className="max-w-md px-6">
              <div className="mx-auto mb-4 grid h-16 w-16 animate-float place-items-center rounded-2xl bg-brand-soft">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Start with a project.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Upload one source video, pick precise durations, and render clips
                into a reusable project workspace.
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
                className="group animate-fade-in-up rounded-xl border border-border bg-card p-4 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-foreground">
                      {project.name}
                    </h2>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {project.video?.originalName ?? "No video uploaded"}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-card-2 transition group-hover:border-primary/40">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Badge tone={project.video ? "success" : "neutral"}>
                    {project.video ? "Video ready" : "Empty"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {project._count.clips} clips
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
