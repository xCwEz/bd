import type { EpisodeStatus } from "@/lib/constants";

export function statusLabel(status: EpisodeStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "producing":
      return "Producing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    case "published":
      return "Published";
    default:
      return status;
  }
}

export function statusBadgeClass(status: EpisodeStatus): string {
  switch (status) {
    case "queued":
      return "bg-secondary text-secondary-foreground";
    case "producing":
      return "bg-accent text-accent-foreground";
    case "ready":
      return "bg-primary text-primary-foreground";
    case "failed":
      return "bg-destructive/10 text-destructive";
    case "published":
      return "bg-[var(--cta)] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}
