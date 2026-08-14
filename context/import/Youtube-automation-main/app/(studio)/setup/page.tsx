"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

import { SectionLabel } from "@/components/studio/section-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SetupStatus } from "@/lib/types";

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [elevenKey, setElevenKey] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [klingApiKey, setKlingApiKey] = useState("");
  const [ytId, setYtId] = useState("");
  const [ytSecret, setYtSecret] = useState("");
  const [ytRefresh, setYtRefresh] = useState("");

  async function load() {
    const res = await fetch("/api/setup");
    const data = (await res.json()) as { status: SetupStatus };
    setStatus(data.status);
    setVoiceId(data.status.voiceId);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveElevenLabs() {
    if (!elevenKey.trim() && !voiceId.trim()) {
      toast.error("Paste your ElevenLabs API key or a voice ID.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (elevenKey.trim()) body.elevenLabsApiKey = elevenKey.trim();
      if (voiceId.trim()) body.elevenLabsVoiceId = voiceId.trim();

      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { status?: SetupStatus; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setStatus(data.status!);
      setElevenKey("");
      setVoiceId(data.status!.voiceId);
      toast.success("ElevenLabs settings saved locally.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveKling() {
    if (!klingApiKey.trim()) {
      toast.error("Paste your Kling API key.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          klingApiKey: klingApiKey.trim(),
        }),
      });
      const data = (await res.json()) as { status?: SetupStatus; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setStatus(data.status!);
      setKlingApiKey("");
      toast.success("Kling API key saved locally.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveYoutube() {
    if (!ytId.trim() || !ytSecret.trim() || !ytRefresh.trim()) {
      toast.error("Fill all three YouTube fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeClientId: ytId.trim(),
          youtubeClientSecret: ytSecret.trim(),
          youtubeRefreshToken: ytRefresh.trim(),
        }),
      });
      const data = (await res.json()) as { status?: SetupStatus; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setStatus(data.status!);
      setYtId("");
      setYtSecret("");
      setYtRefresh("");
      toast.success("YouTube keys saved locally.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-2">
        <SectionLabel>Setup</SectionLabel>
        <h1 className="font-heading text-3xl tracking-tight md:text-4xl">
          What you need
        </h1>
        <p className="text-sm text-muted-foreground">
          Keys stay on your machine in <code>data/secrets.json</code> (gitignored).
          Voice = ElevenLabs. Images/video = Kling Open Platform. Mux = ffmpeg.
        </p>
      </div>

      <div className="portal-surface space-y-3 p-5">
        <SectionLabel>Checklist</SectionLabel>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span>ElevenLabs (voiceover)</span>
            <span
              className={
                status?.elevenLabs.ready
                  ? "font-semibold text-primary"
                  : "font-semibold text-destructive"
              }
            >
              {status?.elevenLabs.ready ? "Ready" : "Missing"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Kling API (images + video)</span>
            <span
              className={
                status?.kling.ready
                  ? "font-semibold text-primary"
                  : "font-semibold text-destructive"
              }
            >
              {status?.kling.ready ? "Ready" : "Missing"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>ffmpeg (local mux)</span>
            <span
              className={
                status?.ffmpeg.ready
                  ? "font-semibold text-primary"
                  : "font-semibold text-destructive"
              }
            >
              {status?.ffmpeg.ready ? "Ready" : "Missing"}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>YouTube API (optional publish)</span>
            <span
              className={
                status?.readyToPublishYoutube
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }
            >
              {status?.readyToPublishYoutube ? "Ready" : "Optional"}
            </span>
          </li>
        </ul>
        {!status?.ffmpeg.ready ? (
          <p className="text-xs text-muted-foreground">
            Install{" "}
            <a
              href={status?.ffmpeg.helpUrl ?? "https://ffmpeg.org/download.html"}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ffmpeg
            </a>
            , add it to your PATH, then restart <code>npm run dev</code>.
          </p>
        ) : null}
      </div>

      <div className="portal-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>ElevenLabs</SectionLabel>
          <a
            href="https://elevenlabs.io/app/settings/api-keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            API keys
            <ExternalLink className="size-3" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Narration uses <code className="text-xs">eleven_multilingual_v2</code>.
          Pick a voice from the{" "}
          <a
            href="https://elevenlabs.io/voice-library/documentary-narrator-voices"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            documentary library
          </a>
          .
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="eleven-key">
            API Key
          </label>
          <Input
            id="eleven-key"
            type="password"
            autoComplete="off"
            placeholder={
              status?.elevenLabs.ready ? "Saved — paste to replace" : "sk_…"
            }
            value={elevenKey}
            onChange={(event) => setElevenKey(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="voice-id">
            Voice ID
          </label>
          <Input
            id="voice-id"
            autoComplete="off"
            placeholder="21m00Tcm4TlvDq8ikWAM"
            value={voiceId}
            onChange={(event) => setVoiceId(event.target.value)}
          />
        </div>
        <Button variant="cta" disabled={saving} onClick={() => void saveElevenLabs()}>
          Save ElevenLabs settings
        </Button>
      </div>

      <div className="portal-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Kling Open Platform</SectionLabel>
          <a
            href="https://kling.ai/dev/api-key"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Create API key
            <ExternalLink className="size-3" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Direct Kling API (not a reseller). Create one API key at{" "}
          <a
            href="https://kling.ai/dev/api-key"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            kling.ai/dev/api-key
          </a>
          , buy a small{" "}
          <a
            href="https://kling.ai/dev/pricing"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            API unit pack
          </a>
          . Generate uses Kling image → Kling 2.1 image-to-video (5s, std).
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="kling-api-key">
            API Key
          </label>
          <Input
            id="kling-api-key"
            type="password"
            autoComplete="off"
            placeholder={
              status?.kling.ready ? "Saved — paste to replace" : "API Key"
            }
            value={klingApiKey}
            onChange={(event) => setKlingApiKey(event.target.value)}
          />
        </div>
        <Button variant="cta" disabled={saving} onClick={() => void saveKling()}>
          Save Kling API key
        </Button>
      </div>

      <div className="portal-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>YouTube (optional)</SectionLabel>
          <a
            href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Enable YouTube Data API
            <ExternalLink className="size-3" />
          </a>
        </div>
        <Input
          type="password"
          placeholder="Client ID"
          value={ytId}
          onChange={(event) => setYtId(event.target.value)}
        />
        <Input
          type="password"
          placeholder="Client Secret"
          value={ytSecret}
          onChange={(event) => setYtSecret(event.target.value)}
        />
        <Input
          type="password"
          placeholder="Refresh Token"
          value={ytRefresh}
          onChange={(event) => setYtRefresh(event.target.value)}
        />
        <Button
          variant="ctaSoft"
          disabled={saving}
          onClick={() => void saveYoutube()}
        >
          Save YouTube keys
        </Button>
      </div>
    </div>
  );
}
