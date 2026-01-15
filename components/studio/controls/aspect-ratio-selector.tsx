"use client";

/**
 * AspectRatioSelector - Visual aspect ratio selection with previews and resolution tiers
 * Uses standard industry resolutions, with model constraints determining achievability.
 * Follows SRP: Only manages aspect ratio and resolution tier selection UI
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ResolutionTierSelector } from "./resolution-tier-selector";
import { useAspectRatioDimensions } from "@/hooks/use-aspect-ratio-dimensions";
import { RESOLUTION_TIERS } from "@/lib/config/resolution-tiers";
import type { AspectRatio, AspectRatioOption, ModelConstraints, ResolutionTier } from "@/types/pollinations";
import { cn } from "@/lib/utils";
import { 
  Frame, 
  SlidersHorizontal, 
  Instagram, 
  Youtube, 
  Facebook, 
  Linkedin, 
  Monitor, 
  Smartphone, 
  Globe, 
  Laptop, 
  UserCircle, 
  Music, 
  Film, 
  Camera, 
  ShoppingBag, 
  FileText, 
  Printer, 
  Megaphone, 
  Clapperboard, 
  Gamepad2, 
  Pin, 
  LayoutTemplate, 
  RectangleVertical, 
  Image as ImageIcon,
  type LucideIcon 
} from "lucide-react";
import * as React from "react";

// Helper to get icon for tag
const getIconForTag = (tag: string): LucideIcon | null => {
  const t = tag.toLowerCase();
  
  // Social Media & Platforms
  if (t.includes("instagram")) return Instagram;
  if (t.includes("youtube") || t.includes("shorts")) return Youtube;
  if (t.includes("facebook")) return Facebook;
  if (t.includes("linkedin")) return Linkedin;
  if (t.includes("tiktok") || t.includes("snapchat")) return Smartphone;
  if (t.includes("pinterest")) return Pin;
  if (t.includes("stream") || t.includes("twitch")) return Gamepad2;
  
  // Photography & Art
  if (t.includes("portrait") || t.includes("dslr") || t.includes("photo")) return Camera;
  if (t.includes("album") || t.includes("cover art") || t.includes("music")) return Music;
  if (t.includes("cinematic") || t.includes("movie")) return Clapperboard;
  if (t.includes("art") || t.includes("illustration")) return ImageIcon;
  
  // Business & Marketing
  if (t.includes("ad") || t.includes("advertisement") || t.includes("marketing")) return Megaphone;
  if (t.includes("product") || t.includes("shop") || t.includes("store")) return ShoppingBag;
  if (t.includes("presentation") || t.includes("slide")) return Laptop;
  if (t.includes("poster") || t.includes("print")) return Printer;
  if (t.includes("blog") || t.includes("newsletter") || t.includes("article")) return FileText;
  
  // Devices & Formats
  if (t.includes("desktop") || t.includes("monitor") || t.includes("wallpaper")) return Monitor;
  if (t.includes("mobile") || t.includes("phone") || t.includes("story")) return Smartphone;
  if (t.includes("web") || t.includes("hero")) return LayoutTemplate;
  if (t.includes("profile")) return UserCircle;
  if (t.includes("video") || t.includes("film")) return Film;
  if (t.includes("vertical")) return RectangleVertical;
  
  return Frame; // Default fallback instead of null for better consistency
};

export interface AspectRatioSelectorProps {
  /** Currently selected aspect ratio */
  selectedRatio: AspectRatio;
  /** Callback when aspect ratio changes */
  onRatioChange: (ratio: AspectRatio, dimensions: { width: number; height: number }) => void;
  /** Available aspect ratios */
  ratios: readonly AspectRatioOption[];
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Hide the header label (when wrapped in CollapsibleSection) */
  hideHeader?: boolean;
  /** Model constraints for resolution tier calculation */
  constraints?: ModelConstraints;
  /** Currently selected resolution tier */
  selectedTier?: ResolutionTier;
  /** Callback when tier changes */
  onTierChange?: (tier: ResolutionTier) => void;
  /** Show resolution tier selector */
  showTierSelector?: boolean;
}

export const AspectRatioSelector = React.memo(function AspectRatioSelector({
  selectedRatio,
  onRatioChange,
  ratios,
  disabled = false,
  className,
  hideHeader = false,
  constraints,
  selectedTier,
  onTierChange,
  showTierSelector = false,
}: AspectRatioSelectorProps) {
  // Use the new hook for dimension calculations with standard resolutions
  const { getDimensionsForRatio } = useAspectRatioDimensions({
    tier: selectedTier ?? "hd",
    constraints,
    availableRatios: ratios,
  });

  // Calculate dimensions when aspect ratio or tier changes
  const handleRatioClick = React.useCallback(
    (ratio: AspectRatioOption) => {
      if (ratio.value === "custom") {
        // For custom, use the ratio's preset dimensions as a starting point
        const dims = getDimensionsForRatio("custom");
        onRatioChange(ratio.value, dims);
        return;
      }

      // Use standard dimensions from the hook
      const dimensions = getDimensionsForRatio(ratio.value);
      onRatioChange(ratio.value, dimensions);
    },
    [getDimensionsForRatio, onRatioChange]
  );

  // Handle tier change - recalculate dimensions for current ratio
  const handleTierChange = React.useCallback(
    (tier: ResolutionTier) => {
      onTierChange?.(tier);
      // Note: Dimensions will be recalculated on next render via the hook
      // The parent component (useGenerationSettings) handles the actual dimension update
    },
    [onTierChange]
  );

  const shouldShowTiers = showTierSelector && constraints && onTierChange;

    // Active selection styling - matching the emerald green from other controls
    const activeClasses = "bg-emerald-500/15 text-emerald-700 border border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-500/20"

    return (
    <div className={cn("space-y-2", className)} data-testid="aspect-ratio-selector">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Frame className="h-3.5 w-3.5 text-primary" />
            Aspect Ratio
          </Label>
          {/* Resolution tier selector in header */}
          {shouldShowTiers && selectedTier && (
            <ResolutionTierSelector
              selectedTier={selectedTier}
              onTierChange={handleTierChange}
              constraints={constraints}
              disabled={disabled}
              compact
            />
          )}
        </div>
      )}

      {/* Show inline tier selector when header is hidden */}
      {hideHeader && shouldShowTiers && selectedTier && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Resolution</span>
          <ResolutionTierSelector
            selectedTier={selectedTier}
            onTierChange={handleTierChange}
            constraints={constraints}
            disabled={disabled}
            compact
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5" data-testid="aspect-ratio-buttons">
        {ratios.map((ratio) => {
          const isSelected = selectedRatio === ratio.value;
          const isCustom = ratio.value === "custom";
          const dimensions = getDimensionsForRatio(ratio.value);
          const tags = ratio.tags ?? [];

          return (
            <Tooltip key={ratio.value}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => handleRatioClick(ratio)}
                  disabled={disabled}
                  className={cn(
                    "flex flex-col items-center justify-between h-24 py-3 px-1 transition-all",
                    isSelected && activeClasses
                  )}
                  data-testid={`ratio-${ratio.value.replace(":", "-")}`}
                >
                  {/* Visual ratio preview box - fixed container height for alignment */}
                  <div className="flex items-center justify-center h-11 w-full">
                    <div
                      className={cn(
                        "flex items-center justify-center border rounded-sm transition-colors",
                        isSelected ? "border-emerald-500/50 bg-emerald-500/30" : "border-zinc-500/40 bg-accent dark:bg-background/50"
                      )}
                      style={{
                        width: isCustom ? 32 : Math.min(32, 32 * (ratio.width / Math.max(ratio.width, ratio.height))),
                        height: isCustom ? 32 : Math.min(32, 32 * (ratio.height / Math.max(ratio.width, ratio.height))),
                      }}
                    >
                      {isCustom && (
                        <SlidersHorizontal className={cn(
                          "h-4 w-4",
                          isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                  </div>

                  {/* Label and dimensions - bottom aligned for parody of x-axis */}
                  <div className="flex flex-col items-center gap-0.5 w-full mt-auto">
                    <span className={cn(
                      "text-sm font-bold leading-none truncate w-full text-center",
                      isSelected && "text-emerald-700 dark:text-emerald-400"
                    )}>
                      {isCustom ? "Custom" : ratio.value}
                    </span>
                    {!isCustom ? (
                      <span className={cn(
                        "text-[11px] font-medium leading-none tabular-nums truncate w-full text-center",
                        isSelected ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-muted-foreground/90"
                      )}>
                        {dimensions.width}×{dimensions.height}
                      </span>
                    ) : (
                      <span className="text-[11px] text-transparent leading-none select-none">-</span>
                    )}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="p-3 min-w-[180px] bg-popover border border-border dark:border-white/15 text-popover-foreground shadow-[0_20px_60px_0px_rgba(0,0,0,0.8)] animate-in fade-in-0 zoom-in-95 duration-200"
              >
                <div className="space-y-3">
                  {/* Header: Label + Ratio */}
                  <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
                    <span className="font-semibold text-sm tracking-tight">{ratio.label}</span>
                    <span className="text-xs font-mono text-muted-foreground">{ratio.value}</span>
                  </div>

                  {/* Use Cases / Tags */}
                  {tags.length > 0 && (
                    <div className="space-y-1">
                      {tags.map((tag) => {
                        const Icon = getIconForTag(tag);
                        return (
                          <div
                            key={tag}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
                            <span>{tag}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state for Custom */}
                  {isCustom && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Set custom dimensions manually
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});
