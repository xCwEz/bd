import { promises as fs } from "fs";
import path from "path";

import { isFfmpegAvailable } from "@/lib/ffmpeg";
import type { SetupStatus } from "@/lib/types";

/** ElevenLabs Rachel — default narrator voice */
export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export type SecretsFile = {
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  klingApiKey?: string;
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  youtubeRefreshToken?: string;
  /** @deprecated removed — kept so old Setup JSON still parses */
  klingAccessKey?: string;
  klingSecretKey?: string;
  magnificApiKey?: string;
  magnificVoiceId?: string;
  higgsfieldApiKey?: string;
  higgsfieldApiSecret?: string;
};

export type { SetupStatus };

const SECRETS_PATH = path.join(process.cwd(), "data", "secrets.json");

export async function readSecrets(): Promise<SecretsFile> {
  try {
    const raw = await fs.readFile(SECRETS_PATH, "utf8");
    return JSON.parse(raw) as SecretsFile;
  } catch {
    return {};
  }
}

export async function writeSecrets(secrets: SecretsFile): Promise<SecretsFile> {
  await fs.mkdir(path.dirname(SECRETS_PATH), { recursive: true });
  const tmp = `${SECRETS_PATH}.${process.pid}.tmp`;
  // Drop legacy Magnific / Kling AK+SK keys when saving
  const cleaned: SecretsFile = { ...secrets };
  delete cleaned.magnificApiKey;
  delete cleaned.magnificVoiceId;
  delete cleaned.klingAccessKey;
  delete cleaned.klingSecretKey;
  const payload = `${JSON.stringify(cleaned, null, 2)}\n`;
  await fs.writeFile(tmp, payload, "utf8");
  await fs.rename(tmp, SECRETS_PATH);
  return cleaned;
}

export async function getElevenLabsApiKey(): Promise<{
  key: string;
  source: "env" | "secrets";
} | null> {
  const envKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (envKey) {
    return { key: envKey, source: "env" };
  }

  const secrets = await readSecrets();
  if (secrets.elevenLabsApiKey?.trim()) {
    return { key: secrets.elevenLabsApiKey.trim(), source: "secrets" };
  }

  return null;
}

export async function getKlingApiKey(): Promise<{
  key: string;
  source: "env" | "secrets";
} | null> {
  const envKey = process.env.KLING_API_KEY?.trim();
  if (envKey) {
    return { key: envKey, source: "env" };
  }

  const secrets = await readSecrets();
  if (secrets.klingApiKey?.trim()) {
    return { key: secrets.klingApiKey.trim(), source: "secrets" };
  }

  return null;
}

export async function getVoiceId(): Promise<string> {
  const envVoice = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (envVoice) return envVoice;

  const secrets = await readSecrets();
  if (secrets.elevenLabsVoiceId?.trim()) {
    return secrets.elevenLabsVoiceId.trim();
  }
  if (secrets.magnificVoiceId?.trim()) {
    return secrets.magnificVoiceId.trim();
  }

  return DEFAULT_VOICE_ID;
}

export async function getYoutubeCredentials(): Promise<{
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  source: "env" | "secrets";
} | null> {
  const envId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const envSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const envRefresh = process.env.YOUTUBE_REFRESH_TOKEN?.trim();

  if (envId && envSecret && envRefresh) {
    return {
      clientId: envId,
      clientSecret: envSecret,
      refreshToken: envRefresh,
      source: "env",
    };
  }

  const secrets = await readSecrets();
  if (
    secrets.youtubeClientId &&
    secrets.youtubeClientSecret &&
    secrets.youtubeRefreshToken
  ) {
    return {
      clientId: secrets.youtubeClientId,
      clientSecret: secrets.youtubeClientSecret,
      refreshToken: secrets.youtubeRefreshToken,
      source: "secrets",
    };
  }

  return null;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const eleven = await getElevenLabsApiKey();
  const kling = await getKlingApiKey();
  const yt = await getYoutubeCredentials();
  const ffmpegReady = await isFfmpegAvailable();
  const voiceId = await getVoiceId();

  const elevenMissing: string[] = [];
  if (!eleven) {
    elevenMissing.push("ElevenLabs API Key");
  }

  const klingMissing: string[] = [];
  if (!kling) {
    klingMissing.push("Kling API Key");
  }

  const ytMissing: string[] = [];
  if (!yt) {
    ytMissing.push("YouTube Client ID");
    ytMissing.push("YouTube Client Secret");
    ytMissing.push("YouTube Refresh Token");
  }

  return {
    elevenLabs: {
      ready: Boolean(eleven),
      source: eleven?.source ?? null,
      missing: elevenMissing,
      helpUrl: "https://elevenlabs.io/app/settings/api-keys",
    },
    kling: {
      ready: Boolean(kling),
      source: kling?.source ?? null,
      missing: klingMissing,
      helpUrl: "https://kling.ai/dev/api-key",
    },
    youtube: {
      ready: Boolean(yt),
      source: yt?.source ?? null,
      missing: ytMissing,
      helpUrl:
        "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    },
    ffmpeg: {
      ready: ffmpegReady,
      helpUrl: "https://ffmpeg.org/download.html",
    },
    voiceId,
    readyToGenerate: Boolean(eleven) && Boolean(kling) && ffmpegReady,
    readyToPublishYoutube: Boolean(yt),
  };
}
