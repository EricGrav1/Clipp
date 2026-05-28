"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const heardFromOptions = [
  "TikTok",
  "Instagram",
  "YouTube",
  "X / Twitter",
  "Podcast",
  "Friend or community",
  "Search",
  "Other",
];

const creatorTypes = [
  "Content creator",
  "Podcaster",
  "Coach or consultant",
  "Course creator",
  "Agency or marketer",
  "Founder or business owner",
  "Other",
];

const contentSources = [
  "Podcast episodes",
  "Live streams",
  "Zoom calls or interviews",
  "Long-form YouTube videos",
  "Webinars",
  "Coaching or sales calls",
  "Other",
];

const primaryGoals = [
  "Grow my audience",
  "Save editing time",
  "Post more consistently",
  "Repurpose client content",
  "Generate more leads",
  "Test short-form content",
];

const platforms = ["TikTok", "Instagram", "YouTube Shorts", "Facebook", "LinkedIn", "X"];
const teamSizes = ["Just me", "2-3 people", "4-10 people", "10+ people"];

export function OnboardingForm() {
  const router = useRouter();
  const [heardFrom, setHeardFrom] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [contentSource, setContentSource] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [postingPlatforms, setPostingPlatforms] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("Just me");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePlatform(platform: string) {
    setPostingPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  async function submitOnboarding() {
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heardFrom,
          creatorType,
          contentSource,
          primaryGoal,
          postingPlatforms,
          teamSize,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save onboarding.");
      }

      router.push("/app");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not save onboarding.",
      );
      setIsSaving(false);
    }
  }

  return (
    <section className="w-full max-w-5xl rounded-[1.5rem] border border-border bg-card p-6 shadow-panel sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            First harvest
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Tell us what you are growing.
          </h1>
          <p className="mt-4 max-w-md leading-7 text-muted-foreground">
            These answers help shape the workspace, examples, and scheduling
            defaults around the way you create.
          </p>
        </div>

        <div className="grid gap-5">
          <SelectField
            label="How did you hear about Clip Farmer?"
            onChange={setHeardFrom}
            options={heardFromOptions}
            value={heardFrom}
          />
          <SelectField
            label="What do you do?"
            onChange={setCreatorType}
            options={creatorTypes}
            value={creatorType}
          />
          <SelectField
            label="What content will you harvest most often?"
            onChange={setContentSource}
            options={contentSources}
            value={contentSource}
          />
          <SelectField
            label="What is your main goal right now?"
            onChange={setPrimaryGoal}
            options={primaryGoals}
            value={primaryGoal}
          />

          <div>
            <p className="mb-2 text-sm font-extrabold text-foreground">
              Which platforms do you care about most?
            </p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const selected = postingPlatforms.includes(platform);

                return (
                  <button
                    className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${
                      selected
                        ? "border-primary bg-primary/16 text-foreground"
                        : "border-border bg-card-2 text-muted-foreground hover:border-primary/50"
                    }`}
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    type="button"
                  >
                    {selected ? <Check className="h-4 w-4" /> : null}
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <SelectField
            label="Team size"
            onChange={setTeamSize}
            options={teamSizes}
            value={teamSize}
          />

          {error ? (
            <p className="font-mono text-sm text-destructive">{error}</p>
          ) : null}

          <Button disabled={isSaving} onClick={submitOnboarding} variant="primary">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Open workspace
          </Button>
        </div>
      </div>
    </section>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-foreground">{label}</span>
      <select
        className="h-11 w-full rounded-xl border border-border bg-card-2 px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
