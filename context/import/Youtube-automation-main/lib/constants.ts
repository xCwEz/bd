export const BRAND = {
  name: "Shorts Studio",
  subtitle: "Faceless Shorts",
  handle: "@hex.gar",
  handleUrl: "https://www.instagram.com/hex.gar/",
  resourcesUrl: "https://hexgarcia.com",
  credit: "Built by Hector Garcia",
  nicheExample: "History's almosts",
} as const;

export const EPISODE_STATUSES = [
  "queued",
  "producing",
  "ready",
  "failed",
  "published",
] as const;

export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];
