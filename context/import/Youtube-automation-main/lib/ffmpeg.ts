import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function runFfmpeg(args: string[]): Promise<void> {
  try {
    await execFileAsync("ffmpeg", args, {
      timeout: 10 * 60 * 1000,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    const detail = err.stderr?.trim() || err.message || "ffmpeg failed";
    throw new Error(detail.slice(-800));
  }
}

export async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 30000 },
    );
    const seconds = Number.parseFloat(stdout.trim());
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error("Could not read media duration.");
    }
    return seconds;
  } catch {
    // Fallback: some Windows installs only have ffmpeg
    const { stdout } = await execFileAsync(
      "ffmpeg",
      ["-i", filePath],
      { timeout: 30000 },
    ).catch((error: { stderr?: string }) => ({
      stdout: error.stderr ?? "",
    }));
    const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stdout);
    if (!match) throw new Error("Could not probe media duration with ffmpeg.");
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const secs = Number(match[3]);
    return hours * 3600 + minutes * 60 + secs;
  }
}
