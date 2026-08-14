import type { EpisodeScript, ScriptBeat } from "@/lib/types";

function cleanTopic(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim().replace(/\.$/, "");
}

function titleCaseTopic(topic: string): string {
  if (topic.length <= 72) return topic;
  return `${topic.slice(0, 69)}…`;
}

/**
 * Deterministic "History's almosts" Shorts script — no LLM key required.
 * ~120–160 words across 5 beats for a ~45–60s VO at natural pace.
 */
export function buildHistoryAlmostsScript(prompt: string): EpisodeScript {
  const topic = cleanTopic(prompt) || "a forgotten near-miss";
  const title = titleCaseTopic(topic);

  const beats: ScriptBeat[] = [
    {
      id: "hook",
      label: "Hook",
      narration: `What if one wrong move almost rewrote the world? This is the story of ${topic}.`,
      visualPrompt: `Opening cinematic storybook frame for ${topic}, tense atmosphere, dramatic rim light, empty stage before the crisis, vertical 9:16 illustration`,
    },
    {
      id: "setup",
      label: "Setup",
      narration: `The world looked stable. People went about their day. Nobody realized how close history was to snapping — until the moment behind ${topic} started to unfold.`,
      visualPrompt: `Everyday period scene just before crisis for ${topic}, calm surface, subtle unease, documentary storybook illustration, 9:16`,
    },
    {
      id: "almost",
      label: "The almost",
      narration: `Then came the near-miss. One decision. One delay. One telegram, order, or accident away from disaster. For a few breathless hours, ${topic} hung in the balance.`,
      visualPrompt: `Peak tension visual for ${topic}, clocks, wires, maps, or war rooms, extreme near-miss energy, cinematic non-photoreal illustration, 9:16`,
    },
    {
      id: "twist",
      label: "Twist",
      narration: `And then — somehow — it didn't happen. A cooler head. A missed signal. A stroke of luck we still barely understand. The catastrophe that almost was… wasn't.`,
      visualPrompt: `Aftermath breath for ${topic}, tension releasing, soft light after storm, symbolic near-miss resolution, storybook illustration, 9:16`,
    },
    {
      id: "button",
      label: "Button",
      narration: `History remembers the wars that started. It forgets the ones that almost did. Follow for more history's almosts — the nights the world nearly changed forever.`,
      visualPrompt: `Closing emblematic frame for ${topic}, quiet horizon after crisis, reflective documentary illustration, no text, 9:16`,
    },
  ];

  const fullText = beats.map((beat) => beat.narration).join(" ");

  return { title, fullText, beats };
}
