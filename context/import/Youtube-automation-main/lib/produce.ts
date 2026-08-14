import { getSetupStatus } from "@/lib/credentials";
import { synthesizeEpisodeVoiceover } from "@/lib/elevenlabs";
import { isFfmpegAvailable } from "@/lib/ffmpeg";
import {
  getImageTask,
  getVideoTask,
  isKlingPending,
  startImageTask,
  startVideoTask,
} from "@/lib/kling";
import { muxEpisodeShort } from "@/lib/mux";
import { buildHistoryAlmostsScript } from "@/lib/script";
import { getEpisode, updateEpisode } from "@/lib/store";
import type { Episode, ProduceState, SceneState } from "@/lib/types";

function defaultProduce(): ProduceState {
  return {
    step: "idle",
    message: null,
    voiceRequestId: null,
    sceneIndex: 0,
    scenes: [],
  };
}

function scenesFromScript(
  script: ReturnType<typeof buildHistoryAlmostsScript>,
): SceneState[] {
  return script.beats.map((beat, index) => ({
    index,
    beatId: beat.id,
    label: beat.label,
    narration: beat.narration,
    visualPrompt: beat.visualPrompt,
    status: "pending" as const,
    imageRequestId: null,
    videoRequestId: null,
    imageUrl: null,
    videoUrl: null,
  }));
}

function withProduce(
  base: ProduceState | undefined,
  patch: Partial<ProduceState>,
): ProduceState {
  return {
    ...defaultProduce(),
    ...(base ?? {}),
    ...patch,
  };
}

export async function startProduce(episodeId: string): Promise<Episode> {
  const setup = await getSetupStatus();
  if (!setup.elevenLabs.ready) {
    throw new Error("Add your ElevenLabs API key on the Setup page first.");
  }
  if (!setup.kling.ready) {
    throw new Error(
      "Add your Kling API key on the Setup page first.",
    );
  }
  if (!(await isFfmpegAvailable())) {
    throw new Error(
      "ffmpeg is required to assemble narrated Shorts. Install ffmpeg, restart the app, then try Generate again. https://ffmpeg.org/download.html",
    );
  }

  const episode = await getEpisode(episodeId);
  if (!episode) throw new Error("Episode not found.");

  if (episode.status === "producing" && episode.produce?.step !== "failed") {
    return episode;
  }

  const script = buildHistoryAlmostsScript(episode.prompt);
  const scenes = scenesFromScript(script);

  const updated = await updateEpisode(episodeId, {
    status: "producing",
    error: null,
    title: episode.title || script.title,
    script,
    audioUrl: null,
    videoUrl: null,
    produce: {
      step: "voice",
      message: "Recording ElevenLabs voiceover…",
      voiceRequestId: null,
      sceneIndex: 0,
      scenes,
    },
  });

  if (!updated) throw new Error("Could not update episode.");
  return updated;
}

async function failEpisode(
  episodeId: string,
  produce: ProduceState,
  message: string,
): Promise<Episode> {
  const updated = await updateEpisode(episodeId, {
    status: "failed",
    error: message,
    produce: withProduce(produce, {
      step: "failed",
      message,
    }),
  });
  return updated!;
}

export async function tickProduce(episodeId: string): Promise<Episode> {
  const episode = await getEpisode(episodeId);
  if (!episode) throw new Error("Episode not found.");

  const produce = episode.produce ?? defaultProduce();

  if (episode.status !== "producing") {
    return episode;
  }

  if (
    (!produce.scenes || produce.scenes.length === 0) &&
    produce.step !== "voice" &&
    produce.step !== "script"
  ) {
    return startProduce(episodeId);
  }

  try {
    if (produce.step === "voice") {
      const scriptText =
        episode.script?.fullText ||
        buildHistoryAlmostsScript(episode.prompt).fullText;

      const audioUrl = await synthesizeEpisodeVoiceover(episodeId, scriptText);

      const scenes = [...produce.scenes];
      const first = scenes[0];
      if (!first) {
        return failEpisode(episodeId, produce, "Script has no scenes.");
      }

      const imageRequestId = await startImageTask(first.visualPrompt);
      scenes[0] = {
        ...first,
        status: "image",
        imageRequestId,
      };

      return (await updateEpisode(episodeId, {
        audioUrl,
        produce: withProduce(produce, {
          step: "scene_image",
          message: "Scene 1/5 — drawing with Kling…",
          sceneIndex: 0,
          scenes,
        }),
      }))!;
    }

    if (produce.step === "scene_image") {
      const scenes = [...produce.scenes];
      const index = produce.sceneIndex;
      const scene = scenes[index];
      if (!scene?.imageRequestId) {
        return failEpisode(episodeId, produce, "Missing image task for scene.");
      }

      const status = await getImageTask(scene.imageRequestId);

      if (isKlingPending(status.status)) {
        return (await updateEpisode(episodeId, {
          produce: withProduce(produce, {
            message: `Scene ${index + 1}/5 — drawing with Kling…`,
          }),
        }))!;
      }

      if (status.status === "failed" || !status.imageUrl) {
        scenes[index] = { ...scene, status: "failed" };
        return failEpisode(
          episodeId,
          withProduce(produce, { scenes }),
          `Image failed on scene ${index + 1}. Try Generate again.`,
        );
      }

      const videoRequestId = await startVideoTask(
        status.imageUrl,
        scene.visualPrompt,
        "5",
      );
      scenes[index] = {
        ...scene,
        status: "video",
        imageUrl: status.imageUrl,
        videoRequestId,
      };

      return (await updateEpisode(episodeId, {
        posterUrl: episode.posterUrl ?? status.imageUrl,
        produce: withProduce(produce, {
          step: "scene_video",
          message: `Scene ${index + 1}/5 — animating with Kling…`,
          scenes,
        }),
      }))!;
    }

    if (produce.step === "scene_video") {
      const scenes = [...produce.scenes];
      const index = produce.sceneIndex;
      const scene = scenes[index];
      if (!scene?.videoRequestId) {
        return failEpisode(episodeId, produce, "Missing video task for scene.");
      }

      const status = await getVideoTask(scene.videoRequestId);

      if (isKlingPending(status.status)) {
        return (await updateEpisode(episodeId, {
          produce: withProduce(produce, {
            message: `Scene ${index + 1}/5 — rendering Kling motion…`,
          }),
        }))!;
      }

      if (status.status === "failed" || !status.videoUrl) {
        scenes[index] = { ...scene, status: "failed" };
        return failEpisode(
          episodeId,
          withProduce(produce, { scenes }),
          `Video failed on scene ${index + 1}. Try Generate again.`,
        );
      }

      scenes[index] = {
        ...scene,
        status: "done",
        videoUrl: status.videoUrl,
      };

      const nextIndex = index + 1;
      if (nextIndex < scenes.length) {
        const next = scenes[nextIndex]!;
        const imageRequestId = await startImageTask(next.visualPrompt);
        scenes[nextIndex] = {
          ...next,
          status: "image",
          imageRequestId,
        };

        return (await updateEpisode(episodeId, {
          produce: withProduce(produce, {
            step: "scene_image",
            sceneIndex: nextIndex,
            message: `Scene ${nextIndex + 1}/5 — drawing with Kling…`,
            scenes,
          }),
        }))!;
      }

      return (await updateEpisode(episodeId, {
        produce: withProduce(produce, {
          step: "mux",
          message: "Assembling Short with voiceover + captions…",
          scenes,
        }),
      }))!;
    }

    if (produce.step === "mux") {
      const audioUrl = episode.audioUrl;
      if (!audioUrl) {
        return failEpisode(episodeId, produce, "Missing voiceover audio.");
      }

      const result = await muxEpisodeShort({
        episodeId,
        audioUrl,
        scenes: produce.scenes,
      });

      const title = episode.title || episode.script?.title || episode.prompt;
      const caption =
        episode.caption ||
        `${title} — a near-miss that almost changed everything. #Shorts`;

      return (await updateEpisode(episodeId, {
        status: "ready",
        videoUrl: result.videoUrl,
        posterUrl: result.posterUrl ?? episode.posterUrl,
        audioUrl,
        title,
        caption,
        error: null,
        produce: withProduce(produce, {
          step: "done",
          message: "Ready — narrated Short assembled.",
        }),
      }))!;
    }

    if (produce.step === "idle" || produce.step === "script") {
      return startProduce(episodeId);
    }

    return episode;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Production failed.";
    return failEpisode(episodeId, produce, message);
  }
}
