import { promises as fs } from "fs";
import path from "path";

import type { ChannelDna, Episode, TopicIdea } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const EPISODES_DIR = path.join(DATA_DIR, "episodes");
const CHANNEL_PATH = path.join(DATA_DIR, "channel.json");
const TOPICS_PATH = path.join(DATA_DIR, "topics.json");

async function ensureDirs() {
  await fs.mkdir(EPISODES_DIR, { recursive: true });
}

async function writeJsonAtomic(filePath: string, data: unknown) {
  await ensureDirs();
  const tmp = `${filePath}.${process.pid}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tmp, payload, "utf8");
  await fs.rename(tmp, filePath);
}

export async function readChannel(): Promise<ChannelDna> {
  const raw = await fs.readFile(CHANNEL_PATH, "utf8");
  return JSON.parse(raw) as ChannelDna;
}

export async function writeChannel(channel: ChannelDna): Promise<ChannelDna> {
  await writeJsonAtomic(CHANNEL_PATH, channel);
  return channel;
}

export async function readTopics(): Promise<TopicIdea[]> {
  const raw = await fs.readFile(TOPICS_PATH, "utf8");
  return JSON.parse(raw) as TopicIdea[];
}

export async function writeTopics(topics: TopicIdea[]): Promise<TopicIdea[]> {
  await writeJsonAtomic(TOPICS_PATH, topics);
  return topics;
}

function episodePath(id: string) {
  return path.join(EPISODES_DIR, `${id}.json`);
}

export async function listEpisodes(): Promise<Episode[]> {
  await ensureDirs();
  const files = await fs.readdir(EPISODES_DIR);
  const episodes: Episode[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(EPISODES_DIR, file), "utf8");
    episodes.push(normalizeEpisode(JSON.parse(raw) as Episode));
  }

  return episodes.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

function normalizeEpisode(episode: Episode): Episode {
  return {
    ...episode,
    audioUrl: episode.audioUrl ?? null,
    script: episode.script ?? null,
  };
}

export async function getEpisode(id: string): Promise<Episode | null> {
  try {
    const raw = await fs.readFile(episodePath(id), "utf8");
    return normalizeEpisode(JSON.parse(raw) as Episode);
  } catch {
    return null;
  }
}

export async function writeEpisode(episode: Episode): Promise<Episode> {
  await writeJsonAtomic(episodePath(episode.id), episode);
  return episode;
}

export async function nextEpisodeId(): Promise<string> {
  const episodes = await listEpisodes();
  let max = 0;
  for (const episode of episodes) {
    const match = episode.id.match(/^(?:ep|demo)-(\d+)$/i);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `ep-${String(max + 1).padStart(3, "0")}`;
}

export async function createEpisode(prompt: string): Promise<Episode> {
  const now = new Date().toISOString();
  const id = await nextEpisodeId();
  const episode: Episode = {
    id,
    prompt: prompt.trim(),
    title: "",
    status: "queued",
    createdAt: now,
    updatedAt: now,
    videoUrl: null,
    posterUrl: null,
    audioUrl: null,
    caption: null,
    script: null,
    hashtags: ["#Shorts", "#History", "#DidYouKnow"],
    tiktokPublishId: null,
    youtubeVideoId: null,
    privacy: {
      tiktok: "draft",
      youtube: "unlisted",
    },
    error: null,
    isDemo: false,
  };
  return writeEpisode(episode);
}

export async function deleteEpisode(id: string): Promise<boolean> {
  try {
    await fs.unlink(episodePath(id));
  } catch {
    return false;
  }

  try {
    const mediaDir = path.join(DATA_DIR, "media", id);
    await fs.rm(mediaDir, { recursive: true, force: true });
  } catch {
    // media folder is optional
  }

  return true;
}

export async function updateEpisode(
  id: string,
  patch: Partial<Episode>,
): Promise<Episode | null> {
  const existing = await getEpisode(id);
  if (!existing) return null;

  const next: Episode = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    privacy: {
      ...existing.privacy,
      ...(patch.privacy ?? {}),
    },
    produce: patch.produce
      ? {
          ...(existing.produce ?? {
            step: "idle",
            message: null,
            voiceRequestId: null,
            sceneIndex: 0,
            scenes: [],
          }),
          ...patch.produce,
        }
      : existing.produce,
  };

  return writeEpisode(next);
}
