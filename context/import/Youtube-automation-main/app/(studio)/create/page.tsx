"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SectionLabel } from "@/components/studio/section-label";
import { SetupBanner } from "@/components/studio/setup-banner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SetupStatus } from "@/lib/types";

const PLACEHOLDER =
  "Example: The submarine vote that almost ended the Cold War in 13 minutes…";

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setup, setSetup] = useState<SetupStatus | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/setup");
      const data = (await res.json()) as { status: SetupStatus };
      setSetup(data.status);
    })();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) {
      toast.error("Write a short idea first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as {
        episode?: { id: string };
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create episode.");
      }

      const episodeId = data.episode!.id;

      if (setup?.readyToGenerate) {
        const produceRes = await fetch("/api/produce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId, action: "start" }),
        });
        const produceData = (await produceRes.json()) as { error?: string };
        if (!produceRes.ok) {
          toast.error(
            produceData.error ??
              "Episode saved, but generate could not start. Open the episode to retry.",
          );
        } else {
          toast.success("Generating on this page…");
        }
      } else {
        toast.message(
          "Episode saved. Finish Setup (ElevenLabs + Kling + ffmpeg), then Generate.",
        );
      }

      setPrompt("");
      router.push(`/library/${episodeId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <SetupBanner />

      <div className="space-y-2">
        <SectionLabel>Create</SectionLabel>
        <h1 className="font-heading text-3xl tracking-tight text-foreground md:text-4xl">
          Generate a Short
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Type a near-miss history idea. With ElevenLabs + Kling keys on Setup,
          this page creates the episode and starts rendering automatically.
        </p>
      </div>

      <form onSubmit={onSubmit} className="portal-surface space-y-4 p-5 md:p-6">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={PLACEHOLDER}
            className="min-h-36"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="cta"
            size="lg"
            disabled={submitting}
            className="min-w-40"
          >
            {submitting
              ? "Working…"
              : setup?.readyToGenerate
                ? "Generate short"
                : "Save & continue"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {setup?.readyToGenerate
              ? "Narrated multi-scene Short builds on the Library episode page."
              : "Finish Setup (ElevenLabs + Kling + ffmpeg), then Generate."}
          </p>
        </div>
      </form>
    </div>
  );
}
