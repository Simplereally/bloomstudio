"use client";

/**
 * ControlsView - Pure presentational component for generation settings
 *
 * Renders the generation controls UI including:
 * - Model selector
 * - Aspect ratio selector
 * - Dimension controls
 * - Reference image picker
 * - Seed control
 * - Options panel (enhance, private, safe)
 * - Batch mode panel
 *
 * This is a "leaf" component - it receives all data via props and has no internal logic.
 * Wrapped in React.memo for optimal performance.
 */

import {
  AspectRatioSelector,
  BatchModePanel,
  CollapsibleSection,
  DimensionControls,
  DimensionHeaderControls,
  ModelSelector,
  OptionsPanel,
  ReferenceImagePicker,
  SeedControl,
  type GenerationOptions,
  // Video components from HEAD
  VideoSettingsPanel,
  VideoReferenceImagePicker,
  type VideoSettings,
  type VideoReferenceImages,
} from "@/components/studio";
import type { BatchModeSettings } from "@/components/studio/batch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ModelDefinition, VideoDurationConstraints } from "@/lib/config/models";
import { cn } from "@/lib/utils";
import type { AspectRatio, AspectRatioOption, ModelConstraints, ResolutionTier } from "@/types/pollinations";
import { Dice6, Frame, Image as ImageIcon, Ruler, Sparkles, X, Wand2, Video } from "lucide-react";
import Image from "next/image";
import * as React from "react";

export interface ControlsViewProps {
  // Model props
  model: string;
  onModelChange: (model: string) => void;
  models: ModelDefinition[];
  isLoadingModels?: boolean;
  isGenerating?: boolean;

  // Aspect ratio props
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio, dimensions: { width: number; height: number }) => void;
  aspectRatios: readonly AspectRatioOption[];

  // Resolution tier props
  resolutionTier?: ResolutionTier;
  onResolutionTierChange?: (tier: ResolutionTier) => void;
  constraints?: ModelConstraints;

  // Dimension props
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  dimensionsEnabled: boolean;
  dimensionsLinked: boolean;
  onDimensionsLinkedChange: (linked: boolean) => void;
  megapixels: string;
  isOverLimit: boolean;
  percentOfLimit: number;
  hasPixelLimit: boolean;

  // Reference image props
  referenceImage: string | undefined;
  onReferenceImageChange: (image: string | undefined) => void;

  // Seed props
  seed: number;
  onSeedChange: (seed: number) => void;
  seedLocked: boolean;
  onSeedLockedChange: (locked: boolean) => void;

  // Options props
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;

  // Batch mode props
  batchSettings: BatchModeSettings;
  onBatchSettingsChange: (settings: BatchModeSettings) => void;
  isBatchActive?: boolean;

  // Video-specific props (from HEAD)
  isVideoModel?: boolean
  videoSettings?: VideoSettings
  onVideoSettingsChange?: (settings: VideoSettings) => void
  videoReferenceImages?: VideoReferenceImages
  onVideoReferenceImagesChange?: (images: VideoReferenceImages) => void
  durationConstraints?: VideoDurationConstraints
  supportsAudio?: boolean
  supportsInterpolation?: boolean
}

export const ControlsView = React.memo(function ControlsView({
  // Model
  model,
  onModelChange,
  models,
  isLoadingModels = false,
  isGenerating = false,

  // Aspect ratio
  aspectRatio,
  onAspectRatioChange,
  aspectRatios,

  // Resolution tier
  resolutionTier,
  onResolutionTierChange,
  constraints,

  // Dimensions
  width,
  height,
  onWidthChange,
  onHeightChange,
  dimensionsEnabled,
  dimensionsLinked,
  onDimensionsLinkedChange,
  megapixels,
  isOverLimit,
  percentOfLimit,
  hasPixelLimit,

  // Reference image
  referenceImage,
  onReferenceImageChange,

  // Seed
  seed,
  onSeedChange,
  seedLocked,
  onSeedLockedChange,

  // Options
  options,
  onOptionsChange,

  // Batch mode
  batchSettings,
  onBatchSettingsChange,
  isBatchActive = false,

  // Video settings (from HEAD)
  isVideoModel = false,
  videoSettings,
  onVideoSettingsChange,
  videoReferenceImages,
  onVideoReferenceImagesChange,
  durationConstraints,
  supportsAudio = false,
  supportsInterpolation = false,
}: ControlsViewProps) {
  const [modelExpanded, setModelExpanded] = React.useState(true);

  // Calculate frame count for video reference display (from HEAD)
  const videoFrameCount = (videoReferenceImages?.firstFrame ? 1 : 0) + (videoReferenceImages?.lastFrame ? 1 : 0)

  const handleModelChange = React.useCallback(
    (newModel: string) => {
      onModelChange(newModel);
      setModelExpanded(false);
    },
    [onModelChange]
  );

  const selectedModelData = React.useMemo(() => models.find((m) => m.id === model), [models, model]);

  const badgeClassName =
    "flex items-center gap-1.5 px-2 h-5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20";

  return (
    <>
      {/* Model Selection */}
      <CollapsibleSection
        title="Model"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        testId="model-section"
        open={modelExpanded}
        onOpenChange={setModelExpanded}
        collapsedContent={
          <span className={cn(badgeClassName, "truncate max-w-[140px]")}>
            {selectedModelData?.logo ? (
              <Image
                src={selectedModelData.logo}
                alt=""
                width={14}
                height={14}
                className={cn(
                  "shrink-0",
                  (selectedModelData.logo.includes("openai.svg") || selectedModelData.logo.includes("flux.svg")) && "dark:invert"
                )}
              />
            ) : (
              <Wand2 className="h-3 w-3 shrink-0" />
            )}
            {selectedModelData?.displayName || model}
          </span>
        }
      >
        <ModelSelector
          selectedModel={model}
          onModelChange={handleModelChange}
          models={models}
          disabled={isGenerating || isLoadingModels}
          hideHeader
        />
        <Separator className="bg-border/50" />
      </CollapsibleSection>

      {/* Aspect Ratio */}
      <CollapsibleSection
        title="Aspect Ratio"
        icon={<Frame className="h-3.5 w-3.5" />}
        testId="aspect-ratio-section"
        collapsedContent={
          <span className={cn(badgeClassName, "tabular-nums")}>
            {aspectRatio === "custom" ? "Custom" : aspectRatio} • {width}×{height}
          </span>
        }
      >
        <AspectRatioSelector
          selectedRatio={aspectRatio}
          onRatioChange={onAspectRatioChange}
          ratios={aspectRatios}
          disabled={isGenerating}
          hideHeader
          constraints={constraints}
          selectedTier={resolutionTier}
          onTierChange={onResolutionTierChange}
          showTierSelector={!!constraints && !!onResolutionTierChange}
        />
        <Separator className="bg-border/50" />
      </CollapsibleSection>

      {/* Video Frames (video models only) - FROM HEAD */}
      {isVideoModel && videoSettings && onVideoSettingsChange && videoReferenceImages && onVideoReferenceImagesChange && (
          <CollapsibleSection
              title="Video Frames"
              icon={<Video className="h-3.5 w-3.5" />}
              testId="video-frames-section"
              collapsedContent={
                  videoFrameCount > 0 ? (
                      <span className={cn(badgeClassName, "tabular-nums")}>
                          {videoFrameCount} frame{videoFrameCount !== 1 ? "s" : ""}
                      </span>
                  ) : undefined
              }
              rightContent={
                  videoFrameCount > 0 && (
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVideoReferenceImagesChange({ firstFrame: undefined, lastFrame: undefined })}
                          className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                          <X className="h-3 w-3" />
                          Clear
                      </Button>
                  )
              }
          >
              <VideoReferenceImagePicker
                  selectedImages={videoReferenceImages}
                  onImagesChange={onVideoReferenceImagesChange}
                  supportsInterpolation={supportsInterpolation}
                  disabled={isGenerating}
                  hideHeader
              />
              <Separator className="bg-border/50" />
          </CollapsibleSection>
      )}

      {/* Video Settings (video models only) - FROM HEAD */}
      {isVideoModel && videoSettings && onVideoSettingsChange && durationConstraints && (
          <VideoSettingsPanel
              settings={videoSettings}
              onSettingsChange={onVideoSettingsChange}
              durationConstraints={durationConstraints}
              supportsAudio={supportsAudio}
              disabled={isGenerating}
          />
      )}

      {/* Dimensions - only shown in Custom mode for cleaner UX */}
      {aspectRatio === "custom" && dimensionsEnabled && (
        <CollapsibleSection
          title="Dimensions"
          icon={<Ruler className="h-3.5 w-3.5" />}
          testId="dimensions-section"
          defaultExpanded={true}
          disabled={false}
          collapsedContent={
            <div className="flex items-center gap-1.5">
              <span className={cn(badgeClassName, "tabular-nums")}>
                {width}×{height}
              </span>
              {hasPixelLimit && (
                <span
                  className={cn(
                    "flex items-center justify-center px-2 h-5 rounded-full text-xs font-bold tabular-nums border",
                    isOverLimit
                      ? "bg-destructive/15 text-destructive border-destructive/20"
                      : "bg-muted text-muted-foreground border-transparent"
                  )}
                >
                  {megapixels} ({percentOfLimit.toFixed(1)}%)
                </span>
              )}
            </div>
          }
          rightContent={
            <DimensionHeaderControls
              megapixels={megapixels}
              isOverLimit={isOverLimit}
              percentOfLimit={percentOfLimit}
              hasPixelLimit={hasPixelLimit}
              linked={dimensionsLinked}
              onLinkedChange={onDimensionsLinkedChange}
              disabled={isGenerating}
            />
          }
        >
          <DimensionControls
            width={width}
            height={height}
            onWidthChange={onWidthChange}
            onHeightChange={onHeightChange}
            modelId={model}
            disabled={isGenerating}
            hideHeader
            linked={dimensionsLinked}
            onLinkedChange={onDimensionsLinkedChange}
          />
          <Separator className="bg-border/50" />
        </CollapsibleSection>
      )}

      {/* Reference Image */}
      <CollapsibleSection
        title="Reference"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        testId="reference-image-section"
        collapsedContent={referenceImage ? <span className={badgeClassName}>1 reference</span> : undefined}
        rightContent={
          referenceImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReferenceImageChange(undefined)}
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )
        }
      >
        <ReferenceImagePicker selectedImage={referenceImage} onSelect={onReferenceImageChange} disabled={isGenerating} hideHeader />
        <Separator className="bg-border/50" />
      </CollapsibleSection>

      {/* Seed */}
      <CollapsibleSection
        title="Seed"
        icon={<Dice6 className="h-3.5 w-3.5" />}
        testId="seed-section"
        collapsedContent={<span className={cn(badgeClassName, "tabular-nums")}>{seed === -1 ? "Random" : seed}</span>}
      >
        <SeedControl
          seed={seed}
          onSeedChange={onSeedChange}
          isLocked={seedLocked}
          onLockChange={onSeedLockedChange}
          disabled={isGenerating}
          hideHeader
        />
        <Separator className="bg-border/50" />
      </CollapsibleSection>

      {/* Options */}
      <OptionsPanel options={options} onOptionsChange={onOptionsChange} disabled={isGenerating} />

      {/* Batch Mode */}
      <BatchModePanel settings={batchSettings} onSettingsChange={onBatchSettingsChange} disabled={isGenerating || isBatchActive} />
    </>
  );
});
