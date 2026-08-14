"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SectionLabel } from "@/components/studio/section-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelDna, TopicIdea } from "@/lib/types";

export default function ChannelPage() {
  const [channel, setChannel] = useState<ChannelDna | null>(null);
  const [topics, setTopics] = useState<TopicIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/channel");
      const data = (await res.json()) as {
        channel: ChannelDna;
        topics: TopicIdea[];
      };
      setChannel(data.channel);
      setTopics(data.topics);
      setLoading(false);
    })();
  }, []);

  async function save() {
    if (!channel) return;
    setSaving(true);
    try {
      const res = await fetch("/api/channel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, topics }),
      });
      const data = (await res.json()) as {
        channel: ChannelDna;
        topics: TopicIdea[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setChannel(data.channel);
      setTopics(data.topics);
      toast.success("Channel settings saved to data/.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !channel) {
    return <p className="text-sm text-muted-foreground">Loading channel…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-2">
        <SectionLabel>Channel</SectionLabel>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          Channel DNA
        </h1>
        <p className="text-sm text-muted-foreground">
          Your niche settings — saved to <code>data/channel.json</code> and{" "}
          <code>data/topics.json</code>.
        </p>
      </div>

      <div className="portal-surface space-y-4 p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="niche">
              Niche name
            </label>
            <Input
              id="niche"
              value={channel.nicheName}
              onChange={(event) =>
                setChannel({ ...channel, nicheName: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cadence">
              Shorts / week
            </label>
            <Input
              id="cadence"
              type="number"
              min={1}
              max={14}
              value={channel.cadencePerWeek}
              onChange={(event) =>
                setChannel({
                  ...channel,
                  cadencePerWeek: Number(event.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="tagline">
            Tagline
          </label>
          <Input
            id="tagline"
            value={channel.tagline}
            onChange={(event) =>
              setChannel({ ...channel, tagline: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="style">
            Style notes
          </label>
          <Textarea
            id="style"
            value={channel.styleNotes}
            onChange={(event) =>
              setChannel({ ...channel, styleNotes: event.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="voice">
            Voice notes
          </label>
          <Textarea
            id="voice"
            value={channel.voiceNotes}
            onChange={(event) =>
              setChannel({ ...channel, voiceNotes: event.target.value })
            }
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Format: {channel.format.aspectRatio} · {channel.format.motion} · ~
          {channel.format.targetSeconds}s · {channel.format.channelType} ·
          subtitles {channel.format.subtitles ? "on" : "off"} · AIGC disclosure{" "}
          {channel.aigcDisclosure ? "yes" : "no"}
        </p>

        <Button variant="cta" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save channel"}
        </Button>
      </div>

      <div className="portal-surface space-y-4 p-5 md:p-6">
        <SectionLabel>Topic ideas</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Starter History&apos;s almosts prompts. Click one on Create later — or
          copy into a new episode.
        </p>
        <ul className="space-y-3">
          {topics.map((topic, index) => (
            <li
              key={topic.id}
              className="rounded-cta border border-border p-3"
            >
              <Input
                value={topic.title}
                onChange={(event) => {
                  const next = [...topics];
                  next[index] = { ...topic, title: event.target.value };
                  setTopics(next);
                }}
                className="mb-2 font-medium"
              />
              <Input
                value={topic.hook}
                onChange={(event) => {
                  const next = [...topics];
                  next[index] = { ...topic, hook: event.target.value };
                  setTopics(next);
                }}
                className="mb-2 text-sm"
              />
              <Input
                value={topic.note}
                onChange={(event) => {
                  const next = [...topics];
                  next[index] = { ...topic, note: event.target.value };
                  setTopics(next);
                }}
                className="text-xs"
              />
            </li>
          ))}
        </ul>
        <Button variant="ctaSoft" onClick={() => void save()} disabled={saving}>
          Save topics
        </Button>
      </div>
    </div>
  );
}
