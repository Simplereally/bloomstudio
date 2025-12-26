/**
 * Studio Components - Public Exports
 * 
 * Modular image generation studio components for building
 * professional-grade AI image creation interfaces.
 */

// Layout Components
export { StudioHeader, type StudioHeaderProps } from "./layout/studio-header"
export { StudioLayout, type StudioLayoutProps } from "./layout/studio-layout"

// Control Components
export { AspectRatioSelector, type AspectRatioSelectorProps } from "./controls/aspect-ratio-selector"
export { DimensionControls, type DimensionControlsProps } from "./controls/dimension-controls"
export { ModelSelector, type ModelSelectorProps } from "./controls/model-selector"
export { OptionsPanel, type GenerationOptions, type OptionsPanelProps } from "./controls/options-panel"
export { PromptSection, type PromptSectionAPI, type PromptSectionProps } from "./controls/prompt-section"
export { ReferenceImagePicker } from "./controls/reference-image-picker"
export { SeedControl, type SeedControlProps } from "./controls/seed-control"

// Canvas Components
export { ImageCanvas, type ImageCanvasProps } from "./canvas/image-canvas"
export { ImageMetadata, type ImageMetadataProps } from "./canvas/image-metadata"
export { ImageToolbar, type ImageToolbarProps } from "./canvas/image-toolbar"

// Gallery Components
export { GalleryThumbnail, type GalleryThumbnailProps } from "./gallery/gallery-thumbnail"
export { ImageGallery, type ImageGalleryProps } from "./gallery/image-gallery"
export { PersistentImageGallery } from "./gallery/persistent-image-gallery"

// Onboarding Components
export { ApiKeyOnboardingModal } from "./api-key-onboarding-modal"

