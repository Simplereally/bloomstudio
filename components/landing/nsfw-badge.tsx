import { cn } from "@/lib/utils";

/**
 * NsfwBadge — Consistent 18+ badge used across all components.
 *
 * Single source of truth for the 18+ visual treatment.
 * Intentionally small and tasteful: pink tint, no visual weight.
 *
 * @param label  - Custom text label (default: "18+")
 * @param className - Additional classes for layout overrides (margin, positioning)
 */
export function NsfwBadge({
  label = "18+",
  className,
}: {
  label?: string;
  className?: string;
} = {}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 px-1.5 py-0.5 rounded-md bg-pink-600/15 border border-pink-500/20 text-[9px] font-bold text-pink-400 uppercase tracking-wider leading-none",
        className,
      )}
      role="img"
      aria-label="Adults only — 18 plus content"
    >
      {label}
    </span>
  );
}
