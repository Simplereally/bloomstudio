/**
 * Studio Components - Public Exports
 * 
 * Modular image generation studio components for building
 * professional-grade AI image creation interfaces.
 */

// Layout Components
export { StudioHeader, type StudioHeaderProps } from "./layout/studio-header"
export { StudioLayout, type StudioLayoutProps } from "./layout/studio-layout"
export { StudioShell, type StudioShellProps } from "./layout/studio-shell"

// Control Components
export { AspectRatioSelector, type AspectRatioSelectorProps } from "./controls/aspect-ratio-selector"
export { CollapsibleSection, type CollapsibleSectionProps } from "./controls/collapsible-section"
export { DimensionControls, type DimensionControlsProps } from "./controls/dimension-controls"
export { DimensionHeaderControls, type DimensionHeaderControlsProps } from "./controls/dimension-header-controls"
export { ModelSelector, type ModelSelectorProps } from "./controls/model-selector"
export { OptionsPanel, type GenerationOptions, type OptionsPanelProps } from "./controls/options-panel"
export { PromptHeaderControls, type PromptHeaderControlsProps } from "./controls/prompt-header-controls"
export { PromptSection, type PromptSectionAPI, type PromptSectionProps } from "./controls/prompt-section"
export { ReferenceImagePicker } from "./controls/reference-image-picker"
export { ResolutionTierSelector, type ResolutionTierSelectorProps } from "./controls/resolution-tier-selector"
export { MegapixelBudget, type MegapixelBudgetProps } from "./controls/megapixel-budget"
export { SeedControl, type SeedControlProps } from "./controls/seed-control"
export { VideoSettingsPanel, type VideoSettings, type VideoSettingsPanelProps } from "./controls/video-settings-panel"
export { VideoReferenceImagePicker, type VideoReferenceImages } from "./controls/video-reference-image-picker"
export { ReferenceImagesBrowserModal } from "./controls/reference-images-browser-modal"

// Canvas Components
export { ImageCanvas, type ImageCanvasProps } from "./canvas/image-canvas"
export { ImageMetadata, type ImageMetadataProps } from "./canvas/image-metadata"
export { ImageToolbar, type ImageToolbarProps } from "./canvas/image-toolbar"

// Gallery Components
export { GalleryThumbnail, type GalleryThumbnailProps } from "./gallery/gallery-thumbnail"
export { ImageGallery, type ImageGalleryProps } from "./gallery/image-gallery"
export { PersistentImageGallery } from "./gallery/persistent-image-gallery"
export {
    SelectionProvider,
    useSelection,
    useSelectionMode,
    useIsSelected,
    type SelectionContextValue,
    type SelectionProviderProps,
} from "./gallery/selection-context"

// Batch Components
export { BatchImageGrid, type BatchImageGridProps } from "./batch/batch-image-grid"
export { BatchModePanel, type BatchModePanelProps, type BatchModeSettings } from "./batch/batch-mode-panel"
export { BatchProgressIndicator, type BatchProgressIndicatorProps } from "./batch/batch-progress-indicator"

// Onboarding & Upgrade Components
export { ApiKeyOnboardingModal } from "./api-key-onboarding-modal"
export { UpgradeModal } from "./upgrade-modal"

// Feature Components (Hooked-Feature pattern)
export * from "./features"
