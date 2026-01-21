"use client";

/**
 * Badge sub-components for ControlsView collapsed content
 * Extracted to reduce file size and improve maintainability.
 */

import { Button } from "@/components/ui/button";
import type { ModelDefinition } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import type { GenerationOptions, VideoSettings } from "@/components/studio";
import { Wand2, X, Volume2 } from "lucide-react";
import Image from "next/image";
import type * as React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────

export const BADGE_BASE_CLASS =
  "flex items-center gap-1.5 px-2 h-[21px] rounded-none text-xs font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20";

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions
// ─────────────────────────────────────────────────────────────────────────────

/** Determines if the logo needs dark-mode inversion */
export function shouldInvertLogo(logo: string): boolean {
  return logo.includes("openai.svg") || logo.includes("flux.svg");
}

/** Compute badge text for seed display */
export function seedBadgeText(seed: number): string {
  return seed === -1 ? "Random" : String(seed);
}

/** Count active options */
export function countActiveOptions(options: GenerationOptions): number {
  return Object.values(options).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ModelBadgeProps {
  modelData: ModelDefinition | undefined;
  modelId: string;
}

/** Renders the collapsed badge for the Model section */
export function ModelBadge({ modelData, modelId }: ModelBadgeProps): React.ReactElement {
  const hasLogo = !!modelData?.logo;
  return (
    <span className={cn(BADGE_BASE_CLASS, "truncate max-w-[140px]")}>
      {hasLogo ? (
        <Image
          src={modelData.logo}
          alt=""
          width={14}
          height={14}
          className={cn("shrink-0", shouldInvertLogo(modelData.logo) && "dark:invert")}
        />
      ) : (
        <Wand2 className="h-3 w-3 shrink-0" />
      )}
      {modelData?.displayName ?? modelId}
    </span>
  );
}

interface VideoFramesBadgeProps {
  frameCount: number;
}

/** Renders the collapsed badge for Video Frames section */
export function VideoFramesBadge({ frameCount }: VideoFramesBadgeProps): React.ReactElement | null {
  if (frameCount === 0) return null;
  const plural = frameCount !== 1 ? "s" : "";
  return (
    <span className={cn(BADGE_BASE_CLASS, "tabular-nums")}>
      {frameCount} frame{plural}
    </span>
  );
}

interface VideoSettingsBadgeProps {
  settings: VideoSettings;
  supportsAudio: boolean;
}

/** Renders the collapsed badge for Video Settings section */
export function VideoSettingsBadge({ settings, supportsAudio }: VideoSettingsBadgeProps): React.ReactElement {
  const showAudioIcon = supportsAudio && settings.audio;
  return (
    <span className={cn(BADGE_BASE_CLASS, "tabular-nums")}>
      {settings.duration}s
      {showAudioIcon && <Volume2 className="h-3 w-3" />}
    </span>
  );
}

interface DimensionsBadgeProps {
  width: number;
  height: number;
  megapixels: string;
  isOverLimit: boolean;
  percentOfLimit: number;
  hasPixelLimit: boolean;
}

/** Renders the collapsed badge for Dimensions section */
export function DimensionsBadge({
  width,
  height,
  megapixels,
  isOverLimit,
  percentOfLimit,
  hasPixelLimit,
}: DimensionsBadgeProps): React.ReactElement {
  const limitBadgeClass = isOverLimit
    ? "bg-destructive/15 text-destructive border-destructive/20"
    : "bg-muted text-muted-foreground border-transparent";

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(BADGE_BASE_CLASS, "tabular-nums")}>
        {width}×{height}
      </span>
      {hasPixelLimit && (
        <span
          className={cn(
            "flex items-center justify-center px-2 h-[21px] rounded-none text-xs font-bold tabular-nums border",
            limitBadgeClass
          )}
        >
          {megapixels} ({percentOfLimit.toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

interface OptionsBadgeProps {
  activeCount: number;
}

/** Renders the collapsed badge for Options section */
export function OptionsBadge({ activeCount }: OptionsBadgeProps): React.ReactElement | null {
  if (activeCount === 0) return null;
  return (
    <span className={cn(BADGE_BASE_CLASS, "tabular-nums")}>
      {activeCount} active
    </span>
  );
}

interface BatchModeBadgeProps {
  enabled: boolean;
  count: number;
}

/** Renders the collapsed badge for Batch Mode section */
export function BatchModeBadge({ enabled, count }: BatchModeBadgeProps): React.ReactElement | null {
  if (!enabled) return null;
  return (
    <span className={cn(BADGE_BASE_CLASS, "tabular-nums")}>
      {count} images
    </span>
  );
}

interface ClearButtonProps {
  onClear: () => void;
  show: boolean;
}

/** Renders a clear button for sections with clearable content */
export function ClearButton({ onClear, show }: ClearButtonProps): React.ReactElement | null {
  if (!show) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClear}
      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
    >
      <X className="h-3 w-3" />
      Clear
    </Button>
  );
}
