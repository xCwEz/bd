import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MEDIA_DIR = path.join(DATA_DIR, "media");

export function episodeMediaDir(episodeId: string): string {
  return path.join(MEDIA_DIR, episodeId);
}

export function mediaPublicUrl(episodeId: string, filename: string): string {
  return `/api/media/${encodeURIComponent(episodeId)}/${encodeURIComponent(filename)}`;
}

export async function ensureEpisodeMediaDir(episodeId: string): Promise<string> {
  const dir = episodeMediaDir(episodeId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function downloadToFile(
  url: string,
  destPath: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${path.basename(destPath)}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
}

export async function resolveMediaFile(
  episodeId: string,
  filename: string,
): Promise<string | null> {
  // Prevent path traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return null;
  }
  const filePath = path.join(episodeMediaDir(episodeId), filename);
  try {
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}
