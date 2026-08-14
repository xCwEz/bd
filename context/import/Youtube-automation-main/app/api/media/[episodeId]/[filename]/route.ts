import { open, stat, type FileHandle } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { resolveMediaFile } from "@/lib/media";

export const runtime = "nodejs";

type Params = { params: Promise<{ episodeId: string; filename: string }> };

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const CHUNK = 64 * 1024;

function parseRange(
  rangeHeader: string,
  size: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const startText = match[1] ?? "";
  const endText = match[2] ?? "";
  let start = startText ? Number(startText) : NaN;
  let end = endText ? Number(endText) : NaN;

  if (Number.isNaN(start) && Number.isNaN(end)) return null;
  if (Number.isNaN(start)) {
    const suffix = end;
    if (suffix <= 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else if (Number.isNaN(end)) {
    end = size - 1;
  }

  if (start < 0 || end < start || start >= size) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

/** Avoid Readable.toWeb — client aborts on video Range requests close the
 *  Node adapter twice and throw ERR_INVALID_STATE in Next.js. */
function fileByteStream(
  filePath: string,
  start: number,
  end: number,
): ReadableStream<Uint8Array> {
  let handle: FileHandle | null = null;
  let position = start;
  const last = end;
  let closed = false;

  async function closeHandle() {
    if (!handle) return;
    const h = handle;
    handle = null;
    await h.close().catch(() => {});
  }

  return new ReadableStream<Uint8Array>({
    async start() {
      handle = await open(filePath, "r");
    },
    async pull(controller) {
      if (closed || !handle || position > last) {
        if (!closed) {
          closed = true;
          controller.close();
          await closeHandle();
        }
        return;
      }

      try {
        const size = Math.min(CHUNK, last - position + 1);
        const buf = Buffer.alloc(size);
        const { bytesRead } = await handle.read(buf, 0, size, position);
        if (bytesRead === 0) {
          closed = true;
          controller.close();
          await closeHandle();
          return;
        }
        position += bytesRead;
        controller.enqueue(buf.subarray(0, bytesRead));
        if (position > last && !closed) {
          closed = true;
          controller.close();
          await closeHandle();
        }
      } catch (error) {
        closed = true;
        await closeHandle();
        controller.error(error);
      }
    },
    async cancel() {
      closed = true;
      await closeHandle();
    },
  });
}

export async function GET(request: Request, { params }: Params) {
  const { episodeId, filename } = await params;
  const filePath = await resolveMediaFile(episodeId, filename);
  if (!filePath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const stats = await stat(filePath);
  const size = stats.size;
  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const range = parseRange(rangeHeader, size);
    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${size}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    const { start, end } = range;
    return new NextResponse(fileByteStream(filePath, start, end), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse(fileByteStream(filePath, 0, size - 1), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
