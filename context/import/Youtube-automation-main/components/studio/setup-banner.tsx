"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Settings } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { SetupStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/setup");
        const data = (await res.json()) as { status: SetupStatus };
        setStatus(data.status);
      } catch {
        setStatus(null);
      }
    })();
  }, []);

  if (!status) return null;

  if (status.readyToGenerate) {
    return (
      <div className="portal-surface flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-muted-foreground">
          ElevenLabs + Kling + ffmpeg ready — Generate builds narrated Shorts.
          {!status.readyToPublishYoutube
            ? " YouTube publish is optional."
            : " YouTube publish is ready too."}
        </p>
        <Link
          href="/setup"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1")}
        >
          <Settings className="size-3.5" />
          Setup
        </Link>
      </div>
    );
  }

  const missing: string[] = [];
  if (!status.elevenLabs.ready) missing.push("ElevenLabs");
  if (!status.kling.ready) missing.push("Kling");
  if (!status.ffmpeg.ready) missing.push("ffmpeg");

  return (
    <div className="rounded-cta border border-primary/30 bg-accent px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Missing: {missing.join(" + ") || "setup"}
          </p>
          <p className="text-sm text-muted-foreground">
            Voiceover needs{" "}
            <a
              href={status.elevenLabs.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ElevenLabs
            </a>
            . Visuals need the{" "}
            <a
              href={status.kling.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Kling Open Platform
            </a>
            . Assembly needs ffmpeg on your PATH.
          </p>
        </div>
        <Link
          href="/setup"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "rounded-cta",
          )}
        >
          Open Setup
        </Link>
      </div>
    </div>
  );
}
