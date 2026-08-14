import type { EpisodeStatus } from "@/lib/constants";

export type EpisodePrivacy = {
  tiktok: "draft" | "public" | "pending";
  youtube: "unlisted" | "public" | "private";
};

export type ScriptBeatId =
  | "hook"
  | "setup"
  | "almost"
  | "twist"
  | "button";

export type ScriptBeat = {
  id: ScriptBeatId;
  label: string;
  narration: string;
  visualPrompt: string;
};

export type EpisodeScript = {
  title: string;
  fullText: string;
  beats: ScriptBeat[];
};

export type SceneProduceStatus =
  | "pending"
  | "image"
  | "video"
  | "done"
  | "failed";

export type SceneState = {
  index: number;
  beatId: ScriptBeatId;
  label: string;
  narration: string;
  visualPrompt: string;
  status: SceneProduceStatus;
  imageRequestId: string | null;
  videoRequestId: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
};

export type ProduceStep =
  | "idle"
  | "script"
  | "voice"
  | "scene_image"
  | "scene_video"
  | "mux"
  | "done"
  | "failed";

export type ProduceState = {
  step: ProduceStep;
  message: string | null;
  voiceRequestId: string | null;
  sceneIndex: number;
  scenes: SceneState[];
  /** @deprecated legacy single-shot fields kept for old episode JSON */
  imageRequestId?: string | null;
  videoRequestId?: string | null;
  imageUrl?: string | null;
};

export type Episode = {
  id: string;
  prompt: string;
  title: string;
  status: EpisodeStatus;
  createdAt: string;
  updatedAt: string;
  videoUrl: string | null;
  posterUrl: string | null;
  audioUrl: string | null;
  caption: string | null;
  hashtags: string[];
  tiktokPublishId: string | null;
  youtubeVideoId: string | null;
  privacy: EpisodePrivacy;
  error: string | null;
  isDemo?: boolean;
  script?: EpisodeScript | null;
  produce?: ProduceState;
};

export type ChannelDna = {
  nicheName: string;
  tagline: string;
  format: {
    aspectRatio: "9:16";
    motion: "animated" | "stills";
    targetSeconds: number;
    subtitles: boolean;
    channelType: "History" | "Explainer" | "Kids" | "Fairy Tale";
  };
  styleNotes: string;
  voiceNotes: string;
  aigcDisclosure: boolean;
  cadencePerWeek: number;
};

export type TopicIdea = {
  id: string;
  title: string;
  hook: string;
  note: string;
};

export type SetupStatus = {
  elevenLabs: {
    ready: boolean;
    source: "env" | "secrets" | null;
    missing: string[];
    helpUrl: string;
  };
  kling: {
    ready: boolean;
    source: "env" | "secrets" | null;
    missing: string[];
    helpUrl: string;
  };
  youtube: {
    ready: boolean;
    source: "env" | "secrets" | null;
    missing: string[];
    helpUrl: string;
  };
  ffmpeg: {
    ready: boolean;
    helpUrl: string;
  };
  voiceId: string;
  readyToGenerate: boolean;
  readyToPublishYoutube: boolean;
};
