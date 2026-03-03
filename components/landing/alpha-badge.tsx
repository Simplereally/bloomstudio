import { cn } from "@/lib/utils";

/**
 * AlphaBadge — Consistent alpha/experimental indicator used across model badges.
 *
 * Single source of truth for the alpha visual treatment.
 * Follows the same pattern as NsfwBadge: intentionally small and tasteful.
 * Amber tones signal "experimental/preview" without competing with the
 * ember-orange primary or the pink NSFW badge.
 *
 * @param label     - Custom text label (default: "Alpha")
 * @param className - Additional classes for layout overrides (margin, positioning)
 */
export function AlphaBadge({
  label = "Alpha",
  className,
}: {
  label?: string;
  className?: string;
} = {}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider leading-none",
        className,
      )}
      role="status"
      aria-label="Alpha — experimental model"
    >
      {label}
    </span>
  );
}
