import { promises as fs } from "fs";
import path from "path";

import { probeDurationSeconds, runFfmpeg } from "@/lib/ffmpeg";
import {
  downloadToFile,
  ensureEpisodeMediaDir,
  mediaPublicUrl,
} from "@/lib/media";
import type { SceneState } from "@/lib/types";

const WIDTH = 1080;
const HEIGHT = 1920;

function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\N");
}

function formatAssTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const whole = Math.floor(s);
  const cs = Math.round((s - whole) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function buildAss(
  scenes: SceneState[],
  sceneDurations: number[],
): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${WIDTH}
PlayResY: ${HEIGHT}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,0,2,80,80,160,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let cursor = 0;
  const events: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    const duration = sceneDurations[i] ?? 5;
    const start = cursor;
    const end = cursor + duration;
    cursor = end;
    events.push(
      `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${escapeAssText(scene.narration)}`,
    );
  }

  return `${header}${events.join("\n")}\n`;
}

export function allocateSceneDurations(
  scenes: Array<{ narration: string }>,
  totalSeconds: number,
): number[] {
  const weights = scenes.map((scene) => {
    const words = scene.narration.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(words, 4);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * totalSeconds);
  const minEach = Math.min(3, totalSeconds / Math.max(scenes.length, 1));
  const boosted = raw.map((d) => Math.max(d, minEach));
  const boostedSum = boosted.reduce((a, b) => a + b, 0);
  return boosted.map((d) => (d / boostedSum) * totalSeconds);
}

async function fitClipToDuration(
  inputPath: string,
  outputPath: string,
  duration: number,
): Promise<void> {
  const clipDuration = await probeDurationSeconds(inputPath);
  const filter = [
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${WIDTH}:${HEIGHT}`,
    "setsar=1",
    "fps=30",
    "format=yuv420p",
  ].join(",");

  if (clipDuration >= duration - 0.05) {
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-t",
      duration.toFixed(3),
      "-vf",
      filter,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      outputPath,
    ]);
    return;
  }

  await runFfmpeg([
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    inputPath,
    "-t",
    duration.toFixed(3),
    "-vf",
    filter,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "20",
    outputPath,
  ]);
}

export async function muxEpisodeShort(args: {
  episodeId: string;
  audioUrl: string;
  scenes: SceneState[];
}): Promise<{ videoUrl: string; posterUrl: string | null }> {
  const dir = await ensureEpisodeMediaDir(args.episodeId);
  const audioPath = path.join(dir, "voice.mp3");

  try {
    await fs.access(audioPath);
  } catch {
    if (
      args.audioUrl.startsWith("http://") ||
      args.audioUrl.startsWith("https://")
    ) {
      await downloadToFile(args.audioUrl, audioPath);
    } else {
      throw new Error(
        "Voiceover file missing. Regenerate to create a new ElevenLabs VO.",
      );
    }
  }

  const audioDuration = await probeDurationSeconds(audioPath);
  const durations = allocateSceneDurations(args.scenes, audioDuration);

  const fittedPaths: string[] = [];
  for (let i = 0; i < args.scenes.length; i++) {
    const scene = args.scenes[i]!;
    if (!scene.videoUrl) {
      throw new Error(`Scene ${i + 1} is missing a video clip.`);
    }
    const rawPath = path.join(dir, `scene-${i + 1}-raw.mp4`);
    const fitPath = path.join(dir, `scene-${i + 1}.mp4`);
    await downloadToFile(scene.videoUrl, rawPath);
    await fitClipToDuration(rawPath, fitPath, durations[i]!);
    fittedPaths.push(fitPath);
  }

  // Poster from first scene image if available
  let posterUrl: string | null = null;
  const firstImage = args.scenes[0]?.imageUrl;
  if (firstImage) {
    const posterPath = path.join(dir, "poster.png");
    try {
      await downloadToFile(firstImage, posterPath);
      posterUrl = mediaPublicUrl(args.episodeId, "poster.png");
    } catch {
      posterUrl = null;
    }
  }

  const listPath = path.join(dir, "concat.txt");
  const listBody = fittedPaths
    .map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
    .join("\n");
  await fs.writeFile(listPath, `${listBody}\n`, "utf8");

  const concatPath = path.join(dir, "visual.mp4");
  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c",
    "copy",
    concatPath,
  ]);

  const assPath = path.join(dir, "captions.ass");
  await fs.writeFile(assPath, buildAss(args.scenes, durations), "utf8");

  const assEscaped = assPath
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'");

  const finalPath = path.join(dir, "final.mp4");
  const muxArgs = (withCaptions: boolean) => {
    const cmd = ["-y", "-i", concatPath, "-i", audioPath];
    if (withCaptions) {
      cmd.push("-vf", `ass='${assEscaped}'`);
    }
    cmd.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "-movflags",
      "+faststart",
      finalPath,
    );
    return cmd;
  };

  try {
    await runFfmpeg(muxArgs(true));
  } catch {
    await runFfmpeg(muxArgs(false));
  }

  return {
    videoUrl: mediaPublicUrl(args.episodeId, "final.mp4"),
    posterUrl,
  };
}
