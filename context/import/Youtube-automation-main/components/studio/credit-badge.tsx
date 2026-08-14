"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CreditBadge() {
  const { state, isMobile } = useSidebar();
  const visible = isMobile || state === "collapsed";

  if (!visible) return null;

  return (
    <a
      href={BRAND.resourcesUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${BRAND.credit}. More resources at hexgarcia.com`}
      className={cn(
        "btn-flip cta-flip fixed right-4 bottom-4 z-30 inline-flex h-10 items-center justify-center overflow-hidden rounded-cta px-3.5",
        "ring-1 ring-black/20 shadow-[0_8px_28px_-6px_rgba(0,0,0,0.45)]",
        "dark:ring-white/15 dark:shadow-[var(--cta-shadow)]",
        "md:right-6 md:bottom-6",
      )}
    >
      <span className="btn-flip-inner">
        <span className="btn-flip-face btn-flip-face-front text-xs font-bold tracking-tight text-white">
          {BRAND.credit}
        </span>
        <span
          className="btn-flip-face btn-flip-face-back text-xs font-bold tracking-tight text-white"
          aria-hidden="true"
        >
          More resources
        </span>
      </span>
    </a>
  );
}
