"use client";

import { Film, FolderPlus, Scissors, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-paper/62">
              <Scissors className="h-3.5 w-3.5 text-mint" />
              Clipper Studio
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-paper sm:text-6xl">
              Projects built for fast clip extraction.
            </h1>
          </div>
          <div className="w-full max-w-xl rounded-lg border border-white/10 bg-ink/80 p-3 shadow-panel backdrop-blur">
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
            {error ? <p className="mt-2 text-sm text-[#ffaaa6]">{error}</p> : null}
          </div>
        </header>

        {projects.length === 0 ? (
          <section className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-white/14 bg-white/[0.04] text-center">
            <div className="max-w-md px-6">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-brass" />
              <h2 className="text-2xl font-semibold text-paper">
                Start with a project.
              </h2>
              <p className="mt-2 text-sm leading-6 text-paper/58">
                Upload one source video, pick precise durations, and render clips
                into a reusable project workspace.
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-lg border border-white/10 bg-white/[0.055] p-4 transition hover:border-mint/45 hover:bg-white/[0.075]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-paper">
                      {project.name}
                    </h2>
                    <p className="mt-1 truncate text-sm text-paper/50">
                      {project.video?.originalName ?? "No video uploaded"}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-ink">
                    <Film className="h-5 w-5 text-mint" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <Badge tone={project.video ? "success" : "neutral"}>
                    {project.video ? "Video ready" : "Empty"}
                  </Badge>
                  <span className="text-sm text-paper/58">
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
