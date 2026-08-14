#!/usr/bin/env node
/**
 * YouTube Shorts uploader.
 *
 * Usage:
 *   node scripts/youtube-upload.mjs \
 *     --file "data/media/ep-005/final.mp4" \
 *     --title "My Short" \
 *     --description "Caption\n\n#Shorts" \
 *     --privacy unlisted
 *
 * Or with a remote URL:
 *   node scripts/youtube-upload.mjs --url "https://..." ...
 *
 * Requires env:
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REFRESH_TOKEN
 *
 * Prints JSON: { "videoId": "..." }
 */

import { writeFile, unlink, mkdtemp, access, stat } from "fs/promises";
import { createReadStream } from "fs";
import { tmpdir } from "os";
import path from "path";

function parseArgs(argv) {
  const out = {
    url: "",
    file: "",
    title: "Untitled Short",
    description: "#Shorts",
    privacy: "unlisted",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value == null) continue;
    const name = key.slice(2);
    if (name in out) {
      out[name] = value;
      i += 1;
    }
  }
  return out;
}

async function refreshAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, or YOUTUBE_REFRESH_TOKEN",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function downloadToTemp(url) {
  const dir = await mkdtemp(path.join(tmpdir(), "shorts-yt-"));
  const filePath = path.join(dir, "short.mp4");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not download video (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buffer);
  return { filePath, cleanup: true };
}

async function resolveLocalFile(fileArg) {
  const filePath = path.isAbsolute(fileArg)
    ? fileArg
    : path.resolve(process.cwd(), fileArg);
  await access(filePath);
  return { filePath, cleanup: false };
}

async function resumableUpload({
  accessToken,
  filePath,
  title,
  description,
  privacy,
}) {
  const { size } = await stat(filePath);
  const metadata = {
    snippet: {
      title: title.slice(0, 100),
      description,
      categoryId: "27",
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
    },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(size),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(metadata),
    },
  );

  const uploadUrl = initRes.headers.get("location");
  if (!initRes.ok || !uploadUrl) {
    const text = await initRes.text();
    throw new Error(`Resumable init failed: ${text}`);
  }

  const chunks = [];
  for await (const chunk of createReadStream(filePath)) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
      "Content-Length": String(body.length),
    },
    body,
  });

  const result = await uploadRes.json();
  if (!uploadRes.ok || !result.id) {
    throw new Error(`Upload failed: ${JSON.stringify(result)}`);
  }
  return result.id;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file && !args.url) {
    console.error("Missing --file or --url");
    process.exit(1);
  }

  let resolved = { filePath: "", cleanup: false };
  try {
    const accessToken = await refreshAccessToken();
    resolved = args.file
      ? await resolveLocalFile(args.file)
      : await downloadToTemp(args.url);

    const videoId = await resumableUpload({
      accessToken,
      filePath: resolved.filePath,
      title: args.title,
      description: args.description,
      privacy: args.privacy,
    });
    process.stdout.write(JSON.stringify({ videoId }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    if (resolved.cleanup && resolved.filePath) {
      try {
        await unlink(resolved.filePath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

await main();
