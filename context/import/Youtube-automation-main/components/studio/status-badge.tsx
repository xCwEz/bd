import { Badge } from "@/components/ui/badge";
import type { EpisodeStatus } from "@/lib/constants";
import { statusBadgeClass, statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: EpisodeStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-semibold",
        statusBadgeClass(status),
        className,
      )}
    >
      {statusLabel(status)}
    </Badge>
  );
}
