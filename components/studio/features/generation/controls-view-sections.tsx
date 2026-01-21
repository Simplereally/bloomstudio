"use client";

import {
  CollapsibleSection,
  DimensionControls,
  DimensionHeaderControls,
  ReferenceImagePicker,
  VideoSettingsPanel,
  VideoReferenceImagePicker,
  type VideoReferenceImages,
  type VideoSettings,
} from "@/components/studio";
import type { ModelDefinition, VideoDurationConstraints } from "@/lib/config/models";
import type { AspectRatio } from "@/types/pollinations";
import { Image as ImageIcon, Ruler, Video } from "lucide-react";
import * as React from "react";
import {
  BADGE_BASE_CLASS,
  ClearButton,
  DimensionsBadge,
  VideoFramesBadge,
  VideoSettingsBadge,
} from "./controls-view-badges";

// ─────────────────────────────────────────────────────────────────────────────
// Visibility predicate helpers (module-scope, pure)
// ─────────────────────────────────────────────────────────────────────────────

/** Count how many video reference frames are set */
export function countVideoFrames(images: VideoReferenceImages | undefined): number {
  if (!images) return 0;
  return (images.firstFrame ? 1 : 0) + (images.lastFrame ? 1 : 0);
}

/** Check if video frames section should render */
export function shouldShowVideoFrames(
  isVideoModel: boolean,
  videoReferenceImages: VideoReferenceImages | undefined,
  onVideoReferenceImagesChange: ((images: VideoReferenceImages) => void) | undefined
): boolean {
  return isVideoModel && videoReferenceImages !== undefined && onVideoReferenceImagesChange !== undefined;
}

/** Check if video settings section should render */
export function shouldShowVideoSettings(
  isVideoModel: boolean,
  videoSettings: VideoSettings | undefined,
  onVideoSettingsChange: ((settings: VideoSettings) => void) | undefined,
  durationConstraints: VideoDurationConstraints | undefined
): boolean {
  return (
    isVideoModel &&
    videoSettings !== undefined &&
    onVideoSettingsChange !== undefined &&
    durationConstraints !== undefined
  );
}

/** Check if dimensions section should render */
export function shouldShowDimensions(aspectRatio: AspectRatio, dimensionsEnabled: boolean): boolean {
  return aspectRatio === "custom" && dimensionsEnabled;
}

/** Check if reference image section should render */
export function shouldShowReferenceImage(modelData: ModelDefinition | undefined): boolean {
  return modelData?.supportsReferenceImage === true;
}

interface VideoSectionsProps {
  videoFramesProps: { images: VideoReferenceImages; onChange: (images: VideoReferenceImages) => void } | null;
  videoSettingsProps: {
    settings: VideoSettings;
    onChange: (settings: VideoSettings) => void;
    constraints: VideoDurationConstraints;
  } | null;
  videoFrameCount: number;
  supportsInterpolation: boolean;
  supportsAudio: boolean;
  isGenerating: boolean;
  onClearVideoFrames: () => void;
}

export function renderVideoSections({
  videoFramesProps,
  videoSettingsProps,
  videoFrameCount,
  supportsInterpolation,
  supportsAudio,
  isGenerating,
  onClearVideoFrames,
}: VideoSectionsProps): React.ReactNode {
  return (
    <>
      {videoFramesProps && (
        <CollapsibleSection
          title="Video Frames"
          icon={<Video className="h-3.5 w-3.5" />}
          testId="video-frames-section"
          collapsedContent={<VideoFramesBadge frameCount={videoFrameCount} />}
          rightContent={<ClearButton onClear={onClearVideoFrames} show={videoFrameCount > 0} />}
        >
          <VideoReferenceImagePicker
            selectedImages={videoFramesProps.images}
            onImagesChange={videoFramesProps.onChange}
            supportsInterpolation={supportsInterpolation}
            disabled={isGenerating}
            hideHeader
          />
        </CollapsibleSection>
      )}

      {videoSettingsProps && (
        <CollapsibleSection
          title="Video Settings"
          icon={<Video className="h-3.5 w-3.5" />}
          testId="video-settings-section"
          collapsedContent={<VideoSettingsBadge settings={videoSettingsProps.settings} supportsAudio={supportsAudio} />}
        >
          <VideoSettingsPanel
            settings={videoSettingsProps.settings}
            onSettingsChange={videoSettingsProps.onChange}
            durationConstraints={videoSettingsProps.constraints}
            supportsAudio={supportsAudio}
            disabled={isGenerating}
          />
        </CollapsibleSection>
      )}
    </>
  );
}

interface DimensionsSectionProps {
  showDimensions: boolean;
  width: number;
  height: number;
  megapixels: string;
  isOverLimit: boolean;
  percentOfLimit: number;
  hasPixelLimit: boolean;
  dimensionsLinked: boolean;
  isGenerating: boolean;
  model: string;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onDimensionsLinkedChange: (linked: boolean) => void;
}

export function renderDimensionsSection({
  showDimensions,
  width,
  height,
  megapixels,
  isOverLimit,
  percentOfLimit,
  hasPixelLimit,
  dimensionsLinked,
  isGenerating,
  model,
  onWidthChange,
  onHeightChange,
  onDimensionsLinkedChange,
}: DimensionsSectionProps): React.ReactNode {
  if (!showDimensions) return null;

  return (
    <CollapsibleSection
      title="Dimensions"
      icon={<Ruler className="h-3.5 w-3.5" />}
      testId="dimensions-section"
      defaultExpanded={true}
      disabled={false}
      collapsedContent={
        <DimensionsBadge
          width={width}
          height={height}
          megapixels={megapixels}
          isOverLimit={isOverLimit}
          percentOfLimit={percentOfLimit}
          hasPixelLimit={hasPixelLimit}
        />
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
    </CollapsibleSection>
  );
}

interface ReferenceImageSectionProps {
  showReferenceImage: boolean;
  referenceImage: string | undefined;
  isGenerating: boolean;
  onReferenceImageChange: (image: string | undefined) => void;
  onClearReferenceImage: () => void;
}

export function renderReferenceImageSection({
  showReferenceImage,
  referenceImage,
  isGenerating,
  onReferenceImageChange,
  onClearReferenceImage,
}: ReferenceImageSectionProps): React.ReactNode {
  if (!showReferenceImage) return null;

  return (
    <CollapsibleSection
      title="Reference"
      icon={<ImageIcon className="h-3.5 w-3.5" />}
      testId="reference-image-section"
      collapsedContent={referenceImage ? <span className={BADGE_BASE_CLASS}>1 reference</span> : undefined}
      rightContent={<ClearButton onClear={onClearReferenceImage} show={!!referenceImage} />}
    >
      <ReferenceImagePicker
        selectedImage={referenceImage}
        onSelect={onReferenceImageChange}
        disabled={isGenerating}
        hideHeader
      />
    </CollapsibleSection>
  );
}
