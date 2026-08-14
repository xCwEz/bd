import { getKlingApiKey } from "@/lib/credentials";

const BASE = "https://api-singapore.klingai.com";

export type KlingTaskStatus =
  | "submitted"
  | "processing"
  | "succeed"
  | "failed";

type KlingApiResponse = {
  code?: number;
  message?: string;
  data?: {
    task_id?: string;
    task_status?: KlingTaskStatus;
    task_status_msg?: string;
    task_result?: {
      images?: Array<{ url?: string; index?: number }>;
      videos?: Array<{ url?: string; id?: string; duration?: string }>;
    };
  };
};

function humanizeError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("balance") ||
    lower.includes("credit") ||
    lower.includes("quota") ||
    lower.includes("insufficient")
  ) {
    return "Not enough Kling API units. Top up at kling.ai/dev/pricing, then try Generate again.";
  }
  if (
    lower.includes("unauthorized") ||
    lower.includes("auth") ||
    lower.includes("token") ||
    lower.includes("api key")
  ) {
    return "Kling API key looks invalid. Re-paste it on Setup.";
  }
  return raw;
}

async function klingFetch(
  apiPath: string,
  init?: RequestInit,
): Promise<KlingApiResponse> {
  const creds = await getKlingApiKey();
  if (!creds) {
    throw new Error("Add your Kling API key on Setup first.");
  }

  const res = await fetch(`${BASE}${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${creds.key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await res.json()) as KlingApiResponse;
  if (!res.ok || (typeof data.code === "number" && data.code !== 0)) {
    throw new Error(
      humanizeError(
        data.message || data.data?.task_status_msg || `Kling request failed (${res.status})`,
      ),
    );
  }
  return data;
}

export function buildHistoryImagePrompt(visualPrompt: string): string {
  return [
    "Cinematic illustrated storybook frame for a vertical history short,",
    "non-photoreal documentary illustration, dramatic lighting,",
    "rich period detail, no text, no captions, no watermarks,",
    visualPrompt,
  ].join(" ");
}

export function buildHistoryMotionPrompt(visualPrompt: string): string {
  return [
    "Smooth cinematic camera moves across the illustrated scene,",
    "subtle parallax, gentle atmospheric motion, documentary energy,",
    "no talking faces, no on-screen text,",
    visualPrompt,
  ].join(" ");
}

export async function startImageTask(visualPrompt: string): Promise<string> {
  const data = await klingFetch("/v1/images/generations", {
    method: "POST",
    body: JSON.stringify({
      model_name: "kling-v1",
      prompt: buildHistoryImagePrompt(visualPrompt),
      negative_prompt: "text, watermark, logo, blurry, low quality, photorealistic",
      n: 1,
      aspect_ratio: "9:16",
    }),
  });

  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error("Kling did not return an image task id.");
  }
  return taskId;
}

export async function getImageTask(taskId: string): Promise<{
  status: KlingTaskStatus;
  imageUrl: string | null;
}> {
  const data = await klingFetch(`/v1/images/generations/${taskId}`);
  const status = data.data?.task_status ?? "processing";
  const imageUrl = data.data?.task_result?.images?.[0]?.url ?? null;
  return { status, imageUrl };
}

export async function startVideoTask(
  imageUrl: string,
  visualPrompt: string,
  duration: "5" | "10" = "5",
): Promise<string> {
  const data = await klingFetch("/v1/videos/image2video", {
    method: "POST",
    body: JSON.stringify({
      model_name: "kling-v2-1",
      image: imageUrl,
      prompt: buildHistoryMotionPrompt(visualPrompt),
      negative_prompt: "blurry, text, watermark, talking faces, low quality",
      duration,
      mode: "std",
      cfg_scale: 0.5,
    }),
  });

  const taskId = data.data?.task_id;
  if (!taskId) {
    throw new Error("Kling did not return a video task id.");
  }
  return taskId;
}

export async function getVideoTask(taskId: string): Promise<{
  status: KlingTaskStatus;
  videoUrl: string | null;
}> {
  const data = await klingFetch(`/v1/videos/image2video/${taskId}`);
  const status = data.data?.task_status ?? "processing";
  const videoUrl = data.data?.task_result?.videos?.[0]?.url ?? null;
  return { status, videoUrl };
}

export function isKlingPending(status: KlingTaskStatus): boolean {
  return status === "submitted" || status === "processing";
}
