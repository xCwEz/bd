import path from "path";

import { getElevenLabsApiKey, getVoiceId } from "@/lib/credentials";
import {
  ensureEpisodeMediaDir,
  mediaPublicUrl,
} from "@/lib/media";
import { promises as fs } from "fs";

/** Best quality for documentary / long-form narration Shorts */
export const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

function humanizeError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (
    status === 401 ||
    (lower.includes("invalid") && lower.includes("api"))
  ) {
    return "ElevenLabs API key looks invalid. Re-paste it on Setup.";
  }
  if (status === 402 || lower.includes("quota") || lower.includes("credit")) {
    return "ElevenLabs quota exceeded. Top up your plan, then try Generate again.";
  }
  if (status === 429) {
    return "ElevenLabs rate limit hit. Wait a moment, then Retry.";
  }
  try {
    const parsed = JSON.parse(body) as {
      detail?: { message?: string } | string;
    };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (parsed.detail?.message) return parsed.detail.message;
  } catch {
    // fall through
  }
  return body.slice(0, 280) || `ElevenLabs request failed (${status})`;
}

/**
 * Generate VO with ElevenLabs and save under data/media/{episodeId}/voice.mp3.
 * Returns the public /api/media URL.
 */
export async function synthesizeEpisodeVoiceover(
  episodeId: string,
  text: string,
  voiceId?: string,
): Promise<string> {
  const creds = await getElevenLabsApiKey();
  if (!creds) {
    throw new Error("Add your ElevenLabs API key on the Setup page first.");
  }

  const resolvedVoice = voiceId?.trim() || (await getVoiceId());
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(resolvedVoice)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": creds.key,
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.7,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(humanizeError(res.status, body));
  }

  const dir = await ensureEpisodeMediaDir(episodeId);
  const filePath = path.join(dir, "voice.mp3");
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return mediaPublicUrl(episodeId, "voice.mp3");
}
