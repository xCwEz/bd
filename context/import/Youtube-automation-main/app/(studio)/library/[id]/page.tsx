"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";

import { SectionLabel } from "@/components/studio/section-label";
import { SetupBanner } from "@/components/studio/setup-banner";
import { StatusBadge } from "@/components/studio/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Episode, SetupStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EpisodeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [setup, setSetup] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/episodes/${params.id}`);
    if (!res.ok) {
      setEpisode(null);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { episode: Episode };
    setEpisode(data.episode);
    setTitle(data.episode.title);
    setCaption(data.episode.caption ?? "");
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    void load();
    void (async () => {
      const res = await fetch("/api/setup");
      const data = (await res.json()) as { status: SetupStatus };
      setSetup(data.status);
    })();
  }, [load]);

  // Keep ticking produce while status is producing
  useEffect(() => {
    if (!episode || episode.status !== "producing") return;

    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/produce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ episodeId: params.id, action: "tick" }),
        });
        const data = (await res.json()) as {
          episode?: Episode;
          error?: string;
        };
        if (!cancelled && data.episode) {
          setEpisode(data.episode);
          if (data.episode.title) setTitle(data.episode.title);
          if (data.episode.caption) setCaption(data.episode.caption);
          if (data.episode.status === "ready") {
            toast.success("Short is ready.");
          }
          if (data.episode.status === "failed") {
            toast.error(data.episode.error ?? "Generation failed.");
          }
        }
      } catch {
        // keep polling
      }
    }

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 3500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [episode?.status, params.id]);

  async function startGenerate() {
    if (!episode) return;
    if (!setup?.readyToGenerate) {
      if (!setup?.elevenLabs.ready) {
        toast.error("Add your ElevenLabs API key on Setup first.");
      } else if (!setup?.kling.ready) {
        toast.error("Add your Kling Access + Secret keys on Setup first.");
      } else {
        toast.error("Install ffmpeg and restart the app before Generate.");
      }
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: episode.id, action: "start" }),
      });
      const data = (await res.json()) as { episode?: Episode; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start.");
      setEpisode(data.episode!);
      toast.success("Generating… stay on this page.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generate failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveMeta() {
    if (!episode) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/episodes/${episode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caption }),
      });
      const data = (await res.json()) as { episode?: Episode; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setEpisode(data.episode!);
      toast.success("Saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEpisode() {
    if (!episode) return;
    const label = episode.title || episode.prompt.slice(0, 40);
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/episodes/${episode.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
      toast.success("Short deleted.");
      router.push("/library");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
      setDeleting(false);
    }
  }

  async function publishYoutube() {
    if (!episode) return;
    if (!setup?.readyToPublishYoutube) {
      toast.error("Add YouTube keys on Setup first (optional).");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/publish/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: episode.id }),
      });
      const data = (await res.json()) as {
        episode?: Episode;
        error?: string;
        videoId?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setEpisode(data.episode!);
      toast.success(
        data.videoId
          ? `Uploaded to YouTube (${data.videoId}).`
          : "YouTube upload finished.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading episode…</p>;
  }

  if (!episode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Episode not found.</p>
        <Link
          href="/library"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "rounded-cta",
          )}
        >
          Back to library
        </Link>
      </div>
    );
  }

  const produceMessage =
    episode.produce?.message ||
    (episode.status === "producing" ? "Working…" : null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SetupBanner />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/library"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1",
          )}
        >
          <ArrowLeft className="size-4" />
          Library
        </Link>
        <StatusBadge status={episode.status} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
          disabled={deleting}
          onClick={() => void deleteEpisode()}
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete
        </Button>
      </div>

      <div className="space-y-2">
        <SectionLabel>Episode</SectionLabel>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          {episode.title || "Untitled short"}
        </h1>
        <p className="text-sm text-muted-foreground">{episode.prompt}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[13.75rem_1fr]">
        {/* Phone Short preview — 220×391 (9:16), not full-column tall */}
        <div className="portal-surface mx-auto w-[220px] shrink-0 overflow-hidden lg:mx-0 lg:sticky lg:top-16">
          <div className="aspect-[9/16] w-full bg-muted">
            {episode.videoUrl ? (
              <video
                key={episode.videoUrl}
                src={episode.videoUrl}
                poster={episode.posterUrl ?? undefined}
                controls
                playsInline
                preload="metadata"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 px-3 py-4 text-center">
                {episode.status === "producing" ? (
                  <>
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-xs font-medium text-foreground">
                      {produceMessage}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Step: {episode.produce?.step ?? "starting"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      No video yet
                      <br />
                      <span className="font-medium text-foreground">
                        {episode.status}
                      </span>
                    </p>
                    {!setup?.readyToGenerate ? (
                      <Link
                        href="/setup"
                        className={cn(
                          buttonVariants({ variant: "default", size: "sm" }),
                          "rounded-cta",
                        )}
                      >
                        Setup
                      </Link>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="portal-surface space-y-3 p-5">
            <SectionLabel>Generate</SectionLabel>
            <p className="text-sm text-muted-foreground">
              Builds a ~45–60s narrated Short: story beats → ElevenLabs
              VO → 5 Kling scenes (image → 2.1 I2V) → ffmpeg mux with captions.
            </p>
            {episode.status === "producing" && produceMessage ? (
              <p className="text-sm font-medium text-foreground">
                {produceMessage}
              </p>
            ) : null}
            {episode.produce?.scenes?.length ? (
              <ol className="space-y-1 text-xs text-muted-foreground">
                {episode.produce.scenes.map((scene) => (
                  <li key={scene.beatId} className="flex gap-2">
                    <span className="w-16 shrink-0 font-semibold text-foreground">
                      {scene.label}
                    </span>
                    <span className="capitalize">{scene.status}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            {episode.error ? (
              <p className="text-sm text-destructive">{episode.error}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="cta"
                disabled={
                  generating ||
                  episode.status === "producing" ||
                  !setup?.readyToGenerate
                }
                onClick={() => void startGenerate()}
              >
                <Sparkles />
                {episode.status === "ready" || episode.status === "published"
                  ? "Regenerate"
                  : "Generate"}
              </Button>
              {episode.status === "failed" ? (
                <Button
                  variant="ctaSoft"
                  disabled={generating || !setup?.readyToGenerate}
                  onClick={() => void startGenerate()}
                >
                  <RefreshCw />
                  Retry
                </Button>
              ) : null}
            </div>
          </div>

          {episode.script?.beats?.length ? (
            <div className="portal-surface space-y-3 p-5">
              <SectionLabel>Script</SectionLabel>
              <p className="text-xs text-muted-foreground">
                Template “History’s almosts” narration (no LLM key).
              </p>
              <div className="space-y-3">
                {episode.script.beats.map((beat) => (
                  <div key={beat.id} className="space-y-1">
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                      {beat.label}
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {beat.narration}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="portal-surface space-y-3 p-5">
            <SectionLabel>Details</SectionLabel>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="caption">
                Caption
              </label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            <Button variant="ctaSoft" onClick={() => void saveMeta()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {episode.hashtags.length ? (
              <p className="text-xs text-muted-foreground">
                {episode.hashtags.join(" ")}
              </p>
            ) : null}
          </div>

          <div className="portal-surface space-y-3 p-5">
            <SectionLabel>Publish</SectionLabel>
            <p className="text-sm text-muted-foreground">
              Optional. TikTok: download the file and post in the TikTok app.
            </p>

            <div className="space-y-2 rounded-cta border border-border p-4">
              <div className="flex items-center gap-2 font-medium">
                <Video className="size-4 text-primary" />
                YouTube Shorts
              </div>
              <p className="text-xs text-muted-foreground">
                {setup?.readyToPublishYoutube
                  ? `Ready · default privacy: ${episode.privacy.youtube}`
                  : "Missing YouTube keys — add them on Setup, or skip."}
                {episode.youtubeVideoId
                  ? ` · ID ${episode.youtubeVideoId}`
                  : ""}
              </p>
              <Button
                variant="ctaSoft"
                disabled={
                  !episode.videoUrl ||
                  publishing ||
                  !setup?.readyToPublishYoutube
                }
                onClick={() => void publishYoutube()}
              >
                {publishing ? "Uploading…" : "Publish to YouTube"}
              </Button>
            </div>

            <div className="space-y-2 rounded-cta border border-border p-4">
              <div className="flex items-center gap-2 font-medium">
                <Download className="size-4 text-primary" />
                TikTok / Instagram
              </div>
              <p className="text-xs text-muted-foreground">
                No extra API needed — download the MP4 and upload in the mobile
                app. Label it as AI-generated when asked.
              </p>
              {episode.videoUrl ? (
                <a
                  href={episode.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-cta",
                  )}
                >
                  Open / download video
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generate a video first.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
