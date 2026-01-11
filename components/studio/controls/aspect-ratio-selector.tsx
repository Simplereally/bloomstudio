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
import { Frame, SlidersHorizontal } from "lucide-react";
import * as React from "react";

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
                    isSelected && "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                  )}
                  data-testid={`ratio-${ratio.value.replace(":", "-")}`}
                >
                  {/* Visual ratio preview box - fixed container height for alignment */}
                  <div className="flex items-center justify-center h-11 w-full">
                    <div
                      className={cn(
                        "flex items-center justify-center border rounded-sm transition-colors",
                        isSelected ? "border-primary/50 bg-primary/20" : "border-zinc-500/40 bg-accent dark:bg-background/50"
                      )}
                      style={{
                        width: isCustom ? 32 : Math.min(32, 32 * (ratio.width / Math.max(ratio.width, ratio.height))),
                        height: isCustom ? 32 : Math.min(32, 32 * (ratio.height / Math.max(ratio.width, ratio.height))),
                      }}
                    >
                      {isCustom && <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Label and dimensions - bottom aligned for parody of x-axis */}
                  <div className="flex flex-col items-center gap-0.5 w-full mt-auto">
                    <span className="text-sm font-bold leading-none truncate w-full text-center">{isCustom ? "Custom" : ratio.value}</span>
                    {!isCustom ? (
                      <span className="text-[11px] text-muted-foreground/90 font-medium leading-none tabular-nums truncate w-full text-center">
                        {dimensions.width}×{dimensions.height}
                      </span>
                    ) : (
                      <span className="text-[11px] text-transparent leading-none select-none">-</span>
                    )}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{ratio.label}</p>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1 max-w-[240px]">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-background/25 text-background/90 bg-background/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : !isCustom ? (
                  <p className="text-xs opacity-70">
                    {dimensions.width} × {dimensions.height}
                  </p>
                ) : null}
                {!isCustom && selectedTier && constraints && (
                  <p className="text-xs opacity-50 mt-0.5">{RESOLUTION_TIERS[selectedTier].label} quality</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});
