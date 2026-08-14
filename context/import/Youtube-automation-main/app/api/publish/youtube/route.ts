import { spawn } from "child_process";
import path from "path";

import { NextResponse } from "next/server";

import { getYoutubeCredentials } from "@/lib/credentials";
import { resolveMediaFile } from "@/lib/media";
import { getEpisode, updateEpisode } from "@/lib/store";

export const runtime = "nodejs";

function runUpload(
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{
  code: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const script = path.join(process.cwd(), "scripts", "youtube-upload.mjs");
    const child = spawn(process.execPath, [script, ...args], {
      cwd: process.cwd(),
      env,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export async function POST(request: Request) {
  const creds = await getYoutubeCredentials();

  if (!creds) {
    return NextResponse.json(
      {
        error:
          "YouTube keys missing. Add them on the Setup page (optional).",
        configured: false,
      },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { episodeId?: string };
  if (!body.episodeId) {
    return NextResponse.json(
      { error: "episodeId is required." },
      { status: 400 },
    );
  }

  const episode = await getEpisode(body.episodeId);
  if (!episode) {
    return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  }
  const localVideo = await resolveMediaFile(episode.id, "final.mp4");
  if (!localVideo && !episode.videoUrl) {
    return NextResponse.json(
      { error: "This episode has no video file yet." },
      { status: 400 },
    );
  }
  if (!localVideo) {
    return NextResponse.json(
      {
        error:
          "Local final.mp4 missing. Regenerate the Short, then publish again.",
      },
      { status: 400 },
    );
  }

  const title = episode.title || episode.prompt.slice(0, 80);
  const description = [
    episode.caption ?? episode.prompt,
    "",
    [...episode.hashtags, "#Shorts"].join(" "),
  ].join("\n");

  const result = await runUpload(
    [
      "--file",
      localVideo,
      "--title",
      title,
      "--description",
      description,
      "--privacy",
      episode.privacy.youtube,
    ],
    {
      ...process.env,
      YOUTUBE_CLIENT_ID: creds.clientId,
      YOUTUBE_CLIENT_SECRET: creds.clientSecret,
      YOUTUBE_REFRESH_TOKEN: creds.refreshToken,
    },
  );

  if (result.code !== 0) {
    return NextResponse.json(
      {
        error: "YouTube upload failed. Check the script output.",
        details: result.stderr || result.stdout,
      },
      { status: 500 },
    );
  }

  let videoId: string | null = null;
  try {
    const parsed = JSON.parse(result.stdout.trim()) as { videoId?: string };
    videoId = parsed.videoId ?? null;
  } catch {
    videoId = result.stdout.trim() || null;
  }

  const updated = await updateEpisode(episode.id, {
    youtubeVideoId: videoId,
    status: episode.status === "ready" ? "published" : episode.status,
  });

  return NextResponse.json({ episode: updated, videoId });
}
