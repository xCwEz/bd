"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Film, PlusCircle, Trash2 } from "lucide-react";

import { SectionLabel } from "@/components/studio/section-label";
import { SetupBanner } from "@/components/studio/setup-banner";
import { StatusBadge } from "@/components/studio/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { EpisodeStatus } from "@/lib/constants";
import type { Episode } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ id: "all" | EpisodeStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "queued", label: "Queued" },
  { id: "ready", label: "Ready" },
  { id: "published", label: "Published" },
  { id: "failed", label: "Failed" },
];

export default function LibraryPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/episodes");
      const data = (await res.json()) as { episodes: Episode[] };
      setEpisodes(data.episodes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return episodes;
    return episodes.filter((episode) => episode.status === filter);
  }, [episodes, filter]);

  async function handleDelete(episode: Episode) {
    const label = episode.title || episode.prompt.slice(0, 40);
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;

    setDeletingId(episode.id);
    try {
      const res = await fetch(`/api/episodes/${episode.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Delete failed.");
      }
      setEpisodes((prev) => prev.filter((item) => item.id !== episode.id));
      toast.success("Short deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <SetupBanner />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <SectionLabel>Library</SectionLabel>
          <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
            Your Shorts
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Episodes are saved as JSON in <code>data/episodes/</code>. Open one
            to generate, preview, or publish.
          </p>
        </div>
        <Link
          href="/create"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "gap-1.5 rounded-cta",
          )}
        >
          <PlusCircle className="size-4" />
          New short
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-cta border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === item.id
                ? "border-transparent bg-[var(--cta)] text-white"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading episodes…</p>
      ) : filtered.length === 0 ? (
        <div className="portal-surface flex flex-col items-start gap-3 p-8">
          <Film className="size-8 text-primary" />
          <h2 className="font-heading text-xl">No episodes here yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Queue a prompt from Create. It will show up here immediately — even
            before you render a video.
          </p>
          <Link
            href="/create"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-cta",
            )}
          >
            Create your first short
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((episode) => (
            <div
              key={episode.id}
              className="portal-surface group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md"
            >
              <Link
                href={`/library/${episode.id}`}
                className="flex flex-col"
              >
                <div className="relative aspect-[9/16] max-h-72 w-full overflow-hidden bg-muted">
                  {episode.videoUrl ? (
                    <video
                      src={episode.videoUrl}
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center">
                      <Film className="size-8 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        No video yet — still {episode.status}
                      </p>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <StatusBadge status={episode.status} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4 pr-12">
                  <h2 className="font-heading text-lg leading-snug group-hover:text-primary">
                    {episode.title || episode.prompt.slice(0, 64)}
                  </h2>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {episode.prompt}
                  </p>
                </div>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 bottom-3 text-muted-foreground hover:text-destructive"
                disabled={deletingId === episode.id}
                aria-label={`Delete ${episode.title || "short"}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDelete(episode);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
