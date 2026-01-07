"use client"

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
    VideoSettingsPanel,
    VideoReferenceImagePicker,
    type GenerationOptions,
    type VideoSettings,
    type VideoReferenceImages,
} from "@/components/studio"
import type { BatchModeSettings } from "@/components/studio/batch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ModelDefinition, VideoDurationConstraints } from "@/lib/config/models"
import type { AspectRatio, AspectRatioOption } from "@/types/pollinations"
import { Dice6, Frame, Image as ImageIcon, Ruler, Sparkles, Video, X } from "lucide-react"
import * as React from "react"

export interface ControlsViewProps {
    // Model props
    model: string
    onModelChange: (model: string) => void
    models: ModelDefinition[]
    isLoadingModels?: boolean
    isGenerating?: boolean

    // Aspect ratio props
    aspectRatio: AspectRatio
    onAspectRatioChange: (ratio: AspectRatio, dimensions: { width: number; height: number }) => void
    aspectRatios: readonly AspectRatioOption[]

    // Dimension props
    width: number
    height: number
    onWidthChange: (width: number) => void
    onHeightChange: (height: number) => void
    dimensionsEnabled: boolean
    dimensionsLinked: boolean
    onDimensionsLinkedChange: (linked: boolean) => void
    megapixels: string
    isOverLimit: boolean
    percentOfLimit: number
    hasPixelLimit: boolean

    // Reference image props
    referenceImage: string | undefined
    onReferenceImageChange: (image: string | undefined) => void

    // Seed props
    seed: number
    onSeedChange: (seed: number) => void
    seedLocked: boolean
    onSeedLockedChange: (locked: boolean) => void

    // Options props
    options: GenerationOptions
    onOptionsChange: (options: GenerationOptions) => void

    // Batch mode props
    batchSettings: BatchModeSettings
    onBatchSettingsChange: (settings: BatchModeSettings) => void
    isBatchActive?: boolean

    // Video-specific props
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

    // Video settings
    isVideoModel = false,
    videoSettings,
    onVideoSettingsChange,
    videoReferenceImages,
    onVideoReferenceImagesChange,
    durationConstraints,
    supportsAudio = false,
    supportsInterpolation = false,
}: ControlsViewProps) {
    // Calculate frame count for video reference display
    const videoFrameCount = (videoReferenceImages?.firstFrame ? 1 : 0) + (videoReferenceImages?.lastFrame ? 1 : 0)

    return (
        <>
            {/* Model Selection */}
            <CollapsibleSection
                title="Model"
                icon={<Sparkles className="h-3.5 w-3.5" />}
                testId="model-section"
                collapsedContent={
                    <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary truncate max-w-[140px]">
                        {models.find(m => m.id === model)?.displayName || model}
                    </span>
                }
            >
                <ModelSelector
                    selectedModel={model}
                    onModelChange={onModelChange}
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
                    <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        {aspectRatio === "custom" ? "Custom" : aspectRatio}
                    </span>
                }
            >
                <AspectRatioSelector
                    selectedRatio={aspectRatio}
                    onRatioChange={onAspectRatioChange}
                    ratios={aspectRatios}
                    disabled={isGenerating}
                    hideHeader
                />
                <Separator className="bg-border/50" />
            </CollapsibleSection>

            {/* Dimensions */}
            <CollapsibleSection
                title="Dimensions"
                icon={<Ruler className="h-3.5 w-3.5" />}
                testId="dimensions-section"
                disabled={!dimensionsEnabled}
                collapsedContent={
                    dimensionsEnabled ? (
                        <div className="flex items-center gap-1.5">
                            <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary tabular-nums">
                                {width}×{height}
                            </span>
                            {hasPixelLimit && (
                                <span className={`flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium tabular-nums ${isOverLimit
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {megapixels} ({percentOfLimit.toFixed(1)}%)
                                </span>
                            )}
                        </div>
                    ) : undefined
                }
                rightContent={
                    dimensionsEnabled ? (
                        <DimensionHeaderControls
                            megapixels={megapixels}
                            isOverLimit={isOverLimit}
                            percentOfLimit={percentOfLimit}
                            hasPixelLimit={hasPixelLimit}
                            linked={dimensionsLinked}
                            onLinkedChange={onDimensionsLinkedChange}
                            disabled={isGenerating}
                        />
                    ) : undefined
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

            {/* Reference Image */}
            <CollapsibleSection
                title="Reference"
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                testId="reference-image-section"
                collapsedContent={
                    referenceImage ? (
                        <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                            1 reference
                        </span>
                    ) : undefined
                }
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
                <ReferenceImagePicker
                    selectedImage={referenceImage}
                    onSelect={onReferenceImageChange}
                    disabled={isGenerating}
                    hideHeader
                />
                <Separator className="bg-border/50" />
            </CollapsibleSection>

            {/* Video Frames (video models only) */}
            {isVideoModel && videoSettings && onVideoSettingsChange && videoReferenceImages && onVideoReferenceImagesChange && (
                <CollapsibleSection
                    title="Video Frames"
                    icon={<Video className="h-3.5 w-3.5" />}
                    testId="video-frames-section"
                    collapsedContent={
                        videoFrameCount > 0 ? (
                            <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary">
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

            {/* Seed */}
            <CollapsibleSection
                title="Seed"
                icon={<Dice6 className="h-3.5 w-3.5" />}
                testId="seed-section"
                collapsedContent={
                    <span className="flex items-center justify-center px-2 h-5 rounded-full text-xs font-medium bg-primary/15 text-primary tabular-nums">
                        {seed === -1 ? "Random" : seed}
                    </span>
                }
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
            <OptionsPanel
                options={options}
                onOptionsChange={onOptionsChange}
                disabled={isGenerating}
            />

            {/* Video Settings (video models only) */}
            {isVideoModel && videoSettings && onVideoSettingsChange && durationConstraints && (
                <VideoSettingsPanel
                    settings={videoSettings}
                    onSettingsChange={onVideoSettingsChange}
                    durationConstraints={durationConstraints}
                    supportsAudio={supportsAudio}
                    disabled={isGenerating}
                />
            )}

            {/* Batch Mode */}
            <BatchModePanel
                settings={batchSettings}
                onSettingsChange={onBatchSettingsChange}
                disabled={isGenerating || isBatchActive}
            />
        </>
    )
})
